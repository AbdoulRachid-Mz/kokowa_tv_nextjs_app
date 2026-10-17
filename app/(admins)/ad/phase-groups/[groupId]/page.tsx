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
  Shield,
} from "lucide-react";
import { PhaseGroup, SubGroup } from "@/types";
import { EntityList } from "@/components/shared/entity-list";
import { useEntityList } from "@/hooks/use-entity-list";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { CreateSubGroupDialog } from "@/components/phase-groups/create-sub-group-dialog";
import { CardStats } from "@/components/entities/card-stats";
import { SubGroupCard } from "@/components/entities/entity-cards";
import { DeleteButton } from "@/components/shared/delete-button";

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
        const response = await fetch(
          `/api/phase-groups/${groupId}?with_relations=true`
        );
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
    entityType: "sub-groups",
    defaultFilters: {
      group_id: parseInt(groupId),
    },
    defaultLimit: 10
  });

  // Statistiques pour le groupe
  const getGroupStats = () => {
    if (!group) return [];

    return [
      {
        value: group?.sub_groups_count || 0,
        icon: Layers,
        color: "text-blue-600",
        description: "Rencontres créées",
      },
      {
        label: "Matchs",
        value: group?.matches_count || 0,
        icon: Swords,
        color: "text-green-600",
        description: "Matchs totaux",
      },
      {
        label: "Terminées",
        value: group?.sub_groups_completed_count || 0,
        icon: Trophy,
        color: "text-purple-600",
        description: "Rencontres complétées",
      },
      {
        label: "Progression",
        value: (group?.sub_groups_count ?? 0) > 0 ? `${Math.round(((group?.sub_groups_completed_count || 0) / (group?.sub_groups_count || 1)) * 100)}%` : "0%",
        icon: Award,
        color: "text-orange-600",
        description: "Taux de complétion",
      },
    ];
  };

  // Gestionnaires d'actions
  const handleEditGroup = () => {
    router.push(`/ad/phase-groups/${groupId}/edit`);
  };

  const handleViewSubGroup = (subGroup: SubGroup) => {
    router.push(`/ad/sub-groups/${subGroup.id}`);
  };

  const handleEditSubGroup = (subGroup: SubGroup) => {
    router.push(`/ad/sub-groups/${subGroup.id}/edit`);
  };

  const handleManageMatches = (subGroup: SubGroup) => {
    router.push(`/ad/sub-groups/${subGroup.id}/organisation`);
  };

  const handleManageGroupMatches = () => {
    router.push(`/ad/phase-groups/${groupId}/organisation`);
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
          onClick={() => router.push("/ad/phase-groups")}
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
            onClick={() => router.push(`/ad/phases/${group.phase_id}`)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <div>
            <Typography variant="h5" weight="bold" animated>
              {group.name}{group.date && ` • ${group.date}`}
            </Typography>
            <Typography variant="body-sm" theme="muted">
              {group.phase?.name} • Édition{" "}
              {group.phase?.edition?.edition_number} -{" "}
              {group.phase?.edition?.year}
            </Typography>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant={statusConfig.variant} className={statusConfig.color}>
            {statusConfig.label}
          </Badge>
          <DeleteButton
            entityType="phase-group"
            entityId={parseInt(groupId)}
            entityName={group.name}
            redirectPath={`/ad/phases/${group.phase_id}`}
            variant="outline"
          />
          <Button variant="outline" onClick={handleEditGroup}>
            <Edit className="h-4 w-4 mr-2" />
            Modifier
          </Button>
          {group.phase?.phase_type && group.phase.phase_type !== "group" ? (
            <Button
              onClick={handleManageGroupMatches}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-md gap-2"
            >
              <Swords className="h-4 w-4" />
              Créer les Matchs (Élimination)
            </Button>
          ) : (
            <>
              <Button
                onClick={() =>
                  router.push(`/ad/phase-groups/${group.id}/sub-groups/new`)
                }
              >
                <Plus className="h-4 w-4 mr-2" />
                Nouvelle Rencontre
              </Button>
              <Button onClick={handleManageGroupMatches} variant="outline">
                <Swords className="h-4 w-4 mr-2" />
                Gérer Matchs
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
        {getGroupStats().map((stat, index) => (
          <CardStats
            key={index}
            label={stat.label ?? ""}
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
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="sub-groups">Rencontres</TabsTrigger>
          <TabsTrigger value="matches">Matchs du Groupe</TabsTrigger>
        </TabsList>

        {/* Vue d'ensemble */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Informations principales */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Informations du Groupe</CardTitle>
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
                      {group.name}
                    </Typography>
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
                      {group.group_order}
                    </Typography>
                  </div>

                  <div>
                    <Typography
                      variant="body-sm"
                      theme="muted"
                      className="mb-1"
                    >
                      Phase
                    </Typography>
                    <Typography variant="body-base" weight="medium">
                      {group.phase?.name}
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
                </div>

                {group.description && (
                  <div>
                    <Typography
                      variant="body-sm"
                      theme="muted"
                      className="mb-1"
                    >
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
                  onClick={() =>
                    router.push(`/ad/phase-groups/${group.id}/sub-groups/new`)
                  }
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nouvelle Rencontre
                </Button>
                {/* <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={handleManageGroupMatches}
                >
                  <Swords className="h-4 w-4 mr-2" />
                  Gérer les Matchs
                </Button> */}
                {/* <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() =>
                    router.push(`/ad/phase-groups/${groupId}/participants`)
                  }
                >
                  <Users className="h-4 w-4 mr-2" />
                  Gérer Participants
                </Button> */}
                {/* <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() =>
                    router.push(`/ad/phase-groups/${groupId}/calendar`)
                  }
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Calendrier
                </Button> */}
              </CardContent>
            </Card>
          </div>

          {/* Sous-groupes récents */}
          {group.sub_groups && group.sub_groups.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Rencontres Récentes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {group.sub_groups.slice(0, 3).map((subGroup) => (
                    <div
                      key={subGroup.id}
                      className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => handleViewSubGroup(subGroup)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <Typography variant="body-base" weight="medium">
                          {subGroup.name}
                        </Typography>
                        <Badge
                          variant={
                            subGroup.is_completed ? "default" : "secondary"
                          }
                        >
                          {subGroup.is_completed ? "Terminé" : "En cours"}
                        </Badge>
                        
                      </div>
                      <Typography
                        variant="body-sm"
                        theme="muted"
                        className="mb-2"
                      >
                        Ordre {subGroup.sub_group_order} •{" "}
                        {subGroup.matches?.length || 0} match(s) {" "}
                        {subGroup.period && (
                    <Badge variant="outline">
                      {subGroup.period === "matin" ? "Matin" : "Soir"}
                    </Badge>
                  )}
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
                      Voir toutes les rencontres ({group.sub_groups.length})
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Sous-groupes */}
        <TabsContent value="sub-groups" className="space-y-4">
          <EntityList<SubGroup>
            entityType="sub-group"
            title="Rencontres du Groupe"
            data={subGroupsList.data}
            loading={subGroupsList.loading}
            total={subGroupsList.total}
            page={subGroupsList.page}
            limit={subGroupsList.limit}
            onPageChange={subGroupsList.setPage}
            onLimitChange={subGroupsList.setLimit}
              onRefresh={subGroupsList.onRefresh}
              searchTerm={subGroupsList.searchTerm}
              onSearchChange={subGroupsList.setSearchTerm}
              filters={subGroupsList.filters}
              onFilterChange={subGroupsList.setFilters}
              viewMode={subGroupsList.viewMode}
            onViewModeChange={subGroupsList.setViewMode}
            renderCard={(subGroup, viewMode) => (
              <SubGroupCard 
                item={subGroup}
                viewMode={viewMode}
                onView={() => handleViewSubGroup(subGroup)}
                onEdit={() => handleEditSubGroup(subGroup)}
                onManageMatches={() => handleManageMatches(subGroup)}
              />
            )}
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
        group={group}
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
    ? {
        label: "Terminé",
        variant: "default" as const,
        color: "bg-green-100 text-green-800",
      }
    : {
        label: "En cours",
        variant: "secondary" as const,
        color: "bg-orange-100 text-orange-800",
      };
};

const CardTitle1 = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <Typography variant="h4" weight="medium" className={className}>
    {children}
  </Typography>
);
