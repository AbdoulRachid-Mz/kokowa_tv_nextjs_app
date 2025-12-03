// app/admin/referees/page.tsx
"use client";

import { EntityList } from "@/components/shared/entity-list";
import { EntityCards } from "@/components/entities/entity-cards";
import { useEntityList } from "@/hooks/use-entity-list";
import { Referee } from "@/types";
import { Typography } from "@/components/ui/typography";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, Users, Award, Clock, MapPin } from "lucide-react";

export default function RefereesPage() {
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
  } = useEntityList<Referee>({
    entityType: 'referees',
    defaultFilters: {
      is_active: 'active',
      with_region: true,
      limit: '20',
    },
  });

  // Statistiques pour les arbitres
  const renderStats = () => {
    const activeReferees = data.filter(r => r.is_active).length;
    const averageExperience = data.length > 0 
      ? Math.round(data.reduce((sum, ref) => sum + (ref.experience_years || 0), 0) / data.length)
      : 0;
    const certifiedReferees = data.filter(r => r.certification_level).length;

    const stats = [
      {
        label: "Total Arbitres",
        value: total,
        icon: Shield,
        color: "text-blue-600",
      },
      {
        label: "Arbitres Actifs",
        value: activeReferees,
        icon: Users,
        color: "text-green-600",
      },
      {
        label: "Expérience Moyenne",
        value: `${averageExperience} ans`,
        icon: Clock,
        color: "text-orange-600",
      },
      {
        label: "Certifiés",
        value: certifiedReferees,
        icon: Award,
        color: "text-purple-600",
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

  // Filtres disponibles pour les arbitres
  const availableFilters = [
    {
      key: 'is_active',
      label: 'Statut',
      options: [
        { value: 'all', label: 'Tous' },
        { value: 'active', label: 'Actifs' },
        { value: 'inactive', label: 'Inactifs' },
      ],
    },
    {
      key: 'certification_level',
      label: 'Niveau Certification',
      options: [
        { value: 'all', label: 'Tous niveaux' },
        { value: 'national', label: 'National' },
        { value: 'regional', label: 'Régional' },
        { value: 'international', label: 'International' },
      ],
    },
    {
      key: 'experience_min',
      label: 'Expérience min',
      options: [
        { value: '0', label: 'Tous' },
        { value: '5', label: '5+ ans' },
        { value: '10', label: '10+ ans' },
        { value: '15', label: '15+ ans' },
      ],
    },
  ];

  return (
    <EntityList
      title="Gestion des Arbitres"
      description="Gérez l'ensemble des arbitres et leurs assignations aux matchs"
      entityType="referee"
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
      // availableFilters={availableFilters}
      renderCard={(referee, viewMode) => (
        <EntityCards.Referee
          referee={referee}
          viewMode={viewMode}
          onEdit={onEdit}
          onView={onView}
        />
      )}
    />
  );
}