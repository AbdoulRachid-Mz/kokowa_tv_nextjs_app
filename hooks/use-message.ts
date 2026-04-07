'use client'

import { useMutation, useQuery, useQueryClient, useInfiniteQuery } from '@tanstack/react-query'
import { useAuthContext } from '@/contexts/auth-context'
import {
  createMessage,
  deleteMessage,
  getMessages,
  getMessageById,
  updateMessage,
  markMessageAsRead,
  likeMessage,
  getMessageReplies,
  getConversation,
  getUnreadMessagesCount,
} from '@/actions/messages'
import { toast } from 'sonner'
import { Message, MessageFilters } from '@/types'

// Query key factory
const messageKeys = {
  all: ['messages'] as const,
  lists: () => [...messageKeys.all, 'list'] as const,
  list: (filters: MessageFilters) => [...messageKeys.lists(), filters] as const,
  details: () => [...messageKeys.all, 'detail'] as const,
  detail: (id: number) => [...messageKeys.details(), id] as const,
  replies: (parentId: number) => [...messageKeys.all, 'replies', parentId] as const,
  conversation: (user1Id: number, user2Id: number) => [...messageKeys.all, 'conversation', user1Id, user2Id] as const,
  unread: (userId: number) => [...messageKeys.all, 'unread', userId] as const,
}

export function useMessages(filters: MessageFilters = {}) {
  const queryClient = useQueryClient()

  return useInfiniteQuery({
    queryKey: messageKeys.list(filters),
    queryFn: ({ pageParam = 1 }) => getMessages({ ...filters, page: pageParam }),
    getNextPageParam: (lastPage, allPages) => {
      const nextPage = allPages.length + 1
      return nextPage <= lastPage.pagination.totalPages ? nextPage : undefined
    },
    initialPageParam: 1,
    staleTime: 1000 * 30, // 30 seconds
  })
}

export function useMessage(id: number) {
  return useQuery({
    queryKey: messageKeys.detail(id),
    queryFn: () => getMessageById(id, { with_relations: true }),
    staleTime: 1000 * 60, // 1 minute
    enabled: !!id,
  })
}

export function useCreateMessage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createMessage,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: messageKeys.lists() })
      toast.success(data.message)
    },
    onError: (error: Error) => {
      toast.error(`Erreur : ${error.message}`)
    },
  })
}

export function useUpdateMessage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, formData }: { id: number; formData: FormData }) => updateMessage(id, formData),
    onSuccess: (data, { id }) => {
      queryClient.invalidateQueries({ queryKey: messageKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: messageKeys.lists() })
      toast.success(data.message)
    },
    onError: (error: Error) => {
      toast.error(`Erreur : ${error.message}`)
    },
  })
}

export function useDeleteMessage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteMessage,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: messageKeys.lists() })
      toast.success(data.message)
    },
    onError: (error: Error) => {
      toast.error(`Erreur : ${error.message}`)
    },
  })
}

export function useMarkMessageAsRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: markMessageAsRead,
    onSuccess: (data, id) => {
      queryClient.invalidateQueries({ queryKey: messageKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: messageKeys.lists() })
      toast.success(data.message)
    },
    onError: (error: Error) => {
      toast.error(`Erreur : ${error.message}`)
    },
  })
}

export function useLikeMessage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: likeMessage,
    onSuccess: (data, id) => {
      queryClient.invalidateQueries({ queryKey: messageKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: messageKeys.lists() })
      toast.success(data.message)
    },
    onError: (error: Error) => {
      toast.error(`Erreur : ${error.message}`)
    },
  })
}

export function useMessageReplies(parentMessageId: number, filters: Omit<MessageFilters, 'parent_message_id'> = {}) {
  return useQuery({
    queryKey: messageKeys.replies(parentMessageId),
    queryFn: () => getMessageReplies(parentMessageId, filters),
    enabled: !!parentMessageId,
    staleTime: 1000 * 30, // 30 seconds
  })
}

export function useConversation(user1Id: number, user2Id: number, filters: Omit<MessageFilters, 'author_id' | 'recipient_id'> = {}) {
  return useQuery({
    queryKey: messageKeys.conversation(user1Id, user2Id),
    queryFn: () => getConversation(user1Id, user2Id, filters),
    enabled: !!user1Id && !!user2Id,
    staleTime: 1000 * 30, // 30 seconds
  })
}

export function useUnreadMessagesCount(userId: number) {
  return useQuery({
    queryKey: messageKeys.unread(userId),
    queryFn: () => getUnreadMessagesCount(userId),
    enabled: !!userId,
    // refetchInterval: 1000 * 30, // 30 seconds
    refetchInterval: false, // 30 seconds
  })
}

