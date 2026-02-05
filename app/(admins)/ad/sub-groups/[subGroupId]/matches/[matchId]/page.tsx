// app/ad/sub-groups/[subGroupId]/matches/[matchId]/page.tsx - VERSION CORRIGÉE
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Typography } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { Match, Fighter, SubGroup } from "@/types";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Trophy,
  RefreshCw,
  Users,
  Equal,
  AlertTriangle,
  Home,
} from "lucide-react";
import { useRealtime } from "@/hooks/use-realtime";
import { toast } from "sonner";
import { FighterControl } from "./fighter-control";
import { MatchTimer } from "./match-timer";
import { AudienceCounter } from "./audience-counter";
import { MediaManager } from "./media-manager";
import { CardsManager } from "./cards-manager";
import { useMatchState } from "./match-state";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { MatchControls } from "./match-controls";

export default function MatchDetailPage() {
  const { subGroupId, matchId } = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [match, setMatch] = useState<Match | null>(null);
  const [subGroup, setSubGroup] = useState<SubGroup | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [availableFighters, setAvailableFighters] = useState<{
    region1: Fighter[];
    region2: Fighter[];
  }>({ region1: [], region2: [] });

  const { isConnected, subscribeToMatch } = useRealtime();
  const matchState = useMatchState();

  // Fonction helper pour charger un match
  const fetchMatch = async (id: string | string[] | number) => {
    try {
      const response = await api.get<Match>(`/api/matches/${id}`, {
        params: {
          with_relations: true,
          with_fighters: true,
          with_sub_group: true,
          with_cards: true
        }
      });
      return response;
    } catch (error: any) {
      console.error("Error fetching match:", error);
      // Retourner un objet vide plutôt que undefined
      return null;
    }
  };

  // Fonction helper pour charger un sous-groupe
  const fetchSubGroup = async (id: string | string[] | number) => {
    try {
      const response = await api.get<SubGroup>(`/api/sub-groups/${id}`, {
        params: {
          with_relations: true,
          with_matches: true,
          with_regions: true,
          with_edition_fighters: true,
          with_edition_regions: true
        }
      });
      return response;
    } catch (error: any) {
      console.error("Error fetching sub-group:", error);
      // Retourner un objet vide plutôt que undefined
      return null;
    }
  };

  // Query pour charger les données du match - TOUJOURS RETOURNER UNE VALEUR
  const { 
    data: matchData, 
    isLoading: isLoadingMatch,
    error: matchError,
    refetch: refetchMatch 
  } = useQuery({
    queryKey: ['match', matchId],
    queryFn: () => fetchMatch(matchId!),
    enabled: !!matchId,
    retry: 2,
    retryDelay: 1000,
    // Toujours retourner une valeur, même en cas d'erreur
    placeholderData: (previousData) => previousData ?? null
  });

  // Query pour charger le sous-groupe - TOUJOURS RETOURNER UNE VALEUR
  const { 
    data: subGroupData, 
    isLoading: isLoadingSubGroup,
    error: subGroupError,
    refetch: refetchSubGroup 
  } = useQuery({
    queryKey: ['sub-group', subGroupId],
    queryFn: () => fetchSubGroup(subGroupId!),
    enabled: !!subGroupId,
    retry: 2,
    retryDelay: 1000,
    // Toujours retourner une valeur, même en cas d'erreur
    placeholderData: (previousData) => previousData ?? null
  });

  // Mutation pour mettre à jour le match
  const updateMatchMutation = useMutation({
    mutationFn: async (updates: Partial<Match>) => {
      const response = await api.put(`/api/matches/${matchId}`, updates);
      return response;
    },
    onSuccess: (data) => {
      // Mise à jour optimiste
      if (data) {
        queryClient.setQueryData(['match', matchId], (old: any) => ({
          ...old,
          ...data
        }));

        // Mettre à jour l'état local
        setMatch((prev: Match | null) => prev ? { ...prev, ...data } : data);

        // Mettre à jour le state global
        if (data.total_duration || data.break_count || data.status || data.audience_count) {
          matchState.initialize({
            time: data.total_duration
              ? parseDurationToSeconds(data.total_duration)
              : matchState.time,
            breakCount: data.break_count ?? matchState.breakCount,
            isRunning: data.status === 'live',
            status: data.status ?? matchState.status,
            audienceCount: data.audience_count ?? matchState.audienceCount
          });
        }
      }

      toast.success('Match mis à jour');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });

  // Mutation pour match nul
  const setMatchDrawMutation = useMutation({
    mutationFn: async () => {
// app/ad/sub-groups/[subGroupId]/matches/[matchId]/page.tsx
      // Appel direct à l'action serveur pour déclarer le match nul
      const response = await fetch('/api/actions/match-draw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de la déclaration du match nul');
      }

      return await response.json();
    },
    onSuccess: () => {
      toast.success('Match déclaré nul');
      queryClient.invalidateQueries({ queryKey: ['match', matchId] });
      refetchMatch();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });


  // Initialisation du match (une seule fois)
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!matchData || initializedRef.current) return;

    initializedRef.current = true;

    setMatch(matchData);

    // Initialiser l'état du match
    matchState.initialize({
      time: matchData.total_duration
        ? parseDurationToSeconds(matchData.total_duration)
        : 0,
      breakCount: matchData.break_count || 0,
      isRunning: matchData.status === 'live',
      status: matchData.status,
      audienceCount: matchData.audience_count || 0
    });
  }, [matchData]);

  // Abonnement temps réel (une seule fois)
  useEffect(() => {
    if (!matchId) return;

    subscribeToMatch(parseInt(matchId as string));
  }, [matchId, subscribeToMatch]);

  useEffect(() => {
    if (subGroupData) {
      setSubGroup(subGroupData);

      // Trouver l'index du match actuel
      const matches = subGroupData.matches || [];
      const index = matches.findIndex((m: Match) => m.id === parseInt(matchId as string));
      setCurrentIndex(index >= 0 ? index : 0);

      // Charger les lutteurs disponibles
      loadAvailableFighters(subGroupData);
    }
  }, [subGroupData, matchId]);
  // Charger les lutteurs disponibles
  const loadAvailableFighters = async (sg: SubGroup) => {
    try {
      if (!sg.group?.phase?.edition?.id) return;

      const fightersResponse = await api.get(`/api/editions/${sg.group.phase.edition.id}/fighters`, {
        params: {
          limit: 100,
          with_fighter: true,
          with_region: true
        }
      });

      if (fightersResponse && Array.isArray(fightersResponse)) {
        const fighters = fightersResponse.map((item: any) => item.fighter).filter(Boolean);

        const region1Fighters = sg.region1_id
          ? fighters.filter((f: Fighter) => f.region_id === sg.region1_id)
          : [];

        const region2Fighters = sg.region2_id
          ? fighters.filter((f: Fighter) => f.region_id === sg.region2_id)
          : [];

        setAvailableFighters({
          region1: region1Fighters,
          region2: region2Fighters
        });
      }
    } catch (error) {
      console.error("Erreur chargement lutteurs:", error);
    }
  };

  // Navigation entre matches
  const navigateToMatch = (direction: "prev" | "next") => {
    if (!subGroup || !subGroup.matches) return;

    const newIndex = direction === "prev" ? currentIndex - 1 : currentIndex + 1;

    if (newIndex >= 0 && newIndex < subGroup.matches.length) {
      const nextMatch = subGroup.matches[newIndex];
      router.push(`/ad/sub-groups/${subGroupId}/matches/${nextMatch.id}`);
    }
  };

  // Gérer la mise à jour du match
  const handleUpdateMatch = async (updates: Partial<Match>) => {
    try {
      await updateMatchMutation.mutateAsync(updates);
    } catch (error) {
      console.error("Erreur mise à jour match:", error);
    }
  };

  // Gérer le match nul
  const handleMatchDraw = async () => {
    if (!confirm("Déclarer ce match comme nul ?")) return;
    await setMatchDrawMutation.mutateAsync();
  };

  // Gérer le temps
  const handleTimeUpdate = useCallback(
    (seconds: number) => {
      matchState.setTime(seconds);

      // Sauvegarder périodiquement (toutes les 60 secondes)
      if (seconds > 0 && seconds % 60 === 0 && match) {
        handleUpdateMatch({ total_duration: formatSecondsToDuration(seconds) });
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

    handleUpdateMatch({
      break_count: newBreakCount,
      status: 'round_break',
    });

    toast.success(`Pause #${newBreakCount} ajoutée`);

    // Auto-reprise après 30 secondes
    setTimeout(() => {
      if (match?.status === 'round_break') {
        matchState.setStatus('live');
        matchState.setIsRunning(true);
        handleUpdateMatch({ status: 'live' });
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

    if (running && match && !match.start_time) {
      updates.start_time = new Date().toTimeString().slice(0, 8);
    }

    handleUpdateMatch(updates);
  };

  // Fonction pour recharger toutes les données
  const handleRefreshAll = () => {
    refetchMatch();
    refetchSubGroup();
    queryClient.invalidateQueries();
    toast.info("Actualisation des données...");
  };

  // Afficher l'état de chargement
  if (isLoadingMatch || isLoadingSubGroup) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
          <Typography variant="h4" className="mb-2">Chargement du match...</Typography>
          <Typography variant="body-sm" theme="muted">
            Récupération des données en cours
          </Typography>
        </div>
      </div>
    );
  }

  // Afficher les erreurs
  if (matchError || subGroupError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6">
        <div className="text-center max-w-md">
          <AlertTriangle className="h-16 w-16 text-destructive mx-auto mb-4" />
          <Typography variant="h3" className="mb-2">Erreur de chargement</Typography>
          <Typography variant="body-lg" className="mb-4" theme="muted">
            {matchError?.message || subGroupError?.message || "Une erreur est survenue"}
          </Typography>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={handleRefreshAll} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Réessayer
            </Button>
            <Button 
              variant="outline" 
              onClick={() => router.push(`/ad/sub-groups/${subGroupId}/organisation`)}
              className="gap-2"
            >
              <Home className="h-4 w-4" />
              Retour à l'organisation
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Vérifier si les données sont chargées
  if (!match || !subGroup) {
    return (
      <div className="text-center py-20">
        <Typography variant="h3" className="mb-4">
          Données non disponibles
        </Typography>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={handleRefreshAll}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Actualiser
          </Button>
          <Button
            variant="outline"
            onClick={() =>
              router.push(`/ad/sub-groups/${subGroupId}/organisation`)
            }
            className="gap-2"
          >
            ← Retour à l'organisation
          </Button>
        </div>
      </div>
    );
  }

  // Filtrer les cartons par lutteur
  const fighter1Cards = match.cards?.filter(card => card.fighter_id === match.fighter1_id) || [];
  const fighter2Cards = match.cards?.filter(card => card.fighter_id === match.fighter2_id) || [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 p-4 md:p-6">
      {/* En-tête de navigation */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <Button
            variant="ghost"
            onClick={() =>
              router.push(`/ad/sub-groups/${subGroupId}/organisation`)
            }
            className="gap-2 self-start"
          >
            <ChevronLeft className="h-4 w-4" />
            Retour à l'organisation
          </Button>

          <div className="flex items-center gap-3">
            <div
              className={`w-3 h-3 rounded-full ${isConnected ? "bg-green-500 animate-pulse" : "bg-red-500"
                }`}
            />
            <Badge variant={isConnected ? "default" : "outline"}>
              {isConnected ? "Temps réel actif" : "Hors ligne"}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefreshAll}
              className="gap-2"
            >
              <RefreshCw className="h-3 w-3" />
              Actualiser
            </Button>
          </div>
        </div>

        {/* Navigation entre matches */}
        <div className="flex flex-col md:flex-row items-center justify-between bg-card p-4 rounded-lg border shadow-sm gap-4">
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
            <Typography variant="h3" weight="bold" className="mb-2">
              Match #{match.match_number || 'N/A'}
            </Typography>
            <div className="flex flex-col md:flex-row items-center justify-center gap-3">
              <Badge
                variant={match.status === "live" ? "destructive" : "secondary"}
                className="text-sm"
              >
                {match.status === "live" ? "🔴 EN DIRECT" : match.status}
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

      {/* Bouton match nul */}
      <div className="max-w-7xl mx-auto mb-6">
        <Button
          variant="outline"
          onClick={handleMatchDraw}
          disabled={match.status === 'completed' || !match.fighter1_id || !match.fighter2_id}
          className="w-full md:w-auto gap-2"
        >
          <Equal className="h-4 w-4" />
          Déclarer Match Nul
        </Button>
      </div>

      {/* Contenu principal */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne gauche - Lutteurs */}
        <div className="lg:col-span-2 space-y-6">
          {/* Lutteurs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
            <FighterControl
              fighter={match.fighter1}
              fighterType="fighter1"
              match={match}
              subGroup={subGroup}
              onUpdateMatch={handleUpdateMatch}
              availableFighters={availableFighters.region1}
              currentTime={matchState.time}
              fighterCards={fighter1Cards}
            />

            {/* VS Element */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 hidden md:block">
              <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg border-4 border-background">
                <Typography variant="body-lg" weight="bold">VS</Typography>
              </div>
            </div>

            <FighterControl
              fighter={match.fighter2}
              fighterType="fighter2"
              match={match}
              subGroup={subGroup}
              onUpdateMatch={handleUpdateMatch}
              availableFighters={availableFighters.region2}
              currentTime={matchState.time}
              fighterCards={fighter2Cards}
            />
          </div>

          {/* Gestion des cartons */}
          <CardsManager
            match={match}
            onUpdateMatch={handleUpdateMatch}
            currentTime={matchState.time}
          />

          {/* Contrôles du match */}
          <MatchControls
            match={match}
            onUpdateMatch={handleUpdateMatch}
            onAddBreak={handleAddBreak}
            isTimerRunning={matchState.isRunning}
            onTimerToggle={handleTimerToggle}
            isSaving={updateMatchMutation.isPending}
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
            onStatusChange={(status) => handleUpdateMatch({ status })}
            onBreakCountChange={matchState.setBreakCount}
            onTimerToggle={handleTimerToggle}
          />

          {/* Compteur de spectateurs */}
          <AudienceCounter
            audienceCount={matchState.audienceCount}
            onUpdate={(count) => {
              matchState.setAudienceCount(count);
              handleUpdateMatch({ audience_count: count });
            }}
          />

          {/* Gestion des médias */}
          <MediaManager
            videoUrl={match.video_url}
            liveStreamUrl={match.live_stream_url}
            onUpdate={(updates) => handleUpdateMatch(updates)}
            isSaving={updateMatchMutation.isPending}
          />

          {/* Infos du match */}
          <Card>
            <CardContent className="space-y-4 pt-6">
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
                    {match.match_date ? new Date(match.match_date).toLocaleDateString("fr-FR", {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    }) : 'Date non définie'}
                    {match.start_time && ` à ${match.start_time.slice(0, 5)}`}
                  </Typography>
                </div>
              </div>

              {match.notes && (
                <div className="space-y-2">
                  <Typography variant="body-sm" weight="medium" theme="muted">
                    Notes
                  </Typography>
                  <Typography variant="body-sm" className="italic bg-muted/30 p-3 rounded">
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
// Dans votre page.tsx - CORRECTION DES FONCTIONS HELPER
// Helper functions - VERSION CORRIGÉE
function parseDurationToSeconds(duration?: any): number {
  if (!duration) return 0;
  
  // Si duration est déjà un nombre (secondes), le retourner
  if (typeof duration === 'number') {
    return duration;
  }
  
  // Si c'est une chaîne, essayer de la parser
  if (typeof duration === 'string') {
    // Format PostgreSQL interval (ex: "01:23:45")
    const timeMatch = duration.match(/^(\d{2}):(\d{2}):(\d{2})$/);
    if (timeMatch) {
      const hours = parseInt(timeMatch[1]);
      const minutes = parseInt(timeMatch[2]);
      const seconds = parseInt(timeMatch[3]);
      return hours * 3600 + minutes * 60 + seconds;
    }
    
    // Format HH:MM:SS simple
    const parts = duration.split(":").map(Number);
    if (parts.length === 3) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    }
    
    // Format MM:SS
    if (parts.length === 2) {
      return parts[0] * 60 + parts[1];
    }
  }
  
  // Si c'est un objet (format PostgreSQL interval), essayer d'extraire les valeurs
  if (typeof duration === 'object') {
    try {
      // Format PostgreSQL interval comme objet
      const hours = duration.hours || 0;
      const minutes = duration.minutes || 0;
      const seconds = duration.seconds || 0;
      return hours * 3600 + minutes * 60 + seconds;
    } catch (error) {
      console.error('Error parsing duration object:', error);
    }
  }
  
  return 0;
}

function formatSecondsToDuration(seconds: number): string {
  // S'assurer que seconds est un nombre valide
  const safeSeconds = isNaN(seconds) ? 0 : Math.max(0, seconds);
  
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const secs = safeSeconds % 60;
  
  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}