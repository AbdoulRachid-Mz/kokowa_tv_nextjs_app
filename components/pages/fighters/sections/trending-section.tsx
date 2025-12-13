// components/fighters/sections/trending-section.tsx
'use client'

import { motion, Variants } from 'framer-motion'
import { Typography } from '@/components/ui/typography'
import { Card, CardContent } from '@/components/ui/card'
import { 
  TrendingUp,  
  Target, 
  Users, 
  ArrowUpRight, 
  Eye,
  Heart,
  Share2,
  Flame
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import Image from 'next/image'
import { useQuery } from '@tanstack/react-query'
import { getMobileFighters } from '@/actions/mobile/fighters'

export function TrendingSection() {
  const { data: fightersData } = useQuery({
    queryKey: ['fighters-trending'],
    queryFn: async () => {
      const result = await getMobileFighters()
      if (!result.success || !result.data) {
        return []
      }
      // Simuler des données de tendance (dans un cas réel, vous auriez un champ de popularité)
      const fighters = result.data.fighters
      // Trier par classement et prendre les plus populaires (Top 10)
      return fighters
        .sort((a: any, b: any) => a.ranking - b.ranking)
        .slice(0, 4)
    }
  })

  const trendingFighters = fightersData || []

  if (trendingFighters.length === 0) return null

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

  const trendingStats = [
    { label: "Lutteurs suivis", value: "2.5K", change: "+12%", icon: Users, color: "text-blue-600" },
    { label: "Interactions", value: "15.2K", change: "+8%", icon: Heart, color: "text-red-600" },
    { label: "Vues de profils", value: "42.7K", change: "+23%", icon: Eye, color: "text-emerald-600" },
    { label: "Partages", value: "3.1K", change: "+15%", icon: Share2, color: "text-purple-600" }
  ]

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
            <div className="p-2 rounded-lg bg-red-500/10">
              <Flame className="h-6 w-6 text-red-600" />
            </div>
            <Typography variant="h2" weight="bold">
              En <span className="text-red-600">Tendance</span>
            </Typography>
          </div>
          <Typography variant="body-lg" theme="muted" className="max-w-2xl mx-auto">
            Les lutteurs les plus suivis et populaires du moment. Suivez leur ascension !
          </Typography>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-12"
        >
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {trendingStats.map((stat, index) => (
              <Card key={stat.label} className="relative overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${stat.color.replace('text-', 'bg-')}/10`}>
                      <stat.icon className={`h-5 w-5 ${stat.color}`} />
                    </div>
                    <div>
                      <Typography variant="body-sm" theme="muted" className="mb-1">
                        {stat.label}
                      </Typography>
                      <div className="flex items-center gap-2">
                        <Typography variant="h4" weight="bold">
                          {stat.value}
                        </Typography>
                        <Badge className="bg-emerald-500/20 text-emerald-600 border-emerald-500/30">
                          {stat.change}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>

        {/* Trending Fighters */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8"
        >
          {trendingFighters.map((fighter: any, index: number) => (
            <motion.div
              key={fighter.id}
              variants={itemVariants}
              className="group"
            >
              <Link href={`/fighters/${fighter.id}`}>
                <Card className="relative overflow-hidden hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-primary/20">
                  {/* Trend indicator */}
                  <div className="absolute top-4 left-4 z-10">
                    <Badge className="bg-red-500 text-red-50 gap-1">
                      <TrendingUp className="h-3 w-3" />
                      #{index + 1} Tendance
                    </Badge>
                  </div>

                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      {/* Profile image */}
                      <div className="relative h-24 w-24 rounded-full overflow-hidden border-2 border-primary/20">
                        {fighter.profileImage ? (
                          <Image
                            src={fighter.profileImage}
                            alt={`${fighter.firstName} ${fighter.lastName}`}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="h-full w-full bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
                            <Target className="h-12 w-12 text-primary/30" />
                          </div>
                        )}
                        {/* Ranking overlay */}
                        <div className="absolute -bottom-2 -right-2">
                          <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center border-2 border-background">
                            <Typography variant="body-base" weight="bold" className="text-primary-foreground">
                              {fighter.ranking || 'NR'}
                            </Typography>
                          </div>
                        </div>
                      </div>

                      {/* Info */}
                      <div className="flex-1">
                        <Typography variant="h5" weight="bold" className="mb-1">
                          {fighter.firstName} {fighter.lastName}
                        </Typography>
                        {fighter.nickname && (
                          <Typography variant="body-sm" theme="muted" className="italic mb-2">
                            "{fighter.nickname}"
                          </Typography>
                        )}
                        
                        {/* Region */}
                        {fighter.regionName && (
                          <div className="flex items-center gap-2 mb-3">
                            <div 
                              className="h-3 w-6 rounded-sm"
                              style={{ backgroundColor: fighter.regionColor || '#6b7280' }}
                            />
                            <Typography variant="body-sm" theme="muted">
                              {fighter.regionName}
                            </Typography>
                          </div>
                        )}

                        {/* Stats */}
                        <div className="flex items-center gap-4">
                          <div>
                            <Typography variant="body-sm" theme="muted">
                              Poids
                            </Typography>
                            <Typography variant="body-sm" weight="medium">
                              {fighter.weight ? `${fighter.weight} kg` : 'N/A'}
                            </Typography>
                          </div>
                          <div>
                            <Typography variant="body-sm" theme="muted">
                              Taille
                            </Typography>
                            <Typography variant="body-sm" weight="medium">
                              {fighter.height ? `${fighter.height} m` : 'N/A'}
                            </Typography>
                          </div>
                          <div>
                            <Typography variant="body-sm" theme="muted">
                              Début
                            </Typography>
                            <Typography variant="body-sm" weight="medium">
                              {fighter.debutYear || 'N/A'}
                            </Typography>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-4 pt-4 border-t flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" className="gap-1">
                          <Heart className="h-4 w-4" />
                          <span className="text-xs">2.5K</span>
                        </Button>
                        <Button variant="ghost" size="sm" className="gap-1">
                          <Eye className="h-4 w-4" />
                          <span className="text-xs">5.2K</span>
                        </Button>
                        <Button variant="ghost" size="sm" className="gap-1">
                          <Share2 className="h-4 w-4" />
                          <span className="text-xs">342</span>
                        </Button>
                      </div>
                      <Button size="sm" className="gap-2 group-hover:bg-primary/90">
                        Suivre
                        <ArrowUpRight className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>

                  {/* Hover effect */}
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/0 via-primary/0 to-primary/0 group-hover:via-primary/5 group-hover:to-primary/10 transition-all duration-300" />
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
          <div className="inline-flex flex-col sm:flex-row gap-4">
            <Button size="lg" className="gap-2" asChild>
              <Link href="/fighters?sortBy=ranking">
                <TrendingUp className="h-4 w-4" />
                Voir le classement complet
              </Link>
            </Button>
            <Button variant="outline" size="lg" className="gap-2">
              <Flame className="h-4 w-4" />
              Découvrir plus de talents
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  )
}