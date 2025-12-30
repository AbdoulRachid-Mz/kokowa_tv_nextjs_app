// app/ad/sub-groups/[subGroupId]/matches/[matchId]/page.tsx
"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
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
import { FighterControl } from "./fighter-control";
import { MatchControls } from "./match-controls";
import { MatchTimer } from "./match-timer";
import { AudienceCounter } from "./audience-counter";
import { MediaManager } from "./media-manager";
import { FighterDrawer } from "./fighter-drawer";
import { MatchState, useMatchState } from "./match-state";

export default function MatchDetailPage() {
  const { subGroupId, matchId } = useParams();
  const router = useRouter();

  const [match, setMatch] = useState<Match | null>(null);
  const [subGroup, setSubGroup] = useState<SubGroup | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [availableFighters, setAvailableFighters] = useState<{
    region1: Fighter[];
    region2: Fighter[];
  }>({ region1: [], region2: [] });
  
  const [selectedFighter, setSelectedFighter] = useState<Fighter | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const { isConnected, subscribeToMatch } = useRealtime();
  
  // Utiliser le state global du match
  const matchState = useMatchState();

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
          
          // Initialiser le state global
          matchState.initialize({
            time: currentMatch.total_duration
              ? parseDurationToSeconds(currentMatch.total_duration)
              : 0,
            breakCount: currentMatch.break_count || 0,
            isRunning: currentMatch.status === "live",
            status: currentMatch.status,
            audienceCount: currentMatch.audience_count || 0
          });

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

  // Charger les lutteurs disponibles
  const loadAvailableFighters = useCallback(async () => {
    if (!subGroup || !subGroup.group?.phase?.edition?.id) return;

    try {
      // Utiliser l'API directement au lieu d'appeler l'action serveur
      const fightersResponse = await api.get(`/api/editions/${subGroup.group.phase.edition.id}/fighters`, {
        params: {
          limit: 100,
          with_fighter: true,
          with_region: true
        }
      });

      if (fightersResponse && Array.isArray(fightersResponse)) {
        const fighters = fightersResponse.map((item: any) => item.fighter).filter(Boolean);
        
        // Filtrer par région
        const region1Fighters = subGroup.region1_id 
          ? fighters.filter((f: Fighter) => f.region_id === subGroup.region1_id)
          : [];
        
        const region2Fighters = subGroup.region2_id 
          ? fighters.filter((f: Fighter) => f.region_id === subGroup.region2_id)
          : [];

        setAvailableFighters({
          region1: region1Fighters,
          region2: region2Fighters
        });
      }
    } catch (error) {
      console.error("Erreur chargement lutteurs:", error);
    }
  }, [subGroup]);

  useEffect(() => {
    if (subGroup) {
      loadAvailableFighters();
    }
  }, [subGroup, loadAvailableFighters]);

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

    try {
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
      const formData = new FormData();
      Object.entries(updates).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, String(value));
        }
      });

      await api.put(`/api/matches/${match.id}`, formData);
      toast.success("Match mis à jour");
      
      // Mettre à jour le state global si nécessaire
      if (updates.status) {
        matchState.setStatus(updates.status);
        matchState.setIsRunning(updates.status === "live");
      }
      
      if (updates.break_count !== undefined) {
        matchState.setBreakCount(updates.break_count);
      }
      
      if (updates.audience_count !== undefined) {
        matchState.setAudienceCount(updates.audience_count);
      }
      
      // Réinitialiser les données si le statut change
      if (updates.status && ['live', 'scheduled', 'round_break'].includes(updates.status)) {
        if (match.winner_fighter_id || match.loser_fighter_id) {
          // Réinitialiser les désignations
          await api.put(`/api/matches/${match.id}`, {
            winner_fighter_id: null,
            loser_fighter_id: null,
            match_result: null
          });
        }
      }
    } catch (error) {
      console.error("Erreur mise à jour match:", error);
      toast.error("Erreur lors de la mise à jour");
      // Recharger les données originales
      loadSubGroupData();
    }
  };

  // Gérer le temps de match via le state global
  const handleTimeUpdate = useCallback(
    (seconds: number) => {
      matchState.setTime(seconds);
      
      // Sauvegarder périodiquement (toutes les 60 secondes)
      if (seconds > 0 && seconds % 60 === 0) {
        updateMatch({ total_duration: formatSecondsToDuration(seconds) });
      }
    },
    [match]
  );

  // Gérer l'ajout d'une pause
  const handleAddBreak = () => {
    const newBreakCount = matchState.breakCount + 1;
    matchState.setBreakCount(newBreakCount);
    matchState.setIsRunning(false);
    matchState.setStatus('round_break');
    
    updateMatch({
      break_count: newBreakCount,
      status: 'round_break',
    });

    toast.success(`Pause #${newBreakCount} ajoutée`);

    // Auto-reprise après 30 secondes
    setTimeout(() => {
      if (match?.status === 'round_break') {
        matchState.setStatus('live');
        matchState.setIsRunning(true);
        updateMatch({ status: 'live' });
        toast.info("Reprise du match");
      }
    }, 30000);
  };

  // Gérer le démarrage/arrêt du timer
  const handleTimerToggle = (running: boolean) => {
    matchState.setIsRunning(running);
    
    const updates: Partial<Match> = {
      status: running ? 'live' : 'round_break',
    };
    
    if (running && !match?.start_time) {
      updates.start_time = new Date().toTimeString().slice(0, 8);
    }
    
    if (!running && match?.status === 'live') {
      updates.status = 'round_break';
    }
    
    updateMatch(updates);
  };

  // Gérer le clic sur un lutteur
  const handleFighterClick = (fighter: Fighter) => {
    setSelectedFighter(fighter);
    setDrawerOpen(true);
  };

  // Gérer les actions dans le drawer
  const handleFighterAction = async (action: string, fighterId: number, data?: any) => {
    if (!match) return;

    try {
      switch (action) {
        case 'assign_winner':
          const updates: Partial<Match> = {
            winner_fighter_id: fighterId,
            status: 'completed',
            end_time: new Date().toTimeString().slice(0, 8)
          };
          
          // Définir le perdant
          if (fighterId === match.fighter1_id && match.fighter2_id) {
            updates.loser_fighter_id = match.fighter2_id;
            updates.match_result = 'fighter1_win';
          } else if (fighterId === match.fighter2_id && match.fighter1_id) {
            updates.loser_fighter_id = match.fighter1_id;
            updates.match_result = 'fighter2_win';
          }
          
          await updateMatch(updates);
          toast.success("Vainqueur désigné");
          break;
          
        case 'add_card':
          const cardFormData = new FormData();
          cardFormData.append('match_id', match.id.toString());
          cardFormData.append('fighter_id', fighterId.toString());
          cardFormData.append('card_type', data.cardType);
          cardFormData.append('minute_given', `${data.minute}:00`);
          cardFormData.append('card_reason', data.reason || 'Faute non spécifiée');
          
          await api.post('/api/fighter-cards', cardFormData);
          toast.success(`Carton ${data.cardType === 'yellow' ? 'jaune' : 'rouge'} ajouté`);
          break;
          
        case 'remove_fighter':
          const fighterUpdates: Partial<Match> = {};
          if (fighterId === match.fighter1_id) {
            fighterUpdates.fighter1_id = undefined;
            if (match.winner_fighter_id === fighterId) {
              fighterUpdates.winner_fighter_id = undefined;
              fighterUpdates.match_result = undefined;
            }
            if (match.loser_fighter_id === fighterId) {
              fighterUpdates.loser_fighter_id = undefined;
            }
          } else if (fighterId === match.fighter2_id) {
            fighterUpdates.fighter2_id = undefined;
            if (match.winner_fighter_id === fighterId) {
              fighterUpdates.winner_fighter_id = undefined;
              fighterUpdates.match_result = undefined;
            }
            if (match.loser_fighter_id === fighterId) {
              fighterUpdates.loser_fighter_id = undefined;
            }
          }
          await updateMatch(fighterUpdates);
          toast.success("Lutteur retiré");
          break;
      }
      
      // Fermer le drawer
      setDrawerOpen(false);
      setSelectedFighter(null);
      
      // Recharger les données
      loadSubGroupData();
      
    } catch (error) {
      console.error("Erreur action lutteur:", error);
      toast.error("Erreur lors de l'action");
    }
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
              availableFighters={availableFighters.region1}
              onFighterClick={handleFighterClick}
            />

            <FighterControl
              fighter={match.fighter2}
              fighterType="fighter2"
              match={match}
              subGroup={subGroup}
              onUpdateMatch={updateMatch}
              availableFighters={availableFighters.region2}
              onFighterClick={handleFighterClick}
            />
          </div>

          {/* Contrôles du match */}
          <MatchControls
            match={match}
            onUpdateMatch={updateMatch}
            onAddBreak={handleAddBreak}
            isTimerRunning={matchState.isRunning}
            onTimerToggle={handleTimerToggle}
            isSaving={matchState.isRunning}
          />
        </div>

        {/* Colonne droite - Timer et infos */}
        <div className="space-y-6">
          {/* Timer */}
          <MatchTimer
            match={match}
            initialTime={matchState.time}
            breakCount={matchState.breakCount}
            isRunning={matchState.isRunning}
            onTimeUpdate={handleTimeUpdate}
            onStatusChange={(status) => updateMatch({ status })}
            onBreakCountChange={matchState.setBreakCount}
            onTimerToggle={handleTimerToggle}
          />

          {/* Compteur de spectateurs */}
          <AudienceCounter
            audienceCount={matchState.audienceCount}
            onUpdate={(count) => {
              matchState.setAudienceCount(count);
              updateMatch({ audience_count: count });
            }}
          />

          {/* Gestion des médias */}
          <MediaManager
            videoUrl={match.video_url}
            liveStreamUrl={match.live_stream_url}
            onUpdate={(updates) => updateMatch(updates)}
            isSaving={matchState.isRunning}
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

      {/* Drawer pour les actions du lutteur */}
      {selectedFighter && (
        <FighterDrawer
          fighter={selectedFighter}
          match={match}
          open={drawerOpen}
          onOpenChange={setDrawerOpen}
          onAction={handleFighterAction}
          currentTime={matchState.time}
        />
      )}
    </div>
  );
}

// Helper functions
function parseDurationToSeconds(duration?: string): number {
  if (!duration) return 0;
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