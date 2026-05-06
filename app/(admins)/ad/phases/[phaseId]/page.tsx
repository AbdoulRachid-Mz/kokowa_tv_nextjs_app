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
import { toast } from "sonner";
import { PhaseGroupCard } from "@/components/entities/entity-cards";

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
          `/api/phases/${phaseId}?with_relations=false`
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
    },
    defaultLimit: 10
  });

  // Statistiques pour la phase
  const getPhaseStats = () => {
    if (!phase) return [];

    return [
      {
        label: "Groupes",
        value: phase?.groups_count || 0,
        icon: Folder,
        color: "text-blue-600",
        description: "Groupes créés",
      },
      {
        label: "Rencontres",
        value: phase?.sub_groups_count || 0,
        icon: Layers,
        color: "text-green-600",
        description: "Rencontres totales",
      },
      {
        label: "Matchs",
        value: phase?.matches_count || 0,
        icon: Swords,
        color: "text-purple-600",
        description: "Matchs prévus",
      },
      {
        label: "Progression",
        value: (phase?.groups_count ?? 0) > 0 ? `${Math.round(((phase?.groups_completed_count || 0) / (phase?.groups_count || 1)) * 100)}%` : "0%",
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
    router.push(`/ad/phase-groups/${group.id}/sub-groups/new`);
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
        <Typography variant="h4" theme="muted">
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
            <Typography variant="body-lg" theme="muted">
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
          <CardStats
            key={index}
            label={stat.label}
            icon={stat.icon}
            value={stat.value}
            color={stat.color}
          />
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
                <CardTitle className="text-primary text-2xl">
                  Informations de la Phase
                </CardTitle>
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
            <Card className="p-3">
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
                {/* <Button
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
                </Button> */}
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
        <TabsContent value="groups" className="space-y-4">
          <EntityList<PhaseGroup>
            title="Groupes de la Phase"
            description={`Gérez les groupes de la phase ${phase.name}`}
            entityType="phase-groups"
            data={groupsList.data}
            total={groupsList.total}
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
            renderCard={(group, viewMode) => (
              <PhaseGroupCard
                item={group}
                viewMode={viewMode}
                onView={() => handleViewGroup(group)}
                onEdit={() => handleEditGroup(group)}
              />
            )}
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
        phase={phase}
        phaseId={parseInt(phaseId)}
        onSuccess={handleOnSuccess}
      />
    </div>
  );
}
