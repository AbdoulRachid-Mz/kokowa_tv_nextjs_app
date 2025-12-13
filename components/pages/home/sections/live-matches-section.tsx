// components/home/sections/live-matches-section.tsx
'use client'

import { motion } from 'framer-motion'
import { Typography } from '@/components/ui/typography'
import { Button } from '@/components/ui/button'
import { Play, Clock, Users, MapPin, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { useState } from 'react'

export function LiveMatchesSection() {
  const [activeMatch, setActiveMatch] = useState(0)

  const liveMatches = [
    {
      id: 1,
      fighter1: { name: "Boubacar Diop", region: "Dakar", score: 2 },
      fighter2: { name: "Moussa Konaté", region: "Bamako", score: 1 },
      status: "live",
      time: "12:45",
      viewers: "1.2K"
    },
    {
      id: 2,
      fighter1: { name: "Abdoulaye N'Diaye", region: "Saint-Louis", score: 0 },
      fighter2: { name: "Ibrahim Traoré", region: "Ouagadougou", score: 0 },
      status: "upcoming",
      time: "14:30",
      viewers: "0"
    },
    {
      id: 3,
      fighter1: { name: "Sékou Camara", region: "Conakry", score: 3 },
      fighter2: { name: "Youssouf Touré", region: "Niamey", score: 2 },
      status: "completed",
      time: "10:15",
      viewers: "2.5K"
    }
  ]

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
            <div className="h-3 w-3 rounded-full bg-red-500 animate-pulse" />
            <Typography variant="body-base" weight="medium" className="text-red-600">
              EN DIRECT
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {liveMatches.map((match, index) => (
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
                  {/* Status badge */}
                  <Badge
                    variant={
                      match.status === 'live' ? 'destructive' :
                      match.status === 'upcoming' ? 'secondary' : 'outline'
                    }
                    className="absolute -top-2 -right-2"
                  >
                    {match.status === 'live' ? 'LIVE' : match.status === 'upcoming' ? 'À VENIR' : 'TERMINÉ'}
                  </Badge>

                  {/* Match details */}
                  <div className="space-y-6">
                    {/* Fighter 1 */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <Typography variant="body-base" weight="bold" className="text-blue-600">
                            {match.fighter1.name.charAt(0)}
                          </Typography>
                        </div>
                        <div>
                          <Typography variant="body-base" weight="medium">
                            {match.fighter1.name}
                          </Typography>
                          <Typography variant="body-sm" theme="muted">
                            {match.fighter1.region}
                          </Typography>
                        </div>
                      </div>
                      <Typography variant="h4" weight="bold" className="text-blue-600">
                        {match.fighter1.score}
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
                        <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                          <Typography variant="body-base" weight="bold" className="text-red-600">
                            {match.fighter2.name.charAt(0)}
                          </Typography>
                        </div>
                        <div>
                          <Typography variant="body-base" weight="medium">
                            {match.fighter2.name}
                          </Typography>
                          <Typography variant="body-sm" theme="muted">
                            {match.fighter2.region}
                          </Typography>
                        </div>
                      </div>
                      <Typography variant="h4" weight="bold" className="text-red-600">
                        {match.fighter2.score}
                      </Typography>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between mt-6 pt-4 border-t">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <Typography variant="body-sm">{match.time}</Typography>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <Typography variant="body-sm">{match.viewers}</Typography>
                      </div>
                    </div>
                    <Button size="sm" variant="ghost" className="gap-2">
                      <Play className="h-4 w-4" />
                      Voir
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

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
                    MATCH DU JOUR
                  </Badge>
                  <Typography variant="h3" weight="bold" className="mb-4">
                    Finale du Championnat National
                  </Typography>
                  <Typography variant="body-lg" theme="muted" className="mb-6">
                    La rencontre tant attendue entre les deux meilleurs lutteurs 
                    de la saison. Suivez chaque action en direct.
                  </Typography>
                  <div className="flex items-center gap-4 mb-6">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <Typography variant="body-base">Stade National</Typography>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <Typography variant="body-base">Aujourd'hui à 16:00</Typography>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <Button size="lg" className="gap-2">
                      <Play className="h-4 w-4" />
                      Regarder en Direct
                    </Button>
                    <Button size="lg" variant="outline" asChild>
                      <Link href="/matches/live">
                        Voir tous les matchs
                      </Link>
                    </Button>
                  </div>
                </div>
                <div className="relative">
                  <div className="aspect-video rounded-xl overflow-hidden bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
                    <div className="text-center">
                      <div className="h-24 w-24 mx-auto mb-4 relative">
                        <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" />
                        <div className="relative h-24 w-24 bg-primary rounded-full flex items-center justify-center">
                          <Play className="h-12 w-12 text-white" fill="white" />
                        </div>
                      </div>
                      <Typography variant="h4" weight="bold">
                        Diffusion en direct
                      </Typography>
                      <Typography variant="body-sm" theme="muted">
                        Démarre dans 2h 15m
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