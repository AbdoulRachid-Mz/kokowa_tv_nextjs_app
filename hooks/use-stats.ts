// hooks/use-stats.ts
'use client'

import { useState, useEffect, useCallback } from 'react'
import { GlobalStats, getGlobalStats, getStats, getRecentActivities } from '@/actions/stats'
import { useQuery } from '@tanstack/react-query'

export function useStats() {
  const [stats, setStats] = useState<GlobalStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true)
      const data = await getGlobalStats()
      setStats(data)
      setError(null)
    } catch (err) {
      setError('Erreur lors du chargement des statistiques')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  return {
    stats,
    loading,
    error,
    refetch: fetchStats
  }
}

export function useStatsQuery() {
  return useQuery({
    queryKey: ['global-stats'],
    queryFn: () => getGlobalStats(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  })
}

export function useEntityStats(entity: string, filters?: any) {
  return useQuery({
    queryKey: ['entity-stats', entity, filters],
    queryFn: () => getStats({ entity, ...filters }),
    staleTime: 3 * 60 * 1000, // 3 minutes
  })
}

export function useRecentActivities(limit?: number) {
  return useQuery({
    queryKey: ['recent-activities', limit],
    queryFn: () => getRecentActivities(limit),
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}