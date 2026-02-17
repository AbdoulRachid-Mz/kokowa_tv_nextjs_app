// app/admin/regions/page.tsx
"use client";

import { EntityList } from "@/components/shared/entity-list";
import { EntityCards } from "@/components/entities/entity-cards";
import { useEntityList } from "@/hooks/use-entity-list";
import { Region } from "@/types";
import { Typography } from "@/components/ui/typography";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Users, Award, TrendingUp } from "lucide-react";

export default function ClientRegionsPage() {
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
  } = useEntityList<Region>({
    entityType: 'regions',
    defaultFilters: {
      with_fighters: true,
      limit: '20',
    },
  });

  // Statistiques pour les régions
  const renderStats = () => {
    const totalFighters = data.reduce((sum, region) => sum + (region.total_fighters ?? 0), 0);
    const totalChampions = data.reduce((sum, region) => sum + (region.total_champions ?? 0), 0);
    const averageFighters = data.length > 0 ? Math.round(totalFighters / data.length) : 0;

    const stats = [
      {
        label: "Total Régions",
        value: total,
        icon: MapPin,
        color: "text-blue-600",
      },
      {
        label: "Lutteurs Total",
        value: totalFighters,
        icon: Users,
        color: "text-green-600",
      },
      {
        label: "Champions",
        value: totalChampions,
        icon: Award,
        color: "text-yellow-600",
      },
      {
        label: "Moyenne Lutteurs",
        value: averageFighters,
        icon: TrendingUp,
        color: "text-purple-600",
      },
    ];

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-2">
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

  // Filtres disponibles pour les régions
  const availableFilters = [
    {
      key: 'fighter_count_min',
      label: 'Lutteurs min',
      options: [
        { value: '0', label: 'Tous' },
        { value: '10', label: '10+ lutteurs' },
        { value: '20', label: '20+ lutteurs' },
        { value: '50', label: '50+ lutteurs' },
      ],
    },
  ];

  return (
    <EntityList
      title="Gestion des Régions"
      description="Gérez l'ensemble des régions et leur répartition des lutteurs"
      entityType="region"
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
      // renderStats={renderStats}
      availableFilters={availableFilters}
      renderCard={(region, viewMode) => (
        <EntityCards.Region
          region={region}
          viewMode={viewMode}
          onEdit={onEdit}
          onView={onView}
        />
      )}
    />
  );
}