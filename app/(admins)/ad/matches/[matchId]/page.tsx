// app/(admins)/ad/matches/[matchId]/page.tsx
"use client"

import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { Typography } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Match, Fighter, SubGroup } from "@/types";
import {
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Zap,
  ZapOff,
  Bug,
} from "lucide-react";
import { useRealtimeSubGroup } from "@/hooks/realtime/use-realtime-subgroup";
import { toast } from "sonner";
import { MediaManager } from "./media-manager";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import {
  completeSubGroup,
  getSubGroupById,
  updateSubGroup,
} from "@/actions/sub-groups";
import { getEditionFighters } from "@/actions/editions";
import { getMatches } from "@/actions/matches";
import { useMatchController } from "@/hooks/use-match-controller";
import { FighterControl } from "./fighter-control";
import { MatchControls } from "./match-controls";
import { MatchTimer } from "./match-timer";
import { addFighterCard, updateMatch, getMatchById } from "@/actions/matches-2";
import { MatchUpdate } from "@/lib/services/match-update.service";
import { FloatingMatchScore } from "./floating-match-score";
import { SubGroupRefereeManager } from "./sub-group-referee-manager";
import { useRealtimeMatch } from "@/hooks/realtime/use-realtime-match";
import { forceSyncMatch } from "@/actions/realtime";

