"use client";

import { EntityList } from "@/components/shared/entity-list";
import { useEntityList } from "@/hooks/use-entity-list";
import { PhaseGroup } from "@/types";
import { Typography } from "@/components/ui/typography";
import { Card, CardContent } from "@/components/ui/card";
import { CardStats } from "@/components/entities/card-stats";
import { StatsCarousel } from "@/components/shared/stats-carousel";
import { DynamicActionMenu, MenuItemAction } from "@/components/shared/dynamic-action-menu";
import { Folder, Layers, Trophy, Calendar, Eye, Pencil, Trash2, MoreHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { SubGroupCard } from "@/components/entities/entity-cards";

export default function PhaseGroupsPage() {
  const router = useRouter();
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
  } = useEntityList<PhaseGroup>({
    entityType: "phase-groups",
    defaultFilters: {
      with_phase: true,
      with_sub_groups: true,
      limit: "20",
    },
  });

  const renderStats = () => {
    const totalSubGroups = data.reduce(
      (sum, group) => sum + (group.sub_groups?.length || 0),
      0
    );
    const completedGroups = data.filter((group) => group.is_completed).length;
    const groupsWithMatches = data.filter((group) =>
      group.sub_groups?.some((sg) => (sg?.matches_count && sg.matches_count > 0) || (sg?.matches && sg.matches.length > 0))
    ).length;

    const stats = [
      {
        label: "Total Groupes",
        value: total,
        icon: Folder,
        color: "text-blue-600",
      },
      {
        label: "Sous-groupes",
        value: totalSubGroups,
        icon: Layers,
        color: "text-green-600",
      },
      {
        label: "Groupes Terminés",
        value: completedGroups,
        icon: Trophy,
        color: "text-purple-600",
      },
      {
        label: "Avec Matchs",
        value: groupsWithMatches,
        icon: Calendar,
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

  const availableFilters = [
    {
      key: "phase_id",
      label: "Phase",
      options: [
        { value: "all", label: "Toutes phases" },
        // Les phases seront chargées dynamiquement
      ],
    },
    // {
    //   key: "is_completed",
    //   label: "Statut",
    //   options: [
    //     { value: "all", label: "Tous" },
    //     { value: "true", label: "Terminé" },
    //     { value: "false", label: "En cours" },
    //   ],
    // },
    {
      key: "sort",
      label: "Trier par",
      options: [
        { value: "group_order", label: "Ordre" },
        { value: "name", label: "Nom" },
        { value: "sub_groups_count", label: "Nombre sous-groupes" },
      ],
    },
  ];

  const handleViewGroup = (group: PhaseGroup) => {
    router.push(`/ad/phase-groups/${group.id}`);
  };

  const handleEditGroup = (group: PhaseGroup) => {
    router.push(`/ad/phase-groups/${group.id}/edit`);
  };

  const handleManageMatches = (group: PhaseGroup) => {
    router.push(`/ad/phase-groups/${group.id}/matches`);
  };

  return (
    <EntityList
      title="Gestion des Groupes"
      description="Gérez les groupes de phase et leurs sous-groupes"
      entityType="phase-groups"
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
      availableFilters={availableFilters}
      renderCard={(item, viewMode) => {
        // Adapt PhaseGroup to the shape SubGroupCard expects
        const adaptedItem = {
          ...item,
          group_id: item.phase?.id ?? null,
          sub_group_order: item.group_order ?? 0,
        };
        // Ensure group_id is always a number to match SubGroup type
        return <SubGroupCard item={{ 
          ...adaptedItem, group_id: adaptedItem.group_id ?? 0 }} 
          onView={() => router.push(`/ad/sub_groups/${adaptedItem.id}`)} 
          onEdit={() => router.push(`/ad/sub_groups/${adaptedItem.id}/edit`)} 
          viewMode={viewMode} />;
      }}
    />
  );
}
