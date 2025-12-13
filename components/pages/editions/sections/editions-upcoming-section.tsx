// components/editions/sections/editions-upcoming-section.tsx
'use client'

import { motion } from 'framer-motion'
import { Typography } from '@/components/ui/typography'
import { Button } from '@/components/ui/button'
import { Calendar, Users, MapPin, Clock, ArrowRight, Bell, Trophy } from 'lucide-react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { useEditions } from '@/hooks/use-editions'
import { Skeleton } from '@/components/ui/skeleton'
import { useState, useEffect, useMemo, useCallback } from 'react'
import { CompetitionEdition } from '@/types'

interface EditionsSectionProps {
  editions: CompetitionEdition[]
  loading: boolean
}


export function EditionsUpcomingSection({editions, loading}: EditionsSectionProps) {
  // const { editions, loading } = useEditions({
  //   limit: 4,
  //   with_competition: true,
  //   with_fighters: true,
  //   with_regions: true
  // })

  const [timeRemaining, setTimeRemaining] = useState<{[key: number]: string}>({})

  // Mémoriser le calcul des éditions à venir pour éviter les recalculs inutiles
  const upcomingEditions = useMemo(() => {
    return editions
      .filter(edition => {
        if (!edition.start_date) return false
        const startDate = new Date(edition.start_date)
        const now = new Date()
        return startDate > now
      })
      .slice(0, 4)
  }, [editions]) // Seulement recalculer quand 'editions' change

  // Mémoriser la fonction de calcul du temps restant
  const calculateTimeRemaining = useCallback(() => {
    const now = new Date()
    const newTimeRemaining: {[key: number]: string} = {}

    upcomingEditions.forEach(edition => {
      if (edition.start_date) {
        const startDate = new Date(edition.start_date)
        const diffTime = startDate.getTime() - now.getTime()
        
        if (diffTime > 0) {
          const days = Math.floor(diffTime / (1000 * 60 * 60 * 24))
          const hours = Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
          
          if (days > 0) {
            newTimeRemaining[edition.id] = `Dans ${days}j ${hours}h`
          } else if (hours > 0) {
            newTimeRemaining[edition.id] = `Dans ${hours}h`
          } else {
            const minutes = Math.floor((diffTime % (1000 * 60 * 60)) / (1000 * 60))
            newTimeRemaining[edition.id] = `Dans ${minutes}min`
          }
        } else {
          newTimeRemaining[edition.id] = 'Bientôt'
        }
      }
    })

    setTimeRemaining(newTimeRemaining)
  }, [upcomingEditions]) // Dépendance sur upcomingEditions mémorisé

  // Gérer le timer avec cleanup
  useEffect(() => {
    // Calculer immédiatement
    calculateTimeRemaining()
    
    // Configurer l'intervalle seulement s'il y a des éditions à venir
    if (upcomingEditions.length > 0) {
      const interval = setInterval(calculateTimeRemaining, 60000) // Mise à jour chaque minute
      return () => clearInterval(interval)
    }
  }, [calculateTimeRemaining, upcomingEditions.length]) // Dépendances mémorisées

  if (loading) {
    return (
      <section className="py-12">
        <div className="container mx-auto px-4">
          <Skeleton className="h-8 w-64 mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-2xl" />
            ))}
          </div>
        </div>
      </section>
    )
  }

  if (upcomingEditions.length === 0) return null

  return (
    <section className="py-12 bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-3 w-3 rounded-full bg-blue-500" />
              <Typography variant="body-base" weight="medium" className="text-blue-600">
                ÉDITIONS À VENIR
              </Typography>
            </div>
            <Typography variant="h3" weight="bold" className="mb-2">
              Prochaines Compétitions
            </Typography>
            <Typography variant="body-base" theme="muted">
              Préparez-vous pour les prochaines éditions passionnantes
            </Typography>
          </div>
          <Button variant="outline" asChild>
            <Link href="/editions?status=upcoming">
              Voir toutes les éditions à venir
            </Link>
          </Button>
        </motion.div>

        {/* Upcoming editions grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {upcomingEditions.map((edition, index) => {
            const participantCount = (edition.fighters?.length || 0) + (edition.regions?.length || 0)
            const timeLeft = timeRemaining[edition.id] || 'Date non définie'

            return (
              <motion.div
                key={edition.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="group relative"
              >
                <div className="relative rounded-2xl border bg-card overflow-hidden hover:shadow-xl transition-all duration-300">
                  {/* Time badge */}
                  <div className="absolute top-4 right-4 z-10">
                    <Badge className="bg-blue-600 gap-2">
                      <Clock className="h-3 w-3" />
                      {timeLeft}
                    </Badge>
                  </div>

                  {/* Image/Color header */}
                  <div 
                    className="h-32 bg-gradient-to-r from-blue-600 to-blue-400 relative overflow-hidden"
                    style={{ backgroundColor: edition.region?.color || '#3b82f6' }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                    <div className="absolute bottom-4 left-4">
                      <Typography variant="h5" weight="bold" className="text-white">
                        {edition.competition?.name}
                      </Typography>
                      <Typography variant="body-sm" className="text-white/80">
                        Édition {edition.edition_number} • {edition.year}
                      </Typography>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    {/* Title */}
                    <Typography variant="h5" weight="medium" className="mb-2">
                      {edition.theme || `Édition ${edition.year}`}
                    </Typography>

                    {/* Description */}
                    <Typography variant="body-sm" theme="muted" className="mb-4 line-clamp-2">
                      {edition.competition?.description || 'Compétition de lutte traditionnelle à venir'}
                    </Typography>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      <div className="text-center">
                        <Users className="h-5 w-5 text-muted-foreground mx-auto mb-1" />
                        <Typography variant="body-sm" weight="medium">
                          {participantCount}
                        </Typography>
                        <Typography variant="caption1" theme="muted">
                          Inscrits
                        </Typography>
                      </div>
                      <div className="text-center">
                        <MapPin className="h-5 w-5 text-muted-foreground mx-auto mb-1" />
                        <Typography variant="body-sm" weight="medium">
                          {edition.regions?.length || 0}
                        </Typography>
                        <Typography variant="caption1" theme="muted">
                          Régions
                        </Typography>
                      </div>
                      <div className="text-center">
                        <Calendar className="h-5 w-5 text-muted-foreground mx-auto mb-1" />
                        <Typography variant="body-sm" weight="medium">
                          {edition.start_date ? 
                            new Date(edition.start_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : 
                            'N/A'}
                        </Typography>
                        <Typography variant="caption1" theme="muted">
                          Début
                        </Typography>
                      </div>
                    </div>

                    {/* Dates */}
                    {edition.start_date && (
                      <div className="mb-4">
                        <div className="flex items-center gap-2 mb-1">
                          <Calendar className="h-4 w-4 text-blue-600" />
                          <Typography variant="body-sm" weight="medium" className="text-blue-600">
                            Date de début
                          </Typography>
                        </div>
                        <Typography variant="body-base">
                          {new Date(edition.start_date).toLocaleDateString('fr-FR', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })}
                        </Typography>
                      </div>
                    )}

                    {/* Registration info */}
                    {edition.registration_deadline && (
                      <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <Clock className="h-4 w-4 text-blue-600" />
                          <Typography variant="body-sm" weight="medium" className="text-blue-600">
                            Fin des inscriptions
                          </Typography>
                        </div>
                        <Typography variant="body-sm">
                          {new Date(edition.registration_deadline).toLocaleDateString('fr-FR')}
                        </Typography>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button size="sm" className="flex-1 gap-2" asChild>
                        <Link href={`/editions/${edition.id}`}>
                          <ArrowRight className="h-4 w-4" />
                          Plus d'infos
                        </Link>
                      </Button>
                      <Button size="sm" variant="outline" className="gap-2">
                        <Bell className="h-4 w-4" />
                        Rappeler
                      </Button>
                    </div>
                  </div>

                  {/* Hover effect */}
                  <div className="absolute inset-0 border-2 border-transparent group-hover:border-blue-500/20 rounded-2xl transition-all duration-300 pointer-events-none" />
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Call to action */}
        {upcomingEditions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="mt-12 text-center"
          >
            <Typography variant="h4" weight="medium" className="mb-4">
              Prêt pour la prochaine compétition ?
            </Typography>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="gap-2" asChild>
                <Link href="/auth/register">
                  <Bell className="h-4 w-4" />
                  S'inscrire aux alertes
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="gap-2" asChild>
                <Link href="/competitions">
                  <Trophy className="h-4 w-4" />
                  Voir les compétitions
                </Link>
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </section>
  )
}