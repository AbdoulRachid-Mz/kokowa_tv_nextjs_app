// components/articles/article-sidebar.tsx
'use client'

import { Article } from '@/types'
import { motion } from 'framer-motion'
import { Typography } from '@/components/ui/typography'
import { Calendar, TrendingUp, BookOpen, Users, Tag, Clock } from 'lucide-react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

interface ArticleSidebarProps {
  article: Article
  popularArticles: Article[]
}

export function ArticleSidebar({ article, popularArticles }: ArticleSidebarProps) {
  const tags = ['lutte-traditionnelle', 'sport', 'compétition', 'culture', 'afrique']

  return (
    <motion.aside
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6, delay: 0.3 }}
      className="space-y-8"
    >
      {/* Stats de l'article */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="rounded-2xl border bg-card p-6"
      >
        <Typography variant="h5" weight="medium" className="mb-6 flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Statistiques
        </Typography>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BookOpen className="h-4 w-4 text-muted-foreground" />
              <Typography variant="body-sm">Lectures</Typography>
            </div>
            <Typography variant="body-base" weight="medium">
              {article.view_count.toLocaleString()}
            </Typography>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Users className="h-4 w-4 text-muted-foreground" />
              <Typography variant="body-sm">Likes</Typography>
            </div>
            <Typography variant="body-base" weight="medium">
              {article.like_count.toLocaleString()}
            </Typography>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <Typography variant="body-sm">Publié le</Typography>
            </div>
            <Typography variant="body-sm">
              {article.published_at ? format(new Date(article.published_at), 'dd/MM/yyyy', { locale: fr }) : '-'}
            </Typography>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <Typography variant="body-sm">Mise à jour</Typography>
            </div>
            <Typography variant="body-sm">
              {article.updated_at ? format(new Date(article.updated_at), 'dd/MM/yyyy', { locale: fr }) : '-'}
            </Typography>
          </div>
        </div>
      </motion.div>

      {/* Tags */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="rounded-2xl border bg-card p-6"
      >
        <Typography variant="h5" weight="medium" className="mb-4 flex items-center gap-2">
          <Tag className="h-5 w-5" />
          Mots-clés
        </Typography>
        
        <div className="flex flex-wrap gap-2">
          {tags.map((tag, index) => (
            <motion.div
              key={tag}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 * index }}
            >
              <Badge variant="outline" className="cursor-pointer hover:bg-accent transition-colors">
                #{tag}
              </Badge>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Articles populaires */}
      {popularArticles.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="rounded-2xl border bg-card p-6"
        >
          <Typography variant="h5" weight="medium" className="mb-6">
            Articles populaires
          </Typography>
          
          <div className="space-y-4">
            {popularArticles.map((popularArticle, index) => (
              <motion.div
                key={popularArticle.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * index }}
              >
                <Link 
                  href={`/articles/${popularArticle.slug}`}
                  className="group block"
                >
                  <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-accent transition-colors">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Typography variant="body-sm" weight="bold" className="text-primary">
                          {index + 1}
                        </Typography>
                      </div>
                    </div>
                    <div>
                      <Typography variant="body-sm" weight="medium" className="line-clamp-2 group-hover:text-primary transition-colors">
                        {popularArticle.title}
                      </Typography>
                      <div className="flex items-center gap-2 mt-1">
                        <Typography variant="caption2" theme="muted">
                          {popularArticle.author?.username}
                        </Typography>
                        <span className="text-muted-foreground">•</span>
                        <Typography variant="caption2" theme="muted">
                          {popularArticle.view_count.toLocaleString()} vues
                        </Typography>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Newsletter */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="rounded-2xl border bg-gradient-to-br from-primary/5 to-secondary/5 p-6"
      >
        <Typography variant="h5" weight="medium" className="mb-3">
          📬 Restez informé
        </Typography>
        <Typography variant="body-sm" theme="muted" className="mb-4">
          Recevez les derniers articles sur la lutte traditionnelle directement dans votre boîte mail.
        </Typography>
        
        <form className="space-y-3">
          <input
            type="email"
            placeholder="Votre email"
            className="w-full px-4 py-2 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            type="submit"
            className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            S'abonner
          </button>
        </form>
        
        <Typography variant="caption2" theme="muted" className="mt-3 block text-center">
          Pas de spam, juste des articles de qualité.
        </Typography>
      </motion.div>
    </motion.aside>
  )
}