// app/admin/transfers/page.tsx
"use client";

import { EntityList } from "@/components/shared/entity-list";
import { EntityCards } from "@/components/entities/entity-cards";
import { useEntityList } from "@/hooks/use-entity-list";
import { FighterTransfer } from "@/types";
import { Typography } from "@/components/ui/typography";
import { Card, CardContent } from "@/components/ui/card";
import { Users, CheckCircle, Clock, XCircle, TrendingUp } from "lucide-react";
import { CardStats } from "@/components/entities/card-stats";
import { StatsCarousel } from "@/components/shared/stats-carousel";

export default function TransfersPage() {
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
  } = useEntityList<FighterTransfer>({
    entityType: "transfers",
    defaultFilters: {
      with_fighter: true,
      with_regions: true,
      limit: "20",
    },
  });

  // Statistiques pour les transferts
  const renderStats = () => {
    const stats = [
      {
        label: "Total Transferts",
        value: total,
        icon: Users,
        color: "text-blue-600",
      },
      {
        label: "Approuvés",
        value: data.filter(
          (t) => t.status === "approved" || t.status === "completed"
        ).length,
        icon: CheckCircle,
        color: "text-green-600",
      },
      {
        label: "En Attente",
        value: data.filter((t) => t.status === "pending").length,
        icon: Clock,
        color: "text-yellow-600",
      },
      {
        label: "Rejetés",
        value: data.filter((t) => t.status === "rejected").length,
        icon: XCircle,
        color: "text-red-600",
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
      title="Gestion des Transferts"
      description="Gérez les transferts de lutteurs entre régions"
      entityType="transfer"
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
      renderCard={(transfer, viewMode) => (
        <EntityCards.Transfer
          item={transfer}
          viewMode={viewMode}
          onEdit={onEdit}
          onView={onView}
        />
      )}
    />
  );
}
