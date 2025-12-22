// hooks/use-article-interactions.ts
'use client'

import { useState, useCallback } from 'react'
import { useAuthContext } from '@/contexts/auth-context'
import { createInteraction, deleteInteraction } from '@/actions/interactions'
import { toast } from 'sonner'

export function useArticleInteractions(articleId: number) {
  const { user } = useAuthContext()
  const [liked, setLiked] = useState(false)
  const [bookmarked, setBookmarked] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleLike = useCallback(async () => {
    if (!user?.userDocument?.id) {
      toast.error('Connectez-vous pour liker cet article')
      return
    }

    try {
      setLoading(true)
      
      if (liked) {
        // Logique pour supprimer le like (vous devrez avoir l'ID d'interaction)
        // await deleteInteraction(interactionId)
        setLiked(false)
        toast.success('Like retiré')
      } else {
        const formData = new FormData()
        formData.append('user_id', user.userDocument.id.toString())
        formData.append('entity_type', 'article')
        formData.append('entity_id', articleId.toString())
        formData.append('interaction_type', 'like')
        
        await createInteraction(formData)
        setLiked(true)
        toast.success('Article liké !')
      }
    } catch (error) {
      console.error('Error in like interaction:', error)
      toast.error('Erreur lors du like')
    } finally {
      setLoading(false)
    }
  }, [user, articleId, liked])

  const handleBookmark = useCallback(async () => {
    if (!user?.userDocument?.id) {
      toast.error('Connectez-vous pour sauvegarder cet article')
      return
    }

    try {
      setLoading(true)
      
      if (bookmarked) {
        // Logique pour supprimer le bookmark
        // await deleteInteraction(bookmarkId)
        setBookmarked(false)
        toast.success('Article retiré des favoris')
      } else {
        const formData = new FormData()
        formData.append('user_id', user.userDocument.id.toString())
        formData.append('entity_type', 'article')
        formData.append('entity_id', articleId.toString())
        formData.append('interaction_type', 'bookmark')
        
        await createInteraction(formData)
        setBookmarked(true)
        toast.success('Article sauvegardé !')
      }
    } catch (error) {
      console.error('Error in bookmark interaction:', error)
      toast.error('Erreur lors de la sauvegarde')
    } finally {
      setLoading(false)
    }
  }, [user, articleId, bookmarked])

  const handleShare = useCallback((platform: string) => {
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
        window.open(`https://wa.me/?text=${encodeURIComponent(title + ' ' + url)}`, '_blank')
        break
      case 'copy':
        navigator.clipboard.writeText(url)
        toast.success('Lien copié dans le presse-papier')
        break
    }
  }, [])

  return {
    liked,
    bookmarked,
    loading,
    handleLike,
    handleBookmark,
    handleShare,
    isAuthenticated: !!user
  }
}