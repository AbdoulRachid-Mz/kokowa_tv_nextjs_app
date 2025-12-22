// components/editions/sections/editions-hero.tsx
'use client'

import { motion, Variants } from 'framer-motion'
import { Typography } from '@/components/ui/typography'
import { Button } from '@/components/ui/button'
import { Calendar, Trophy, Filter, Search, ArrowRight, Play } from 'lucide-react'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { useScreenSize } from '@/hooks/use-screen'

export function EditionsHero() {
  const { isSmallScreen } = useScreenSize()

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
    <section className="relative pt-16 pb-6 overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="absolute top-1/4 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl"
        />
      </div>

      <div className="container mx-auto px-3 relative z-10">
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
            <Calendar className="h-4 w-4 text-primary" />
            <Typography variant="body-sm" weight="medium">
              Éditions des Compétitions
            </Typography>
          </motion.div>

          {/* Main title */}
          <motion.div variants={itemVariants}>
            <Typography 
              variant={isSmallScreen ? "h1" : "h1"} 
              weight="bold" 
              className="mb-6"
            >
              Découvrez toutes les{' '}
              <span className="text-primary">Éditions</span>
            </Typography>
          </motion.div>

          {/* Subtitle */}
          <motion.div variants={itemVariants}>
            <Typography 
              variant={isSmallScreen ? "body-lg" : "h4"} 
              theme="muted" 
              className="mb-10 max-w-2xl mx-auto"
            >
              Explorez les différentes éditions des compétitions de lutte traditionnelle. 
              Suivez l'évolution, les participants, les résultats et bien plus.
            </Typography>
          </motion.div>

          {/* Search bar */}
          <motion.div 
            variants={itemVariants}
            className="max-w-2xl mx-auto mb-12"
          >
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Rechercher une édition, une année, un thème..."
                className="pl-12 pr-4 py-6 text-lg bg-background/80 backdrop-blur-sm"
              />
              <Button className="absolute right-2 top-1/2 transform -translate-y-1/2" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filtres
              </Button>
            </div>
          </motion.div>

          {/* Stats preview */}
          <motion.div 
            variants={itemVariants}
            className="flex flex-wrap justify-center gap-6 mb-12"
          >
            <div className="text-center px-6 py-3 bg-card/50 rounded-xl backdrop-blur-sm border">
              <Typography variant="h4" weight="bold" className="text-primary">
                25+
              </Typography>
              <Typography variant="body-sm" theme="muted">
                Éditions Actives
              </Typography>
            </div>
            <div className="text-center px-6 py-3 bg-card/50 rounded-xl backdrop-blur-sm border">
              <Typography variant="h4" weight="bold" className="text-primary">
                500+
              </Typography>
              <Typography variant="body-sm" theme="muted">
                Lutteurs Participants
              </Typography>
            </div>
            <div className="text-center px-6 py-3 bg-card/50 rounded-xl backdrop-blur-sm border">
              <Typography variant="h4" weight="bold" className="text-primary">
                15+
              </Typography>
              <Typography variant="body-sm" theme="muted">
                Régions
              </Typography>
            </div>
          </motion.div>

          {/* Quick filters */}
          <motion.div 
            variants={itemVariants}
            className="flex flex-wrap justify-center gap-3 mb-12"
          >
            <Button variant="outline" size="sm" className="gap-2">
              <Play className="h-4 w-4" />
              En Cours
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <Calendar className="h-4 w-4" />
              À Venir
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <Trophy className="h-4 w-4" />
              Terminées
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              Toutes les Années
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}