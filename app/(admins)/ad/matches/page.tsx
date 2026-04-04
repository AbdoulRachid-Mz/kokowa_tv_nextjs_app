// app/ad/matches/page.tsx
'use client';

import { useEntities } from '@/hooks/use-entities';
import { EntityList } from '@/components/shared/entity-list-2';
import { Match, MatchFilters } from '@/types';
import { MatchFilters as MatchFiltersComponent } from './match-filters';

import { Button } from '@/components/ui/button';
import { Calendar, Trophy, Users, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { MatchCard } from './match-card';
import { MatchStats } from './match-stats';
import { useRealtime } from '@/hooks/use-realtime';
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export default function MatchesPage() {
  const queryClient = useQueryClient();
  const entities = useEntities<Match, MatchFilters>({
    entityType: 'matches',
    initialFilters: {
      status: undefined,
    },
    initialLimit: 24,
    initialSortBy: 'match_date',
    initialSortOrder: 'desc',
    withRelations: true,
  });

  const {
    total,
    data,
    isLoading,
    filters,
    updateFilter,
    setSorting,
  } = entities;

  // Realtime Integration
  const { isConnected, subscribe } = useRealtime({
    autoConnect: true,
    onMessage: (msg) => {
      if (msg.type === 'update' && msg.data.entityType === 'match') {
        // Invalider les données quand un match change
        queryClient.invalidateQueries({ queryKey: ['matches'] });
      }
    }
  });

  // S'abonner aux matchs visibles
  useEffect(() => {
    if (isConnected && data.length > 0) {
      data.forEach(match => {
        if (match.id) subscribe('match', match.id);
      });
    }
  }, [data, isConnected, subscribe]);

  // Statistiques calculées à partir des données
  const stats = {
    total: total,
    scheduled: data.filter(m => m.status === 'scheduled').length,
    live: data.filter(m => m.status === 'live').length,
    completed: data.filter(m => m.status === 'completed').length,
    today: data.filter(m => {
      const today = new Date().toISOString().split('T')[0];
      return m.match_date?.startsWith(today);
    }).length,
  };

  // Filtres disponibles pour le composant EntityList
  const availableFilters = [
    {
      key: 'status',
      label: 'Statut',
      options: [
        { value: 'all', label: 'Tous les statuts' },
        { value: 'scheduled', label: 'Programmés' },
        { value: 'live', label: 'En direct' },
        { value: 'completed', label: 'Terminés' },
        { value: 'cancelled', label: 'Annulés' },
        { value: 'postponed', label: 'Reportés' },
        { value: 'reclamation', label: 'Réclamation' },
      ],
    },
    {
      key: 'period',
      label: 'Période',
      options: [
        { value: 'all', label: 'Toutes les périodes' },
        { value: 'today', label: "Aujourd'hui" },
        { value: 'week', label: 'Cette semaine' },
        { value: 'month', label: 'Ce mois' },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard
          title="Total des matchs"
          value={stats.total}
          icon={<Trophy className="h-5 w-5" />}
          color="blue"
        />
        <StatsCard
          title="En direct"
          value={stats.live}
          icon={<Users className="h-5 w-5" />}
          color="green"
        />
        <StatsCard
          title="Programmés"
          value={stats.scheduled}
          icon={<Calendar className="h-5 w-5" />}
          color="yellow"
        />
        <StatsCard
          title="Terminés"
          value={stats.completed}
          icon={<Clock className="h-5 w-5" />}
          color="purple"
        />
      </div>

      {/* Composant de liste principal */}
      <EntityList
        entities={entities}
        title="Matchs"
        description="Gérez tous les matchs de lutte traditionnelle"
        entityType="matches"
        renderCard={(match, viewMode) => (
          <MatchCard match={match} viewMode={viewMode} />
        )}
        renderFilters={() => (
          <MatchFiltersComponent
            filters={filters}
            onFilterChange={updateFilter}
            onSortChange={setSorting}
          />
        )}
        renderStats={() => (
          <MatchStats stats={stats} />
        )}
        availableFilters={availableFilters}
        showSelection={true}
        showExport={true}
        showAddButton={true}
      />
    </div>
  );
}

// Composant pour les cartes de statistiques
function StatsCard({ title, value, icon, color }: { 
  title: string; 
  value: number; 
  icon: React.ReactNode; 
  color: 'blue' | 'green' | 'yellow' | 'purple' | 'red' 
}) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400',
    green: 'bg-green-50 text-green-600 dark:bg-green-950 dark:text-green-400',
    yellow: 'bg-yellow-50 text-yellow-600 dark:bg-yellow-950 dark:text-yellow-400',
    purple: 'bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400',
    red: 'bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400',
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold mt-2">{value}</p>
          </div>
          <div className={`p-3 rounded-full ${colorClasses[color]}`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}