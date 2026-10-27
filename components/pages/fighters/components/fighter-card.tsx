// components/pages/fighters/components/fighter-card.tsx
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
  Calendar, 
  Weight, 
  Ruler,
  Bell,
  ArrowRight
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { useInteractions } from '@/hooks/use-interactions'

interface FighterCardProps {
  fighter: any
}

export function FighterCard({ fighter }: FighterCardProps) {
  // Support transparent des noms de champs snake_case et camelCase
  const id = fighter.id
  const firstName = fighter.first_name || fighter.firstName || ''
  const lastName = fighter.last_name || fighter.lastName || ''
  const nickname = fighter.nickname || ''
  const profileImage = fighter.profile_picture || fighter.profile_image || fighter.profileImage || null
  const coverImage = fighter.cover_image || fighter.coverImage || null
  const ranking = fighter.ranking || null
  const isChampion = Boolean(fighter.is_champion || fighter.isChampion)
  const regionName = fighter.region?.name || fighter.region_name || fighter.regionName || null
  const regionColor = fighter.region?.color || fighter.region_color || fighter.regionColor || null
  const weight = fighter.weight || null
  const height = fighter.height || null
  const debutYear = fighter.debut_year || fighter.debutYear || null
  const birthDate = fighter.birth_date || fighter.birthDate || null

  const age = birthDate
    ? new Date().getFullYear() - new Date(birthDate).getFullYear()
    : null

  // Interaction (suivre le lutteur)
  const { followed, loading: followLoading, handleFollow } = useInteractions('fighter', id || 0)

  const getRankingBadge = (rank: number | null) => {
    if (!rank) {
      return (
        <Badge variant="outline" className="bg-background/80 backdrop-blur-md text-xs font-semibold">
          NR
        </Badge>
      )
    }
    if (rank <= 3) {
      return (
        <Badge className="bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-bold border-amber-300 shadow-md">
          #{rank} Élite
        </Badge>
      )
    }
    if (rank <= 10) {
      return (
        <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30 font-bold">
          #{rank} Top 10
        </Badge>
      )
    }
    return (
      <Badge variant="secondary" className="font-semibold bg-background/80 backdrop-blur-md">
        #{rank}
      </Badge>
    )
  }

  return (
    <motion.div
      whileHover={{ y: -6 }}
      transition={{ duration: 0.25 }}
      className="group relative h-full flex flex-col"
    >
      <div className="relative h-full rounded-2xl border bg-card/80 backdrop-blur-sm overflow-hidden hover:shadow-2xl hover:border-primary/40 transition-all duration-300 flex flex-col">
        {/* En-tête / Bannière avec image de fond ou dégradé */}
        <div className="relative h-44 bg-gradient-to-br from-primary/25 via-secondary/15 to-primary/5 overflow-hidden">
          {coverImage ? (
            <Image
              src={coverImage}
              alt={`${firstName} ${lastName}`}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center opacity-15">
              <Swords className="h-28 w-28 text-primary" />
            </div>
          )}

          {/* Overlay dégradé sombre en bas de la bannière */}
          <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />

          {/* Badges en haut */}
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10">
            {isChampion ? (
              <Badge className="bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-extrabold shadow-lg border-yellow-300 gap-1 px-2.5 py-1">
                <Trophy className="h-3.5 w-3.5 fill-black" />
                Champion
              </Badge>
            ) : <span />}

            <div className="flex items-center gap-1.5">
              {getRankingBadge(ranking)}
            </div>
          </div>

          {/* Badge Région */}
          {regionName && (
            <div className="absolute bottom-3 left-4 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-background/85 backdrop-blur-md border text-xs font-medium shadow-sm">
              {regionColor ? (
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: regionColor }}
                />
              ) : (
                <MapPin className="h-3 w-3 text-primary" />
              )}
              <span className="truncate max-w-[120px]">{regionName}</span>
            </div>
          )}
        </div>

        {/* Photo de profil centrée en relief */}
        <div className="relative -mt-12 flex justify-center z-20">
          <div className="relative h-24 w-24 rounded-full border-4 border-background shadow-xl overflow-hidden bg-muted group-hover:scale-105 transition-transform duration-300">
            {profileImage ? (
              <Image
                src={profileImage}
                alt={`${firstName} ${lastName}`}
                fill
                className="object-cover"
              />
            ) : (
              <div className="h-full w-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl">
                {firstName.charAt(0)}{lastName.charAt(0)}
              </div>
            )}
          </div>
        </div>

        {/* Contenu et caractéristiques du lutteur */}
        <div className="px-5 pt-3 pb-5 flex-1 flex flex-col justify-between space-y-4">
          {/* Nom et surnom */}
          <div className="text-center">
            <Typography variant="h5" weight="bold" className="group-hover:text-primary transition-colors line-clamp-1">
              {firstName} {lastName}
            </Typography>
            {nickname && (
              <Typography variant="body-sm" theme="muted" className="italic mt-0.5 line-clamp-1">
                « {nickname} »
              </Typography>
            )}
          </div>

          {/* Grille de caractéristiques physiques & carrière */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-xl bg-muted/40 border border-muted flex items-center gap-2">
              <Weight className="h-4 w-4 text-blue-500 shrink-0" />
              <div className="min-w-0">
                <span className="text-[11px] text-muted-foreground block">Poids</span>
                <span className="font-semibold truncate block">
                  {weight ? `${weight} kg` : '—'}
                </span>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-muted/40 border border-muted flex items-center gap-2">
              <Ruler className="h-4 w-4 text-emerald-500 shrink-0" />
              <div className="min-w-0">
                <span className="text-[11px] text-muted-foreground block">Taille</span>
                <span className="font-semibold truncate block">
                  {height ? `${height} m` : '—'}
                </span>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-muted/40 border border-muted flex items-center gap-2">
              <Target className="h-4 w-4 text-purple-500 shrink-0" />
              <div className="min-w-0">
                <span className="text-[11px] text-muted-foreground block">Début</span>
                <span className="font-semibold truncate block">
                  {debutYear || '—'}
                </span>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-muted/40 border border-muted flex items-center gap-2">
              <Calendar className="h-4 w-4 text-amber-500 shrink-0" />
              <div className="min-w-0">
                <span className="text-[11px] text-muted-foreground block">Âge</span>
                <span className="font-semibold truncate block">
                  {age ? `${age} ans` : '—'}
                </span>
              </div>
            </div>
          </div>

          {/* Boutons d'action */}
          <div className="flex gap-2 pt-1">
            <Button
              variant={followed ? "default" : "outline"}
              size="sm"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                handleFollow()
              }}
              disabled={followLoading}
              className="flex-1 gap-1.5 text-xs h-9"
            >
              <Bell className={cn("h-3.5 w-3.5", followed && "fill-current")} />
              {followed ? "Suivi" : "Suivre"}
            </Button>

            <Button asChild size="sm" className="flex-1 gap-1 text-xs h-9">
              <Link href={`/fighters/${id}`}>
                Profil
                <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
