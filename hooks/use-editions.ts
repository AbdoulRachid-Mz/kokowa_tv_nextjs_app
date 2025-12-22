// hooks/use-editions.ts
'use client'

import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getEditions, getEditionById, getEditionsStats } from '@/actions/editions'
import { EditionFilters, CompetitionEdition, Phase } from '@/types'

export function useEditions(filters: EditionFilters = {}) {
  const queryClient = useQueryClient()

  // Les filtres sont stabilisés (pas de setState inutile)
  const memoizedFilters = useMemo(() => ({
    page: filters.page ?? 1,
    limit: filters.limit ?? 20,
    search: filters.search ?? '',
    year: filters.year ?? undefined,
    competition_id: filters.competition_id ?? undefined,
    is_active: filters.is_active ?? undefined,
    with_competition: filters.with_competition ?? true,
    with_fighters: filters.with_fighters ?? false,
    with_regions: filters.with_regions ?? false,
    with_phases: filters.with_phases ?? true,
    sortBy: filters.sortBy ?? undefined,
    sortOrder: filters.sortOrder ?? undefined
  }), [
    filters.page,
    filters.limit,
    filters.search,
    filters.year,
    filters.competition_id,
    filters.is_active,
    filters.with_competition,
    filters.with_fighters,
    filters.with_regions,
    filters.with_phases,
    filters.sortBy,
    filters.sortOrder
  ])

  const query = useQuery({
    queryKey: ['editions', memoizedFilters],
    queryFn: () => getEditions(memoizedFilters),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })

  const fetchEditions = useCallback(() => {
    return query.refetch()
  }, [query])

  return {
    editions: query.data?.data || [],
    pagination: query.data?.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 },
    loading: query.isLoading,
    error: query.error,
    refetch: fetchEditions,
    invalidate: () => queryClient.invalidateQueries({ queryKey: ['editions'] }),
    filters: memoizedFilters
  }
}

export function useEdition(id: number, options?: { with_relations?: boolean }) {
  const memoizedOptions = useMemo(() => options, [JSON.stringify(options)])
  
  return useQuery({
    queryKey: ['edition', id, memoizedOptions],
    queryFn: () => getEditionById(id, memoizedOptions),
    enabled: !!id,
    staleTime: 3 * 60 * 1000, // 3 minutes
  })
}

