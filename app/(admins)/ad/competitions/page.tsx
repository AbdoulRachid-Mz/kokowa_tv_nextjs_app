// app/admin/competitions/page.tsx
"use client";

import { EntityList } from "@/components/shared/entity-list";
import { EntityCards } from "@/components/entities/entity-cards";
import { useEntityList } from "@/hooks/use-entity-list";
import { Competition } from "@/types";
import { Typography } from "@/components/ui/typography";
import { Card, CardContent } from "@/components/ui/card";
import { Trophy, Calendar, Play, CheckCircle } from "lucide-react";
import { CardStats } from "@/components/entities/card-stats";


export default function CompetitionsPage() {
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
  } = useEntityList<Competition>({
    entityType: 'competitions',
    defaultFilters: {
      status: 'all',
      limit: '20',
    },
  });

  // Statistiques pour les compétitions
  const renderStats = () => {
    const stats = [
      {
        label: "Total Compétitions",
        value: total,
        icon: Trophy,
        color: "text-purple-600",
      },
      {
        label: "À venir",
        value: data.filter(c => c.status === 'upcoming').length,
        icon: Calendar,
        color: "text-blue-600",
      },
      {
        label: "En cours",
        value: data.filter(c => c.status === 'ongoing').length,
        icon: Play,
        color: "text-green-600",
      },
      {
        label: "Terminées",
        value: data.filter(c => c.status === 'completed').length,
        icon: CheckCircle,
        color: "text-gray-600",
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

  return (
    <EntityList
      title="Gestion des Compétitions"
      description="Organisez et gérez les compétitions"
      entityType="competition"
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
      renderCard={(competition, viewMode) => (
        <EntityCards.Competition
          competition={competition}
          viewMode={viewMode}
          onEdit={onEdit}
          onView={onView}
        />
      )}
    />
  );
}