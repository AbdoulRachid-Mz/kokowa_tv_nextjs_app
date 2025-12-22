// components/fighters/sections/fighters-filters.tsx
'use client'

import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Search, 
  Filter, 
  SlidersHorizontal, 
  X, 
  SortAsc,
  MapPin,
  Trophy,
  User,
  Calendar
} from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useQuery } from '@tanstack/react-query'
import { getRegions } from '@/actions/regions'
import { Skeleton } from '@/components/ui/skeleton'

interface FightersFiltersProps {
  search: string
  setSearch: (value: string) => void
  regionFilter: string
  setRegionFilter: (value: string) => void
  statusFilter: string
  setStatusFilter: (value: string) => void
  sortBy: string
  setSortBy: (value: string) => void
  count: number
  isLoading: boolean
}

export function FightersFilters({
  search,
  setSearch,
  regionFilter,
  setRegionFilter,
  statusFilter,
  setStatusFilter,
  sortBy,
  setSortBy,
  count,
  isLoading
}: FightersFiltersProps) {
  const { data: regions } = useQuery({
    queryKey: ['regions'],
    queryFn: async () => {
      const response = await getRegions({ limit: 100 })
      return response.data || []
    }
  })

  const handleClearFilters = () => {
    setSearch('')
    setRegionFilter('all')
    setStatusFilter('all')
    setSortBy('ranking')
  }

  const hasActiveFilters = search || regionFilter !== 'all' || statusFilter !== 'all'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto px-4"
    >
      <div className="bg-card/50 backdrop-blur-sm border rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-lg font-semibold">Tous les Lutteurs</h3>
            {!isLoading ? (
              <p className="text-sm text-muted-foreground">
                {count} lutteur{count !== 1 ? 's' : ''} trouvé{count !== 1 ? 's' : ''}
              </p>
            ) : (
              <Skeleton className="h-4 w-32" />
            )}
          </div>

          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
                className="gap-2"
              >
                <X className="h-4 w-4" />
                Effacer les filtres
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Recherche */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Nom, surnom..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filtre par région */}
          <div>
            <Select value={regionFilter} onValueChange={setRegionFilter}>
              <SelectTrigger>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <SelectValue placeholder="Toutes les régions" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les régions</SelectItem>
                {regions?.map((region) => (
                  <SelectItem key={region.id} value={region.id.toString()}>
                    {region.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Filtre par statut */}
          <div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <SelectValue placeholder="Tous les statuts" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="active">Actifs uniquement</SelectItem>
                <SelectItem value="champion">Champions uniquement</SelectItem>
                <SelectItem value="inactive">Inactifs</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tri */}
          <div>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <div className="flex items-center gap-2">
                  <SortAsc className="h-4 w-4" />
                  <SelectValue placeholder="Trier par" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ranking">Classement</SelectItem>
                <SelectItem value="name">Nom</SelectItem>
                <SelectItem value="weight">Poids</SelectItem>
                <SelectItem value="debut">Année de début</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Badges des filtres actifs */}
        {hasActiveFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            transition={{ duration: 0.3 }}
            className="mt-4 pt-4 border-t"
          >
            <div className="flex flex-wrap gap-2">
              {search && (
                <Badge variant="secondary" className="gap-1">
                  Recherche: "{search}"
                  <button
                    onClick={() => setSearch('')}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {regionFilter !== 'all' && regions && (
                <Badge variant="secondary" className="gap-1">
                  Région: {regions.find(r => r.id.toString() === regionFilter)?.name}
                  <button
                    onClick={() => setRegionFilter('all')}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {statusFilter !== 'all' && (
                <Badge variant="secondary" className="gap-1">
                  Statut: {
                    statusFilter === 'active' ? 'Actifs' :
                    statusFilter === 'champion' ? 'Champions' : 'Inactifs'
                  }
                  <button
                    onClick={() => setStatusFilter('all')}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}