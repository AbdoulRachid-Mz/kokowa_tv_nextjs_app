"use client";

import { EntityList } from "@/components/shared/entity-list";
import { EntityCards } from "@/components/entities/entity-cards";
import { useEntityList } from "@/hooks/use-entity-list";
import { TeamMember } from "@/types";
import { Users, Award, Shield, Briefcase } from "lucide-react";
import { CardStats } from "@/components/entities/card-stats";
import { StatsCarousel } from "@/components/shared/stats-carousel";

export default function TeamsPage() {
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
    onRefresh,
  } = useEntityList<TeamMember>({
    entityType: 'teams',
    defaultFilters: {
      is_active: "all",
      limit: "20",
    },
  });

  // Statistiques pour l'équipe
  const renderStats = () => {
    const stats = [
      {
        label: "Total Équipe",
        value: total,
        icon: Users,
        color: "text-blue-600",
      },
      {
        label: "Leads",
        value: data.filter((m) => m.is_lead).length,
        icon: Shield,
        color: "text-purple-600",
      },
      {
        label: "Actifs",
        value: data.filter((m) => m.is_active).length,
        icon: Award,
        color: "text-green-600",
      },
      {
        label: "Expertises",
        value: Array.from(new Set(data.flatMap(m => m.expertise || []))).length,
        icon: Briefcase,
        color: "text-orange-600",
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
      title="Gestion de l'Équipe"
      description="Gérez les membres de l'équipe Kokowa TV et leurs accomplissements"
      entityType="teams"
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
      onRefresh={onRefresh}
      viewMode={viewMode}
      onViewModeChange={setViewMode}
      renderStats={renderStats}
      renderCard={(member, viewMode) => (
        <EntityCards.TeamMember
          item={member}
          viewMode={viewMode}
          onEdit={onEdit}
          onView={onView}
        />
      )}
    />
  );
}
