// components/fighters/profile/fighter-header.tsx
'use client'

import { motion } from 'framer-motion'
import { Typography } from '@/components/ui/typography'
import { Button } from '@/components/ui/button'
import { 
  Trophy, 
  MapPin, 
  Calendar, 
  Weight, 
  Ruler,
  Share2,
  Bookmark,
  Heart,
  Users,
  Flag
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { InteractionButton } from '@/components/shared/interactions-button'
import Image from 'next/image'

interface FighterHeaderProps {
  fighter: any
  region: any
}

export function FighterHeader({ fighter, region }: FighterHeaderProps) {
  if (!fighter) return null

  const age = fighter.birthDate ? 
    new Date().getFullYear() - new Date(fighter.birthDate).getFullYear() : null

  return (
    <section className="relative">
      {/* Cover image */}
      <div className="relative h-64 md:h-80 lg:h-96 overflow-hidden">
        {fighter.coverImage ? (
          <Image
            src={fighter.coverImage}
            alt={`${fighter.firstName} ${fighter.lastName}`}
            fill
            className="object-cover"
            priority
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-secondary/20 to-primary/20" />
        )}
        
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
      </div>

      <div className="container mx-auto px-4 relative -mt-24">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Profile image */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="relative lg:w-64"
          >
            <div className="relative h-64 lg:h-auto aspect-square rounded-2xl border-4 border-background overflow-hidden bg-background shadow-2xl">
              {fighter.profileImage ? (
                <Image
                  src={fighter.profileImage}
                  alt={`${fighter.firstName} ${fighter.lastName}`}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="h-full w-full bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
                  <div className="text-center">
                    <Typography variant="h2" className="text-primary/30">
                      {fighter.firstName.charAt(0)}{fighter.lastName.charAt(0)}
                    </Typography>
                  </div>
                </div>
              )}
              
              {/* Ranking badge */}
              <div className="absolute top-4 right-4">
                <Badge className="font-bold text-lg bg-primary text-primary-foreground">
                  #{fighter.ranking || 'NR'}
                </Badge>
              </div>

              {/* Champion badge */}
              {fighter.isChampion && (
                <div className="absolute top-4 left-4">
                  <Badge className="bg-amber-500 text-amber-50 gap-1">
                    <Trophy className="h-3 w-3" />
                    Champion
                  </Badge>
                </div>
              )}
            </div>
          </motion.div>

          {/* Info */}
          <div className="flex-1">
            <div className="space-y-6">
              {/* Name and nickname */}
              <div>
                <Typography variant="h1" weight="bold" className="mb-2">
                  {fighter.firstName} {fighter.lastName}
                </Typography>
                {fighter.nickname && (
                  <Typography variant="h4" theme="muted" className="italic">
                    "{fighter.nickname}"
                  </Typography>
                )}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/10">
                    <MapPin className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <Typography variant="body-sm" theme="muted">
                      Région
                    </Typography>
                    <Typography variant="body-base" weight="medium">
                      {region?.name || 'Non renseignée'}
                    </Typography>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-500/10">
                    <Calendar className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <Typography variant="body-sm" theme="muted">
                      Âge
                    </Typography>
                    <Typography variant="body-base" weight="medium">
                      {age ? `${age} ans` : 'N/A'}
                    </Typography>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-500/10">
                    <Weight className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <Typography variant="body-sm" theme="muted">
                      Poids
                    </Typography>
                    <Typography variant="body-base" weight="medium">
                      {fighter.weight ? `${fighter.weight} kg` : 'N/A'}
                    </Typography>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-500/10">
                    <Ruler className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <Typography variant="body-sm" theme="muted">
                      Taille
                    </Typography>
                    <Typography variant="body-base" weight="medium">
                      {fighter.height ? `${fighter.height} m` : 'N/A'}
                    </Typography>
                  </div>
                </div>
              </div>

              {/* Region flag */}
              {region?.flagImage && (
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gray-500/10">
                    <Flag className="h-5 w-5 text-gray-600" />
                  </div>
                  <div>
                    <Typography variant="body-sm" theme="muted">
                      Drapeau régional
                    </Typography>
                    <div className="flex items-center gap-2">
                      <div 
                        className="h-6 w-10 rounded border"
                        style={{
                          background: region.color ? `linear-gradient(135deg, ${region.color} 50%, transparent 50%)` : 'gray',
                        }}
                      />
                      <Typography variant="body-sm">
                        {region.code}
                      </Typography>
                    </div>
                  </div>
                </div>
              )}

              {/* Interaction buttons */}
              <div className="flex flex-wrap gap-3 pt-4">
                <InteractionButton
                  type="like"
                  entityType="fighter"
                  entityId={fighter.id}
                  size="lg"
                />
                <InteractionButton
                  type="follow"
                  entityType="fighter"
                  entityId={fighter.id}
                  size="lg"
                />
                <InteractionButton
                  type="bookmark"
                  entityType="fighter"
                  entityId={fighter.id}
                  size="lg"
                />
                <Button variant="outline" size="lg" className="gap-2">
                  <Share2 className="h-4 w-4" />
                  Partager
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}