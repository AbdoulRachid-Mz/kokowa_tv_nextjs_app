// hooks/use-matches.ts
'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Match, MatchFilters } from '@/types'
import { useQuery } from '@tanstack/react-query'

interface UseMatchesProps {
  initialFilters?: MatchFilters
  autoFetch?: boolean
  priorityOrder?: boolean
}

export function useMatches({ 
  initialFilters = {}, 
  autoFetch = true,
  priorityOrder = true 
}: UseMatchesProps = {}) {
  const [filters, setFilters] = useState<MatchFilters>({
    ...initialFilters,
    page: 1,
    limit: 20
  })

  const [prioritizedMatches, setPrioritizedMatches] = useState<Match[]>([])
  const [shouldFetch, setShouldFetch] = useState(autoFetch)

  // Fetch des matches avec TanStack Query
 const { 
    data, 
    isLoading, 
    error, 
    refetch 
  } = useQuery({
    queryKey: ['matches', filters],
    queryFn: async () => {
      // Vérifier si les filtres sont vides
      const isEmptyFilters = Object.keys(filters).length === 2 && filters.page === 1 && filters.limit === 20
      
      if (isEmptyFilters) {
        return { data: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } }
      }

      const params = new URLSearchParams()
      
      // Ajouter tous les filtres
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value))
        }
      })

      const response = await fetch(`/api/matches?${params}`)
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des matches')
      }
      return response.json()
    },
    enabled: shouldFetch,
    staleTime: 30000, // 30 secondes
    gcTime: 60000, // 1 minute
  })

  // Organiser les matches par priorité
  const organizeByPriority = useCallback((matches: Match[]): Match[] => {
    if (!priorityOrder) return matches

    const statusPriority: Record<string, number> = {
      'live': 1,
      'round_break': 2,
      'scheduled': 3,
      'upcoming': 4,
      'completed': 5,
      'postponed': 6,
      'cancelled': 7,
      'reclamation': 8
    }

    return [...matches].sort((a, b) => {
      // Priorité par statut
      const priorityA = statusPriority[a.status] || 99
      const priorityB = statusPriority[b.status] || 99

      if (priorityA !== priorityB) {
        return priorityA - priorityB
      }

      // Si même statut, tri par date (le plus proche en premier)
      if (a.match_date && b.match_date) {
        return new Date(a.match_date).getTime() - new Date(b.match_date).getTime()
      }

      return 0
    })
  }, [priorityOrder])

  // Mettre à jour les matches priorisés
  useEffect(() => {
    if (data?.data) {
      setPrioritizedMatches(organizeByPriority(data.data))
    }
  }, [data, organizeByPriority])

  // Méthodes pour gérer les filtres
  const updateFilter = useCallback((key: keyof MatchFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1 // Reset à la première page lors du changement de filtre
    }))
  }, [])

 const updateFilters = useCallback((newFilters: Partial<MatchFilters>) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters,
      page: 1
    }))
    setShouldFetch(true)
  }, [])

  const resetFilters = useCallback(() => {
    setFilters({
      ...initialFilters,
      page: 1,
      limit: 20
    })
  }, [initialFilters])

  // Navigation pagination
  const goToPage = useCallback((page: number) => {
    setFilters(prev => ({ ...prev, page }))
  }, [])

  const nextPage = useCallback(() => {
    if (data?.pagination?.hasNext) {
      goToPage(filters.page! + 1)
    }
  }, [data?.pagination?.hasNext, filters.page, goToPage])

  const prevPage = useCallback(() => {
    if (filters.page! > 1) {
      goToPage(filters.page! - 1)
    }
  }, [filters.page, goToPage])

  // Groupes par statut pour affichage
  const matchesByStatus = useMemo(() => {
    const groups: Record<string, Match[]> = {
      live: [],
      upcoming: [],
      completed: [],
      others: []
    }

    prioritizedMatches.forEach(match => {
      if (match.status === 'live' || match.status === 'round_break') {
        groups.live.push(match)
      } else if (match.status === 'scheduled') {
        groups.upcoming.push(match)
      } else if (match.status === 'completed') {
        groups.completed.push(match)
      } else {
        groups.others.push(match)
      }
    })

    return groups
  }, [prioritizedMatches])

  // Stats rapides
  const stats = useMemo(() => ({
    total: data?.pagination?.total || 0,
    live: matchesByStatus.live.length,
    upcoming: matchesByStatus.upcoming.length,
    completed: matchesByStatus.completed.length,
    currentPage: filters.page || 1,
    totalPages: data?.pagination?.totalPages || 1,
    hasNext: data?.pagination?.totalPages ? filters.page! < data.pagination.totalPages : false,
    hasPrev: filters.page! > 1
  }), [data, filters.page, matchesByStatus])

  return {
    // Données
    matches: prioritizedMatches,
    rawData: data?.data || [],
    matchesByStatus,
    
    // États
    isLoading,
    error,
    filters,
    stats,
    
    // Actions sur les filtres
    updateFilter,
    updateFilters,
    resetFilters,
    
    // Pagination
    goToPage,
    nextPage,
    prevPage,
    
    // Refresh
    refetch,
    
    // Utilitaires
    totalMatches: data?.pagination?.total || 0,
    hasMore: data?.pagination?.hasNext || false
  }
}