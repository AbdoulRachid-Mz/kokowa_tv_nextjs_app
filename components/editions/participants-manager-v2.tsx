"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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
  Loader2,
  CheckSquare,
  Square,
  Filter,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { useScreenSize } from "@/hooks/use-screen";

import {
  useAvailableFightersInfinite,
  useEditionFightersInfinite,
  useAvailableRegionsInfinite,
  useEditionRegionsInfinite,
  useAddFighterToEdition,
  useRemoveFighterFromEdition,
  useAddRegionToEdition,
  useRemoveRegionFromEdition,
  buildUrl,
} from "@/hooks/use-editions-participants";

import { useQuery } from "@tanstack/react-query";

interface ParticipantsManagerV2Props {
  editionId: number;
  type: "fighters" | "regions";
  currentParticipants: any[]; // Gardé pour compatibilité mais on utilise React Query
  onParticipantsUpdate?: () => void;
}

export function ParticipantsManagerV2({
  editionId,
  type,
  onParticipantsUpdate,
}: ParticipantsManagerV2Props) {
  const isFighters = type === "fighters";
  const entityName = isFighters ? "lutteurs" : "régions";
  const entitySingular = isFighters ? "lutteur" : "région";

  const { isMobile } = useScreenSize();

  const [activeTab, setActiveTab] = useState("available");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | "active" | "inactive">("all");
  const [selectedRegionId, setSelectedRegionId] = useState<number | null>(null);

  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(timer);
  }, [search]);

  // Load all regions for sidebar (only if fighters)
  const { data: allRegionsResponse } = useQuery({
    queryKey: ["all-regions"],
    queryFn: async () => {
      const res = await fetch("/api/regions?limit=1000");
      return res.json();
    },
    enabled: isFighters,
  });
  const allRegions = allRegionsResponse?.data || [];

  // Prepare filters
  const queryFilters = {
    search: debouncedSearch,
    limit: 20,
    ...(isFighters && selectedRegionId ? { region_id: selectedRegionId } : {}),
    ...(status === "active"
      ? { is_active: true }
      : status === "inactive"
        ? { is_active: false }
        : {}),
    with_region: true,
  };

  // Queries
  const availableFightersQuery = useAvailableFightersInfinite(
    editionId,
    queryFilters,
  );
  const editionFightersQuery = useEditionFightersInfinite(
    editionId,
    queryFilters,
  );
  const availableRegionsQuery = useAvailableRegionsInfinite(
    editionId,
    queryFilters,
  );
  const editionRegionsQuery = useEditionRegionsInfinite(
    editionId,
    queryFilters,
  );

  const availableQuery = isFighters
    ? availableFightersQuery
    : availableRegionsQuery;
  const editionQuery = isFighters ? editionFightersQuery : editionRegionsQuery;

  const currentQuery =
    activeTab === "available" ? availableQuery : editionQuery;

  // Flatten data
  const availableItems =
    availableQuery.data?.pages.flatMap((page: any) => page.data) || [];
  const editionItems =
    editionQuery.data?.pages.flatMap((page: any) => page.data) || [];

  const currentItemsRaw =
    activeTab === "available" ? availableItems : editionItems;

  const seenIds = new Set();
  const currentItems = currentItemsRaw.filter((item: any) => {
    if (!item) return false;
    const realId = isFighters
      ? item.fighter?.id || item.fighter_id || item.id
      : item.region?.id || item.region_id || item.id;
    if (seenIds.has(realId)) return false;
    seenIds.add(realId);
    return true;
  });

  // Totals
  const totalAvailable = availableQuery.data?.pages[0]?.pagination?.total || 0;
  const totalInEdition = editionQuery.data?.pages[0]?.pagination?.total || 0;
  const totalAll = totalAvailable + totalInEdition;

  // Infinite Scroll Observer
  const observerTarget = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          currentQuery.hasNextPage &&
          !currentQuery.isFetchingNextPage
        ) {
          currentQuery.fetchNextPage();
        }
      },
      { threshold: 0.1 },
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [
    currentQuery,
    currentQuery.hasNextPage,
    currentQuery.isFetchingNextPage,
    currentQuery.fetchNextPage,
  ]);

  // Mutations
  const addFighter = useAddFighterToEdition();
  const removeFighter = useRemoveFighterFromEdition();
  const addRegion = useAddRegionToEdition();
  const removeRegion = useRemoveRegionFromEdition();

  const isMutating =
    addFighter.isPending ||
    removeFighter.isPending ||
    addRegion.isPending ||
    removeRegion.isPending;

  const handleSelectItem = useCallback((itemId: number) => {
    setSelectedItems((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
  }, []);

  const handleSelectAll = useCallback(async () => {
    const total = activeTab === "available" ? totalAvailable : totalInEdition;
    const allSelected = currentItems.every((item: any) => {
      const id = Number(
        isFighters
          ? item.fighter?.id || item.fighter_id || item.id
          : item.region?.id || item.region_id || item.id
      );
      return selectedItems.has(id);
    });

    if (allSelected && currentItems.length > 0) {
      setSelectedItems((prev) => {
        const next = new Set(prev);
        currentItems.forEach((item: any) => {
          const id = Number(
            isFighters
              ? item.fighter?.id || item.fighter_id || item.id
              : item.region?.id || item.region_id || item.id
          );
          next.delete(id);
        });
        return next;
      });
      return;
    }

    if (currentItems.length >= total) {
      setSelectedItems((prev) => {
        const next = new Set(prev);
        currentItems.forEach((item: any) => {
          const id = Number(
            isFighters
              ? item.fighter?.id || item.fighter_id || item.id
              : item.region?.id || item.region_id || item.id
          );
          next.add(id);
        });
        return next;
      });
      return;
    }

    const toastId = toast.loading("Sélection de tous les éléments...");
    try {
      let url = "";
      const baseParams: any = {
        search: debouncedSearch,
        limit: 0,
        ...(isFighters && selectedRegionId ? { region_id: selectedRegionId } : {}),
        ...(status === "active"
          ? { is_active: 1 }
          : status === "inactive"
            ? { is_active: 0 }
            : {}),
      };

      if (activeTab === "available") {
        if (isFighters) {
          url = buildUrl("/api/fighters", { ...baseParams, not_in_edition: editionId });
        } else {
          url = buildUrl("/api/regions", { ...baseParams, not_in_edition: editionId });
        }
      } else {
        if (isFighters) {
          url = buildUrl(`/api/editions/${editionId}/fighters/list`, baseParams);
        } else {
          url = buildUrl(`/api/editions/${editionId}/regions/list`, baseParams);
        }
      }

      const res = await fetch(url);
      if (!res.ok) throw new Error("Erreur de récupération");
      const result = await res.json();
      const allItems = result.data || [];

      setSelectedItems((prev) => {
        const next = new Set(prev);
        allItems.forEach((item: any) => {
          const id = Number(
            isFighters
              ? item.fighter?.id || item.fighter_id || item.id
              : item.region?.id || item.region_id || item.id
          );
          next.add(id);
        });
        return next;
      });
      toast.success(`${allItems.length} éléments sélectionnés`, { id: toastId });
    } catch (e) {
      console.error(e);
      toast.error("Erreur lors de la sélection de tous les éléments", { id: toastId });
    }
  }, [
    activeTab,
    totalAvailable,
    totalInEdition,
    currentItems,
    selectedItems,
    debouncedSearch,
    isFighters,
    selectedRegionId,
    status,
    editionId,
  ]);

  const handleClearSelection = () => setSelectedItems(new Set());

  const handleAddSelected = async () => {
    if (selectedItems.size === 0) return;

    const promises = Array.from(selectedItems).map((id) => {
      if (isFighters) {
        const fighter = availableItems.find((f: any) => f.id === id);
        return addFighter.mutateAsync({
          editionId,
          fighterId: id,
          regionId: fighter?.region_id || fighter?.region?.id,
          status: "registered",
        });
      } else {
        return addRegion.mutateAsync({
          editionId,
          regionId: id,
          status: "registered",
        });
      }
    });

    try {
      await Promise.allSettled(promises);
      toast.success(
        `${selectedItems.size} ${entitySingular}(s) ajouté(s) avec succès`,
      );
      setSelectedItems(new Set());
      onParticipantsUpdate?.();
    } catch (e) {
      toast.error("Erreur lors de l'ajout");
    }
  };

  const handleRemoveSelected = async () => {
    if (selectedItems.size === 0) return;

    const promises = Array.from(selectedItems).map((id) => {
      if (isFighters) {
        // Find the fighter_id since edition items might use a different id structure
        const item = editionItems.find(
          (f: any) => (f.fighter?.id || f.fighter_id || f.id) === id,
        );
        const realFighterId = item?.fighter?.id || item?.fighter_id || id;
        return removeFighter.mutateAsync({
          editionId,
          fighterId: realFighterId,
        });
      } else {
        const item = editionItems.find(
          (r: any) => (r.region?.id || r.region_id || r.id) === id,
        );
        const realRegionId = item?.region?.id || item?.region_id || id;
        return removeRegion.mutateAsync({ editionId, regionId: realRegionId });
      }
    });

    try {
      await Promise.allSettled(promises);
      toast.success(
        `${selectedItems.size} ${entitySingular}(s) retiré(s) avec succès`,
      );
      setSelectedItems(new Set());
      onParticipantsUpdate?.();
    } catch (e) {
      toast.error("Erreur lors du retrait");
    }
  };

  const renderItem = useCallback(
    (item: any) => {
      // Adapter pour les deux types (available vs edition list)
      const realId = Number(
        isFighters
          ? item.fighter?.id || item.fighter_id || item.id
          : item.region?.id || item.region_id || item.id
      );
      const isSelected = selectedItems.has(realId);

      if (isFighters) {
        const fighter = item.fighter || item;
        const region = fighter.region || item.region;
        return (
          <Card key={realId} className="hover:bg-gray-50 p-2 transition-colors">
            <CardContent className="p-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-1">
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => handleSelectItem(realId)}
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
                      {fighter.first_name} {fighter.last_name}{" "}
                      {fighter.nickname && `(${fighter.nickname})`}
                    </Typography>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge
                        variant={fighter.is_champion ? "default" : "outline"}
                      >
                        Classement: {fighter.ranking}
                      </Badge>
                      {region?.name && (
                        <Typography variant="caption2" theme="muted">
                          {region.name}
                        </Typography>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      } else {
        const region = item.region || item;
        return (
          <Card key={realId} className="hover:bg-gray-50 p-2 transition-colors">
            <CardContent className="p-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-1">
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => handleSelectItem(realId)}
                  />
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={region.flag_image} alt={region.name} />
                    <AvatarFallback className="bg-gray-200">
                      {region.code?.slice(0, 2).toUpperCase()}
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
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      }
    },
    [isFighters, selectedItems, handleSelectItem],
  );

  const StatsCard = useCallback(
    ({ title, value, icon: Icon, color = "primary" }: any) => (
      <Card className="p-2">
        <CardContent className="p-2">
          <div className="flex items-center justify-between">
            <div>
              <Typography variant="caption1" theme="muted">
                {title}
              </Typography>
              <Typography variant="h4" className="mt-1">
                {value}
              </Typography>
            </div>
            <div className={`p-2 bg-${color}/10 rounded-lg`}>
              <Icon className={`h-6 w-6 text-${color}`} />
            </div>
          </div>
        </CardContent>
      </Card>
    ),
    [],
  );

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div
        className={`grid grid-cols-1 ${isMobile ? "gap-2" : "md:grid-cols-3 gap-3"}`}
      >
        <StatsCard
          title={`Total ${entityName}`}
          value={totalAll}
          icon={Users}
          color="primary"
        />
        <StatsCard
          title="Disponibles"
          value={totalAvailable}
          icon={Square}
          color="green"
        />
        <StatsCard
          title="Dans l'édition"
          value={totalInEdition}
          icon={CheckSquare}
          color="blue"
        />
      </div>

      <div className={`flex ${isMobile ? "flex-col gap-4" : "gap-6"}`}>
        {/* Sidebar */}
        {isFighters && (
          <div className={`${isMobile ? "w-full" : "w-64 border-r pr-4"}`}>
            <Typography variant="h6" className="mb-4">
              Régions
            </Typography>
            <div
              className={`space-y-2 ${isMobile ? "flex overflow-x-auto pb-2" : "max-h-[500px] overflow-y-auto"}`}
            >
              <Card
                className={`cursor-pointer p-2 shrink-0 ${isMobile ? "w-48 mr-2" : ""} ${!selectedRegionId ? "border-primary bg-primary/5" : ""}`}
                onClick={() => setSelectedRegionId(null)}
              >
                <CardContent className="p-1">
                  <Typography variant="body-sm">Toutes les régions</Typography>
                </CardContent>
              </Card>
              {allRegions.map((region: any) => (
                <Card
                  key={region.id}
                  className={`cursor-pointer p-2 shrink-0 ${isMobile ? "w-48 mr-2" : ""} ${selectedRegionId === region.id ? "border-primary bg-primary/5" : ""}`}
                  onClick={() => setSelectedRegionId(region.id)}
                >
                  <CardContent className="p-1 flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={region.flag_image} />
                      <AvatarFallback>
                        {region.code?.slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <Typography variant="body-sm" className="truncate">
                      {region.name}
                    </Typography>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Main Area */}
        <div className="flex-1 min-w-0">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Typography variant="h5">Gestion des {entityName}</Typography>
              <div className="flex items-center gap-2">
                {selectedItems.size > 0 && (
                  <>
                    <Typography variant="body-sm">
                      {selectedItems.size} sélectionné(s)
                    </Typography>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleClearSelection}
                    >
                      Effacer
                    </Button>
                  </>
                )}
              </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="available">
                  <Plus className="h-4 w-4 mr-2 hidden sm:block" /> Disponibles
                  ({totalAvailable})
                </TabsTrigger>
                <TabsTrigger value="edition">
                  <CheckSquare className="h-4 w-4 mr-2 hidden sm:block" /> Dans
                  l'édition ({totalInEdition})
                </TabsTrigger>
              </TabsList>

              <div className="flex flex-col gap-4 mt-4">
                <div
                  className={`flex ${isMobile ? "flex-col gap-2" : "items-center gap-4"}`}
                >
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder={`Rechercher un ${entitySingular}...`}
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select
                    value={status}
                    onValueChange={(v: any) => setStatus(v)}
                  >
                    <SelectTrigger
                      className={isMobile ? "w-full" : "w-[140px]"}
                    >
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Statut" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous statuts</SelectItem>
                      <SelectItem value="active">Actifs</SelectItem>
                      <SelectItem value="inactive">Inactifs</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  {currentItems.length > 0 && (
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={
                          currentItems.length > 0 &&
                          currentItems.every((item: any) => {
                            const id = Number(
                              isFighters
                                ? item.fighter?.id || item.fighter_id || item.id
                                : item.region?.id || item.region_id || item.id
                            );
                            return selectedItems.has(id);
                          })
                        }
                        onCheckedChange={handleSelectAll}
                        id="select-all"
                      />
                      <label
                        htmlFor="select-all"
                        className="text-sm cursor-pointer"
                      >
                        Tout sélectionner
                      </label>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    {selectedItems.size > 0 && activeTab === "available" && (
                      <Button onClick={handleAddSelected} disabled={isMutating}>
                        <Plus className="h-4 w-4 mr-2" />
                        {!isMobile &&
                          `Ajouter ${selectedItems.size} ${entitySingular}(s)`}
                        {isMobile && "Ajouter"}
                      </Button>
                    )}
                    {selectedItems.size > 0 && activeTab === "edition" && (
                      <Button
                        variant="destructive"
                        onClick={handleRemoveSelected}
                        disabled={isMutating}
                      >
                        <X className="h-4 w-4 mr-2" />
                        {!isMobile &&
                          `Retirer ${selectedItems.size} ${entitySingular}(s)`}
                        {isMobile && "Retirer"}
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Items List */}
              <div className="mt-4 space-y-2">
                {currentQuery.isLoading && (
                  <div className="p-4 text-center">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                  </div>
                )}

                {!currentQuery.isLoading && currentItems.length === 0 && (
                  <Card className="p-4 text-center">
                    <Typography variant="body-base" theme="muted">
                      Aucun {entitySingular} trouvé.
                    </Typography>
                  </Card>
                )}

                {currentItems.map((item: any) => renderItem(item))}

                {/* Infinite Scroll Loader */}
                <div
                  ref={observerTarget}
                  className="h-10 flex items-center justify-center"
                >
                  {currentQuery.isFetchingNextPage && (
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  )}
                </div>
              </div>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
