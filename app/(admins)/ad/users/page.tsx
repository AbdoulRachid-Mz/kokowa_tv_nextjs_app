// app/admin/users/page.tsx
"use client";

import { EntityList } from "@/components/shared/entity-list";
// import { UserCard } from "@/components/entities/user-card";
import { useEntityList } from "@/hooks/use-entity-list";
import { User } from "@/types";
import { Typography } from "@/components/ui/typography";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Shield, UserCheck, Activity } from "lucide-react";
import { UserCard } from "@/components/entities/entity-cards";

export default function UsersPage() {
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
  } = useEntityList<User>({
    entityType: "users",
    defaultFilters: {
      is_active: true,
      limit: 20,
    },
  });

  // Statistiques pour les utilisateurs
  const renderStats = () => {
    const stats = [
      {
        label: "Total Utilisateurs",
        value: total,
        icon: Users,
        color: "text-blue-600",
      },
      {
        label: "Administrateurs",
        value: data.filter(u => u.role === 'admin').length,
        icon: Shield,
        color: "text-red-600",
      },
      {
        label: "Utilisateurs Actifs",
        value: data.filter(u => u.is_active).length,
        icon: UserCheck,
        color: "text-green-600",
      },
      {
        label: "Vérifiés",
        value: data.filter(u => u.is_verified).length,
        icon: Activity,
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
                <div
                  className={`p-3 rounded-lg bg-opacity-10 ${stat.color} bg-current`}
                >
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <EntityList
      title="Gestion des Utilisateurs"
      description="Gérez l'ensemble des utilisateurs de la plateforme"
      entityType="user"
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
      renderCard={(user, viewMode) => (
        <UserCard
          user={user}
          viewMode={viewMode}
          onEdit={onEdit}
          onView={onView}
        />
      )}
    />
  );
}