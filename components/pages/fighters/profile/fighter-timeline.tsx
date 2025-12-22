// components/fighters/profile/fighter-timeline.tsx
'use client'

import { motion } from 'framer-motion'
import { Typography } from '@/components/ui/typography'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Calendar, 
  Trophy, 
  MapPin, 
  Target, 
  Swords,
  TrendingUp,
  Award,
  UserPlus
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface FighterTimelineProps {
  matches: any[]
}

export function FighterTimeline({ matches }: FighterTimelineProps) {
  if (!matches || matches.length === 0) return null

  // Créer une timeline combinant matchs, transferts, etc.
  const createTimelineItems = (matches: any[]) => {
    const timelineItems: any[] = []

    matches.forEach(match => {
      timelineItems.push({
        id: `match-${match.id}`,
        type: 'match',
        date: match.matchDate,
        title: match.status === 'completed' ? 'Match terminé' : 'Match programmé',
        description: `Contre ${match.opponent?.nickname || match.opponent?.firstName}`,
        result: match.result?.isWinner ? 'victoire' : 'défaite',
        icon: Swords,
        color: match.status === 'completed' ? 
          (match.result?.isWinner ? 'text-emerald-600' : 'text-red-600') : 'text-blue-600'
      })
    })

    // Ajouter des événements fictifs pour la démonstration
    timelineItems.push(
      {
        id: 'debut-2020',
        type: 'debut',
        date: '2020-01-15',
        title: 'Début professionnel',
        description: 'Première compétition professionnelle',
        icon: Target,
        color: 'text-purple-600'
      },
      {
        id: 'champion-2022',
        type: 'champion',
        date: '2022-05-20',
        title: 'Titre de champion',
        description: 'Championnat national 2022',
        icon: Trophy,
        color: 'text-yellow-600'
      },
      {
        id: 'transfer-2023',
        type: 'transfer',
        date: '2023-03-10',
        title: 'Transfert régional',
        description: 'Nouvelle région d\'entraînement',
        icon: MapPin,
        color: 'text-blue-600'
      }
    )

    // Trier par date
    return timelineItems.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }

  const timelineItems = createTimelineItems(matches).slice(0, 10)

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'match': return Swords
      case 'debut': return Target
      case 'champion': return Trophy
      case 'transfer': return MapPin
      default: return Calendar
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            {/* Ligne verticale */}
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border" />

            <div className="space-y-8">
              {timelineItems.map((item, index) => {
                const Icon = getEventIcon(item.type)
                const isEven = index % 2 === 0

                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: isEven ? -20 : 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className={`relative flex items-start ${isEven ? 'flex-row' : 'flex-row-reverse'}`}
                  >
                    {/* Point sur la ligne */}
                    <div className="absolute left-6 transform -translate-x-1/2 z-10">
                      <div className={`h-4 w-4 rounded-full ${item.color} bg-current/20 border-2 border-background`} />
                    </div>

                    {/* Carte d'événement */}
                    <div className={`flex-1 ${isEven ? 'ml-12' : 'mr-12'}`}>
                      <div className={`p-4 rounded-lg border bg-card ${isEven ? 'text-left' : 'text-right'}`}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className={`p-2 rounded-lg ${item.color} bg-current/10`}>
                              <Icon className="h-4 w-4" />
                            </div>
                            <Typography variant="body-base" weight="medium">
                              {item.title}
                            </Typography>
                          </div>
                          <Typography variant="body-sm" theme="muted">
                            {new Date(item.date).toLocaleDateString('fr-FR')}
                          </Typography>
                        </div>
                        
                        <Typography variant="body-sm" theme="muted" className="mb-3">
                          {item.description}
                        </Typography>

                        {item.result && (
                          <Badge 
                            variant={item.result === 'victoire' ? 'default' : 'destructive'}
                            className={isEven ? 'ml-auto' : 'mr-auto'}
                          >
                            {item.result === 'victoire' ? 'Victoire' : 'Défaite'}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </div>

          {timelineItems.length === 0 && (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
              <Typography variant="body-base" theme="muted">
                Aucun événement enregistré
              </Typography>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}