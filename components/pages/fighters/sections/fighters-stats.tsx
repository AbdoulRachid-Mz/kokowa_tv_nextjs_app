// components/fighters/sections/fighters-stats.tsx
'use client'

import { motion } from 'framer-motion'
import { Typography } from '@/components/ui/typography'
import { 
  Trophy, 
  Users, 
  Target, 
  TrendingUp,
  MapPin,
  Swords,
  Award,
  BarChart3
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { getFighterStats } from '@/actions/fighters'
import { getRegions } from '@/actions/regions'
import { Skeleton } from '@/components/ui/skeleton'
import { useEffect, useState } from 'react'

export function FightersStats() {
  const [animatedValues, setAnimatedValues] = useState({
    total: 0,
    active: 0,
    champions: 0,
    regions: 0
  })

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['fighter-stats'],
    queryFn: getFighterStats
  })

  const { data: regions, isLoading: regionsLoading } = useQuery({
    queryKey: ['regions-stats'],
    queryFn: async () => {
      const response = await getRegions({ limit: 100 })
      return response.data || []
    }
  })

  useEffect(() => {
    if (!stats) return

    const interval = setInterval(() => {
      setAnimatedValues(prev => ({
        total: Math.min(prev.total + Math.ceil(stats.total_fighters / 50), stats.total_fighters),
        active: Math.min(prev.active + Math.ceil(stats.active_fighters / 30), stats.active_fighters),
        champions: Math.min(prev.champions + Math.ceil(stats.champions / 20), stats.champions),
        regions: Math.min(prev.regions + Math.ceil((regions?.length || 0) / 10), regions?.length || 0)
      }))
    }, 30)

    return () => clearInterval(interval)
  }, [stats, regions])

  const topRegions = regions
    ?.filter(r => (r.total_fighters ?? 0) > 0)
    .sort((a, b) => (b.total_fighters ?? 0) - (a.total_fighters ?? 0))
    .slice(0, 5) || []

  if (statsLoading || regionsLoading) {
    return (
      <div className="container mx-auto px-4 mb-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="container mx-auto px-4 mb-12"
    >
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Total fighters */}
        <div className="relative p-6 rounded-2xl border bg-card/50 backdrop-blur-sm group hover:shadow-lg transition-all duration-300">
          <div className="inline-flex p-3 rounded-xl bg-blue-500/10 mb-4">
            <Users className="h-6 w-6 text-blue-600" />
          </div>
          <Typography variant="h3" weight="bold" className="mb-2">
            {animatedValues.total.toLocaleString()}+
          </Typography>
          <Typography variant="body-sm" theme="muted">
            Lutteurs enregistrés
          </Typography>
          <motion.div
            initial={{ width: 0 }}
            whileInView={{ width: "100%" }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 1 }}
            className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent rounded-full"
          />
        </div>

        {/* Active fighters */}
        <div className="relative p-6 rounded-2xl border bg-card/50 backdrop-blur-sm group hover:shadow-lg transition-all duration-300">
          <div className="inline-flex p-3 rounded-xl bg-emerald-500/10 mb-4">
            <Target className="h-6 w-6 text-emerald-600" />
          </div>
          <Typography variant="h3" weight="bold" className="mb-2">
            {animatedValues.active.toLocaleString()}
          </Typography>
          <Typography variant="body-sm" theme="muted">
            Lutteurs actifs
          </Typography>
          <motion.div
            initial={{ width: 0 }}
            whileInView={{ width: "100%" }}
            viewport={{ once: true }}
            transition={{ delay: 0.4, duration: 1 }}
            className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent rounded-full"
          />
        </div>

        {/* Champions */}
        <div className="relative p-6 rounded-2xl border bg-card/50 backdrop-blur-sm group hover:shadow-lg transition-all duration-300">
          <div className="inline-flex p-3 rounded-xl bg-amber-500/10 mb-4">
            <Trophy className="h-6 w-6 text-amber-600" />
          </div>
          <Typography variant="h3" weight="bold" className="mb-2">
            {animatedValues.champions}
          </Typography>
          <Typography variant="body-sm" theme="muted">
            Champions titrés
          </Typography>
          <motion.div
            initial={{ width: 0 }}
            whileInView={{ width: "100%" }}
            viewport={{ once: true }}
            transition={{ delay: 0.5, duration: 1 }}
            className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent rounded-full"
          />
        </div>

        {/* Regions */}
        <div className="relative p-6 rounded-2xl border bg-card/50 backdrop-blur-sm group hover:shadow-lg transition-all duration-300">
          <div className="inline-flex p-3 rounded-xl bg-purple-500/10 mb-4">
            <MapPin className="h-6 w-6 text-purple-600" />
          </div>
          <Typography variant="h3" weight="bold" className="mb-2">
            {animatedValues.regions}+
          </Typography>
          <Typography variant="body-sm" theme="muted">
            Régions participantes
          </Typography>
          <motion.div
            initial={{ width: 0 }}
            whileInView={{ width: "100%" }}
            viewport={{ once: true }}
            transition={{ delay: 0.6, duration: 1 }}
            className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent rounded-full"
          />
        </div>
      </div>

      {/* Additional stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 rounded-xl bg-muted/30">
            <Typography variant="body-sm" theme="muted" className="mb-1">
              Taille moyenne
            </Typography>
            <Typography variant="h4" weight="bold">
              {stats.avg_height?.toFixed(2)} m
            </Typography>
          </div>
          <div className="text-center p-4 rounded-xl bg-muted/30">
            <Typography variant="body-sm" theme="muted" className="mb-1">
              Poids moyen
            </Typography>
            <Typography variant="h4" weight="bold">
              {stats.avg_weight?.toFixed(1)} kg
            </Typography>
          </div>
          <div className="text-center p-4 rounded-xl bg-muted/30">
            <Typography variant="body-sm" theme="muted" className="mb-1">
              Classement moyen
            </Typography>
            <Typography variant="h4" weight="bold">
              #{stats.avg_ranking?.toFixed(0)}
            </Typography>
          </div>
          <div className="text-center p-4 rounded-xl bg-muted/30">
            <Typography variant="body-sm" theme="muted" className="mb-1">
              Expérience
            </Typography>
            <Typography variant="h4" weight="bold">
              {/* {stats.avg_experience?.toFixed(1)} ans */}
              2 ans
            </Typography>
          </div>
        </div>
      )}

      {/* Top regions */}
      {topRegions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="mt-8"
        >
          <Typography variant="h5" weight="medium" className="mb-4 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Régions les plus actives
          </Typography>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
            {topRegions.map((region, index) => (
              <div key={region.id} className="p-4 rounded-xl border bg-card hover:shadow-sm transition-shadow">
                <div className="flex items-center gap-3 mb-2">
                  {region.color && (
                    <div 
                      className="h-8 w-8 rounded-full border"
                      style={{ backgroundColor: region.color }}
                    />
                  )}
                  <Typography variant="body-base" weight="medium">
                    {region.name}
                  </Typography>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Swords className="h-4 w-4 text-muted-foreground" />
                    <Typography variant="body-sm">
                      {region.total_fighters || 0} lutteurs
                    </Typography>
                  </div>
                  {region.total_champions && region.total_champions > 0 && (
                    <div className="flex items-center gap-1">
                      <Award className="h-4 w-4 text-amber-600" />
                      <Typography variant="body-sm" className="text-amber-600">
                        {region.total_champions}
                      </Typography>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}