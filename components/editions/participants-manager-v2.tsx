"use client";

import { useState, useEffect, useCallback } from "react";
import { Typography } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search,
  Plus,
  X,
  Users,
  MapPin,
  Check,
  Loader2,
  Filter,
  ArrowUpDown,
  CheckSquare,
  Square,
  ChevronLeft,
  ChevronRight,
  Download,
  Upload,
} from "lucide-react";
import {
  Select as SelectComponent,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Pagination,
  PaginationItem,
  PaginationPrevious,
  PaginationLink,
  PaginationNext,
  PaginationContent
} from "@/components/ui/pagination";
import { Fighter, Region } from "@/types";

interface ParticipantsManagerV2Props {
  editionId: number;
  type: "fighters" | "regions";
  currentParticipants: any[];
  onParticipantsUpdate?: () => void;
}

interface RegionWithFighters extends Region {
  fighters?: Fighter[];
  fightersCount?: number;
  isSelected?: boolean;
  selectedFighters?: Set<number>;
  fightersLoading?: boolean;
}

interface FighterWithSelection extends Fighter {
  isSelected?: boolean;
  regionName?: string;
}

export function ParticipantsManagerV2({
  editionId,
  type,
  currentParticipants,
  onParticipantsUpdate,
}: ParticipantsManagerV2Props) {
  const [regions, setRegions] = useState<RegionWithFighters[]>([]);
  const [currentRegions, setCurrentRegions] = useState<RegionWithFighters[]>(
    []
  );
  const [allFighters, setAllFighters] = useState<FighterWithSelection[]>([]);
  const [currentFighters, setCurrentFighters] = useState<
    FighterWithSelection[]
  >([]);

  const [loading, setLoading] = useState({
    regions: false,
    fighters: false,
    current: false,
  });

  const [selectedRegionId, setSelectedRegionId] = useState<number | null>(null);
  const [selectedRegion, setSelectedRegion] =
    useState<RegionWithFighters | null>(null);
  const [selectedFighters, setSelectedFighters] = useState<Set<number>>(
    new Set()
  );
  const [selectedRegions, setSelectedRegions] = useState<Set<number>>(
    new Set()
  );

  const [searchTerm, setSearchTerm] = useState("");
  const [regionSearchTerm, setRegionSearchTerm] = useState("");
  const [fighterSearchTerm, setFighterSearchTerm] = useState("");

  const [pagination, setPagination] = useState({
    regions: { page: 1, limit: 10, total: 0, totalPages: 1 },
    fighters: { page: 1, limit: 10, total: 0, totalPages: 1 },
    currentRegions: { page: 1, limit: 10, total: 0, totalPages: 1 },
    currentFighters: { page: 1, limit: 10, total: 0, totalPages: 1 },
  });

  const [filters, setFilters] = useState({
    regionStatus: "all",
    fighterStatus: "all",
    regionSort: "name",
    fighterSort: "ranking",
    sortOrder: "asc" as "asc" | "desc",
  });

  const isFighters = type === "fighters";
  const entityName = isFighters ? "lutteurs" : "régions";

  // Charger les régions avec pagination
  const fetchRegions = useCallback(
    async (page = 1, search = regionSearchTerm) => {
      setLoading((prev) => ({ ...prev, regions: true }));
      try {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: pagination.regions.limit.toString(),
          ...(search && { search }),
          ...(filters.regionStatus !== "all" && {
            status: filters.regionStatus,
          }),
          sort_by: filters.regionSort,
          sort_order: filters.sortOrder,
        });

        const response = await fetch(`/api/regions?${params}`);
        if (response.ok) {
          const data = await response.json();
          const regionsWithSelection = data.data.map((region: Region) => ({
            ...region,
            isSelected: selectedRegions.has(region.id),
            fightersLoading: false,
          }));

          setRegions(regionsWithSelection);
          setPagination((prev) => ({
            ...prev,
            regions: {
              page: data.pagination?.page || page,
              limit: data.pagination?.limit || pagination.regions.limit,
              total: data.pagination?.total || 0,
              totalPages: data.pagination?.totalPages || 1,
            },
          }));
        }
      } catch (error) {
        console.error("Erreur lors du chargement des régions:", error);
      } finally {
        setLoading((prev) => ({ ...prev, regions: false }));
      }
    },
    [regionSearchTerm, filters, pagination.regions.limit, selectedRegions]
  );

  // Charger les lutteurs d'une région spécifique
  const fetchRegionFighters = useCallback(
    async (regionId: number, page = 1) => {
      setLoading((prev) => ({ ...prev, fighters: true }));
      try {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: pagination.fighters.limit.toString(),
          ...(fighterSearchTerm && { search: fighterSearchTerm }),
          region_id: regionId.toString(),
          ...(filters.fighterStatus !== "all" && {
            status: filters.fighterStatus,
          }),
          sort_by: filters.fighterSort,
          sort_order: filters.sortOrder,
        });

        const response = await fetch(`/api/fighters?${params}`);
        if (response.ok) {
          const data = await response.json();
          const fightersWithSelection = data.data.map((fighter: Fighter) => ({
            ...fighter,
            isSelected:
              selectedFighters.has(fighter.id) ||
              (selectedRegionId === regionId &&
                selectedFighters.has(fighter.id)),
            regionName: regions.find((r) => r.id === regionId)?.name,
          }));

          setAllFighters(fightersWithSelection);
          setPagination((prev) => ({
            ...prev,
            fighters: {
              page: data.pagination?.page || page,
              limit: data.pagination?.limit || pagination.fighters.limit,
              total: data.pagination?.total || 0,
              totalPages: data.pagination?.totalPages || 1,
            },
          }));

          // Mettre à jour la région sélectionnée avec les lutteurs
          if (selectedRegionId === regionId) {
            setSelectedRegion((prev) =>
              prev
                ? {
                    ...prev,
                    fighters: fightersWithSelection,
                    fightersCount: data.pagination?.total || 0,
                  }
                : null
            );
          }
        }
      } catch (error) {
        console.error("Erreur lors du chargement des lutteurs:", error);
      } finally {
        setLoading((prev) => ({ ...prev, fighters: false }));
      }
    },
    [
      fighterSearchTerm,
      filters,
      pagination.fighters.limit,
      selectedFighters,
      selectedRegionId,
      regions,
    ]
  );

  // Charger les participants actuels
  const fetchCurrentParticipants = useCallback(async () => {
    setLoading((prev) => ({ ...prev, current: true }));
    try {
      if (isFighters) {
        const params = new URLSearchParams({
          page: pagination.currentFighters.page.toString(),
          limit: pagination.currentFighters.limit.toString(),
          with_region: "true",
        });

        const response = await fetch(
          `/api/editions/${editionId}/fighters/list?${params}`
        );
        if (response.ok) {
          const data = await response.json();
          setCurrentFighters(data.data || []);
          setPagination((prev) => ({
            ...prev,
            currentFighters: {
              ...prev.currentFighters,
              total: data.pagination?.total || 0,
              totalPages: data.pagination?.totalPages || 1,
            },
          }));
        }
      } else {
        const params = new URLSearchParams({
          page: pagination.currentRegions.page.toString(),
          limit: pagination.currentRegions.limit.toString(),
        });

        const response = await fetch(
          `/api/editions/${editionId}/regions/list?${params}`
        );
        if (response.ok) {
          const data = await response.json();
          const regionsWithSelection = data.data.map((item: any) => ({
            ...item.region,
            isSelected: selectedRegions.has(item.region.id),
            fightersCount: item.fighters_count,
          }));

          setCurrentRegions(regionsWithSelection);
          setPagination((prev) => ({
            ...prev,
            currentRegions: {
              ...prev.currentRegions,
              total: data.pagination?.total || 0,
              totalPages: data.pagination?.totalPages || 1,
            },
          }));
        }
      }
    } catch (error) {
      console.error(
        "Erreur lors du chargement des participants actuels:",
        error
      );
    } finally {
      setLoading((prev) => ({ ...prev, current: false }));
    }
  }, [
    editionId,
    isFighters,
    pagination.currentFighters.page,
    pagination.currentFighters.limit,
    pagination.currentRegions.page,
    pagination.currentRegions.limit,
    selectedRegions,
  ]);

  useEffect(() => {
    fetchRegions();
    fetchCurrentParticipants();
  }, [fetchRegions, fetchCurrentParticipants]);

  useEffect(() => {
    if (selectedRegionId) {
      fetchRegionFighters(selectedRegionId);
    }
  }, [selectedRegionId, fetchRegionFighters]);

  // Sélectionner une région
  const handleSelectRegion = (region: RegionWithFighters) => {
    setSelectedRegionId(region.id);
    setSelectedRegion(region);
    setFighterSearchTerm("");
  };

  // Sélectionner/désélectionner tous les lutteurs d'une région
  const handleSelectAllFighters = () => {
    if (!selectedRegion?.fighters) return;

    const allFighterIds = new Set(selectedRegion.fighters.map((f) => f.id));
    const newSelectedFighters = new Set(selectedFighters);

    // Vérifier si tous sont déjà sélectionnés
    const allSelected = selectedRegion.fighters.every((f) =>
      selectedFighters.has(f.id)
    );

    if (allSelected) {
      // Désélectionner tous
      selectedRegion.fighters.forEach((f) => newSelectedFighters.delete(f.id));
    } else {
      // Sélectionner tous
      selectedRegion.fighters.forEach((f) => newSelectedFighters.add(f.id));
    }

    setSelectedFighters(newSelectedFighters);
  };

  // Sélectionner/désélectionner un lutteur
  const handleSelectFighter = (fighterId: number) => {
    const newSelectedFighters = new Set(selectedFighters);
    if (newSelectedFighters.has(fighterId)) {
      newSelectedFighters.delete(fighterId);
    } else {
      newSelectedFighters.add(fighterId);
    }
    setSelectedFighters(newSelectedFighters);
  };

  // Sélectionner/désélectionner une région
  const handleSelectRegionForOperation = (regionId: number) => {
    const newSelectedRegions = new Set(selectedRegions);
    if (newSelectedRegions.has(regionId)) {
      newSelectedRegions.delete(regionId);
    } else {
      newSelectedRegions.add(regionId);
    }
    setSelectedRegions(newSelectedRegions);
  };

  // Sélectionner/désélectionner toutes les régions
  const handleSelectAllRegions = () => {
    const currentList = isFighters ? regions : currentRegions;
    const allRegionIds = new Set(currentList.map((r) => r.id));
    const newSelectedRegions = new Set(selectedRegions);

    const allSelected = currentList.every((r) => selectedRegions.has(r.id));

    if (allSelected) {
      // Désélectionner tous
      currentList.forEach((r) => newSelectedRegions.delete(r.id));
    } else {
      // Sélectionner tous
      currentList.forEach((r) => newSelectedRegions.add(r.id));
    }

    setSelectedRegions(newSelectedRegions);
  };

  // Ajouter les lutteurs sélectionnés
  const handleAddSelectedFighters = async () => {
    if (selectedFighters.size === 0) return;

    try {
      const promises = Array.from(selectedFighters).map((fighterId) =>
        fetch(`/api/editions/${editionId}/fighters`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fighter_id: fighterId,
            status: "registered",
            region_id: selectedRegionId,
          }),
        })
      );

      await Promise.all(promises);
      setSelectedFighters(new Set());
      fetchCurrentParticipants();
      onParticipantsUpdate?.();
      alert(`${selectedFighters.size} lutteur(s) ajouté(s) avec succès`);
    } catch (error) {
      console.error("Erreur lors de l'ajout des lutteurs:", error);
      alert("Erreur lors de l'ajout des lutteurs");
    }
  };

  // Ajouter les régions sélectionnées
  const handleAddSelectedRegions = async () => {
    if (selectedRegions.size === 0) return;

    try {
      const promises = Array.from(selectedRegions).map((regionId) =>
        fetch(`/api/editions/${editionId}/regions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            region_id: regionId,
            status: "registered",
          }),
        })
      );

      await Promise.all(promises);
      setSelectedRegions(new Set());
      fetchCurrentParticipants();
      onParticipantsUpdate?.();
      alert(`${selectedRegions.size} région(s) ajoutée(s) avec succès`);
    } catch (error) {
      console.error("Erreur lors de l'ajout des régions:", error);
      alert("Erreur lors de l'ajout des régions");
    }
  };

  // Retirer les participants sélectionnés
  const handleRemoveSelected = async () => {
    if (isFighters) {
      if (selectedFighters.size === 0) return;

      try {
        const promises = Array.from(selectedFighters).map((fighterId) =>
          fetch(`/api/editions/${editionId}/fighters?fighter_id=${fighterId}`, {
            method: "DELETE",
          })
        );

        await Promise.all(promises);
        setSelectedFighters(new Set());
        fetchCurrentParticipants();
        onParticipantsUpdate?.();
        alert(`${selectedFighters.size} lutteur(s) retiré(s) avec succès`);
      } catch (error) {
        console.error("Erreur lors du retrait des lutteurs:", error);
        alert("Erreur lors du retrait des lutteurs");
      }
    } else {
      if (selectedRegions.size === 0) return;

      try {
        const promises = Array.from(selectedRegions).map((regionId) =>
          fetch(`/api/editions/${editionId}/regions?region_id=${regionId}`, {
            method: "DELETE",
          })
        );

        await Promise.all(promises);
        setSelectedRegions(new Set());
        fetchCurrentParticipants();
        onParticipantsUpdate?.();
        alert(`${selectedRegions.size} région(s) retirée(s) avec succès`);
      } catch (error) {
        console.error("Erreur lors du retrait des régions:", error);
        alert("Erreur lors du retrait des régions");
      }
    }
  };

  // Render region list
  const RegionList = ({
    regions,
    isCurrent = false,
  }: {
    regions: RegionWithFighters[];
    isCurrent?: boolean;
  }) => (
    <div className="space-y-2">
      {regions.map((region) => (
        <Card
          key={region.id}
          className={`cursor-pointer transition-all p-2 hover:bg-gray-50 ${
            selectedRegionId === region.id ? "border-primary bg-primary/5" : ""
          }`}
          onClick={() => !isCurrent && handleSelectRegion(region)}
        >
          <CardContent className="p-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 flex-1">
                {!isCurrent && (
                  <Checkbox
                    checked={selectedRegions.has(region.id)}
                    onCheckedChange={() =>
                      handleSelectRegionForOperation(region.id)
                    }
                    onClick={(e) => e.stopPropagation()}
                  />
                )}

                <Avatar className="h-10 w-10">
                  <AvatarImage src={region.flag_image} alt={region.name} />
                  <AvatarFallback className="bg-gray-200">
                    {region.code.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <Typography
                    variant="body-base"
                    weight="medium"
                    className="truncate"
                  >
                    {region.name}
                  </Typography>
                  <div className="flex items-center gap-2">
                    <Typography variant="caption2" theme="muted">
                      {region.code}
                    </Typography>
                    {isFighters && (
                      <>
                        <span className="text-gray-300">•</span>
                        <Typography variant="caption2" theme="muted">
                          {region.fightersCount || region.total_fighters || 0}{" "}
                          lutteurs
                        </Typography>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {isCurrent && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectRegionForOperation(region.id);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  // Render fighter list
  const FighterList = ({
    fighters,
    isCurrent = false,
  }: {
    fighters: FighterWithSelection[];
    isCurrent?: boolean;
  }) => (
    <div className="space-y-2">
      {fighters.map((fighter) => (
        <Card key={fighter.id} className="p-2">
          <CardContent className="p-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1">
                <Checkbox
                  checked={isCurrent ? false : selectedFighters.has(fighter.id)}
                  onCheckedChange={() => handleSelectFighter(fighter.id)}
                  disabled={isCurrent}
                />

                <Avatar className="h-10 w-10">
                  <AvatarImage
                    src={fighter.profile_image}
                    alt={`${fighter.first_name} ${fighter.last_name}`}
                  />
                  <AvatarFallback className="bg-gray-200">
                    {fighter.first_name?.[0]}
                    {fighter.last_name?.[0]}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <Typography
                    variant="body-base"
                    weight="medium"
                    className="truncate"
                  >
                    {fighter.first_name} {fighter.last_name}
                    {fighter.nickname && (
                      <span className="text-gray-500 ml-1">
                        ({fighter.nickname})
                      </span>
                    )}
                  </Typography>
                  <div className="flex items-center gap-2">
                    <Typography variant="caption2" theme="muted">
                      Classement: {fighter.ranking}
                    </Typography>
                    {fighter.regionName && (
                      <>
                        <span className="text-gray-300">•</span>
                        <Typography variant="caption2" theme="muted">
                          {fighter.regionName}
                        </Typography>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {isCurrent && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSelectFighter(fighter.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Header avec statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-2">
          <CardContent className="p-2">
            <div className="flex items-center justify-between">
              <div>
                <Typography variant="caption1" theme="muted">
                  Total {entityName}
                </Typography>
                <Typography variant="h4" className="mt-1">
                  {isFighters ? allFighters.length : regions.length}
                </Typography>
              </div>
              <div className="p-2 bg-primary/10 rounded-lg">
                {isFighters ? (
                  <Users className="h-6 w-6 text-primary" />
                ) : (
                  <MapPin className="h-6 w-6 text-primary" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="p-2">
          <CardContent className="p-2">
            <div className="flex items-center justify-between">
              <div>
                <Typography variant="caption1" theme="muted">
                  Sélectionnés
                </Typography>
                <Typography variant="h4" className="mt-1">
                  {isFighters ? selectedFighters.size : selectedRegions.size}
                </Typography>
              </div>
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckSquare className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="p-3">
          <CardContent className="p-2">
            <div className="flex items-center justify-between">
              <div>
                <Typography variant="caption1" theme="muted">
                  Participants actuels
                </Typography>
                <Typography variant="h4" className="mt-1">
                  {isFighters ? currentFighters.length : currentRegions.length}
                </Typography>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {isFighters ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Colonne 1: Liste des régions */}
          <div className="lg:col-span-1 space-y-4">
            <div className="flex items-center justify-between">
              <Typography variant="h5">Régions</Typography>
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={
                    regions.length > 0 &&
                    regions.every((r) => selectedRegions.has(r.id))
                  }
                  onCheckedChange={handleSelectAllRegions}
                />
                <Typography variant="caption1">Tout sélectionner</Typography>
              </div>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher une région..."
                value={regionSearchTerm}
                onChange={(e) => {
                  setRegionSearchTerm(e.target.value);
                  setTimeout(() => fetchRegions(1, e.target.value), 300);
                }}
                className="pl-10"
              />
            </div>

            {loading.regions ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <>
                <RegionList regions={regions} />

                {pagination.regions.totalPages > 1 && (
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() =>
                            fetchRegions(
                              Math.max(1, pagination.regions.page - 1)
                            )
                          }
                          aria-disabled={pagination.regions.page <= 1}
                          className={
                            pagination.regions.page <= 1
                              ? "pointer-events-none opacity-50"
                              : ""
                          }
                        />
                      </PaginationItem>

                      {Array.from(
                        { length: pagination.regions.totalPages },
                        (_, i) => i + 1
                      ).map((page) => (
                        <PaginationItem key={page}>
                          <PaginationLink
                            isActive={page === pagination.regions.page}
                            onClick={() => fetchRegions(page)}
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      ))}

                      <PaginationItem>
                        <PaginationNext
                          onClick={() =>
                            fetchRegions(
                              Math.min(
                                pagination.regions.totalPages,
                                pagination.regions.page + 1
                              )
                            )
                          }
                          aria-disabled={
                            pagination.regions.page >=
                            pagination.regions.totalPages
                          }
                          className={
                            pagination.regions.page >=
                            pagination.regions.totalPages
                              ? "pointer-events-none opacity-50"
                              : ""
                          }
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                )}
              </>
            )}

            {selectedRegions.size > 0 && (
              <Button
                className="w-full mt-4"
                onClick={handleAddSelectedRegions}
                disabled={loading.regions}
              >
                <Plus className="h-4 w-4 mr-2" />
                Ajouter {selectedRegions.size} région(s)
              </Button>
            )}
          </div>

          {/* Colonne 2: Lutteurs de la région sélectionnée */}
          <div className="lg:col-span-2 space-y-4">
            {selectedRegion ? (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <Typography variant="h5">
                      Lutteurs - {selectedRegion.name}
                    </Typography>
                    <Typography variant="caption1" theme="muted">
                      {selectedRegion.fightersCount ||
                        selectedRegion.total_fighters ||
                        0}{" "}
                      lutteurs
                    </Typography>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSelectAllFighters}
                      disabled={
                        !selectedRegion.fighters ||
                        selectedRegion.fighters.length === 0
                      }
                    >
                      {selectedRegion.fighters?.every((f) =>
                        selectedFighters.has(f.id)
                      ) ? (
                        <Square className="h-4 w-4 mr-2" />
                      ) : (
                        <CheckSquare className="h-4 w-4 mr-2" />
                      )}
                      {selectedRegion.fighters?.every((f) =>
                        selectedFighters.has(f.id)
                      )
                        ? "Désélectionner"
                        : "Sélectionner"}{" "}
                      tout
                    </Button>

                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Rechercher un lutteur..."
                        value={fighterSearchTerm}
                        onChange={(e) => {
                          setFighterSearchTerm(e.target.value);
                          setTimeout(
                            () => fetchRegionFighters(selectedRegionId!, 1),
                            300
                          );
                        }}
                        className="pl-10 w-48"
                      />
                    </div>
                  </div>
                </div>

                {loading.fighters ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <>
                    <FighterList fighters={allFighters} />

                    {pagination.fighters.totalPages > 1 && (
                      <Pagination>
                        <PaginationContent>
                          <PaginationItem>
                            <PaginationPrevious
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                if (pagination.fighters.page > 1) {
                                  fetchRegionFighters(
                                    selectedRegionId!,
                                    pagination.fighters.page - 1
                                  );
                                }
                              }}
                            />
                          </PaginationItem>

                          {/* Page numbers */}
                          {Array.from(
                            { length: pagination.fighters.totalPages },
                            (_, i) => i + 1
                          ).map((page) => (
                            <PaginationItem key={page}>
                              <PaginationLink
                                href="#"
                                isActive={page === pagination.fighters.page}
                                onClick={(e) => {
                                  e.preventDefault();
                                  fetchRegionFighters(selectedRegionId!, page);
                                }}
                              >
                                {page}
                              </PaginationLink>
                            </PaginationItem>
                          ))}

                          <PaginationItem>
                            <PaginationNext
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                if (
                                  pagination.fighters.page <
                                  pagination.fighters.totalPages
                                ) {
                                  fetchRegionFighters(
                                    selectedRegionId!,
                                    pagination.fighters.page + 1
                                  );
                                }
                              }}
                            />
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>
                    )}

                    {selectedFighters.size > 0 && (
                      <div className="sticky bottom-4 bg-white p-4 rounded-lg border shadow-lg">
                        <div className="flex items-center justify-between">
                          <Typography variant="body-base" weight="medium">
                            {selectedFighters.size} lutteur(s) sélectionné(s)
                          </Typography>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              onClick={() => setSelectedFighters(new Set())}
                            >
                              Annuler
                            </Button>
                            <Button onClick={handleAddSelectedFighters}>
                              <Plus className="h-4 w-4 mr-2" />
                              Ajouter les lutteurs sélectionnés
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-lg">
                <MapPin className="h-12 w-12 text-gray-400 mb-4" />
                <Typography variant="body-lg" theme="muted">
                  Sélectionnez une région pour voir ses lutteurs
                </Typography>
                <Typography variant="caption1" theme="muted" className="mt-2">
                  Cliquez sur une région dans la liste de gauche
                </Typography>
              </div>
            )}
          </div>
        </div>
      ) : (
        // Mode régions seulement
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Typography variant="h5">Régions disponibles</Typography>
            <div className="flex items-center gap-2">
              <Checkbox
                checked={
                  regions.length > 0 &&
                  regions.every((r) => selectedRegions.has(r.id))
                }
                onCheckedChange={handleSelectAllRegions}
              />
              <Typography variant="caption1">Tout sélectionner</Typography>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher une région..."
              value={regionSearchTerm}
              onChange={(e) => {
                setRegionSearchTerm(e.target.value);
                setTimeout(() => fetchRegions(1, e.target.value), 300);
              }}
              className="pl-10"
            />
          </div>

          {loading.regions ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <RegionList regions={regions} />

              {pagination.regions.totalPages > 1 && (
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          if (pagination.regions.page > 1) {
                            fetchRegions(pagination.regions.page - 1);
                          }
                        }}
                      />
                    </PaginationItem>

                    {/* Page numbers */}
                    {Array.from(
                      { length: pagination.regions.totalPages },
                      (_, i) => i + 1
                    ).map((page) => (
                      <PaginationItem key={page}>
                        <PaginationLink
                          href="#"
                          isActive={page === pagination.regions.page}
                          onClick={(e) => {
                            e.preventDefault();
                            fetchRegions(page);
                          }}
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    ))}

                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          if (
                            pagination.regions.page <
                            pagination.regions.totalPages
                          ) {
                            fetchRegions(pagination.regions.page + 1);
                          }
                        }}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
              {selectedRegions.size > 0 && (
                <div className="sticky bottom-4 bg-white p-4 rounded-lg border shadow-lg">
                  <div className="flex items-center justify-between">
                    <Typography variant="body-base" weight="medium">
                      {selectedRegions.size} région(s) sélectionnée(s)
                    </Typography>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setSelectedRegions(new Set())}
                      >
                        Annuler
                      </Button>
                      <Button onClick={handleAddSelectedRegions}>
                        <Plus className="h-4 w-4 mr-2" />
                        Ajouter les régions sélectionnées
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Participants actuels */}
      <div className="space-y-4">
        <Typography variant="h5">{entityName} participants</Typography>

        <Tabs defaultValue="current">
          <TabsList>
            <TabsTrigger value="current">
              Actuels (
              {isFighters ? currentFighters.length : currentRegions.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="current" className="space-y-4">
            {isFighters ? (
              <>
                {loading.current ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : currentFighters.length > 0 ? (
                  <>
                    <FighterList fighters={currentFighters} isCurrent />
                    {selectedFighters.size > 0 && (
                      <Button
                        variant="destructive"
                        onClick={handleRemoveSelected}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Retirer {selectedFighters.size} lutteur(s)
                        sélectionné(s)
                      </Button>
                    )}
                  </>
                ) : (
                  <Card>
                    <CardContent className="py-8 text-center">
                      <Typography variant="body-lg" theme="muted">
                        Aucun lutteur participant pour le moment
                      </Typography>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <>
                {loading.current ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : currentRegions.length > 0 ? (
                  <>
                    <RegionList regions={currentRegions} isCurrent />
                    {selectedRegions.size > 0 && (
                      <Button
                        variant="destructive"
                        onClick={handleRemoveSelected}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Retirer {selectedRegions.size} région(s) sélectionnée(s)
                      </Button>
                    )}
                  </>
                ) : (
                  <Card>
                    <CardContent className="py-8 text-center">
                      <Typography variant="body-lg" theme="muted">
                        Aucune région participante pour le moment
                      </Typography>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
