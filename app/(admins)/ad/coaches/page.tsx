// app/admin/coaches/page.tsx
"use client";

import { EntityList } from "@/components/shared/entity-list";
import { EntityCards } from "@/components/entities/entity-cards";
import { useEntityList } from "@/hooks/use-entity-list";
import { Coach } from "@/types";
import { Typography } from "@/components/ui/typography";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Award, TrendingUp, GraduationCap } from "lucide-react";
import { CardStats } from "@/components/entities/card-stats";
import { StatsCarousel } from "@/components/shared/stats-carousel";

export default function CoachesPage() {
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
  } = useEntityList<Coach>({
    entityType: "coaches",
    defaultFilters: {
      is_active: true,
    },
  });

  // Statistiques pour les coachs
  const renderStats = () => {
    const stats = [
      {
        label: "Total Coachs",
        value: total,
        icon: Users,
        color: "text-blue-600",
      },
      {
        label: "Coach Internationaux",
        value: data.filter((c) => c.certification_level === "International")
          .length,
        icon: GraduationCap,
        color: "text-purple-600",
      },
      {
        label: "Actifs",
        value: data.filter((c) => c.is_active).length,
        icon: TrendingUp,
        color: "text-green-600",
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
      title="Gestion des Coachs"
      description="Gérez l'ensemble des coachs de la plateforme"
      entityType="coach"
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
      renderCard={(coach, viewMode) => (
        <EntityCards.Coach
          item={coach}
          viewMode={viewMode}
          onEdit={onEdit}
          onView={onView}
        />
      )}
    />
  );
}
