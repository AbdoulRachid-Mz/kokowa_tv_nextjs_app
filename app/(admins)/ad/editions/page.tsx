"use client";

import { EntityList } from "@/components/shared/entity-list";
import { EntityCards } from "@/components/entities/entity-cards";
import { useEntityList } from "@/hooks/use-entity-list";
// import { Edition } from "@/types";
import { Typography } from "@/components/ui/typography";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Trophy, Users, Clock } from "lucide-react";
import { EditionCard } from "@/components/entities/edition-card";
import { CompetitionEdition } from "@/types";
import { CardStats } from "@/components/entities/card-stats";

export default function EditionsPage() {
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
  } = useEntityList<CompetitionEdition>({
    entityType: 'editions',
    withRelations: ['phases', 'fighters', 'regions', 'competition'],
  });

  // Statistiques pour les éditions
  const renderStats = () => {
    const totalPhases = data.reduce((sum, edition) => sum + (edition?.phases?.length || 0), 0);
    const totalFighters = data.reduce((sum, edition) => sum + edition.total_participants, 0);
    const averagePhases = data.length > 0 ? Math.round(totalPhases / data.length) : 0;

    const stats = [
      {
        label: "Total Éditions",
        value: total,
        icon: Calendar,
        color: "text-blue-600",
      },
      {
        label: "Phases Totales",
        value: totalPhases,
        icon: Trophy,
        color: "text-green-600",
      },
      {
        label: "Lutteurs Total",
        value: totalFighters,
        icon: Users,
        color: "text-yellow-600",
      },
      {
        label: "Moyenne Événements",
        value: averagePhases,
        icon: Clock,
        color: "text-purple-600",
      },
    ];

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((stat, index) => (
          <CardStats key={index} {...stat} />
        ))}
      </div>
    );
  };

  // Filtres disponibles pour les éditions
  const availableFilters = [
    {
      key: 'sort',
      label: 'Trier par',
      options: [
        { value: 'name', label: 'Nom' },
        { value: 'year', label: 'Année' },
        { value: 'events', label: 'Nombre d\'événements' },
      ],
    },
    {
      key: 'status',
      label: 'Statut',
      options: [
        { value: 'all', label: 'Tous' },
        { value: 'upcoming', label: 'À venir' },
        { value: 'ongoing', label: 'En cours' },
        { value: 'completed', label: 'Terminé' },
      ],
    },
  ];

  return (
    <EntityList
      title="Gestion des Éditions"
      description="Gérez l'ensemble des éditions et leurs événements"
      entityType="edition"
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
      // availableFilters={availableFilters}
      renderCard={(edition, viewMode) => (
        <EditionCard
          item={edition}
          viewMode={viewMode}
          onEdit={onEdit}
          onView={onView}
        />
      )}
    />
  );
}