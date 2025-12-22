// components/articles/article-content.tsx
'use client'

import { Article } from '@/types'
import { motion } from 'framer-motion'
import { Typography } from '@/components/ui/typography'
import { Prose } from '@/components/ui/prose'

interface ArticleContentProps {
  article: Article
}

export function ArticleContent({ article }: ArticleContentProps) {
  // Fonction pour parser le contenu HTML/JSON
  const renderContent = () => {
    try {
      // Si le contenu est du HTML
      if (article.content.includes('<') && article.content.includes('>')) {
        return (
          <div 
            dangerouslySetInnerHTML={{ __html: article.content }} 
            className="prose dark:prose-invert max-w-none"
          />
        )
      }
      
      // Si le contenu est du markdown ou du texte simple
      return <Prose content={article.content} />
    } catch (error) {
      return <Typography variant="body-base">{article.content}</Typography>
    }
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="bg-card rounded-3xl p-8 md:p-12 shadow-xl border"
    >
      {/* Image principale */}
      {article.featured_image && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="mb-12 rounded-2xl overflow-hidden"
        >
          <img
            src={article.featured_image}
            alt={article.title}
            className="w-full h-auto max-h-[600px] object-cover rounded-2xl"
          />
        </motion.div>
      )}

      {/* Contenu */}
      <div className="space-y-8">
        {renderContent()}
      </div>

      {/* Divider */}
      <motion.div
        initial={{ width: 0 }}
        whileInView={{ width: "100%" }}
        viewport={{ once: true }}
        transition={{ duration: 1 }}
        className="mt-12 h-px bg-gradient-to-r from-transparent via-border to-transparent"
      />

      {/* Auteur détaillé */}
      {article.author && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mt-12 p-6 rounded-2xl bg-muted/30"
        >
          <div className="flex items-start gap-6">
            <div className="flex-shrink-0">
              <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                {article.author.profile_picture ? (
                  <img 
                    src={article.author.profile_picture} 
                    alt={article.author.username}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-20 w-20 rounded-full bg-primary/20 flex items-center justify-center">
                    <Typography variant="h3" className="text-primary">
                      {article.author.first_name?.[0]}{article.author.last_name?.[0]}
                    </Typography>
                  </div>
                )}
              </div>
            </div>
            <div className="flex-1">
              <Typography variant="h5" weight="bold" className="mb-2">
                À propos de l'auteur
              </Typography>
              <Typography variant="h6" weight="medium" className="mb-2">
                {article.author.first_name} {article.author.last_name}
              </Typography>
              <Typography variant="body-base" theme="muted" className="mb-4">
                Expert en lutte traditionnelle avec plus de 10 ans d'expérience dans le domaine.
                {article.author.bio && ` ${article.author.bio}`}
              </Typography>
              <div className="flex items-center gap-4">
                <Typography variant="body-sm" weight="medium" className="text-primary">
                  @{article.author.username}
                </Typography>
                <Typography variant="body-sm" theme="muted">
                  {article.author.country}
                </Typography>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Call to action */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="mt-12 text-center"
      >
        <Typography variant="h4" weight="bold" className="mb-4">
          Cet article vous a plu ?
        </Typography>
        <Typography variant="body-base" theme="muted" className="mb-8 max-w-2xl mx-auto">
          Partagez-le avec vos amis et collègues passionnés de lutte traditionnelle.
        </Typography>
        <div className="flex flex-wrap justify-center gap-4">
          <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Partager sur Facebook
          </button>
          <button className="px-6 py-3 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors">
            Partager sur Twitter
          </button>
          <button className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">
            Partager sur WhatsApp
          </button>
        </div>
      </motion.div>
    </motion.article>
  )
}