"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Typography } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft, 
  Edit, 
  Plus, 
  Calendar,
  Trophy,
  Users,
  MapPin,
  Award,
  Swords,
  Folder,
  Layers,
  Shield
} from "lucide-react";
import { PhaseGroup, SubGroup } from "@/types";
import { EntityList } from "@/components/shared/entity-list";
import { useEntityList } from "@/hooks/use-entity-list";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { CreateSubGroupDialog } from "@/components/phase-groups/create-sub-group-dialog";

export default function PhaseGroupDetailPage() {
  const params = useParams();
  const router = useRouter();
  const groupId = params.groupId as string;
  
  const [group, setGroup] = useState<PhaseGroup | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [createSubGroupOpen, setCreateSubGroupOpen] = useState(false);

  // Charger les détails du groupe
  useEffect(() => {
    const fetchGroup = async () => {
      try {
        const response = await fetch(`/api/phase-groups/${groupId}?with_relations=true`);
        if (response.ok) {
          const data = await response.json();
          setGroup(data);
        } else {
          console.error("Erreur lors du chargement du groupe");
        }
      } catch (error) {
        console.error("Erreur réseau:", error);
      } finally {
        setLoading(false);
      }
    };

    if (groupId) {
      fetchGroup();
    }
  }, [groupId]);

  // Hook pour les sous-groupes
  const subGroupsList = useEntityList<SubGroup>({
    entityType: 'sub-groups',
    defaultFilters: {
      group_id: parseInt(groupId),
      with_belt_fighters: true,
      with_belt_regions: true,
      with_matches: true,
    },
  });

  // Statistiques pour le groupe
  const getGroupStats = () => {
    if (!group) return [];

    const totalSubGroups = group.sub_groups?.length || 0;
    const totalMatches = group.sub_groups?.reduce((sum, sg) => sum + (sg.matches?.length || 0), 0) || 0;
    const completedSubGroups = group.sub_groups?.filter(sg => sg.is_completed).length || 0;
    const groupsWithBelts = group.sub_groups?.filter(sg => 
      sg.belt1_fighter_id || sg.belt2_fighter_id || sg.belt1_region_id || sg.belt2_region_id
    ).length || 0;

    return [
      {
        label: "Sous-groupes",
        value: totalSubGroups,
        icon: Layers,
        color: "text-blue-600",
        description: "Sous-groupes créés",
      },
      {
        label: "Matchs Programmes",
        value: totalMatches,
        icon: Swords,
        color: "text-green-600",
        description: "Matchs totaux",
      },
      {
        label: "Sous-groupes Terminés",
        value: completedSubGroups,
        icon: Trophy,
        color: "text-purple-600",
        description: "Sous-groupes complétés",
      },
      {
        label: "Avec Ceintures",
        value: groupsWithBelts,
        icon: Shield,
        color: "text-orange-600",
        description: "Sous-groupes avec ceintures",
      },
    ];
  };

  // Gestionnaires d'actions
  const handleEditGroup = () => {
    router.push(`/admin/phase-groups/${groupId}/edit`);
  };

  const handleViewSubGroup = (subGroup: SubGroup) => {
    router.push(`/admin/sub-groups/${subGroup.id}`);
  };

  const handleEditSubGroup = (subGroup: SubGroup) => {
    router.push(`/admin/sub-groups/${subGroup.id}/edit`);
  };

  const handleManageMatches = (subGroup: SubGroup) => {
    router.push(`/admin/sub-groups/${subGroup.id}/matches`);
  };

  const handleManageGroupMatches = () => {
    router.push(`/admin/phase-groups/${groupId}/matches`);
  };

  // Rendu des cartes pour les sous-groupes
  const renderSubGroupCard = (subGroup: SubGroup, viewMode: 'grid' | 'list') => {
    const isListView = viewMode === 'list';
    const statusConfig = getStatusBadge(subGroup.is_completed);
    const hasBelt1 = subGroup.belt1_fighter || subGroup.belt1_region;
    const hasBelt2 = subGroup.belt2_fighter || subGroup.belt2_region;
    const matchesCount = subGroup.matches?.length || 0;

    return (
      <Card className={cn(
        "hover:shadow-lg transition-all duration-300 cursor-pointer group border-l-4",
        isListView && "flex",
        subGroup.is_completed ? "border-l-green-500" : "border-l-orange-500"
      )}>
        <div className={cn("p-4", isListView && "flex items-center gap-4 flex-1")}>
          <div className={cn("flex-shrink-0 mb-3", isListView && "mb-0")}>
            <div className={cn(
              "w-12 h-12 rounded-lg flex items-center justify-center text-white",
              subGroup.is_completed ? "bg-gradient-to-br from-green-500 to-emerald-600" : "bg-gradient-to-br from-orange-500 to-red-600"
            )}>
              <Layers className="h-6 w-6" />
            </div>
          </div>

          <div className={cn("flex-1", isListView && "flex items-center justify-between")}>
            <div className={cn(isListView && "flex items-center gap-6")}>
              <div>
                <CardTitle className="text-lg group-hover:text-primary transition-colors">
                  {subGroup.name}
                </CardTitle>
                
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant={statusConfig.variant} className={statusConfig.color}>
                    {subGroup.is_completed ? "Terminé" : "En cours"}
                  </Badge>
                  
                  {matchesCount > 0 && (
                    <Badge variant="outline">
                      {matchesCount} match(s)
                    </Badge>
                  )}

                  {(hasBelt1 || hasBelt2) && (
                    <Badge variant="secondary">
                      Ceintures
                    </Badge>
                  )}
                </div>

                <div className="space-y-2 text-sm">
                  <Typography variant="body-sm" className="text-muted-foreground">
                    Ordre: {subGroup.sub_group_order}
                  </Typography>
                  
                  {/* Affichage des ceintures */}
                  <div className="flex flex-wrap gap-2">
                    {hasBelt1 && (
                      <div className="flex items-center gap-1">
                        <Shield className="h-3 w-3 text-blue-500" />
                        <Typography variant="caption2" className="text-muted-foreground">
                          Ceinture 1: {subGroup.belt1_fighter ? 
                            `${subGroup.belt1_fighter.first_name} ${subGroup.belt1_fighter.last_name}` : 
                            subGroup.belt1_region?.name}
                        </Typography>
                      </div>
                    )}
                    
                    {hasBelt2 && (
                      <div className="flex items-center gap-1">
                        <Shield className="h-3 w-3 text-red-500" />
                        <Typography variant="caption2" className="text-muted-foreground">
                          Ceinture 2: {subGroup.belt2_fighter ? 
                            `${subGroup.belt2_fighter.first_name} ${subGroup.belt2_fighter.last_name}` : 
                            subGroup.belt2_region?.name}
                        </Typography>
                      </div>
                    )}
                  </div>
                  
                  {subGroup.description && (
                    <Typography variant="body-sm" className="text-muted-foreground line-clamp-2">
                      {subGroup.description}
                    </Typography>
                  )}
                </div>
              </div>

              {isListView && (
                <div className="text-right">
                  <Typography variant="h4" weight="bold" className="text-primary">
                    {subGroup.sub_group_order}
                  </Typography>
                  <Typography variant="caption2" theme="muted">
                    Ordre
                  </Typography>
                </div>
              )}
            </div>

            <div className={cn("flex gap-2 mt-3", isListView && "mt-0 flex-col")}>
              <Button 
                variant="outline" 
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleManageMatches(subGroup);
                }}
              >
                Matchs
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleViewSubGroup(subGroup);
                }}
              >
                Voir
              </Button>
              <Button 
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleEditSubGroup(subGroup);
                }}
              >
                Modifier
              </Button>
            </div>
          </div>
        </div>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-64" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!group) {
    return (
      <div className="text-center py-12">
        <Typography variant="h3" theme="muted">
          Groupe non trouvé
        </Typography>
        <Button 
          onClick={() => router.push('/admin/phase-groups')}
          className="mt-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour aux groupes
        </Button>
      </div>
    );
  }

  const statusConfig = getStatusBadge(group.is_completed);

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => router.push(`/admin/phases/${group.phase_id}`)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <div>
            <Typography variant="h3" weight="bold" gradient animated>
              {group.name}
            </Typography>
            <Typography variant="lead" theme="muted">
              {group.phase?.name} • Édition {group.phase?.edition?.edition_number} - {group.phase?.edition?.year}
            </Typography>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant={statusConfig.variant} className={statusConfig.color}>
            {statusConfig.label}
          </Badge>
          <Button 
            variant="outline"
            onClick={handleEditGroup}
          >
            <Edit className="h-4 w-4 mr-2" />
            Modifier
          </Button>
          <Button onClick={() => setCreateSubGroupOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nouveau Sous-groupe
          </Button>
          <Button onClick={handleManageGroupMatches}>
            <Swords className="h-4 w-4 mr-2" />
            Gérer Matchs
          </Button>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {getGroupStats().map((stat, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <Typography variant="body-sm" theme="muted" className="mb-1">
                    {stat.label}
                  </Typography>
                  <Typography variant="h3" weight="bold" className="mb-1">
                    {stat.value}
                  </Typography>
                  <Typography variant="caption2" theme="muted">
                    {stat.description}
                  </Typography>
                </div>
                <div className={`p-3 rounded-lg bg-opacity-10 ${stat.color} bg-current`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Informations et navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="sub-groups">Sous-groupes</TabsTrigger>
          <TabsTrigger value="matches">Matchs du Groupe</TabsTrigger>
        </TabsList>

        {/* Vue d'ensemble */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Informations principales */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Informations du Groupe</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Typography variant="body-sm" theme="muted" className="mb-1">
                      Nom
                    </Typography>
                    <Typography variant="body-base" weight="medium">
                      {group.name}
                    </Typography>
                  </div>
                  
                  <div>
                    <Typography variant="body-sm" theme="muted" className="mb-1">
                      Ordre
                    </Typography>
                    <Typography variant="body-base" weight="medium">
                      {group.group_order}
                    </Typography>
                  </div>
                  
                  <div>
                    <Typography variant="body-sm" theme="muted" className="mb-1">
                      Phase
                    </Typography>
                    <Typography variant="body-base" weight="medium">
                      {group.phase?.name}
                    </Typography>
                  </div>
                  
                  <div>
                    <Typography variant="body-sm" theme="muted" className="mb-1">
                      Statut
                    </Typography>
                    <Badge variant={statusConfig.variant} className={statusConfig.color}>
                      {statusConfig.label}
                    </Badge>
                  </div>
                </div>
                
                {group.description && (
                  <div>
                    <Typography variant="body-sm" theme="muted" className="mb-1">
                      Description
                    </Typography>
                    <Typography variant="body-base" className="italic">
                      {group.description}
                    </Typography>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Actions rapides */}
            <Card>
              <CardHeader>
                <CardTitle>Actions Rapides</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  className="w-full justify-start"
                  onClick={() => setCreateSubGroupOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nouveau Sous-groupe
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={handleManageGroupMatches}
                >
                  <Swords className="h-4 w-4 mr-2" />
                  Gérer les Matchs
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => router.push(`/admin/phase-groups/${groupId}/participants`)}
                >
                  <Users className="h-4 w-4 mr-2" />
                  Gérer Participants
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => router.push(`/admin/phase-groups/${groupId}/calendar`)}
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Calendrier
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Sous-groupes récents */}
          {group.sub_groups && group.sub_groups.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Sous-groupes Récents</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {group.sub_groups.slice(0, 3).map((subGroup) => (
                    <div key={subGroup.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => handleViewSubGroup(subGroup)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <Typography variant="body-base" weight="medium">
                          {subGroup.name}
                        </Typography>
                        <Badge variant={subGroup.is_completed ? "default" : "secondary"}>
                          {subGroup.is_completed ? "Terminé" : "En cours"}
                        </Badge>
                      </div>
                      <Typography variant="body-sm" theme="muted" className="mb-2">
                        Ordre {subGroup.sub_group_order} • {subGroup.matches?.length || 0} match(s)
                      </Typography>
                      {subGroup.description && (
                        <Typography variant="body-sm" className="line-clamp-2">
                          {subGroup.description}
                        </Typography>
                      )}
                    </div>
                  ))}
                </div>
                {group.sub_groups.length > 3 && (
                  <div className="text-center mt-4">
                    <Button 
                      variant="outline"
                      onClick={() => setActiveTab("sub-groups")}
                    >
                      Voir tous les sous-groupes ({group.sub_groups.length})
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Sous-groupes */}
        <TabsContent value="sub-groups">
          <EntityList
            title="Sous-groupes du Groupe"
            description={`Gérez les sous-groupes de ${group.name}`}
            entityType="sub-groups"
            data={subGroupsList.data}
            total={subGroupsList.total}
            loading={subGroupsList.loading}
            page={subGroupsList.page}
            limit={subGroupsList.limit}
            onPageChange={subGroupsList.setPage}
            onLimitChange={subGroupsList.setLimit}
            searchTerm={subGroupsList.searchTerm}
            onSearchChange={subGroupsList.setSearchTerm}
            filters={subGroupsList.filters}
            onFilterChange={subGroupsList.setFilters}
            onAdd={() => setCreateSubGroupOpen(true)}
            onRefresh={subGroupsList.onRefresh}
            viewMode={subGroupsList.viewMode}
            onViewModeChange={subGroupsList.setViewMode}
            renderCard={renderSubGroupCard}
          />
        </TabsContent>

        {/* Matchs du groupe */}
        <TabsContent value="matches">
          <Card>
            <CardHeader>
              {/* <CardTitle>Matchs du Groupe</CardTitle> */}
              Matchs du Groupe
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Swords className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <Typography variant="h4" theme="muted" className="mb-2">
                  Gestion des Matchs du Groupe
                </Typography>
                <Typography variant="body-sm" theme="muted" className="mb-4">
                  Gérez les rencontres entre les sous-groupes de ce groupe
                </Typography>
                <Button onClick={handleManageGroupMatches}>
                  <Swords className="h-4 w-4 mr-2" />
                  Gérer les Matchs
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog de création de sous-groupe */}
      <CreateSubGroupDialog 
        open={createSubGroupOpen}
        onOpenChange={setCreateSubGroupOpen}
        groupId={parseInt(groupId)}
        onSuccess={() => {
          subGroupsList.onRefresh();
          setCreateSubGroupOpen(false);
        }}
      />
    </div>
  );
}

// Utilitaires
const getStatusBadge = (isCompleted: boolean) => {
  return isCompleted 
    ? { label: 'Terminé', variant: 'default' as const, color: 'bg-green-100 text-green-800' }
    : { label: 'En cours', variant: 'secondary' as const, color: 'bg-orange-100 text-orange-800' };
};

const CardTitle1 = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <Typography variant="h4" weight="medium" className={className}>
    {children}
  </Typography>
);