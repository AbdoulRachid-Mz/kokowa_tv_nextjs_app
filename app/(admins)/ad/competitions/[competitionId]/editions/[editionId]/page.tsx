// app/admin/editions/[editionId]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Typography } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
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
  Shield
} from "lucide-react";
import { CompetitionEdition, Phase, Fighter, Region } from "@/types";
import { EntityList } from "@/components/shared/entity-list";
import { useEntityList } from "@/hooks/use-entity-list";
import { PhaseCard } from "@/components/entities/entity-cards";

export default function EditionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const editionId = params.editionId as string;
  
  const [edition, setEdition] = useState<CompetitionEdition | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  // Charger les détails de l'édition
  useEffect(() => {
    const fetchEdition = async () => {
      try {
        const response = await fetch(`/api/editions/${editionId}?with_relations=true`);
        if (response.ok) {
          const data = await response.json();
          setEdition(data);
        } else {
          console.error("Erreur lors du chargement de l'édition");
        }
      } catch (error) {
        console.error("Erreur réseau:", error);
      } finally {
        setLoading(false);
      }
    };

    if (editionId) {
      fetchEdition();
    }
  }, [editionId]);

  // Hooks pour les listes
  const phasesList = useEntityList<Phase>({
    entityType: 'phases',
    defaultFilters: {
      edition_id: parseInt(editionId),
    },
  });

  const fightersList = useEntityList<Fighter>({
    entityType: 'fighters',
    defaultFilters: {
      // Les lutteurs participants seront chargés via une API spécifique
      limit: 20,
    },
  });

  const regionsList = useEntityList<Region>({
    entityType: 'regions',
    defaultFilters: {
      // Les régions participantes seront chargées via une API spécifique
      limit: 20,
    },
  });

  // Statistiques pour l'édition
  const getEditionStats = () => {
    if (!edition) return [];

    const totalFighters = edition.fighters?.length || 0;
    const totalRegions = edition.regions?.length || 0;
    const totalPhases = edition.phases?.length || 0;
    const completedPhases = edition.phases?.filter(p => p.is_completed).length || 0;

    return [
      {
        label: "Lutteurs Inscrits",
        value: totalFighters,
        icon: Users,
        color: "text-blue-600",
        description: "Participants individuels",
      },
      {
        label: "Régions Participantes",
        value: totalRegions,
        icon: MapPin,
        color: "text-green-600",
        description: "Régions engagées",
      },
      {
        label: "Phases de Compétition",
        value: totalPhases,
        icon: Trophy,
        color: "text-purple-600",
        description: `${completedPhases} terminée(s)`,
      },
      {
        label: "Participants Total",
        value: edition.total_participants || 0,
        icon: Award,
        color: "text-orange-600",
        description: "Lutteurs et régions",
      },
    ];
  };

  // Obtenir le statut de l'édition
  const getEditionStatus = () => {
    if (!edition?.start_date || !edition?.end_date) return 'upcoming';
    
    const now = new Date();
    const start = new Date(edition.start_date);
    const end = new Date(edition.end_date);
    
    if (now >= start && now <= end) return 'ongoing';
    if (now > end) return 'completed';
    return 'upcoming';
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      upcoming: { label: 'À venir', variant: 'secondary' as const, color: 'bg-blue-100 text-blue-800' },
      ongoing: { label: 'En cours', variant: 'default' as const, color: 'bg-green-100 text-green-800' },
      completed: { label: 'Terminée', variant: 'outline' as const },
    };
    
    return statusConfig[status as keyof typeof statusConfig] || statusConfig.upcoming;
  };

  // Gestionnaires d'actions
  const handleAddPhase = () => {
    router.push(`/ad/editions/${editionId}/phases/new`);
  };

  const handleAddFighter = () => {
    router.push(`/ad/editions/${editionId}/fighters/new`);
  };

  const handleAddRegion = () => {
    router.push(`/admin/editions/${editionId}/regions/new`);
  };

  const handleEditPhase = (phase: Phase) => {
    router.push(`/ad/editions/${editionId}/phases/${phase.id}/edit`);
  };

  const handleViewPhase = (phase: Phase) => {
    router.push(`/ad/editions/${editionId}/phases/${phase.id}`);
  };

  const handleEditEdition = () => {
    router.push(`/ad/editions/${editionId}/edit`);
  };

  // // Rendu des cartes pour les phases
  // const renderPhaseCard = (phase: Phase, viewMode: 'grid' | 'list' | 'compact') => {
  //   const isListView = viewMode === 'list';
  //   const statusConfig = getStatusBadge(phase.is_completed ? 'completed' : 'ongoing');

  //   return (
  //     <Card className={cn(
  //       "hover:shadow-lg transition-all duration-300 cursor-pointer group border-l-4",
  //       isListView && "flex",
  //       phase.is_completed ? "border-l-green-500" : "border-l-orange-500"
  //     )}>
  //       <div className={cn("p-4", isListView && "flex items-center gap-4 flex-1")}>
  //         <div className={cn("flex-shrink-0 mb-3", isListView && "mb-0")}>
  //           <div className={cn(
  //             "w-12 h-12 rounded-lg flex items-center justify-center text-white",
  //             phase.is_completed ? "bg-gradient-to-br from-green-500 to-emerald-600" : "bg-gradient-to-br from-orange-500 to-red-600"
  //           )}>
  //             <Trophy className="h-6 w-6" />
  //           </div>
  //         </div>

  //         <div className={cn("flex-1", isListView && "flex items-center justify-between")}>
  //           <div className={cn(isListView && "flex items-center gap-6")}>
  //             <div>
  //               <CardTitle className="text-lg group-hover:text-primary transition-colors">
  //                 {phase.name}
  //               </CardTitle>
                
  //               <div className="flex items-center gap-2 mb-2">
  //                 <Badge variant={statusConfig.variant} className={'color' in statusConfig ? statusConfig.color : undefined}>
  //                   {phase.is_completed ? "Terminée" : "En cours"}
  //                 </Badge>
                  
  //                 <Badge variant="outline">
  //                   {phase.phase_type}
  //                 </Badge>
  //               </div>

  //               <div className="space-y-1 text-sm">
  //                 {phase.start_date && phase.end_date && (
  //                   <div className="flex items-center gap-1 text-muted-foreground">
  //                     <Calendar className="h-3 w-3" />
  //                     {new Date(phase.start_date).toLocaleDateString()} - {new Date(phase.end_date).toLocaleDateString()}
  //                   </div>
  //                 )}
                  
  //                 {phase.description && (
  //                   <Typography variant="body-sm" className="text-muted-foreground">
  //                     {phase.description}
  //                   </Typography>
  //                 )}
  //               </div>
  //             </div>

  //             {isListView && (
  //               <div className="text-right">
  //                 <Typography variant="h4" weight="bold" className="text-primary">
  //                   {phase.phase_order}
  //                 </Typography>
  //                 <Typography variant="caption2" theme="muted">
  //                   Ordre
  //                 </Typography>
  //               </div>
  //             )}
  //           </div>

  //           <div className={cn("flex gap-2 mt-3", isListView && "mt-0")}>
  //             <Button 
  //               variant="outline" 
  //               size="sm"
  //               onClick={(e) => {
  //                 e.stopPropagation();
  //                 handleViewPhase(phase);
  //               }}
  //             >
  //               Voir
  //             </Button>
  //             <Button 
  //               size="sm"
  //               onClick={(e) => {
  //                 e.stopPropagation();
  //                 handleEditPhase(phase);
  //               }}
  //             >
  //               Modifier
  //             </Button>
  //           </div>
  //         </div>
  //       </div>
  //     </Card>
  //   );
  // };

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

  if (!edition) {
    return (
      <div className="text-center py-12">
        <Typography variant="h3" theme="muted">
          Édition non trouvée
        </Typography>
        <Button 
          onClick={() => router.push('/admin/competitions')}
          className="mt-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour aux compétitions
        </Button>
      </div>
    );
  }

  const status = getEditionStatus();
  const statusConfig = getStatusBadge(status);

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => router.push(`/admin/competitions/${edition.competition_id}`)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <div>
            <Typography variant="h3" weight="bold" gradient animated>
              Édition {edition.edition_number} - {edition.year}
            </Typography>
            <Typography variant="lead" theme="muted">
              {edition.competition?.name}
            </Typography>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline"
            onClick={handleEditEdition}
          >
            <Edit className="h-4 w-4 mr-2" />
            Modifier
          </Button>
          <Button onClick={handleAddPhase}>
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle Phase
          </Button>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {getEditionStats().map((stat, index) => (
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
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="phases">Phases</TabsTrigger>
          <TabsTrigger value="fighters">Lutteurs</TabsTrigger>
          <TabsTrigger value="regions">Régions</TabsTrigger>
          <TabsTrigger value="matches">Matchs</TabsTrigger>
        </TabsList>

        {/* Vue d'ensemble */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Informations principales */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Informations de l'Édition</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Typography variant="body-sm" theme="muted" className="mb-1">
                      Numéro d'édition
                    </Typography>
                    <Typography variant="body-base" weight="medium">
                      {edition.edition_number}
                    </Typography>
                  </div>
                  
                  <div>
                    <Typography variant="body-sm" theme="muted" className="mb-1">
                      Année
                    </Typography>
                    <Typography variant="body-base" weight="medium">
                      {edition.year}
                    </Typography>
                  </div>
                  
                  <div>
                    <Typography variant="body-sm" theme="muted" className="mb-1">
                      Statut
                    </Typography>
<Badge variant={statusConfig.variant} className={'color' in statusConfig ? statusConfig.color : undefined}>
                      {statusConfig.label}
                    </Badge>
                  </div>
                  
                  {edition.winner_fighter && (
                    <div>
                      <Typography variant="body-sm" theme="muted" className="mb-1">
                        Vainqueur
                      </Typography>
                      <Typography variant="body-base" weight="bold" className="text-green-600">
                        {edition.winner_fighter.first_name} {edition.winner_fighter.last_name}
                      </Typography>
                    </div>
                  )}
                  
                  {edition.start_date && edition.end_date && (
                    <>
                      <div>
                        <Typography variant="body-sm" theme="muted" className="mb-1">
                          Date de début
                        </Typography>
                        <Typography variant="body-base">
                          {new Date(edition.start_date).toLocaleDateString()}
                        </Typography>
                      </div>
                      
                      <div>
                        <Typography variant="body-sm" theme="muted" className="mb-1">
                          Date de fin
                        </Typography>
                        <Typography variant="body-base">
                          {new Date(edition.end_date).toLocaleDateString()}
                        </Typography>
                      </div>
                    </>
                  )}
                </div>
                
                {edition.theme && (
                  <div>
                    <Typography variant="body-sm" theme="muted" className="mb-1">
                      Thème
                    </Typography>
                    <Typography variant="body-base" className="italic">
                      "{edition.theme}"
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
                  onClick={handleAddPhase}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nouvelle Phase
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={handleAddFighter}
                >
                  <Users className="h-4 w-4 mr-2" />
                  Ajouter des Lutteurs
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={handleAddRegion}
                >
                  <MapPin className="h-4 w-4 mr-2" />
                  Ajouter des Régions
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => router.push(`/admin/editions/${editionId}/matches`)}
                >
                  <Swords className="h-4 w-4 mr-2" />
                  Voir les Matchs
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => router.push(`/admin/editions/${editionId}/calendar`)}
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Calendrier
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Phases récentes */}
          {edition.phases && edition.phases.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Phases Récentes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {edition.phases.slice(0, 3).map((phase) => (
                    <div key={phase.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => handleViewPhase(phase)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <Typography variant="body-base" weight="medium">
                          {phase.name}
                        </Typography>
                        <Badge variant={phase.is_completed ? "default" : "secondary"}>
                          {phase.is_completed ? "Terminée" : "En cours"}
                        </Badge>
                      </div>
                      <Typography variant="body-sm" theme="muted" className="mb-2">
                        {phase.phase_type} • Ordre {phase.phase_order}
                      </Typography>
                      {phase.description && (
                        <Typography variant="body-sm" className="line-clamp-2">
                          {phase.description}
                        </Typography>
                      )}
                    </div>
                  ))}
                </div>
                {edition.phases.length > 3 && (
                  <div className="text-center mt-4">
                    <Button 
                      variant="outline"
                      onClick={() => setActiveTab("phases")}
                    >
                      Voir toutes les phases ({edition.phases.length})
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Phases */}
        <TabsContent value="phases">
          <EntityList
            title="Phases de l'Édition"
            description={`Gérez les phases de l'édition ${edition.edition_number}`}
            entityType="phase"
            data={phasesList.data}
            total={phasesList.total}
            loading={phasesList.loading}
            page={phasesList.page}
            limit={phasesList.limit}
            onPageChange={phasesList.setPage}
            onLimitChange={phasesList.setLimit}
            searchTerm={phasesList.searchTerm}
            onSearchChange={phasesList.setSearchTerm}
            filters={phasesList.filters}
            onFilterChange={phasesList.setFilters}
            onAdd={handleAddPhase}
            onRefresh={phasesList.onRefresh}
            viewMode={phasesList.viewMode}
            onViewModeChange={phasesList.setViewMode}
            renderCard={(item, viewMode) => <PhaseCard item={item} viewMode={viewMode} onView={handleViewPhase} onEdit={handleEditPhase} />}
          />
        </TabsContent>

        {/* Lutteurs */}
        <TabsContent value="fighters">
          <Card>
            <CardHeader>
              <CardTitle>Lutteurs Participants</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <Typography variant="h4" theme="muted" className="mb-2">
                  Gestion des Lutteurs
                </Typography>
                <Typography variant="body-sm" theme="muted" className="mb-4">
                  Ajoutez et gérez les lutteurs participants à cette édition
                </Typography>
                <Button onClick={handleAddFighter}>
                  <Plus className="h-4 w-4 mr-2" />
                  Gérer les Lutteurs
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Régions */}
        <TabsContent value="regions">
          <Card>
            <CardHeader>
              <CardTitle>Régions Participantes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <Typography variant="h4" theme="muted" className="mb-2">
                  Gestion des Régions
                </Typography>
                <Typography variant="body-sm" theme="muted" className="mb-4">
                  Ajoutez et gérez les régions participantes à cette édition
                </Typography>
                <Button onClick={handleAddRegion}>
                  <Plus className="h-4 w-4 mr-2" />
                  Gérer les Régions
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Matchs */}
        <TabsContent value="matches">
          <Card>
            <CardHeader>
              <CardTitle>Matchs de l'Édition</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Swords className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <Typography variant="h4" theme="muted" className="mb-2">
                  Gestion des Matchs
                </Typography>
                <Typography variant="body-sm" theme="muted" className="mb-4">
                  Consultez et gérez tous les matchs de cette édition
                </Typography>
                <Button onClick={() => router.push(`/admin/editions/${editionId}/matches`)}>
                  <Swords className="h-4 w-4 mr-2" />
                  Voir les Matchs
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Utilitaire cn pour les classes conditionnelles
function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}