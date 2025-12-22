"use client";

import { useState, useEffect } from "react";
import { Typography } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  ArrowUpDown
} from "lucide-react";
import { Fighter, Region } from "@/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";

interface ParticipantsManagerProps {
  editionId: number;
  type: 'fighters' | 'regions';
  currentParticipants: any[];
  onParticipantsUpdate?: () => void;
}

export function ParticipantsManager({ 
  editionId, 
  type, 
  currentParticipants, 
  onParticipantsUpdate 
}: ParticipantsManagerProps) {
  const [allItems, setAllItems] = useState<any[]>([]);
  const [currentItems, setCurrentItems] = useState<any[]>(currentParticipants);
  const [loading, setLoading] = useState(true);
  const [currentLoading, setCurrentLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentSearchTerm, setCurrentSearchTerm] = useState("");
  const [addingItems, setAddingItems] = useState<Set<number>>(new Set());
  const [removingItems, setRemovingItems] = useState<Set<number>>(new Set());
  const [filters, setFilters] = useState({
    status: 'all',
    sort_by: type === 'fighters' ? 'ranking' : 'name',
    sort_order: 'asc' as 'asc' | 'desc'
  });

  const isFighters = type === 'fighters';
  const entityName = isFighters ? 'lutteurs' : 'régions';
  const currentIds = new Set(currentItems.map(p => isFighters ? p.fighter?.id : p.region?.id));

  useEffect(() => {
    fetchAllItems();
    fetchCurrentParticipants();
  }, [type]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchCurrentParticipants();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [currentSearchTerm, filters]);

  const fetchAllItems = async () => {
    setLoading(true);
    try {
      const endpoint = isFighters ? '/api/fighters?limit=1000' : '/api/regions?limit=1000';
      const response = await fetch(endpoint);
      if (response.ok) {
        const data = await response.json();
        setAllItems(data.data || []);
      }
    } catch (error) {
      console.error(`Erreur lors du chargement des ${entityName}:`, error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentParticipants = async () => {
    setCurrentLoading(true);
    try {
      const endpoint = `/api/editions/${editionId}/${type}/list?${new URLSearchParams({
        search: currentSearchTerm,
        status: filters.status !== 'all' ? filters.status : '',
        sort_by: filters.sort_by,
        sort_order: filters.sort_order,
        limit: '1000'
      })}`;
      
      const response = await fetch(endpoint);
      if (response.ok) {
        const data = await response.json();
        setCurrentItems(data.data || []);
      }
    } catch (error) {
      console.error(`Erreur lors du chargement des ${entityName} participants:`, error);
    } finally {
      setCurrentLoading(false);
    }
  };

  const handleAddItem = async (itemId: number) => {
    setAddingItems(prev => new Set(prev).add(itemId));
    try {
      const endpoint = `/api/editions/${editionId}/${type}`;
      const body: any = { status: 'registered' };

      if (isFighters) {
        const fighter = allItems.find(f => f.id === itemId);
        body.fighter_id = itemId;
        if (fighter?.region?.id) body.region_id = fighter.region.id;
      } else {
        body.region_id = itemId;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        fetchCurrentParticipants();
        onParticipantsUpdate?.();
      } else {
        throw new Error('Erreur lors de l\'ajout');
      }
    } catch (error) {
      console.error(`Erreur lors de l'ajout du ${entityName}:`, error);
    } finally {
      setAddingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
    }
  };

  const handleRemoveItem = async (itemId: number) => {
    setRemovingItems(prev => new Set(prev).add(itemId));
    try {
      const endpoint = `/api/editions/${editionId}/${type}?${isFighters ? 'fighter_id' : 'region_id'}=${itemId}`;
      const response = await fetch(endpoint, { method: 'DELETE' });

      if (response.ok) {
        fetchCurrentParticipants();
        onParticipantsUpdate?.();
      } else {
        throw new Error('Erreur lors du retrait');
      }
    } catch (error) {
      console.error(`Erreur lors du retrait du ${entityName}:`, error);
    } finally {
      setRemovingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
    }
  };

  const filteredItems = allItems.filter(item => {
    const searchLower = searchTerm.toLowerCase();
    if (isFighters) {
      const fighter = item as Fighter;
      return fighter.first_name.toLowerCase().includes(searchLower) ||
             fighter.last_name.toLowerCase().includes(searchLower) ||
             fighter.nickname?.toLowerCase().includes(searchLower);
    } else {
      const region = item as Region;
      return region.name.toLowerCase().includes(searchLower) ||
             region.code.toLowerCase().includes(searchLower);
    }
  });

  const getItemDisplayName = (item: any) => {
    if (isFighters) {
      const fighter = item.fighter || item;
      return `${fighter.first_name} ${fighter.last_name}${fighter.nickname ? ` (${fighter.nickname})` : ''}`;
    } else {
      const region = item.region || item;
      return `${region.name} (${region.code})`;
    }
  };

  const getItemDetails = (item: any) => {
    if (isFighters) {
      const fighter = item.fighter || item;
      return `Classement: ${fighter.ranking} • ${fighter.region?.name || 'Région non spécifiée'}`;
    } else {
      const region = item.region || item;
      return `${region.total_fighters} lutteurs • ${region.total_champions} champions`;
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      registered: { label: 'Inscrit', variant: 'secondary' as const },
      approved: { label: 'Approuvé', variant: 'default' as const },
      rejected: { label: 'Rejeté', variant: 'destructive' as const },
      qualified: { label: 'Qualifié', variant: 'default' as const },
      disqualified: { label: 'Disqualifié', variant: 'destructive' as const },
      withdrawn: { label: 'Retiré', variant: 'outline' as const },
    };
    
    return statusConfig[status as keyof typeof statusConfig] || statusConfig.registered;
  };

  const FilterSection = () => (
    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
      {/* Filtre par statut */}
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <Select
          value={filters.status}
          onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
        >
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous statuts</SelectItem>
            <SelectItem value="registered">Inscrit</SelectItem>
            <SelectItem value="approved">Approuvé</SelectItem>
            <SelectItem value="rejected">Rejeté</SelectItem>
            {isFighters && (
              <>
                <SelectItem value="qualified">Qualifié</SelectItem>
                <SelectItem value="disqualified">Disqualifié</SelectItem>
                <SelectItem value="withdrawn">Retiré</SelectItem>
              </>
            )}
          </SelectContent>
        </Select>
      </div>

      {/* Tri */}
      <div className="flex items-center gap-2">
        <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
        <Select
          value={filters.sort_by}
          onValueChange={(value) => setFilters(prev => ({ ...prev, sort_by: value }))}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Trier par" />
          </SelectTrigger>
          <SelectContent>
            {isFighters ? (
              <>
                <SelectItem value="ranking">Classement</SelectItem>
                <SelectItem value="name">Nom</SelectItem>
                <SelectItem value="registration_date">Date d'inscription</SelectItem>
                <SelectItem value="status">Statut</SelectItem>
              </>
            ) : (
              <>
                <SelectItem value="name">Nom</SelectItem>
                <SelectItem value="code">Code</SelectItem>
                <SelectItem value="total_fighters">Nombre de lutteurs</SelectItem>
                <SelectItem value="registration_date">Date d'inscription</SelectItem>
                <SelectItem value="status">Statut</SelectItem>
              </>
            )}
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setFilters(prev => ({ 
            ...prev, 
            sort_order: prev.sort_order === 'asc' ? 'desc' : 'asc' 
          }))}
        >
          {filters.sort_order === 'asc' ? '↑' : '↓'}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div>
        {/* <Typography variant="h3" className="flex items-center gap-2">
          {isFighters ? <Users className="h-6 w-6" /> : <MapPin className="h-6 w-6" />}
          Gestion des {entityName}
        </Typography> */}
        {/* <Typography variant="body-sm" theme="muted">
          Ajoutez ou retirez des {entityName} de cette édition
        </Typography> */}
      </div>

      <Tabs defaultValue="available" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="available" >
            {entityName} disponibles ({filteredItems.length})
          </TabsTrigger>
          <TabsTrigger value="current">
            {entityName} participants ({currentItems.length})
          </TabsTrigger>
        </TabsList>

        {/* Onglet des éléments disponibles */}
        <TabsContent value="available" className="space-y-2">
          {/* Barre de recherche */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={`Rechercher un ${isFighters ? 'lutteur...' : 'région...'}`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredItems.length === 0 ? (
            <Card>
              <CardContent className="py-4 text-center">
                <Typography variant="body-lg" theme="muted">
                  Aucun {entityName} trouvé
                </Typography>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-2">
              {filteredItems.map((item) => {
                const itemId = item.id;
                const isAdded = currentIds.has(itemId);
                const isAdding = addingItems.has(itemId);

                return (
                  <Card key={itemId} className={isAdded ? "opacity-60 p-2" : "p-2"}>
                    <CardContent className="p-2">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 flex items-center">
                          {item.profile_image ? (
                            <div className="mr-3">
                              <Avatar className="h-10 w-10">
                                <AvatarImage src={item.profile_image} alt={getItemDisplayName(item)} />
                                <AvatarFallback>
                                  {isFighters
                                    ? `${item.first_name?.[0]}${item.last_name?.[0]}`
                                    : item.code?.[0]}
                                </AvatarFallback>
                              </Avatar>
                            </div>
                          ) : (
                             <div className="mr-3">
                              <Avatar className="h-10 w-10">
                                <AvatarImage src={item.flag_image} alt={getItemDisplayName(item)} />
                                <AvatarFallback>
                                  {isFighters
                                    ? `${item.first_name?.[0]}${item.last_name?.[0]}`
                                    : item.code?.[0]}
                                </AvatarFallback>
                              </Avatar>
                            </div>
                          )}
                          <div className="">
                          <Typography variant="body-base" weight="medium" className="mb-1">
                            {getItemDisplayName(item)}
                          </Typography>
                          <Typography variant="body-sm" theme="muted">
                            {getItemDetails(item)}
                          </Typography>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {isAdded ? (
                            <Badge variant="outline" className="flex items-center gap-1">
                              <Check className="h-3 w-3" />
                              Ajouté
                            </Badge>
                          ) : (
                            <Button
                              size="sm"
                              disabled={isAdding}
                              onClick={() => handleAddItem(itemId)}
                            >
                              {isAdding ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Plus className="h-4 w-4" />
                              )}
                              Ajouter
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Onglet des participants actuels */}
        <TabsContent value="current" className="space-y-4">
          {/* Filtres et recherche */}
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={`Rechercher parmi les participants...`}
                value={currentSearchTerm}
                onChange={(e) => setCurrentSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <FilterSection />
          </div>

          {currentLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : currentItems.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <Typography variant="body-lg" theme="muted">
                  Aucun {entityName} participant pour le moment
                </Typography>
                <Typography variant="body-sm" theme="muted" className="mt-2">
                  Utilisez l'onglet "{entityName} disponibles" pour en ajouter
                </Typography>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3">
              {currentItems.map((participant) => {
                const item = isFighters ? participant.fighter : participant.region;
                const itemId = item.id;
                const isRemoving = removingItems.has(itemId);
                const statusConfig = getStatusBadge(participant.status);

                return (
                  <Card key={participant.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Typography variant="body-base" weight="medium">
                              {getItemDisplayName(participant)}
                            </Typography>
                            <Badge variant={statusConfig.variant}>
                              {statusConfig.label}
                            </Badge>
                          </div>
                          
                          <Typography variant="body-sm" theme="muted" className="mb-2">
                            {getItemDetails(participant)}
                          </Typography>
                          
                          <Typography variant="caption2" theme="muted">
                            Inscrit le {new Date(participant.registration_date).toLocaleDateString()}
                          </Typography>
                        </div>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={isRemoving}
                          onClick={() => handleRemoveItem(itemId)}
                        >
                          {isRemoving ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <X className="h-4 w-4" />
                          )}
                          Retirer
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}