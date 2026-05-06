// app/admin/archives/page.tsx
"use client";

import { EntityList } from "@/components/shared/entity-list";
import { EntityCards } from "@/components/entities/entity-cards";
import { useEntityList } from "@/hooks/use-entity-list";
import { ArchiveFighterAchievement } from "@/types";
import { Typography } from "@/components/ui/typography";
import { Card, CardContent } from "@/components/ui/card";
import { Archive, CheckCircle, Clock, XCircle, TrendingUp, RotateCcw, History } from "lucide-react";
import { CardStats } from "@/components/entities/card-stats";
import { useEffect, useState } from "react";
import { ArchiveAchievementCard } from "@/components/entities/archive-card";
import { useRouter } from "next/navigation";

export default function ArchivesPage() {
  const [stats, setStats] = useState({
    total_archives: 0,
    correction_archives: 0,
    duplicate_archives: 0,
    error_archives: 0,
    avg_year: 0,
  });
  const router = useRouter();

  const handleRestore = async (id: string) => {
    try {
      const response = await fetch(`/api/archives/${id}/restore`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erreur lors de la restauration');
      }

      // Recharger les données après restauration
      onRefresh();
      // Recharger les statistiques
      loadStats();
      
      // Notification de succès (vous pouvez utiliser votre système de notification ici)
      console.log('Archive restaurée avec succès');
    } catch (error) {
      console.error('Erreur lors de la restauration:', error);
      // Gérer l'erreur (notification ou message d'erreur)
    }
  };

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
  } = useEntityList<ArchiveFighterAchievement>({
    entityType: "archives",
    defaultFilters: {
      limit: "20",
      with_fighter: true,
      with_region: true,
      with_edition: true,
    },
  });

  const handleCreate = () => {
    router.push("/ad/achievements/create");
  };

  // Charger les statistiques
  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await fetch('/api/archives/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Erreur chargement statistiques:", error);
    }
  };

  // Statistiques pour les archives
  const renderStats = () => {
    const statsList = [
      {
        label: "Total Archives",
        value: stats.total_archives,
        icon: Archive,
        color: "text-gray-600",
        description: "Palmarès archivés"
      },
      {
        label: "Corrections",
        value: stats.correction_archives,
        icon: CheckCircle,
        color: "text-blue-600",
        description: "Archives de correction"
      },
      {
        label: "Doublons",
        value: stats.duplicate_archives,
        icon: TrendingUp,
        color: "text-yellow-600",
        description: "Doublons supprimés"
      },
      {
        label: "Erreurs",
        value: stats.error_archives,
        icon: XCircle,
        color: "text-red-600",
        description: "Erreurs corrigées"
      },
    ];

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsList.map((stat, index) => (
          <Card key={index} className="relative overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <Typography variant="h3" weight="bold" className="mb-1">
                    {stat.value}
                  </Typography>
                  <Typography variant="body-sm" weight="medium" className="mb-1">
                    {stat.label}
                  </Typography>
                  <Typography variant="caption2" theme="muted">
                    {stat.description}
                  </Typography>
                </div>
                <div className={`p-3 rounded-full ${stat.color.replace('text-', 'bg-')}/10`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-current to-transparent opacity-20"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <EntityList
      title="Archives des Palmarès"
      description="Consultez et gérez les palmarès archivés des lutteurs"
      entityType="archive"
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
      onAdd={handleCreate}
      onExport={onExport}
      onRefresh={onRefresh}
      viewMode={viewMode}
      onViewModeChange={setViewMode}
      renderStats={renderStats}
      renderCard={(archive, viewMode) => (
        <ArchiveAchievementCard
          item={archive}
          viewMode={viewMode}
          onEdit={() => onEdit(archive)}
          onView={() => onView(archive)}
          onRestore={() => handleRestore(archive.id.toString())}
        />
      )}
    />
  );
}