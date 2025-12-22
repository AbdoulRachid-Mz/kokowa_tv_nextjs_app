'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuthContext } from '@/contexts/auth-context'
import { createInteraction, deleteInteraction, getEntityInteractions, getUserInteractions } from '@/actions/interactions'
import { toast } from 'sonner'
import { Interaction, InteractionFilters } from '@/types'

export function useInteractions(entityType: string, entityId: number) {
  const { user } = useAuthContext()
  const queryClient = useQueryClient()
  const userId = user?.userDocument?.id

  // Query key factory
  const interactionKeys = {
    all: ['interactions'] as const,
    user: (userId: number) => [...interactionKeys.all, 'user', userId] as const,
    entity: (type: string, id: number) => [...interactionKeys.all, 'entity', type, id] as const,
    userEntity: (userId: number, type: string, id: number) => 
      [...interactionKeys.user(userId), 'entity', type, id] as const,
  }

  // Fetch user interactions for this entity
  const { data: userInteractions, isLoading } = useQuery({
    queryKey: interactionKeys.userEntity(userId!, entityType, entityId),
    queryFn: async () => {
      if (!userId) return []
      const res = await getUserInteractions(userId, {
        entity_type: entityType,
        entity_id: entityId,
      })
      return res.data
    },
    enabled: !!userId,
    staleTime: 1000 * 60, // 1 minute
  })

  // Derive local state from cached data
  const liked = userInteractions?.some(i => i.interaction_type === 'like') ?? false
  const bookmarked = userInteractions?.some(i => i.interaction_type === 'bookmark') ?? false
  const followed = userInteractions?.some(i => i.interaction_type === 'follow') ?? false

  // Optimistic mutation helper
  const buildMutation = (type: Interaction['interaction_type']) => {
    return useMutation({
      mutationFn: async () => {
        if (!userId) throw new Error('Non authentifié')

        const existing = userInteractions?.find(i => i.interaction_type === type)

        if (existing) {
          await deleteInteraction(existing.id)
        } else {
          const formData = new FormData()
          formData.append('user_id', String(userId))
          formData.append('entity_type', entityType)
          formData.append('entity_id', String(entityId))
          formData.append('interaction_type', type)
          await createInteraction(formData)
        }
      },
      onMutate: async () => {
        await queryClient.cancelQueries({ queryKey: interactionKeys.userEntity(userId!, entityType, entityId) })
        const previous = queryClient.getQueryData<Interaction[]>(interactionKeys.userEntity(userId!, entityType, entityId))
        
        // Optimistically toggle
        queryClient.setQueryData<Interaction[]>(
          interactionKeys.userEntity(userId!, entityType, entityId),
          old => {
            if (!old) return []
            const exists = old.find(i => i.interaction_type === type)
            if (exists) {
              return old.filter(i => i.id !== exists.id)
            } else {
              return [...old, { id: Date.now(), user_id: userId, entity_type: entityType, entity_id: entityId, interaction_type: type, created_at: new Date().toISOString() } as Interaction]
            }
          }
        )
        return { previous }
      },
      onError: (err, _, context) => {
        queryClient.setQueryData(interactionKeys.userEntity(userId!, entityType, entityId), context?.previous)
        toast.error(`Erreur : ${err instanceof Error ? err.message : 'Action échouée'}`)
      },
      onSettled: () => {
        queryClient.invalidateQueries({ queryKey: interactionKeys.userEntity(userId!, entityType, entityId) })
        queryClient.invalidateQueries({ queryKey: interactionKeys.entity(entityType, entityId) })
      },
    })
  }

  // Interaction mutations
  const likeMutation = buildMutation('like')
  const bookmarkMutation = buildMutation('bookmark')
  const followMutation = buildMutation('follow')

  const handleLike = () => {
    if (!userId) {
      toast.error('Connectez-vous pour liker')
      return
    }
    likeMutation.mutate()
  }

  const handleBookmark = () => {
    if (!userId) {
      toast.error('Connectez-vous pour sauvegarder')
      return
    }
    bookmarkMutation.mutate()
  }

  const handleFollow = () => {
    if (!userId) {
      toast.error('Connectez-vous pour suivre')
      return
    }
    followMutation.mutate()
  }

  const handleShare = (platform: 'facebook' | 'twitter' | 'linkedin' | 'whatsapp' | 'copy') => {
    const url = window.location.href
    const title = document.title

    switch (platform) {
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank')
        break
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`, '_blank')
        break
      case 'linkedin':
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank')
        break
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`, '_blank')
        break
      case 'copy':
        navigator.clipboard.writeText(url)
        toast.success('Lien copié dans le presse-papier')
        break
    }
  }

  

  const loading = likeMutation.isPending || bookmarkMutation.isPending || followMutation.isPending

  return {
    liked,
    bookmarked,
    followed,
    loading,
    handleLike,
    handleBookmark,
    handleFollow,
    handleShare,
    isAuthenticated: !!user,
  }
}

// New hook to fetch all interactions for a given entity
export function useEntityInteractions(entityType: string, entityId: number) {
  const queryClient = useQueryClient()

  // Re-use the same key factory
  const interactionKeys = {
    all: ['interactions'] as const,
    entity: (type: string, id: number) => [...interactionKeys.all, 'entity', type, id] as const,
  }

  return useQuery({
    queryKey: interactionKeys.entity(entityType, entityId),
    queryFn: async () => {
      const res = await getEntityInteractions(entityType, entityId)
      return res.data
    },
    staleTime: 1000 * 60, // 1 minute
  })
}


// Hook wrapper for getUserInteractions
export function useUserInteractions(userId: number, filters: Omit<InteractionFilters, 'user_id'> = {}) {
  return useQuery({
    queryKey: ['interactions', 'user', userId, filters],
    queryFn: async () => {
      const res = await getUserInteractions(userId, filters)
      return res.data
    },
    enabled: !!userId,
    staleTime: 1000 * 60, // 1 minute
  })
}

// Hook wrapper for getEntityInteractions
export function useEntityInteractionsWithFilters(
  entityType: string,
  entityId: number,
  filters: Omit<InteractionFilters, 'entity_type' | 'entity_id'> = {}
) {
  return useQuery({
    queryKey: ['interactions', 'entity', entityType, entityId, filters],
    queryFn: async () => {
      const res = await getEntityInteractions(entityType, entityId, filters)
      return res.data
    },
    staleTime: 1000 * 60, // 1 minute
  })
}


