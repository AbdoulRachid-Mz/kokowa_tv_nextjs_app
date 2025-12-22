// components/fighters/fighter-card.tsx
'use client'

import { motion } from 'framer-motion'
import { Typography } from '@/components/ui/typography'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Swords, 
  Trophy, 
  MapPin, 
  Target, 
  TrendingUp, 
  Users,
  Calendar,
  Weight,
  Ruler
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { cn } from '@/lib/utils'

interface FighterCardProps {
  fighter: any
}

export function FighterCard({ fighter }: FighterCardProps) {
  const getRankingColor = (ranking: number) => {
    if (ranking <= 10) return 'text-yellow-600 bg-yellow-500/10'
    if (ranking <= 50) return 'text-gray-600 bg-gray-500/10'
    return 'text-blue-600 bg-blue-500/10'
  }

  return (
    <motion.div
      whileHover={{ y: -8 }}
      className="group relative h-full"
    >
      <Link href={`/fighters/${fighter.id}`}>
        <div className="relative h-full rounded-2xl border bg-card overflow-hidden hover:shadow-xl transition-all duration-300">
          {/* Cover image */}
          <div className="relative h-48 bg-gradient-to-br from-primary/20 to-secondary/20">
            {fighter.coverImage ? (
              <Image
                src={fighter.coverImage}
                alt={`${fighter.firstName} ${fighter.lastName}`}
                fill
                className="object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <Swords className="h-20 w-20 text-primary/20" />
              </div>
            )}
            
            {/* Ranking badge */}
            <div className="absolute top-4 right-4">
              <Badge className={cn("font-bold text-lg", getRankingColor(fighter.ranking))}>
                #{fighter.ranking || 'NR'}
              </Badge>
            </div>

            {/* Champion badge */}
            {fighter.isChampion && (
              <div className="absolute top-4 left-4">
                <Badge className="bg-amber-500/20 text-amber-600 border-amber-500/30">
                  <Trophy className="h-3 w-3 mr-1" />
                  Champion
                </Badge>
              </div>
            )}

            {/* Region flag */}
            {fighter.regionColor && (
              <div className="absolute bottom-4 left-4">
                <div 
                  className="w-8 h-8 rounded-full border-2 border-white shadow-lg"
                  style={{ backgroundColor: fighter.regionColor }}
                />
              </div>
            )}
          </div>

          {/* Profile image */}
          <div className="absolute top-32 left-1/2 transform -translate-x-1/2">
            <div className="relative h-24 w-24 rounded-full border-4 border-background overflow-hidden bg-background">
              {fighter.profileImage ? (
                <Image
                  src={fighter.profileImage}
                  alt={`${fighter.firstName} ${fighter.lastName}`}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="h-full w-full bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
                  <Swords className="h-12 w-12 text-primary/30" />
                </div>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="pt-16 pb-6 px-6">
            {/* Name */}
            <div className="text-center mb-2">
              <Typography variant="h5" weight="bold" className="mb-1">
                {fighter.firstName} {fighter.lastName}
              </Typography>
              {fighter.nickname && (
                <Typography variant="body-base" theme="muted" className="italic">
                  "{fighter.nickname}"
                </Typography>
              )}
            </div>

            {/* Region */}
            {fighter.regionName && (
              <div className="flex items-center justify-center gap-2 mb-4">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <Typography variant="body-sm" theme="muted">
                  {fighter.regionName}
                </Typography>
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Weight className="h-4 w-4 text-blue-600" />
                  <Typography variant="body-sm" weight="medium">
                    Poids
                  </Typography>
                </div>
                <Typography variant="body-base" weight="bold">
                  {fighter.weight ? `${fighter.weight} kg` : 'N/A'}
                </Typography>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Ruler className="h-4 w-4 text-emerald-600" />
                  <Typography variant="body-sm" weight="medium">
                    Taille
                  </Typography>
                </div>
                <Typography variant="body-base" weight="bold">
                  {fighter.height ? `${fighter.height} m` : 'N/A'}
                </Typography>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Target className="h-4 w-4 text-purple-600" />
                  <Typography variant="body-sm" weight="medium">
                    Début
                  </Typography>
                </div>
                <Typography variant="body-base" weight="bold">
                  {fighter.debutYear || 'N/A'}
                </Typography>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Calendar className="h-4 w-4 text-amber-600" />
                  <Typography variant="body-sm" weight="medium">
                    Âge
                  </Typography>
                </div>
                <Typography variant="body-base" weight="bold">
                  {fighter.birthDate ? 
                    `${new Date().getFullYear() - new Date(fighter.birthDate).getFullYear()} ans` : 
                    'N/A'
                  }
                </Typography>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1">
                Suivre
              </Button>
              <Button size="sm" className="flex-1 group-hover:bg-primary/90">
                Voir profil
              </Button>
            </div>
          </div>

          {/* Hover gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-primary/0 via-primary/0 to-primary/0 group-hover:via-primary/5 group-hover:to-primary/10 transition-all duration-300 rounded-2xl" />
        </div>
      </Link>
    </motion.div>
  )
}