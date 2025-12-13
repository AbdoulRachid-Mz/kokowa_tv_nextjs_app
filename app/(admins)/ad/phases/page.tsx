"use client";

import { EntityList } from "@/components/shared/entity-list";
import { useEntityList } from "@/hooks/use-entity-list";
import { Typography } from "@/components/ui/typography";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Trophy, Users, Clock } from "lucide-react";
import { Phase } from "@/types";
import { Badge } from "@/components/ui/badge";
import { CardStats } from "@/components/entities/card-stats";
import { Button } from "@/components/ui/button";

export default function PhasesPage() {
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
  } = useEntityList<Phase>({
    entityType: "phases",
    defaultFilters: {
      with_edition: true,
      with_groups: true,
      limit: "20",
    },
  });

  // Statistiques pour les phases
  const renderStats = () => {
    const totalGroups = data.reduce(
      (sum, phase) => sum + (phase?.groups?.length || 0),
      0
    );
    const completedPhases = data.filter((phase) => phase.is_completed).length;
    const averageGroups =
      data.length > 0 ? Math.round(totalGroups / data.length) : 0;

    const stats = [
      {
        label: "Total Phases",
        value: total,
        icon: Calendar,
        color: "text-blue-600",
      },
      {
        label: "Groupes Totaux",
        value: totalGroups,
        icon: Trophy,
        color: "text-green-600",
      },
      {
        label: "Phases Terminées",
        value: completedPhases,
        icon: Users,
        color: "text-yellow-600",
      },
      {
        label: "Moyenne Groupes",
        value: averageGroups,
        icon: Clock,
        color: "text-purple-600",
      },
    ];

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
        {stats.map((stat, index) => (
          <CardStats key={index} {...stat} />
        ))}
      </div>
    );
  };

  // Filtres disponibles pour les phases
  const availableFilters = [
    {
      key: "sort",
      label: "Trier par",
      options: [
        { value: "name", label: "Nom" },
        { value: "phase_order", label: "Ordre" },
        { value: "phase_type", label: "Type" },
      ],
    },
    // {
    //   key: 'phase_type',
    //   label: 'Type de Phase',
    //   options: [
    //     { value: 'all', label: 'Tous' },
    //     { value: 'qualification', label: 'Qualification' },
    //     { value: 'group', label: 'Groupe' },
    //     { value: 'knockout', label: 'Élimination directe' },
    //     { value: 'quarterfinal', label: 'Quart de finale' },
    //     { value: 'semifinal', label: 'Demi-finale' },
    //     { value: 'final', label: 'Finale' },
    //   ],
    // },
    // {
    //   key: 'is_completed',
    //   label: 'Statut',
    //   options: [
    //     { value: 'all', label: 'Tous' },
    //     { value: 'true', label: 'Terminé' },
    //     { value: 'false', label: 'En cours' },
    //   ],
    // },
  ];

  return (
    <EntityList
      title="Gestion des Phases"
      description="Gérez les phases des compétitions"
      entityType="phase"
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
      // onExport={onExport}
      onRefresh={onRefresh}
      viewMode={viewMode}
      onViewModeChange={setViewMode}
      renderStats={renderStats}
      availableFilters={availableFilters}
      renderCard={(phase, viewMode) => (
        <Card key={phase.id} className="p-2">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <Typography variant="h4">{phase.name}</Typography>
              <Typography variant="body-sm" theme="muted">
                {phase.phase_type} - Ordre: {phase.phase_order}
              </Typography>
              <Typography variant="body-sm" theme="muted">
                {phase.is_completed ? "Terminé" : "En cours"}
              </Typography>
            </div>
            <Badge variant={phase.is_completed ? "default" : "secondary"}>
              {phase.is_completed ? "Terminé" : "En cours"}
            </Badge>
          </div>
          {phase.groups && phase.groups.length > 0 && (
            <div className="mt-3 pt-3 border-t">
              <Typography variant="body-sm" theme="muted">
                {phase.groups.length} groupe(s)
              </Typography>
            </div>
          )}
          <Button onClick={() => onView(phase)}>Voir détails</Button>
        </Card>
      )}
    />
  );
}
