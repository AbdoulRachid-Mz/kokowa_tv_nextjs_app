// app/ad/sub-groups/[subGroupId]/matches/[matchId]/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Typography } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
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
  CheckCircle,
  Play,
} from "lucide-react";
import { useRealtime } from "@/hooks/use-realtime";
import { toast } from "sonner";
import { MediaManager } from "./media-manager";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import {
  completeSubGroup,
  getSubGroupById,
  updateSubGroup,
} from "@/actions/sub-groups";
import { getEditionFighters } from "@/actions/editions";
import { useMatchController } from "@/hooks/use-match-controller";
import { FighterControl } from "./fighter-control";
import { MatchControls } from "./match-controls";
import { MatchTimer } from "./match-timer";
import { addFighterCard, updateMatch } from "@/actions/matches-2";
import { MatchUpdate } from "@/lib/services/match-update.service";
import { FloatingMatchScore } from "./floating-match-score";
import { useAuthContext } from "@/contexts/auth-context";
import { Bug } from "lucide-react";

export default function MatchDetailPage() {
  const { subGroupId, matchId } = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const parsedMatchId = parseInt(matchId as string);
  const parsedSubGroupId = parseInt(subGroupId as string);
  const { user } = useAuthContext();
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

  // Realtime integration
  const { isConnected, subscribe, unsubscribe, subscribeToMatch, auth } =
    useRealtime({
      autoConnect: true,
      onMessage: (msg) => {
        if (msg.type === "update") {
          const { entityType, entityId, event } = msg.data;
          console.log(
            `📨 [WS Client] Realtime event: ${event} for ${entityType}:${entityId}`,
          );

          // ✅ Invalider TOUTES les requêtes du type concerné pour assurer la cohérence
          if (entityType === "match") {
            queryClient.invalidateQueries({ queryKey: ["match"] });
            queryClient.refetchQueries({ queryKey: ["match", parsedMatchId] });
          }

          if (entityType === "subGroup") {
            queryClient.invalidateQueries({ queryKey: ["sub-group"] });
            queryClient.refetchQueries({
              queryKey: ["sub-group", parsedSubGroupId],
            });
          }

          if (entityType === "fighter") {
            queryClient.invalidateQueries({ queryKey: ["fighter"] });
          }

          if (entityType === "edition") {
            queryClient.invalidateQueries({ queryKey: ["edition"] });
          }
        }
      },
    });

  // ✅ Gestion unique des souscriptions
  useEffect(() => {
    if (!isConnected) return;

    console.log("🔄 [WS] Subscribing to match and sub-group...");

    if (!isNaN(parsedMatchId)) {
      subscribeToMatch(parsedMatchId);
    }
    if (!isNaN(parsedSubGroupId)) {
      subscribe("subGroup", parsedSubGroupId);
    }

    // Auth automatique si l'utilisateur est connecté
    if (user?.userDocument?.id) {
      auth(
        user.userDocument.id.toString(),
        user.userDocument.fcm_token || "dummy_token",
      );
    }

    return () => {
      console.log("🔕 [WS] Unsubscribing from match and sub-group...");
      if (!isNaN(parsedMatchId)) {
        unsubscribe("match", parsedMatchId);
      }
      if (!isNaN(parsedSubGroupId)) {
        unsubscribe("subGroup", parsedSubGroupId);
      }
    };
  }, [
    isConnected,
    parsedMatchId,
    parsedSubGroupId,
    subscribeToMatch,
    subscribe,
    unsubscribe,
    user,
    auth,
  ]);

  // ==========================
  // CONTROLLER PRINCIPAL
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
    canComplete,
    canSetWinner,
    canSetDraw,
    isUpdating,
    updateSubGroupMutation,
  } = useMatchController({
    matchId: parsedMatchId,
    subGroupId: parsedSubGroupId,
  });

  // ==========================
  // QUERIES
  // ==========================
  const { data: subGroup, isLoading: isLoadingSubGroup } = useQuery({
    queryKey: ["sub-group", subGroupId],
    queryFn: async () => {
      return await getSubGroupById(parseInt(subGroupId as string), {
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
    enabled: !!subGroupId,
  });

  // ==========================
  // MUTATIONS
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
      queryClient.invalidateQueries({ queryKey: ["match", matchId] });
      toast.success("🟨 Carton jaune ajouté");
    },
    onError: () => {
      toast.error("Erreur lors de l'ajout du carton");
    },
  });

  const completeSubGroupMutation = useMutation({
    mutationFn: async () => {
      const result = await completeSubGroup(parsedSubGroupId);
      if (!result.success) throw new Error("Erreur lors de la finalisation");
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sub-group", subGroupId] });
      toast.success("Sous-groupe finalisé avec succès");
      setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erreur lors de la finalisation");
    },
  });

  const startSubGroupMutation = useMutation({
    mutationFn: async () => {
      setIsDialogLoading(true);
      const formData = new FormData();
      formData.append("status", "ongoing");
      const response = await updateSubGroup(parsedSubGroupId, formData);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sub-group", subGroupId] });
      toast.success("Sous-groupe démarré");
      setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
      setIsDialogLoading(false);
    },
    onError: () => {
      setIsDialogLoading(false);
    },
  });

  const updateMatchMutation = useMutation({
    mutationFn: async (updates: MatchUpdate) => {
      const response = await updateMatch(parsedMatchId, updates);
      console.log(response);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["match", parsedMatchId] });
    },
  });

  //handle removeFighterId on match
  const handleRemoveFighterId = (fighterId: number) => {
    setIsDialogLoading(true);
    const updates: MatchUpdate = {};

    if (match?.fighter1_id === fighterId) {
      updates.fighter1_id = null;
    } else if (match?.fighter2_id === fighterId) {
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

  //handleReplaceFigherRoute
  const handleReplaceFigherRoute = (fighterId: number, regionId: number) => {
    setIsDialogLoading(true);
    router.push(
      `/ad/editions/${subGroup?.group?.phase?.edition?.id}/fighters/replace?fighterId=${fighterId}&regionId=${regionId}`,
    );
    setIsDialogLoading(false);
  };

  // const updateSubGroupMutation = useMutation({
  //   mutationFn: async (updates: { video_url?: string }) => {
  //     const formData = new FormData();
  //     if (updates.video_url !== undefined) {
  //       formData.append("video_url", updates.video_url || "");
  //     }
  //     const response = await updateSubGroup(parsedSubGroupId, formData);
  //     return response;
  //   },
  //   onSuccess: () => {
  //     queryClient.invalidateQueries({ queryKey: ["sub-group", subGroupId] });
  //   },
  // });

  // ==========================
  // LOAD AVAILABLE FIGHTERS
  // ==========================
  // Dans page.tsx - fonction loadAvailableFighters
  const loadAvailableFighters = useCallback(async (sg: SubGroup) => {
    try {
      const editionId = sg.group?.phase?.edition?.id;
      if (!editionId) return;

      const loadRegionFighters = async (
        regionId?: number,
      ): Promise<Fighter[]> => {
        if (!regionId) return [];
        try {
          const response = await getEditionFighters(editionId, {
            region_id: regionId,
            sort_order: "asc",
            limit: 100,
            with_fighter: true,
          });

          // Extraire les fighters et les trier par nom
          const fighters =
            response.data?.map((e: { fighter: Fighter }) => e.fighter) || [];

          // ✅ Tri alphabétique (A à Z) par prénom + nom
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
      toast.error("Erreur lors du chargement des lutteurs");
    }
  }, []);

  // ==========================
  // EFFECTS
  // ==========================
  useEffect(() => {
    if (!isConnected) return;

    // Subscribe to current match
    if (!isNaN(parsedMatchId)) {
      subscribeToMatch(parsedMatchId);
    }

    // Subscribe to sub-group
    if (!isNaN(parsedSubGroupId)) {
      subscribe("subGroup", parsedSubGroupId);
    }

    // Cleanup: unsubscribe when component unmounts
    return () => {
      if (!isNaN(parsedMatchId)) {
        unsubscribe("match", parsedMatchId);
      }
      if (!isNaN(parsedSubGroupId)) {
        unsubscribe("subGroup", parsedSubGroupId);
      }
    };
  }, [
    isConnected,
    parsedMatchId,
    parsedSubGroupId,
    subscribeToMatch,
    subscribe,
    unsubscribe,
  ]);

  useEffect(() => {
    if (subGroup) {
      loadAvailableFighters(subGroup);
    }
  }, [subGroup, loadAvailableFighters]);

  // ==========================
  // UTILS
  // ==========================
  const formatTimeForCard = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // ==========================
  // COMPUTED
  // ==========================
  const matches = subGroup?.matches as Match[] || [];
  const totalMatches = matches.length;
  const completedMatches = matches.filter(
    (m) => m.status === "completed",
  ).length;
  const allMatchesCompleted =
    totalMatches > 0 && totalMatches === completedMatches;
  const currentIndex = matches.findIndex((m) => m.id === parsedMatchId);
  const isLastMatch = currentIndex === totalMatches - 1;

  const canFinalize =
    isLastMatch && allMatchesCompleted && !subGroup?.is_completed;
  const canStartSubGroup =
    subGroup?.status === "upcoming" && currentIndex === 0;

  const handleAddCard = (fighterId: number) => {
    addCardMutation.mutate({ fighterId });
  };

  // Utilisez directement les props du controller
  const handleCompleteMatch = (winnerId: number, loserId: number | undefined) => {
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

  const handleCompleteSubGroup = () => {
    completeSubGroupMutation.mutate();
  };

  const handleStartSubGroup = () => {
    startSubGroupMutation.mutate();
  };

  const navigateToMatch = (direction: "prev" | "next") => {
    const newIndex = direction === "prev" ? currentIndex - 1 : currentIndex + 1;
    if (newIndex >= 0 && newIndex < totalMatches) {
      router.push(
        `/ad/sub-groups/${subGroupId}/matches/${matches[newIndex].id}`,
      );
    }
  };

  if (!match || isLoadingSubGroup) {
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
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <Button
            variant="ghost"
            onClick={() => router.push(`/ad/sub-groups/${subGroupId}`)}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            <span className="max-md:hidden">Retour</span>
          </Button>
          {subGroup?.name && (
            <Typography className="flex max-md:flex-col gap-2">
              <span>{subGroup.name}</span>
              <span className="max-md:hidden">-</span>
              <span>
                {match.match_date
                  ? new Date(match.match_date).toLocaleDateString("fr-FR")
                  : "Date non définie"}
                {match.start_time && ` à ${match.start_time.slice(0, 5)}`}
              </span>
            </Typography>
          )}
          <div className="flex items-center gap-3">
            <div
              className={`w-3 h-3 rounded-full ${
                isConnected ? "bg-green-500 animate-pulse" : "bg-red-500"
              }`}
            />
            <Badge variant={isConnected ? "default" : "outline"}>
              {isConnected ? "Temps réel actif" : "Hors ligne"}
            </Badge>
          </div>
        </div>

        {/* Démarrage sous-groupe */}
        {/* {canStartSubGroup && (
          <Card className="mb-6 border-blue-500 bg-blue-50/50">
            <CardContent className="py-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <Play className="h-6 w-6 text-blue-600" />
                  <div>
                    <Typography variant="h6" weight="bold" className="text-blue-700">
                      Premier match du sous-groupe
                    </Typography>
                    <Typography variant="body-sm" className="text-blue-600">
                      Démarrez le sous-groupe pour commencer
                    </Typography>
                  </div>
                </div>
                <Dialog
                  open={confirmDialog.isOpen && confirmDialog.type === "startSubGroup"}
                  onOpenChange={(open) =>
                    setConfirmDialog(open ? { isOpen: true, type: "startSubGroup" } : { ...confirmDialog, isOpen: false })
                  }
                >
                  <DialogTrigger asChild>
                    <Button className="bg-blue-600 hover:bg-blue-700">
                      <Play className="h-4 w-4 mr-2" />
                      Démarrer le sous-groupe
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Démarrer le sous-groupe</DialogTitle>
                    </DialogHeader>
                    <p>Êtes-vous sûr de vouloir démarrer ce sous-groupe ?</p>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
                      >
                        Annuler
                      </Button>
                      <Button onClick={handleStartSubGroup}>Confirmer</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        )} */}

        {/* Navigation entre matchs */}
        <div className="flex justify-between items-center bg-card p-4 rounded-lg border">
          <Button
            variant="outline"
            onClick={() => navigateToMatch("prev")}
            disabled={currentIndex === 0}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            <span className="max-md:hidden">Précédent</span>
          </Button>
          <div className="text-center">
            <Typography variant="h3" weight="bold">
              Match #{match.match_number || "N/A"}
            </Typography>
            <div className="flex items-center gap-2 justify-center mt-1">
              <Badge variant="outline" className="text-xs">
                {currentIndex + 1}/{totalMatches}
              </Badge>
              <Badge
                variant={match.status === "live" ? "destructive" : "secondary"}
              >
                {match.status === "live" ? "🔴 EN DIRECT" : match.status}
              </Badge>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => navigateToMatch("next")}
            disabled={currentIndex === totalMatches - 1}
          >
            <span className="max-md:hidden">Suivant</span>
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>

      {/* Bannière de finalisation */}
      {/* {canFinalize && (
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
                <Dialog
                  open={confirmDialog.isOpen && confirmDialog.type === "complete"}
                  onOpenChange={(open) =>
                    setConfirmDialog(open ? { isOpen: true, type: "complete" } : { ...confirmDialog, isOpen: false })
                  }
                >
                  <DialogTrigger asChild>
                    <Button className="bg-green-600 hover:bg-green-700">
                      <Trophy className="h-4 w-4 mr-2" />
                      Finaliser le sous-groupe
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Finaliser le sous-groupe</DialogTitle>
                    </DialogHeader>
                    <p>
                      Êtes-vous sûr de vouloir finaliser ce sous-groupe ? Cette action est
                      irréversible.
                    </p>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
                      >
                        Annuler
                      </Button>
                      <Button
                        onClick={handleCompleteSubGroup}
                        disabled={completeSubGroupMutation.isPending}
                      >
                        Confirmer
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        </div>
      )} */}

      {/* Contenu principal */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne de gauche (2/3) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Fighters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
            <FighterControl
              fighter={match.fighter1}
              fighterType="fighter1"
              match={match as Match}
              onUpdateMatch={(updates) => {
                updateMatchMutation.mutate(updates);
              }}
              onAddCard={handleAddCard}
              availableFighters={availableFighters.region1}
              currentTime={elapsed}
              yellowCardCount={
                match.cards?.filter(
                  (c) =>
                    c.fighter_id === match.fighter1_id &&
                    c.card_type === "yellow",
                ).length || 0
              }
              isSubGroupCompleted={subGroup?.is_completed || false}
              matchStatus={match.status}
              canSetWinner={canSetWinner}
              canSetDraw={canSetDraw}
              onCompleteWithWinner={() => {
                if (!match.fighter1) return;
                setConfirmDialog({
                  isOpen: true,
                  type: "winner",
                  fighterId: match.fighter1_id ?? undefined,
                  opponentId: match.fighter2_id ?? undefined,
                });
              }}
              onSetDraw={() => setConfirmDialog({ isOpen: true, type: "draw" })}
              onReplaceFighter={handleReplaceFigherRoute}
              onAskRemoveFighter={(fighterId) => {
                setConfirmDialog({
                  isOpen: true,
                  type: "removeFighter",
                  fighterId,
                });
              }}
              onAskReplaceFighter={(fighterId) => {
                setConfirmDialog({
                  isOpen: true,
                  type: "replaceFighter",
                  fighterId,
                  regionId: subGroup?.region1_id,
                });
              }}
            />

            <div className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 hidden md:block">
              <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg border-4 border-background">
                <Typography variant="body-lg" weight="bold">
                  VS
                </Typography>
              </div>
            </div>

            <FighterControl
              fighter={match.fighter2}
              fighterType="fighter2"
              match={match as Match}
              onUpdateMatch={(updates) => {
                updateMatchMutation.mutate(updates);
              }}
              onAddCard={handleAddCard}
              availableFighters={availableFighters.region2}
              currentTime={elapsed}
              yellowCardCount={
                match.cards?.filter(
                  (c) =>
                    c.fighter_id === match.fighter2_id &&
                    c.card_type === "yellow",
                ).length || 0
              }
              isSubGroupCompleted={subGroup?.is_completed || false}
              matchStatus={match.status}
              canSetWinner={canSetWinner}
              canSetDraw={canSetDraw}
              onCompleteWithWinner={() => {
                if (!match.fighter2 || !match.fighter1) return;
                setConfirmDialog({
                  isOpen: true,
                  type: "winner",
                  fighterId: match.fighter2_id ?? undefined,
                  opponentId: match.fighter1_id ?? undefined,
                });
              }}
              onSetDraw={() => setConfirmDialog({ isOpen: true, type: "draw" })}
              onReplaceFighter={handleReplaceFigherRoute}
              onAskRemoveFighter={(fighterId) => {
                setConfirmDialog({
                  isOpen: true,
                  type: "removeFighter",
                  fighterId,
                });
              }}
              onAskReplaceFighter={(fighterId) => {
                setConfirmDialog({
                  isOpen: true,
                  type: "replaceFighter",
                  fighterId,
                  regionId: subGroup?.region2_id,
                });
              }}
            />
          </div>

          {/* Contrôles */}
          <MatchControls
            match={match as Match}
            onUpdateMatch={(updates) => {
              updateMatchMutation.mutate(updates);
            }}
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

          {/* Informations supplémentaires */}
          {/* <Card>
            <CardContent className="space-y-4 pt-6">
              <div>
                <Typography variant="body-sm" weight="medium" theme="muted">
                  Rencontre
                </Typography>
                <Typography>{subGroup?.name}</Typography>
              </div>
              <div>
                <Typography variant="body-sm" weight="medium" theme="muted">
                  Date et heure
                </Typography>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <Typography>
                    {match.match_date
                      ? new Date(match.match_date).toLocaleDateString("fr-FR")
                      : "Date non définie"}
                    {match.start_time && ` à ${match.start_time.slice(0, 5)}`}
                  </Typography>
                </div>
              </div>
              {match.notes && (
                <div>
                  <Typography variant="body-sm" weight="medium" theme="muted">
                    Notes
                  </Typography>
                  <Typography
                    variant="body-sm"
                    className="italic bg-muted/30 p-3 rounded"
                  >
                    {match.notes}
                  </Typography>
                </div>
              )}
            </CardContent>
          </Card> */}
        </div>

        {/* Colonne de droite (1/3) */}
        <div className="space-y-6">
          <MatchTimer
            matchId={match.id}
            formattedTime={formattedTime}
            breakCount={breakCount}
            isRunning={isRunning}
            matchStatus={match.status}
            isSubGroupCompleted={subGroup?.is_completed || false}
            areBothFightersAssigned={
              !!(match?.fighter1_id && match?.fighter2_id)
            }
            onStart={startMatch}
            onPause={pauseMatch}
            onResume={resumeMatch}
            canStart={canStart}
            canPause={canPause}
            canResume={canResume}
          />

          <MediaManager
            matchId={match.id}
            subGroupId={parsedSubGroupId}
            videoUrl={subGroup?.video_url}
            liveStreamUrl={match.video_url ?? undefined}
            onUpdateMatch={(updates: { video_url?: string }) => {
              updateMatchMutation.mutate(updates);
            }}
            onUpdateSubGroup={(updates: { video_url?: string }) => {
              updateSubGroupMutation.mutate(updates);
            }}
            isSaving={isUpdating || updateSubGroupMutation.isPending}
          />
        </div>

        <div className="max-w-7xl mx-auto mb-6 hidden md:block">
          <FloatingMatchScore
            subGroup={subGroup!}
            match={match as Match}
            region1={subGroup?.region1}
            region2={subGroup?.region2}
          />
          <div className="md:hidden">
            <FloatingMatchScore
              subGroup={subGroup!}
              match={match as Match}
              region1={subGroup?.region1}
              region2={subGroup?.region2}
            />
          </div>
        </div>
      </div>

      {/* Dialog de confirmation générique */}
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
                      // Vérifier si l'adversaire existe
                      const otherFighterId =
                        confirmDialog.fighterId === match?.fighter1_id
                          ? match?.fighter2_id
                          : match?.fighter1_id;

                      if (!otherFighterId) {
                        // ✅ Victoire par forfait - passer undefined/null au lieu de -1
                        toast.info("Victoire par forfait - Repos obtenu");
                        handleCompleteMatch(confirmDialog.fighterId, undefined);
                      } else {
                        // Victoire normale
                        handleCompleteMatch(
                          confirmDialog.fighterId,
                          otherFighterId
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
                    if (confirmDialog.fighterId && confirmDialog.regionId!) {
                      handleReplaceFigherRoute?.(
                        confirmDialog.fighterId,
                        confirmDialog.regionId!,
                      );
                    }
                    break;
                  case "removeFighter":
                    if (confirmDialog.fighterId) {
                      handleRemoveFighterId(confirmDialog.fighterId);
                      // setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
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

      {/* ✅ Composant de debug flottant (uniquement en dev) */}
      {process.env.NODE_ENV === "development" && (
        <div className="fixed bottom-4 right-4 z-50">
          <Button
            variant="outline"
            size="sm"
            className="bg-background/80 backdrop-blur-sm shadow-lg border-primary/20"
            onClick={() => {
              console.log("🔍 [DEBUG] WebSocket State:");
              console.log("  isConnected:", isConnected);
              console.log("  match status:", match?.status);
              console.log("  match data:", match);
              console.log("  subGroup data:", subGroup);
              console.log(
                "  query cache match:",
                queryClient.getQueryData(["match", parsedMatchId]),
              );
              console.log(
                "  query cache subGroup:",
                queryClient.getQueryData(["sub-group", parsedSubGroupId]),
              );

              toast.info(
                `WS: ${isConnected ? "✅ Connecté" : "❌ Déconnecté"} | Match: ${match?.status}`,
              );
            }}
          >
            <Bug className="h-4 w-4 mr-2 text-primary" />
            Debug WS
          </Button>
        </div>
      )}
    </div>
  );
}
