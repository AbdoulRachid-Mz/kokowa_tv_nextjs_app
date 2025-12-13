// components/articles/article-hero.tsx
'use client'

import { Article } from '@/types'
import { motion } from 'framer-motion'
import { Typography } from '@/components/ui/typography'
import { Calendar, Clock, Eye, User, Tag } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Share2, Bookmark, Heart } from 'lucide-react'

interface ArticleHeroProps {
  article: Article
}

export function ArticleHero({ article }: ArticleHeroProps) {
  const readingTime = Math.ceil(article.content.split(' ').length / 200)

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="relative overflow-hidden"
    >
      {/* Background avec image */}
      {article.featured_image && (
        <div className="absolute inset-0">
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${article.featured_image})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/20" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/30 to-transparent" />
        </div>
      )}

      <div className="relative container mx-auto px-4 pt-32 pb-20">
        <div className="max-w-4xl mx-auto">
          {/* Catégorie et tags */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="flex flex-wrap items-center gap-3 mb-6"
          >
            <Badge variant="secondary" className="gap-2">
              <Tag className="h-3 w-3" />
              Lutte Traditionnelle
            </Badge>
            <Badge variant="outline" className="gap-2">
              <Calendar className="h-3 w-3" />
              {article.published_at ? format(new Date(article.published_at), 'PPP', { locale: fr }) : 'Non publié'}
            </Badge>
          </motion.div>

          {/* Titre */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            <Typography 
              variant="h1" 
              weight="bold" 
              className="mb-6 text-4xl md:text-5xl lg:text-6xl leading-tight"
            >
              {article.title}
            </Typography>
          </motion.div>

          {/* Extrait */}
          {article.excerpt && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              <Typography 
                variant="h4" 
                weight="medium" 
                theme="muted"
                className="mb-8 max-w-3xl"
              >
                {article.excerpt}
              </Typography>
            </motion.div>
          )}

          {/* Métadonnées et actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pt-8 border-t"
          >
            {/* Auteur et stats */}
            <div className="flex items-center gap-4">
              {/* Avatar auteur */}
              {article.author && (
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                    {article.author.profile_picture ? (
                      <img 
                        src={article.author.profile_picture} 
                        alt={article.author.username}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <User className="h-6 w-6 text-primary" />
                    )}
                  </div>
                  <div>
                    <Typography variant="body-base" weight="medium">
                      {article.author.first_name} {article.author.last_name}
                    </Typography>
                    <Typography variant="body-sm" theme="muted">
                      @{article.author.username}
                    </Typography>
                  </div>
                </div>
              )}
              
              {/* Stats */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <Typography variant="body-sm">
                    {readingTime} min de lecture
                  </Typography>
                </div>
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4 text-muted-foreground" />
                  <Typography variant="body-sm">
                    {article.view_count.toLocaleString()} vues
                  </Typography>
                </div>
              </div>
            </div>

            {/* Actions rapides */}
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="gap-2">
                <Heart className="h-4 w-4" />
                {article.like_count}
              </Button>
              <Button variant="outline" size="sm" className="gap-2">
                <Share2 className="h-4 w-4" />
                Partager
              </Button>
              <Button variant="outline" size="sm" className="gap-2">
                <Bookmark className="h-4 w-4" />
                Sauvegarder
              </Button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Progress bar pour le scroll */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-secondary to-primary"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 1, ease: "easeInOut" }}
      />
    </motion.section>
  )
}