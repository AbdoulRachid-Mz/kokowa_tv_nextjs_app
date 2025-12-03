// app/admin/fighters/page.tsx
"use client";

import { EntityList } from "@/components/shared/entity-list";
import { EntityCards } from "@/components/entities/entity-cards";
import { useEntityList } from "@/hooks/use-entity-list";
import { Fighter } from "@/types";
import { Typography } from "@/components/ui/typography";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Award, TrendingUp } from "lucide-react";
import { CardStats } from "@/components/entities/card-stats";

export default function FightersPage() {
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
  } = useEntityList<Fighter>({
    entityType: "fighters",
    defaultFilters: {
      is_active: "active",
      limit: "20",
    },
  });

  // Statistiques pour les lutteurs
  const renderStats = () => {
    const stats = [
      {
        label: "Total Lutteurs",
        value: total,
        icon: Users,
        color: "text-blue-600",
      },
      {
        label: "Champions",
        value: data.filter((f) => f.is_champion).length,
        icon: Award,
        color: "text-yellow-600",
      },
      {
        label: "Actifs",
        value: data.filter((f) => f.is_active).length,
        icon: TrendingUp,
        color: "text-green-600",
      },
    ];

    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {stats.map((stat, index) => (
          <CardStats key={index} {...stat} />
        ))}
      </div>
    );
  };

  return (
    <EntityList
      title="Gestion des Lutteurs"
      description="Gérez l'ensemble des lutteurs de la plateforme"
      entityType="fighter"
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
      renderCard={(fighter, viewMode) => (
        <EntityCards.Fighter
          fighter={fighter}
          viewMode={viewMode}
          onEdit={onEdit}
          onView={onView}
        />
      )}
    />
  );
}
