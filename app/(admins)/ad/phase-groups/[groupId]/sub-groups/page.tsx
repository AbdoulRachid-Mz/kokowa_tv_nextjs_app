// app/admin/sub-groups/page.tsx
"use client";

import { EntityList } from "@/components/shared/entity-list";
import { EntityCards } from "@/components/entities/entity-cards";
import { useEntityList } from "@/hooks/use-entity-list";
import { PhaseGroup, SubGroup } from "@/types";
import { Users, Swords, Trophy, Clock } from "lucide-react";
import { CardStats } from "@/components/entities/card-stats";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { getPhaseGroupById } from "@/actions/phase-groups";

export default function SubGroupsPage() {
  const { groupId } = useParams();
  const [group, setGroup] = useState<PhaseGroup | null>(null);

  useEffect(() => {
    if (!groupId) return;
    getPhaseGroupById(Number(groupId)).then(setGroup);
    console.log(group);
  }, [groupId]);

  const subGroups: SubGroup[] = group?.sub_groups || [];

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
  } = useEntityList<SubGroup>({
    entityType: "sub-groups",
    defaultData: subGroups,
    defaultFilters: {
      with_group: true,
      with_regions: true,
      with_matches: true,
      limit: "20",
    },
  });

  // Statistiques pour les sous-groupes
  const renderStats = () => {
    const stats = [
      {
        label: "Total Rencontres",
        value: total,
        icon: Swords,
        color: "text-blue-600",
      },
      {
        label: "Rencontres Terminées",
        value: subGroups.filter((sg) => sg.is_completed).length,
        icon: Trophy,
        color: "text-green-600",
      },
      {
        label: "Rencontres Actives",
        value: subGroups.filter((sg) => sg.is_active).length,
        icon: Clock,
        color: "text-yellow-600",
      },
      {
        label: "Matchs Total",
        value: subGroups.reduce(
          (acc, sg) => acc + (sg.matches?.length || 0),
          0
        ),
        icon: Users,
        color: "text-purple-600",
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
      title="Gestion des Rencontres"
      description="Organisez et gérez les rencontres entre régions"
      entityType="sub-group"
      data={subGroups}
      total={subGroups.length}
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
    //   renderStats={renderStats}
      renderCard={(subGroup, viewMode) => (
        <EntityCards.SubGroup
          item={subGroup}
          viewMode={viewMode}
          onEdit={onEdit}
          onView={onView}
        />
      )}
    />
  );
}
