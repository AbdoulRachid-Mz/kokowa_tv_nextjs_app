// app/ad/sub-groups/[subGroupId]/organisation/page.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { Typography } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { SubGroup, Match, Fighter, Region } from "@/types";
import {
  Plus,
  Users,
  MapPin,
  Trophy,
  Swords,
  SaveAll,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { MatchCard } from "./matches-card";
import { BulkMatchCreator } from "./bulk-match-creator";
import { Spinner } from "@/components/ui/spinner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useRealtime } from "@/hooks/use-realtime";
import { toast } from "sonner";
import { SimpleMatchCard } from "@/components/matches/match-card";
import { getEditionFighters } from "@/actions/editions";
import { getSubGroupById } from "@/actions/sub-groups";
import { useAuthContext } from "@/contexts/auth-context";
import { useQuery, useQueryClient } from "@tanstack/react-query";

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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createMatch } from "@/actions/matches";
import { updateMatch } from "@/actions/matches-2";

export default function SubGroupOrganizationPage() {
  const { subGroupId } = useParams();
  const router = useRouter();
  const id = parseInt(subGroupId as string);
  const queryClient = useQueryClient();

  const [region1Fighters, setRegion1Fighters] = useState<Fighter[]>([]);
  const [region2Fighters, setRegion2Fighters] = useState<Fighter[]>([]);
  const [loadingFighters, setLoadingFighters] = useState(true);
  const [isBulkCreating, setIsBulkCreating] = useState(false);
  const [showBulkCreator, setShowBulkCreator] = useState(false);
  const { user } = useAuthContext();

  // États pour les Dialogs
  const [matchToDelete, setMatchToDelete] = useState<number | null>(null);
  const [matchToEdit, setMatchToEdit] = useState<Match | null>(null);
  const [editFormData, setEditFormData] = useState({
    status: "",
    notes: "",
    match_number: 0,
    fighter1_id: 0,
    fighter2_id: 0,
  });

  // Utilisation de TanStack Query pour le sous-groupe et les matchs
  const { data: subGroup, isLoading: loadingSubGroup, refetch: loadSubGroup } = useQuery({
    queryKey: ["sub-group-org", id],
    queryFn: async () => {
      const subGroupData = await getSubGroupById(id, {
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
      return subGroupData;
    },
    enabled: !isNaN(id),
  });

  const matches = useMemo(() => {
    if (!subGroup?.matches) return [];
    return [...subGroup.matches].sort((a, b) => (a.match_number ?? 1) - (b.match_number ?? 1));
  }, [subGroup?.matches]);

  // Realtime integration
  const { isConnected, subscribe } = useRealtime({
    autoConnect: true,
    onConnect: () => {
      if (!isNaN(id)) {
        subscribe('subGroup', id);
      }
    },
    onMessage: (msg) => {
      if (msg.type === 'update' && msg.data.entityType === 'subGroup' && msg.data.entityId == id) {
        console.log('🔄 SubGroup updated via Realtime');
        queryClient.invalidateQueries({ queryKey: ["sub-group-org", id] });
      }
    }
  });

  // Charger les lutteurs une seule fois ou quand le sous-groupe change
  useEffect(() => {
    if (subGroup) {
      const fetchFighters = async () => {
        try {
          setLoadingFighters(true);
          const [r1, r2] = await Promise.all([
            loadRegionFighters(
              subGroup?.group?.phase?.edition?.id ?? 0,
              subGroup.region1_id ?? 0
            ),
            loadRegionFighters(
              subGroup?.group?.phase?.edition?.id ?? 0,
              subGroup.region2_id ?? 0
            ),
          ]);
          setRegion1Fighters(r1);
          setRegion2Fighters(r2);
        } finally {
          setLoadingFighters(false);
        }
      };
      fetchFighters();
    }
  }, [subGroup?.region1_id, subGroup?.region2_id]);

  const loadRegionFighters = async (
    editionId: number,
    regionId: number
  ): Promise<Fighter[]> => {
    try {
      const response = await getEditionFighters(editionId, {
        region_id: regionId,
        limit: 100,
        with_fighter: true,
        with_region: false,
      });
      return response.data?.map((e: any) => e.fighter) || [];
    } catch (error) {
      console.error(`Erreur chargement lutteurs région ${regionId}:`, error);
      return [];
    }
  };

  const loading = loadingSubGroup || loadingFighters;

  // Calculer les lutteurs utilisés dans les matchs existants
  const usedFighterIds = useMemo(() => {
    const ids = new Set<number>();
    matches.forEach((match) => {
      if (match.fighter1_id) ids.add(match.fighter1_id);
      if (match.fighter2_id) ids.add(match.fighter2_id);
    });
    return ids;
  }, [matches]);

  // Filtrer les lutteurs disponibles
  const availableRegion1Fighters = useMemo(
    () => region1Fighters.filter((f) => !usedFighterIds.has(f.id)),
    [region1Fighters, usedFighterIds]
  );

  const availableRegion2Fighters = useMemo(
    () => region2Fighters.filter((f) => !usedFighterIds.has(f.id)),
    [region2Fighters, usedFighterIds]
  );

  // Compter le nombre de fois qu'un lutteur est sélectionné dans les matchs existants
  const fighterSelectionCounts = useMemo(() => {
    const counts: Record<number, number> = {};

    matches.forEach((match) => {
      if (match.fighter1_id) {
        counts[match.fighter1_id] = (counts[match.fighter1_id] || 0) + 1;
      }
      if (match.fighter2_id) {
        counts[match.fighter2_id] = (counts[match.fighter2_id] || 0) + 1;
      }
    });

    return counts;
  }, [matches]);

  // Dans la page principale, modifier handleCreateMatch :
  const handleCreateMatch = async (fighter1Id: number, fighter2Id?: number) => {
    try {
      // Use the createMatch server action directly
      const response = await createMatch(id, {
        fighter1_id: fighter1Id,
        fighter2_id: fighter2Id ?? null,
      });

      // Invalidate queries to refresh the UI
      queryClient.invalidateQueries({ queryKey: ["sub-group-org", id] });
      return response;
    } catch (error: any) {
      console.error("Erreur création match:", error);
      const errorMessage = error?.message || "Erreur lors de la création du match";
      toast.error(errorMessage);
      throw error;
    }
  };

  // Fonction pour créer plusieurs matchs en une fois
  const handleBulkCreateMatches = async (
    matchesToCreate: { fighter1Id: number; fighter2Id: number }[]
  ) => {
    if (matchesToCreate.length === 0) return;

    try {
      setIsBulkCreating(true);

      const promises = matchesToCreate.map((match) =>
        handleCreateMatch(match.fighter1Id, match.fighter2Id)
      );

      await Promise.all(promises);

      toast.success(`${promises.length} match(s) créé(s) avec succès`);
      setShowBulkCreator(false); // Masquer le créateur en masse
    } catch (error) {
      console.error("Erreur création en masse:", error);
      toast.error("Erreur lors de la création des matchs");
    } finally {
      setIsBulkCreating(false);
    }
  };

  const handleEditMatch = async (match: Match) => {
    setMatchToEdit(match);
    setEditFormData({
      status: match.status,
      notes: match.notes || "",
      match_number: match.match_number || 1,
      fighter1_id: match.fighter1_id || 0,
      fighter2_id: match.fighter2_id || 0,
    });
  };

  const submitEditMatch = async () => {
    if (!matchToEdit) return;

    try {
      // Validation des données
      if (editFormData.match_number < 1) {
        toast.error("Le numéro de match doit être supérieur à 0");
        return;
      }

      // Vérifier si le numéro de match est déjà utilisé par un autre match
      const existingMatchWithNumber = matches.find(
        (m) => m.match_number === editFormData.match_number && m.id !== matchToEdit.id
      );

      if (existingMatchWithNumber) {
        toast.error(`Le match #${editFormData.match_number} existe déjà`);
        return;
      }

      // Use the updateMatch server action directly
      const updatedMatch = await updateMatch(matchToEdit.id, {
        status: editFormData.status as Match['status'],
        notes: editFormData.notes || undefined,
        match_number: editFormData.match_number,
      });

      if (updatedMatch) {
        toast.success("Match mis à jour avec succès");
        queryClient.invalidateQueries({ queryKey: ["sub-group-org", id] });
        setMatchToEdit(null);
        setEditFormData({ status: "", notes: "", match_number: 0, fighter1_id: 0, fighter2_id: 0 });
      } else {
        toast.error("Erreur lors de la mise à jour du match");
      }
    } catch (error) {
      console.error("Erreur édition match:", error);
      toast.error("Erreur lors de l'édition du match");
    }
  };

  const handleDeleteMatch = async (matchId: number) => {
    setMatchToDelete(matchId);
  };

  const confirmDeleteMatch = async () => {
    if (!matchToDelete) return;

    try {
      await api.delete(`/api/matches/${matchToDelete}`);
      toast.success("Match supprimé");
      queryClient.invalidateQueries({ queryKey: ["sub-group-org", id] });
      setMatchToDelete(null);
    } catch (error) {
      console.error("Erreur suppression match:", error);
      toast.error("Erreur lors de la suppression du match");
    }
  };

  if (loading) {
    return (
      <div className="text-center mx-auto flex justify-center flex-col items-center py-20">
        <Spinner aria-label="Chargement..." />
        Chargement de l'organisation...
      </div>
    );
  }

  if (!subGroup) {
    return (
      <div className="text-center py-20">
        <Typography variant="h3" className="mb-4">
          Rencontre non trouvée
        </Typography>
        <Button onClick={() => router.push("/ad/sub-groups")}>
          ← Retour aux rencontres
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto space-y-4">
      {/* En-tête */}
      <Card className="p-4">
        <CardContent className="p-0">
          <div className="flex flex-col lg:flex-row items-center justify-between space-y-4 lg:space-y-0">
            <div className="text-center lg:text-left">
              <div className="flex items-center gap-2 mb-2">
                <Typography variant="h4" weight="bold">
                  {subGroup.name}
                </Typography>
                <div className="flex items-center gap-2">
                  <div
                    className={`w-3 h-3 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"
                      }`}
                  />
                  <Badge variant={isConnected ? "default" : "outline"}>
                    {isConnected ? "Temps réel actif" : "Hors ligne"}
                  </Badge>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2">
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <Typography variant="caption1">
                    {subGroup.group?.phase?.edition?.edition_number} -{" "}
                    {subGroup.group?.phase?.edition?.year}
                  </Typography>
                </div>
                <div className="flex items-center space-x-2">
                  <Trophy className="h-4 w-4 text-muted-foreground" />
                  <Typography variant="caption1">
                    {subGroup.group?.phase?.name} • {subGroup.group?.name}
                  </Typography>
                </div>
                <div className="flex gap-2">
                  <Badge variant={subGroup.is_active ? "default" : "outline"}>
                    {subGroup.is_active ? "Active" : "Inactive"}
                  </Badge>
                  <Badge
                    variant={subGroup.is_completed ? "default" : "secondary"}
                  >
                    {subGroup.is_completed ? "Terminée" : "En cours"}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              {!showBulkCreator &&
                availableRegion1Fighters.length > 0 &&
                availableRegion2Fighters.length > 0 && (
                  <Button
                    onClick={() => setShowBulkCreator(true)}
                    className="gap-2"
                    variant="default"
                  >
                    <Plus className="h-4 w-4" />
                    Création multiple
                  </Button>
                )}
              <Button
                onClick={() => loadSubGroup()}
                variant="outline"
                className="gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Actualiser
              </Button>
              <Button
                onClick={() => router.push(`/ad/sub-groups/${id}`)}
                variant="outline"
              >
                ← Retour
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Créateur en masse */}
      {showBulkCreator && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <Typography variant="h5" weight="bold" className="mb-1">
                Création multiple de matchs
              </Typography>
              <Typography variant="body-sm" theme="muted">
                Créez plusieurs matchs en une seule fois
              </Typography>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {availableRegion1Fighters.length} lutteurs région 1 disponibles
              </Badge>
              <Button
                onClick={() => setShowBulkCreator(false)}
                variant="ghost"
                size="sm"
                className="gap-1"
              >
                Fermer
              </Button>
            </div>
          </div>

          <BulkMatchCreator
            region1Fighters={region1Fighters}
            region2Fighters={region2Fighters}
            existingMatchFighterIds={usedFighterIds} // Nouveau prop
            onCreateMatches={async (matches) => {
              try {
                setIsBulkCreating(true);
                for (const match of matches) {
                  await handleCreateMatch(match.fighter1Id, match.fighter2Id);
                }
                toast.success(`${matches.length} match(s) créé(s) avec succès`);
                setShowBulkCreator(false);
              } catch (error) {
                toast.error("Erreur lors de la création des matchs");
              } finally {
                setIsBulkCreating(false);
              }
            }}
            onCancel={() => setShowBulkCreator(false)}
          />

          {/* Aperçu des matchs existants */}
          {matches.length > 0 && (
            <Card className="mt-4">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <Typography variant="body-lg" weight="medium">
                    Matchs existants ({matches.length})
                  </Typography>
                  <Badge variant="secondary">
                    {usedFighterIds.size} lutteurs déjà utilisés
                  </Badge>
                </div>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {matches.slice(0, 5).map((match, index) => (
                    <div
                      key={match.id}
                      className="flex items-center justify-between p-2 border rounded"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage
                            src={match.fighter1?.profile_image}
                            alt={match.fighter1?.first_name}
                          />
                          <AvatarFallback>
                            {match.fighter1?.first_name?.[0]}
                            {match.fighter1?.last_name?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <Swords className="h-3 w-3 text-muted-foreground" />
                        <Avatar className="h-8 w-8">
                          <AvatarImage
                            src={match.fighter2?.profile_image}
                            alt={match.fighter2?.first_name}
                          />
                          <AvatarFallback>
                            {match.fighter2?.first_name?.[0]}
                            {match.fighter2?.last_name?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <Typography variant="body-sm">
                          {match.fighter1?.first_name || "?"} vs{" "}
                          {match.fighter2?.first_name || "?"}
                        </Typography>
                      </div>
                      <Badge
                        variant={
                          match.status === "scheduled" ? "outline" : "default"
                        }
                      >
                        {match.status === "scheduled"
                          ? "Programmé"
                          : match.status === "live"
                            ? "En direct"
                            : match.status === "completed"
                              ? "Terminé"
                              : match.status}
                      </Badge>
                    </div>
                  ))}
                  {matches.length > 5 && (
                    <Typography
                      variant="body-sm"
                      theme="muted"
                      className="text-center"
                    >
                      ... et {matches.length - 5} autres matchs
                    </Typography>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
      {/* Grille d'organisation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Colonne Région 1 */}
        <div className="space-y-4 col-span-3">
          <RegionColumn
            region={subGroup.region1}
            fighters={availableRegion1Fighters}
            belt={subGroup.belt1}
            side="left"
            fighterSelectionCounts={fighterSelectionCounts}
          />
        </div>

        {/* Colonne centrale - Matches */}
        <div className="space-y-4 col-span-6">
          <div className="flex justify-between items-center">
            <Typography variant="h5" weight="bold">
              Matchs Programmes ({matches.length})
            </Typography>
            {!showBulkCreator && matches.length > 0 && (
              <Badge variant="outline">
                {availableRegion1Fighters.length +
                  availableRegion2Fighters.length}{" "}
                lutteurs disponibles
              </Badge>
            )}
          </div>
          {/* <div className="grid grid-cols-1 gap-2"> */}

          <MatchesColumn
            matches={matches}
            subGroupId={id}
            onEditMatch={handleEditMatch}
            onDeleteMatch={handleDeleteMatch}
          />
          {/* </div> */}
        </div>

        {/* Colonne Région 2 */}
        <div className="space-y-4 col-span-3">
          <RegionColumn
            region={subGroup.region2}
            fighters={availableRegion2Fighters}
            belt={subGroup.belt2}
            side="right"
            fighterSelectionCounts={fighterSelectionCounts}
          />
        </div>
      </div>

      {/* Dialogs pour Modification et Suppression */}
      <AlertDialog
        open={matchToDelete !== null}
        onOpenChange={(open) => !open && setMatchToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action supprimera définitivement le match. Cette action est
              irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteMatch}
              className="bg-red-600 hover:bg-red-700"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog
        open={matchToEdit !== null}
        onOpenChange={(open) => {
          if (!open) {
            setMatchToEdit(null);
            setEditFormData({ status: "", notes: "", match_number: 0, fighter1_id: 0, fighter2_id: 0 });
          }
        }}
      >
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              Modifier le match #{matchToEdit?.match_number}
            </DialogTitle>
            <DialogDescription>
              Ajustez les détails du match. Les modifications seront prises en compte immédiatement.
            </DialogDescription>
          </DialogHeader>

          {matchToEdit && (
            <div className="grid gap-6 py-4">
              {/* Aperçu rapide des lutteurs */}
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <Avatar className="h-12 w-12 mx-auto mb-1">
                      <AvatarImage src={matchToEdit.fighter1?.profile_image} />
                      <AvatarFallback>
                        {matchToEdit.fighter1?.first_name?.[0]}
                        {matchToEdit.fighter1?.last_name?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <Typography variant="body-sm" weight="medium">
                      {matchToEdit.fighter1?.first_name?.split(' ')[0]}
                    </Typography>
                  </div>

                  <Swords className="h-5 w-5 text-muted-foreground" />

                  <div className="text-center">
                    <Avatar className="h-12 w-12 mx-auto mb-1">
                      <AvatarImage src={matchToEdit.fighter2?.profile_image} />
                      <AvatarFallback>
                        {matchToEdit.fighter2?.first_name?.[0]}
                        {matchToEdit.fighter2?.last_name?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <Typography variant="body-sm" weight="medium">
                      {matchToEdit.fighter2?.first_name?.split(' ')[0]}
                    </Typography>
                  </div>
                </div>

                {/* Résultat actuel si existant */}
                {matchToEdit.match_result && (
                  <Badge
                    variant={
                      matchToEdit.match_result.includes('win') ? "default" :
                        matchToEdit.match_result === 'draw' ? "secondary" : "outline"
                    }
                    className="text-sm"
                  >
                    {matchToEdit.match_result === 'fighter1_win' && '🏆 Victoire ' + matchToEdit.fighter1?.first_name?.split(' ')[0]}
                    {matchToEdit.match_result === 'fighter2_win' && '🏆 Victoire ' + matchToEdit.fighter2?.first_name?.split(' ')[0]}
                    {matchToEdit.match_result === 'draw' && '🤝 Match nul'}
                    {matchToEdit.match_result === 'cancelled' && '❌ Annulé'}
                    {matchToEdit.match_result === 'postponed' && '⏱️ Reporté'}
                  </Badge>
                )}
              </div>

              {/* Champs de formulaire */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="match_number" className="text-sm font-medium">
                    Numéro du match
                  </Label>
                  <Input
                    id="match_number"
                    type="number"
                    min="1"
                    value={editFormData.match_number}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        match_number: parseInt(e.target.value) || 1,
                      })
                    }
                    className="col-span-3"
                  />
                  <Typography variant="caption1" theme="muted">
                    Ordre d'affichage des matchs
                  </Typography>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status" className="text-sm font-medium">
                    Statut
                  </Label>
                  <Select
                    value={editFormData.status}
                    onValueChange={(val) =>
                      setEditFormData({ ...editFormData, status: val })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choisir un statut" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="scheduled" className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                        <span>Programmé</span>
                      </SelectItem>
                      <SelectItem value="live" className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                        <span>En direct</span>
                      </SelectItem>
                      <SelectItem value="completed" className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                        <span>Terminé</span>
                      </SelectItem>
                      <SelectItem value="cancelled" className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-gray-500" />
                        <span>Annulé</span>
                      </SelectItem>
                      <SelectItem value="postponed" className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-orange-500" />
                        <span>Reporté</span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes" className="text-sm font-medium">
                  Notes
                </Label>
                <Textarea
                  id="notes"
                  placeholder="Ajoutez des notes sur le match (optionnel)"
                  value={editFormData.notes}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, notes: e.target.value })
                  }
                  rows={4}
                />
              </div>

              {/* Informations supplémentaires */}
              {matchToEdit.total_duration && matchToEdit.total_duration !== '00:00:00' && (
                <div className="p-3 bg-muted/20 rounded-lg">
                  <Typography variant="body-sm" weight="medium" className="mb-2">
                    ⏱️ Durée du match
                  </Typography>
                  <Typography variant="body-base">
                    {matchToEdit.total_duration}
                  </Typography>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setMatchToEdit(null)}>
              Annuler
            </Button>
            <Button
              onClick={submitEditMatch}
              disabled={!editFormData.status || editFormData.match_number < 1}
            >
              Enregistrer les modifications
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Composant pour une colonne de région amélioré
function RegionColumn({
  region,
  fighters,
  belt,
  side,
  fighterSelectionCounts,
}: {
  region?: Region;
  fighters: Fighter[];
  belt?: any;
  side: "left" | "right";
  fighterSelectionCounts: Record<number, number>;
}) {
  if (!region) {
    return (
      <Card className="p-4">
        <CardHeader>
          <CardTitle className="text-lg text-center">
            Région {side === "left" ? "1" : "2"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <Typography variant="body-sm" theme="muted">
              Aucune région assignée
            </Typography>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-fit p-2">
      <CardHeader className="pb-2">
        <div className="text-center">
          <div className="flex items-center justify-center group relative space-x-2 mb-2">
            {belt && (
              <span
                className={`block w-3 h-3 absolute rounded-full -top-1 ${side === "left" ? "-right-1" : "-left-1"
                  }`}
                style={{
                  backgroundColor: side === "left" ? "red" : "blue",
                }}
              ></span>
            )}
            <MapPin
              className="h-5 w-5 text-muted-foreground"
              style={{
                color: side === "left" ? "red" : "blue",
              }}
            />
            <CardTitle className="text-xl">{region.name}</CardTitle>
          </div>
          {/* {belt && (
            <Badge variant="outline" className="text-sm">
              Ceinture {belt.color}
            </Badge>
          )} */}
          <Typography variant="body-sm" theme="muted" className="mt-1">
            {region.code} • {fighters.length} lutteur(s) disponible(s)
          </Typography>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3 max-h-[500px] overflow-y-auto">
          {fighters.length === 0 ? (
            <div className="text-center py-4">
              <Typography variant="body-sm" theme="muted">
                Aucun lutteur disponible
              </Typography>
            </div>
          ) : (
            fighters.map((fighter) => (
              <FighterCard
                key={fighter.id}
                fighter={fighter}
                position={side}
                selectionCount={fighterSelectionCounts[fighter.id] || 0}
              />
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Composant pour un lutteur amélioré
function FighterCard({
  fighter,
  position = "left",
  selectionCount,
}: {
  fighter: Fighter;
  position?: "right" | "left";
  selectionCount: number;
}) {
  return (
    <Card className="hover:shadow-md transition-shadow p-2 cursor-pointer">
      <CardContent className="p-1">
        <div
          className={`flex ${position === "right" && "flex-row-reverse"
            } items-center space-x-3`}
        >
          <Avatar className="h-12 w-12">
            <AvatarImage
              src={fighter.profile_image || undefined}
              alt={`${fighter.first_name} ${fighter.last_name}`}
            />
            <AvatarFallback>
              {fighter.first_name?.[0]?.toUpperCase()}
              {fighter.last_name?.[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <Typography
                variant="body-base"
                weight="medium"
                hasTooltip={!!fighter.nickname}
                tooltipSide={position === "left" ? "right" : "left"}
                tooltipContent={fighter.nickname && fighter.nickname}
                className="truncate"
              >
                {fighter.first_name} {fighter.last_name}
              </Typography>
              {selectionCount > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {selectionCount}x
                </Badge>
              )}
            </div>
            <div className="flex items-center space-x-2 mt-1">
              {fighter.is_champion && (
                <Badge variant="default" className="text-xs px-1 py-0">
                  🏆
                </Badge>
              )}
              <Typography variant="body-sm" theme="muted">
                Classement: {fighter.ranking || "N/A"}
              </Typography>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Dans la page d'organisation (remplacement de MatchesColumn)
function MatchesColumn({
  matches,
  subGroupId,
  onEditMatch,
  onDeleteMatch,
}: {
  matches: Match[];
  subGroupId: number;
  onEditMatch: (match: Match) => void;
  onDeleteMatch: (matchId: number) => void;
}) {
  return (
    <Card className="p-3">
      <CardContent className="p-3">
        <div className="space-y-3">
          {matches.length === 0 ? (
            <div className="text-center py-8">
              <Typography variant="h4" theme="muted" className="mb-2">
                Aucun match programmé
              </Typography>
              <Typography variant="body-sm" theme="muted">
                Utilisez le bouton "Création multiple" pour créer plusieurs
                matchs
              </Typography>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
              {matches.map((match) => (
                <SimpleMatchCard
                  key={match.id}
                  match={match}
                  subGroupId={subGroupId}
                  onDelete={onDeleteMatch}
                  onEdit={onEditMatch}
                />
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Composant pour la colonne des matches simplifié
// function MatchesColumn({
//   matches,
//   onCreateMatch,
//   onDeleteMatch,
//   onEditMatch,
// }: {
//   matches: Match[];
//   onCreateMatch: (fighter1Id: number, fighter2Id?: number) => void;
//   onDeleteMatch: (matchId: number) => void;
//   onEditMatch: (match: Match) => void;
// }) {
//   return (
//     <Card>
//       <CardContent className="p-4">
//         <div className="space-y-4 max-h-[600px] overflow-y-auto">
//           {matches.length === 0 ? (
//             <div className="text-center py-8">
//               <Typography variant="h4" theme="muted" className="mb-2">
//                 Aucun match programmé
//               </Typography>
//               <Typography variant="body-sm" theme="muted">
//                 Utilisez le bouton "Création multiple" pour créer plusieurs
//                 matchs en une fois
//               </Typography>
//             </div>
//           ) : (
//             <>
//               {matches.map((match) => (
//                 <MatchCard
//                   key={match.id}
//                   match={match}
//                   onDelete={onDeleteMatch}
//                   onEdit={onEditMatch}
//                 />
//               ))}
//             </>
//           )}
//         </div>
//       </CardContent>
//     </Card>
//   );
// }
