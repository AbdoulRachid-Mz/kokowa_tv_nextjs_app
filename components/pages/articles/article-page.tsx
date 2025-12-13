// components/articles/article-page.tsx
'use client'

import { Article } from '@/types'
import { motion } from 'framer-motion'
import { ArticleHero } from './components/article-hero'
import { ArticleContent } from './components/article-content'
import { ArticleSidebar } from './components/article-sidebar'
import { ArticleComments } from './components/article-comments'
import { RelatedArticles } from './components/related-articles'
import { ArticleActions } from './components/article-actions'

interface ArticlePageProps {
  article: Article
  similarArticles: Article[]
  popularArticles: Article[]
}

export default function ArticlePage({ 
  article, 
  similarArticles, 
  popularArticles 
}: ArticlePageProps) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="min-h-screen bg-gradient-to-b from-background to-muted/20"
    >
      {/* Hero section */}
      <ArticleHero article={article} />
      
      <div className="">
        <div className="grid lg:grid-cols-12 gap-6">
          {/* Actions (partage, like, bookmark) */}
          <div className="lg:col-span-1">
            <ArticleActions article={article} />
          </div>
          
          {/* Contenu principal */}
          <div className="lg:col-span-8">
            <ArticleContent article={article} />
            <ArticleComments articleId={article.id} />
          </div>
          
          {/* Sidebar */}
          <div className="lg:col-span-3">
            <ArticleSidebar 
              article={article}
              popularArticles={popularArticles}
            />
          </div>
        </div>
        
        {/* Articles similaires */}
        {similarArticles.length > 0 && (
          <div className="mt-16">
            <RelatedArticles articles={similarArticles} />
          </div>
        )}
      </div>
    </motion.div>
  )
}