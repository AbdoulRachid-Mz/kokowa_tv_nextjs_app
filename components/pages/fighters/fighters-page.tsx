// components/fighters/fighters-page.tsx
'use client'

import { motion } from 'framer-motion'
import { FightersHeader } from './sections/fighters-header'
import { FightersGrid } from './sections/fighters-grid'
import { FightersFilters } from './sections/fighters-filters'
import { useEffect, useState } from 'react'
import { Fighter } from '@/types'
import { getMobileFighters } from '@/actions/mobile/fighters'
import { useQuery } from '@tanstack/react-query'
import { ChampionsSection } from './sections/champions-section'
import { FightersStats } from './sections/fighters-stats'
import { RegionsSection } from './sections/regions-section'
import { TrendingSection } from './sections/trending-section'

export default function FightersPage() {
  const [search, setSearch] = useState('')
  const [regionFilter, setRegionFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('ranking')

  const { data: fightersData, isLoading } = useQuery({
    queryKey: ['fighters', search, regionFilter, statusFilter, sortBy],
    queryFn: async () => {
      const result = await getMobileFighters()
      if (!result.success || !result.data) {
        throw new Error(result.error?.message || 'Erreur de chargement')
      }
      return result.data.fighters
    }
  })

  // Filtrer les données localement
  const filteredFighters = fightersData?.filter((fighter: any) => {
    // Filtre de recherche
    if (search) {
      const searchLower = search.toLowerCase()
      const fullName = `${fighter.firstName} ${fighter.lastName}`.toLowerCase()
      const nickname = fighter.nickname?.toLowerCase() || ''
      
      if (!fullName.includes(searchLower) && !nickname.includes(searchLower)) {
        return false
      }
    }

    // Filtre par région
    if (regionFilter !== 'all') {
      if (fighter.regionId !== parseInt(regionFilter)) {
        return false
      }
    }

    // Filtre par statut
    if (statusFilter !== 'all') {
      if (statusFilter === 'active' && !fighter.isActive) return false
      if (statusFilter === 'champion' && !fighter.isChampion) return false
      if (statusFilter === 'inactive' && fighter.isActive) return false
    }

    return true
  }) || []

  // Trier les données
  const sortedFighters = [...filteredFighters].sort((a: any, b: any) => {
    switch (sortBy) {
      case 'ranking':
        return a.ranking - b.ranking
      case 'name':
        return `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`)
      case 'weight':
        return (b.weight || 0) - (a.weight || 0)
      case 'debut':
        return (a.debutYear || 0) - (b.debutYear || 0)
      default:
        return 0
    }
  })

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen"
    >
      {/* Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-primary/5" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-500/10 via-transparent to-transparent" />
      </div>

      <div className="relative space-y-12 pb-20">
        <FightersHeader />
        <FightersFilters
          search={search}
          setSearch={setSearch}
          regionFilter={regionFilter}
          setRegionFilter={setRegionFilter}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          sortBy={sortBy}
          setSortBy={setSortBy}
          count={sortedFighters.length}
          isLoading={isLoading}
        />
        <FightersStats />
        <FightersGrid fighters={sortedFighters} isLoading={isLoading} />
        <ChampionsSection />
        <RegionsSection />
        <TrendingSection />
      </div>
    </motion.div>
  )
}