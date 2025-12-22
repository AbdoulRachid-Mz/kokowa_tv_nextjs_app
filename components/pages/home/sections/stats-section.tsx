// components/home/sections/stats-section.tsx
'use client'

import { motion, Variants } from 'framer-motion'
import { Typography } from '@/components/ui/typography'
import { Trophy, Users, MapPin, Swords, Target, TrendingUp, BarChart3, Award } from 'lucide-react'
import { useStatsQuery } from '@/hooks/use-stats'
import { Skeleton } from '@/components/ui/skeleton'
import { useEffect, useState } from 'react'

export function StatsSection() {
  const { data: stats, isLoading } = useStatsQuery()
  const [animatedValues, setAnimatedValues] = useState({
    fighters: 0,
    competitions: 0,
    regions: 0,
    matches: 0
  })

  useEffect(() => {
    if (!stats) return

    const interval = setInterval(() => {
      setAnimatedValues(prev => ({
        fighters: Math.min(prev.fighters + Math.ceil(stats.total_fighters / 50), stats.total_fighters),
        competitions: Math.min(prev.competitions + Math.ceil(stats.total_competitions / 30), stats.total_competitions),
        regions: Math.min(prev.regions + Math.ceil(stats.total_regions / 20), stats.total_regions),
        matches: Math.min(prev.matches + Math.ceil(stats.total_matches / 100), stats.total_matches)
      }))
    }, 30)

    return () => clearInterval(interval)
  }, [stats])

  const statCards = [
    {
      icon: Swords,
      title: "Lutteurs Actifs",
      value: animatedValues.fighters,
      suffix: "+",
      description: "Professionnels enregistrés",
      color: "text-blue-600",
      bgColor: "bg-blue-500/10"
    },
    {
      icon: Trophy,
      title: "Compétitions",
      value: animatedValues.competitions,
      suffix: "+",
      description: "Événements organisés",
      color: "text-amber-600",
      bgColor: "bg-amber-500/10"
    },
    {
      icon: MapPin,
      title: "Régions",
      value: animatedValues.regions,
      suffix: "+",
      description: "Territoires participants",
      color: "text-emerald-600",
      bgColor: "bg-emerald-500/10"
    },
    {
      icon: Target,
      title: "Matchs Joués",
      value: animatedValues.matches,
      suffix: "+",
      description: "Rencontres organisées",
      color: "text-purple-600",
      bgColor: "bg-purple-500/10"
    }
  ]

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

  const cardVariants: Variants = {
    hidden: { y: 30, opacity: 0 },
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
    <section className="py-20">
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <Typography variant="h2" weight="bold" className="mb-4">
            Notre Impact en <span className="text-primary">Chiffres</span>
          </Typography>
          <Typography variant="body-lg" theme="muted" className="max-w-2xl mx-auto">
            La croissance de notre communauté et l'ampleur de nos activités démontrent 
            l'importance de la lutte traditionnelle dans notre patrimoine culturel.
          </Typography>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-48 rounded-2xl" />
            ))
          ) : (
            statCards.map((stat, index) => (
              <motion.div
                key={stat.title}
                variants={cardVariants}
                className="relative group"
              >
                <div className={`relative p-6 rounded-2xl border bg-card/50 backdrop-blur-sm ${stat.bgColor} transition-all duration-300 hover:shadow-xl hover:scale-[1.02]`}>
                  {/* Icon */}
                  <div className={`inline-flex p-3 rounded-xl ${stat.bgColor} mb-4`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>

                  {/* Value */}
                  <Typography variant="h3" weight="bold" className="mb-2">
                    {stat.value.toLocaleString()}{stat.suffix}
                  </Typography>

                  {/* Title */}
                  <Typography variant="h5" weight="medium" className="mb-2">
                    {stat.title}
                  </Typography>

                  {/* Description */}
                  <Typography variant="body-sm" theme="muted">
                    {stat.description}
                  </Typography>

                  {/* Animated line */}
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: "100%" }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3, duration: 1 }}
                    className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent rounded-full"
                  />
                </div>
              </motion.div>
            ))
          )}
        </motion.div>

        {/* Additional metrics */}
        {stats && !isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4"
          >
            <div className="text-center p-4 rounded-xl bg-muted/30">
              <Typography variant="body-sm" theme="muted" className="mb-1">
                Champions
              </Typography>
              <Typography variant="h4" weight="bold">
                {stats.champions}
              </Typography>
            </div>
            <div className="text-center p-4 rounded-xl bg-muted/30">
              <Typography variant="body-sm" theme="muted" className="mb-1">
                Matchs en Direct
              </Typography>
              <Typography variant="h4" weight="bold">
                {stats.upcoming_matches}
              </Typography>
            </div>
            <div className="text-center p-4 rounded-xl bg-muted/30">
              <Typography variant="body-sm" theme="muted" className="mb-1">
                Utilisateurs Actifs
              </Typography>
              <Typography variant="h4" weight="bold">
                {stats.active_users}
              </Typography>
            </div>
            <div className="text-center p-4 rounded-xl bg-muted/30">
              <Typography variant="body-sm" theme="muted" className="mb-1">
                Transferts
              </Typography>
              <Typography variant="h4" weight="bold">
                {stats.total_transfers}
              </Typography>
            </div>
          </motion.div>
        )}
      </div>
    </section>
  )
}