// components/editions/edition-detail-page.tsx
'use client'

import { motion, Variants } from 'framer-motion'
import { Typography } from '@/components/ui/typography'
import { Button } from '@/components/ui/button'
import { 
  Calendar, 
  Users, 
  MapPin, 
  Trophy, 
  Play, 
  Clock,
  Award,
  BarChart3,
  Share2,
  Bookmark,
  Eye,
  TrendingUp,
  Target
} from 'lucide-react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CompetitionEdition } from '@/types'
import { InteractionButton } from '@/components/shared/interactions-button'

interface EditionDetailPageProps {
  edition: CompetitionEdition
}

export default function EditionDetailPage({ edition }: EditionDetailPageProps) {
  const participantCount = (edition.fighters?.length || 0) + (edition.regions?.length || 0)
  const completedPhases = edition.phases?.filter(p => p.is_completed).length || 0
  const totalPhases = edition.phases?.length || 0
  const progressPercentage = totalPhases > 0 ? (completedPhases / totalPhases) * 100 : 0

  const getStatus = () => {
    const now = new Date()
    const startDate = edition.start_date ? new Date(edition.start_date) : null
    const endDate = edition.end_date ? new Date(edition.end_date) : null
    
    if (startDate && endDate) {
      if (now < startDate) {
        return { label: 'À VENIR', color: 'bg-blue-600', icon: Clock }
      } else if (now >= startDate && now <= endDate) {
        return { label: 'EN COURS', color: 'bg-emerald-600', icon: Play }
      } else {
        return { label: 'TERMINÉE', color: 'bg-purple-600', icon: Trophy }
      }
    }
    return { label: 'N/A', color: 'bg-gray-600', icon: Clock }
  }

  const status = getStatus()
  const StatusIcon = status.icon

  const headerVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="relative"
    >
      {/* Hero section */}
      <div className="relative bg-gradient-to-r from-primary/10 via-primary/5 to-secondary/10 py-16">
        <div className="container mx-auto px-4">
          <motion.div
            variants={headerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
              <Link href="/editions" className="hover:text-primary transition-colors">
                Éditions
              </Link>
              <span>/</span>
              <span className="text-foreground">{edition.competition?.name}</span>
            </div>

            {/* Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
              <div>
                <div className="flex items-center gap-4 mb-4">
                  <Badge className={`${status.color} gap-2`}>
                    <StatusIcon className="h-3 w-3" />
                    {status.label}
                  </Badge>
                  <Typography variant="body-base" theme="muted">
                    Édition {edition.edition_number} • {edition.year}
                  </Typography>
                </div>
                <Typography variant="h1" weight="bold" className="mb-4">
                  {edition.theme || `${edition.competition?.name} - Édition ${edition.edition_number}`}
                </Typography>
                <Typography variant="body-lg" theme="muted" className="max-w-3xl">
                  {edition.competition?.description || 'Compétition de lutte traditionnelle'}
                </Typography>
              </div>

              <div className="flex items-center gap-3">
                <InteractionButton
                  type="like"
                  entityType="edition"
                  entityId={edition.id}
                  iconOnly
                  size="lg"
                />
                <InteractionButton
                  type="bookmark"
                  entityType="edition"
                  entityId={edition.id}
                  iconOnly
                  size="lg"
                  variant="outline"
                />
                <Button size="lg" variant="outline" className="gap-2">
                  <Share2 className="h-4 w-4" />
                  Partager
                </Button>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-card/50 backdrop-blur-sm rounded-xl p-4 border">
                <Users className="h-5 w-5 text-primary mb-2" />
                <Typography variant="h4" weight="bold">
                  {participantCount}
                </Typography>
                <Typography variant="body-sm" theme="muted">
                  Participants
                </Typography>
              </div>
              <div className="bg-card/50 backdrop-blur-sm rounded-xl p-4 border">
                <MapPin className="h-5 w-5 text-primary mb-2" />
                <Typography variant="h4" weight="bold">
                  {edition.regions?.length || 0}
                </Typography>
                <Typography variant="body-sm" theme="muted">
                  Régions
                </Typography>
              </div>
              <div className="bg-card/50 backdrop-blur-sm rounded-xl p-4 border">
                <Target className="h-5 w-5 text-primary mb-2" />
                <Typography variant="h4" weight="bold">
                  {totalPhases}
                </Typography>
                <Typography variant="body-sm" theme="muted">
                  Phases
                </Typography>
              </div>
              <div className="bg-card/50 backdrop-blur-sm rounded-xl p-4 border">
                <Calendar className="h-5 w-5 text-primary mb-2" />
                <Typography variant="h4" weight="bold">
                  {edition.start_date && edition.end_date ? (
                    <>
                      {new Date(edition.start_date).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' })} - 
                      {new Date(edition.end_date).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </>
                  ) : 'N/A'}
                </Typography>
                <Typography variant="body-sm" theme="muted">
                  Dates
                </Typography>
              </div>
            </div>

            {/* Progress bar */}
            {totalPhases > 0 && (
              <div className="mb-8">
                <div className="flex justify-between text-sm mb-2">
                  <span>Progression des phases</span>
                  <span>{completedPhases}/{totalPhases} phases terminées</span>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercentage}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="h-full bg-primary"
                  />
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Main content */}
      <div className="container mx-auto px-4 py-12">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid grid-cols-2 lg:grid-cols-5 mb-8">
            <TabsTrigger value="overview" className="gap-2">
              <Eye className="h-4 w-4" />
              Vue d'ensemble
            </TabsTrigger>
            <TabsTrigger value="participants" className="gap-2">
              <Users className="h-4 w-4" />
              Participants
            </TabsTrigger>
            <TabsTrigger value="phases" className="gap-2">
              <Target className="h-4 w-4" />
              Phases
            </TabsTrigger>
            <TabsTrigger value="results" className="gap-2">
              <Trophy className="h-4 w-4" />
              Résultats
            </TabsTrigger>
            <TabsTrigger value="stats" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Statistiques
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-8">
            {/* Competition info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-card rounded-xl border p-6"
            >
              <Typography variant="h4" weight="medium" className="mb-4">
                À propos de la compétition
              </Typography>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <Typography variant="body-base" className="mb-4">
                    {edition.competition?.description || 'Cette édition fait partie de la compétition de lutte traditionnelle.'}
                  </Typography>
                  {edition.theme && (
                    <div className="mb-4">
                      <Typography variant="body-sm" weight="medium" className="mb-1">
                        Thème de l'édition:
                      </Typography>
                      <Typography variant="body-base" className="text-primary">
                        "{edition.theme}"
                      </Typography>
                    </div>
                  )}
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Typography variant="body-sm" theme="muted">Compétition:</Typography>
                    <Typography variant="body-base" weight="medium">
                      {edition.competition?.name}
                    </Typography>
                  </div>
                  <div className="flex items-center justify-between">
                    <Typography variant="body-sm" theme="muted">Numéro d'édition:</Typography>
                    <Typography variant="body-base" weight="medium">
                      {edition.edition_number}
                    </Typography>
                  </div>
                  <div className="flex items-center justify-between">
                    <Typography variant="body-sm" theme="muted">Année:</Typography>
                    <Typography variant="body-base" weight="medium">
                      {edition.year}
                    </Typography>
                  </div>
                  {edition.prize_pool && (
                    <div className="flex items-center justify-between">
                      <Typography variant="body-sm" theme="muted">Prix total:</Typography>
                      <Typography variant="body-base" weight="medium" className="text-primary">
                        {edition.prize_pool.toLocaleString('fr-FR')} FCFA
                      </Typography>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Key dates */}
            {(edition.start_date || edition.end_date || edition.registration_deadline) && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="bg-card rounded-xl border p-6"
              >
                <Typography variant="h4" weight="medium" className="mb-4">
                  Dates importantes
                </Typography>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {edition.registration_deadline && (
                    <div className="text-center p-4 bg-primary/5 rounded-lg">
                      <Calendar className="h-8 w-8 text-primary mx-auto mb-2" />
                      <Typography variant="body-sm" weight="medium" className="mb-1">
                        Fin des inscriptions
                      </Typography>
                      <Typography variant="body-base">
                        {new Date(edition.registration_deadline).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </Typography>
                    </div>
                  )}
                  {edition.start_date && (
                    <div className="text-center p-4 bg-primary/5 rounded-lg">
                      <Play className="h-8 w-8 text-primary mx-auto mb-2" />
                      <Typography variant="body-sm" weight="medium" className="mb-1">
                        Début
                      </Typography>
                      <Typography variant="body-base">
                        {new Date(edition.start_date).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </Typography>
                    </div>
                  )}
                  {edition.end_date && (
                    <div className="text-center p-4 bg-primary/5 rounded-lg">
                      <Trophy className="h-8 w-8 text-primary mx-auto mb-2" />
                      <Typography variant="body-sm" weight="medium" className="mb-1">
                        Fin
                      </Typography>
                      <Typography variant="body-base">
                        {new Date(edition.end_date).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </Typography>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </TabsContent>

          <TabsContent value="participants">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Regions */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="bg-card rounded-xl border p-6"
              >
                <Typography variant="h4" weight="medium" className="mb-4">
                  Régions participantes ({edition.regions?.length || 0})
                </Typography>
                <div className="space-y-3">
                  {edition.regions?.map((region: any) => (
                    <div
                      key={region.id}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      {region.region?.flag_image ? (
                        <img
                          src={region.region.flag_image}
                          alt={region.region.name}
                          className="h-10 w-10 rounded object-cover"
                        />
                      ) : (
                        <div 
                          className="h-10 w-10 rounded flex items-center justify-center text-white"
                          style={{ backgroundColor: region.region?.color || '#3b82f6' }}
                        >
                          <Typography variant="body-base" weight="bold">
                            {region.region?.name?.charAt(0)}
                          </Typography>
                        </div>
                      )}
                      <div className="flex-1">
                        <Typography variant="body-base" weight="medium">
                          {region.region?.name}
                        </Typography>
                        <Typography variant="body-sm" theme="muted">
                          {region.status === 'approved' ? 'Confirmée' : 
                           region.status === 'registered' ? 'En attente' : 'Refusée'}
                        </Typography>
                      </div>
                      <Badge variant={region.status === 'approved' ? 'default' : 'outline'}>
                        {region.fighters_count || 0} lutteurs
                      </Badge>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Top fighters */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="bg-card rounded-xl border p-6"
              >
                <Typography variant="h4" weight="medium" className="mb-4">
                  Lutteurs ({edition.fighters?.length || 0})
                </Typography>
                <div className="space-y-3">
                  {edition.fighters?.slice(0, 8).map((fighter: any) => (
                    <div
                      key={fighter.id}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      {fighter.fighter?.profile_image ? (
                        <img
                          src={fighter.fighter.profile_image}
                          alt={fighter.fighter.first_name}
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Typography variant="body-base" weight="medium" className="text-primary">
                            {fighter.fighter?.first_name?.charAt(0)}
                          </Typography>
                        </div>
                      )}
                      <div className="flex-1">
                        <Typography variant="body-base" weight="medium">
                          {fighter.fighter?.first_name} {fighter.fighter?.last_name}
                        </Typography>
                        <Typography variant="body-sm" theme="muted">
                          {fighter.fighter?.nickname}
                        </Typography>
                      </div>
                      <Badge variant={fighter.fighter?.is_champion ? 'default' : 'outline'}>
                        {fighter.fighter?.ranking || 'NC'}
                      </Badge>
                    </div>
                  ))}
                </div>
                {edition.fighters && edition.fighters.length > 8 && (
                  <Button variant="outline" className="w-full mt-4" asChild>
                    <Link href={`/editions/${edition.id}/fighters`}>
                      Voir tous les lutteurs
                    </Link>
                  </Button>
                )}
              </motion.div>
            </div>
          </TabsContent>

          <TabsContent value="phases">
            <div className="space-y-6">
              {edition.phases?.map((phase: any) => (
                <motion.div
                  key={phase.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="bg-card rounded-xl border p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <Badge variant={phase.is_completed ? 'default' : phase.is_active ? 'destructive' : 'outline'}>
                          {phase.is_completed ? 'TERMINÉE' : phase.is_active ? 'EN COURS' : 'À VENIR'}
                        </Badge>
                        <Typography variant="h5" weight="medium">
                          {phase.name}
                        </Typography>
                      </div>
                      <Typography variant="body-sm" theme="muted">
                        {phase.description || 'Phase de compétition'}
                      </Typography>
                    </div>
                    <div className="text-right">
                      <Typography variant="body-sm" theme="muted">
                        Phase {phase.phase_order}
                      </Typography>
                      <Typography variant="body-sm" weight="medium">
                        {phase.phase_type}
                      </Typography>
                    </div>
                  </div>

                  {/* Phase dates */}
                  {(phase.start_date || phase.end_date) && (
                    <div className="flex items-center gap-4 mb-4">
                      {phase.start_date && (
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <Typography variant="body-sm">
                            Du {new Date(phase.start_date).toLocaleDateString('fr-FR')}
                          </Typography>
                        </div>
                      )}
                      {phase.end_date && (
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <Typography variant="body-sm">
                            Au {new Date(phase.end_date).toLocaleDateString('fr-FR')}
                          </Typography>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Groups */}
                  {phase.groups && phase.groups.length > 0 && (
                    <div className="mt-4">
                      <Typography variant="body-base" weight="medium" className="mb-3">
                        Groupes ({phase.groups.length})
                      </Typography>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {phase.groups.map((group: any) => (
                          <div
                            key={group.id}
                            className="p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors"
                          >
                            <Typography variant="body-sm" weight="medium" className="mb-1">
                              {group.name}
                            </Typography>
                            <Typography variant="body-sm" theme="muted">
                              {group.description || `Groupe ${group.group_order}`}
                            </Typography>
                            {group.sub_groups && group.sub_groups.length > 0 && (
                              <Typography variant="caption1" theme="muted" className="mt-2 block">
                                {group.sub_groups.length} sous-groupes
                              </Typography>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </motion.div>
  )
}