export function useEditionsStats() {
  return useQuery({
    queryKey: ['editions-stats'],
    queryFn: getEditionsStats,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

export function useEditionsFilters() {
  // États pour les valeurs des filtres
  const [search, setSearch] = useState('')
  const [yearFilter, setYearFilter] = useState<number | null>(null)
  const [competitionFilter, setCompetitionFilter] = useState<number | null>(null)
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'upcoming' | 'completed'>('all')
  const [otherFilters, setOtherFilters] = useState<Partial<EditionFilters>>({
    page: 1,
    limit: 12,
    with_competition: true,
    with_phases: true,
    with_fighters: true,
    with_regions: true,
  })

  // Appliquer les filtres - version simplifiée sans dépendance circulaire
  const appliedFilters = useMemo((): EditionFilters => {
    const filters: EditionFilters = {
      ...otherFilters,
      with_competition: true,
      with_phases: true,
      with_fighters: true,
      with_regions: true,
    }

    // Ajouter les filtres seulement s'ils ont une valeur
    if (search.trim()) {
      filters.search = search
    }
    if (yearFilter) {
      filters.year = yearFilter
    }
    if (competitionFilter) {
      filters.competition_id = competitionFilter
    }

    // Gérer le statut
    if (statusFilter === 'active') {
      filters.is_active = true
    } else if (statusFilter === 'upcoming') {
      // Filtre côté client
      filters.is_active = true
    } else if (statusFilter === 'completed') {
      // Filtre côté client
      filters.is_active = true
    }

    return filters
  }, [search, yearFilter, competitionFilter, statusFilter, otherFilters])

  // Fonctions de mise à jour stabilisées
  const updateSearch = useCallback((value: string) => {
    setSearch(value)
    setOtherFilters(prev => ({ ...prev, page: 1 }))
  }, [])

  const updateYearFilter = useCallback((value: number | null) => {
    setYearFilter(value)
    setOtherFilters(prev => ({ ...prev, page: 1 }))
  }, [])

  const updateCompetitionFilter = useCallback((value: number | null) => {
    setCompetitionFilter(value)
    setOtherFilters(prev => ({ ...prev, page: 1 }))
  }, [])

  const updateStatusFilter = useCallback((value: 'all' | 'active' | 'upcoming' | 'completed') => {
    setStatusFilter(value)
    setOtherFilters(prev => ({ ...prev, page: 1 }))
  }, [])

  const updateOtherFilters = useCallback((newFilters: Partial<EditionFilters>) => {
    setOtherFilters(prev => ({ ...prev, ...newFilters }))
  }, [])

  const resetFilters = useCallback(() => {
    setSearch('')
    setYearFilter(null)
    setCompetitionFilter(null)
    setStatusFilter('all')
    setOtherFilters({
      page: 1,
      limit: 12,
      with_competition: true,
      with_phases: true,
      with_fighters: true,
      with_regions: true,
    })
  }, [])

  return {
    // Valeurs des filtres
    search,
    yearFilter,
    competitionFilter,
    statusFilter,
    otherFilters,
    
    // Fonctions de mise à jour
    setSearch: updateSearch,
    setYearFilter: updateYearFilter,
    setCompetitionFilter: updateCompetitionFilter,
    setStatusFilter: updateStatusFilter,
    updateFilters: updateOtherFilters,
    
    // Filtres appliqués
    appliedFilters,
    
    // Reset
    resetFilters,
    
    // Vérification si des filtres sont actifs
    hasFilters: !!search || !!yearFilter || !!competitionFilter || statusFilter !== 'all'
  }
}

interface UseAllEditionsReturn {
  // Toutes les éditions
  allEditions: CompetitionEdition[]
  
  // Éditions filtrées
  currentEditions: CompetitionEdition[]
  upcomingEditions: CompetitionEdition[]
  completedEditions: CompetitionEdition[]
  
  // États
  loading: boolean
  error: Error | null
  refetch: () => void
  
  // Stats
  stats: {
    total: number
    current: number
    upcoming: number
    completed: number
  }
}

export function useAllEditions(options = {}): UseAllEditionsReturn {
  const {
    editions,
    loading,
    error,
    refetch
  } = useEditions({
    limit: 50, // Récupérer un bon nombre d'éditions
    with_competition: true,
    with_fighters: true,
    with_regions: true,
    with_phases: true,
    ...options
  })

  // Filtrer les éditions par statut
  const filteredEditions = useMemo(() => {
    if (!editions.length) return { current: [], upcoming: [], completed: [] }
    
    const now = new Date()
    
    return {
      current: editions.filter(edition => 
        edition.phases?.some((phase: Phase) => phase.is_active && !phase.is_completed)
      ),
      upcoming: editions.filter(edition => {
        if (!edition.start_date) return false
        const startDate = new Date(edition.start_date)
        return startDate > now
      }),
      completed: editions.filter(edition => {
        if (!edition.end_date) return false
        const endDate = new Date(edition.end_date)
        return endDate < now
      })
    }
  }, [editions])

  // Calculer les stats
  const stats = useMemo(() => ({
    total: editions.length,
    current: filteredEditions.current.length,
    upcoming: filteredEditions.upcoming.length,
    completed: filteredEditions.completed.length
  }), [editions.length, filteredEditions])

  return {
    allEditions: editions,
    currentEditions: filteredEditions.current,
    upcomingEditions: filteredEditions.upcoming,
    completedEditions: filteredEditions.completed,
    loading,
    error,
    refetch,
    stats
  }
}