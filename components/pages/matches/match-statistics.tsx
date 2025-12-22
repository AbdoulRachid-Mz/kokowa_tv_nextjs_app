// components/matches/match-statistics.tsx
'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Typography } from '@/components/ui/typography'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Match } from '@/types'
import { 
  TrendingUp, 
  Target, 
  Clock, 
  Award, 
  BarChart3, 
  Zap, 
  Shield,
  Activity,
  Users,
  Target as TargetIcon
} from 'lucide-react'

interface MatchStatisticsProps {
  match: Match
}

export function MatchStatistics({ match }: MatchStatisticsProps) {
  const [activeTab, setActiveTab] = useState('overall')

  // Calculer les statistiques (simulées pour l'exemple)
  const calculateStats = () => {
    if (!match.fighter1 || !match.fighter2) {
      return null
    }

    const totalAttacks = Math.floor(Math.random() * 50) + 30
    const successfulAttacks1 = Math.floor(totalAttacks * (match.fighter1.ranking / 100 || 0.6))
    const successfulAttacks2 = Math.floor(totalAttacks * (match.fighter2.ranking / 100 || 0.4))

    return {
      overall: {
        aggression: {
          fighter1: Math.floor(Math.random() * 40) + 60,
          fighter2: Math.floor(Math.random() * 40) + 60
        },
        defense: {
          fighter1: Math.floor(Math.random() * 40) + 60,
          fighter2: Math.floor(Math.random() * 40) + 60
        },
        stamina: {
          fighter1: Math.floor(Math.random() * 40) + 60,
          fighter2: Math.floor(Math.random() * 40) + 60
        }
      },
      attacks: {
        total: totalAttacks,
        fighter1: {
          total: Math.floor(totalAttacks * 0.55),
          successful: successfulAttacks1,
          successRate: Math.round((successfulAttacks1 / Math.floor(totalAttacks * 0.55)) * 100)
        },
        fighter2: {
          total: Math.floor(totalAttacks * 0.45),
          successful: successfulAttacks2,
          successRate: Math.round((successfulAttacks2 / Math.floor(totalAttacks * 0.45)) * 100)
        }
      },
      timeline: [
        { minute: 5, event: 'Premier contact', fighter: 1 },
        { minute: 12, event: 'Première prise', fighter: 2 },
        { minute: 18, event: 'Contre-attaque', fighter: 1 },
        { minute: 25, event: 'Carton jaune', fighter: 2 },
        { minute: 32, event: 'Prise décisive', fighter: 1 }
      ]
    }
  }

  const stats = calculateStats()

  if (!stats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Statistiques</CardTitle>
          <CardDescription>
            Statistiques détaillées du match
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <TargetIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <Typography variant="body-base" theme="muted">
              Les statistiques ne sont pas disponibles pour ce match
            </Typography>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <CardTitle>Statistiques détaillées</CardTitle>
            <CardDescription>
              Analyse complète des performances des lutteurs
            </CardDescription>
          </div>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
            <TabsList className="grid grid-cols-2">
              <TabsTrigger value="overall">
                <BarChart3 className="h-4 w-4 mr-2" />
                Général
              </TabsTrigger>
              <TabsTrigger value="attacks">
                <Target className="h-4 w-4 mr-2" />
                Attaques
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent>
        <TabsContent value="overall" className="space-y-6">
          {/* Statistiques globales */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Agressivité */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-yellow-600" />
                  <CardTitle className="text-lg">Agressivité</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1">
                    <Typography variant="body-sm">
                      {match.fighter1?.first_name}
                    </Typography>
                    <Typography variant="body-sm" weight="medium">
                      {stats.overall.aggression.fighter1}%
                    </Typography>
                  </div>
                  <Progress value={stats.overall.aggression.fighter1} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <Typography variant="body-sm">
                      {match.fighter2?.first_name}
                    </Typography>
                    <Typography variant="body-sm" weight="medium">
                      {stats.overall.aggression.fighter2}%
                    </Typography>
                  </div>
                  <Progress value={stats.overall.aggression.fighter2} className="h-2" />
                </div>
              </CardContent>
            </Card>

            {/* Défense */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-blue-600" />
                  <CardTitle className="text-lg">Défense</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1">
                    <Typography variant="body-sm">
                      {match.fighter1?.first_name}
                    </Typography>
                    <Typography variant="body-sm" weight="medium">
                      {stats.overall.defense.fighter1}%
                    </Typography>
                  </div>
                  <Progress value={stats.overall.defense.fighter1} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <Typography variant="body-sm">
                      {match.fighter2?.first_name}
                    </Typography>
                    <Typography variant="body-sm" weight="medium">
                      {stats.overall.defense.fighter2}%
                    </Typography>
                  </div>
                  <Progress value={stats.overall.defense.fighter2} className="h-2" />
                </div>
              </CardContent>
            </Card>

            {/* Endurance */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-green-600" />
                  <CardTitle className="text-lg">Endurance</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1">
                    <Typography variant="body-sm">
                      {match.fighter1?.first_name}
                    </Typography>
                    <Typography variant="body-sm" weight="medium">
                      {stats.overall.stamina.fighter1}%
                    </Typography>
                  </div>
                  <Progress value={stats.overall.stamina.fighter1} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <Typography variant="body-sm">
                      {match.fighter2?.first_name}
                    </Typography>
                    <Typography variant="body-sm" weight="medium">
                      {stats.overall.stamina.fighter2}%
                    </Typography>
                  </div>
                  <Progress value={stats.overall.stamina.fighter2} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Comparaison détaillée */}
          <Card>
            <CardHeader>
              <CardTitle>Comparaison détaillée</CardTitle>
              <CardDescription>
                Analyse comparative des performances
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { label: 'Précision des attaques', fighter1: 78, fighter2: 65, icon: Target },
                  { label: 'Contrôle du centre', fighter1: 82, fighter2: 58, icon: Users },
                  { label: 'Prise de décision', fighter1: 71, fighter2: 69, icon: TrendingUp },
                  { label: 'Résistance physique', fighter1: 85, fighter2: 72, icon: Award },
                  { label: 'Temps de réaction', fighter1: 68, fighter2: 75, icon: Clock }
                ].map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className="h-5 w-5 text-muted-foreground" />
                      <Typography variant="body-sm">
                        {item.label}
                      </Typography>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge variant={item.fighter1 > item.fighter2 ? "default" : "outline"}>
                        {item.fighter1}%
                      </Badge>
                      <Badge variant={item.fighter2 > item.fighter1 ? "default" : "outline"}>
                        {item.fighter2}%
                      </Badge>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attacks" className="space-y-6">
          {/* Statistiques d'attaques */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Total des attaques</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <Typography variant="h3" className="mb-2">
                    {stats.attacks.total}
                  </Typography>
                  <Typography variant="body-sm" theme="muted">
                    attaques tentées
                  </Typography>
                </div>
                <div className="mt-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <Typography variant="body-sm">
                      {match.fighter1?.first_name}
                    </Typography>
                    <div className="flex items-center gap-2">
                      <Typography variant="body-sm" weight="medium">
                        {stats.attacks.fighter1.total}
                      </Typography>
                      <Badge variant="outline">
                        {Math.round((stats.attacks.fighter1.total / stats.attacks.total) * 100)}%
                      </Badge>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <Typography variant="body-sm">
                      {match.fighter2?.first_name}
                    </Typography>
                    <div className="flex items-center gap-2">
                      <Typography variant="body-sm" weight="medium">
                        {stats.attacks.fighter2.total}
                      </Typography>
                      <Badge variant="outline">
                        {Math.round((stats.attacks.fighter2.total / stats.attacks.total) * 100)}%
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Attaques réussies</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <Typography variant="h3" className="mb-2">
                    {stats.attacks.fighter1.successful + stats.attacks.fighter2.successful}
                  </Typography>
                  <Typography variant="body-sm" theme="muted">
                    attaques réussies
                  </Typography>
                </div>
                <div className="mt-4 space-y-3">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Typography variant="body-sm">
                        {match.fighter1?.first_name}
                      </Typography>
                      <Typography variant="body-sm" weight="medium">
                        {stats.attacks.fighter1.successful}
                      </Typography>
                    </div>
                    <Progress value={stats.attacks.fighter1.successRate} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Typography variant="body-sm">
                        {match.fighter2?.first_name}
                      </Typography>
                      <Typography variant="body-sm" weight="medium">
                        {stats.attacks.fighter2.successful}
                      </Typography>
                    </div>
                    <Progress value={stats.attacks.fighter2.successRate} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Taux de réussite</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center h-24 w-24 rounded-full bg-gradient-to-r from-blue-100 to-red-100">
                      <Typography variant="h3">
                        {Math.round(
                          ((stats.attacks.fighter1.successful + stats.attacks.fighter2.successful) / 
                          stats.attacks.total) * 100
                        )}%
                      </Typography>
                    </div>
                    <Typography variant="body-sm" theme="muted" className="mt-2">
                      Moyenne générale
                    </Typography>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <Typography variant="h4" className="text-blue-600">
                        {stats.attacks.fighter1.successRate}%
                      </Typography>
                      <Typography variant="body-sm">
                        {match.fighter1?.first_name}
                      </Typography>
                    </div>
                    <div className="text-center p-3 bg-red-50 rounded-lg">
                      <Typography variant="h4" className="text-red-600">
                        {stats.attacks.fighter2.successRate}%
                      </Typography>
                      <Typography variant="body-sm">
                        {match.fighter2?.first_name}
                      </Typography>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Types d'attaques */}
          <Card>
            <CardHeader>
              <CardTitle>Répartition des attaques</CardTitle>
              <CardDescription>
                Types d'attaques utilisés pendant le match
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Lutteur 1 */}
                <div className="space-y-4">
                  <Typography variant="h5" className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-blue-500" />
                    {match.fighter1?.first_name}
                  </Typography>
                  {[
                    { type: 'Projections', count: 12, percentage: 35 },
                    { type: 'Prises debout', count: 8, percentage: 24 },
                    { type: 'Contrôle au sol', count: 7, percentage: 21 },
                    { type: 'Contre-attaques', count: 6, percentage: 18 },
                    { type: 'Fautes', count: 1, percentage: 3 }
                  ].map((attack, index) => (
                    <div key={index} className="space-y-1">
                      <div className="flex justify-between">
                        <Typography variant="body-sm">{attack.type}</Typography>
                        <Typography variant="body-sm" weight="medium">
                          {attack.count} ({attack.percentage}%)
                        </Typography>
                      </div>
                      <Progress value={attack.percentage} className="h-2 bg-blue-100" />
                    </div>
                  ))}
                </div>

                {/* Lutteur 2 */}
                <div className="space-y-4">
                  <Typography variant="h5" className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-red-500" />
                    {match.fighter2?.first_name}
                  </Typography>
                  {[
                    { type: 'Projections', count: 10, percentage: 28 },
                    { type: 'Prises debout', count: 9, percentage: 25 },
                    { type: 'Contrôle au sol', count: 8, percentage: 22 },
                    { type: 'Contre-attaques', count: 7, percentage: 19 },
                    { type: 'Fautes', count: 2, percentage: 6 }
                  ].map((attack, index) => (
                    <div key={index} className="space-y-1">
                      <div className="flex justify-between">
                        <Typography variant="body-sm">{attack.type}</Typography>
                        <Typography variant="body-sm" weight="medium">
                          {attack.count} ({attack.percentage}%)
                        </Typography>
                      </div>
                      <Progress value={attack.percentage} className="h-2 bg-red-100" />
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </CardContent>
    </Card>
  )
}