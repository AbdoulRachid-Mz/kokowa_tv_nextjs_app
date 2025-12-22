// components/matches/match-timeline.tsx
'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Typography } from '@/components/ui/typography'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Match } from '@/types'
import { 
  Clock, 
  Target, 
  AlertTriangle, 
  Trophy, 
  Flag, 
  Users,
  Zap,
  Shield,
  Heart,
  Video
} from 'lucide-react'

interface MatchTimelineProps {
  match: Match
}

export function MatchTimeline({ match }: MatchTimelineProps) {
  const [activeTab, setActiveTab] = useState('events')

  // Générer une timeline simulée basée sur le statut du match
  const generateTimeline = () => {
    const events = []
    
    // Événements de base pour tous les matchs
    events.push({
      time: '00:00',
      event: 'Début du match',
      type: 'start',
      icon: Flag,
      color: 'text-green-600 bg-green-100'
    })

    // Si le match est terminé ou en cours, ajouter des événements
    if (match.status === 'completed' || match.status === 'live') {
      events.push(
        {
          time: '02:15',
          event: 'Premier contact - échange rapide',
          type: 'action',
          icon: Zap,
          color: 'text-blue-600 bg-blue-100',
          fighter: 1
        },
        {
          time: '05:30',
          event: 'Prise réussie par le lutteur 2',
          type: 'action',
          icon: Target,
          color: 'text-red-600 bg-red-100',
          fighter: 2
        },
        {
          time: '08:45',
          event: 'Carton jaune - prise interdite',
          type: 'warning',
          icon: AlertTriangle,
          color: 'text-yellow-600 bg-yellow-100',
          fighter: 1
        },
        {
          time: '12:20',
          event: 'Contre-attaque réussie',
          type: 'action',
          icon: Shield,
          color: 'text-purple-600 bg-purple-100',
          fighter: 1
        },
        {
          time: '15:10',
          event: 'Pause médicale',
          type: 'break',
          icon: Heart,
          color: 'text-orange-600 bg-orange-100'
        }
      )
    }

    // Si le match est terminé, ajouter la fin
    if (match.status === 'completed') {
      events.push({
        time: match.total_duration || '18:45',
        event: match.match_result === 'fighter1_win' 
          ? `Victoire de ${match.fighter1?.first_name}`
          : match.match_result === 'fighter2_win'
          ? `Victoire de ${match.fighter2?.first_name}`
          : 'Match nul',
        type: 'result',
        icon: Trophy,
        color: 'text-yellow-600 bg-yellow-100'
      })
    }

    return events
  }

  const timelineEvents = generateTimeline()
  const cards = match.cards || []

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <CardTitle>Chronologie du match</CardTitle>
            <CardDescription>
              Événements et moments clés du match
            </CardDescription>
          </div>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
            <TabsList className="grid grid-cols-2">
              <TabsTrigger value="events">
                <Clock className="h-4 w-4 mr-2" />
                Événements
              </TabsTrigger>
              <TabsTrigger value="cards">
                <AlertTriangle className="h-4 w-4 mr-2" />
                Cartons ({cards.length})
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent>
        <TabsContent value="events" className="mt-0">
          <ScrollArea className="h-[500px] pr-4">
            <div className="relative">
              {/* Ligne de temps verticale */}
              <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-muted" />

              {timelineEvents.map((event, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="relative mb-8"
                >
                  {/* Point sur la timeline */}
                  <div className={`absolute left-4 w-4 h-4 rounded-full ${event.color.split(' ')[1]} border-4 border-background`}>
                    <event.icon className="h-2 w-2 text-white" />
                  </div>

                  {/* Contenu de l'événement */}
                  <div className="ml-12">
                    <Card className="border-l-4" style={{ borderLeftColor: event.color.split(' ')[0].split('-')[1] }}>
                      <CardContent className="p-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${event.color}`}>
                              <event.icon className="h-4 w-4" />
                            </div>
                            <div>
                              <Typography variant="body-base" weight="medium">
                                {event.event}
                              </Typography>
                              {event.fighter && (
                                <Typography variant="body-sm" theme="muted">
                                  Lutteur {event.fighter}
                                </Typography>
                              )}
                            </div>
                          </div>
                          <Badge variant="outline" className="gap-2">
                            <Clock className="h-3 w-3" />
                            {event.time}
                          </Badge>
                        </div>

                        {/* Détails supplémentaires pour certains événements */}
                        {event.type === 'action' && (
                          <div className="mt-3 p-3 bg-muted/50 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <Users className="h-4 w-4 text-muted-foreground" />
                              <Typography variant="body-sm" weight="medium">
                                Impact sur le match
                              </Typography>
                            </div>
                            <Typography variant="body-sm" theme="muted">
                              Cette action a changé la dynamique du match en faveur du lutteur {event.fighter}.
                            </Typography>
                          </div>
                        )}

                        {event.type === 'warning' && (
                          <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <AlertTriangle className="h-4 w-4 text-yellow-600" />
                              <Typography variant="body-sm" weight="medium" className="text-yellow-800">
                                Avertissement officiel
                              </Typography>
                            </div>
                            <Typography variant="body-sm" className="text-yellow-700">
                              Le lutteur reçoit un avertissement pour une prise interdite selon l'article 12.4 du règlement.
                            </Typography>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </motion.div>
              ))}
            </div>
          </ScrollArea>

          {/* Vidéos des moments clés (si disponibles) */}
          {match.video_url && (
            <div className="mt-6">
              <Typography variant="h5" className="mb-4 flex items-center gap-2">
                <Video className="h-5 w-5" />
                Moments clés en vidéo
              </Typography>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {timelineEvents
                  .filter(event => event.type === 'action')
                  .slice(0, 2)
                  .map((event, index) => (
                    <Card key={index} className="overflow-hidden">
                      <div className="aspect-video bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
                        <Button variant="ghost" size="icon" className="h-12 w-12 rounded-full bg-background/50">
                          <Video className="h-6 w-6" />
                        </Button>
                      </div>
                      <CardContent className="p-4">
                        <Typography variant="body-sm" weight="medium">
                          {event.event}
                        </Typography>
                        <Typography variant="body-sm" theme="muted">
                          {event.time} • Lutteur {event.fighter}
                        </Typography>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="cards" className="mt-0">
          {cards.length === 0 ? (
            <div className="text-center py-12">
              <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <Typography variant="h4" className="mb-2">
                Aucun carton
              </Typography>
              <Typography variant="body-base" theme="muted">
                Aucun carton n'a été donné pendant ce match.
              </Typography>
            </div>
          ) : (
            <ScrollArea className="h-[500px]">
              <div className="space-y-4">
                {cards.map((card, index) => (
                  <motion.div
                    key={card.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className={card.card_type === 'red' 
                      ? 'border-red-200 bg-red-50' 
                      : 'border-yellow-200 bg-yellow-50'
                    }>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3">
                            <div className={`p-3 rounded-lg ${
                              card.card_type === 'red' 
                                ? 'bg-red-100 text-red-600' 
                                : 'bg-yellow-100 text-yellow-600'
                            }`}>
                              <AlertTriangle className="h-6 w-6" />
                            </div>
                            <div>
                              <Typography variant="body-base" weight="medium" className="mb-1">
                                Carton {card.card_type === 'red' ? 'Rouge' : 'Jaune'}
                              </Typography>
                              <Typography variant="body-sm" className="mb-2">
                                {card.fighter?.first_name} {card.fighter?.last_name}
                              </Typography>
                              <Typography variant="body-sm" theme="muted">
                                {card.card_reason}
                              </Typography>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge variant={card.card_type === 'red' ? 'destructive' : 'outline'} className="mb-2">
                              {card.minute_given || 'Temps non spécifié'}
                            </Badge>
                            <Typography variant="body-sm" theme="muted">
                              {card.is_cancelled ? 'Carton annulé' : 'Carton actif'}
                            </Typography>
                          </div>
                        </div>

                        {/* Conséquences du carton */}
                        {!card.is_cancelled && (
                          <div className="mt-4 p-3 bg-background rounded-lg">
                            <Typography variant="body-sm" weight="medium" className="mb-2">
                              Conséquences :
                            </Typography>
                            <ul className="space-y-1">
                              {card.card_type === 'yellow' && (
                                <>
                                  <li className="flex items-center gap-2">
                                    <div className="h-1.5 w-1.5 rounded-full bg-yellow-500" />
                                    <Typography variant="body-sm">
                                      Avertissement officiel
                                    </Typography>
                                  </li>
                                  <li className="flex items-center gap-2">
                                    <div className="h-1.5 w-1.5 rounded-full bg-yellow-500" />
                                    <Typography variant="body-sm">
                                      Prochaine faute = carton rouge
                                    </Typography>
                                  </li>
                                </>
                              )}
                              {card.card_type === 'red' && (
                                <>
                                  <li className="flex items-center gap-2">
                                    <div className="h-1.5 w-1.5 rounded-full bg-red-500" />
                                    <Typography variant="body-sm">
                                      Exclusion immédiate du match
                                    </Typography>
                                  </li>
                                  <li className="flex items-center gap-2">
                                    <div className="h-1.5 w-1.5 rounded-full bg-red-500" />
                                    <Typography variant="body-sm">
                                      Suspension possible pour le prochain match
                                    </Typography>
                                  </li>
                                </>
                              )}
                            </ul>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </ScrollArea>
          )}

          {/* Résumé des cartons */}
          {cards.length > 0 && (
            <Card className="mt-6">
              <CardHeader className="pb-3">
                <CardTitle>Résumé des cartons</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="h-8 w-8 rounded-full bg-yellow-100 flex items-center justify-center">
                        <Typography variant="body-base" weight="bold" className="text-yellow-800">
                          {cards.filter(c => c.card_type === 'yellow' && !c.is_cancelled).length}
                        </Typography>
                      </div>
                      <Typography variant="body-base" weight="medium" className="text-yellow-800">
                        Cartons jaunes
                      </Typography>
                    </div>
                    <Typography variant="body-sm" className="text-yellow-700">
                      {cards.filter(c => c.card_type === 'yellow' && !c.is_cancelled).length} avertissement(s)
                    </Typography>
                  </div>

                  <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
                        <Typography variant="body-base" weight="bold" className="text-red-800">
                          {cards.filter(c => c.card_type === 'red' && !c.is_cancelled).length}
                        </Typography>
                      </div>
                      <Typography variant="body-base" weight="medium" className="text-red-800">
                        Cartons rouges
                      </Typography>
                    </div>
                    <Typography variant="body-sm" className="text-red-700">
                      {cards.filter(c => c.card_type === 'red' && !c.is_cancelled).length} expulsion(s)
                    </Typography>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </CardContent>
    </Card>
  )
}