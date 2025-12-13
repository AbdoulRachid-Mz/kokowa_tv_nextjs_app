// hooks/use-competitions.ts
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useQuery, useInfiniteQuery } from '@tanstack/react-query'
import { Competition, CompetitionEdition, CompetitionFilters, EditionFilters } from '@/types'

// Hook pour les compétitions
export function useCompetitions(filters?: CompetitionFilters) {
  const [params, setParams] = useState<CompetitionFilters>(filters || {})
  
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['competitions', params],
    queryFn: async () => {
      const queryParams = new URLSearchParams()
      
      if (params.search) queryParams.append('search', params.search)
      if (params.page) queryParams.append('page', params.page.toString())
      if (params.limit) queryParams.append('limit', params.limit.toString())
      if (params.status) queryParams.append('status', params.status)
      if (params.region_id) queryParams.append('region_id', params.region_id.toString())
      if (params.edition_year) queryParams.append('edition_year', params.edition_year.toString())
      
      queryParams.append('with_region', 'true')
      queryParams.append('with_editions', 'true')
      
      const response = await fetch(`/api/competitions?${queryParams.toString()}`)
      
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des compétitions')
      }
      
      return response.json()
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  const updateFilters = useCallback((newFilters: CompetitionFilters) => {
    setParams(prev => ({ ...prev, ...newFilters }))
  }, [])

  const resetFilters = useCallback(() => {
    setParams(filters || {})
  }, [filters])

  return {
    competitions: data?.data || [],
    pagination: data?.pagination,
    isLoading,
    error,
    refetch,
    filters: params,
    updateFilters,
    resetFilters,
    total: data?.total || 0,
  }
}

// Hook pour les éditions
export function useEditions(filters?: EditionFilters) {
  const [params, setParams] = useState<EditionFilters>(filters || {})
  
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['editions', params],
    queryFn: async () => {
      const queryParams = new URLSearchParams()
      
      if (params.competition_id) queryParams.append('competition_id', params.competition_id.toString())
      if (params.year) queryParams.append('year', params.year.toString())
      if (params.search) queryParams.append('search', params.search)
      if (params.page) queryParams.append('page', params.page.toString())
      if (params.limit) queryParams.append('limit', params.limit.toString())
      
      queryParams.append('with_competition', 'true')
      queryParams.append('with_fighters', 'true')
      queryParams.append('with_regions', 'true')
      queryParams.append('with_phases', 'true')
      
      const response = await fetch(`/api/editions`)
      
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des éditions')
      }
      
      return response.json()
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  const updateFilters = useCallback((newFilters: EditionFilters) => {
    setParams(prev => ({ ...prev, ...newFilters }))
  }, [])

  const resetFilters = useCallback(() => {
    setParams(filters || {})
  }, [filters])

  return {
    editions: data?.data || [],
    pagination: data?.pagination,
    isLoading,
    error,
    refetch,
    filters: params,
    updateFilters,
    resetFilters,
    total: data?.total || 0,
  }
}

// Hook pour une compétition spécifique
export function useCompetition(id: string | number) {
  return useQuery({
    queryKey: ['competition', id],
    queryFn: async () => {
      const response = await fetch(`/api/competitions/${id}?with_relations=true`)
      
      if (!response.ok) {
        throw new Error('Compétition non trouvée')
      }
      
      return response.json()
    },
    enabled: !!id,
    staleTime: 3 * 60 * 1000, // 3 minutes
  })
}

// Hook pour une édition spécifique
export function useEdition(id: string | number) {
  return useQuery({
    queryKey: ['edition', id],
    queryFn: async () => {
      const response = await fetch(`/api/editions/${id}?with_relations=true`)
      
      if (!response.ok) {
        throw new Error('Édition non trouvée')
      }
      
      return response.json()
    },
    enabled: !!id,
    staleTime: 3 * 60 * 1000, // 3 minutes
  })
}

// Hook pour les statistiques des compétitions
export function useCompetitionStats() {
  return useQuery({
    queryKey: ['competition-stats'],
    queryFn: async () => {
      const response = await fetch('/api/stats?entity=competitions')
      
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des statistiques')
      }
      
      return response.json()
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

// Hook pour les statistiques des éditions
export function useEditionStats() {
  return useQuery({
    queryKey: ['edition-stats'],
    queryFn: async () => {
      const response = await fetch('/api/stats?entity=editions')
      
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des statistiques')
      }
      
      return response.json()
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

// Hook pour les compétitions actives (infinite scroll)
export function useActiveCompetitions() {
  return useInfiniteQuery({
    queryKey: ['active-competitions'],
    queryFn: async ({ pageParam = 1 }) => {
      const queryParams = new URLSearchParams({
        page: pageParam.toString(),
        limit: '10',
        status: 'ongoing,upcoming',
        with_editions: 'true',
        with_region: 'true',
      })
      
      const response = await fetch(`/api/competitions?${queryParams.toString()}`)
      
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des compétitions')
      }
      
      return response.json()
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.pagination.page < lastPage.pagination.totalPages) {
        return lastPage.pagination.page + 1
      }
      return undefined
    },
    initialPageParam: 1,
  })
}