// components/competitions/components/edition-card.tsx
'use client'

import { motion } from 'framer-motion'
import { Typography } from '@/components/ui/typography'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Calendar, 
  Users, 
  MapPin, 
  Trophy,
  Award,
  ChevronRight,
  Swords
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

interface EditionCardProps {
  edition: any
}

export function EditionCard({ edition }: EditionCardProps) {
  const getEditionStatus = () => {
    const now = new Date()
    const start = new Date(edition.start_date)
    const end = new Date(edition.end_date)
    
    if (now < start) return { label: 'À venir', variant: 'secondary' as const }
    if (now >= start && now <= end) return { label: 'En cours', variant: 'destructive' as const }
    return { label: 'Terminée', variant: 'outline' as const }
  }

  const status = getEditionStatus()

  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="group"
    >
      <div className="relative h-full rounded-2xl border bg-card overflow-hidden hover:shadow-xl transition-all duration-300">
        {/* Header */}
        <div className="p-6 border-b">
          <div className="flex items-start justify-between mb-4">
            <div>
              <Badge variant={status.variant} className="mb-2">
                {status.label}
              </Badge>
              <Typography variant="h5" weight="bold" className="mb-1">
                Édition {edition.edition_number} - {edition.year}
              </Typography>
              <Typography variant="body-sm" theme="muted" className="line-clamp-2">
                {edition.theme || `Édition ${edition.year}`}
              </Typography>
            </div>
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Trophy className="h-6 w-6 text-primary" />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Dates */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <Typography variant="body-sm" theme="muted" className="mb-1">
                Début
              </Typography>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <Typography variant="body-sm" weight="medium">
                  {new Date(edition.start_date).toLocaleDateString('fr-FR')}
                </Typography>
              </div>
            </div>
            <div>
              <Typography variant="body-sm" theme="muted" className="mb-1">
                Fin
              </Typography>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <Typography variant="body-sm" weight="medium">
                  {new Date(edition.end_date).toLocaleDateString('fr-FR')}
                </Typography>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="space-y-3 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <Typography variant="body-sm">
                  Participants
                </Typography>
              </div>
              <Typography variant="body-sm" weight="medium">
                {edition.total_participants || 0}
              </Typography>
            </div>
            
            {edition.regions && edition.regions.length > 0 && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <Typography variant="body-sm">
                    Régions
                  </Typography>
                </div>
                <Typography variant="body-sm" weight="medium">
                  {edition.regions.length}
                </Typography>
              </div>
            )}
            
            {edition.phases && edition.phases.length > 0 && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Swords className="h-4 w-4 text-muted-foreground" />
                  <Typography variant="body-sm">
                    Phases
                  </Typography>
                </div>
                <Typography variant="body-sm" weight="medium">
                  {edition.phases.length}
                </Typography>
              </div>
            )}
          </div>

          {/* Winner */}
          {edition.winner_fighter && (
            <div className="mb-6 p-4 rounded-lg bg-primary/5 border border-primary/10">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Award className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <Typography variant="body-sm" theme="muted" className="mb-1">
                    Vainqueur
                  </Typography>
                  <Typography variant="body-base" weight="medium">
                    {edition.winner_fighter.first_name} {edition.winner_fighter.last_name}
                  </Typography>
                </div>
              </div>
            </div>
          )}

          {/* Action */}
          <Button variant="outline" className="w-full gap-2 group-hover:bg-primary group-hover:text-primary-foreground transition-colors" asChild>
            <Link href={`/editions/${edition.id}`}>
              Voir détails
              <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
        </div>
      </div>
    </motion.div>
  )
}