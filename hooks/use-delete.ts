// @/hooks/use-delete.ts
'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'
import { deleteCompetition } from '@/actions/competitions'
import { deleteRegion } from '@/actions/regions'
import { useRouter } from 'next/navigation'

// Types d'entités supportées
export type DeleteEntityType = 
  | 'region' 
  | 'competition' 
  | 'fighter' 
  | 'coach' 
  | 'referee'
  | 'article'
  | 'video'
  | 'match'
  | 'phase'
  | 'phase-group'
  | 'sub-group'
  | 'edition'
  | 'transfer'
  | 'team-member'

// Options de suppression
export interface DeleteOptions {
  entityType: DeleteEntityType
  entityId: number
  entityName?: string
  redirectPath?: string
  invalidateQueries?: string[]
  onSuccess?: () => void
  onError?: (error: Error) => void
  confirmMessage?: string
  successMessage?: string
  errorMessage?: string
}

// Actions de suppression par type d'entité
const deleteActions: Record<DeleteEntityType, (id: number) => Promise<any>> = {
  region: deleteRegion,
  competition: deleteCompetition,
  fighter: async (id) => {
    const { deleteFighter } = await import('@/actions/fighters')
    return deleteFighter(id)
  },
  coach: async (id) => {
    const { deleteCoach } = await import('@/actions/coaches')
    return deleteCoach(id)
  },
  referee: async (id) => {
    const { deleteReferee } = await import('@/actions/referees')
    return deleteReferee(id)
  },
  article: async (id) => {
    const { deleteArticle } = await import('@/actions/articles')
    return deleteArticle(id)
  },
  video: async (id) => {
    const { deleteVideo } = await import('@/actions/videos')
    return deleteVideo(id)
  },
  match: async (id) => {
    const { deleteMatch } = await import('@/actions/matches')
    return deleteMatch(id)
  },
  phase: async (id) => {
    const { deletePhase } = await import('@/actions/phases')
    return deletePhase(id)
  },
  'phase-group': async (id) => {
    const { deletePhaseGroup } = await import('@/actions/phase-groups')
    return deletePhaseGroup(id)
  },
  'sub-group': async (id) => {
    const { deleteSubGroup } = await import('@/actions/sub-groups')
    return deleteSubGroup(id)
  },
  edition: async (id) => {
    const { deleteEdition } = await import('@/actions/editions')
    return deleteEdition(id)
  },
  transfer: async (id) => {
    const { deleteFighterTransfer } = await import('@/actions/fighter-transfers')
    return deleteFighterTransfer(id)
  },
  'team-member': async (id) => {
    const { deleteTeamMember } = await import('@/actions/teams')
    return deleteTeamMember(id)
  },
}

export function useDelete(options: DeleteOptions) {
  const {
    entityType,
    entityId,
    entityName = 'cet élément',
    redirectPath,
    invalidateQueries = [],
    onSuccess,
    onError,
    confirmMessage,
    successMessage,
    errorMessage,
  } = options

  const [isConfirming, setIsConfirming] = useState(false)
  const queryClient = useQueryClient()
  const router = useRouter()

  // Déterminer les messages
  const finalConfirmMessage = confirmMessage || 
    `Êtes-vous sûr de vouloir supprimer "${entityName}" ? Cette action est irréversible.`
  
  const finalSuccessMessage = successMessage || 
    `"${entityName}" a été supprimé avec succès.`
  
  const finalErrorMessage = errorMessage || 
    `Une erreur est survenue lors de la suppression.`

  // Mutation pour la suppression
  const deleteMutation = useMutation({
    mutationFn: async () => {
      const deleteAction = deleteActions[entityType]
      if (!deleteAction) {
        throw new Error(`Type d'entité non supporté: ${entityType}`)
      }
      return await deleteAction(entityId)
    },
    onSuccess: async () => {
      toast.success(finalSuccessMessage)
      
      // Invalider les requêtes spécifiées
      if (invalidateQueries.length > 0) {
        invalidateQueries.forEach(queryKey => {
          queryClient.invalidateQueries({ queryKey: [queryKey] })
        })
      }
      
      // Invalider les queries par défaut selon le type d'entité
      queryClient.invalidateQueries({ queryKey: [entityType + 's'] })
      queryClient.invalidateQueries({ queryKey: [entityType, entityId] })
      
      // Exécuter le callback onSuccess
      onSuccess?.()
      
      // Redirection si spécifiée
      if (redirectPath) {
        router.push(redirectPath)
        router.refresh()
      }
    },
    onError: (error: Error) => {
      toast.error(`${finalErrorMessage}: ${error.message}`)
      onError?.(error)
    },
  })

  // Fonctions publiques
  const handleDelete = () => {
    setIsConfirming(true)
  }

  const confirmDelete = () => {
    deleteMutation.mutate()
    setIsConfirming(false)
  }

  const cancelDelete = () => {
    setIsConfirming(false)
  }

  return {
    isConfirming,
    isLoading: deleteMutation.isPending,
    handleDelete,
    confirmDelete,
    cancelDelete,
    isError: deleteMutation.isError,
    error: deleteMutation.error,
  }
}