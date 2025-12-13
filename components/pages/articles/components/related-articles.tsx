// components/articles/related-articles.tsx
'use client'

import { Article } from '@/types'
import { motion } from 'framer-motion'
import { Typography } from '@/components/ui/typography'
import { Button } from '@/components/ui/button'
import { ArrowRight, Calendar, Eye, User, Clock } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

interface RelatedArticlesProps {
  articles: Article[]
}

export function RelatedArticles({ articles }: RelatedArticlesProps) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 }
    }
  }

  if (articles.length === 0) return null

  return (
    <motion.section
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-100px" }}
      className="py-12"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <Typography variant="h3" weight="bold" className="mb-2">
            Articles similaires
          </Typography>
          <Typography variant="body-base" theme="muted">
            Découvrez d'autres contenus qui pourraient vous intéresser
          </Typography>
        </div>
        <Button variant="outline" className="gap-2" asChild>
          <Link href="/articles">
            Voir tous les articles
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>

      {/* Articles grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {articles.map((article, index) => (
          <motion.article
            key={article.id}
            variants={itemVariants}
            whileHover={{ y: -8 }}
            className="group relative"
          >
            <Link href={`/articles/${article.slug}`} className="block">
              <div className="rounded-2xl border bg-card overflow-hidden hover:shadow-xl transition-all duration-300 h-full">
                {/* Image */}
                {article.featured_image && (
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={article.featured_image}
                      alt={article.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                  </div>
                )}

                {/* Content */}
                <div className="p-6">
                  {/* Title */}
                  <Typography 
                    variant="h5" 
                    weight="medium" 
                    className="mb-3 line-clamp-2 group-hover:text-primary transition-colors"
                  >
                    {article.title}
                  </Typography>

                  {/* Excerpt */}
                  {article.excerpt && (
                    <Typography 
                      variant="body-base" 
                      theme="muted" 
                      className="mb-4 line-clamp-3"
                    >
                      {article.excerpt}
                    </Typography>
                  )}

                  {/* Author */}
                  {article.author && (
                    <div className="flex items-center gap-2 mb-3">
                      <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                        {article.author.profile_picture ? (
                          <img 
                            src={article.author.profile_picture} 
                            alt={article.author.username}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <User className="h-3 w-3 text-primary" />
                        )}
                      </div>
                      <Typography variant="body-sm">
                        {article.author.first_name} {article.author.last_name}
                      </Typography>
                    </div>
                  )}

                  {/* Metadata */}
                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        <Typography variant="caption2" theme="muted">
                          {article.published_at 
                            ? format(new Date(article.published_at), 'dd/MM/yy', { locale: fr })
                            : 'Non publié'
                          }
                        </Typography>
                      </div>
                      <div className="flex items-center gap-1">
                        <Eye className="h-3 w-3 text-muted-foreground" />
                        <Typography variant="caption2" theme="muted">
                          {article.view_count.toLocaleString()}
                        </Typography>
                      </div>
                    </div>
                    
                    <Button variant="ghost" size="sm" className="gap-1">
                      Lire
                      <ArrowRight className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                {/* Reading time indicator */}
                <div className="absolute top-4 right-4 bg-background/90 backdrop-blur-sm px-3 py-1 rounded-full">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3 text-primary" />
                    <Typography variant="caption2" weight="medium">
                      {Math.ceil(article.content.split(' ').length / 200)} min
                    </Typography>
                  </div>
                </div>
              </div>
            </Link>
          </motion.article>
        ))}
      </div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.3 }}
        className="mt-12 rounded-3xl bg-gradient-to-r from-primary/10 to-secondary/10 border p-8 text-center"
      >
        <Typography variant="h4" weight="bold" className="mb-4">
          💌 Restez à jour avec nos derniers articles
        </Typography>
        <Typography variant="body-base" theme="muted" className="mb-6 max-w-2xl mx-auto">
          Abonnez-vous à notre newsletter pour recevoir les derniers articles, 
          analyses et actualités sur la lutte traditionnelle directement dans votre boîte mail.
        </Typography>
        <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
          <input
            type="email"
            placeholder="Votre adresse email"
            className="flex-1 px-4 py-3 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <Button size="lg" className="gap-2">
            S'abonner
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </motion.div>
    </motion.section>
  )
}