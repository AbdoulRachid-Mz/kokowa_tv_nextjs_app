// components/articles/article-actions.tsx
'use client'

import { Article } from '@/types'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Heart, Share2, Bookmark, MessageCircle, Printer, Copy, Facebook, Twitter, Linkedin } from 'lucide-react'
import { useState } from 'react'
import { useAuthContext } from '@/contexts/auth-context'
import { createInteraction, deleteInteraction } from '@/actions/interactions'
import { toast } from 'sonner'
import { Typography } from '@/components/ui/typography'


interface ArticleActionsProps {
  article: Article
}

export function ArticleActions({ article }: ArticleActionsProps) {
  const { user } = useAuthContext()
  const [liked, setLiked] = useState(false)
  const [bookmarked, setBookmarked] = useState(false)
  const [showShareOptions, setShowShareOptions] = useState(false)

  const handleLike = async () => {
    if (!user) {
      toast.error('Connectez-vous pour liker cet article')
      return
    }

    try {
      if (liked) {
        // Supprimer le like
        // Note: Vous devrez implémenter une logique pour trouver l'ID d'interaction
        // await deleteInteraction(interactionId)
        setLiked(false)
        toast.success('Like retiré')
      } else {
        // Ajouter le like
        const formData = new FormData()
        formData.append('user_id', String(user.userDocument?.id || ''))
        formData.append('entity_type', 'article')
        formData.append('entity_id', article.id.toString())
        formData.append('interaction_type', 'like')
        
        await createInteraction(formData)
        setLiked(true)
        toast.success('Article liké !')
      }
    } catch (error) {
      console.error('Error liking article:', error)
      toast.error('Erreur lors du like')
    }
  }

  const handleBookmark = async () => {
    if (!user) {
      toast.error('Connectez-vous pour sauvegarder cet article')
      return
    }

    try {
      if (bookmarked) {
        // Supprimer le bookmark
        // await deleteInteraction(bookmarkId)
        setBookmarked(false)
        toast.success('Article retiré des favoris')
      } else {
        // Ajouter le bookmark
        const formData = new FormData()
        formData.append('user_id', String(user.userDocument?.id || ''))
        formData.append('entity_type', 'article')
        formData.append('entity_id', article.id.toString())
        formData.append('interaction_type', 'bookmark')
        
        await createInteraction(formData)
        setBookmarked(true)
        toast.success('Article sauvegardé !')
      }
    } catch (error) {
      console.error('Error bookmarking article:', error)
      toast.error('Erreur lors de la sauvegarde')
    }
  }

  const handleShare = (platform?: string) => {
    const url = window.location.href
    const title = article.title
    const text = article.excerpt || article.title

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
      case 'copy':
        navigator.clipboard.writeText(url)
        toast.success('Lien copié dans le presse-papier')
        break
      case 'print':
        window.print()
        break
      default:
        if (navigator.share) {
          navigator.share({
            title,
            text,
            url,
          })
        } else {
          setShowShareOptions(!showShareOptions)
        }
        break
    }
  }

  const scrollToComments = () => {
    const commentsSection = document.getElementById('comments-section')
    commentsSection?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6, delay: 0.1 }}
      className="sticky top-24"
    >
      <div className="flex lg:flex-col items-center justify-center gap-4">
        {/* Like */}
        <motion.div
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button
            variant="ghost"
            size="icon"
            className={`h-14 w-14 rounded-full ${liked ? 'bg-red-500/10 text-red-600' : ''}`}
            onClick={handleLike}
          >
            <Heart className={`h-6 w-6 ${liked ? 'fill-red-600' : ''}`} />
          </Button>
        </motion.div>

        {/* Comment */}
        <motion.div
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button
            variant="ghost"
            size="icon"
            className="h-14 w-14 rounded-full"
            onClick={scrollToComments}
          >
            <MessageCircle className="h-6 w-6" />
          </Button>
        </motion.div>

        {/* Bookmark */}
        <motion.div
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button
            variant="ghost"
            size="icon"
            className={`h-14 w-14 rounded-full ${bookmarked ? 'bg-yellow-500/10 text-yellow-600' : ''}`}
            onClick={handleBookmark}
          >
            <Bookmark className={`h-6 w-6 ${bookmarked ? 'fill-yellow-600' : ''}`} />
          </Button>
        </motion.div>

        {/* Share */}
        <div className="relative">
          <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              variant="ghost"
              size="icon"
              className="h-14 w-14 rounded-full"
              onClick={() => handleShare()}
            >
              <Share2 className="h-6 w-6" />
            </Button>
          </motion.div>

          {/* Options de partage */}
          {showShareOptions && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 10 }}
              className="absolute left-16 lg:left-auto lg:right-16 bottom-0 lg:bottom-auto lg:top-0 bg-popover border rounded-xl shadow-lg p-2 z-50"
            >
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2"
                  onClick={() => handleShare('facebook')}
                >
                  <Facebook className="h-4 w-4" />
                  Facebook
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2"
                  onClick={() => handleShare('twitter')}
                >
                  <Twitter className="h-4 w-4" />
                  Twitter
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2"
                  onClick={() => handleShare('linkedin')}
                >
                  <Linkedin className="h-4 w-4" />
                  LinkedIn
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2"
                  onClick={() => handleShare('copy')}
                >
                  <Copy className="h-4 w-4" />
                  Copier
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2 col-span-2"
                  onClick={() => handleShare('print')}
                >
                  <Printer className="h-4 w-4" />
                  Imprimer
                </Button>
              </div>
            </motion.div>
          )}
        </div>

        {/* Counters */}
        <div className="hidden lg:block mt-8 space-y-4 text-center">
          <div>
            <Typography variant="h5" weight="bold">
              {article.like_count.toLocaleString()}
            </Typography>
            <Typography variant="caption1" theme="muted">
              Likes
            </Typography>
          </div>
          <div>
            <Typography variant="h5" weight="bold">
              {article.view_count.toLocaleString()}
            </Typography>
            <Typography variant="caption1" theme="muted">
              Vues
            </Typography>
          </div>
          <div>
            <Typography variant="h5" weight="bold">
              {article.share_count.toLocaleString()}
            </Typography>
            <Typography variant="caption1" theme="muted">
              Partages
            </Typography>
          </div>
        </div>
      </div>
    </motion.div>
  )
}