export default function StandaloneMatchDetailPage() {
  const { matchId } = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const parsedMatchId = parseInt(matchId as string);
  const [isDialogLoading, setIsDialogLoading] = useState(false);

  const [availableFighters, setAvailableFighters] = useState<{
    region1: Fighter[];
    region2: Fighter[];
  }>({ region1: [], region2: [] });

  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    type:
      | "winner"
      | "draw"
      | "cancel"
      | "reclamation"
      | "reset"
      | "complete"
      | "startSubGroup"
      | "replaceFighter"
      | "removeFighter";
    fighterId?: number;
    regionId?: number;
    opponentId?: number;
  }>({
    isOpen: false,
    type: "winner",
  });

  // ==========================
  // 1. Charger les données du match autonome
  // ==========================
  const {
    data: fetchedMatch,
    isLoading: isLoadingMatch,
    refetch: refetchMatch,
  } = useQuery({
    queryKey: ["match", parsedMatchId],
    queryFn: async () => {
      return await getMatchById(parsedMatchId);
    },
    enabled: !isNaN(parsedMatchId),
  });

  const parsedSubGroupId = fetchedMatch?.sub_group_id ?? fetchedMatch?.sub_group?.id ?? undefined;

  // ==========================
  // 2. Charger les données du sous-groupe associé (si présent)
  // ==========================
  const { data: subGroup, isLoading: isLoadingSubGroup } = useQuery({
    queryKey: ["sub-group", parsedSubGroupId],
    queryFn: async () => {
      if (!parsedSubGroupId) return null;
      return await getSubGroupById(parsedSubGroupId, {
        with_relations: true,
        relations: {
          with_group: true,
          with_phase: true,
          with_edition: true,
          with_competition: true,
          with_regions: true,
          with_belts: true,
          with_referee: true,
          with_matches: true,
          with_edition_fighters: false,
          with_edition_regions: false,
        },
      });
    },
    enabled: !!parsedSubGroupId,
  });

  const editionId =
    subGroup?.group?.phase?.edition?.id ??
    fetchedMatch?.sub_group?.group?.phase?.edition?.id ??
    null;

  const phaseType =
    subGroup?.group?.phase?.phase_type ??
    fetchedMatch?.sub_group?.group?.phase?.phase_type;
  const isEliminationPhase = phaseType ? phaseType !== "group" : false;
  const groupId =
    subGroup?.group_id ??
    subGroup?.group?.id ??
    fetchedMatch?.sub_group?.group_id ??
    fetchedMatch?.sub_group?.group?.id;

  // Si phase éliminatoire, charger tous les matchs du groupe pour le carrousel
  const { data: groupMatchesData } = useQuery({
    queryKey: ["phase-group-matches", groupId],
    queryFn: async () => {
      if (!groupId) return [];
      const res = await getMatches({
        group_id: groupId,
        limit: 100,
        with_fighters: true,
        with_sub_group: true,
      });
      return res.data || [];
    },
    enabled: !!(isEliminationPhase && groupId),
  });

  // ==========================
  // 3. Écouter les données temps réel (match et sous-groupe)
  // ==========================
  const { data: realtimeMatchData, isLoading: isMatchListening } =
    useRealtimeMatch(editionId, parsedSubGroupId ?? 0, parsedMatchId);

  const { hasLiveMatch } = useRealtimeSubGroup(
    editionId,
    parsedSubGroupId ?? 0,
  );

  // Forcer la création du document RTDB si inexistant
  useEffect(() => {
    if (!realtimeMatchData && !isMatchListening && parsedMatchId) {
      forceSyncMatch(parsedMatchId).catch((e) =>
        console.error("RTDB init error", e),
      );
    }
  }, [realtimeMatchData, isMatchListening, parsedMatchId]);

  // ==========================
  // 4. Contrôleur du match (gère timer, victoire, statut)
  // ==========================
  const {
    match,
    elapsed,
    formattedTime,
    isRunning,
    breakCount,
    startMatch,
    pauseMatch,
    resumeMatch,
    completeMatch,
    setDraw,
    resetMatch,
    canStart,
    canPause,
    canResume,
    reclamation,
    canSetWinner,
    canSetDraw,
    isUpdating,
    updateSubGroupMutation,
  } = useMatchController({
    matchId: parsedMatchId,
    subGroupId: parsedSubGroupId,
  });

  // Fusion des données locales et temps réel
  const activeMatch = match ?? fetchedMatch;
  const mergedMatch = realtimeMatchData
    ? ({ ...activeMatch, ...realtimeMatchData } as Match)
    : activeMatch;
  const isConnected = !isMatchListening;

  // ==========================
  // 5. Mutations
  // ==========================
  const addCardMutation = useMutation({
    mutationFn: async ({ fighterId }: { fighterId: number }) => {
      const response = await addFighterCard(
        parsedMatchId,
        fighterId,
        "yellow",
        formatTimeForCard(elapsed),
        "Carton jaune",
      );
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["match", parsedMatchId] });
      toast.success("🟨 Carton jaune ajouté");
    },
    onError: () => {
      toast.error("Erreur lors de l'ajout du carton");
    },
  });

  const completeSubGroupMutation = useMutation({
    mutationFn: async () => {
      if (!parsedSubGroupId) return;
      const result = await completeSubGroup(parsedSubGroupId);
      if (!result.success) throw new Error("Erreur lors de la finalisation");
      return result;
    },
    onSuccess: () => {
      if (parsedSubGroupId) {
        queryClient.invalidateQueries({
          queryKey: ["sub-group", parsedSubGroupId],
        });
      }
      toast.success("Sous-groupe finalisé avec succès");
      setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erreur lors de la finalisation");
    },
  });

  const updateMatchMutation = useMutation({
    mutationFn: async (updates: MatchUpdate) => {
      const response = await updateMatch(parsedMatchId, updates);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["match", parsedMatchId] });
    },
  });

  // ==========================
  // 6. Gestion des remplacements / retraits
  // ==========================
  const handleRemoveFighterId = (fighterId: number) => {
    setIsDialogLoading(true);
    const updates: MatchUpdate = {};

    if (mergedMatch?.fighter1_id === fighterId) {
      updates.fighter1_id = null;
    } else if (mergedMatch?.fighter2_id === fighterId) {
      updates.fighter2_id = null;
    } else {
      toast.error("Lutteur non trouvé dans ce match");
      setIsDialogLoading(false);
      return;
    }

    updateMatchMutation.mutate(updates, {
      onSuccess: () => {
        toast.success("Lutteur retiré avec succès");
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        setIsDialogLoading(false);
      },
      onError: () => {
        setIsDialogLoading(false);
      },
    });
  };

  const handleReplaceFighterRoute = (fighterId: number, regionId: number) => {
    setIsDialogLoading(true);
    const edId =
      subGroup?.group?.phase?.edition?.id ??
      mergedMatch?.sub_group?.group?.phase?.edition?.id;
    if (edId) {
      router.push(
        `/ad/editions/${edId}/fighters/replace?fighterId=${fighterId}&regionId=${regionId}`,
      );
    }
    setIsDialogLoading(false);
  };

  // ==========================
  // 7. Chargement des lutteurs disponibles
  // ==========================
  const loadAvailableFighters = useCallback(async (sg: SubGroup) => {
    try {
      const edId = sg.group?.phase?.edition?.id;
      if (!edId) return;

      const loadRegionFighters = async (
        regionId?: number,
      ): Promise<Fighter[]> => {
        if (!regionId) return [];
        try {
          const response = await getEditionFighters(edId, {
            region_id: regionId,
            sort_order: "asc",
            limit: 100,
            with_fighter: true,
          });
          const fighters =
            response.data?.map((e: { fighter: Fighter }) => e.fighter) || [];
          return fighters.sort((a: Fighter, b: Fighter) => {
            const nameA = `${a.first_name} ${a.last_name}`.toLowerCase();
            const nameB = `${b.first_name} ${b.last_name}`.toLowerCase();
            return nameA.localeCompare(nameB);
          });
        } catch (error) {
          console.error(`Erreur chargement région ${regionId}:`, error);
          return [];
        }
      };

      const [region1Fighters, region2Fighters] = await Promise.all([
        loadRegionFighters(sg.region1_id),
        loadRegionFighters(sg.region2_id),
      ]);

      setAvailableFighters({
        region1: region1Fighters,
        region2: region2Fighters,
      });
    } catch (error) {
      console.error("❌ Erreur chargement lutteurs:", error);
    }
  }, []);

  useEffect(() => {
    if (subGroup) {
      loadAvailableFighters(subGroup);
    }
  }, [subGroup, loadAvailableFighters]);

  // Utilitaires
  const formatTimeForCard = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const matches = useMemo(() => {
    if (isEliminationPhase && groupMatchesData && groupMatchesData.length > 0) {
      return [...groupMatchesData].sort(
        (a, b) => (a.match_number ?? 1) - (b.match_number ?? 1)
      );
    }
    return (subGroup?.matches as Match[]) || [];
  }, [isEliminationPhase, groupMatchesData, subGroup?.matches]);

  const totalMatches = matches.length;
  const currentIndex = matches.findIndex((m) => m.id === parsedMatchId);

  const handleAddCard = (fighterId: number) => {
    addCardMutation.mutate({ fighterId });
  };

  const handleCompleteMatch = (
    winnerId: number,
    loserId: number | undefined,
  ) => {
    completeMatch(winnerId, loserId);
    setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
    setIsDialogLoading(false);
  };

  const handleSetDraw = () => {
    setDraw();
    setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
    setIsDialogLoading(false);
  };

  const handleReclamation = () => {
    reclamation();
    setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
    setIsDialogLoading(false);
  };

  const handleResetMatch = () => {
    resetMatch();
    setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
    setIsDialogLoading(false);
  };

  const navigateToMatch = (direction: "prev" | "next") => {
    const newIndex = direction === "prev" ? currentIndex - 1 : currentIndex + 1;
    if (newIndex >= 0 && newIndex < totalMatches) {
      router.push(`/ad/matches/${matches[newIndex].id}`);
    }
  };

  if (isLoadingMatch || !mergedMatch) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
          <Typography variant="h4">Chargement du match...</Typography>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 p-3 md:p-4">
      <div className="max-w-7xl mx-auto mb-6">
        {/* En‑tête avec retour et indicateur de connexion */}
        <div className="flex justify-between items-center mb-4">
          <Button
            variant="ghost"
            onClick={() => {
              if (isEliminationPhase && groupId) {
                router.push(`/ad/phase-groups/${groupId}/organisation`);
              } else if (parsedSubGroupId) {
                router.push(`/ad/sub-groups/${parsedSubGroupId}`);
              } else {
                router.push("/ad/matches");
              }
            }}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            <span className="max-md:hidden">Retour</span>
          </Button>

          {subGroup?.name ? (
            <Typography className="flex max-md:flex-col gap-2">
              <span className="font-bold">
                {isEliminationPhase && subGroup?.group?.name
                  ? `${subGroup.group.name} - Match #${mergedMatch?.match_number || parsedMatchId}`
                  : subGroup.name}
              </span>
              <span className="max-md:hidden">-</span>
              <span>
                {mergedMatch?.match_date
                  ? new Date(mergedMatch.match_date).toLocaleDateString("fr-FR")
                  : "Date non définie"}
                {mergedMatch?.start_time &&
                  ` à ${mergedMatch.start_time.slice(0, 5)}`}
              </span>
            </Typography>
          ) : (
            <Typography className="font-bold">
              Match #{mergedMatch?.match_number || parsedMatchId}
            </Typography>
          )}

          <div className="flex items-center gap-3">
            <div
              className={`w-3 h-3 rounded-full ${
                isConnected ? "bg-green-500 animate-pulse" : "bg-gray-400"
              }`}
            />
            <Badge
              variant={isConnected ? "default" : "outline"}
              className="gap-1"
            >
              {isConnected ? (
                <>
                  <Zap className="h-3 w-3" /> Live
                </>
              ) : (
                <>
                  <ZapOff className="h-3 w-3" /> Connexion...
                </>
              )}
            </Badge>
          </div>
        </div>

        {/* Navigation entre les matchs (si sous-groupe présent) */}
        {totalMatches > 1 && (
          <div className="flex justify-between items-center bg-card p-4 rounded-lg border">
            <Button
              variant="outline"
              onClick={() => navigateToMatch("prev")}
              disabled={currentIndex <= 0}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              <span className="max-md:hidden">Précédent</span>
            </Button>
            <div className="text-center">
              <Typography variant="h3" weight="bold">
                Match #{mergedMatch?.match_number || "N/A"}
              </Typography>
              <div className="flex items-center gap-2 justify-center mt-1">
                <Badge variant="outline" className="text-xs">
                  {currentIndex + 1}/{totalMatches}
                </Badge>
                <Badge
                  variant={
                    mergedMatch?.status === "live" ? "destructive" : "secondary"
                  }
                >
                  {mergedMatch?.status === "live"
                    ? "🔴 EN DIRECT"
                    : mergedMatch?.status}
                </Badge>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => navigateToMatch("next")}
              disabled={currentIndex === totalMatches - 1 || currentIndex < 0}
            >
              <span className="max-md:hidden">Suivant</span>
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        )}
      </div>

      {/* Grille principale */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne de gauche : les deux lutteurs + contrôles avancés */}
        <div className="lg:col-span-2 space-y-6">
          {/* Cartes des lutteurs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
            <FighterControl
              fighter={mergedMatch?.fighter1}
              fighterType="fighter1"
              match={mergedMatch as Match | undefined}
              onUpdateMatch={(updates) => updateMatchMutation.mutate(updates)}
              onAddCard={handleAddCard}
              availableFighters={availableFighters.region1}
              currentTime={elapsed}
              yellowCardCount={
                mergedMatch?.cards?.filter(
                  (c) =>
                    c.fighter_id === mergedMatch?.fighter1_id &&
                    c.card_type === "yellow",
                ).length || 0
              }
              isSubGroupCompleted={subGroup?.is_completed || false}
              matchStatus={match?.status ?? mergedMatch?.status ?? ""}
              canSetWinner={canSetWinner}
              canSetDraw={canSetDraw}
              onCompleteWithWinner={() => {
                if (!mergedMatch?.fighter1) return;
                setConfirmDialog({
                  isOpen: true,
                  type: "winner",
                  fighterId: mergedMatch?.fighter1_id ?? undefined,
                  opponentId: mergedMatch?.fighter2_id ?? undefined,
                });
              }}
              onSetDraw={() => setConfirmDialog({ isOpen: true, type: "draw" })}
              onReplaceFighter={handleReplaceFighterRoute}
              onAskRemoveFighter={(fighterId) =>
                setConfirmDialog({
                  isOpen: true,
                  type: "removeFighter",
                  fighterId,
                })
              }
              onAskReplaceFighter={(fighterId) =>
                setConfirmDialog({
                  isOpen: true,
                  type: "replaceFighter",
                  fighterId,
                  regionId: subGroup?.region1_id,
                })
              }
            />

            {/* Badge VS au centre (visible desktop) */}
            <div className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 hidden md:block">
              <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg border-4 border-background">
                <Typography variant="body-lg" weight="bold">
                  VS
                </Typography>
              </div>
            </div>

            <FighterControl
              fighter={mergedMatch?.fighter2}
              fighterType="fighter2"
              match={mergedMatch as Match | undefined}
              onUpdateMatch={(updates) => updateMatchMutation.mutate(updates)}
              onAddCard={handleAddCard}
              availableFighters={availableFighters.region2}
              currentTime={elapsed}
              yellowCardCount={
                mergedMatch?.cards?.filter(
                  (c) =>
                    c.fighter_id === mergedMatch?.fighter2_id &&
                    c.card_type === "yellow",
                ).length || 0
              }
              isSubGroupCompleted={subGroup?.is_completed || false}
              matchStatus={match?.status ?? mergedMatch?.status ?? ""}
              canSetWinner={canSetWinner}
              canSetDraw={canSetDraw}
              onCompleteWithWinner={() => {
                if (!mergedMatch?.fighter2 || !mergedMatch?.fighter1) return;
                setConfirmDialog({
                  isOpen: true,
                  type: "winner",
                  fighterId: mergedMatch?.fighter2_id ?? undefined,
                  opponentId: mergedMatch?.fighter1_id ?? undefined,
                });
              }}
              onSetDraw={() => setConfirmDialog({ isOpen: true, type: "draw" })}
              onReplaceFighter={handleReplaceFighterRoute}
              onAskRemoveFighter={(fighterId) =>
                setConfirmDialog({
                  isOpen: true,
                  type: "removeFighter",
                  fighterId,
                })
              }
              onAskReplaceFighter={(fighterId) =>
                setConfirmDialog({
                  isOpen: true,
                  type: "replaceFighter",
                  fighterId,
                  regionId: subGroup?.region2_id,
                })
              }
            />
          </div>

          {/* Panneau de contrôle (notes, réclamation, etc.) */}
          <MatchControls
            match={mergedMatch as Match}
            onUpdateMatch={(updates) => updateMatchMutation.mutate(updates)}
            isSaving={isUpdating}
            isSubGroupCompleted={subGroup?.is_completed || false}
            onResetMatch={() =>
              setConfirmDialog({ isOpen: true, type: "reset" })
            }
            onReclamation={() =>
              setConfirmDialog({ isOpen: true, type: "reclamation" })
            }
            onCancelMatch={() =>
              setConfirmDialog({ isOpen: true, type: "cancel" })
            }
          />

          {subGroup && (
            <FloatingMatchScore
              subGroup={subGroup}
              match={mergedMatch as Match}
              region1={subGroup?.region1}
              region2={subGroup?.region2}
            />
          )}
        </div>

        {/* Colonne de droite : timer, médias */}
        <div className="space-y-6">
          <MatchTimer
            matchId={mergedMatch?.id ?? 0}
            formattedTime={formattedTime}
            breakCount={breakCount}
            isRunning={isRunning}
            matchStatus={match?.status ?? mergedMatch?.status ?? ""}
            isSubGroupCompleted={subGroup?.is_completed || false}
            areBothFightersAssigned={
              !!(mergedMatch?.fighter1_id && mergedMatch?.fighter2_id)
            }
            onStart={startMatch}
            onPause={pauseMatch}
            onResume={resumeMatch}
            canStart={canStart}
            canPause={canPause}
            canResume={canResume}
            isUpdating={isUpdating}
          />

          <SubGroupRefereeManager
            subGroup={subGroup ?? undefined}
            match={mergedMatch as Match | undefined}
            currentMatchNumber={mergedMatch?.match_number}
            phaseType={phaseType}
          />

          <MediaManager
            matchId={mergedMatch?.id ?? 0}
            subGroupId={parsedSubGroupId}
            videoUrl={subGroup?.video_url}
            liveStreamUrl={mergedMatch?.video_url ?? undefined}
            onUpdateMatch={(updates) => updateMatchMutation.mutate(updates)}
            onUpdateSubGroup={(updates) =>
              updateSubGroupMutation.mutate(updates)
            }
            isSaving={isUpdating || updateSubGroupMutation.isPending}
          />
        </div>
      </div>

      {/* Dialogue de confirmation générique */}
      <Dialog
        open={
          confirmDialog.isOpen &&
          !["startSubGroup", "complete"].includes(confirmDialog.type)
        }
        onOpenChange={(open) =>
          setConfirmDialog((prev) => ({ ...prev, isOpen: open }))
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirmDialog.type === "winner" && "Confirmer la victoire"}
              {confirmDialog.type === "draw" && "Confirmer le match nul"}
              {confirmDialog.type === "cancel" && "Confirmer l'annulation"}
              {confirmDialog.type === "reclamation" &&
                "Confirmer la réclamation"}
              {confirmDialog.type === "reset" &&
                "Confirmer la réinitialisation"}
              {confirmDialog.type === "replaceFighter" &&
                "Confirmer le remplacement"}
              {confirmDialog.type === "removeFighter" &&
                "Confirmer la suppression"}
            </DialogTitle>
          </DialogHeader>
          <p>
            {confirmDialog.type === "winner" &&
              "Êtes-vous sûr de vouloir désigner ce lutteur vainqueur ?"}
            {confirmDialog.type === "draw" &&
              "Êtes-vous sûr de vouloir déclarer le match nul ?"}
            {confirmDialog.type === "cancel" &&
              "Êtes-vous sûr de vouloir annuler ce match ?"}
            {confirmDialog.type === "reclamation" &&
              "Êtes-vous sûr de vouloir activer le mode réclamation ?"}
            {confirmDialog.type === "reset" &&
              "Êtes-vous sûr de vouloir réinitialiser le match ? Cette action est irréversible."}
            {confirmDialog.type === "replaceFighter" &&
              "Êtes-vous sûr de vouloir remplacer ce lutteur ?"}
            {confirmDialog.type === "removeFighter" &&
              "Êtes-vous sûr de vouloir retirer ce lutteur du match ? Cette action peut être annulée en réassignant un lutteur."}
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                setConfirmDialog((prev) => ({ ...prev, isOpen: false }))
              }
            >
              Annuler
            </Button>
            <Button
              onClick={() => {
                switch (confirmDialog.type) {
                  case "winner":
                    if (confirmDialog.fighterId) {
                      const otherFighterId =
                        confirmDialog.fighterId === activeMatch?.fighter1_id
                          ? activeMatch?.fighter2_id
                          : activeMatch?.fighter1_id;
                      if (!otherFighterId) {
                        toast.info("Victoire par forfait - Repos obtenu");
                        handleCompleteMatch(confirmDialog.fighterId, undefined);
                      } else {
                        handleCompleteMatch(
                          confirmDialog.fighterId,
                          otherFighterId,
                        );
                      }
                    }
                    break;
                  case "draw":
                    handleSetDraw();
                    break;
                  case "reset":
                    handleResetMatch();
                    break;
                  case "reclamation":
                    handleReclamation();
                    toast.info("Mode réclamation activé");
                    break;
                  case "cancel":
                    updateMatchMutation.mutate({
                      status: "scheduled",
                      winner_fighter_id: null,
                      loser_fighter_id: null,
                      match_result: undefined,
                    });
                    pauseMatch();
                    setConfirmDialog((prev) => ({
                      ...prev,
                      isOpen: false,
                      type: "cancel",
                    }));
                    toast.success("Match annulé");
                    break;
                  case "replaceFighter":
                    if (confirmDialog.fighterId && confirmDialog.regionId) {
                      handleReplaceFighterRoute(
                        confirmDialog.fighterId,
                        confirmDialog.regionId,
                      );
                    }
                    break;
                  case "removeFighter":
                    if (confirmDialog.fighterId) {
                      handleRemoveFighterId(confirmDialog.fighterId);
                    }
                    break;
                }
              }}
              disabled={completeSubGroupMutation.isPending || isDialogLoading}
            >
              {isDialogLoading ? "Chargement..." : "Confirmer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bouton debug (uniquement en développement) */}
      {process.env.NODE_ENV === "development" && (
        <div className="fixed bottom-4 right-4 z-50">
          <Button
            variant="outline"
            size="sm"
            className="bg-background/80 backdrop-blur-sm shadow-lg border-primary/20"
            onClick={() => {
              console.log("🔍 [DEBUG] Realtime State:");
              console.log("  isConnected (RTDB):", isConnected);
              console.log("  hasLiveMatch (subGroup):", hasLiveMatch);
              console.log("  match status:", mergedMatch?.status);
              console.log("  realtimeMatchData:", realtimeMatchData);
              console.log("  subGroup:", subGroup);
              toast.info(
                `RTDB: ${isConnected ? "✅ Connecté" : "⏳ En attente"} | Match: ${mergedMatch?.status}`,
              );
            }}
          >
            <Bug className="h-4 w-4 mr-2 text-primary" />
            Debug
          </Button>
        </div>
      )}
    </div>
  );
}
