// app/(admins)/ad/phase-groups/[groupId]/organisation/page.tsx
"use client";

import { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { Typography } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Match, Fighter, Region } from "@/types";
import {
  ArrowLeft,
  Swords,
  Trophy,
  Users,
  Calendar,
  Layers,
  Sparkles,
  ExternalLink,
  Edit,
  Trash2,
  Clock,
  MapPin,
  RefreshCw,
  Plus,
} from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getPhaseGroupById } from "@/actions/phase-groups";
import { getMatches, createEliminationMatch } from "@/actions/matches";
import { updateMatch } from "@/actions/matches-2";
import { getEditionFighters, getEditionRegions } from "@/actions/editions";
import { getReferees } from "@/actions/referees";
import { assignSubGroupReferee } from "@/actions/sub-group-referee";
import { Referee } from "@/types";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  EliminationMatchCreator,
  EliminationFighter,
} from "./elimination-match-creator";
import { EliminationBulkMatchCreator } from "./elimination-bulk-match-creator";
import { EntityList } from "@/components/shared/entity-list";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function EliminationMatchOrganisationPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const groupId = params.groupId as string;
  const parsedGroupId = parseInt(groupId);

  const [creationMode, setCreationMode] = useState<"bulk" | "single">("bulk");
  const [isCreating, setIsCreating] = useState(false);
  const [matchToDelete, setMatchToDelete] = useState<number | null>(null);
  const [matchToEdit, setMatchToEdit] = useState<Match | null>(null);
  const [editFormData, setEditFormData] = useState({
    status: "",
    notes: "",
    match_number: 0,
  });

  // 1. Charger les données du groupe de phase avec relations
  const { data: group, isLoading: isLoadingGroup } = useQuery({
    queryKey: ["phase-group-org", parsedGroupId],
    queryFn: async () => {
      return await getPhaseGroupById(parsedGroupId, {
        with_relations: true,
        relations: {
          with_phase: true,
          with_edition: true,
          with_subGroups: true,
          with_matches: true,
        },
      });
    },
    enabled: !isNaN(parsedGroupId),
  });

  const editionId = group?.phase?.edition?.id ?? null;

  // 2. Charger tous les matches du groupe
  const {
    data: matchesData,
    isLoading: isLoadingMatches,
    refetch: refetchMatches,
  } = useQuery({
    queryKey: ["phase-group-matches", parsedGroupId],
    queryFn: async () => {
      const response = await getMatches({
        group_id: parsedGroupId,
        limit: 100,
        with_sub_group: true,
        with_fighters: true,
      });
      return response.data || [];
    },
    enabled: !isNaN(parsedGroupId),
  });

  const matches = useMemo(() => {
    if (!matchesData) return [];
    return [...matchesData].sort(
      (a, b) => (a.match_number ?? 1) - (b.match_number ?? 1)
    );
  }, [matchesData]);

  // 3. Charger tous les lutteurs non éliminés de l'édition
  const {
    data: editionFightersData,
    isLoading: isLoadingFighters,
    refetch: refetchFighters,
  } = useQuery({
    queryKey: ["edition-active-fighters", editionId],
    queryFn: async () => {
      if (!editionId) return [];
      const response = await getEditionFighters(editionId, {
        is_eliminated: false,
        limit: 300,
        with_fighter: true,
        with_region: true,
        sort_by: "ranking",
        sort_order: "asc",
      });

      // Extraire et formater la liste
      const list: EliminationFighter[] = [];
      if (response.data) {
        response.data.forEach((item: any) => {
          if (item.fighter) {
            const region = item.region || item.fighter.region;
            const regionId = region?.id ?? item.region_id ?? item.fighter.region_id;
            list.push({
              ...item.fighter,
              region_id: regionId,
              region: region ? { ...region, id: regionId } : undefined,
              is_eliminated: item.is_eliminated,
            });
          }
        });
      }
      return list;
    },
    enabled: !!editionId,
  });

  // 3b. Charger tous les combattants de l'édition (y compris éliminés pour mode exceptionnel)
  const { data: allEditionFightersData } = useQuery({
    queryKey: ["edition-all-fighters", editionId],
    queryFn: async () => {
      if (!editionId) return [];
      const response = await getEditionFighters(editionId, {
        limit: 300,
        with_fighter: true,
        with_region: true,
      });
      const list: EliminationFighter[] = [];
      if (response.data) {
        response.data.forEach((item: any) => {
          if (item.fighter) {
            const region = item.region || item.fighter.region;
            const regionId = region?.id ?? item.region_id ?? item.fighter.region_id;
            list.push({
              ...item.fighter,
              region_id: regionId,
              region: region ? { ...region, id: regionId } : undefined,
              is_eliminated: item.is_eliminated,
            });
          }
        });
      }
      return list;
    },
    enabled: !!editionId,
  });

  // 3c. Charger tous les arbitres actifs pour assignation au sous-groupe
  const { data: refereesData } = useQuery({
    queryKey: ["referees-active"],
    queryFn: async () => {
      const response = await getReferees({ is_active: true, limit: 100 });
      return response.data || [];
    },
  });

  // 4. Charger les régions de l'édition pour les filtres
  const { data: regionsData } = useQuery({
    queryKey: ["edition-regions", editionId],
    queryFn: async () => {
      if (!editionId) return [];
      const response = await getEditionRegions(editionId, {
        limit: 50,
        with_region: true,
      });
      return response.data?.map((er: any) => er.region).filter(Boolean) || [];
    },
    enabled: !!editionId,
  });

  // Consolider toutes les régions disponibles
  const allRegions = useMemo(() => {
    const map = new Map<number, Region>();
    if (regionsData) {
      regionsData.forEach((r: Region) => {
        if (r && r.id) map.set(r.id, r);
      });
    }
    if (editionFightersData) {
      editionFightersData.forEach((f) => {
        if (f.region && f.region.id && !map.has(f.region.id)) {
          map.set(f.region.id, f.region);
        }
      });
    }
    return Array.from(map.values()).sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  }, [regionsData, editionFightersData]);

  // Lutteurs déjà engagés dans ce tour (ont déjà un match programmé ou fait)
  const usedFighterIds = useMemo(() => {
    const ids = new Set<number>();
    matches.forEach((m) => {
      if (m.status !== "cancelled") {
        if (m.fighter1_id) ids.add(m.fighter1_id);
        if (m.fighter2_id) ids.add(m.fighter2_id);
      }
    });
    return ids;
  }, [matches]);

  // Lutteurs disponibles pour appariement (non éliminés et sans match dans ce groupe)
  const availableFighters = useMemo(() => {
    if (!editionFightersData) return [];
    return editionFightersData.filter((f) => !usedFighterIds.has(f.id));
  }, [editionFightersData, usedFighterIds]);

  // État de pagination et filtres pour la liste des matchs (EntityList)
  const [matchesPage, setMatchesPage] = useState(1);
  const [matchesLimit, setMatchesLimit] = useState(10);
  const [matchesSearch, setMatchesSearch] = useState("");
  const [matchesFilters, setMatchesFilters] = useState<Record<string, any>>({});
  const [matchesViewMode, setMatchesViewMode] = useState<
    "grid" | "list" | "compact" | "carousel"
  >("grid");

  // Filtrer les matches de la phase
  const filteredMatches = useMemo(() => {
    return matches.filter((m) => {
      // Filtre statut
      if (
        matchesFilters.status &&
        matchesFilters.status !== "all" &&
        m.status !== matchesFilters.status
      ) {
        return false;
      }

      // Filtre période (matin / soir)
      if (
        matchesFilters.period &&
        matchesFilters.period !== "all" &&
        m.sub_group?.period !== matchesFilters.period
      ) {
        return false;
      }

      // Filtre recherche textuelle
      if (matchesSearch.trim()) {
        const query = matchesSearch.toLowerCase().trim();
        const f1Name =
          `${m.fighter1?.first_name || ""} ${m.fighter1?.last_name || ""} ${m.fighter1?.nickname || ""}`.toLowerCase();
        const f2Name =
          `${m.fighter2?.first_name || ""} ${m.fighter2?.last_name || ""} ${m.fighter2?.nickname || ""}`.toLowerCase();
        const numStr = String(m.match_number || "");
        return (
          f1Name.includes(query) ||
          f2Name.includes(query) ||
          numStr.includes(query)
        );
      }

      return true;
    });
  }, [matches, matchesSearch, matchesFilters]);

  // Paginer les matches
  const paginatedMatches = useMemo(() => {
    if (matchesViewMode === "carousel") {
      return filteredMatches.slice(0, matchesLimit);
    }
    const start = (matchesPage - 1) * matchesLimit;
    return filteredMatches.slice(start, start + matchesLimit);
  }, [filteredMatches, matchesPage, matchesLimit, matchesViewMode]);

  // Création d'un match d'élimination unique
  const handleCreateMatch = async (
    fighter1Id: number | null,
    fighter2Id: number | null,
    period: "matin" | "soir" = "matin",
    isExceptional: boolean = false,
    refereeId?: number | null
  ) => {
    try {
      setIsCreating(true);
      await createEliminationMatch(parsedGroupId, {
        fighter1_id: fighter1Id,
        fighter2_id: fighter2Id,
        period,
        is_exceptional: isExceptional,
        referee_id: refereeId,
      });

      toast.success("Match créé avec succès !");

      // Invalider les caches pour mettre à jour l'interface
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["phase-group-matches", parsedGroupId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["phase-group-org", parsedGroupId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["edition-active-fighters", editionId],
        }),
      ]);
    } catch (error: any) {
      console.error("Erreur création match élimination:", error);
      toast.error(error.message || "Erreur lors de la création du match");
    } finally {
      setIsCreating(false);
    }
  };

  // Création multiple des matchs d'élimination
  const handleCreateBulkMatches = async (
    matchesToCreate: {
      fighter1Id: number | null;
      fighter2Id: number | null;
      period?: "matin" | "soir";
      refereeId?: number | null;
      isExceptional?: boolean;
    }[]
  ) => {
    try {
      setIsCreating(true);
      let successCount = 0;
      for (const m of matchesToCreate) {
        await createEliminationMatch(parsedGroupId, {
          fighter1_id: m.fighter1Id,
          fighter2_id: m.fighter2Id,
          period: m.period || "matin",
          is_exceptional: m.isExceptional,
          referee_id: m.refereeId,
        });
        successCount++;
      }

      toast.success(`${successCount} match(s) créé(s) avec succès !`);

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["phase-group-matches", parsedGroupId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["phase-group-org", parsedGroupId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["edition-active-fighters", editionId],
        }),
      ]);
    } catch (error: any) {
      console.error("Erreur création multiple:", error);
      toast.error(error.message || "Erreur lors de la création des matchs");
    } finally {
      setIsCreating(false);
    }
  };

  // Édition d'un match
  const handleEditMatch = (match: Match) => {
    setMatchToEdit(match);
    setEditFormData({
      status: match.status,
      notes: match.notes || "",
      match_number: match.match_number || 1,
    });
  };

  const submitEditMatch = async () => {
    if (!matchToEdit) return;

    try {
      await updateMatch(matchToEdit.id, {
        status: editFormData.status as Match["status"],
        notes: editFormData.notes || undefined,
        match_number: editFormData.match_number,
      });

      toast.success("Match mis à jour");
      queryClient.invalidateQueries({
        queryKey: ["phase-group-matches", parsedGroupId],
      });
      setMatchToEdit(null);
    } catch (error: any) {
      console.error("Erreur mise à jour match:", error);
      toast.error(error.message || "Erreur lors de la modification");
    }
  };

  // Suppression d'un match
  const confirmDeleteMatch = async () => {
    if (!matchToDelete) return;

    try {
      await api.delete(`/api/matches/${matchToDelete}`);
      toast.success("Match supprimé");
      await queryClient.invalidateQueries({
        queryKey: ["phase-group-matches", parsedGroupId],
      });
      setMatchToDelete(null);
    } catch (error) {
      console.error("Erreur suppression match:", error);
      toast.error("Erreur lors de la suppression du match");
    }
  };

  const isLoading = isLoadingGroup || isLoadingMatches || isLoadingFighters;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <RefreshCw className="h-10 w-10 animate-spin text-primary" />
        <Typography variant="body-base" theme="muted">
          Chargement de l'organisation des matchs...
        </Typography>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="text-center py-12 space-y-4">
        <Typography variant="h4">Groupe non trouvé</Typography>
        <Button onClick={() => router.push("/ad/phase-groups")}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Retour aux groupes
        </Button>
      </div>
    );
  }

  const phaseTypeLabel = (type?: string) => {
    switch (type) {
      case "quarterfinal":
        return "1/4 de Finale";
      case "semifinal":
        return "1/2 Finale";
      case "final":
        return "Grande Finale";
      case "third_place":
        return "3e Place";
      case "knockout":
        return "Élimination Directe";
      default:
        return type || "Élimination";
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* En-tête */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-4">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/ad/phase-groups/${groupId}`)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour au Groupe
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <Typography variant="h4" weight="bold">
                {group.name}
              </Typography>
              <Badge variant="default" className="bg-primary capitalize">
                {phaseTypeLabel(group.phase?.phase_type)}
              </Badge>
            </div>
            <Typography variant="body-sm" theme="muted">
              {group.phase?.name} • Édition{" "}
              {group.phase?.edition?.edition_number} (
              {group.phase?.edition?.year})
            </Typography>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              refetchMatches();
              refetchFighters();
              toast.info("Données actualisées");
            }}
          >
            <RefreshCw className="h-4 w-4 mr-2" /> Actualiser
          </Button>
        </div>
      </div>

      {/* Cartes de Statistiques */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <Typography variant="caption1" theme="muted">
                Matchs du Tour
              </Typography>
              <Typography variant="h4" weight="bold">
                {matches.length}
              </Typography>
            </div>
            <div className="p-2.5 bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 rounded-xl">
              <Swords className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <Typography variant="caption1" theme="muted">
                Terminés
              </Typography>
              <Typography variant="h4" weight="bold" className="text-green-600">
                {matches.filter((m) => m.status === "completed").length}
              </Typography>
            </div>
            <div className="p-2.5 bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 rounded-xl">
              <Trophy className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <Typography variant="caption1" theme="muted">
                Lutteurs en Lice Restants
              </Typography>
              <Typography
                variant="h4"
                weight="bold"
                className="text-orange-600"
              >
                {availableFighters.length}
              </Typography>
            </div>
            <div className="p-2.5 bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300 rounded-xl">
              <Users className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <Typography variant="caption1" theme="muted">
                Total Invaincus Édition
              </Typography>
              <Typography variant="h4" weight="bold">
                {editionFightersData?.length || 0}
              </Typography>
            </div>
            <div className="p-2.5 bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 rounded-xl">
              <Sparkles className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sélecteur de Mode de Création & Créateur de Combat */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <Typography variant="h5" weight="bold" className="flex items-center gap-2">
            <Swords className="h-5 w-5 text-primary" />
            Programmation des Combats
          </Typography>
          <div className="flex items-center gap-1 bg-muted p-1 rounded-lg border">
            <Button
              variant={creationMode === "bulk" ? "default" : "ghost"}
              size="sm"
              onClick={() => setCreationMode("bulk")}
              className="text-xs h-7 px-3"
            >
              Création Multiple
            </Button>
            <Button
              variant={creationMode === "single" ? "default" : "ghost"}
              size="sm"
              onClick={() => setCreationMode("single")}
              className="text-xs h-7 px-3"
            >
              Création Simple
            </Button>
          </div>
        </div>

        {creationMode === "bulk" ? (
          <EliminationBulkMatchCreator
            availableFighters={availableFighters}
            allEditionFighters={allEditionFightersData || []}
            regions={allRegions}
            referees={refereesData || []}
            onCreateMatches={handleCreateBulkMatches}
            isCreating={isCreating}
          />
        ) : (
          <EliminationMatchCreator
            availableFighters={availableFighters}
            allEditionFighters={allEditionFightersData || []}
            regions={allRegions}
            referees={refereesData || []}
            onCreateMatch={handleCreateMatch}
            isCreating={isCreating}
          />
        )}
      </div>

      {/* Liste des Combats Déjà Programmés avec EntityList */}
      <EntityList<Match>
        title="Matchs de la Phase"
        description={`Combats organisés pour cette phase (${matches.length})`}
        entityType="matches"
        data={paginatedMatches}
        total={filteredMatches.length}
        loading={isLoadingMatches}
        page={matchesPage}
        limit={matchesLimit}
        onPageChange={setMatchesPage}
        onLimitChange={(lim) => {
          setMatchesLimit(lim);
          setMatchesPage(1);
        }}
        searchTerm={matchesSearch}
        onSearchChange={(search) => {
          setMatchesSearch(search);
          setMatchesPage(1);
        }}
        filters={matchesFilters}
        onFilterChange={(f) => {
          setMatchesFilters(f);
          setMatchesPage(1);
        }}
        onRefresh={() => {
          refetchMatches();
          refetchFighters();
        }}
        viewMode={matchesViewMode}
        onViewModeChange={setMatchesViewMode}
        availableFilters={[
          {
            key: "period",
            label: "Période",
            options: [
              { value: "all", label: "Toutes périodes" },
              { value: "matin", label: "🌅 Matin" },
              { value: "soir", label: "🌙 Soir" },
            ],
          },
        ]}
        customHeader={
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <Typography variant="h5" weight="bold" className="flex items-center gap-2">
                <Swords className="h-5 w-5 text-primary" />
                Matchs de la Phase ({matches.length})
              </Typography>
              <Typography variant="body-sm" theme="muted">
                Consultez, supervisez et organisez les combats de ce tour d'élimination
              </Typography>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {filteredMatches.length} combat(s)
              </Badge>
            </div>
          </div>
        }
        renderCard={(match, viewMode) => {
          const isCompleted = match.status === "completed";
          const isLive = match.status === "live";
          const period = match.sub_group?.period;

          return (
            <Card
              key={match.id}
              className={`relative transition-all hover:shadow-md border ${
                isLive
                  ? "border-red-500 bg-red-50/20"
                  : isCompleted
                  ? "border-green-500/40"
                  : ""
              }`}
            >
              <CardHeader className="p-3 pb-2 flex flex-row items-center justify-between space-y-0 border-b bg-muted/10">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <Badge variant="outline" className="font-bold">
                    #{match.match_number || "?"}
                  </Badge>
                  <Badge
                    variant={
                      isLive
                        ? "destructive"
                        : isCompleted
                        ? "default"
                        : "secondary"
                    }
                    className={
                      isCompleted ? "bg-green-600 text-white" : ""
                    }
                  >
                    {isLive
                      ? "🔴 En Direct"
                      : isCompleted
                      ? "✓ Terminé"
                      : "Programmé"}
                  </Badge>
                  {period && (
                    <Badge variant="outline" className="text-[10px] h-5 bg-muted/50">
                      {period === "matin" ? "🌅 Matin" : "🌙 Soir"}
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditMatch(match)}
                    className="h-7 w-7 p-0"
                  >
                    <Edit className="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setMatchToDelete(match.id)}
                    className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="p-4 space-y-3">
                {/* Confrontation des Lutteurs */}
                <div className="flex items-center justify-between gap-3">
                  {/* Lutteur 1 */}
                  <div className="flex-1 text-center min-w-0">
                    <Avatar className="h-12 w-12 mx-auto mb-1 border-2 border-primary/20">
                      <AvatarImage src={match.fighter1?.profile_image} />
                      <AvatarFallback>
                        {match.fighter1?.first_name?.[0]}
                        {match.fighter1?.last_name?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <Typography
                      variant="body-sm"
                      weight="bold"
                      className="truncate"
                    >
                      {match.fighter1?.first_name}{" "}
                      {match.fighter1?.last_name}
                    </Typography>
                    {match.fighter1?.nickname && (
                      <Typography
                        variant="caption2"
                        theme="muted"
                        className="italic truncate block"
                      >
                        "{match.fighter1.nickname}"
                      </Typography>
                    )}
                    {match.fighter1?.region && (
                      <Badge
                        variant="outline"
                        className="text-[10px] h-4 px-1.5 mt-1"
                      >
                        {match.fighter1.region.name}
                      </Badge>
                    )}
                    {match.winner_fighter_id === match.fighter1_id && (
                      <Badge className="bg-green-600 text-white text-[10px] h-4 mt-1">
                        🏆 Vainqueur
                      </Badge>
                    )}
                  </div>

                  {/* VS */}
                  <div className="flex flex-col items-center px-2">
                    <Swords className="h-5 w-5 text-muted-foreground mb-1" />
                    <span className="text-xs font-bold text-muted-foreground">
                      VS
                    </span>
                    {match.total_duration && (
                      <span className="text-[10px] font-mono text-muted-foreground mt-1">
                        {match.total_duration}
                      </span>
                    )}
                  </div>

                  {/* Lutteur 2 */}
                  <div className="flex-1 text-center min-w-0">
                    <Avatar className="h-12 w-12 mx-auto mb-1 border-2 border-primary/20">
                      <AvatarImage src={match.fighter2?.profile_image} />
                      <AvatarFallback>
                        {match.fighter2?.first_name?.[0]}
                        {match.fighter2?.last_name?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <Typography
                      variant="body-sm"
                      weight="bold"
                      className="truncate"
                    >
                      {match.fighter2?.first_name}{" "}
                      {match.fighter2?.last_name}
                    </Typography>
                    {match.fighter2?.nickname && (
                      <Typography
                        variant="caption2"
                        theme="muted"
                        className="italic truncate block"
                      >
                        "{match.fighter2.nickname}"
                      </Typography>
                    )}
                    {match.fighter2?.region && (
                      <Badge
                        variant="outline"
                        className="text-[10px] h-4 px-1.5 mt-1"
                      >
                        {match.fighter2.region.name}
                      </Badge>
                    )}
                    {match.winner_fighter_id === match.fighter2_id && (
                      <Badge className="bg-green-600 text-white text-[10px] h-4 mt-1">
                        🏆 Vainqueur
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Bouton pour superviser / arbitrer le combat */}
                <div className="pt-2 border-t flex justify-end">
                  <Button
                    size="sm"
                    variant={isLive ? "destructive" : "default"}
                    className="w-full gap-2 text-xs font-semibold"
                    onClick={() => router.push(`/ad/matches/${match.id}`)}
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Superviser le Match #{match.match_number}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        }}
      />

      {/* Dialog d'Édition du Match */}
      <Dialog open={!!matchToEdit} onOpenChange={(open) => !open && setMatchToEdit(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Modifier le Match #{matchToEdit?.match_number}</DialogTitle>
            <DialogDescription>
              Modifiez les paramètres du combat sélectionné.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label htmlFor="match-number" className="text-xs">
                Numéro du match
              </Label>
              <Input
                id="match-number"
                type="number"
                min="1"
                value={editFormData.match_number}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    match_number: parseInt(e.target.value) || 1,
                  })
                }
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="match-status" className="text-xs">
                Statut
              </Label>
              <Select
                value={editFormData.status}
                onValueChange={(val) =>
                  setEditFormData({ ...editFormData, status: val })
                }
              >
                <SelectTrigger id="match-status">
                  <SelectValue placeholder="Choisir le statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="scheduled">Programmé</SelectItem>
                  <SelectItem value="live">En Direct</SelectItem>
                  <SelectItem value="round_break">Pause</SelectItem>
                  <SelectItem value="reclamation">Réclamation</SelectItem>
                  <SelectItem value="completed">Terminé</SelectItem>
                  <SelectItem value="cancelled">Annulé</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="edit-notes" className="text-xs">
                Notes
              </Label>
              <Textarea
                id="edit-notes"
                placeholder="Notes particulières..."
                value={editFormData.notes}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, notes: e.target.value })
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setMatchToEdit(null)}
            >
              Annuler
            </Button>
            <Button onClick={submitEditMatch}>
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation de Suppression */}
      <AlertDialog
        open={!!matchToDelete}
        onOpenChange={(open) => !open && setMatchToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer ce match ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setMatchToDelete(null)}>
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteMatch}
              className="bg-destructive hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
