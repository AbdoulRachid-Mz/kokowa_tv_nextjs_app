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
} from "lucide-react";
import { Phase, PhaseGroup } from "@/types";
import { EntityList } from "@/components/shared/entity-list";
import { useEntityList } from "@/hooks/use-entity-list";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { CreateGroupDialog } from "@/components/phases/create-group-dialog";
import { CardStats } from "@/components/entities/card-stats";
import {toast} from "sonner"

export default function PhaseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const phaseId = params.phaseId as string;

  const [phase, setPhase] = useState<Phase | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [createGroupOpen, setCreateGroupOpen] = useState(false);

  // Charger les détails de la phase
  useEffect(() => {
    const fetchPhase = async () => {
      try {
        const response = await fetch(
          `/api/phases/${phaseId}?with_relations=true`
        );
        if (response.ok) {
          const data = await response.json();
          setPhase(data.data);
        } else {
          console.error("Erreur lors du chargement de la phase");
        }
      } catch (error) {
        console.error("Erreur réseau:", error);
      } finally {
        setLoading(false);
      }
    };

    if (phaseId) {
      fetchPhase();
    }
  }, [phaseId]);

  // Hook pour les groupes
  const groupsList = useEntityList<PhaseGroup>({
    entityType: "phase-groups",
    defaultFilters: {
      phase_id: parseInt(phaseId),
      with_sub_groups: true,
    },
  });

  // Statistiques pour la phase
  const getPhaseStats = () => {
    if (!phase) return [];

    const totalGroups = phase.groups?.length || 0;
    const totalSubGroups =
      phase.groups?.reduce(
        (sum, group) => sum + (group.sub_groups?.length || 0),
        0
      ) || 0;
    const completedGroups =
      phase.groups?.filter((g) => g.is_completed).length || 0;

    return [
      {
        label: "Groupes",
        value: totalGroups,
        icon: Folder,
        color: "text-blue-600",
        description: "Groupes créés",
      },
      {
        label: "Sous-groupes",
        value: totalSubGroups,
        icon: Layers,
        color: "text-green-600",
        description: "Sous-groupes totaux",
      },
      {
        label: "Groupes Terminés",
        value: completedGroups,
        icon: Trophy,
        color: "text-purple-600",
        description: "Groupes complétés",
      },
      {
        label: "Progression",
        value:
          totalGroups > 0
            ? `${Math.round((completedGroups / totalGroups) * 100)}%`
            : "0%",
        icon: Award,
        color: "text-orange-600",
        description: "Taux de complétion",
      },
    ];
  };

  // Obtenir le statut de la phase
  const getStatusBadge = (isCompleted: boolean) => {
    return isCompleted
      ? {
          label: "Terminée",
          variant: "default" as const,
          color: "bg-green-100 text-green-800",
        }
      : {
          label: "En cours",
          variant: "secondary" as const,
          color: "bg-orange-100 text-orange-800",
        };
  };

  const handleOnSuccess = () => {
    toast.success("Groupe créé avec succès");
    setCreateGroupOpen(false);
    // groupsList.refresh();
  };

  // Gestionnaires d'actions
  const handleEditPhase = () => {
    router.push(`/ad/phases/${phaseId}/edit`);
  };

  const handleViewGroup = (group: PhaseGroup) => {
    router.push(`/ad/phase-groups/${group.id}`);
  };

  const handleEditGroup = (group: PhaseGroup) => {
    router.push(`/ad/phase-groups/${group.id}/edit`);
  };

  const handleAddSubGroups = (group: PhaseGroup) => {
    router.push(`/ad/phase-groups/${group.id}/sub-groups`);
  };

  // Rendu des cartes pour les groupes
  const renderGroupCard = (group: PhaseGroup, viewMode: "grid" | "list") => {
    const isListView = viewMode === "list";
    const statusConfig = getStatusBadge(group.is_completed);
    const subGroupsCount = group.sub_groups?.length || 0;

    return (
      <Card
        className={cn(
          "hover:shadow-lg transition-all duration-300 cursor-pointer group border-l-4 p-2",
          isListView && "flex",
          group.is_completed ? "border-l-green-500" : "border-l-orange-500"
        )}
      >
        <div
          className={cn("p-2", isListView && "flex items-center gap-3 flex-1")}
        >
          <div className={cn("flex-shrink-0 mb-3", isListView && "mb-0")}>
            <div
              className={cn(
                "w-12 h-12 rounded-lg flex items-center justify-center text-white",
                group.is_completed
                  ? "bg-gradient-to-br from-green-500 to-emerald-600"
                  : "bg-gradient-to-br from-orange-500 to-red-600"
              )}
            >
              <Folder className="h-6 w-6" />
            </div>
          </div>

          <div
            className={cn(
              "flex-1",
              isListView && "flex items-center justify-between"
            )}
          >
            <div className={cn(isListView && "flex items-center gap-6")}>
              <div>
                <CardTitle className="text-lg group-hover:text-primary transition-colors">
                  {group.name}
                </CardTitle>

                <div className="flex items-center gap-2 mb-2">
                  <Badge
                    variant={statusConfig.variant}
                    className={statusConfig.color}
                  >
                    {group.is_completed ? "Terminé" : "En cours"}
                  </Badge>

                  <Badge variant="outline">
                    {subGroupsCount} sous-groupe(s)
                  </Badge>
                </div>

                <div className="space-y-1 text-sm">
                  <Typography
                    variant="body-sm"
                    className="text-muted-foreground"
                  >
                    Ordre: {group.group_order}
                  </Typography>

                  {group.description && (
                    <Typography
                      variant="body-sm"
                      className="text-muted-foreground line-clamp-2"
                    >
                      {group.description}
                    </Typography>
                  )}
                </div>
              </div>

              {isListView && (
                <div className="text-right">
                  <Typography
                    variant="h4"
                    weight="bold"
                    className="text-primary"
                  >
                    {group.group_order}
                  </Typography>
                  <Typography variant="caption2" theme="muted">
                    Ordre
                  </Typography>
                </div>
              )}
            </div>

            <div className={cn("flex gap-2 mt-3", isListView && "mt-0")}>
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleAddSubGroups(group);
                }}
              >
                <Plus className="h-4 w-4 mr-1" />
                Sous-groupes
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleViewGroup(group);
                }}
              >
                Voir
              </Button>
              <Button
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleEditGroup(group);
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
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-64" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!phase) {
    return (
      <div className="text-center py-12">
        <Typography variant="h3" theme="muted">
          Phase non trouvée
        </Typography>
        <Button onClick={() => router.push("/ad/phases")} className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour aux phases
        </Button>
      </div>
    );
  }

  const statusConfig = getStatusBadge(phase.is_completed);

  return (
    <div className="space-y-4">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/ad/editions/${phase.edition_id}`)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <div>
            <Typography variant="h5" weight="bold" animated>
              {phase.name}
            </Typography>
            <Typography variant="lead" theme="muted">
              {phase.phase_type} • Édition {phase.edition?.edition_number} -{" "}
              {phase.edition?.year}
            </Typography>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant={statusConfig.variant} className={statusConfig.color}>
            {statusConfig.label}
          </Badge>
          <Button variant="outline" onClick={handleEditPhase}>
            <Edit className="h-4 w-4 mr-2" />
            Modifier
          </Button>
          <Button onClick={() => setCreateGroupOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nouveau Groupe
          </Button>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {getPhaseStats().map((stat, index) => (
          <CardStats key={index} label={stat.label} icon={stat.icon} value={stat.value} color={stat.color} />

        ))}
      </div>

      {/* Informations et navigation */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="groups">Groupes</TabsTrigger>
          {/* <TabsTrigger value="matches">Matchs</TabsTrigger> */}
        </TabsList>

        {/* Vue d'ensemble */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            {/* Informations principales */}
            <Card className="lg:col-span-2 p-4">
              <CardHeader>
                <CardTitle className="text-primary text-2xl">Informations de la Phase</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Typography
                      variant="body-sm"
                      theme="muted"
                      className="mb-1"
                    >
                      Nom
                    </Typography>
                    <Typography variant="body-base" weight="medium">
                      {phase.name}
                    </Typography>
                  </div>

                  <div>
                    <Typography
                      variant="body-sm"
                      theme="muted"
                      className="mb-1"
                    >
                      Type
                    </Typography>
                    <Badge variant="outline">{phase.phase_type}</Badge>
                  </div>

                  <div>
                    <Typography
                      variant="body-sm"
                      theme="muted"
                      className="mb-1"
                    >
                      Ordre
                    </Typography>
                    <Typography variant="body-base" weight="medium">
                      {phase.phase_order}
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
                      className={statusConfig.color}
                    >
                      {statusConfig.label}
                    </Badge>
                  </div>

                  {phase.start_date && phase.end_date && (
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
                          {new Date(phase.start_date).toLocaleDateString()}
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
                          {new Date(phase.end_date).toLocaleDateString()}
                        </Typography>
                      </div>
                    </>
                  )}
                </div>

                {phase.description && (
                  <div>
                    <Typography
                      variant="body-sm"
                      theme="muted"
                      className="mb-1"
                    >
                      Description
                    </Typography>
                    <Typography variant="body-base" className="italic">
                      {phase.description}
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
                  onClick={() => setCreateGroupOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nouveau Groupe
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => router.push(`/ad/phases/${phaseId}/groups`)}
                >
                  <Folder className="h-4 w-4 mr-2" />
                  Gérer les Groupes
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() =>
                    router.push(`/ad/phases/${phaseId}/matches`)
                  }
                >
                  <Swords className="h-4 w-4 mr-2" />
                  Voir les Matchs
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() =>
                    router.push(`/ad/phases/${phaseId}/calendar`)
                  }
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Calendrier
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Groupes récents */}
          {phase.groups && phase.groups.length > 0 && (
            <Card className="p-2">
              <CardHeader>
                <CardTitle>Groupes Récents</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {phase.groups.slice(0, 3).map((group) => (
                    <div
                      key={group.id}
                      className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => handleViewGroup(group)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <Typography variant="body-base" weight="medium">
                          {group.name}
                        </Typography>
                        <Badge
                          variant={group.is_completed ? "default" : "secondary"}
                        >
                          {group.is_completed ? "Terminé" : "En cours"}
                        </Badge>
                      </div>
                      <Typography
                        variant="body-sm"
                        theme="muted"
                        className="mb-2"
                      >
                        Ordre {group.group_order} •{" "}
                        {group.sub_groups?.length || 0} sous-groupe(s)
                      </Typography>
                      {group.description && (
                        <Typography variant="body-sm" className="line-clamp-2">
                          {group.description}
                        </Typography>
                      )}
                    </div>
                  ))}
                </div>
                {phase.groups.length > 3 && (
                  <div className="text-center mt-4">
                    <Button
                      variant="outline"
                      onClick={() => setActiveTab("groups")}
                    >
                      Voir tous les groupes ({phase.groups.length})
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Groupes */}
        <TabsContent value="groups">
          <EntityList
            title="Groupes de la Phase"
            description={`Gérez les groupes de la phase ${phase.name}`}
            entityType="phase-groups"
            data={phase?.groups || []}
            total={phase?.groups?.length || 0}
            loading={groupsList.loading}
            page={groupsList.page}
            limit={groupsList.limit}
            onPageChange={groupsList.setPage}
            onLimitChange={groupsList.setLimit}
            searchTerm={groupsList.searchTerm}
            onSearchChange={groupsList.setSearchTerm}
            filters={groupsList.filters}
            onFilterChange={groupsList.setFilters}
            onAdd={() => setCreateGroupOpen(true)}
            onRefresh={groupsList.onRefresh}
            viewMode={groupsList.viewMode}
            onViewModeChange={groupsList.setViewMode}
            renderCard={renderGroupCard}
          />
        </TabsContent>

        {/* Matchs */}
        <TabsContent value="matches">
          <Card>
            <CardHeader>
              <CardTitle>Matchs de la Phase</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Swords className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <Typography variant="h4" theme="muted" className="mb-2">
                  Gestion des Matchs
                </Typography>
                <Typography variant="body-sm" theme="muted" className="mb-4">
                  Consultez et gérez tous les matchs de cette phase
                </Typography>
                <Button
                  onClick={() =>
                    router.push(`/admin/phases/${phaseId}/matches`)
                  }
                >
                  <Swords className="h-4 w-4 mr-2" />
                  Voir les Matchs
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog de création de groupe */}
      <CreateGroupDialog
        open={createGroupOpen}
        onOpenChange={setCreateGroupOpen}
        phaseId={parseInt(phaseId)}
        onSuccess={handleOnSuccess}
      />
    </div>
  );
}
