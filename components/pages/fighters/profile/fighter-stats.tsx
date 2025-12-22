// components/fighters/profile/fighter-stats.tsx
'use client'

import { motion } from 'framer-motion'
import { Typography } from '@/components/ui/typography'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Trophy, 
  Target, 
  Timer, 
  Award,
  TrendingUp,
  BarChart3,
  Swords,
  Heart
} from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

interface FighterStatsProps {
  stats: any
  fighter: any
}

export function FighterStats({ stats, fighter }: FighterStatsProps) {
  if (!stats || !fighter) return null

  const statCards = [
    {
      icon: Trophy,
      title: "Victoires",
      value: stats.wins || 0,
      total: stats.totalMatches || 0,
      color: "text-emerald-600",
      bgColor: "bg-emerald-500/10",
      percentage: stats.totalMatches ? (stats.wins / stats.totalMatches * 100) : 0
    },
    {
      icon: Target,
      title: "Taux de victoire",
      value: `${stats.winRate || 0}%`,
      color: "text-blue-600",
      bgColor: "bg-blue-500/10"
    },
    {
      icon: Timer,
      title: "Temps total",
      value: stats.totalFightTime?.formatted || '0m',
      color: "text-purple-600",
      bgColor: "bg-purple-500/10"
    },
    {
      icon: Award,
      title: "Temps moyen",
      value: stats.averageFightTime?.formatted || '0m',
      color: "text-amber-600",
      bgColor: "bg-amber-500/10"
    }
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Statistiques
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Main stats */}
          <div className="grid grid-cols-2 gap-4">
            {statCards.map((stat, index) => (
              <div key={stat.title} className="text-center">
                <div className={`inline-flex p-3 rounded-xl ${stat.bgColor} mb-2`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <Typography variant="h3" weight="bold" className="mb-1">
                  {stat.value}
                </Typography>
                <Typography variant="body-sm" theme="muted">
                  {stat.title}
                </Typography>
                {stat.percentage && (
                  <Progress value={stat.percentage} className="mt-2" />
                )}
              </div>
            ))}
          </div>

          {/* Additional stats */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Swords className="h-4 w-4 text-muted-foreground" />
                <Typography variant="body-sm">Matchs joués</Typography>
              </div>
              <Typography variant="body-base" weight="medium">
                {stats.totalMatches || 0}
              </Typography>
            </div>
            
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Heart className="h-4 w-4 text-muted-foreground" />
                <Typography variant="body-sm">Défaites</Typography>
              </div>
              <Typography variant="body-base" weight="medium">
                {stats.losses || 0}
              </Typography>
            </div>
            
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Award className="h-4 w-4 text-muted-foreground" />
                <Typography variant="body-sm">Cartons jaunes</Typography>
              </div>
              <Typography variant="body-base" weight="medium">
                {stats.yellowCards || 0}
              </Typography>
            </div>
            
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <Typography variant="body-sm">Cartons rouges</Typography>
              </div>
              <Typography variant="body-base" weight="medium">
                {stats.redCards || 0}
              </Typography>
            </div>
          </div>

          {/* Style de combat */}
          {fighter.fightingStyle && (
            <div className="pt-4 border-t">
              <Typography variant="body-sm" weight="medium" className="mb-2">
                Style de combat
              </Typography>
              <div className="inline-flex px-3 py-1 rounded-full bg-primary/10 text-primary text-sm">
                {fighter.fightingStyle}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}