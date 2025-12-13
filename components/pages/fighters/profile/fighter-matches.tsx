// components/fighters/profile/fighter-matches.tsx
'use client'

import { motion } from 'framer-motion'
import { Typography } from '@/components/ui/typography'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Swords, 
  Calendar, 
  Target, 
  Trophy,
  Clock,
  Users,
  AlertCircle,
  TrendingUp
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'

interface FighterMatchesProps {
  matches: any
  loading: boolean
}

export function FighterMatches({ matches, loading }: FighterMatchesProps) {
  const groupedMatches = matches?.grouped || {}
  const allMatches = matches?.all || []

  const getMatchResultBadge = (match: any, fighterId: number) => {
    if (match.status !== 'completed') {
      return (
        <Badge variant="outline" className="capitalize">
          {match.status}
        </Badge>
      )
    }

    const isWinner = match.result?.isWinner
    if (isWinner === true) {
      return (
        <Badge className="bg-emerald-500/20 text-emerald-600 border-emerald-500/30">
          <Trophy className="h-3 w-3 mr-1" />
          Victoire
        </Badge>
      )
    } else if (isWinner === false) {
      return (
        <Badge variant="destructive" className="bg-red-500/20 text-red-600 border-red-500/30">
          Défaite
        </Badge>
      )
    } else {
      return (
        <Badge variant="outline">
          Nul
        </Badge>
      )
    }
  }

  const formatMatchDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!allMatches || allMatches.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Swords className="h-5 w-5 text-primary" />
            Matchs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Target className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <Typography variant="body-base" theme="muted" className="mb-4">
              Aucun match enregistré pour le moment
            </Typography>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Swords className="h-5 w-5 text-primary" />
              Matchs ({allMatches.length})
            </CardTitle>
            <Badge variant="outline" className="gap-1">
              <TrendingUp className="h-3 w-3" />
              {groupedMatches.completed?.length || 0} terminés
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid grid-cols-4 mb-6">
              <TabsTrigger value="all">
                Tous ({allMatches.length})
              </TabsTrigger>
              <TabsTrigger value="upcoming">
                À venir ({groupedMatches.scheduled?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="completed">
                Terminés ({groupedMatches.completed?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="live">
                En direct ({groupedMatches.live?.length || 0})
              </TabsTrigger>
            </TabsList>

            {['all', 'upcoming', 'completed', 'live'].map((tab) => (
              <TabsContent key={tab} value={tab} className="space-y-4">
                {(tab === 'all' ? allMatches : groupedMatches[tab] || [])
                  .slice(0, 5)
                  .map((match: any, index: number) => (
                    <motion.div
                      key={match.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      className="flex items-center gap-4 p-4 rounded-lg border hover:bg-accent/50 transition-colors"
                    >
                      {/* Date */}
                      <div className="text-center min-w-20">
                        <Typography variant="body-base" weight="bold">
                          {formatMatchDate(match.matchDate)}
                        </Typography>
                        {match.startTime && (
                          <Typography variant="body-sm" theme="muted">
                            {match.startTime}
                          </Typography>
                        )}
                      </div>

                      {/* VS */}
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-center flex-1">
                            <Typography variant="body-base" weight="medium">
                              {match.opponent?.nickname || match.opponent?.firstName}
                            </Typography>
                            <Typography variant="body-sm" theme="muted">
                              {match.opponent?.region?.name}
                            </Typography>
                          </div>
                          
                          <div className="px-4">
                            <div className="flex items-center gap-2">
                              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                <Typography variant="body-sm" weight="bold" className="text-primary">
                                  VS
                                </Typography>
                              </div>
                            </div>
                          </div>

                          <div className="text-center flex-1">
                            <Typography variant="body-base" weight="medium">
                              ?
                            </Typography>
                            <Typography variant="body-sm" theme="muted">
                              ?
                            </Typography>
                          </div>
                        </div>

                        {/* Match info */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            {getMatchResultBadge(match, 0)}
                            {match.context?.edition && (
                              <Badge variant="outline" className="text-xs">
                                {match.context.edition.theme} {match.context.edition.year}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-3">
                            {match.totalDuration && (
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3 text-muted-foreground" />
                                <Typography variant="body-sm">
                                  {match.totalDuration}
                                </Typography>
                              </div>
                            )}
                            {match.audienceCount && (
                              <div className="flex items-center gap-1">
                                <Users className="h-3 w-3 text-muted-foreground" />
                                <Typography variant="body-sm">
                                  {match.audienceCount}
                                </Typography>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Action */}
                      <Button variant="ghost" size="sm">
                        Détails
                      </Button>
                    </motion.div>
                  ))}
                
                {(tab === 'all' ? allMatches : groupedMatches[tab] || []).length > 5 && (
                  <div className="text-center pt-4">
                    <Button variant="outline">
                      Voir tous les matchs
                    </Button>
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </motion.div>
  )
}