// hooks/use-matches.ts
'use client';

import { useState, useCallback, useMemo } from 'react';
import { Match, MatchFilters } from '@/types';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getMatches } from '@/actions/matches';

interface UseMatchesProps {
  initialFilters?: MatchFilters;
  autoFetch?: boolean;
  priorityOrder?: boolean;
}

export function useMatches({
  initialFilters = {},
  autoFetch = true,
  priorityOrder = true
}: UseMatchesProps = {}) {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<MatchFilters>({
    ...initialFilters,
    page: 1,
    limit: 20
  });

  // Fetch des matches
  const {
    data,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['matches', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });

      const response = await fetch(`/api/matches?${params}`);
      if (!response.ok) throw new Error('Erreur lors du chargement des matches');
      return response.json();
    },
    enabled: autoFetch,
    staleTime: 10000, // 10 secondes
    gcTime: 30000, // 30 secondes
  });

  // Mutation pour mettre à jour un match
  const updateMatchMutation = useMutation({
    mutationFn: async ({ matchId, updates }: { matchId: number; updates: Partial<Match> }) => {
      const response = await fetch(`/api/matches/${matchId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erreur lors de la mise à jour du match');
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      // Mise à jour optimiste
      queryClient.setQueryData(['matches', filters], (old: any) => {
        if (!old?.data) return old;
        return {
          ...old,
          data: old.data.map((match: Match) =>
            match.id === variables.matchId ? { ...match, ...variables.updates } : match
          )
        };
      });

      // Invalider les requêtes liées
      queryClient.invalidateQueries({ queryKey: ['matches'] });
      queryClient.invalidateQueries({ queryKey: ['match', variables.matchId] });

      toast.success(data.message || 'Match mis à jour');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });

  // Mutation pour match nul
  const setMatchDrawMutation = useMutation({
    mutationFn: async (matchId: number) => {
      const response = await fetch(`/api/matches/${matchId}/draw`, {
        method: 'POST'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erreur lors de la déclaration du match nul');
      }

      return response.json();
    },
    onSuccess: (data, matchId) => {
      // Mise à jour optimiste
      queryClient.setQueryData(['matches', filters], (old: any) => {
        if (!old?.data) return old;
        return {
          ...old,
          data: old.data.map((match: Match) =>
            match.id === matchId ? {
              ...match,
              match_result: 'draw',
              status: 'completed',
              winner_fighter_id: null,
              loser_fighter_id: null
            } : match
          )
        };
      });

      toast.success('Match déclaré nul');
    }
  });

  // Mutation pour ajouter un carton
  const addCardMutation = useMutation({
    mutationFn: async (cardData: {
      match_id: number;
      fighter_id: number;
      card_type: 'yellow' | 'red';
      card_reason?: string;
      minute_given?: string;
    }) => {
      const response = await fetch('/api/fighter-cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cardData)
      });

      if (!response.ok) throw new Error('Erreur lors de l\'ajout du carton');
      return response.json();
    },
    onSuccess: () => {
      toast.success('Carton ajouté');
    }
  });

  // Organiser les matches par priorité
  const organizedMatches = useMemo(() => {
    if (!data?.data) return [];

    const matches = [...data.data];

    if (!priorityOrder) return matches;

    const statusPriority: Record<string, number> = {
      'live': 1,
      'round_break': 2,
      'scheduled': 3,
      'upcoming': 4,
      'completed': 5,
      'postponed': 6,
      'cancelled': 7,
      'reclamation': 8
    };

    return matches.sort((a, b) => {
      const priorityA = statusPriority[a.status] || 99;
      const priorityB = statusPriority[b.status] || 99;

      if (priorityA !== priorityB) return priorityA - priorityB;
      if (a.match_date && b.match_date) {
        return new Date(a.match_date).getTime() - new Date(b.match_date).getTime();
      }
      return 0;
    });
  }, [data, priorityOrder]);

  // Stats rapides
  const stats = useMemo(() => {
    const matches = organizedMatches;
    const live = matches.filter(m => m.status === 'live' || m.status === 'round_break');
    const upcoming = matches.filter(m => m.status === 'scheduled');
    const completed = matches.filter(m => m.status === 'completed');

    return {
      total: matches.length,
      live: live.length,
      upcoming: upcoming.length,
      completed: completed.length,
      currentPage: filters.page || 1,
      totalPages: data?.pagination?.totalPages || 1,
      hasNext: data?.pagination?.totalPages ? (filters.page || 1) < data.pagination.totalPages : false,
      hasPrev: (filters.page || 1) > 1
    };
  }, [organizedMatches, data, filters.page]);

  return {
    // Données
    matches: organizedMatches,
    matchesByStatus: {
      live: organizedMatches.filter(m => m.status === 'live' || m.status === 'round_break'),
      upcoming: organizedMatches.filter(m => m.status === 'scheduled'),
      completed: organizedMatches.filter(m => m.status === 'completed'),
      others: organizedMatches.filter(m =>
        !['live', 'round_break', 'scheduled', 'completed'].includes(m.status)
      )
    },

    // États
    isLoading,
    error,
    filters,
    stats,

    // Actions
    updateFilter: useCallback((key: keyof MatchFilters, value: any) => {
      setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
    }, []),

    updateFilters: useCallback((newFilters: Partial<MatchFilters>) => {
      setFilters(prev => ({ ...prev, ...newFilters, page: 1 }));
    }, []),

    resetFilters: useCallback(() => {
      setFilters({ ...initialFilters, page: 1, limit: 20 });
    }, [initialFilters]),

    // Pagination
    goToPage: useCallback((page: number) => {
      setFilters(prev => ({ ...prev, page }));
    }, []),

    nextPage: useCallback(() => {
      if (stats.hasNext) {
        setFilters(prev => ({ ...prev, page: (prev.page || 1) + 1 }));
      }
    }, [stats.hasNext]),

    prevPage: useCallback(() => {
      if (stats.hasPrev) {
        setFilters(prev => ({ ...prev, page: (prev.page || 1) - 1 }));
      }
    }, [stats.hasPrev]),

    // Mutations
    updateMatch: updateMatchMutation.mutate,
    setMatchDraw: setMatchDrawMutation.mutate,
    addCard: addCardMutation.mutate,

    // États des mutations
    isUpdating: updateMatchMutation.isPending,
    isSettingDraw: setMatchDrawMutation.isPending,
    isAddingCard: addCardMutation.isPending,

    // Refresh
    refetch
  };
}

interface UseLiveMatchesOptions {
  limit?: number;
}

export function useLiveMatches({ limit = 10 }: UseLiveMatchesOptions = {}) {
  const {
    data,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['liveMatches', { limit }],
    queryFn: () => getMatches({ status: 'live', limit }),
    refetchInterval: false,
    staleTime: 30000,
  });

  return {
    matches: data?.data || [],
    isLoading,
    error,
    refetch,
  };
}