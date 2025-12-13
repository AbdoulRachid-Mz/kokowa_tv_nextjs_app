// hooks/use-match-filters.ts
'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { CompetitionEdition, Phase, PhaseGroup, SubGroup } from '@/types'
import { useEntityList } from './use-entity-list'

interface UseMatchFiltersProps {
  initialEditionId?: number
  initialPhaseId?: number
  initialGroupId?: number
}

export function useMatchFilters({
  initialEditionId,
  initialPhaseId,
  initialGroupId
}: UseMatchFiltersProps = {}) {
  // États pour les sélections
  const [selectedEdition, setSelectedEdition] = useState<number | undefined>(initialEditionId)
  const [selectedPhase, setSelectedPhase] = useState<number | undefined>(initialPhaseId)
  const [selectedGroup, setSelectedGroup] = useState<number | undefined>(initialGroupId)
  const [selectedSubGroup, setSelectedSubGroup] = useState<number | undefined>()
  const [selectedStatus, setSelectedStatus] = useState<string | undefined>()
  const [dateRange, setDateRange] = useState<{ from?: string; to?: string }>({})

  // Fetch des données pour les filtres avec des paramètres optimisés
  const {
    data: editions,
    loading: loadingEditions,
    refetch: refetchEditions
  } = useEntityList<CompetitionEdition>({
    entityType: 'editions',
    defaultFilters: { 
      with_competition: true, 
      is_active: true,
      limit: 100,
      page: 1
    },
    defaultLimit: 100
  })

  const {
    data: phases,
    loading: loadingPhases,
    refetch: refetchPhases
  } = useEntityList<Phase>({
    entityType: 'phases',
    defaultFilters: { 
      edition_id: selectedEdition,
      limit: 100,
      page: 1
    },
    defaultLimit: 100,
    autoFetch: !!selectedEdition,
  })

  const {
    data: groups,
    loading: loadingGroups,
    refetch: refetchGroups
  } = useEntityList<PhaseGroup>({
    entityType: 'phase-groups',
    defaultFilters: { 
      phase_id: selectedPhase,
      limit: 100,
      page: 1
    },
    defaultLimit: 100,
    autoFetch: !!selectedPhase,
  })

  const {
    data: subGroups,
    loading: loadingSubGroups,
    refetch: refetchSubGroups
  } = useEntityList<SubGroup>({
    entityType: 'sub-groups',
    defaultFilters: { 
      group_id: selectedGroup,
      limit: 100,
      page: 1
    },
    defaultLimit: 100,
    autoFetch: !!selectedGroup,
  })

  // Réinitialiser les dépendances quand un niveau change
  useEffect(() => {
    if (!selectedEdition) {
      setSelectedPhase(undefined)
      setSelectedGroup(undefined)
      setSelectedSubGroup(undefined)
    }
  }, [selectedEdition])

  useEffect(() => {
    if (!selectedPhase) {
      setSelectedGroup(undefined)
      setSelectedSubGroup(undefined)
    }
  }, [selectedPhase])

  useEffect(() => {
    if (!selectedGroup) {
      setSelectedSubGroup(undefined)
    }
  }, [selectedGroup])

  // Gestionnaires de changement stabilisés
  const handleEditionChange = useCallback((editionId: number | undefined) => {
    setSelectedEdition(editionId)
    // Ne pas réinitialiser immédiatement, laisser les useEffect s'en charger
  }, [])

  const handlePhaseChange = useCallback((phaseId: number | undefined) => {
    setSelectedPhase(phaseId)
  }, [])

  const handleGroupChange = useCallback((groupId: number | undefined) => {
    setSelectedGroup(groupId)
  }, [])

  const handleSubGroupChange = useCallback((subGroupId: number | undefined) => {
    setSelectedSubGroup(subGroupId)
  }, [])

  const handleStatusChange = useCallback((status: string | undefined) => {
    setSelectedStatus(status)
  }, [])

  const handleDateRangeChange = useCallback((range: { from?: string; to?: string }) => {
    setDateRange(range)
  }, [])

  // Construire les filtres avec useMemo pour éviter les recalculs
  const buildFilters = useMemo(() => {
    const filters: any = {}

    if (selectedEdition) filters.edition_id = selectedEdition
    if (selectedPhase) filters.phase_id = selectedPhase
    if (selectedGroup) filters.group_id = selectedGroup
    if (selectedSubGroup) filters.sub_group_id = selectedSubGroup
    if (selectedStatus) filters.status = selectedStatus
    if (dateRange.from) filters.date_from = dateRange.from
    if (dateRange.to) filters.date_to = dateRange.to

    // Ajouter des paramètres par défaut pour éviter les requêtes inutiles
    filters.limit = 20
    filters.page = 1

    return filters
  }, [selectedEdition, selectedPhase, selectedGroup, selectedSubGroup, selectedStatus, dateRange.from, dateRange.to])

  // Options de statut
  const statusOptions = [
    { value: 'live', label: 'En cours', color: 'bg-red-100 text-red-800' },
    { value: 'round_break', label: 'Pause', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'scheduled', label: 'Programmé', color: 'bg-blue-100 text-blue-800' },
    { value: 'upcoming', label: 'À venir', color: 'bg-indigo-100 text-indigo-800' },
    { value: 'completed', label: 'Terminé', color: 'bg-green-100 text-green-800' },
    { value: 'postponed', label: 'Reporté', color: 'bg-orange-100 text-orange-800' },
    { value: 'cancelled', label: 'Annulé', color: 'bg-gray-100 text-gray-800' },
    { value: 'reclamation', label: 'Réclamation', color: 'bg-purple-100 text-purple-800' }
  ]

  return {
    // Sélections
    selectedEdition,
    selectedPhase,
    selectedGroup,
    selectedSubGroup,
    selectedStatus,
    dateRange,

    // Données pour les selects
    editions,
    phases,
    groups,
    subGroups,

    // Options
    statusOptions,

    // États de chargement
    loading: loadingEditions || loadingPhases || loadingGroups || loadingSubGroups,
    loadingEditions,
    loadingPhases,
    loadingGroups,
    loadingSubGroups,

    // Gestionnaires
    handleEditionChange,
    handlePhaseChange,
    handleGroupChange,
    handleSubGroupChange,
    handleStatusChange,
    handleDateRangeChange,

    // Utilitaires
    buildFilters,
    hasEdition: !!selectedEdition,
    hasPhase: !!selectedPhase,
    hasGroup: !!selectedGroup,
    hasSubGroup: !!selectedSubGroup,
    hasFilters: !!selectedEdition || !!selectedPhase || !!selectedGroup || !!selectedSubGroup || !!selectedStatus || !!dateRange.from || !!dateRange.to,

    // Reset
    resetAll: () => {
      setSelectedEdition(undefined)
      setSelectedPhase(undefined)
      setSelectedGroup(undefined)
      setSelectedSubGroup(undefined)
      setSelectedStatus(undefined)
      setDateRange({})
    }
  }
}