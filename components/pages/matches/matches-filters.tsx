// components/matches/matches-filters.tsx
'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Typography } from '@/components/ui/typography'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Calendar as CalendarIcon, Filter, X, ChevronDown, ChevronUp } from 'lucide-react'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Badge } from '@/components/ui/badge'

interface MatchesFiltersProps {
  editions: any[]
  phases: any[]
  groups: any[]
  subGroups: any[]
  statusOptions: any[]
  selectedEdition?: number
  selectedPhase?: number
  selectedGroup?: number
  selectedSubGroup?: number
  selectedStatus?: string
  dateRange: { from?: string; to?: string }
  loading: boolean
  handleEditionChange: (value: number | undefined) => void
  handlePhaseChange: (value: number | undefined) => void
  handleGroupChange: (value: number | undefined) => void
  handleSubGroupChange: (value: number | undefined) => void
  handleStatusChange: (value: string | undefined) => void
  handleDateRangeChange: (range: { from?: string; to?: string }) => void
  resetAll: () => void
  hasFilters: boolean
}

export function MatchesFilters({
  editions,
  phases,
  groups,
  subGroups,
  statusOptions,
  selectedEdition,
  selectedPhase,
  selectedGroup,
  selectedSubGroup,
  selectedStatus,
  dateRange,
  loading,
  handleEditionChange,
  handlePhaseChange,
  handleGroupChange,
  handleSubGroupChange,
  handleStatusChange,
  handleDateRangeChange,
  resetAll,
  hasFilters
}: MatchesFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(true)

  const getEditionName = (id?: number) => {
    if (!id) return undefined
    const edition = editions.find(e => e.id === id)
    return edition ? `${edition.competition?.name} - Édition ${edition.edition_number}` : undefined
  }

  const getPhaseName = (id?: number) => {
    if (!id) return undefined
    const phase = phases.find(p => p.id === id)
    return phase?.name
  }

  const getGroupName = (id?: number) => {
    if (!id) return undefined
    const group = groups.find(g => g.id === id)
    return group?.name
  }

  const getSubGroupName = (id?: number) => {
    if (!id) return undefined
    const subGroup = subGroups.find(s => s.id === id)
    return subGroup?.name
  }

  return (
    <motion.div
      layout
      className="bg-card rounded-xl border p-6 sticky top-6"
    >
      {/* Header des filtres */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Filter className="h-5 w-5 text-muted-foreground" />
          <Typography variant="h5" weight="medium">
            Filtres
          </Typography>
          {hasFilters && (
            <Badge variant="secondary" className="animate-pulse">
              Actifs
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={resetAll}
              className="h-8 w-8 p-0"
              title="Réinitialiser tous les filtres"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-8 w-8 p-0"
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-6"
          >
            {/* Filtre par édition */}
            <div className="space-y-3">
              <Typography variant="body-sm" weight="medium">
                Édition
              </Typography>
              <Select
                value={selectedEdition?.toString()}
                onValueChange={(value) => handleEditionChange(value ? parseInt(value) : undefined)}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Toutes les éditions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les éditions</SelectItem>
                  {editions.map(edition => (
                    <SelectItem key={edition.id} value={edition.id.toString()}>
                      {edition.competition?.name} - Édition {edition.edition_number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filtre par phase */}
            <div className="space-y-3">
              <Typography variant="body-sm" weight="medium">
                Phase
              </Typography>
              <Select
                value={selectedPhase?.toString()}
                onValueChange={(value) => handlePhaseChange(value ? parseInt(value) : undefined)}
                disabled={loading || !selectedEdition}
              >
                <SelectTrigger>
                  <SelectValue placeholder={selectedEdition ? "Toutes les phases" : "Sélectionnez d'abord une édition"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les phases</SelectItem>
                  {phases.map(phase => (
                    <SelectItem key={phase.id} value={phase.id.toString()}>
                      {phase.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filtre par groupe */}
            <div className="space-y-3">
              <Typography variant="body-sm" weight="medium">
                Groupe
              </Typography>
              <Select
                value={selectedGroup?.toString()}
                onValueChange={(value) => handleGroupChange(value ? parseInt(value) : undefined)}
                disabled={loading || !selectedPhase}
              >
                <SelectTrigger>
                  <SelectValue placeholder={selectedPhase ? "Tous les groupes" : "Sélectionnez d'abord une phase"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les groupes</SelectItem>
                  {groups.map(group => (
                    <SelectItem key={group.id} value={group.id.toString()}>
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filtre par sous-groupe (rencontre) */}
            <div className="space-y-3">
              <Typography variant="body-sm" weight="medium">
                Rencontre
              </Typography>
              <Select
                value={selectedSubGroup?.toString()}
                onValueChange={(value) => handleSubGroupChange(value ? parseInt(value) : undefined)}
                disabled={loading || !selectedGroup}
              >
                <SelectTrigger>
                  <SelectValue placeholder={selectedGroup ? "Toutes les rencontres" : "Sélectionnez d'abord un groupe"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les rencontres</SelectItem>
                  {subGroups.map(subGroup => (
                    <SelectItem key={subGroup.id} value={subGroup.id.toString()}>
                      {subGroup.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filtre par statut */}
            <div className="space-y-3">
              <Typography variant="body-sm" weight="medium">
                Statut
              </Typography>
              <Select
                value={selectedStatus}
                onValueChange={handleStatusChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tous les statuts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  {statusOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <div className={`h-2 w-2 rounded-full ${option.color.split(' ')[0]}`} />
                        {option.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filtre par date */}
            <div className="space-y-3">
              <Typography variant="body-sm" weight="medium">
                Date
              </Typography>
              <div className="space-y-3">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange.from ? (
                        format(new Date(dateRange.from), 'PPP', { locale: fr })
                      ) : (
                        'Du'
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dateRange.from ? new Date(dateRange.from) : undefined}
                      onSelect={(date) => handleDateRangeChange({ 
                        from: date ? format(date, 'yyyy-MM-dd') : undefined,
                        to: dateRange.to 
                      })}
                      locale={fr}
                    />
                  </PopoverContent>
                </Popover>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange.to ? (
                        format(new Date(dateRange.to), 'PPP', { locale: fr })
                      ) : (
                        'Au'
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dateRange.to ? new Date(dateRange.to) : undefined}
                      onSelect={(date) => handleDateRangeChange({ 
                        from: dateRange.from,
                        to: date ? format(date, 'yyyy-MM-dd') : undefined
                      })}
                      locale={fr}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Filtres actifs */}
            {hasFilters && (
              <div className="pt-4 border-t">
                <Typography variant="body-sm" weight="medium" className="mb-3">
                  Filtres actifs
                </Typography>
                <div className="flex flex-wrap gap-2">
                  {selectedEdition && (
                    <Badge variant="secondary" className="gap-1">
                      Édition: {getEditionName(selectedEdition)}
                      <X 
                        className="h-3 w-3 cursor-pointer" 
                        onClick={() => handleEditionChange(undefined)}
                      />
                    </Badge>
                  )}
                  {selectedPhase && (
                    <Badge variant="secondary" className="gap-1">
                      Phase: {getPhaseName(selectedPhase)}
                      <X 
                        className="h-3 w-3 cursor-pointer" 
                        onClick={() => handlePhaseChange(undefined)}
                      />
                    </Badge>
                  )}
                  {selectedGroup && (
                    <Badge variant="secondary" className="gap-1">
                      Groupe: {getGroupName(selectedGroup)}
                      <X 
                        className="h-3 w-3 cursor-pointer" 
                        onClick={() => handleGroupChange(undefined)}
                      />
                    </Badge>
                  )}
                  {selectedSubGroup && (
                    <Badge variant="secondary" className="gap-1">
                      Rencontre: {getSubGroupName(selectedSubGroup)}
                      <X 
                        className="h-3 w-3 cursor-pointer" 
                        onClick={() => handleSubGroupChange(undefined)}
                      />
                    </Badge>
                  )}
                  {selectedStatus && (
                    <Badge variant="secondary" className="gap-1">
                      Statut: {statusOptions.find(s => s.value === selectedStatus)?.label}
                      <X 
                        className="h-3 w-3 cursor-pointer" 
                        onClick={() => handleStatusChange(undefined)}
                      />
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}