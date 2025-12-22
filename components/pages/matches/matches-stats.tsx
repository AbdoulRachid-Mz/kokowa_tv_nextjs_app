// components/matches/matches-stats.tsx
'use client'

import { motion } from 'framer-motion'
import { Typography } from '@/components/ui/typography'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Target, 
  TrendingUp, 
  Calendar, 
  Trophy, 
  Users, 
  Clock,
  BarChart3
} from 'lucide-react'

interface MatchesStatsProps {
  stats: {
    total: number
    live: number
    upcoming: number
    completed: number
    currentPage: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

export function MatchesStats({ stats }: MatchesStatsProps) {
  const statCards = [
    {
      title: "Total des matches",
      value: stats.total,
      icon: Target,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
      description: "Toutes les rencontres"
    },
    {
      title: "En direct",
      value: stats.live,
      icon: TrendingUp,
      color: "text-red-600",
      bgColor: "bg-red-100",
      description: "Matchs en cours"
    },
    {
      title: "À venir",
      value: stats.upcoming,
      icon: Calendar,
      color: "text-indigo-600",
      bgColor: "bg-indigo-100",
      description: "Programmés"
    },
    {
      title: "Terminés",
      value: stats.completed,
      icon: Trophy,
      color: "text-green-600",
      bgColor: "bg-green-100",
      description: "Matchs finis"
    },
    {
      title: "Page actuelle",
      value: stats.currentPage,
      icon: Users,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
      description: `sur ${stats.totalPages} pages`
    },
    {
      title: "Navigation",
      value: stats.hasNext ? "Suivant" : "Fin",
      icon: Clock,
      color: "text-amber-600",
      bgColor: "bg-amber-100",
      description: stats.hasPrev ? "Précédent disponible" : "Première page"
    }
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mb-8"
    >
      <Card className="border-0 bg-gradient-to-r from-primary/5 to-secondary/5">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-6">
            <div>
              <Typography variant="h4" weight="bold" className="mb-2">
                Statistiques des matches
              </Typography>
              <Typography variant="body-base" theme="muted">
                Vue d'ensemble de toutes les rencontres
              </Typography>
            </div>
            <Badge variant="outline" className="gap-2 px-4 py-2">
              <BarChart3 className="h-4 w-4" />
              Mises à jour en temps réel
            </Badge>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
            {statCards.map((stat, index) => (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
              >
                <Card className="border hover:shadow-lg transition-all duration-300">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                        <stat.icon className={`h-5 w-5 ${stat.color}`} />
                      </div>
                      {stat.title === "En direct" && stats.live > 0 && (
                        <div className="h-2 w-2 bg-red-500 rounded-full animate-pulse" />
                      )}
                    </div>

                    <Typography variant="h3" weight="bold" className="mb-1">
                      {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
                    </Typography>

                    <Typography variant="body-sm" weight="medium" className="mb-1">
                      {stat.title}
                    </Typography>

                    <Typography variant="body-sm" theme="muted">
                      {stat.description}
                    </Typography>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Barre de progression */}
          {stats.total > 0 && (
            <div className="mt-8 pt-6 border-t">
              <div className="flex justify-between items-center mb-2">
                <Typography variant="body-sm" theme="muted">
                  Répartition des statuts
                </Typography>
                <Typography variant="body-sm" weight="medium">
                  {stats.total} matches
                </Typography>
              </div>
              
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full flex">
                  {stats.live > 0 && (
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(stats.live / stats.total) * 100}%` }}
                      transition={{ duration: 1, delay: 0.5 }}
                      className="bg-red-500"
                      title={`${stats.live} en direct`}
                    />
                  )}
                  {stats.upcoming > 0 && (
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(stats.upcoming / stats.total) * 100}%` }}
                      transition={{ duration: 1, delay: 0.7 }}
                      className="bg-indigo-500"
                      title={`${stats.upcoming} à venir`}
                    />
                  )}
                  {stats.completed > 0 && (
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(stats.completed / stats.total) * 100}%` }}
                      transition={{ duration: 1, delay: 0.9 }}
                      className="bg-green-500"
                      title={`${stats.completed} terminés`}
                    />
                  )}
                </div>
              </div>

              <div className="flex justify-between items-center mt-2">
                <div className="flex items-center gap-4">
                  {stats.live > 0 && (
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-red-500" />
                      <Typography variant="body-sm">
                        {stats.live} en direct
                      </Typography>
                    </div>
                  )}
                  {stats.upcoming > 0 && (
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-indigo-500" />
                      <Typography variant="body-sm">
                        {stats.upcoming} à venir
                      </Typography>
                    </div>
                  )}
                  {stats.completed > 0 && (
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-green-500" />
                      <Typography variant="body-sm">
                        {stats.completed} terminés
                      </Typography>
                    </div>
                  )}
                </div>
                
                <Typography variant="body-sm" theme="muted">
                  Page {stats.currentPage}/{stats.totalPages}
                </Typography>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}