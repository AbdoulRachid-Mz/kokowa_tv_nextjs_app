// components/competitions/components/competition-card.tsx
'use client'

import { motion } from 'framer-motion'
import { Typography } from '@/components/ui/typography'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Trophy, 
  Calendar, 
  MapPin, 
  Users, 
  ChevronRight,
  Play,
  Clock,
  Award
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

interface CompetitionCardProps {
  competition: any
  viewMode: 'grid' | 'list'
}

export function CompetitionCard({ competition, viewMode }: CompetitionCardProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ongoing':
        return { variant: 'destructive' as const, label: 'EN DIRECT', icon: Play }
      case 'upcoming':
        return { variant: 'secondary' as const, label: 'À VENIR', icon: Clock }
      case 'completed':
        return { variant: 'outline' as const, label: 'TERMINÉ', icon: Award }
      default:
        return { variant: 'secondary' as const, label: status.toUpperCase(), icon: Trophy }
    }
  }

  const statusBadge = getStatusBadge(competition.status)
  const StatusIcon = statusBadge.icon

  if (viewMode === 'list') {
    return (
      <motion.div
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        className="group"
      >
        <div className="relative rounded-xl border bg-card p-6 hover:shadow-lg transition-all duration-300">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            {/* Image */}
            <div className="relative h-32 w-full md:w-48 rounded-lg overflow-hidden">
              {competition.featured_image ? (
                <Image
                  src={competition.featured_image}
                  alt={competition.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                  <Trophy className="h-12 w-12 text-primary/50" />
                </div>
              )}
              <Badge variant={statusBadge.variant} className="absolute top-2 left-2">
                <StatusIcon className="h-3 w-3 mr-1" />
                {statusBadge.label}
              </Badge>
            </div>

            {/* Content */}
            <div className="flex-1">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <Typography variant="h4" weight="bold" className="mb-1">
                    {competition.name}
                  </Typography>
                  <Typography variant="body-sm" theme="muted" className="line-clamp-2 mb-3">
                    {competition.description || 'Pas de description disponible'}
                  </Typography>
                </div>
                <Button size="sm" variant="ghost" className="opacity-0 group-hover:opacity-100 transition-opacity" asChild>
                  <Link href={`/competitions/${competition.slug || competition.id}`}>
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>

              {/* Details */}
              <div className="flex flex-wrap gap-4">
                {competition.editions && competition.editions.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <Typography variant="body-sm">
                      {competition.editions.length} édition{competition.editions.length > 1 ? 's' : ''}
                    </Typography>
                  </div>
                )}
                
                {competition.region && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <Typography variant="body-sm">
                      {competition.region.name}
                    </Typography>
                  </div>
                )}
                
                {/* Last edition */}
                {competition.editions?.[0] && (
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <Typography variant="body-sm">
                      Édition {competition.editions[0].year}
                    </Typography>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    )
  }

  // Grid View
  return (
    <motion.div
      whileHover={{ y: -8 }}
      whileTap={{ scale: 0.98 }}
      className="group"
    >
      <div className="relative h-full rounded-2xl border bg-card overflow-hidden hover:shadow-xl transition-all duration-300">
        {/* Image */}
        <div className="relative h-48">
          {competition.featured_image ? (
            <Image
              src={competition.featured_image}
              alt={competition.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
              <Trophy className="h-16 w-16 text-primary/50" />
            </div>
          )}
          
          {/* Status badge */}
          <Badge variant={statusBadge.variant} className="absolute top-3 left-3">
            <StatusIcon className="h-3 w-3 mr-1" />
            {statusBadge.label}
          </Badge>
          
          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>

        {/* Content */}
        <div className="p-6">
          <Typography variant="h5" weight="bold" className="mb-2 line-clamp-1">
            {competition.name}
          </Typography>
          
          <Typography variant="body-sm" theme="muted" className="mb-4 line-clamp-2">
            {competition.description || 'Pas de description disponible'}
          </Typography>

          {/* Details */}
          <div className="space-y-3 mb-6">
            {competition.editions && competition.editions.length > 0 && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <Typography variant="body-sm">
                  {competition.editions.length} édition{competition.editions.length > 1 ? 's' : ''}
                </Typography>
              </div>
            )}
            
            {competition.region && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <Typography variant="body-sm" className="line-clamp-1">
                  {competition.region.name}
                </Typography>
              </div>
            )}
          </div>

          {/* Action */}
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" className="gap-2" asChild>
              <Link href={`/competitions/${competition.slug || competition.id}`}>
                Voir détails
                <ChevronRight className="h-4 w-4" />
              </Link>
            </Button>
            
            {competition.editions?.[0] && (
              <Typography variant="body-sm" theme="muted">
                Dernière: {competition.editions[0].year}
              </Typography>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}