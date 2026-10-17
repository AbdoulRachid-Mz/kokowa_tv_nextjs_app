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
  Shield,
  RefreshCcw,
} from "lucide-react";
import { CompetitionEdition, Phase, Fighter, Region } from "@/types";
import { EntityList } from "@/components/shared/entity-list";
import { useEntityList } from "@/hooks/use-entity-list";
import { cn } from "@/lib/utils";
import { PhaseFormDialog } from "@/components/editions/phase-form";
import { PhaseCard, FighterCard, RegionCard } from "@/components/entities/entity-cards";
import { MiniFighterCard, MiniRegionCard } from "@/components/entities/mini-entity-cards";
import { CardStats } from "@/components/entities/card-stats";
import { StatsCarousel } from "@/components/shared/stats-carousel";
import { toast } from "sonner"

export default function EditionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const editionId = params.editionId as string;

  const [edition, setEdition] = useState<CompetitionEdition | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [phaseDialogOpen, setPhaseDialogOpen] = useState<boolean>(false);

  const handleOnSuccess = () => {
    toast.success("Lutteur créé ou modifié avec succès");
    setPhaseDialogOpen(false);
    setActiveTab("phases");
  };

  // Charger les détails de l'édition
  useEffect(() => {
    const fetchEdition = async () => {
      try {
        const response = await fetch(
          `/api/editions/${editionId}?with_competition=true&with_fighters=false&with_regions=false&with_phases=false`
        );
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

  // Utilisation de useEntityList pour fetcher les données séparément
  const phasesList = useEntityList<Phase>({
    entityType: 'phases',
    defaultFilters: { edition_id: Number(editionId) },
    defaultLimit: 10
  });

  const fightersList = useEntityList<Fighter>({
    entityType: 'fighters',
    apiPath: `/api/editions/${editionId}/fighters`,
    defaultLimit: 20,
    defaultFilters: { edition_id: Number(editionId) },
  });
  // console.log("fightersList.data:",fightersList.data);

  const regionsList = useEntityList<Region>({
    entityType: 'regions',
    apiPath: `/api/editions/${editionId}/regions`,
    defaultFilters: { edition_id: Number(editionId) },
    defaultLimit: 20,
  });

  const isFightersLoading = fightersList.loading;
  const isRegionsLoading = regionsList.loading;
  const isPhasesLoading = phasesList.loading;

  // Statistiques pour l'édition
  const getEditionStats = () => {
    if (!edition) return [];

    return [
      {
        label: "Lutteurs Inscrits",
        value: edition.fighters_count || 0,
        icon: Users,
        color: "text-blue-600",
        description: "Participants individuels",
      },
      {
        label: "Régions Participantes",
        value: edition.regions_count || 0,
        icon: MapPin,
        color: "text-green-600",
        description: "Régions engagées",
      },
      {
        label: "Phases de Compétition",
        value: edition.phases_count || 0,
        icon: Trophy,
        color: "text-purple-600",
        description: `Total des phases`,
      },
      {
        label: "Matchs Total",
        value: edition.matches_count || 0,
        icon: Swords,
        color: "text-orange-600",
        description: "Matchs prévus",
      },
    ];
  };

  // Obtenir le statut de l'édition
  const getEditionStatus = () => {
    if (!edition?.start_date || !edition?.end_date) return "upcoming";

    const now = new Date();
    const start = new Date(edition.start_date);
    const end = new Date(edition.end_date);

    if (now >= start && now <= end) return "ongoing";
    if (now > end) return "completed";
    return "upcoming";
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      upcoming: {
        label: "À venir",
        variant: "secondary" as const,
        color: "bg-blue-100 text-blue-800",
      },
      ongoing: {
        label: "En cours",
        variant: "default" as const,
        color: "bg-green-100 text-green-800",
      },
      completed: { label: "Terminée", variant: "outline" as const },
    };

    return (
      statusConfig[status as keyof typeof statusConfig] || statusConfig.upcoming
    );
  };

  // Gestionnaires d'actions
  const handleAddPhase = () => {
    setPhaseDialogOpen(true);
  };

  const handleAddFighter = () => {
    router.push(`/ad/editions/${editionId}/fighters`);
  };

  const handleAddRegion = () => {
    router.push(`/ad/editions/${editionId}/regions`);
  };

  const handleEditPhase = (phase: Phase) => {
    router.push(`/ad/phases/${phase.id}/edit`);
  };

  const handleReplace = (edition: CompetitionEdition) => {
    router.push(`/ad/editions/${edition.id}/replace`);
  };

  const handleViewPhase = (phase: Phase) => {
    router.push(`/ad/phases/${phase.id}`);
  };

  const handleEditEdition = () => {
    router.push(`/ad/editions/${editionId}/edit`);
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

  if (!edition) {
    return (
      <div className="text-center py-12">
        <Typography variant="h3" theme="muted">
          Édition non trouvée
        </Typography>
        <Button
          onClick={() => router.push("/ad/competitions")}
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
    <div className="space-y-4">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              router.push(`/ad/competitions/${edition.competition_id}`)
            }
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <div className="">
            <Typography variant="h5" weight="bold" animated>
              Édition {edition.edition_number} - {edition.year}
            </Typography>
            <Typography variant="h5" theme="muted">
              {edition.competition?.name}
            </Typography>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleEditEdition}>
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
      <StatsCarousel>
        {getEditionStats().map((stat, index) => (
          <CardStats key={index} label={stat.label} icon={stat.icon} value={stat.value} color={stat.color} />
        ))}
      </StatsCarousel>
      {/* Informations et navigation */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="phases">Phases</TabsTrigger>
          <TabsTrigger value="fighters">Lutteurs</TabsTrigger>
          <TabsTrigger value="regions">Régions</TabsTrigger>
          {/* <TabsTrigger value="matches">Matchs</TabsTrigger> */}
        </TabsList>

        {/* Vue d'ensemble */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Informations principales */}
            <Card className="lg:col-span-2 p-2">
              <CardHeader>
                <CardTitle>Informations de l'Édition</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Typography
                      variant="body-sm"
                      theme="muted"
                      className="mb-1"
                    >
                      Numéro d'édition
                    </Typography>
                    <Typography variant="body-base" weight="medium">
                      {edition.edition_number}
                    </Typography>
                  </div>

                  <div>
                    <Typography
                      variant="body-sm"
                      theme="muted"
                      className="mb-1"
                    >
                      Année
                    </Typography>
                    <Typography variant="body-base" weight="medium">
                      {edition.year}
                    </Typography>
                  </div>

                  <div>
                    <Typography
                      variant="body-sm"
                      theme="muted"
                      className="mb-1"
                    >
                      Statut
                    </Typography>
                    <Badge
                      variant={statusConfig.variant}
                      className={
                        "color" in statusConfig ? statusConfig.color : undefined
                      }
                    >
                      {statusConfig.label}
                    </Badge>
                  </div>

                  {edition.winner_fighter && (
                    <div>
                      <Typography
                        variant="body-sm"
                        theme="muted"
                        className="mb-1"
                      >
                        Vainqueur
                      </Typography>
                      <Typography
                        variant="body-base"
                        weight="bold"
                        className="text-green-600"
                      >
                        {edition.winner_fighter.first_name}{" "}
                        {edition.winner_fighter.last_name}
                      </Typography>
                    </div>
                  )}

                  {edition.start_date && edition.end_date && (
                    <>
                      <div>
                        <Typography
                          variant="body-sm"
                          theme="muted"
                          className="mb-1"
                        >
                          Date de début
                        </Typography>
                        <Typography variant="body-base">
                          {new Date(edition.start_date).toLocaleDateString()}
                        </Typography>
                      </div>

                      <div>
                        <Typography
                          variant="body-sm"
                          theme="muted"
                          className="mb-1"
                        >
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
                    <Typography
                      variant="body-sm"
                      theme="muted"
                      className="mb-1"
                    >
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
                  Gerer les Lutteurs
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={handleAddRegion}
                >
                  <MapPin className="h-4 w-4 mr-2" />
                  Gerer les Régions
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() =>
                    router.push(`/ad/editions/${editionId}/matches`)
                  }
                >
                  <Swords className="h-4 w-4 mr-2" />
                  Voir les Matchs
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => handleReplace(edition)}
                >
                  <RefreshCcw className="h-4 w-4 mr-2" />
                  Remplacement
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
                    <div
                      key={phase.id}
                      className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => handleViewPhase(phase)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <Typography variant="body-base" weight="medium">
                          {phase.name}
                        </Typography>
                        <Badge
                          variant={phase.is_completed ? "default" : "secondary"}
                        >
                          {phase.is_completed ? "Terminée" : "En cours"}
                        </Badge>
                      </div>
                      <Typography
                        variant="body-sm"
                        theme="muted"
                        className="mb-2"
                      >
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
            onViewModeChange={(mode) => {
              if (mode !== "carousel") {
                phasesList.setViewMode(mode);
              }
            }}
            renderCard={(phase: Phase, viewMode) => (
              <PhaseCard 
                item={phase}
                viewMode={viewMode as "grid" | "list" | "compact"}
                onView={handleViewPhase}
                onEdit={handleEditPhase}
              />
            )}
          />
        </TabsContent>


        {/* Lutteurs */}
        <TabsContent value="fighters">
          <EntityList
            title="Lutteurs de l'Édition"
            description={`Gérez les lutteurs de l'édition ${edition.edition_number}`}
            entityType='fighters'
            data={fightersList.data}
            total={fightersList.total}
            loading={fightersList.loading}
            page={fightersList.page}
            limit={fightersList.limit}
            onPageChange={fightersList.setPage}
            onLimitChange={fightersList.setLimit}
            searchTerm={fightersList.searchTerm}
            onSearchChange={fightersList.setSearchTerm}
            filters={fightersList.filters}
            onFilterChange={fightersList.setFilters}
            onAdd={handleAddFighter}
            onRefresh={fightersList.onRefresh}
            viewMode={fightersList.viewMode}
            onViewModeChange={(mode) => {
              if (mode !== "carousel") {
                fightersList.setViewMode(mode);
              }
            }}
            renderCard={(item: Fighter, viewMode) => (
              <MiniFighterCard 
                item={item}
                viewMode={viewMode as "grid" | "list" | "compact"}
                onView={() => router.push(`/ad/fighters/${item.id}`)}
              />
            )}
          />
        </TabsContent>

        {/* Régions */}
        <TabsContent value="regions">
          <EntityList
            title="Regions de l'Édition"
            description={`Gérez les regions de l'édition ${edition.edition_number}`}
            entityType="region"
            data={regionsList.data}
            total={regionsList.total}
            loading={regionsList.loading}
            page={regionsList.page}
            limit={regionsList.limit}
            onPageChange={regionsList.setPage}
            onLimitChange={regionsList.setLimit}
            searchTerm={regionsList.searchTerm}
            onSearchChange={regionsList.setSearchTerm}
            filters={regionsList.filters}
            onFilterChange={regionsList.setFilters}
            onAdd={handleAddPhase}
            onRefresh={regionsList.onRefresh}
            viewMode={regionsList.viewMode}
            onViewModeChange={(mode) => {
              if (mode !== "carousel") {
                regionsList.setViewMode(mode);
              }
            }}
            renderCard={(item: Region, viewMode) => (
              <MiniRegionCard 
                item={item} 
                viewMode={viewMode as "grid" | "list" | "compact"}
                onView={() => router.push(`/ad/regions/${item.id}`)}
              />
            )}
          />
        </TabsContent>

        {/* Matchs */}
        {/* <TabsContent value="matches">
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
        </TabsContent> */}
      </Tabs>
      <PhaseFormDialog
        open={phaseDialogOpen}
        editionId={Number(editionId)}
        edition={edition}
        onOpenChange={setPhaseDialogOpen}
        onSuccess={handleOnSuccess} />
    </div>
  );
}
