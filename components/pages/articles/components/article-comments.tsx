// components/articles/article-comments.tsx
'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Typography } from '@/components/ui/typography'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { MessageSquare, Heart, MoreVertical, Send } from 'lucide-react'
import { useAuthContext } from '@/contexts/auth-context'
import { createMessage, getMessages } from '@/actions/messages'
import { Message } from '@/types'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { toast } from 'sonner'

// components/articles/article-comments.tsx (suite)
interface ArticleCommentsProps {
  articleId: number
}

export function ArticleComments({ articleId }: ArticleCommentsProps) {
  const { user } = useAuthContext()
  const [comments, setComments] = useState<Message[]>([])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [replyTo, setReplyTo] = useState<number | null>(null)
  const [replyContent, setReplyContent] = useState('')

  useEffect(() => {
    loadComments()
  }, [articleId])

  const loadComments = async () => {
    try {
      setLoading(true)
      const response = await getMessages({
        entity_type: 'article',
        entity_id: articleId,
        message_type: 'comment',
        with_author: true,
        with_parent: true,
        sortBy: 'created_at',
        sortOrder: 'desc',
        limit: 50
      })
      setComments(response.data)
    } catch (error) {
      console.error('Error loading comments:', error)
      toast.error('Erreur lors du chargement des commentaires')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) {
      toast.error('Connectez-vous pour commenter')
      return
    }

    if (!newComment.trim()) {
      toast.error('Le commentaire ne peut pas être vide')
      return
    }

    try {
      setSubmitting(true)
      
      const formData = new FormData()
      formData.append('content', newComment)
      formData.append('message_type', 'comment')
      formData.append('entity_type', 'article')
      formData.append('entity_id', articleId.toString())
      formData.append('author_id', user.userDocument?.id?.toString() || '')
      
      await createMessage(formData)
      
      setNewComment('')
      toast.success('Commentaire publié !')
      loadComments() // Recharger les commentaires
    } catch (error) {
      console.error('Error submitting comment:', error)
      toast.error('Erreur lors de la publication du commentaire')
    } finally {
      setSubmitting(false)
    }
  }

  const handleReplySubmit = async (parentId: number) => {
    if (!user || !replyContent.trim()) return

    try {
      const formData = new FormData()
      formData.append('content', replyContent)
      formData.append('message_type', 'comment')
      formData.append('entity_type', 'article')
      formData.append('entity_id', articleId.toString())
      formData.append('author_id', user.userDocument?.id?.toString() || '')
      formData.append('parent_message_id', parentId.toString())
      
      await createMessage(formData)
      
      setReplyContent('')
      setReplyTo(null)
      toast.success('Réponse publiée !')
      loadComments()
    } catch (error) {
      console.error('Error submitting reply:', error)
      toast.error('Erreur lors de la publication de la réponse')
    }
  }

  const handleLikeComment = async (commentId: number) => {
    if (!user) {
      toast.error('Connectez-vous pour liker un commentaire')
      return
    }

    try {
      const formData = new FormData()
      formData.append('entity_type', 'message')
      formData.append('entity_id', commentId.toString())
      formData.append('interaction_type', 'like')
      formData.append('user_id', user.userDocument?.id?.toString() || '')
      
      // Note: Vous devrez adapter cette logique pour gérer les likes de commentaires
      // await createInteraction(formData)
      
      toast.success('Commentaire liké !')
    } catch (error) {
      console.error('Error liking comment:', error)
      toast.error('Erreur lors du like')
    }
  }

  const renderComment = (comment: Message, isReply = false) => {
    const replies = comments.filter(c => c.parent_message_id === comment.id)
    
    return (
      <motion.div
        key={comment.id}
        initial={{ opacity: 0, x: isReply ? 20 : 0 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
        className={`${isReply ? 'ml-12 border-l-2 border-muted pl-6' : ''}`}
      >
        <div className={`rounded-xl p-4 ${isReply ? 'bg-muted/30' : 'bg-card'} mb-4`}>
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src={comment.author?.profile_picture} />
                <AvatarFallback>
                  {comment.author?.username?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div>
                <Typography variant="body-base" weight="medium">
                  {comment.author?.first_name} {comment.author?.last_name}
                </Typography>
                <Typography variant="caption2" theme="muted">
                  @{comment.author?.username} • {format(new Date(comment.created_at), 'PP à p', { locale: fr })}
                </Typography>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </div>

          {/* Content */}
          <Typography variant="body-base" className="mb-4 whitespace-pre-wrap">
            {comment.content}
          </Typography>

          {/* Actions */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 h-8"
              onClick={() => handleLikeComment(comment.id)}
            >
              <Heart className="h-4 w-4" />
              {comment.like_count}
            </Button>
            
            {!isReply && (
              <Button
                variant="ghost"
                size="sm"
                className="gap-2 h-8"
                onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)}
              >
                <MessageSquare className="h-4 w-4" />
                Répondre
              </Button>
            )}
          </div>

          {/* Reply form */}
          {replyTo === comment.id && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-4"
            >
              <div className="flex gap-2">
                <Textarea
                  placeholder="Écrivez votre réponse..."
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  className="flex-1"
                  rows={2}
                />
                <Button
                  size="sm"
                  className="h-auto"
                  onClick={() => handleReplySubmit(comment.id)}
                  disabled={!replyContent.trim()}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          )}
        </div>

        {/* Replies */}
        {replies.length > 0 && (
          <div className="space-y-4">
            {replies.map(reply => renderComment(reply, true))}
          </div>
        )}
      </motion.div>
    )
  }

  return (
    <motion.section
      id="comments-section"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      className="mt-16"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <Typography variant="h3" weight="bold">
          Commentaires
        </Typography>
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary" />
          <Typography variant="h5" weight="medium">
            {comments.length}
          </Typography>
        </div>
      </div>

      {/* Comment form */}
      {user ? (
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSubmitComment}
          className="mb-8"
        >
          <div className="flex gap-4">
            <Avatar className="h-12 w-12">
              <AvatarImage src={user.userDocument?.profile_picture} />
              <AvatarFallback>
                {user.userDocument?.first_name?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <Textarea
                placeholder="Partagez vos pensées sur cet article..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="mb-3 min-h-[100px]"
              />
              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={!newComment.trim() || submitting}
                  className="gap-2"
                >
                  <Send className="h-4 w-4" />
                  {submitting ? 'Publication...' : 'Publier le commentaire'}
                </Button>
              </div>
            </div>
          </div>
        </motion.form>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border bg-gradient-to-r from-primary/5 to-secondary/5 p-8 text-center mb-8"
        >
          <Typography variant="h5" weight="medium" className="mb-2">
            💬 Rejoignez la conversation
          </Typography>
          <Typography variant="body-base" theme="muted" className="mb-4">
            Connectez-vous pour commenter et interagir avec la communauté.
          </Typography>
          <div className="flex gap-4 justify-center">
            <Button asChild>
              <a href="/auth/login">Se connecter</a>
            </Button>
            <Button variant="outline" asChild>
              <a href="/auth/register">Créer un compte</a>
            </Button>
          </div>
        </motion.div>
      )}

      {/* Comments list */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="rounded-xl bg-muted/30 p-4 animate-pulse">
              <div className="flex gap-3 mb-3">
                <div className="h-10 w-10 rounded-full bg-muted" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-muted rounded w-1/4" />
                  <div className="h-3 bg-muted rounded w-1/3" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-muted rounded w-full" />
                <div className="h-4 bg-muted rounded w-3/4" />
              </div>
            </div>
          ))}
        </div>
      ) : comments.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-2xl border border-dashed p-12 text-center"
        >
          <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <Typography variant="h5" weight="medium" className="mb-2">
            Aucun commentaire pour le moment
          </Typography>
          <Typography variant="body-base" theme="muted">
            Soyez le premier à partager votre avis sur cet article !
          </Typography>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-4"
        >
          {comments
            .filter(comment => !comment.parent_message_id)
            .map(comment => renderComment(comment))}
        </motion.div>
      )}
    </motion.section>
  )
}