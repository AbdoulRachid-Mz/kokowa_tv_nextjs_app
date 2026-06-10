'use client'

import { motion } from 'framer-motion'
import { Typography } from '@/components/ui/typography'
import { Button } from '@/components/ui/button'
import { Play, Clock, MapPin } from 'lucide-react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { useState } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { useLiveMatches } from '@/hooks/use-matches'

export function LiveMatchesSection() {
  const [activeMatch, setActiveMatch] = useState(0)
  const { matches: dbMatches, isLoading } = useLiveMatches({ limit: 10 })
  const isListening = true; // Firestore Realtime acts as constant listen channel

  // Fusionner avec le statut live étendu (reclamation, round_break)
  const matches = dbMatches.map(m => ({
    ...m,
    is_actually_live: m.status === 'live' || m.status === 'round_break' || m.status === 'reclamation'
  })).filter(m => m.is_actually_live);

  if (isLoading) {
    return (
      <section className="py-20 bg-gradient-to-b from-background via-background to-primary/5">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
             <Skeleton className="h-8 w-48 mx-auto mb-4" />
             <Skeleton className="h-12 w-96 mx-auto mb-4" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-64 rounded-2xl" />)}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 bg-gradient-to-b from-background via-background to-primary/5">
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 mb-4">
            <div className={`h-3 w-3 rounded-full ${isListening ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
            <Typography variant="body-base" weight="medium" className={isListening ? "text-green-600" : "text-gray-500"}>
              {isListening ? 'FIRESTORE REALTIME' : 'HORS LIGNE'}
            </Typography>
          </div>
          <Typography variant="h2" weight="bold" className="mb-4">
            Suivez l'Action en{' '}
            <span className="text-primary">Temps Réel</span>
          </Typography>
          <Typography variant="body-lg" theme="muted" className="max-w-2xl mx-auto">
            Ne manquez aucun moment des compétitions avec notre système de suivi 
            en direct et nos statistiques en temps réel.
          </Typography>
        </motion.div>

        {/* Live matches */}
        <div className="max-w-4xl mx-auto">
          {matches.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              {matches.map((match, index) => (
                <motion.div
                  key={match.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  onClick={() => setActiveMatch(index)}
                  className={`relative cursor-pointer ${
                    activeMatch === index ? 'ring-2 ring-primary' : ''
                  }`}
                >
                  <div className="relative rounded-2xl border bg-card p-6 hover:shadow-lg transition-all duration-300">
                    <Badge variant="destructive" className="absolute -top-2 -right-2">
                      LIVE
                    </Badge>

                    <div className="space-y-6">
                      {/* Fighter 1 */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden">
                            {match.fighter1?.profile_image ? (
                              <img src={match.fighter1.profile_image} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <Typography variant="body-base" weight="bold" className="text-blue-600">
                                {match.fighter1?.first_name?.charAt(0) || '?'}
                              </Typography>
                            )}
                          </div>
                          <div>
                            <Typography variant="body-base" weight="medium" className="line-clamp-1">
                              {match.fighter1?.first_name} {match.fighter1?.last_name}
                            </Typography>
                            <Typography variant="body-sm" theme="muted">
                              {match.fighter1?.nickname || 'Lutteur'}
                            </Typography>
                          </div>
                        </div>
                        <Typography variant="h4" weight="bold" className="text-blue-600">
                          {match.sub_group?.score_region1 ?? 0}
                        </Typography>
                      </div>

                      {/* VS */}
                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center">
                          <span className="bg-background px-4 text-sm text-muted-foreground">
                            VS
                          </span>
                        </div>
                      </div>

                      {/* Fighter 2 */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center overflow-hidden">
                            {match.fighter2?.profile_image ? (
                              <img src={match.fighter2.profile_image} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <Typography variant="body-base" weight="bold" className="text-red-600">
                                {match.fighter2?.first_name?.charAt(0) || '?'}
                              </Typography>
                            )}
                          </div>
                          <div>
                            <Typography variant="body-base" weight="medium" className="line-clamp-1">
                              {match.fighter2?.first_name} {match.fighter2?.last_name}
                            </Typography>
                            <Typography variant="body-sm" theme="muted">
                              {match.fighter2?.nickname || 'Lutteur'}
                            </Typography>
                          </div>
                        </div>
                        <Typography variant="h4" weight="bold" className="text-red-600">
                          {match.sub_group?.score_region2 ?? 0}
                        </Typography>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-6 pt-4 border-t">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <Typography variant="body-sm">
                            {match.total_duration || '00:00'}
                          </Typography>
                        </div>
                      </div>
                      <Button size="sm" variant="ghost" className="gap-2" asChild>
                        <Link href={`/matches/${match.id}`}>
                          <Play className="h-4 w-4" />
                          Voir
                        </Link>
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 border-2 border-dashed rounded-3xl mb-8">
              <Typography variant="body-lg" theme="muted">
                Aucun match en direct pour le moment.
              </Typography>
              <Button variant="link" asChild className="mt-2">
                <Link href="/matches">Voir le calendrier</Link>
              </Button>
            </div>
          )}

          {/* Featured match */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="relative rounded-3xl overflow-hidden border shadow-2xl"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20" />
            <div className="relative p-8">
              <div className="grid lg:grid-cols-2 gap-8 items-center">
                <div>
                  <Badge variant="destructive" className="mb-4">
                    MATCH À LA UNE
                  </Badge>
                  <Typography variant="h3" weight="bold" className="mb-4">
                    Suivi Temps Réel Activé
                  </Typography>
                  <Typography variant="body-lg" theme="muted" className="mb-6">
                    Notre nouvelle architecture Firestore Realtime vous permet de suivre 
                    chaque seconde du combat avec une latence minimale.
                  </Typography>
                  <div className="flex items-center gap-4 mb-6">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <Typography variant="body-base">
                        Firestore Sync: Actif
                      </Typography>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <Button size="lg" className="gap-2" asChild>
                      <Link href="/matches">
                        <Play className="h-4 w-4" />
                        Regarder en Direct
                      </Link>
                    </Button>
                  </div>
                </div>
                <div className="relative">
                  <div className="aspect-video rounded-xl overflow-hidden bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
                    <div className="text-center">
                      <div className="h-24 w-24 mx-auto mb-4 relative">
                        <div className={`absolute inset-0 rounded-full animate-ping ${isListening ? 'bg-green-500/20' : 'bg-gray-400/20'}`} />
                        <div className={`relative h-24 w-24 rounded-full flex items-center justify-center ${isListening ? 'bg-green-500' : 'bg-gray-400'}`}>
                          <Play className="h-12 w-12 text-white" fill="white" />
                        </div>
                      </div>
                      <Typography variant="h4" weight="bold">
                        {isListening ? 'Connecté au Flux Firestore' : 'Déconnecté'}
                      </Typography>
                      <Typography variant="body-sm" theme="muted">
                        {isListening ? 'Mise à jour instantanée' : 'Tentative de reconnexion...'}
                      </Typography>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}