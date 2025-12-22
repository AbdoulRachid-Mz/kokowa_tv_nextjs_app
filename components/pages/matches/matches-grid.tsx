// components/matches/matches-grid.tsx
'use client'

import { motion } from 'framer-motion'
import { Typography } from '@/components/ui/typography'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Match } from '@/types'
import { 
  Calendar, 
  MapPin, 
  Users, 
  Target, 
  Trophy, 
  Clock, 
  Eye,
  Swords,
  Shield,
  TrendingUp
} from 'lucide-react'
import Link from 'next/link'
import { format, formatDistance, isToday, isTomorrow, isPast } from 'date-fns'
import { fr } from 'date-fns/locale'

interface MatchesGridProps {
  matches: Match[]
}

export function MatchesGrid({ matches }: MatchesGridProps) {
  if (matches.length === 0) {
    return (
      <div className="text-center py-12">
        <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <Typography variant="h4" className="mb-2">
          Aucun match trouvé
        </Typography>
        <Typography variant="body-base" theme="muted">
          Aucun match ne correspond aux filtres sélectionnés.
        </Typography>
      </div>
    )
  }

  // Fonction pour obtenir le statut stylisé
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'live':
        return { 
          label: 'EN DIRECT', 
          color: 'bg-red-100 text-red-800 border-red-200',
          icon: <div className="h-2 w-2 bg-red-500 rounded-full animate-pulse" />
        }
      case 'round_break':
        return { 
          label: 'PAUSE', 
          color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          icon: <Clock className="h-3 w-3" />
        }
      case 'scheduled':
      case 'upcoming':
        return { 
          label: 'PROGRAMMÉ', 
          color: 'bg-blue-100 text-blue-800 border-blue-200',
          icon: <Calendar className="h-3 w-3" />
        }
      case 'completed':
        return { 
          label: 'TERMINÉ', 
          color: 'bg-green-100 text-green-800 border-green-200',
          icon: <Trophy className="h-3 w-3" />
        }
      case 'postponed':
        return { 
          label: 'REPORTÉ', 
          color: 'bg-orange-100 text-orange-800 border-orange-200',
          icon: <Clock className="h-3 w-3" />
        }
      case 'cancelled':
        return { 
          label: 'ANNULÉ', 
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          icon: <Shield className="h-3 w-3" />
        }
      case 'reclamation':
        return { 
          label: 'RÉCLAMATION', 
          color: 'bg-purple-100 text-purple-800 border-purple-200',
          icon: <TrendingUp className="h-3 w-3" />
        }
      default:
        return { 
          label: status.toUpperCase(), 
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          icon: null
        }
    }
  }

  // Formater la date
  const formatMatchDate = (dateString: string) => {
    const date = new Date(dateString)
    
    if (isToday(date)) {
      return "Aujourd'hui"
    } else if (isTomorrow(date)) {
      return "Demain"
    } else {
      return format(date, 'EEEE d MMMM', { locale: fr })
    }
  }

  // Formater l'heure
  const formatMatchTime = (timeString?: string) => {
    if (!timeString) return ''
    return timeString.substring(0, 5)
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {matches.map((match, index) => {
        const statusInfo = getStatusInfo(match.status)
        const matchDate = formatMatchDate(match.match_date)
        const matchTime = formatMatchTime(match.start_time)

        return (
          <motion.div
            key={match.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
          >
            <Card className="h-full overflow-hidden border-2 hover:border-primary/20 transition-all duration-300">
              {/* Header avec statut */}
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      {statusInfo.icon}
                      <Badge variant="outline" className={statusInfo.color}>
                        {statusInfo.label}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg">
                      Match {match.match_number || `#${match.id}`}
                    </CardTitle>
                  </div>
                  {match.audience_count && (
                    <div className="text-right">
                      <Typography variant="body-sm" theme="muted" className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {match.audience_count}
                      </Typography>
                    </div>
                  )}
                </div>
                
                <CardDescription className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {matchDate}
                  {matchTime && (
                    <>
                      <span>•</span>
                      <Clock className="h-4 w-4" />
                      {matchTime}
                    </>
                  )}
                </CardDescription>
              </CardHeader>

              {/* Contenu */}
              <CardContent className="pb-4">
                {/* Participants */}
                <div className="space-y-4">
                  {/* Lutteur 1 */}
                  <div className={`p-3 rounded-lg ${match.fighter1 ? 'bg-blue-50' : 'bg-gray-50'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <Typography variant="body-base" weight="bold" className="text-blue-600">
                            {match.fighter1?.first_name?.charAt(0) || '?'}
                          </Typography>
                        </div>
                        <div>
                          <Typography variant="body-base" weight="medium">
                            {match.fighter1 ? `${match.fighter1.first_name} ${match.fighter1.last_name}` : 'À déterminer'}
                          </Typography>
                          {match.fighter1?.ranking && (
                            <Typography variant="body-sm" theme="muted">
                              Classement: {match.fighter1.ranking}
                            </Typography>
                          )}
                        </div>
                      </div>
                      {match.fighter1 && match.winner_fighter_id === match.fighter1.id && (
                        <Trophy className="h-5 w-5 text-yellow-500" />
                      )}
                    </div>
                  </div>

                  {/* VS */}
                  <div className="text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-1 bg-muted rounded-full">
                      <Swords className="h-4 w-4" />
                      <Typography variant="body-sm" weight="medium">
                        VS
                      </Typography>
                    </div>
                  </div>

                  {/* Lutteur 2 */}
                  <div className={`p-3 rounded-lg ${match.fighter2 ? 'bg-red-50' : 'bg-gray-50'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                          <Typography variant="body-base" weight="bold" className="text-red-600">
                            {match.fighter2?.first_name?.charAt(0) || '?'}
                          </Typography>
                        </div>
                        <div>
                          <Typography variant="body-base" weight="medium">
                            {match.fighter2 ? `${match.fighter2.first_name} ${match.fighter2.last_name}` : 'À déterminer'}
                          </Typography>
                          {match.fighter2?.ranking && (
                            <Typography variant="body-sm" theme="muted">
                              Classement: {match.fighter2.ranking}
                            </Typography>
                          )}
                        </div>
                      </div>
                      {match.fighter2 && match.winner_fighter_id === match.fighter2.id && (
                        <Trophy className="h-5 w-5 text-yellow-500" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Informations de contexte */}
                {match.sub_group && (
                  <div className="mt-4 pt-4 border-t space-y-2">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <Typography variant="body-sm">
                        {match.sub_group.region1?.name} vs {match.sub_group.region2?.name}
                      </Typography>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <Typography variant="body-sm">
                        {match.sub_group.group?.phase?.edition?.competition?.name} • 
                        Phase {match.sub_group.group?.phase?.phase_order}
                      </Typography>
                    </div>
                  </div>
                )}
              </CardContent>

              {/* Footer */}
              <CardFooter className="border-t pt-4">
                <Button className="w-full gap-2" asChild>
                  <Link href={`/matches/${match.id}`}>
                    <Eye className="h-4 w-4" />
                    Voir les détails
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        )
      })}
    </div>
  )
}