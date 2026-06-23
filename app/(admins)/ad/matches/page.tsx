// app/ad/matches/page.tsx
"use client";

import { useEntities } from "@/hooks/use-entities";
import { Match, MatchFilters } from "@/types";
import { MatchFilters as MatchFiltersComponent } from "./match-filters";
import { Button } from "@/components/ui/button";
import { Calendar, Trophy, Users, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
// import { MatchCard } from './match-card';
import { MatchStats } from "./match-stats";
import { StatsCard } from "@/components/dashboard/stats-card";
import { EntityList } from "@/components/shared/entity-list";
import { useState } from "react";
import { MatchCard } from "@/components/entities/entity-cards";

export default function MatchesPage() {
  const entities = useEntities<Match, MatchFilters>({
    entityType: "matches",
    initialFilters: {
      status: undefined,
    },
    initialLimit: 20,
    initialSortBy: "match_date",
    initialSortOrder: "desc",
    withRelations: true,
  });

  const [viewMode, setViewMode] = useState<"grid" | "list" | "compact">("grid");

  const { total, data, isLoading, filters, updateFilter, setSorting } =
    entities;

  const stats = {
    total: total,
    scheduled: data.filter((m) => m.status === "scheduled").length,
    live: data.filter((m) => m.status === "live").length,
    completed: data.filter((m) => m.status === "completed").length,
    today: data.filter((m) => {
      const today = new Date().toISOString().split("T")[0];
      const matchDate = new Date(m.match_date);
      if (!isNaN(matchDate.getTime())) {
        const matchDateStr = matchDate.toISOString().split("T")[0];
        return matchDateStr === today;
      }
      return false;
    }).length,
  };

  // Filtres disponibles pour le composant EntityList
  const availableFilters = [
    {
      key: "status",
      label: "Statut",
      options: [
        { value: "all", label: "Tous les statuts" },
        { value: "scheduled", label: "Programmés" },
        { value: "live", label: "En direct" },
        { value: "completed", label: "Terminés" },
        { value: "cancelled", label: "Annulés" },
        { value: "postponed", label: "Reportés" },
        { value: "reclamation", label: "Réclamation" },
      ],
    },
    {
      key: "period",
      label: "Période",
      options: [
        { value: "all", label: "Toutes les périodes" },
        { value: "today", label: "Aujourd'hui" },
        { value: "week", label: "Cette semaine" },
        { value: "month", label: "Ce mois" },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 ">
        <StatsCard
          title="Total des matchs"
          value={stats.total}
          icon={Trophy}
          color="blue"
        />
        <StatsCard
          title="En direct"
          value={stats.live}
          icon={Trophy}
          color="green"
        />
        <StatsCard
          title="Programmés"
          value={stats.scheduled}
          icon={Calendar}
          color="yellow"
        />
        <StatsCard
          title="Terminés"
          value={stats.completed}
          icon={Clock}
          color="purple"
        />
      </div>

      {/* Composant de liste principal */}
      <EntityList
        title="Matchs"
        description="Gérez tous les matchs de lutte traditionnelle"
        entityType="matches"
        data={entities.data}
        total={entities.total}
        loading={entities.isLoading}
        page={entities.page}
        limit={entities.limit}
        onPageChange={entities.setPage}
        onLimitChange={entities.setLimit}
        searchTerm={entities.searchTerm}
        onSearchChange={entities.setSearchTerm}
        viewMode={viewMode}
        filters={entities.filters}
        itemsPerView={{
          mobile: viewMode === "grid" ? 1 : viewMode === "list" ? 1 : 2,
          md: viewMode === "grid" ? 2 : viewMode === "list" ? 1 : 2,
          lg: viewMode === "grid" ? 2 : viewMode === "list" ? 1 : 2,
          xl: viewMode === "grid" ? 2 : viewMode === "list" ? 1 : 3,
        }}
        onFilterChange={(filters) => {
          Object.entries(filters).forEach(([key, value]) => {
            entities.updateFilter(
              key as keyof MatchFilters,
              value as MatchFilters[keyof MatchFilters],
            );
          });
        }}
        onAdd={() => {}}
        onViewModeChange={setViewMode}
        renderCard={(match, viewMode) => (
          <MatchCard item={match} viewMode={viewMode} />
        )}
        availableFilters={availableFilters}
      />
    </div>
  );
}
