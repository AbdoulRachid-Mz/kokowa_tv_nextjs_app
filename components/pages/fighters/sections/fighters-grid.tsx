// components/fighters/sections/fighters-grid.tsx
'use client'

import { motion, Variants } from 'framer-motion'
import { Typography } from '@/components/ui/typography'
import { Button } from '@/components/ui/button'
// import { FighterCard } from '../fighter-card'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { SearchX, RefreshCw } from 'lucide-react'
import { FighterCard } from '../components/fighter-card'

interface FightersGridProps {
  fighters: any[]
  isLoading: boolean
}

export function FightersGrid({ fighters, isLoading }: FightersGridProps) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  }

  const itemVariants: Variants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-96 rounded-2xl" />
          ))}
        </div>
      </div>
    )
  }

  if (fighters.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="container mx-auto px-4"
      >
        <Alert className="max-w-2xl mx-auto">
          <SearchX className="h-5 w-5" />
          <AlertDescription>
            <Typography variant="body-base" className="mb-2">
              Aucun lutteur ne correspond à vos critères de recherche.
            </Typography>
            <Button variant="outline" size="sm" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Réinitialiser les filtres
            </Button>
          </AlertDescription>
        </Alert>
      </motion.div>
    )
  }

  return (
    <div className="container mx-auto px-4">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
      >
        {fighters.map((fighter, index) => (
          <motion.div
            key={fighter.id}
            variants={itemVariants}
            custom={index}
          >
            <FighterCard fighter={fighter} />
          </motion.div>
        ))}
      </motion.div>
    </div>
  )
}