// components/fighters/sections/champions-section.tsx
'use client'

import { motion, Variants } from 'framer-motion'
import { Typography } from '@/components/ui/typography'
import { Card, CardContent } from '@/components/ui/card'
import { Trophy, Crown, Award, Star, TrendingUp, Target } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import Image from 'next/image'
import { useQuery } from '@tanstack/react-query'
import { getMobileFighters } from '@/actions/mobile/fighters'

export function ChampionsSection() {
  const { data: fightersData } = useQuery({
    queryKey: ['fighters-champions'],
    queryFn: async () => {
      const result = await getMobileFighters()
      if (!result.success || !result.data) {
        return []
      }
      // Filtrer les champions et prendre les 6 premiers
      return result.data.fighters
        .filter((fighter: any) => fighter.isChampion)
        .slice(0, 6)
    }
  })

  const champions = fightersData || []

  if (champions.length === 0) return null

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  }

  const itemVariants: Variants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    }
  }

  return (
    <section className="py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="p-2 rounded-lg bg-amber-500/10">
              <Crown className="h-6 w-6 text-amber-600" />
            </div>
            <Typography variant="h2" weight="bold">
              Les <span className="text-amber-600">Champions</span>
            </Typography>
          </div>
          <Typography variant="body-lg" theme="muted" className="max-w-2xl mx-auto">
            Découvrez les lutteurs qui ont marqué l'histoire par leurs titres et performances exceptionnelles.
          </Typography>
        </motion.div>

        {/* Champions Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8"
        >
          {champions.map((champion: any, index: number) => (
            <motion.div
              key={champion.id}
              variants={itemVariants}
              className="group"
            >
              <Link href={`/fighters/${champion.id}`}>
                <Card className="relative overflow-hidden hover:shadow-xl transition-all duration-300 border-amber-500/20 hover:border-amber-500/40">
                  {/* Champion badge */}
                  <div className="absolute top-4 right-4 z-10">
                    <Badge className="bg-amber-500 text-amber-50 gap-1">
                      <Crown className="h-3 w-3" />
                      Champion
                    </Badge>
                  </div>

                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      {/* Profile image */}
                      <div className="relative h-20 w-20 rounded-full overflow-hidden border-2 border-amber-500/30 bg-amber-500/10">
                        {champion.profileImage ? (
                          <Image
                            src={champion.profileImage}
                            alt={`${champion.firstName} ${champion.lastName}`}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center">
                            <Trophy className="h-10 w-10 text-amber-500/30" />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1">
                        <Typography variant="h5" weight="bold" className="mb-1">
                          {champion.firstName} {champion.lastName}
                        </Typography>
                        {champion.nickname && (
                          <Typography variant="body-sm" theme="muted" className="italic mb-2">
                            "{champion.nickname}"
                          </Typography>
                        )}
                        
                        {/* Stats */}
                        <div className="flex items-center gap-4">
                          <div>
                            <Typography variant="body-sm" theme="muted">
                              Classement
                            </Typography>
                            <Typography variant="body-base" weight="bold" className="text-amber-600">
                              #{champion.ranking || 'NR'}
                            </Typography>
                          </div>
                          {champion.regionName && (
                            <div>
                              <Typography variant="body-sm" theme="muted">
                                Région
                              </Typography>
                              <Typography variant="body-sm" weight="medium">
                                {champion.regionName}
                              </Typography>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Additional info */}
                    <div className="mt-4 pt-4 border-t grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-amber-500/10 mb-1">
                          <Target className="h-4 w-4 text-amber-600" />
                        </div>
                        <Typography variant="body-sm" theme="muted">
                          Début
                        </Typography>
                        <Typography variant="body-sm" weight="medium">
                          {champion.debutYear || 'N/A'}
                        </Typography>
                      </div>
                      <div className="text-center">
                        <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-amber-500/10 mb-1">
                          <TrendingUp className="h-4 w-4 text-amber-600" />
                        </div>
                        <Typography variant="body-sm" theme="muted">
                          Poids
                        </Typography>
                        <Typography variant="body-sm" weight="medium">
                          {champion.weight ? `${champion.weight} kg` : 'N/A'}
                        </Typography>
                      </div>
                    </div>
                  </CardContent>

                  {/* Hover effect */}
                  <div className="absolute inset-0 bg-gradient-to-t from-amber-500/0 via-amber-500/0 to-amber-500/0 group-hover:via-amber-500/5 group-hover:to-amber-500/10 transition-all duration-300" />
                </Card>
              </Link>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="text-center"
        >
          <Button variant="outline" size="lg" className="gap-2" asChild>
            <Link href="/fighters?status=champion">
              <Award className="h-4 w-4" />
              Voir tous les champions
            </Link>
          </Button>
        </motion.div>
      </div>
    </section>
  )
}