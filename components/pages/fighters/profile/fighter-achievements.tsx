// components/fighters/profile/fighter-achievements.tsx
'use client'

import { motion } from 'framer-motion'
import { Typography } from '@/components/ui/typography'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Trophy, Award, Calendar, MapPin, Star, TrendingUp } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface FighterAchievementsProps {
  achievements: any[]
}

export function FighterAchievements({ achievements }: FighterAchievementsProps) {
  if (!achievements || achievements.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" />
              Palmarès
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Award className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
              <Typography variant="body-base" theme="muted">
                Aucun titre enregistré pour le moment
              </Typography>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  const getPositionColor = (position: string) => {
    switch (position) {
      case '1st': return 'bg-yellow-500/20 text-yellow-600 border-yellow-500/30'
      case '2nd': return 'bg-gray-500/20 text-gray-600 border-gray-500/30'
      case '3rd': return 'bg-amber-500/20 text-amber-600 border-amber-500/30'
      default: return 'bg-blue-500/20 text-blue-600 border-blue-500/30'
    }
  }

  const getPositionLabel = (position: string) => {
    switch (position) {
      case '1st': return '1er'
      case '2nd': return '2ème'
      case '3rd': return '3ème'
      case 'finalist': return 'Finaliste'
      case 'semifinalist': return 'Demi-finaliste'
      case 'quarterfinalist': return 'Quart de finaliste'
      default: return position
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" />
              Palmarès ({achievements.length})
            </CardTitle>
            <Badge variant="outline" className="gap-1">
              <Star className="h-3 w-3" />
              {achievements.filter(a => a.position === '1st').length} titres
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {achievements.map((achievement, index) => (
              <motion.div
                key={achievement.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="flex items-start gap-4 p-4 rounded-lg border bg-card/50 hover:bg-accent/50 transition-colors"
              >
                {/* Position */}
                <div className={`p-3 rounded-lg ${getPositionColor(achievement.position)}`}>
                  <div className="text-center">
                    <Typography variant="h5" weight="bold">
                      {getPositionLabel(achievement.position).charAt(0)}
                    </Typography>
                    <Typography variant="caption2" className="uppercase">
                      {getPositionLabel(achievement.position).slice(1)}
                    </Typography>
                  </div>
                </div>

                {/* Details */}
                <div className="flex-1">
                  <Typography variant="body-base" weight="medium" className="mb-1">
                    {achievement.title}
                  </Typography>
                  <Typography variant="body-sm" theme="muted" className="mb-2">
                    {achievement.description}
                  </Typography>
                  <div className="flex flex-wrap gap-3">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      <Typography variant="body-sm">
                        {achievement.year}
                      </Typography>
                    </div>
                    {achievement.editionTheme && (
                      <div className="flex items-center gap-1">
                        <Award className="h-3 w-3 text-muted-foreground" />
                        <Typography variant="body-sm">
                          {achievement.editionTheme}
                        </Typography>
                      </div>
                    )}
                    {achievement.regionName && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        <Typography variant="body-sm">
                          {achievement.regionName}
                        </Typography>
                      </div>
                    )}
                  </div>
                </div>

                {/* Year */}
                <div className="text-right">
                  <Typography variant="h4" weight="bold" className="text-primary">
                    {achievement.year}
                  </Typography>
                  <Typography variant="body-sm" theme="muted">
                    Année
                  </Typography>
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}