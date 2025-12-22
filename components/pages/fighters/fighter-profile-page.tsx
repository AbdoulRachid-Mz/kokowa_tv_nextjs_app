// components/fighters/fighter-profile-page.tsx
'use client'

import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { getMobileFighterById, getMobileFighterMatches } from '@/actions/mobile/fighters'
import { FighterHeader } from './profile/fighter-header'
import { FighterStats } from './profile/fighter-stats'
import { LoadingScreen } from '@/components/layout/loading-screen'
import { FighterAchievements } from './profile/fighter-achievements'
import { FighterBio } from './profile/fighter-bio'
import { FighterMatches } from './profile/fighter-matches'
import { FighterCards } from './profile/fighter-cards'
import { FighterTransfers } from './profile/fighter-transfers'
import { FighterTimeline } from './profile/fighter-timeline'
import { ErrorState } from '@/components/ui/error-state'



interface FighterProfilePageProps {
  fighterId: number
}

export default function FighterProfilePage({ fighterId }: FighterProfilePageProps) {
  const { data: fighterData, isLoading: fighterLoading, error: fighterError } = useQuery({
    queryKey: ['fighter', fighterId],
    queryFn: async () => {
      const result = await getMobileFighterById(fighterId)
      if (!result.success || !result.data) {
        throw new Error(result.error?.message || 'Lutteur non trouvé')
      }
      return result.data
    },
    enabled: !!fighterId
  })

  const { data: matchesData, isLoading: matchesLoading } = useQuery({
    queryKey: ['fighter-matches', fighterId],
    queryFn: async () => {
      const result = await getMobileFighterMatches(fighterId)
      if (!result.success || !result.data) {
        throw new Error(result.error?.message || 'Erreur lors du chargement des matchs')
      }
      return result.data
    },
    enabled: !!fighterId
  })

  if (fighterLoading) {
    return <LoadingScreen />
  }

  if (fighterError) {
    return (
    <ErrorState
      title="Lutteur non trouvé"
      message="Le lutteur que vous recherchez n'existe pas ou a été supprimé."
      actionLabel="Retour aux lutteurs"
      actionHref="/fighters"
    />
    )
  }

  const { fighter, region, stats, achievements, transfers, cards } = fighterData || {}

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen"
    >
      {/* Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-primary/5" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-500/10 via-transparent to-transparent" />
      </div>

      <div className="relative">
        <FighterHeader fighter={fighter} region={region} />
        
        <div className="container mx-auto px-4 py-8">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-8">
              <FighterStats stats={stats} fighter={fighter} />
              <FighterCards cards={cards || []} />
              <FighterTransfers transfers={transfers || []} />
            </div>

            {/* Main content */}
            <div className="lg:col-span-2 space-y-8">
              <FighterBio fighter={fighter} />
              <FighterAchievements achievements={achievements || []} />
              <FighterMatches 
                matches={matchesData?.matches} 
                loading={matchesLoading}
              />
              <FighterTimeline matches={matchesData?.matches?.all || []} />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}