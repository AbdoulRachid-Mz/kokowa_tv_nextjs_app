// app/admin/sub-groups/page.tsx
"use client";

import { EntityList } from "@/components/shared/entity-list";
import { EntityCards } from "@/components/entities/entity-cards";
import { useEntityList } from "@/hooks/use-entity-list";
import { SubGroup } from "@/types";
import { Typography } from "@/components/ui/typography";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Swords, Trophy, Clock } from "lucide-react";
import { CardStats } from "@/components/entities/card-stats";
import { StatsCarousel } from "@/components/shared/stats-carousel";

export default function SubGroupsPage() {
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
  } = useEntityList<SubGroup>({
    entityType: "sub-groups",
    defaultFilters: {
      with_group: true,
      with_regions: true,
      with_matches: true,
      limit: "20",
    },
  });

  // Statistiques pour les sous-groupes
  const renderStats = () => {
    const stats = [
      {
        label: "Total Rencontres",
        value: total,
        icon: Swords,
        color: "text-blue-600",
      },
      {
        label: "Rencontres Terminées",
        value: data.filter((sg) => sg.is_completed).length,
        icon: Trophy,
        color: "text-green-600",
      },
      {
        label: "Rencontres Actives",
        value: data.filter((sg) => sg.is_active).length,
        icon: Clock,
        color: "text-yellow-600",
      },
      {
        label: "Matchs Total",
        value: data.reduce((acc, sg) => acc + (Number(sg.matches_count) || sg.matches?.length || 0), 0),
        icon: Users,
        color: "text-purple-600",
      },
    ];

    return (
      <StatsCarousel>
        {stats.map((stat, index) => (
          <CardStats key={index} {...stat} />
        ))}
      </StatsCarousel>
    );
  };

  return (
    <EntityList
      title="Gestion des Rencontres"
      description="Organisez et gérez les rencontres entre régions"
      entityType="sub-group"
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
      renderCard={(subGroup, viewMode) => (
        <EntityCards.SubGroup
          item={subGroup}
          viewMode={viewMode}
          onEdit={onEdit}
          onView={onView}
        />
      )}
    />
  );
}
