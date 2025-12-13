// components/matches/matches-list.tsx
'use client'

import { motion } from 'framer-motion'
import { Typography } from '@/components/ui/typography'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Match } from '@/types'
import { 
  Calendar, 
  MapPin, 
  Users, 
  Target, 
  Trophy, 
  Clock, 
  Eye,
  ChevronRight,
  Swords,
  TrendingUp,
  Award
} from 'lucide-react'
import Link from 'next/link'
import { format, isToday, isTomorrow } from 'date-fns'
import { fr } from 'date-fns/locale'

interface MatchesListProps {
  matches: Match[]
}

export function MatchesList({ matches }: MatchesListProps) {
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
          color: 'bg-red-500 text-white',
          icon: <div className="h-2 w-2 bg-white rounded-full animate-pulse" />
        }
      case 'round_break':
        return { 
          label: 'PAUSE', 
          color: 'bg-yellow-500 text-white',
          icon: <Clock className="h-3 w-3" />
        }
      case 'scheduled':
      case 'upcoming':
        return { 
          label: 'PROGRAMMÉ', 
          color: 'bg-blue-500 text-white',
          icon: <Calendar className="h-3 w-3" />
        }
      case 'completed':
        return { 
          label: 'TERMINÉ', 
          color: 'bg-green-500 text-white',
          icon: <Trophy className="h-3 w-3" />
        }
      case 'postponed':
        return { 
          label: 'REPORTÉ', 
          color: 'bg-orange-500 text-white',
          icon: <Clock className="h-3 w-3" />
        }
      case 'cancelled':
        return { 
          label: 'ANNULÉ', 
          color: 'bg-gray-500 text-white',
          icon: <Target className="h-3 w-3" />
        }
      case 'reclamation':
        return { 
          label: 'RÉCLAMATION', 
          color: 'bg-purple-500 text-white',
          icon: <TrendingUp className="h-3 w-3" />
        }
      default:
        return { 
          label: status.toUpperCase(), 
          color: 'bg-gray-500 text-white',
          icon: <Target className="h-3 w-3" />
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
    <div className="space-y-4">
      {matches.map((match, index) => {
        const statusInfo = getStatusInfo(match.status)
        const matchDate = formatMatchDate(match.match_date)
        const matchTime = formatMatchTime(match.start_time)
        const hasWinner = match.winner_fighter_id !== null

        return (
          <motion.div
            key={match.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ x: 4, transition: { duration: 0.2 } }}
          >
            <div className="bg-card border rounded-xl p-4 hover:shadow-lg transition-all duration-300 group">
              <div className="flex flex-col md:flex-row gap-4">
                {/* Colonne gauche - Date et statut */}
                <div className="md:w-1/4 flex flex-col items-start md:items-center gap-3">
                  <Badge className={`${statusInfo.color} gap-2 px-3 py-1.5`}>
                    {statusInfo.icon}
                    {statusInfo.label}
                  </Badge>
                  
                  <div className="text-center">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <Typography variant="body-sm" weight="medium">
                        {matchDate}
                      </Typography>
                    </div>
                    
                    {matchTime && (
                      <div className="flex items-center gap-2 text-muted-foreground mt-1">
                        <Clock className="h-4 w-4" />
                        <Typography variant="body-sm">
                          {matchTime}
                        </Typography>
                      </div>
                    )}
                  </div>

                  {/* Audience */}
                  {match.audience_count && (
                    <div className="flex items-center gap-2 mt-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <Typography variant="body-sm" theme="muted">
                        {match.audience_count.toLocaleString()}
                      </Typography>
                    </div>
                  )}
                </div>

                <Separator orientation="vertical" className="hidden md:block h-auto" />

                {/* Colonne centrale - Participants */}
                <div className="md:w-2/4 flex-1">
                  <div className="space-y-4">
                    {/* Lutteur 1 */}
                    <div className={`flex items-center justify-between p-3 rounded-lg ${
                      match.winner_fighter_id === match.fighter1_id 
                        ? 'bg-green-50 border border-green-200' 
                        : 'bg-blue-50'
                    }`}>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <Typography variant="body-base" weight="bold" className="text-blue-600">
                            {match.fighter1?.first_name?.charAt(0) || '?'}
                          </Typography>
                        </div>
                        <div>
                          <Typography variant="body-base" weight="medium">
                            {match.fighter1 ? `${match.fighter1.first_name} ${match.fighter1.last_name}` : 'À déterminer'}
                            {match.fighter1?.nickname && (
                              <Typography variant="body-sm" theme="muted" className="ml-2">
                                "{match.fighter1.nickname}"
                              </Typography>
                            )}
                          </Typography>
                          <div className="flex items-center gap-4 mt-1">
                            {match.fighter1?.ranking && (
                              <Typography variant="body-sm" theme="muted">
                                Classement: {match.fighter1.ranking}
                              </Typography>
                            )}
                            {match.fighter1?.region && (
                              <Typography variant="body-sm" theme="muted" className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {match.fighter1.region.name}
                              </Typography>
                            )}
                          </div>
                        </div>
                      </div>
                      {hasWinner && (
                        <div>
                          {match.winner_fighter_id === match.fighter1_id ? (
                            <Badge variant="outline" className="gap-1 bg-green-100 border-green-300">
                              <Trophy className="h-3 w-3 text-yellow-600" />
                              Vainqueur
                            </Badge>
                          ) : (
                            <Typography variant="body-sm" theme="muted">
                              Perdant
                            </Typography>
                          )}
                        </div>
                      )}
                    </div>

                    {/* VS */}
                    <div className="flex justify-center">
                      <div className="inline-flex items-center gap-2 px-4 py-1 bg-muted rounded-full">
                        <Swords className="h-4 w-4" />
                        <Typography variant="body-sm" weight="medium">
                          VS
                        </Typography>
                      </div>
                    </div>

                    {/* Lutteur 2 */}
                    <div className={`flex items-center justify-between p-3 rounded-lg ${
                      match.winner_fighter_id === match.fighter2_id 
                        ? 'bg-green-50 border border-green-200' 
                        : 'bg-red-50'
                    }`}>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                          <Typography variant="body-base" weight="bold" className="text-red-600">
                            {match.fighter2?.first_name?.charAt(0) || '?'}
                          </Typography>
                        </div>
                        <div>
                          <Typography variant="body-base" weight="medium">
                            {match.fighter2 ? `${match.fighter2.first_name} ${match.fighter2.last_name}` : 'À déterminer'}
                            {match.fighter2?.nickname && (
                              <Typography variant="body-sm" theme="muted" className="ml-2">
                                "{match.fighter2.nickname}"
                              </Typography>
                            )}
                          </Typography>
                          <div className="flex items-center gap-4 mt-1">
                            {match.fighter2?.ranking && (
                              <Typography variant="body-sm" theme="muted">
                                Classement: {match.fighter2.ranking}
                              </Typography>
                            )}
                            {match.fighter2?.region && (
                              <Typography variant="body-sm" theme="muted" className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {match.fighter2.region.name}
                              </Typography>
                            )}
                          </div>
                        </div>
                      </div>
                      {hasWinner && (
                        <div>
                          {match.winner_fighter_id === match.fighter2_id ? (
                            <Badge variant="outline" className="gap-1 bg-green-100 border-green-300">
                              <Trophy className="h-3 w-3 text-yellow-600" />
                              Vainqueur
                            </Badge>
                          ) : (
                            <Typography variant="body-sm" theme="muted">
                              Perdant
                            </Typography>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <Separator orientation="vertical" className="hidden md:block h-auto" />

                {/* Colonne droite - Actions et infos */}
                <div className="md:w-1/4 flex flex-col justify-between">
                  {/* Informations de contexte */}
                  <div className="space-y-3">
                    {match.sub_group && (
                      <>
                        <div>
                          <Typography variant="body-sm" weight="medium" className="mb-1">
                            Rencontre
                          </Typography>
                          <Typography variant="body-sm" theme="muted">
                            {match.sub_group.name}
                          </Typography>
                        </div>
                        
                        <div>
                          <Typography variant="body-sm" weight="medium" className="mb-1">
                            Groupe
                          </Typography>
                          <Typography variant="body-sm" theme="muted">
                            {match.sub_group.group?.name}
                          </Typography>
                        </div>

                        {match.sub_group.region1 && match.sub_group.region2 && (
                          <div>
                            <Typography variant="body-sm" weight="medium" className="mb-1">
                              Régions
                            </Typography>
                            <Typography variant="body-sm" theme="muted">
                              {match.sub_group.region1.name} vs {match.sub_group.region2.name}
                            </Typography>
                          </div>
                        )}
                      </>
                    )}

                    {/* Résultat */}
                    {match.match_result && (
                      <div>
                        <Typography variant="body-sm" weight="medium" className="mb-1">
                          Résultat
                        </Typography>
                        <Typography variant="body-sm" theme="muted">
                          {match.match_result === 'fighter1_win' ? 'Victoire Lutteur 1' :
                           match.match_result === 'fighter2_win' ? 'Victoire Lutteur 2' :
                           'Match nul'}
                        </Typography>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="mt-4">
                    <Button className="w-full gap-2" asChild>
                      <Link href={`/matches/${match.id}`}>
                        <Eye className="h-4 w-4" />
                        Voir détails
                        <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}