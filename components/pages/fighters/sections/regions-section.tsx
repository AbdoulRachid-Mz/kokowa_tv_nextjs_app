// components/fighters/sections/regions-section.tsx
'use client'

import { motion, Variants } from 'framer-motion'
import { Typography } from '@/components/ui/typography'
import { Card, CardContent } from '@/components/ui/card'
import { MapPin, Users, Trophy, TrendingUp, Flag, Target } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { getRegions } from '@/actions/regions'

export function RegionsSection() {
  const { data: regionsData } = useQuery({
    queryKey: ['regions-fighters'],
    queryFn: async () => {
      const response = await getRegions({ 
        limit: 8,
        with_fighters: true 
      })
      return response.data || []
    }
  })

  const regions = regionsData || []

  if (regions.length === 0) return null

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
    hidden: { y: 20, opacity: 0, scale: 0.95 },
    visible: {
      y: 0,
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    }
  }

  return (
    <section className="py-12 bg-gradient-to-b from-background to-muted/20">
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
            <div className="p-2 rounded-lg bg-blue-500/10">
              <MapPin className="h-6 w-6 text-blue-600" />
            </div>
            <Typography variant="h2" weight="bold">
              Par <span className="text-blue-600">Région</span>
            </Typography>
          </div>
          <Typography variant="body-lg" theme="muted" className="max-w-2xl mx-auto">
            Explorez la richesse des talents à travers les différentes régions participantes.
          </Typography>
        </motion.div>

        {/* Regions Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          {regions.map((region: any, index: number) => (
            <motion.div
              key={region.id}
              variants={itemVariants}
              className="group"
            >
              <Link href={`/regions/${region.id}`}>
                <Card className="relative overflow-hidden hover:shadow-xl transition-all duration-300 h-full">
                  {/* Region color indicator */}
                  {region.color && (
                    <div 
                      className="absolute top-0 left-0 right-0 h-1"
                      style={{ backgroundColor: region.color }}
                    />
                  )}

                  <CardContent className="p-6">
                    {/* Header */}
                    <div className="flex items-center gap-3 mb-4">
                      {region.flagImage ? (
                        <div className="relative h-10 w-10 rounded-full overflow-hidden border">
                          <img 
                            src={region.flagImage} 
                            alt={region.name}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="h-10 w-10 rounded-full border-2 flex items-center justify-center">
                          <Flag className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                      
                      <div className="flex-1">
                        <Typography variant="h5" weight="bold" className="mb-1">
                          {region.name}
                        </Typography>
                        <Typography variant="body-sm" theme="muted">
                          {region.code}
                        </Typography>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-md bg-blue-500/10">
                            <Users className="h-3 w-3 text-blue-600" />
                          </div>
                          <Typography variant="body-sm">Lutteurs</Typography>
                        </div>
                        <Typography variant="body-base" weight="bold">
                          {region.total_fighters || 0}
                        </Typography>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-md bg-amber-500/10">
                            <Trophy className="h-3 w-3 text-amber-600" />
                          </div>
                          <Typography variant="body-sm">Champions</Typography>
                        </div>
                        <Typography variant="body-base" weight="bold">
                          {region.total_champions || 0}
                        </Typography>
                      </div>

                      {region.stadium_name && (
                        <div className="pt-3 border-t">
                          <div className="flex items-center gap-2 mb-1">
                            <Target className="h-3 w-3 text-muted-foreground" />
                            <Typography variant="body-sm" theme="muted">
                              Stade
                            </Typography>
                          </div>
                          <Typography variant="body-sm" className="line-clamp-2">
                            {region.stadium_name}
                          </Typography>
                        </div>
                      )}
                    </div>

                    {/* View fighters button */}
                    <div className="mt-6 pt-4 border-t">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full gap-2 group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                      >
                        <TrendingUp className="h-3 w-3" />
                        Voir les lutteurs
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </motion.div>

        {/* Stats summary */}
        {regions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="mb-8"
          >
            <Card>
              <CardContent className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <Typography variant="h3" weight="bold" className="text-blue-600 mb-1">
                      {regions.length}
                    </Typography>
                    <Typography variant="body-sm" theme="muted">
                      Régions
                    </Typography>
                  </div>
                  <div className="text-center">
                    <Typography variant="h3" weight="bold" className="text-emerald-600 mb-1">
                      {regions.reduce((sum, r) => sum + (r.total_fighters || 0), 0)}
                    </Typography>
                    <Typography variant="body-sm" theme="muted">
                      Lutteurs total
                    </Typography>
                  </div>
                  <div className="text-center">
                    <Typography variant="h3" weight="bold" className="text-amber-600 mb-1">
                      {regions.reduce((sum, r) => sum + (r.total_champions || 0), 0)}
                    </Typography>
                    <Typography variant="body-sm" theme="muted">
                      Champions
                    </Typography>
                  </div>
                  <div className="text-center">
                    <Typography variant="h3" weight="bold" className="text-purple-600 mb-1">
                      {Math.round(regions.reduce((sum, r) => sum + (r.total_fighters || 0), 0) / regions.length)}
                    </Typography>
                    <Typography variant="body-sm" theme="muted">
                      Moyenne par région
                    </Typography>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="text-center"
        >
          <Button size="lg" className="gap-2" asChild>
            <Link href="/regions">
              <MapPin className="h-4 w-4" />
              Explorer toutes les régions
            </Link>
          </Button>
        </motion.div>
      </div>
    </section>
  )
}