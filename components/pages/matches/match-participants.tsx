// components/matches/match-participants.tsx
'use client'

import { motion } from 'framer-motion'
import { Typography } from '@/components/ui/typography'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Match } from '@/types'
import { 
  Trophy, 
  Award, 
  Target, 
  TrendingUp, 
  MapPin, 
  Users,
  Sword,
  Shield,
  Star
} from 'lucide-react'
import Link from 'next/link'

interface MatchParticipantsProps {
  match: Match
}

export function MatchParticipants({ match }: MatchParticipantsProps) {
  const hasWinner = match.winner_fighter_id !== null
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Participants</span>
          {hasWinner && (
            <Badge variant="secondary" className="gap-2">
              <Trophy className="h-4 w-4" />
              Match terminé
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Lutteur 1 */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className={`p-6 rounded-xl border-2 ${
              hasWinner && match.winner_fighter_id === match.fighter1_id
                ? 'border-green-200 bg-green-50'
                : 'border-blue-200 bg-blue-50'
            }`}
          >
            <div className="flex flex-col items-center text-center">
              {/* Avatar et nom */}
              <div className="mb-6">
                <Avatar className="h-24 w-24 mb-4 border-4 border-white shadow-lg">
                  {match.fighter1?.profile_image ? (
                    <AvatarImage src={match.fighter1.profile_image} alt={match.fighter1.first_name} />
                  ) : (
                    <AvatarFallback className="text-2xl bg-blue-100 text-blue-600">
                      {match.fighter1?.first_name?.charAt(0) || '?'}
                    </AvatarFallback>
                  )}
                </Avatar>
                
                <Typography variant="h3" weight="bold" className="mb-2">
                  {match.fighter1 ? `${match.fighter1.first_name} ${match.fighter1.last_name}` : 'À déterminer'}
                </Typography>
                
                {match.fighter1?.nickname && (
                  <Typography variant="body-base" theme="muted" className="italic">
                    "{match.fighter1.nickname}"
                  </Typography>
                )}
              </div>

              {/* Statut de vainqueur */}
              {hasWinner && (
                <div className="mb-6">
                  {match.winner_fighter_id === match.fighter1_id ? (
                    <Badge className="gap-2 px-4 py-2 bg-green-500 hover:bg-green-600">
                      <Trophy className="h-4 w-4" />
                      VAINQUEUR
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="gap-2 px-4 py-2">
                      <Shield className="h-4 w-4" />
                      PERDANT
                    </Badge>
                  )}
                </div>
              )}

              {/* Statistiques */}
              <div className="w-full space-y-4">
                {match.fighter1?.ranking && (
                  <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                    <Typography variant="body-sm" theme="muted" className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Classement
                    </Typography>
                    <Typography variant="body-base" weight="bold">
                      #{match.fighter1.ranking}
                    </Typography>
                  </div>
                )}

                {match.fighter1?.region && (
                  <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                    <Typography variant="body-sm" theme="muted" className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Région
                    </Typography>
                    <Typography variant="body-base" weight="medium">
                      {match.fighter1.region.name}
                    </Typography>
                  </div>
                )}

                {match.fighter1?.is_champion && (
                  <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                    <Typography variant="body-sm" theme="muted" className="flex items-center gap-2">
                      <Award className="h-4 w-4 text-yellow-500" />
                      Titre
                    </Typography>
                    <Badge variant="outline" className="gap-1">
                      <Star className="h-3 w-3 text-yellow-500" />
                      Champion
                    </Badge>
                  </div>
                )}
              </div>

              {/* Bouton profil */}
              {match.fighter1 && (
                <Button variant="outline" className="w-full mt-6 gap-2" asChild>
                  <Link href={`/fighters/${match.fighter1.slug}`}>
                    <Users className="h-4 w-4" />
                    Voir le profil complet
                  </Link>
                </Button>
              )}
            </div>
          </motion.div>

          {/* VS */}
          <div className="hidden lg:flex items-center justify-center">
            <div className="relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-48 w-1 bg-gradient-to-b from-blue-400 via-purple-400 to-red-400 rounded-full" />
              </div>
              <div className="relative bg-white p-6 rounded-full border-4 border-white shadow-xl">
                <div className="h-20 w-20 rounded-full bg-gradient-to-br from-blue-500 to-red-500 flex items-center justify-center">
                  <Typography variant="h2" weight="bold" className="text-white">
                    VS
                  </Typography>
                </div>
              </div>
            </div>
          </div>

          {/* Lutteur 2 */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className={`p-6 rounded-xl border-2 ${
              hasWinner && match.winner_fighter_id === match.fighter2_id
                ? 'border-green-200 bg-green-50'
                : 'border-red-200 bg-red-50'
            }`}
          >
            <div className="flex flex-col items-center text-center">
              {/* Avatar et nom */}
              <div className="mb-6">
                <Avatar className="h-24 w-24 mb-4 border-4 border-white shadow-lg">
                  {match.fighter2?.profile_image ? (
                    <AvatarImage src={match.fighter2.profile_image} alt={match.fighter2.first_name} />
                  ) : (
                    <AvatarFallback className="text-2xl bg-red-100 text-red-600">
                      {match.fighter2?.first_name?.charAt(0) || '?'}
                    </AvatarFallback>
                  )}
                </Avatar>
                
                <Typography variant="h3" weight="bold" className="mb-2">
                  {match.fighter2 ? `${match.fighter2.first_name} ${match.fighter2.last_name}` : 'À déterminer'}
                </Typography>
                
                {match.fighter2?.nickname && (
                  <Typography variant="body-base" theme="muted" className="italic">
                    "{match.fighter2.nickname}"
                  </Typography>
                )}
              </div>

              {/* Statut de vainqueur */}
              {hasWinner && (
                <div className="mb-6">
                  {match.winner_fighter_id === match.fighter2_id ? (
                    <Badge className="gap-2 px-4 py-2 bg-green-500 hover:bg-green-600">
                      <Trophy className="h-4 w-4" />
                      VAINQUEUR
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="gap-2 px-4 py-2">
                      <Shield className="h-4 w-4" />
                      PERDANT
                    </Badge>
                  )}
                </div>
              )}

              {/* Statistiques */}
              <div className="w-full space-y-4">
                {match.fighter2?.ranking && (
                  <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                    <Typography variant="body-sm" theme="muted" className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Classement
                    </Typography>
                    <Typography variant="body-base" weight="bold">
                      #{match.fighter2.ranking}
                    </Typography>
                  </div>
                )}

                {match.fighter2?.region && (
                  <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                    <Typography variant="body-sm" theme="muted" className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Région
                    </Typography>
                    <Typography variant="body-base" weight="medium">
                      {match.fighter2.region.name}
                    </Typography>
                  </div>
                )}

                {match.fighter2?.is_champion && (
                  <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                    <Typography variant="body-sm" theme="muted" className="flex items-center gap-2">
                      <Award className="h-4 w-4 text-yellow-500" />
                      Titre
                    </Typography>
                    <Badge variant="outline" className="gap-1">
                      <Star className="h-3 w-3 text-yellow-500" />
                      Champion
                    </Badge>
                  </div>
                )}
              </div>

              {/* Bouton profil */}
              {match.fighter2 && (
                <Button variant="outline" className="w-full mt-6 gap-2" asChild>
                  <Link href={`/fighters/${match.fighter2.slug}`}>
                    <Users className="h-4 w-4" />
                    Voir le profil complet
                  </Link>
                </Button>
              )}
            </div>
          </motion.div>
        </div>

        {/* VS sur mobile */}
        <div className="lg:hidden flex justify-center my-6">
          <div className="bg-gradient-to-r from-blue-400 to-red-400 p-4 rounded-full">
            <div className="h-16 w-16 rounded-full bg-white flex items-center justify-center">
              <Typography variant="h4" weight="bold" className="bg-gradient-to-r from-blue-600 to-red-600 bg-clip-text text-transparent">
                VS
              </Typography>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}