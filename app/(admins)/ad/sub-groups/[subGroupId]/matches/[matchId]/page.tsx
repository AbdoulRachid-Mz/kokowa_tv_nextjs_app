// app/ad/sub-groups/[subGroupId]/matches/[matchId]/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Typography } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { Match, Fighter, SubGroup } from "@/types";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Trophy,
  Pause,
  Play,
  Save,
  RefreshCw,
  Users,
  Timer,
  Square,
  AlertCircle,
  Video,
  Eye,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useRealtime } from "@/hooks/use-realtime";
import { toast } from "sonner";
import { CardsManager } from "./cards-manager";
import { FighterControl } from "./fighter-control";
import { MatchControls } from "./match-controls";
import { MatchTimer } from "./match-timer";
import { AudienceCounter } from "./audience-counter";
import { MediaManager } from "./media-manager";

export default function MatchDetailPage() {
  const { subGroupId, matchId } = useParams();
  const router = useRouter();

  const [match, setMatch] = useState<Match | null>(null);
  const [subGroup, setSubGroup] = useState<SubGroup | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [matchTime, setMatchTime] = useState(0); // en secondes
  const [breakCount, setBreakCount] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  console.log(subGroup);

  const { isConnected, subscribeToMatch } = useRealtime();

  // Charger le sous-groupe avec tous les matches et relations
  const loadSubGroupData = async () => {
    try {
      setLoading(true);

      // Charger le sous-groupe avec toutes les relations
      const subGroupResponse = await api.get(`/api/sub-groups/${subGroupId}`);
      const subGroupData = subGroupResponse as SubGroup;

      if (subGroupData) {
        setSubGroup(subGroupData);

        // Trouver le match spécifique dans les matches du sous-groupe
        const matches = subGroupData.matches || [];
        const currentMatch = matches.find(
          (m) => m.id === parseInt(matchId as string)
        );

        if (currentMatch) {
          setMatch(currentMatch);
          setMatchTime(
            currentMatch.total_duration
              ? parseDurationToSeconds(currentMatch.total_duration)
              : 0
          );
          setBreakCount(currentMatch.break_count || 0);
          setIsTimerRunning(currentMatch.status === "live");

          // Trouver l'index du match actuel
          const index = matches.findIndex(
            (m) => m.id === parseInt(matchId as string)
          );
          setCurrentIndex(index >= 0 ? index : 0);
        } else {
          toast.error("Match non trouvé dans ce sous-groupe");
          router.push(`/ad/sub-groups/${subGroupId}/organisation`);
        }
      }

      // S'abonner aux mises à jour temps réel
      subscribeToMatch(parseInt(matchId as string));
    } catch (error) {
      console.error("Erreur chargement données:", error);
      toast.error("Erreur lors du chargement des données");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (subGroupId && matchId) {
      loadSubGroupData();
    }
  }, [subGroupId, matchId]);

  // Navigation entre matches
  const navigateToMatch = (direction: "prev" | "next") => {
    if (!subGroup || !subGroup.matches) return;

    const newIndex = direction === "prev" ? currentIndex - 1 : currentIndex + 1;

    if (newIndex >= 0 && newIndex < subGroup.matches.length) {
      const nextMatch = subGroup.matches[newIndex];
      router.push(`/ad/sub-groups/${subGroupId}/matches/${nextMatch.id}`);
    }
  };

  // Mettre à jour le match
  const updateMatch = async (updates: Partial<Match>) => {
    if (!match) return;

    // Mise à jour locale immédiate
    const updatedMatch = { ...match, ...updates };
    setMatch(updatedMatch);

    // Mettre à jour aussi dans la liste du sous-groupe
    if (subGroup && subGroup.matches) {
      const updatedMatches = subGroup.matches.map((m) =>
        m.id === match.id ? updatedMatch : m
      );
      setSubGroup({ ...subGroup, matches: updatedMatches });
    }

    // Synchronisation avec la base de données
    try {
      setIsSaving(true);

      const formData = new FormData();
      Object.entries(updates).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, String(value));
        }
      });

      await api.put(`/api/matches/${match.id}`, formData);
      toast.success("Match mis à jour");
    } catch (error) {
      console.error("Erreur mise à jour match:", error);
      toast.error("Erreur lors de la mise à jour");
      // Recharger les données originales
      loadSubGroupData();
    } finally {
      setIsSaving(false);
    }
  };

  // Gérer le temps de match
  const handleTimeUpdate = useCallback(
    (seconds: number) => {
      setMatchTime(seconds);

      // Mettre à jour périodiquement en base (toutes les 30 secondes ou à la fin)
      if (seconds % 30 === 0 || match?.status === "completed") {
        updateMatch({ total_duration: formatSecondsToDuration(seconds) });
      }
    },
    [match]
  );

  // Ajouter une pause
  const handleAddBreak = () => {
    const newBreakCount = breakCount + 1;
    setBreakCount(newBreakCount);
    updateMatch({
      break_count: newBreakCount,
      status: "round_break",
    });

    toast.success(`Pause #${newBreakCount} ajoutée`);

    // Auto-reprise après 30 secondes
    setTimeout(() => {
      if (match?.status === "round_break") {
        updateMatch({ status: "live" });
        toast.info("Reprise du match");
      }
    }, 30000);
  };

  // Gérer le démarrage/arrêt du timer
  const handleTimerToggle = (running: boolean) => {
    setIsTimerRunning(running);
    updateMatch({
      status: running ? "live" : "round_break",
      ...(running &&
        !match?.start_time && {
          start_time: new Date().toTimeString().slice(0, 8),
        }),
    });
  };

  // Récupérer les lutteurs disponibles pour la région
  const getAvailableFightersForRegion = (regionId?: number): Fighter[] => {
    if (!subGroup || !regionId || !subGroup.group?.phase?.edition?.regions)
      return [];

    const fighters = subGroup.group?.phase?.edition?.fighters?.find(
      (r: any) => r.id === regionId
    );
    return Array.isArray(fighters) ? fighters : [];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <Typography variant="h4">Chargement du match...</Typography>
        </div>
      </div>
    );
  }

  if (!match || !subGroup) {
    return (
      <div className="text-center py-20">
        <Typography variant="h3" className="mb-4">
          Match non trouvé
        </Typography>
        <Button
          onClick={() =>
            router.push(`/ad/sub-groups/${subGroupId}/organisation`)
          }
        >
          ← Retour à l'organisation
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* En-tête de navigation */}
      <div className="max-w-7xl mx-auto mb-2">
        <div className="flex items-center justify-between mb-2">
          <Button
            variant="ghost"
            onClick={() =>
              router.push(`/ad/sub-groups/${subGroupId}/organisation`)
            }
            className="gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Retour à l'organisation
          </Button>

          <div className="flex items-center gap-2">
            <div
              className={`w-3 h-3 rounded-full ${
                isConnected ? "bg-green-500" : "bg-red-500"
              }`}
            />
            <Badge variant={isConnected ? "default" : "outline"}>
              {isConnected ? "Temps réel actif" : "Hors ligne"}
            </Badge>
          </div>
        </div>

        {/* Navigation entre matches */}
        <div className="flex items-center justify-between bg-card p-2 rounded-lg border shadow-sm">
          <Button
            variant="outline"
            onClick={() => navigateToMatch("prev")}
            disabled={currentIndex === 0}
            className="gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Match précédent
          </Button>

          <div className="text-center">
            <Typography variant="h4" weight="bold" className="mb-1">
              Match #{match.match_number}
            </Typography>
            <div className="flex items-center justify-center gap-3">
              <Badge
                variant={match.status === "live" ? "destructive" : "secondary"}
              >
                {match.status === "live" ? "EN DIRECT" : match.status}
              </Badge>
              <Typography variant="body-sm" theme="muted">
                {currentIndex + 1} sur {subGroup.matches?.length || 0} matches
              </Typography>
            </div>
          </div>

          <Button
            variant="outline"
            onClick={() => navigateToMatch("next")}
            disabled={currentIndex === (subGroup.matches?.length || 0) - 1}
            className="gap-2"
          >
            Match suivant
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Colonne gauche - Lutteurs */}
        <div className="lg:col-span-2 space-y-4">
          {/* Lutteurs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FighterControl
              fighter={match.fighter1}
              fighterType="fighter1"
              match={match}
              subGroup={subGroup}
              onUpdateMatch={updateMatch}
              isSaving={isSaving}
              availableFighters={getAvailableFightersForRegion(
                subGroup.region1_id
              )}
            />

            <FighterControl
              fighter={match.fighter2}
              fighterType="fighter2"
              match={match}
              subGroup={subGroup}
              onUpdateMatch={updateMatch}
              isSaving={isSaving}
              availableFighters={getAvailableFightersForRegion(
                subGroup.region2_id
              )}
            />
          </div>

          {/* Contrôles du match */}
          <MatchControls
            match={match}
            onUpdateMatch={updateMatch}
            onAddBreak={handleAddBreak}
            isSaving={isSaving}
            isTimerRunning={isTimerRunning}
            onTimerToggle={handleTimerToggle}
          />

                    {/* Gestion des cartons */}
          <CardsManager
            match={match}
            onUpdateMatch={updateMatch}
            currentTime={matchTime}
          />
        </div>

        {/* Colonne droite - Timer et infos */}
        <div className="space-y-6">
          {/* Timer */}
          <MatchTimer
            match={match}
            initialTime={matchTime}
            breakCount={breakCount}
            isRunning={isTimerRunning}
            onTimeUpdate={handleTimeUpdate}
            onStatusChange={(status) => updateMatch({ status })}
            onBreakCountChange={setBreakCount}
            onTimerToggle={handleTimerToggle}
          />

          {/* Compteur de spectateurs */}
          <AudienceCounter
            audienceCount={match.audience_count || 0}
            onUpdate={(count) => updateMatch({ audience_count: count })}
            isSaving={isSaving}
          />

          {/* Gestion des médias */}
          <MediaManager
            videoUrl={match.video_url}
            liveStreamUrl={match.live_stream_url}
            onUpdate={(updates) => updateMatch(updates)}
            isSaving={isSaving}
          />

          {/* Infos du match */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Informations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Typography variant="body-sm" weight="medium" theme="muted">
                  Sous-groupe
                </Typography>
                <Typography>{subGroup.name || "Non défini"}</Typography>
              </div>

              <div className="space-y-2">
                <Typography variant="body-sm" weight="medium" theme="muted">
                  Date et heure
                </Typography>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <Typography>
                    {new Date(match.match_date).toLocaleDateString("fr-FR")}
                    {match.start_time && ` à ${match.start_time.slice(0, 5)}`}
                  </Typography>
                </div>
              </div>

              {match.notes && (
                <div className="space-y-2">
                  <Typography variant="body-sm" weight="medium" theme="muted">
                    Notes
                  </Typography>
                  <Typography variant="body-sm" className="italic">
                    {match.notes}
                  </Typography>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Helper functions
function parseDurationToSeconds(duration?: string): number {
  if (!duration) return 0;
  // Convertir "HH:MM:SS" en secondes
  const parts = duration.split(":").map(Number);
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  return 0;
}

function formatSecondsToDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}
