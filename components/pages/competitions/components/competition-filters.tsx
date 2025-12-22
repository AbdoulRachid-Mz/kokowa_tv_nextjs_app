// components/competitions/components/competition-filters.tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { 
  Calendar,
  MapPin,
  Filter,
  X
} from 'lucide-react'

interface CompetitionFiltersProps {
  filters: any
  onFilterChange: (filters: any) => void
}

export function CompetitionFilters({ filters, onFilterChange }: CompetitionFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const handleYearChange = (value: string) => {
    onFilterChange({ ...filters, edition_year: value || undefined })
  }

  const handleRegionChange = (value: string) => {
    onFilterChange({ ...filters, region_id: value || undefined })
  }

  const handleSortChange = (value: string) => {
    const [sortBy, sortOrder] = value.split('-')
    onFilterChange({ ...filters, sortBy, sortOrder })
  }

  const resetFilters = () => {
    onFilterChange({
      page: 1,
      limit: filters.limit,
      search: filters.search,
    })
    setIsExpanded(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          <Label>Filtres avancés</Label>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? 'Réduire' : 'Étendre'}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={resetFilters}
            className="text-destructive hover:text-destructive"
          >
            <X className="h-4 w-4 mr-1" />
            Réinitialiser
          </Button>
        </div>
      </div>

      {isExpanded && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg bg-card">
          {/* Year Filter */}
          <div className="space-y-2">
            <Label htmlFor="year">
              <Calendar className="h-4 w-4 inline mr-2" />
              Année d'édition
            </Label>
            <Select onValueChange={handleYearChange} value={filters.edition_year || ''}>
              <SelectTrigger>
                <SelectValue placeholder="Toutes les années" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Toutes les années</SelectItem>
                {Array.from({ length: 10 }, (_, i) => {
                  const year = new Date().getFullYear() - i
                  return (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Region Filter */}
          <div className="space-y-2">
            <Label htmlFor="region">
              <MapPin className="h-4 w-4 inline mr-2" />
              Région
            </Label>
            <Select onValueChange={handleRegionChange} value={filters.region_id || ''}>
              <SelectTrigger>
                <SelectValue placeholder="Toutes les régions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Toutes les régions</SelectItem>
                {/* Regions would be fetched from API */}
                <SelectItem value="1">Dakar</SelectItem>
                <SelectItem value="2">Thiès</SelectItem>
                <SelectItem value="3">Saint-Louis</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Sort Filter */}
          <div className="space-y-2">
            <Label htmlFor="sort">
              Trier par
            </Label>
            <Select onValueChange={handleSortChange} value={`${filters.sortBy || 'created_at'}-${filters.sortOrder || 'desc'}`}>
              <SelectTrigger>
                <SelectValue placeholder="Trier par" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_at-desc">Plus récent</SelectItem>
                <SelectItem value="created_at-asc">Plus ancien</SelectItem>
                <SelectItem value="name-asc">Nom (A-Z)</SelectItem>
                <SelectItem value="name-desc">Nom (Z-A)</SelectItem>
                <SelectItem value="status-asc">Statut</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
    </div>
  )
}