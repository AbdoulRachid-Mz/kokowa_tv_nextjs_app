"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
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
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Fighter, Region } from "@/types";
import { toast } from "sonner";

interface ParticipantsManagerV2Props {
  editionId: number;
  type: "fighters" | "regions";
  currentParticipants: any[];
  onParticipantsUpdate?: () => void;
}

interface RegionWithSelection extends Region {
  isSelected?: boolean;
  isInEdition?: boolean;
  fightersCount?: number;
}

interface FighterWithSelection extends Fighter {
  isSelected?: boolean;
  isInEdition?: boolean;
  regionName?: string;
}

type DataState = {
  allRegions: RegionWithSelection[];
  allFighters: FighterWithSelection[];
  availableItems: (RegionWithSelection | FighterWithSelection)[];
  editionItems: (RegionWithSelection | FighterWithSelection)[];
  selectedItems: Set<number>;
  selectedRegionId: number | null;
  loading: boolean;
  initialized: boolean;
};

type PaginationState = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

type FilterState = {
  search: string;
  status: "all" | "active" | "inactive";
  regionId?: number;
};

export function ParticipantsManagerV2({
  editionId,
  type,
  currentParticipants,
  onParticipantsUpdate,
}: ParticipantsManagerV2Props) {
  const isFighters = type === "fighters";
  const entityName = isFighters ? "lutteurs" : "régions";
  const entitySingular = isFighters ? "lutteur" : "région";
  
  // États
  const [dataState, setDataState] = useState<DataState>({
    allRegions: [],
    allFighters: [],
    availableItems: [],
    editionItems: [],
    selectedItems: new Set(),
    selectedRegionId: null,
    loading: false,
    initialized: false,
  });

  const [activeTab, setActiveTab] = useState("available");
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    status: "all",
  });

  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  });

  const initializedRef = useRef(false);

  // Initialisation - exécutée une seule fois
  useEffect(() => {
    if (!initializedRef.current) {
      initializeData();
      initializedRef.current = true;
    }
  }, []); // Vide le tableau de dépendances pour s'exécuter une seule fois

  const initializeData = async () => {
    setDataState(prev => ({ ...prev, loading: true }));
    try {
      // Charger toutes les régions
      const regionsResponse = await fetch(`/api/regions?limit=100`);
      const regionsData = await regionsResponse.json();
      const allRegions: RegionWithSelection[] = (regionsData.data || []).map((region: Region) => ({
        ...region,
        isSelected: false,
        isInEdition: false,
      }));

      let allFighters: FighterWithSelection[] = [];
      if (isFighters) {
        // Charger tous les lutteurs avec leurs régions
        const fightersResponse = await fetch(`/api/fighters?limit=1000`);
        const fightersData = await fightersResponse.json();
        allFighters = (fightersData.data || []).map((fighter: Fighter) => ({
          ...fighter,
          isSelected: false,
          isInEdition: false,
          regionName: fighter.region?.name,
        }));
      }

      // Identifier les IDs déjà dans l'édition
      const editionRegionIds = new Set(
        currentParticipants
          .filter(item => item.region?.id || item.region_id)
          .map(item => item.region?.id || item.region_id)
      );

      const editionFighterIds = new Set(
        currentParticipants
          .filter(item => item.fighter?.id || item.fighter_id)
          .map(item => item.fighter?.id || item.fighter_id)
      );

      // Marquer les éléments dans l'édition
      const markedRegions = allRegions.map(region => ({
        ...region,
        isInEdition: editionRegionIds.has(region.id),
      }));

      const markedFighters = allFighters.map(fighter => ({
        ...fighter,
        isInEdition: editionFighterIds.has(fighter.id),
      }));

      // Séparer disponibles vs édition
      const availableItems = isFighters
        ? markedFighters.filter(item => !item.isInEdition)
        : markedRegions.filter(item => !item.isInEdition);

      const editionItems = isFighters
        ? markedFighters.filter(item => item.isInEdition)
        : markedRegions.filter(item => item.isInEdition);

      setDataState({
        allRegions: markedRegions,
        allFighters: markedFighters,
        availableItems,
        editionItems,
        selectedItems: new Set(),
        selectedRegionId: isFighters && markedRegions.length > 0 ? markedRegions[0].id : null,
        loading: false,
        initialized: true,
      });

      setPagination(prev => ({
        ...prev,
        total: availableItems.length,
        totalPages: Math.ceil(availableItems.length / prev.limit),
      }));

    } catch (error) {
      console.error("Erreur lors de l'initialisation:", error);
      toast.error("Erreur lors du chargement des données");
      setDataState(prev => ({ ...prev, loading: false, initialized: true }));
    }
  };

  // Mettre à jour quand les participants changent
  useEffect(() => {
    if (dataState.initialized) {
      refreshParticipants();
    }
  }, [currentParticipants, dataState.initialized]);

  const refreshParticipants = () => {
    if (!dataState.initialized) return;
    
    const editionRegionIds = new Set(
      currentParticipants
        .filter(item => item.region?.id || item.region_id)
        .map(item => item.region?.id || item.region_id)
    );

    const editionFighterIds = new Set(
      currentParticipants
        .filter(item => item.fighter?.id || item.fighter_id)
        .map(item => item.fighter?.id || item.fighter_id)
    );

    // Marquer les éléments dans l'édition
    const markedRegions = dataState.allRegions.map(region => ({
      ...region,
      isInEdition: editionRegionIds.has(region.id),
    }));

    const markedFighters = dataState.allFighters.map(fighter => ({
      ...fighter,
      isInEdition: editionFighterIds.has(fighter.id),
    }));

    // Séparer disponibles vs édition
    const availableItems = isFighters
      ? markedFighters.filter(item => !item.isInEdition)
      : markedRegions.filter(item => !item.isInEdition);

    const editionItems = isFighters
      ? markedFighters.filter(item => item.isInEdition)
      : markedRegions.filter(item => item.isInEdition);

    setDataState(prev => ({
      ...prev,
      allRegions: markedRegions,
      allFighters: markedFighters,
      availableItems,
      editionItems,
    }));

    setPagination(prev => ({
      ...prev,
      total: availableItems.length,
      totalPages: Math.ceil(availableItems.length / prev.limit),
    }));
  };

  // Filtrer les items - version corrigée
  const getFilteredItems = useMemo(() => {
    const sourceItems = activeTab === "available" 
      ? dataState.availableItems 
      : dataState.editionItems;

    let filtered = sourceItems;

    // Filtrer par région (seulement pour les lutteurs)
    if (isFighters && dataState.selectedRegionId) {
      filtered = filtered.filter(item => {
        const fighter = item as FighterWithSelection;
        return fighter.region_id === dataState.selectedRegionId;
      });
    }

    // Filtrer par recherche
    if (filters.search.trim()) {
      const term = filters.search.toLowerCase();
      filtered = filtered.filter(item => {
        if (isFighters) {
          const fighter = item as FighterWithSelection;
          return (
            fighter.first_name?.toLowerCase().includes(term) ||
            fighter.last_name?.toLowerCase().includes(term) ||
            fighter.nickname?.toLowerCase().includes(term)
          );
        } else {
          const region = item as RegionWithSelection;
          return (
            region.name?.toLowerCase().includes(term) ||
            region.code?.toLowerCase().includes(term)
          );
        }
      });
    }

    // Filtrer par statut
    if (filters.status !== "all") {
      const isActive = filters.status === "active";
      filtered = filtered.filter(item => {
        if (isFighters) {
          const fighter = item as FighterWithSelection;
          return fighter.is_active === isActive;
        } else {
          const region = item as RegionWithSelection;
          // Pour les régions, on considère le nombre de lutteurs
          return ((region.total_fighters || 0) > 0) === isActive;
        }
      });
    }

    // Filtrer par région (dropdown)
    if (isFighters && filters.regionId) {
      filtered = filtered.filter(item => {
        const fighter = item as FighterWithSelection;
        return fighter.region_id === filters.regionId;
      });
    }

    return filtered;
  }, [
    activeTab, 
    dataState.availableItems, 
    dataState.editionItems, 
    dataState.selectedRegionId,
    filters.search, 
    filters.status, 
    filters.regionId,
    isFighters
  ]);

  // Mettre à jour la pagination quand les items filtrés changent
  useEffect(() => {
    if (dataState.initialized) {
      const total = getFilteredItems.length;
      const totalPages = Math.ceil(total / pagination.limit);
      
      // Réinitialiser à la page 1 si le total change
      const newPage = pagination.page > totalPages ? 1 : pagination.page;
      
      setPagination(prev => ({ 
        ...prev, 
        total, 
        totalPages,
        page: newPage
      }));
    }
  }, [getFilteredItems.length, dataState.initialized]);

  // Gestion de la pagination
  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, page }));
  };

  // Gestion des sélections
  const handleSelectItem = useCallback((itemId: number) => {
    setDataState(prev => {
      const newSelectedItems = new Set(prev.selectedItems);
      if (newSelectedItems.has(itemId)) {
        newSelectedItems.delete(itemId);
      } else {
        newSelectedItems.add(itemId);
      }
      return { ...prev, selectedItems: newSelectedItems };
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    const startIndex = (pagination.page - 1) * pagination.limit;
    const endIndex = startIndex + pagination.limit;
    const currentPageItems = getFilteredItems.slice(startIndex, endIndex);
    
    setDataState(prev => {
      const allPageSelected = currentPageItems.every(item => 
        prev.selectedItems.has(item.id)
      );
      
      const newSelectedItems = new Set(prev.selectedItems);
      
      if (allPageSelected) {
        currentPageItems.forEach(item => newSelectedItems.delete(item.id));
      } else {
        currentPageItems.forEach(item => newSelectedItems.add(item.id));
      }
      
      return { ...prev, selectedItems: newSelectedItems };
    });
  }, [getFilteredItems, pagination.page, pagination.limit]);

  // Gestion de la région sélectionnée (sidebar)
  const handleSelectRegion = useCallback((regionId: number) => {
    setDataState(prev => ({ ...prev, selectedRegionId: regionId }));
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);

  // Ajouter des participants
  const handleAddSelected = async () => {
    if (dataState.selectedItems.size === 0) return;
    
    try {
      setDataState(prev => ({ ...prev, loading: true }));
      
      const promises = Array.from(dataState.selectedItems).map(async (itemId) => {
        if (isFighters) {
          // Trouver le lutteur pour obtenir son region_id
          const fighter = dataState.allFighters.find(f => f.id === itemId);
          const regionId = fighter?.region_id || null;
          
          return fetch(`/api/editions/${editionId}/fighters`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              fighter_id: itemId,
              // status: "registered",
              region_id: regionId,
            }),
          });
        } else {
          return fetch(`/api/editions/${editionId}/regions`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              region_id: itemId,
              // status: "registered",
            }),
          });
        }
      });

      const results = await Promise.allSettled(promises);
      const successful = results.filter(r => r.status === "fulfilled").length;
      
      if (successful > 0) {
        // Rafraîchir les participants après l'ajout
        refreshParticipants();
        toast.success(`${successful} ${entitySingular}(s) ajouté(s) avec succès`);
        onParticipantsUpdate?.();
      } else {
        toast.error("Erreur lors de l'ajout");
      }
      
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur lors de l'opération");
    } finally {
      setDataState(prev => ({ ...prev, loading: false }));
    }
  };

  // Retirer des participants
  const handleRemoveSelected = async () => {
    if (dataState.selectedItems.size === 0) return;
    
    try {
      setDataState(prev => ({ ...prev, loading: true }));
      
      const promises = Array.from(dataState.selectedItems).map(itemId => {
        if (isFighters) {
          return fetch(`/api/editions/${editionId}/fighters?fighter_id=${itemId}`, {
            method: "DELETE",
          });
        } else {
          return fetch(`/api/editions/${editionId}/regions?region_id=${itemId}`, {
            method: "DELETE",
          });
        }
      });

      const results = await Promise.allSettled(promises);
      const successful = results.filter(r => r.status === "fulfilled").length;
      
      if (successful > 0) {
        // Rafraîchir les participants après le retrait
        refreshParticipants();
        toast.success(`${successful} ${entitySingular}(s) retiré(s) avec succès`);
        onParticipantsUpdate?.();
      } else {
        toast.error("Erreur lors du retrait");
      }
      
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur lors de l'opération");
    } finally {
      setDataState(prev => ({ ...prev, loading: false }));
    }
  };

  // Effacer la sélection
  const handleClearSelection = useCallback(() => {
    setDataState(prev => ({ ...prev, selectedItems: new Set() }));
  }, []);

  // Rendu d'un item (lutteur ou région)
  const renderItem = useCallback((item: RegionWithSelection | FighterWithSelection) => {
    const isSelected = dataState.selectedItems.has(item.id);
    
    if (isFighters) {
      const fighter = item as FighterWithSelection;
      return (
        <Card key={fighter.id} className="hover:bg-gray-50 p-2 transition-colors">
          <CardContent className="p-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 flex-1">
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => handleSelectItem(fighter.id)}
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
                  <Typography variant="body-base" weight="medium" className="truncate">
                    {fighter.first_name} {fighter.last_name}
                    {fighter.nickname && (
                      <span className="text-gray-500 ml-1">({fighter.nickname})</span>
                    )}
                  </Typography>
                  <div className="flex items-center gap-2">
                    <Badge variant={fighter.is_champion ? "default" : "outline"}>
                      Classement: {fighter.ranking}
                    </Badge>
                    {fighter.regionName && (
                      <Typography variant="caption2" theme="muted">
                        {fighter.regionName}
                      </Typography>
                    )}
                  </div>
                </div>
              </div>
              
              <Badge variant={fighter.is_active ? "default" : "secondary"}>
                {fighter.is_active ? "Actif" : "Inactif"}
              </Badge>
            </div>
          </CardContent>
        </Card>
      );
    } else {
      const region = item as RegionWithSelection;
      return (
        <Card key={region.id} className="hover:bg-gray-50 p-2 transition-colors">
          <CardContent className="p-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 flex-1">
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => handleSelectItem(region.id)}
                />
                
                <Avatar className="h-10 w-10">
                  <AvatarImage src={region.flag_image} alt={region.name} />
                  <AvatarFallback className="bg-gray-200">
                    {region.code.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <Typography variant="body-base" weight="medium" className="truncate">
                    {region.name}
                  </Typography>
                  <div className="flex items-center gap-2">
                    <Typography variant="caption2" theme="muted">
                      {region.code}
                    </Typography>
                    <span className="text-gray-300">•</span>
                    <Typography variant="caption2" theme="muted">
                      {region.total_fighters || 0} lutteurs
                    </Typography>
                    <span className="text-gray-300">•</span>
                    <Typography variant="caption2" theme="muted">
                      {region.total_champions || 0} champions
                    </Typography>
                  </div>
                </div>
              </div>
              
              <Badge variant={region.total_fighters && region.total_fighters > 0 ? "default" : "secondary"}>
                {region.total_fighters && region.total_fighters > 0 ? "Active" : "Inactive"}
              </Badge>
            </div>
          </CardContent>
        </Card>
      );
    }
  }, [isFighters, dataState.selectedItems, handleSelectItem]);

  // Rendu des statistiques
  const StatsCard = useCallback(({ 
    title, 
    value, 
    icon: Icon,
    color = "primary" 
  }: { 
    title: string; 
    value: number; 
    icon: React.ElementType;
    color?: string;
  }) => (
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
  ), []);

  // Rendu de la sidebar des régions (seulement pour les lutteurs)
  const renderRegionsSidebar = useCallback(() => {
    if (!isFighters) return null;

    return (
      <div className="w-64 border-r pr-4">
        <Typography variant="h6" className="mb-4">
          Régions
        </Typography>
        <div className="space-y-2 max-h-[500px] overflow-y-auto">
          {dataState.allRegions.map(region => (
            <Card
              key={region.id}
              className={`cursor-pointer p-2 transition-all ${
                dataState.selectedRegionId === region.id
                  ? "border-primary bg-primary/5"
                  : ""
              }`}
              onClick={() => handleSelectRegion(region.id)}
            >
              <CardContent className="p-1">
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={region.flag_image} alt={region.name} />
                    <AvatarFallback>{region.code.slice(0, 2)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <Typography variant="body-sm" className="truncate">
                      {region.name}
                    </Typography>
                    <Typography variant="caption2" theme="muted">
                      {region.code} • {region.total_fighters || 0} lutteurs
                    </Typography>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }, [isFighters, dataState.allRegions, dataState.selectedRegionId, handleSelectRegion]);

  // Obtenir les items pour la page courante
  const currentPageItems = useMemo(() => {
    const startIndex = (pagination.page - 1) * pagination.limit;
    const endIndex = startIndex + pagination.limit;
    return getFilteredItems.slice(startIndex, endIndex);
  }, [getFilteredItems, pagination.page, pagination.limit]);

  // Vérifier si tous les items de la page sont sélectionnés
  const isAllPageSelected = useMemo(() => {
    return currentPageItems.length > 0 && 
      currentPageItems.every(item => dataState.selectedItems.has(item.id));
  }, [currentPageItems, dataState.selectedItems]);

  if (dataState.loading && !dataState.initialized) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <Typography variant="body-lg">Chargement des {entityName}...</Typography>
      </div>
    );
  }

  const selectedCount = dataState.selectedItems.size;

  return (
    <div className="space-y-4">
      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <StatsCard
          title={`Total ${entityName}`}
          value={isFighters ? dataState.allFighters.length : dataState.allRegions.length}
          icon={Users}
          color="primary"
        />
        <StatsCard
          title="Disponibles"
          value={dataState.availableItems.length}
          icon={Square}
          color="green"
        />
        <StatsCard
          title="Dans l'édition"
          value={dataState.editionItems.length}
          icon={CheckSquare}
          color="blue"
        />
      </div>

      {/* Layout principal avec sidebar si nécessaire */}
      <div className={`flex ${isFighters ? 'gap-6' : ''}`}>
        {renderRegionsSidebar()}
        
        <div className="flex-1">
          {/* Tabs et actions */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Typography variant="h5">
                {isFighters && dataState.selectedRegionId ? (
                  `Lutteurs - ${dataState.allRegions.find(r => r.id === dataState.selectedRegionId)?.name}`
                ) : (
                  `Gestion des ${entityName}`
                )}
              </Typography>
              
              <div className="flex items-center gap-2">
                {selectedCount > 0 && (
                  <>
                    <Typography variant="body-sm">
                      {selectedCount} sélectionné(s)
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
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter des {entityName} ({dataState.availableItems.length})
                </TabsTrigger>
                <TabsTrigger value="edition">
                  <CheckSquare className="h-4 w-4 mr-2" />
                  {entityName} participants ({dataState.editionItems.length})
                </TabsTrigger>
              </TabsList>

              {/* Barre de recherche et filtres */}
              <div className="flex flex-col gap-4 mt-4">
                <div className="flex items-center gap-4">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder={`Rechercher un ${entitySingular}...`}
                      value={filters.search}
                      onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                      className="pl-10"
                    />
                  </div>
                  
                  {/* Filtre statut */}
                  <Select
                    value={filters.status}
                    onValueChange={(value: "all" | "active" | "inactive") => 
                      setFilters(prev => ({ ...prev, status: value }))
                    }
                  >
                    <SelectTrigger className="w-[140px]">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Statut" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les statuts</SelectItem>
                      <SelectItem value="active">Actifs</SelectItem>
                      <SelectItem value="inactive">Inactifs</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Filtre région (seulement pour les lutteurs) */}
                  {isFighters && (
                    <Select
                      value={filters.regionId?.toString() || "all"}
                      onValueChange={(value) => 
                        setFilters(prev => ({ 
                          ...prev, 
                          regionId: value === "all" ? undefined : parseInt(value) 
                        }))
                      }
                    >
                      <SelectTrigger className="w-[180px]">
                        <MapPin className="h-4 w-4 mr-2" />
                        <SelectValue placeholder="Toutes régions" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Toutes les régions</SelectItem>
                        {dataState.allRegions.map(region => (
                          <SelectItem key={region.id} value={region.id.toString()}>
                            {region.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  {currentPageItems.length > 0 && (
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={isAllPageSelected}
                        onCheckedChange={handleSelectAll}
                        id="select-all"
                      />
                      <label htmlFor="select-all" className="text-sm cursor-pointer">
                        {isAllPageSelected ? "Désélectionner tout" : "Sélectionner tout"}
                      </label>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2">
                    {selectedCount > 0 && activeTab === "available" && (
                      <Button onClick={handleAddSelected} disabled={dataState.loading}>
                        <Plus className="h-4 w-4 mr-2" />
                        Ajouter {selectedCount} {entitySingular}(s)
                      </Button>
                    )}
                    
                    {selectedCount > 0 && activeTab === "edition" && (
                      <Button 
                        variant="destructive" 
                        onClick={handleRemoveSelected}
                        disabled={dataState.loading}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Retirer {selectedCount} {entitySingular}(s)
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Liste des items disponibles */}
              <TabsContent value="available" className="space-y-4">
                {currentPageItems.length === 0 ? (
                  <Card className="p-2">
                    <CardContent className="py-6 text-center">
                      <div className="flex flex-col items-center justify-center">
                        {isFighters ? (
                          <Users className="h-12 w-12 text-gray-400 mb-4" />
                        ) : (
                          <MapPin className="h-12 w-12 text-gray-400 mb-4" />
                        )}
                        <Typography variant="body-lg" theme="muted">
                          Aucun {entitySingular} disponible
                        </Typography>
                        <Typography variant="caption1" theme="muted" className="mt-2">
                          {filters.search || filters.status !== "all" || filters.regionId 
                            ? "Aucun résultat pour vos filtres" 
                            : `Tous les ${entityName} sont déjà dans l'édition`}
                        </Typography>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    <div className="space-y-2">
                      {currentPageItems.map(item => renderItem(item))}
                    </div>
                    
                    {/* Pagination */}
                    {pagination.totalPages > 1 && (
                      <Pagination>
                        <PaginationContent>
                          <PaginationItem>
                            <PaginationPrevious
                              onClick={() => handlePageChange(Math.max(1, pagination.page - 1))}
                              aria-disabled={pagination.page <= 1}
                              className={pagination.page <= 1 ? "pointer-events-none opacity-50" : ""}
                            />
                          </PaginationItem>
                          
                          {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                            let pageNum;
                            if (pagination.totalPages <= 5) {
                              pageNum = i + 1;
                            } else if (pagination.page <= 3) {
                              pageNum = i + 1;
                            } else if (pagination.page >= pagination.totalPages - 2) {
                              pageNum = pagination.totalPages - 4 + i;
                            } else {
                              pageNum = pagination.page - 2 + i;
                            }
                            
                            return (
                              <PaginationItem key={pageNum}>
                                <PaginationLink
                                  isActive={pageNum === pagination.page}
                                  onClick={() => handlePageChange(pageNum)}
                                >
                                  {pageNum}
                                </PaginationLink>
                              </PaginationItem>
                            );
                          })}
                          
                          <PaginationItem>
                            <PaginationNext
                              onClick={() => handlePageChange(Math.min(pagination.totalPages, pagination.page + 1))}
                              aria-disabled={pagination.page >= pagination.totalPages}
                              className={pagination.page >= pagination.totalPages ? "pointer-events-none opacity-50" : ""}
                            />
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>
                    )}
                  </>
                )}
              </TabsContent>

              {/* Liste des items dans l'édition */}
              <TabsContent value="edition" className="space-y-4">
                {currentPageItems.length === 0 ? (
                  <Card>
                    <CardContent className="py-8 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <CheckSquare className="h-12 w-12 text-gray-400 mb-4" />
                        <Typography variant="body-lg" theme="muted">
                          Aucun {entitySingular} dans l'édition
                        </Typography>
                        <Typography variant="caption1" theme="muted" className="mt-2">
                          {filters.search || filters.status !== "all" || filters.regionId
                            ? "Aucun résultat pour vos filtres"
                            : `Ajoutez des ${entityName} depuis l'onglet "Ajouter"`}
                        </Typography>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    <div className="space-y-2">
                      {currentPageItems.map(item => renderItem(item))}
                    </div>
                    
                    {/* Pagination */}
                    {pagination.totalPages > 1 && (
                      <Pagination>
                        <PaginationContent>
                          <PaginationItem>
                            <PaginationPrevious
                              onClick={() => handlePageChange(Math.max(1, pagination.page - 1))}
                              aria-disabled={pagination.page <= 1}
                              className={pagination.page <= 1 ? "pointer-events-none opacity-50" : ""}
                            />
                          </PaginationItem>
                          
                          {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                            let pageNum;
                            if (pagination.totalPages <= 5) {
                              pageNum = i + 1;
                            } else if (pagination.page <= 3) {
                              pageNum = i + 1;
                            } else if (pagination.page >= pagination.totalPages - 2) {
                              pageNum = pagination.totalPages - 4 + i;
                            } else {
                              pageNum = pagination.page - 2 + i;
                            }
                            
                            return (
                              <PaginationItem key={pageNum}>
                                <PaginationLink
                                  isActive={pageNum === pagination.page}
                                  onClick={() => handlePageChange(pageNum)}
                                >
                                  {pageNum}
                                </PaginationLink>
                              </PaginationItem>
                            );
                          })}
                          
                          <PaginationItem>
                            <PaginationNext
                              onClick={() => handlePageChange(Math.min(pagination.totalPages, pagination.page + 1))}
                              aria-disabled={pagination.page >= pagination.totalPages}
                              className={pagination.page >= pagination.totalPages ? "pointer-events-none opacity-50" : ""}
                            />
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>
                    )}
                  </>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}