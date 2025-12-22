// components/fighters/sections/fighters-header.tsx
'use client'

import { motion, Variants } from 'framer-motion'
import { Typography } from '@/components/ui/typography'
import { Button } from '@/components/ui/button'
import { Swords, Trophy, Target, Users, Search, Filter, TrendingUp } from 'lucide-react'
import Link from 'next/link'

export function FightersHeader() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1
      }
    }
  }

  const itemVariants: Variants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.6, ease: "easeOut" }
    }
  }

  return (
    <section className="relative py-12 md:py-20">
      {/* Background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.1 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="absolute -top-20 -right-20 w-64 h-64 bg-primary rounded-full blur-3xl"
        />
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.1 }}
          transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
          className="absolute -bottom-20 -left-20 w-80 h-80 bg-secondary rounded-full blur-3xl"
        />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="text-center max-w-4xl mx-auto"
        >
          {/* Badge */}
          <motion.div
            variants={itemVariants}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8"
          >
            <Swords className="h-4 w-4 text-primary" />
            <Typography variant="body-sm" weight="medium">
              Portail des Lutteurs Professionnels
            </Typography>
          </motion.div>

          {/* Main title */}
          <motion.div variants={itemVariants}>
            <Typography 
              variant="h1" 
              weight="bold" 
              className="mb-6"
            >
              Découvrez les{' '}
              <span className="text-primary">Lutteurs</span>{' '}
              <br className="md:hidden" />
              <span className="relative">
                Légendaires
                <motion.span
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ delay: 0.8, duration: 1 }}
                  className="absolute bottom-2 left-0 h-2 bg-primary/30 -z-10 rounded-full"
                />
              </span>
            </Typography>
          </motion.div>

          {/* Subtitle */}
          <motion.div variants={itemVariants}>
            <Typography 
              variant="h4" 
              theme="muted" 
              className="mb-10 max-w-2xl mx-auto"
            >
              Explorez les profils complets des plus grands combattants 
              de la lutte traditionnelle. Suivez leurs performances, 
              palmarès et actualités en temps réel.
            </Typography>
          </motion.div>

          {/* Quick stats */}
          <motion.div 
            variants={itemVariants}
            className="flex flex-wrap justify-center gap-8 mb-12"
          >
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-500/10 mb-2">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <Typography variant="body-sm" theme="muted">
                500+ Lutteurs
              </Typography>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-amber-500/10 mb-2">
                <Trophy className="h-6 w-6 text-amber-600" />
              </div>
              <Typography variant="body-sm" theme="muted">
                50+ Champions
              </Typography>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-500/10 mb-2">
                <Target className="h-6 w-6 text-emerald-600" />
              </div>
              <Typography variant="body-sm" theme="muted">
                15+ Régions
              </Typography>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-purple-500/10 mb-2">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
              <Typography variant="body-sm" theme="muted">
                Classements en Direct
              </Typography>
            </div>
          </motion.div>

          {/* Search bar preview */}
          <motion.div 
            variants={itemVariants}
            className="max-w-2xl mx-auto"
          >
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Rechercher un lutteur par nom, surnom ou région..."
                className="w-full pl-12 pr-4 py-3 rounded-xl border bg-background/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <Button 
                size="sm" 
                className="absolute right-2 top-1/2 transform -translate-y-1/2 gap-2"
              >
                <Filter className="h-4 w-4" />
                Filtres
              </Button>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}