// components/matches/matches-header.tsx
'use client'

import { motion } from 'framer-motion'
import { Typography } from '@/components/ui/typography'
import { Button } from '@/components/ui/button'
import { Target, Calendar, TrendingUp, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export function MatchesHeader() {
  return (
    <header className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-secondary/10 border-b">
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-secondary/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 py-12 relative z-10">
        <div className="max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
              <Target className="h-4 w-4 text-primary" />
              <Typography variant="body-sm" weight="medium">
                Centre des Matchs
              </Typography>
            </div>

            {/* Titre */}
            <Typography variant="h1" weight="bold" className="mb-4">
              Suivez tous les{' '}
              <span className="text-primary">Matchs</span>{' '}
              en temps réel
            </Typography>

            {/* Description */}
            <Typography variant="body-lg" theme="muted" className="mb-8 max-w-2xl">
              Accédez à tous les matchs de lutte traditionnelle, 
              des rencontres en direct aux résultats complets. 
              Filtrez par édition, phase ou groupe pour trouver exactement ce que vous cherchez.
            </Typography>

            {/* Actions */}
            <div className="flex flex-wrap gap-4">
              <Button size="lg" className="gap-2" asChild>
                <Link href="/matches/live">
                  <Target className="h-4 w-4" />
                  Matchs en Direct
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="gap-2" asChild>
                <Link href="/calendar">
                  <Calendar className="h-4 w-4" />
                  Calendrier Complet
                </Link>
              </Button>
              <Button size="lg" variant="ghost" className="gap-2" asChild>
                <Link href="/stats">
                  <TrendingUp className="h-4 w-4" />
                  Statistiques
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </header>
  )
}