// Hook for sending a direct message with optimistic UI
export function useSendDirectMessage() {
  const { user } = useAuthContext()
  const queryClient = useQueryClient()
  const userId = user?.userDocument?.id

  return useMutation({
    mutationFn: async ({
      recipientId,
      content,
      images,
      video_url,
      audio_url,
    }: {
      recipientId: number
      content: string
      images?: string[]
      video_url?: string
      audio_url?: string
    }) => {
      if (!userId) throw new Error('Non authentifié')

      const formData = new FormData()
      formData.append('content', content)
      formData.append('message_type', 'direct_message')
      formData.append('author_id', String(userId))
      formData.append('recipient_id', String(recipientId))
      if (images) formData.append('images', JSON.stringify(images))
      if (video_url) formData.append('video_url', video_url)
      if (audio_url) formData.append('audio_url', audio_url)

      return createMessage(formData)
    },
    onMutate: async ({ recipientId, content }) => {
      await queryClient.cancelQueries({ queryKey: messageKeys.conversation(userId!, recipientId) })

      const previous = queryClient.getQueryData<Message[]>(messageKeys.conversation(userId!, recipientId))

      const optimisticMessage: Message = {
        id: Date.now(),
        content,
        message_type: 'direct_message',
        author_id: userId!,
        recipient_id: recipientId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_read: false,
        is_active: true,
        is_deleted: false,
        like_count: 0,
      }

      queryClient.setQueryData<Message[]>(messageKeys.conversation(userId!, recipientId), (old) => [
        ...(old || []),
        optimisticMessage,
      ])

      return { previous }
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(messageKeys.conversation(userId!, variables.recipientId), context?.previous)
      toast.error(`Erreur : ${err instanceof Error ? err.message : 'Envoi échoué'}`)
    },
    onSettled: (_data, _error, { recipientId }) => {
      queryClient.invalidateQueries({ queryKey: messageKeys.conversation(userId!, recipientId) })
      queryClient.invalidateQueries({ queryKey: messageKeys.unread(userId!) })
    },
  })
}

// Hook for posting a comment on an entity (match, competition, etc.)
export function usePostComment() {
  const { user } = useAuthContext()
  const queryClient = useQueryClient()
  const userId = user?.userDocument?.id

  return useMutation({
    mutationFn: async ({
      entityType,
      entityId,
      content,
      parentMessageId,
      images,
      video_url,
      audio_url,
    }: {
      entityType: string
      entityId: number
      content: string
      parentMessageId?: number
      images?: string[]
      video_url?: string
      audio_url?: string
    }) => {
      if (!userId) throw new Error('Non authentifié')

      const formData = new FormData()
      formData.append('content', content)
      formData.append('message_type', 'comment')
      formData.append('entity_type', entityType)
      formData.append('entity_id', String(entityId))
      formData.append('author_id', String(userId))
      if (parentMessageId) formData.append('parent_message_id', String(parentMessageId))
      if (images) formData.append('images', JSON.stringify(images))
      if (video_url) formData.append('video_url', video_url)
      if (audio_url) formData.append('audio_url', audio_url)

      return createMessage(formData)
    },
    onMutate: async ({ entityType, entityId, content, parentMessageId }) => {
      const listKey = messageKeys.list({ entity_type: entityType, entity_id: entityId })
      await queryClient.cancelQueries({ queryKey: listKey })

      const previous = queryClient.getQueryData(messageKeys.list({ entity_type: entityType, entity_id: entityId }))

      const optimisticMessage: Message = {
        id: Date.now(),
        content,
        message_type: 'comment',
        entity_type: entityType as Message['entity_type'],
        entity_id: entityId,
        author_id: userId!,
        parent_message_id: parentMessageId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_read: false,
        is_active: true,
        is_deleted: false,
        like_count: 0,
      }

      queryClient.setQueryData(messageKeys.list({ entity_type: entityType, entity_id: entityId }), (old: any) => ({
        ...old,
        data: [optimisticMessage, ...(old?.data || [])],
      }))

      return { previous }
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(
        messageKeys.list({ entity_type: variables.entityType, entity_id: variables.entityId }),
        context?.previous
      )
      toast.error(`Erreur : ${err instanceof Error ? err.message : 'Commentaire échoué'}`)
    },
    onSettled: (_data, _error, { entityType, entityId }) => {
      queryClient.invalidateQueries({ queryKey: messageKeys.list({ entity_type: entityType, entity_id: entityId }) })
    },
  })
}
