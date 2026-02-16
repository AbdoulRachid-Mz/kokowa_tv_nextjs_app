// app/ad/sub-groups/[subGroupId]/matches/[matchId]/page.tsx
"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
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
  AlertTriangle,
  Home,
  CheckCircle,
} from "lucide-react";
import { useRealtime } from "@/hooks/use-realtime";
import { toast } from "sonner";
import { FighterControl } from "./fighter-control";
import { MatchTimer } from "./match-timer";
import { AudienceCounter } from "./audience-counter";
import { MediaManager } from "./media-manager";
import { useMatchState } from "./match-state";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { MatchControls } from "./match-controls";
import { completeSubGroup } from "@/actions/sub-groups";

// Helpers
const formatSecondsToDuration = (totalSeconds: number): string => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

const parseDurationToSeconds = (duration?: any): number => {
  if (!duration) return 0;
  if (typeof duration === 'number') return duration;
  if (typeof duration === 'string') {
    const parts = duration.split(':').map(Number);
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    if (parts.length === 2) return parts[0] * 60 + parts[1];
  }
  return 0;
};

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

  // Charger les lutteurs disponibles
  const loadAvailableFighters = useCallback(async (sg: SubGroup) => {
    try {
      const editionId = sg.group?.phase?.edition?.id;
      if (!editionId) return;

      console.log("🔄 Chargement des lutteurs pour l'édition:", editionId);

      const fightersResponse = await api.get(`/api/editions/${editionId}/fighters`, {
        params: { 
          limit: 100, 
          with_fighter: true, 
          with_region: true,
          status: 'qualified'
        }
      });

      if (fightersResponse && Array.isArray(fightersResponse)) {
        const fighters = fightersResponse
          .map((item: any) => item.fighter)
          .filter(Boolean);

        setAvailableFighters({
          region1: sg.region1_id ? fighters.filter((f: Fighter) => f.region_id === sg.region1_id) : [],
          region2: sg.region2_id ? fighters.filter((f: Fighter) => f.region_id === sg.region2_id) : []
        });

        console.log(`✅ Lutteurs chargés: Region1: ${fighters.filter((f: Fighter) => f.region_id === sg.region1_id).length}, Region2: ${fighters.filter((f: Fighter) => f.region_id === sg.region2_id).length}`);
      }
    } catch (error) {
      console.error("❌ Erreur chargement lutteurs:", error);
    }
  }, []);

  // Récupérer le match
  const { data: matchData, isLoading: isLoadingMatch } = useQuery({
    queryKey: ['match', matchId],
    queryFn: async () => {
      const response = await api.get<Match>(`/api/matches/${matchId}`, {
        params: {
          with_relations: true,
          with_fighters: true,
          with_sub_group: true,
          with_cards: true
        }
      });
      return response;
    },
    enabled: !!matchId,
  });

  // Récupérer le sous-groupe
  const { data: subGroupData, isLoading: isLoadingSubGroup } = useQuery({
    queryKey: ['sub-group', subGroupId],
    queryFn: async () => {
      const response = await api.get<SubGroup>(`/api/sub-groups/${subGroupId}`, {
        params: {
          with_relations: true,
          with_matches: true,
          with_regions: true,
          with_edition_fighters: true,
          with_edition_regions: true
        }
      });
      return response;
    },
    enabled: !!subGroupId,
  });

  // Mutation pour mettre à jour le match
  const updateMatchMutation = useMutation({
    mutationFn: async (updates: Partial<Match>) => {
      const response = await api.put(`/api/matches/${matchId}`, updates);
      return response;
    },
    onMutate: async (updates) => {
      await queryClient.cancelQueries({ queryKey: ['match', matchId] });
      const previousMatch = queryClient.getQueryData(['match', matchId]);

      queryClient.setQueryData(['match', matchId], (old: any) => ({
        ...old,
        ...updates
      }));

      setMatch((prev) => prev ? { ...prev, ...updates as Match } : null);

      return { previousMatch };
    },
    onError: (error, updates, context) => {
      if (context?.previousMatch) {
        queryClient.setQueryData(['match', matchId], context.previousMatch);
        setMatch(context.previousMatch as Match);
      }
      toast.error(`Erreur: ${error.message}`);
    },
    onSuccess: (data) => {
      toast.success('Match synchronisé');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['match', matchId] });
    }
  });

  // Mutation pour ajouter un carton
  const addCardMutation = useMutation({
    mutationFn: async ({ fighterId }: { fighterId: number }) => {
      const response = await api.post('/api/fighter-cards', {
        match_id: parseInt(matchId as string),
        fighter_id: fighterId,
        card_type: 'yellow',
        card_reason: 'Carton jaune',
        minute_given: formatSecondsToDuration(matchState.time)
      });
      return response;
    },
    onSuccess: (data, variables) => {
      // Mettre à jour le compteur local
      if (variables.fighterId === match?.fighter1_id) {
        matchState.incrementFighter1Cards();
      } else if (variables.fighterId === match?.fighter2_id) {
        matchState.incrementFighter2Cards();
      }
      
      // Rafraîchir les données
      queryClient.invalidateQueries({ queryKey: ['match', matchId] });
      toast.success(`🟨 Carton jaune ajouté`);
    },
    onError: (error) => {
      toast.error("Erreur lors de l'ajout du carton");
    }
  });

  // Mutation pour réinitialiser le match
  const resetMatchMutation = useMutation({
    mutationFn: async () => {
      const updates: Partial<Match> = {
        status: 'scheduled',
        match_result: undefined,
        winner_fighter_id: undefined,
        loser_fighter_id: undefined,
        total_duration: undefined,
        break_count: 0,
        end_time: undefined
      };
      const response = await api.put(`/api/matches/${matchId}`, updates);
      return response;
    },
    onSuccess: () => {
      matchState.reset();
      queryClient.invalidateQueries({ queryKey: ['match', matchId] });
      toast.info("Match réinitialisé");
    }
  });

  // Souscription temps réel
  useEffect(() => {
    if (!matchId) return;
    subscribeToMatch(parseInt(matchId as string));
  }, [matchId, subscribeToMatch]);

  // Initialisation des données
  useEffect(() => {
    if (matchData) {
      setMatch(matchData);
      
      // Compter les cartons
      const fighter1Cards = matchData.cards?.filter(
        card => card.fighter?.id === matchData.fighter1_id && card.card_type === 'yellow'
      ).length || 0;
      
      const fighter2Cards = matchData.cards?.filter(
        card => card.fighter?.id === matchData.fighter2_id && card.card_type === 'yellow'
      ).length || 0;

      matchState.initialize({
        time: matchData.total_duration ? parseDurationToSeconds(matchData.total_duration) : 0,
        breakCount: matchData.break_count || 0,
        isRunning: matchData.status === 'live',
        status: matchData.status,
        audienceCount: matchData.audience_count || 0,
        fighter1Cards,
        fighter2Cards
      });
    }
  }, [matchData]);

  // Initialisation du sous-groupe
  useEffect(() => {
    if (subGroupData) {
      setSubGroup(subGroupData);
      
      const matches = subGroupData.matches || [];
      const index = matches.findIndex((m: Match) => m.id === parseInt(matchId as string));
      setCurrentIndex(index >= 0 ? index : 0);
      
      loadAvailableFighters(subGroupData);
    }
  }, [subGroupData, matchId, loadAvailableFighters]);

  // Handlers
  const handleUpdateMatch = (updates: Partial<Match>) => {
    updateMatchMutation.mutate(updates);
  };

  const handleTimeUpdate = useCallback((seconds: number) => {
    matchState.setTime(seconds);
    handleUpdateMatch({ total_duration: formatSecondsToDuration(seconds) });
  }, []);

  const handleAddBreak = useCallback(() => {
    const newBreakCount = matchState.breakCount + 1;
    matchState.setBreakCount(newBreakCount);
    matchState.setIsRunning(false);
    matchState.setStatus('round_break');
    handleUpdateMatch({ 
      break_count: newBreakCount, 
      status: 'round_break' 
    });
  }, [matchState.breakCount]);

  const handleTimerToggle = useCallback((running: boolean) => {
    matchState.setIsRunning(running);
    handleUpdateMatch({ status: running ? 'live' : 'round_break' });
  }, []);

  const handleAddCard = useCallback((fighterId: number) => {
    addCardMutation.mutate({ fighterId });
  }, [addCardMutation]);

  const navigateToMatch = (direction: "prev" | "next") => {
    if (!subGroup?.matches) return;
    const newIndex = direction === "prev" ? currentIndex - 1 : currentIndex + 1;
    if (newIndex >= 0 && newIndex < subGroup.matches.length) {
      router.push(`/ad/sub-groups/${subGroupId}/matches/${subGroup.matches[newIndex].id}`);
    }
  };

  // Stats des matchs
  const totalMatches = subGroup?.matches?.length || 0;
  const completedMatches = subGroup?.matches?.filter(m => m.status === 'completed').length || 0;
  const allMatchesCompleted = totalMatches > 0 && totalMatches === completedMatches;

  // États de chargement
  if (isLoadingMatch || isLoadingSubGroup) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
          <Typography variant="h4">Chargement du match...</Typography>
        </div>
      </div>
    );
  }

  // Erreurs
  if (!matchData || !subGroupData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6">
        <AlertTriangle className="h-16 w-16 text-destructive mx-auto mb-4" />
        <Typography variant="h3" className="mb-2">Erreur de chargement</Typography>
        <Button onClick={() => router.push(`/ad/sub-groups/${subGroupId}/organisation`)}>
          Retour à l'organisation
        </Button>
      </div>
    );
  }

  const currentMatch = match || matchData;
  const currentSubGroup = subGroup || subGroupData;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 p-3 md:p-4">
      <div className="max-w-7xl mx-auto mb-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <Button variant="ghost" onClick={() => router.push(`/ad/sub-groups/${subGroupId}`)}>
            <ChevronLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${isConnected ? "bg-green-500 animate-pulse" : "bg-red-500"}`} />
            <Badge variant={isConnected ? "default" : "outline"}>
              {isConnected ? "Temps réel actif" : "Hors ligne"}
            </Badge>
          </div>
        </div>

        {/* Navigation entre matchs */}
        <div className="flex justify-between items-center bg-card p-4 rounded-lg border">
          <Button 
            variant="outline" 
            onClick={() => navigateToMatch("prev")} 
            disabled={currentIndex === 0}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Précédent
          </Button>
          <div className="text-center">
            <Typography variant="h3" weight="bold">
              Match #{currentMatch.match_number || 'N/A'}
            </Typography>
            <Badge variant={currentMatch.status === "live" ? "destructive" : "secondary"}>
              {currentMatch.status === "live" ? "🔴 EN DIRECT" : currentMatch.status}
            </Badge>
          </div>
          <Button 
            variant="outline" 
            onClick={() => navigateToMatch("next")} 
            disabled={currentIndex === totalMatches - 1}
          >
            Suivant
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>

      {/* Bannière de finalisation */}
      {!currentSubGroup.is_completed && allMatchesCompleted && (
        <div className="max-w-7xl mx-auto mb-6">
          <Card className="border-green-500 bg-green-50/50">
            <CardContent className="py-6">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                  <div>
                    <Typography variant="h5" weight="bold" className="text-green-700">
                      Tous les matchs sont terminés !
                    </Typography>
                    <Typography variant="body-sm" className="text-green-600">
                      {completedMatches}/{totalMatches} matchs
                    </Typography>
                  </div>
                </div>
                <Button
                  onClick={async () => {
                    const result = await completeSubGroup(parseInt(subGroupId as string));
                    if (result.success) {
                      toast.success(result.message);
                      queryClient.invalidateQueries({ queryKey: ['sub-group', subGroupId] });
                    }
                  }}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Trophy className="h-4 w-4 mr-2" />
                  Finaliser le sous-groupe
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Contenu principal */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne de gauche (2/3) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Fighters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
            <FighterControl
              fighter={currentMatch.fighter1}
              fighterType="fighter1"
              match={currentMatch}
              onUpdateMatch={handleUpdateMatch}
              onAddCard={handleAddCard}
              availableFighters={availableFighters.region1}
              currentTime={matchState.time}
              yellowCardCount={matchState.fighter1Cards}
              isSubGroupCompleted={currentSubGroup.is_completed}
              matchStatus={matchState.status}
            />
            
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden md:block">
              <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg border-4 border-background">
                <Typography variant="body-lg" weight="bold">VS</Typography>
              </div>
            </div>
            
            <FighterControl
              fighter={currentMatch.fighter2}
              fighterType="fighter2"
              match={currentMatch}
              onUpdateMatch={handleUpdateMatch}
              onAddCard={handleAddCard}
              availableFighters={availableFighters.region2}
              currentTime={matchState.time}
              yellowCardCount={matchState.fighter2Cards}
              isSubGroupCompleted={currentSubGroup.is_completed}
              matchStatus={matchState.status}
            />
          </div>

          {/* Contrôles */}
          <MatchControls
            match={currentMatch}
            onUpdateMatch={handleUpdateMatch}
            onAddBreak={handleAddBreak}
            isTimerRunning={matchState.isRunning}
            onTimerToggle={handleTimerToggle}
            isSaving={updateMatchMutation.isPending}
            isSubGroupCompleted={currentSubGroup.is_completed}
            onResetMatch={() => resetMatchMutation.mutate()}
          />
        </div>

        {/* Colonne de droite (1/3) */}
        <div className="space-y-6">
          <MatchTimer
            match={currentMatch}
            initialTime={matchState.time}
            breakCount={matchState.breakCount}
            isRunning={matchState.isRunning}
            onTimeUpdate={handleTimeUpdate}
            onStatusChange={(status) => handleUpdateMatch({ status })}
            onBreakCountChange={(count) => matchState.setBreakCount(count)}
            onTimerToggle={handleTimerToggle}
            isSubGroupCompleted={currentSubGroup.is_completed}
          />

          <AudienceCounter
            matchId={currentMatch.id}
            audienceCount={matchState.audienceCount}
            onUpdate={(count) => {
              matchState.setAudienceCount(count);
              handleUpdateMatch({ audience_count: count });
            }}
          />

          <MediaManager
            matchId={currentMatch.id}
            videoUrl={currentMatch.video_url}
            liveStreamUrl={currentMatch.live_stream_url}
            onUpdate={(updates) => handleUpdateMatch(updates)}
            isSaving={updateMatchMutation.isPending}
          />

          {/* Informations supplémentaires */}
          <Card>
            <CardContent className="space-y-4 pt-6">
              <div>
                <Typography variant="body-sm" weight="medium" theme="muted">Sous-groupe</Typography>
                <Typography>{currentSubGroup.name}</Typography>
              </div>
              <div>
                <Typography variant="body-sm" weight="medium" theme="muted">Date et heure</Typography>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <Typography>
                    {currentMatch.match_date ? new Date(currentMatch.match_date).toLocaleDateString("fr-FR") : 'Date non définie'}
                    {currentMatch.start_time && ` à ${currentMatch.start_time.slice(0, 5)}`}
                  </Typography>
                </div>
              </div>
              {currentMatch.notes && (
                <div>
                  <Typography variant="body-sm" weight="medium" theme="muted">Notes</Typography>
                  <Typography variant="body-sm" className="italic bg-muted/30 p-3 rounded">
                    {currentMatch.notes}
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