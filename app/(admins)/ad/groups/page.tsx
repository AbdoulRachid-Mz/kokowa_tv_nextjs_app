"use client";

import { EntityList } from "@/components/shared/entity-list";
import { useEntityList } from "@/hooks/use-entity-list";
import { PhaseGroup } from "@/types";
import { Typography } from "@/components/ui/typography";
import { Card, CardContent } from "@/components/ui/card";
import { Folder, Layers, Trophy, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export default function PhaseGroupsPage() {
  const router = useRouter();
  const {
    data,
    total,
    loading,
    page,
    limit,
    searchTerm,
    filters,
    viewMode,
    setPage,
    setLimit,
    setSearchTerm,
    setFilters,
    setViewMode,
    onAdd,
    onEdit,
    onView,
    onExport,
    onRefresh,
  } = useEntityList<PhaseGroup>({
    entityType: 'phase-groups',
    defaultFilters: {
      with_phase: true,
      with_sub_groups: true,
      limit: '20',
    },
  });

  const renderStats = () => {
    const totalSubGroups = data.reduce((sum, group) => sum + (group.sub_groups?.length || 0), 0);
    const completedGroups = data.filter(group => group.is_completed).length;
    const groupsWithMatches = data.filter(group => 
      group.sub_groups?.some(sg => sg?.matches && sg.matches.length > 0)
    ).length;

    const stats = [
      {
        label: "Total Groupes",
        value: total,
        icon: Folder,
        color: "text-blue-600",
      },
      {
        label: "Sous-groupes",
        value: totalSubGroups,
        icon: Layers,
        color: "text-green-600",
      },
      {
        label: "Groupes Terminés",
        value: completedGroups,
        icon: Trophy,
        color: "text-purple-600",
      },
      {
        label: "Avec Matchs",
        value: groupsWithMatches,
        icon: Calendar,
        color: "text-orange-600",
      },
    ];

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <Typography variant="body-sm" theme="muted" className="mb-1">
                    {stat.label}
                  </Typography>
                  <Typography variant="h3" weight="bold">
                    {stat.value}
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
    );
  };

  const availableFilters = [
    {
      key: 'phase_id',
      label: 'Phase',
      options: [
        { value: 'all', label: 'Toutes phases' },
        // Les phases seront chargées dynamiquement
      ],
    },
    {
      key: 'is_completed',
      label: 'Statut',
      options: [
        { value: 'all', label: 'Tous' },
        { value: 'true', label: 'Terminé' },
        { value: 'false', label: 'En cours' },
      ],
    },
    {
      key: 'sort',
      label: 'Trier par',
      options: [
        { value: 'group_order', label: 'Ordre' },
        { value: 'name', label: 'Nom' },
        { value: 'sub_groups_count', label: 'Nombre sous-groupes' },
      ],
    },
  ];

  const handleViewGroup = (group: PhaseGroup) => {
    router.push(`/admin/phase-groups/${group.id}`);
  };

  const handleEditGroup = (group: PhaseGroup) => {
    router.push(`/admin/phase-groups/${group.id}/edit`);
  };

  const handleManageMatches = (group: PhaseGroup) => {
    router.push(`/admin/phase-groups/${group.id}/matches`);
  };

  const renderGroupCard = (group: PhaseGroup, viewMode: 'grid' | 'list') => {
    const isListView = viewMode === 'list';
    const subGroupsCount = group.sub_groups?.length || 0;
    const totalMatches = group.sub_groups?.reduce((sum, sg) => sum + (sg.matches?.length || 0), 0) || 0;

    return (
      <Card className={cn(
        "hover:shadow-lg transition-all duration-300 cursor-pointer group border-l-4",
        isListView && "flex",
        group.is_completed ? "border-l-green-500" : "border-l-orange-500"
      )}>
        <div className={cn("p-4", isListView && "flex items-center gap-4 flex-1")}>
          <div className={cn("flex-shrink-0 mb-3", isListView && "mb-0")}>
            <div className={cn(
              "w-12 h-12 rounded-lg flex items-center justify-center text-white",
              group.is_completed ? "bg-gradient-to-br from-green-500 to-emerald-600" : "bg-gradient-to-br from-orange-500 to-red-600"
            )}>
              <Folder className="h-6 w-6" />
            </div>
          </div>

          <div className={cn("flex-1", isListView && "flex items-center justify-between")}>
            <div className={cn(isListView && "flex items-center gap-6")}>
              <div>
                <CardTitle className="text-lg group-hover:text-primary transition-colors">
                  {group.name}
                </CardTitle>
                
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant={group.is_completed ? "default" : "secondary"}>
                    {group.is_completed ? "Terminé" : "En cours"}
                  </Badge>
                  
                  <Badge variant="outline">
                    {subGroupsCount} sous-groupe(s)
                  </Badge>

                  {totalMatches > 0 && (
                    <Badge variant="outline">
                      {totalMatches} match(s)
                    </Badge>
                  )}
                </div>

                <div className="space-y-1 text-sm">
                  <Typography variant="body-sm" className="text-muted-foreground">
                    Phase: {group.phase?.name} • Ordre: {group.group_order}
                  </Typography>
                  
                  {group.phase?.edition && (
                    <Typography variant="body-sm" className="text-muted-foreground">
                      Édition {group.phase.edition.edition_number} - {group.phase.edition.year}
                    </Typography>
                  )}
                  
                  {group.description && (
                    <Typography variant="body-sm" className="text-muted-foreground line-clamp-2">
                      {group.description}
                    </Typography>
                  )}
                </div>
              </div>

              {isListView && (
                <div className="text-right">
                  <Typography variant="h4" weight="bold" className="text-primary">
                    {group.group_order}
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
                  handleManageMatches(group);
                }}
              >
                Matchs
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

  return (
    <EntityList
      title="Gestion des Groupes"
      description="Gérez les groupes de phase et leurs sous-groupes"
      entityType="phase-groups"
      data={data}
      total={total}
      loading={loading}
      page={page}
      limit={limit}
      onPageChange={setPage}
      onLimitChange={setLimit}
      searchTerm={searchTerm}
      onSearchChange={setSearchTerm}
      filters={filters}
      onFilterChange={setFilters}
      onAdd={onAdd}
      onExport={onExport}
      onRefresh={onRefresh}
      viewMode={viewMode}
      onViewModeChange={setViewMode}
      renderStats={renderStats}
      availableFilters={availableFilters}
      renderCard={renderGroupCard}
    />
  );
}

// Composant CardTitle manquant
const CardTitle = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <Typography variant="h4" weight="medium" className={className}>
    {children}
  </Typography>
);
