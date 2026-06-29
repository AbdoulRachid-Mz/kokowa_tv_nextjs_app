// components/editions/participants-manager-v2.tsx
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
  UserPlus,
  MapPinPlus,
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
import { useQueryClient } from "@tanstack/react-query";

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
  editionQueryKeys
} from "@/hooks/use-editions-participants";

import { useQuery } from "@tanstack/react-query";
import { SelectionStatusBar } from "./selection-status-bar";
import { QuickAddDialog } from "./quick-add-dialog";
import { QuickEditDialog } from "./quick-edit-dialog";

interface ParticipantsManagerV2Props {
  editionId: number;
  type: "fighters" | "regions";
  currentParticipants: any[];
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
  const queryClient = useQueryClient();

  // États
  const [activeTab, setActiveTab] = useState("available");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | "active" | "inactive">("all");
  const [selectedRegionId, setSelectedRegionId] = useState<number | null>(null);
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [isLoadingAll, setIsLoadingAll] = useState(false);
  
  // États pour les dialogues
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

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
      const res = await fetch("/api/regions?limit=100");
      return res.json();
    },
    enabled: isFighters,
  });
  const allRegions = allRegionsResponse?.data || [];

  // Prepare filters
  const queryFilters = {
    search: debouncedSearch,
    limit: 100,
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

  // Déduplication
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

  // Totaux
  const totalAvailable = availableQuery.data?.pages[0]?.pagination?.total || 0;
  const totalInEdition = editionQuery.data?.pages[0]?.pagination?.total || 0;
  const totalAll = totalAvailable + totalInEdition;
  const totalLoaded = currentItems.length;
  const totalForCurrentTab = activeTab === "available" ? totalAvailable : totalInEdition;

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

  // ========== GESTION DE LA SÉLECTION ==========
  
  const handleSelectItem = useCallback((itemId: number) => {
    setSelectedItems((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
  }, []);

  // Sélectionner UNIQUEMENT les éléments déjà chargés
  const handleSelectAll = useCallback(() => {
    if (currentItems.length === 0) return;

    const allSelected = currentItems.every((item: any) => {
      const id = Number(
        isFighters
          ? item.fighter?.id || item.fighter_id || item.id
          : item.region?.id || item.region_id || item.id
      );
      return selectedItems.has(id);
    });

    if (allSelected) {
      // Désélectionner tous les éléments chargés
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
    } else {
      // Sélectionner tous les éléments chargés
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
    }
  }, [currentItems, selectedItems, isFighters]);

  // ========== CHARGEMENT DE TOUS LES ÉLÉMENTS ==========
  
  const handleLoadAll = useCallback(async () => {
    setIsLoadingAll(true);
    try {
      const baseParams: any = {
        search: debouncedSearch,
        limit: 0,
        ...(isFighters && selectedRegionId ? { region_id: selectedRegionId } : {}),
        ...(status === "active" ? { is_active: 1 } : status === "inactive" ? { is_active: 0 } : {}),
      };

      let url = "";
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

      // Mettre à jour le cache React Query
      const currentQueryKey = isFighters
        ? activeTab === "available"
          ? editionQueryKeys.availableFighters(editionId, queryFilters)
          : editionQueryKeys.editionFighters(editionId, queryFilters)
        : activeTab === "available"
          ? editionQueryKeys.availableRegions(editionId, queryFilters)
          : editionQueryKeys.editionRegions(editionId, queryFilters);

      queryClient.setQueryData(
        currentQueryKey,
        (oldData: any) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            pages: [{
              ...oldData.pages[0],
              data: allItems,
              pagination: {
                ...oldData.pages[0].pagination,
                total: allItems.length,
              }
            }],
          };
        }
      );

      toast.success(`${allItems.length} ${entitySingular} chargés`);
    } catch (error) {
      console.error("Erreur lors du chargement global:", error);
      toast.error("Erreur lors du chargement de tous les éléments");
    } finally {
      setIsLoadingAll(false);
    }
  }, [
    activeTab,
    debouncedSearch,
    isFighters,
    selectedRegionId,
    status,
    editionId,
    queryFilters,
    queryClient,
    entitySingular,
  ]);

  // ========== AJOUT / RETRAIT EN MASSE ==========
  
  const handleAddSelected = async () => {
    if (selectedItems.size === 0) return;

    const toastId = toast.loading(`Ajout de ${selectedItems.size} ${entitySingular}...`);
    let successCount = 0;

    const promises = Array.from(selectedItems).map(async (id) => {
      try {
        if (isFighters) {
          const fighter = availableItems.find((f: any) => 
            (f.fighter?.id || f.fighter_id || f.id) === id
          );
          await addFighter.mutateAsync({
            editionId,
            fighterId: id,
            regionId: fighter?.region_id || fighter?.region?.id,
            status: "registered",
          });
        } else {
          await addRegion.mutateAsync({
            editionId,
            regionId: id,
            status: "registered",
          });
        }
        successCount++;
      } catch (error) {
        console.error("Erreur d'ajout:", error);
      }
    });

    await Promise.allSettled(promises);
    
    toast.success(`${successCount}/${selectedItems.size} ${entitySingular} ajoutés`, { id: toastId });
    setSelectedItems(new Set());
    onParticipantsUpdate?.();
  };

  const handleRemoveSelected = async () => {
    if (selectedItems.size === 0) return;

    const toastId = toast.loading(`Retrait de ${selectedItems.size} ${entitySingular}...`);
    let successCount = 0;

    const promises = Array.from(selectedItems).map(async (id) => {
      try {
        if (isFighters) {
          const item = editionItems.find(
            (f: any) => (f.fighter?.id || f.fighter_id || f.id) === id
          );
          const realFighterId = item?.fighter?.id || item?.fighter_id || id;
          await removeFighter.mutateAsync({
            editionId,
            fighterId: realFighterId,
          });
        } else {
          const item = editionItems.find(
            (r: any) => (r.region?.id || r.region_id || r.id) === id
          );
          const realRegionId = item?.region?.id || item?.region_id || id;
          await removeRegion.mutateAsync({
            editionId,
            regionId: realRegionId,
          });
        }
        successCount++;
      } catch (error) {
        console.error("Erreur de retrait:", error);
      }
    });

    await Promise.allSettled(promises);
    
    toast.success(`${successCount}/${selectedItems.size} ${entitySingular} retirés`, { id: toastId });
    setSelectedItems(new Set());
    onParticipantsUpdate?.();
  };

  // ========== DOUBLE-CLICK POUR ÉDITER ==========
  
  const handleDoubleClick = useCallback((item: any) => {
    setEditingItem(item);
    setIsEditDialogOpen(true);
  }, []);

  // ========== RENDU DES ÉLÉMENTS ==========
  
  const renderItem = useCallback(
    (item: any) => {
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
          <Card
            key={realId}
            className="hover:bg-gray-50 dark:hover:bg-gray-800 p-2 transition-colors cursor-pointer"
            onDoubleClick={() => handleDoubleClick(item)}
          >
            <CardContent className="p-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-1">
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => handleSelectItem(realId)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <Avatar className="h-10 w-10">
                    <AvatarImage
                      src={fighter.profile_image}
                      alt={`${fighter.first_name} ${fighter.last_name}`}
                    />
                    <AvatarFallback className="bg-gray-200 dark:bg-gray-700">
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
                      {fighter.nickname && ` (${fighter.nickname})`}
                    </Typography>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge
                        variant={fighter.is_champion ? "default" : "outline"}
                        className={fighter.is_champion ? "bg-yellow-500" : ""}
                      >
                        {fighter.is_champion ? "🏆 Champion" : `Rank: ${fighter.ranking || 0}`}
                      </Badge>
                      {region?.name && (
                        <Typography variant="caption2" theme="muted">
                          {region.name}
                        </Typography>
                      )}
                      {!fighter.is_active && (
                        <Badge variant="destructive" className="text-xs">
                          Inactif
                        </Badge>
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
          <Card
            key={realId}
            className="hover:bg-gray-50 dark:hover:bg-gray-900 p-2 transition-colors cursor-pointer"
            onDoubleClick={() => handleDoubleClick(item)}
          >
            <CardContent className="p-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-1">
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => handleSelectItem(realId)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={region.flag_image} alt={region.name} />
                    <AvatarFallback className="bg-gray-200 dark:bg-gray-700">
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
                      {region.total_fighters !== undefined && (
                        <Badge variant="outline" className="text-xs">
                          {region.total_fighters} lutteurs
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      }
    },
    [isFighters, selectedItems, handleSelectItem, handleDoubleClick]
  );

  // ========== STATS CARD ==========
  
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

  // Contexte pour la barre de statut
  const statusContext = isFighters && selectedRegionId
    ? allRegions.find((r: any) => r.id === selectedRegionId)?.name
    : "Toutes les régions";

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
        {/* Sidebar - Régions (uniquement pour les fighters) */}
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
                      onClick={() => setSelectedItems(new Set())}
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

                <div className="flex items-center justify-between flex-wrap gap-2">
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
                        Tout sélectionner ({currentItems.length})
                      </label>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    {selectedItems.size > 0 && activeTab === "available" && (
                      <Button
                        onClick={handleAddSelected}
                        disabled={isMutating}
                        size="sm"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Ajouter {selectedItems.size}
                      </Button>
                    )}
                    {selectedItems.size > 0 && activeTab === "edition" && (
                      <Button
                        variant="destructive"
                        onClick={handleRemoveSelected}
                        disabled={isMutating}
                        size="sm"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Retirer {selectedItems.size}
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

      {/* Selection Status Bar - Floating */}
      {totalForCurrentTab > 20 && (
        <SelectionStatusBar
          loadedCount={totalLoaded}
          totalCount={totalForCurrentTab}
          onLoadAll={handleLoadAll}
          isLoading={isLoadingAll}
          label={entitySingular}
          context={statusContext}
        />
      )}

      {/* Bouton d'ajout rapide - Floating */}
      <Button
        className="fixed bottom-6 right-6 z-50 rounded-full shadow-lg h-14 w-14"
        size="icon"
        onClick={() => setIsQuickAddOpen(true)}
      >
        {isFighters ? (
          <UserPlus className="h-6 w-6" />
        ) : (
          <MapPinPlus className="h-6 w-6" />
        )}
      </Button>

      {/* Quick Add Dialog */}
      <QuickAddDialog
        open={isQuickAddOpen}
        onOpenChange={setIsQuickAddOpen}
        type={isFighters ? "fighter" : "region"}
        editionId={editionId}
        onSuccess={() => {
          availableQuery.refetch();
          editionQuery.refetch();
          onParticipantsUpdate?.();
        }}
        regions={allRegions}
      />

      {/* Quick Edit Dialog */}
      <QuickEditDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        item={editingItem}
        type={type === "fighters" ? "fighter" : "region"}
        onSuccess={() => {
          availableQuery.refetch();
          editionQuery.refetch();
          onParticipantsUpdate?.();
        }}
      />
    </div>
  );
}