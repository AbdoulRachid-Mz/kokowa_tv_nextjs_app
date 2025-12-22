// components/editions/sections/editions-current-section.tsx
'use client'

import { motion } from 'framer-motion'
import { Typography } from '@/components/ui/typography'
import { Button } from '@/components/ui/button'
import { Calendar, Users, MapPin, Trophy, Play, Clock, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { useEditions } from '@/hooks/use-editions'
import { Skeleton } from '@/components/ui/skeleton'
import { CompetitionEdition, Phase } from '@/types'
import { useMemo } from 'react'

interface EditionsCurrentSectionProps {
  editions: CompetitionEdition[]
  loading: boolean
}

export function EditionsCurrentSection({ editions, loading }: EditionsCurrentSectionProps) {
  // const { editions, loading } = useEditions({
  //   limit: 3,
  //   with_competition: true,
  //   with_fighters: true,
  //   with_regions: true,
  //   with_phases: true
  // })

  // Mémoriser le calcul des éditions courantes
  const currentEditions = useMemo(() => 
    editions
      .filter(edition => 
        edition.phases?.some((phase: Phase) => phase.is_active && !phase.is_completed)
      )
      .slice(0, 3),
    [editions]
  )

  if (loading) {
    return (
      <section className="py-12">
        <div className="container mx-auto px-4">
          <Skeleton className="h-8 w-64 mb-8" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-96 rounded-2xl" />
            ))}
          </div>
        </div>
      </section>
    )
  }

  if (currentEditions.length === 0) return null

  return (
    <section className="py-12">
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
              <div className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse" />
              <Typography variant="body-base" weight="medium" className="text-emerald-600">
                ÉDITIONS EN COURS
              </Typography>
            </div>
            <Typography variant="h3" weight="bold" className="mb-2">
              Suivez l'Action en Direct
            </Typography>
            <Typography variant="body-base" theme="muted">
              Les éditions actuellement en cours avec des phases en jeu
            </Typography>
          </div>
          <Button variant="outline" asChild>
            <Link href="/editions?status=active">
              Voir toutes les éditions
            </Link>
          </Button>
        </motion.div>

        {/* Current editions grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {currentEditions.map((edition, index) => {
            const activePhase = edition.phases?.find((phase: Phase) => phase.is_active && !phase.is_completed)
            const participantCount = (edition.fighters?.length || 0) + (edition.regions?.length || 0)

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
                  {/* Status badge */}
                  <Badge className="absolute top-4 left-4 z-10 bg-emerald-600">
                    <Play className="h-3 w-3 mr-1" />
                    EN COURS
                  </Badge>

                  {/* Image/Color header */}
                  <div 
                    className="h-32 bg-gradient-to-r from-emerald-600 to-emerald-400 relative overflow-hidden"
                    style={{ backgroundColor: edition.region?.color || '#10b981' }}
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
                      {edition.competition?.description || 'Compétition de lutte traditionnelle'}
                    </Typography>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      <div className="text-center">
                        <Users className="h-5 w-5 text-muted-foreground mx-auto mb-1" />
                        <Typography variant="body-sm" weight="medium">
                          {participantCount}
                        </Typography>
                        <Typography variant="caption1" theme="muted">
                          Participants
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
                        <Clock className="h-5 w-5 text-muted-foreground mx-auto mb-1" />
                        <Typography variant="body-sm" weight="medium">
                          {activePhase ? 'Phase ' + activePhase.phase_order : 'N/A'}
                        </Typography>
                        <Typography variant="caption1" theme="muted">
                          Phase actuelle
                        </Typography>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="mb-4">
                      <div className="flex justify-between text-xs mb-1">
                        <span>Progression</span>
                        <span>
                          {edition.phases?.filter((phase: Phase) => phase.is_completed).length || 0}/
                          {edition.phases?.length || 0} phases
                        </span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          whileInView={{ width: `${((edition.phases?.filter((phase: Phase) => phase.is_completed).length || 0) / (edition.phases?.length || 1)) * 100}%` }}
                          transition={{ duration: 1, ease: "easeOut" }}
                          className="h-full bg-emerald-500"
                        />
                      </div>
                    </div>

                    {/* CTA */}
                    <div className="flex gap-2">
                      <Button size="sm" className="flex-1 gap-2" asChild>
                        <Link href={`/editions/${edition.id}`}>
                          <Play className="h-4 w-4" />
                          Suivre
                        </Link>
                      </Button>
                      <Button size="sm" variant="outline" className="gap-2" asChild>
                        <Link href={`/editions/${edition.id}/phases`}>
                          <Calendar className="h-4 w-4" />
                          Phases
                        </Link>
                      </Button>
                    </div>
                  </div>

                  {/* Hover effect */}
                  <div className="absolute inset-0 border-2 border-transparent group-hover:border-emerald-500/20 rounded-2xl transition-all duration-300 pointer-events-none" />
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}