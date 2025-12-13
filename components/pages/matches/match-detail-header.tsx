// components/matches/match-detail-header.tsx
'use client'

import { motion } from 'framer-motion'
import { Typography } from '@/components/ui/typography'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Match } from '@/types'
import { 
  Target, 
  Calendar, 
  MapPin, 
  Users, 
  Trophy, 
  Clock, 
  TrendingUp,
  AlertCircle
} from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

interface MatchDetailHeaderProps {
  match: Match
}

export function MatchDetailHeader({ match }: MatchDetailHeaderProps) {
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'live':
        return { 
          label: 'EN DIRECT', 
          color: 'bg-red-100 text-red-800 border-red-200',
          icon: <div className="h-3 w-3 bg-red-500 rounded-full animate-pulse" />
        }
      case 'round_break':
        return { 
          label: 'PAUSE', 
          color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          icon: <Clock className="h-4 w-4" />
        }
      case 'scheduled':
        return { 
          label: 'PROGRAMMÉ', 
          color: 'bg-blue-100 text-blue-800 border-blue-200',
          icon: <Calendar className="h-4 w-4" />
        }
      case 'completed':
        return { 
          label: 'TERMINÉ', 
          color: 'bg-green-100 text-green-800 border-green-200',
          icon: <Trophy className="h-4 w-4" />
        }
      case 'postponed':
        return { 
          label: 'REPORTÉ', 
          color: 'bg-orange-100 text-orange-800 border-orange-200',
          icon: <AlertCircle className="h-4 w-4" />
        }
      case 'cancelled':
        return { 
          label: 'ANNULÉ', 
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          icon: <AlertCircle className="h-4 w-4" />
        }
      case 'reclamation':
        return { 
          label: 'RÉCLAMATION', 
          color: 'bg-purple-100 text-purple-800 border-purple-200',
          icon: <TrendingUp className="h-4 w-4" />
        }
      default:
        return { 
          label: status.toUpperCase(), 
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          icon: <Target className="h-4 w-4" />
        }
    }
  }

  const statusInfo = getStatusInfo(match.status)

  return (
    <header className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-secondary/10 border-b">
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-secondary/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 py-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Navigation et statut */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                {statusInfo.icon}
                <Badge variant="outline" className={statusInfo.color}>
                  {statusInfo.label}
                </Badge>
              </div>
              
              {match.match_result && (
                <Badge variant="secondary" className="gap-2">
                  <Trophy className="h-3 w-3" />
                  {match.match_result === 'fighter1_win' ? 'Victoire Lutteur 1' :
                   match.match_result === 'fighter2_win' ? 'Victoire Lutteur 2' :
                   'Match nul'}
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Typography variant="body-sm" theme="muted" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Match {match.match_number || `#${match.id}`}
              </Typography>
            </div>
          </div>

          {/* Titre principal */}
          <div className="mb-6">
            <Typography variant="h1" weight="bold" className="mb-2">
              {match.fighter1 ? `${match.fighter1.first_name} ${match.fighter1.last_name}` : 'À déterminer'}
              {' '}
              <span className="text-primary">vs</span>
              {' '}
              {match.fighter2 ? `${match.fighter2.first_name} ${match.fighter2.last_name}` : 'À déterminer'}
            </Typography>
            
            {match.sub_group?.group?.phase?.edition?.competition && (
              <Typography variant="body-lg" theme="muted">
                {match.sub_group.group.phase.edition.competition.name} • 
                Édition {match.sub_group.group.phase.edition.edition_number} • 
                Phase {match.sub_group.group.phase.name}
              </Typography>
            )}
          </div>

          {/* Métadonnées */}
          <div className="flex flex-wrap gap-6 mb-8">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <Typography variant="body-sm" theme="muted">
                  Date
                </Typography>
                <Typography variant="body-base" weight="medium">
                  {format(new Date(match.match_date), 'PPPP', { locale: fr })}
                  {match.start_time && ` • ${match.start_time.substring(0, 5)}`}
                </Typography>
              </div>
            </div>

            {match.sub_group?.region1 && match.sub_group?.region2 && (
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-muted-foreground" />
                <div>
                  <Typography variant="body-sm" theme="muted">
                    Rencontre régionale
                  </Typography>
                  <Typography variant="body-base" weight="medium">
                    {match.sub_group.region1.name} vs {match.sub_group.region2.name}
                  </Typography>
                </div>
              </div>
            )}

            {match.audience_count && (
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-muted-foreground" />
                <div>
                  <Typography variant="body-sm" theme="muted">
                    Spectateurs
                  </Typography>
                  <Typography variant="body-base" weight="medium">
                    {match.audience_count.toLocaleString()}
                  </Typography>
                </div>
              </div>
            )}

            {match.total_duration && (
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <div>
                  <Typography variant="body-sm" theme="muted">
                    Durée
                  </Typography>
                  <Typography variant="body-base" weight="medium">
                    {match.total_duration}
                  </Typography>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </header>
  )
}