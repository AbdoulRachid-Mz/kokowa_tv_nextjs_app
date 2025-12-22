// components/competitions/competition-detail-page.tsx
'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Typography } from '@/components/ui/typography'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Trophy, 
  Calendar, 
  MapPin, 
  Users, 
  Award,
  TrendingUp,
  BarChart3,
  Clock,
  Play,
  ChevronRight,
  Share2,
  Bookmark,
  Eye,
  Swords
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { useCompetition, useEditions } from '@/hooks/use-competitions'
import { Skeleton } from '@/components/ui/skeleton'
import { useScreenSize } from '@/hooks/use-screen'
import { EditionCard } from './components/edition-card'

interface CompetitionDetailPageProps {
  competitionId: string
}

export default function CompetitionDetailPage({ competitionId }: CompetitionDetailPageProps) {
  const { isLargeScreen } = useScreenSize()
  const [activeTab, setActiveTab] = useState('editions')
  
  const { data: competition, isLoading, error } = useCompetition("11")
  const editions = competition?.editions || [];
  const editionsLoading = false
//   const { editions, isLoading: editionsLoading } = useEditions({
//     competition_id: competition?.id,
//     limit: 10,
//     with_phases: true,
//     with_fighters: true,
//     with_regions: true
//   })

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-6xl mx-auto">
          <Skeleton className="h-12 w-64 mb-6" />
          <Skeleton className="h-96 w-full mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    )
  }

  if (error || !competition) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <Trophy className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-20" />
        <Typography variant="h4" className="mb-2">
          Compétition non trouvée
        </Typography>
        <Typography variant="body-base" theme="muted" className="mb-6">
          La compétition que vous recherchez n'existe pas ou a été déplacée.
        </Typography>
        <Button asChild>
          <Link href="/competitions">
            Retour aux compétitions
          </Link>
        </Button>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ongoing': return 'bg-green-500'
      case 'upcoming': return 'bg-blue-500'
      case 'completed': return 'bg-purple-500'
      case 'cancelled': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ongoing': return 'En cours'
      case 'upcoming': return 'À venir'
      case 'completed': return 'Terminée'
      case 'cancelled': return 'Annulée'
      default: return status
    }
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5 }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/10">
      {/* Hero Section */}
      <section className="relative py-16 overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0">
          {competition.featured_image ? (
            <Image
              src={competition.featured_image}
              alt={competition.name}
              fill
              className="object-cover opacity-20"
              priority
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-secondary/10" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Breadcrumb */}
            <motion.div variants={itemVariants} className="mb-6">
              <nav className="flex items-center gap-2 text-sm">
                <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">
                  Accueil
                </Link>
                <ChevronRight className="h-3 w-3 text-muted-foreground" />
                <Link href="/competitions" className="text-muted-foreground hover:text-foreground transition-colors">
                  Compétitions
                </Link>
                <ChevronRight className="h-3 w-3 text-muted-foreground" />
                <span className="text-foreground font-medium">{competition.name}</span>
              </nav>
            </motion.div>

            {/* Header */}
            <div className="grid lg:grid-cols-2 gap-8 items-start">
              <motion.div variants={itemVariants}>
                <div className="flex items-center gap-3 mb-4">
                  <div className={`h-3 w-3 rounded-full ${getStatusColor(competition.status)}`} />
                  <Badge variant="outline">
                    {getStatusText(competition.status)}
                  </Badge>
                  <div className="flex items-center gap-2 ml-auto">
                    <Button variant="ghost" size="icon">
                      <Bookmark className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <Typography variant="h1" weight="bold" className="mb-4">
                  {competition.name}
                </Typography>

                <Typography variant="body-lg" theme="muted" className="mb-8">
                  {competition.description || 'Pas de description disponible'}
                </Typography>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  <div className="text-center p-4 rounded-xl bg-card border">
                    <Typography variant="h3" weight="bold" className="text-primary">
                      {competition.editions?.length || 0}
                    </Typography>
                    <Typography variant="body-sm" theme="muted">
                      Éditions
                    </Typography>
                  </div>
                  
                  <div className="text-center p-4 rounded-xl bg-card border">
                    <Typography variant="h3" weight="bold" className="text-blue-600">
                      {competition.phases?.length || 0}
                    </Typography>
                    <Typography variant="body-sm" theme="muted">
                      Phases
                    </Typography>
                  </div>
                  
                  {competition.region && (
                    <div className="text-center p-4 rounded-xl bg-card border">
                      <MapPin className="h-6 w-6 mx-auto mb-2 text-green-600" />
                      <Typography variant="body-sm" theme="muted">
                        {competition.region.name}
                      </Typography>
                    </div>
                  )}
                  
                  <div className="text-center p-4 rounded-xl bg-card border">
                    <Eye className="h-6 w-6 mx-auto mb-2 text-purple-600" />
                    <Typography variant="body-sm" theme="muted">
                      {competition.view_count || 0} vues
                    </Typography>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-3">
                  {competition.status === 'ongoing' && (
                    <Button className="gap-2">
                      <Play className="h-4 w-4" />
                      Suivre en direct
                    </Button>
                  )}
                  <Button variant="outline" className="gap-2">
                    <Calendar className="h-4 w-4" />
                    Calendrier
                  </Button>
                  <Button variant="outline" className="gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Statistiques
                  </Button>
                </div>
              </motion.div>

              {/* Image */}
              <motion.div variants={itemVariants} className="relative">
                <div className="relative h-64 lg:h-96 rounded-2xl overflow-hidden border shadow-2xl">
                  {competition.featured_image ? (
                    <Image
                      src={competition.featured_image}
                      alt={competition.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                      <Trophy className="h-24 w-24 text-primary/50" />
                    </div>
                  )}
                  
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  
                  {/* Featured edition */}
                  {competition.editions?.[0] && (
                    <div className="absolute bottom-4 left-4 right-4">
                      <div className="bg-black/60 backdrop-blur-sm rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="secondary">
                            Édition en cours
                          </Badge>
                          <Typography variant="body-sm" className="text-white/80">
                            {competition.editions[0].year}
                          </Typography>
                        </div>
                        <Typography variant="body-base" weight="medium" className="text-white">
                          {competition.editions[0].theme || `Édition ${competition.editions[0].year}`}
                        </Typography>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-10">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-2 lg:grid-cols-4 mb-8">
                <TabsTrigger value="editions" className="gap-2">
                  <Trophy className="h-4 w-4" />
                  Éditions
                </TabsTrigger>
                <TabsTrigger value="phases" className="gap-2">
                  <Calendar className="h-4 w-4" />
                  Phases
                </TabsTrigger>
                <TabsTrigger value="statistics" className="gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Statistiques
                </TabsTrigger>
                <TabsTrigger value="info" className="gap-2">
                  <Award className="h-4 w-4" />
                  Informations
                </TabsTrigger>
              </TabsList>

              {/* Editions Tab */}
              <TabsContent value="editions" className="space-y-8">
                <div className="flex items-center justify-between mb-6">
                  <Typography variant="h3" weight="bold">
                    Toutes les éditions
                  </Typography>
                  <Button variant="outline" className="gap-2" asChild>
                    <Link href={`/ad/competitions/${competition.id}/editions/create`}>
                      Ajouter une édition
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>

                {editionsLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-64" />
                    ))}
                  </div>
                ) : editions.length === 0 ? (
                  <div className="text-center py-12">
                    <Trophy className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-20" />
                    <Typography variant="h4" className="mb-2">
                      Aucune édition disponible
                    </Typography>
                    <Typography variant="body-base" theme="muted">
                      Aucune édition n'a été créée pour cette compétition.
                    </Typography>
                  </div>
                ) : (
                  <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                  >
                    {editions.map((edition: any) => (
                      <motion.div key={edition.id} variants={itemVariants}>
                        <EditionCard edition={edition} />
                      </motion.div>
                    ))}
                  </motion.div>
                )}

                {/* Timeline */}
                {editions.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="mt-12"
                  >
                    <Typography variant="h4" weight="bold" className="mb-6">
                      Timeline des éditions
                    </Typography>
                    <div className="relative">
                      {/* Timeline line */}
                      <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-primary/20" />
                      
                      <div className="space-y-8 relative">
                        {[...editions]
                          .sort((a, b) => b.year - a.year)
                          .map((edition, index) => (
                            <div key={edition.id} className="relative pl-16">
                              {/* Timeline dot */}
                              <div className="absolute left-6 top-4 h-4 w-4 rounded-full border-4 border-background bg-primary z-10" />
                              
                              <div className="bg-card border rounded-xl p-6 hover:shadow-lg transition-shadow">
                                <div className="flex items-start justify-between mb-3">
                                  <div>
                                    <Typography variant="h5" weight="bold" className="mb-1">
                                      Édition {edition.edition_number} - {edition.year}
                                    </Typography>
                                    <Typography variant="body-sm" theme="muted">
                                      {edition.theme || `Édition ${edition.year}`}
                                    </Typography>
                                  </div>
                                  <Badge variant={
                                    new Date(edition.end_date) < new Date() ? 'outline' : 
                                    new Date(edition.start_date) > new Date() ? 'secondary' : 
                                    'destructive'
                                  }>
                                    {new Date(edition.end_date) < new Date() ? 'Terminée' : 
                                     new Date(edition.start_date) > new Date() ? 'À venir' : 
                                     'En cours'}
                                  </Badge>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                  <div>
                                    <Typography variant="body-sm" theme="muted" className="mb-1">
                                      Date de début
                                    </Typography>
                                    <Typography variant="body-sm" weight="medium">
                                      {new Date(edition.start_date).toLocaleDateString('fr-FR')}
                                    </Typography>
                                  </div>
                                  <div>
                                    <Typography variant="body-sm" theme="muted" className="mb-1">
                                      Date de fin
                                    </Typography>
                                    <Typography variant="body-sm" weight="medium">
                                      {new Date(edition.end_date).toLocaleDateString('fr-FR')}
                                    </Typography>
                                  </div>
                                </div>
                                
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2">
                                      <Users className="h-4 w-4" />
                                      <Typography variant="body-sm">
                                        {edition.total_participants || 0} participants
                                      </Typography>
                                    </div>
                                    {edition.winner_fighter && (
                                      <div className="flex items-center gap-2">
                                        <Award className="h-4 w-4" />
                                        <Typography variant="body-sm">
                                          {edition.winner_fighter.first_name}
                                        </Typography>
                                      </div>
                                    )}
                                  </div>
                                  <Button size="sm" variant="ghost" asChild>
                                    <Link href={`/editions/${edition.id}`}>
                                      Voir détails
                                    </Link>
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </TabsContent>

              {/* Phases Tab */}
              <TabsContent value="phases">
                {competition.phases && competition.phases.length > 0 ? (
                  <div className="space-y-6">
                    {competition.phases.map((phase: any) => (
                      <div key={phase.id} className="border rounded-xl p-6">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Calendar className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <Typography variant="h5" weight="bold">
                              {phase.name}
                            </Typography>
                            <Typography variant="body-sm" theme="muted">
                              {phase.phase_type} • Phase {phase.phase_order}
                            </Typography>
                          </div>
                          <Badge className="ml-auto">
                            {phase.is_completed ? 'Terminée' : 'En cours'}
                          </Badge>
                        </div>
                        
                        {phase.groups && phase.groups.length > 0 && (
                          <div className="space-y-4">
                            <Typography variant="h6" weight="medium" className="mb-3">
                              Groupes ({phase.groups.length})
                            </Typography>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {phase.groups.map((group: any) => (
                                <div key={group.id} className="border rounded-lg p-4">
                                  <Typography variant="body-base" weight="medium" className="mb-2">
                                    {group.name}
                                  </Typography>
                                  {group.sub_groups && group.sub_groups.length > 0 && (
                                    <div className="space-y-2">
                                      <Typography variant="body-sm" theme="muted">
                                        {group.sub_groups.length} sous-groupes
                                      </Typography>
                                      <div className="flex flex-wrap gap-2">
                                        {group.sub_groups.slice(0, 3).map((subGroup: any) => (
                                          <Badge key={subGroup.id} variant="outline">
                                            {subGroup.name}
                                          </Badge>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Calendar className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-20" />
                    <Typography variant="h4" className="mb-2">
                      Aucune phase disponible
                    </Typography>
                    <Typography variant="body-base" theme="muted">
                      Les phases de cette compétition n'ont pas encore été créées.
                    </Typography>
                  </div>
                )}
              </TabsContent>

              {/* Statistics Tab */}
              <TabsContent value="statistics">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Overall stats */}
                  <div className="space-y-6">
                    <Typography variant="h4" weight="bold" className="mb-4">
                      Statistiques générales
                    </Typography>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="border rounded-xl p-6 text-center">
                        <Typography variant="h3" weight="bold" className="text-primary mb-2">
                          {competition.editions?.length || 0}
                        </Typography>
                        <Typography variant="body-sm" theme="muted">
                          Éditions
                        </Typography>
                      </div>
                      
                      <div className="border rounded-xl p-6 text-center">
                        <Typography variant="h3" weight="bold" className="text-blue-600 mb-2">
                          {competition.phases?.length || 0}
                        </Typography>
                        <Typography variant="body-sm" theme="muted">
                          Phases
                        </Typography>
                      </div>
                      
                      <div className="border rounded-xl p-6 text-center">
                        <Typography variant="h3" weight="bold" className="text-green-600 mb-2">
                          {competition.matches?.length || 0}
                        </Typography>
                        <Typography variant="body-sm" theme="muted">
                          Matchs
                        </Typography>
                      </div>
                      
                      <div className="border rounded-xl p-6 text-center">
                        <Typography variant="h3" weight="bold" className="text-purple-600 mb-2">
                          {competition.view_count || 0}
                        </Typography>
                        <Typography variant="body-sm" theme="muted">
                          Vues
                        </Typography>
                      </div>
                    </div>
                  </div>

                  {/* Performance timeline */}
                  <div>
                    <Typography variant="h4" weight="bold" className="mb-4">
                      Performance par édition
                    </Typography>
                    <div className="border rounded-xl p-6">
                      {editions.length > 0 ? (
                        <div className="space-y-4">
                          {editions.map((edition: any) => (
                            <div key={edition.id} className="flex items-center justify-between">
                              <div>
                                <Typography variant="body-base" weight="medium">
                                  Édition {edition.year}
                                </Typography>
                                <Typography variant="body-sm" theme="muted">
                                  {edition.total_participants || 0} participants
                                </Typography>
                              </div>
                              <div className="text-right">
                                <Typography variant="body-base" weight="medium">
                                  {edition.winner_fighter?.first_name || 'Non déterminé'}
                                </Typography>
                                <Typography variant="body-sm" theme="muted">
                                  Vainqueur
                                </Typography>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-20" />
                          <Typography variant="body-base" theme="muted">
                            Aucune statistique disponible
                          </Typography>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Info Tab */}
              <TabsContent value="info">
                <div className="grid lg:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <Typography variant="h4" weight="bold" className="mb-4">
                      Informations générales
                    </Typography>
                    
                    <div className="space-y-4">
                      <div>
                        <Typography variant="body-sm" theme="muted" className="mb-1">
                          Statut
                        </Typography>
                        <div className="flex items-center gap-2">
                          <div className={`h-3 w-3 rounded-full ${getStatusColor(competition.status)}`} />
                          <Typography variant="body-base" weight="medium">
                            {getStatusText(competition.status)}
                          </Typography>
                        </div>
                      </div>
                      
                      {competition.region && (
                        <div>
                          <Typography variant="body-sm" theme="muted" className="mb-1">
                            Région
                          </Typography>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <Typography variant="body-base" weight="medium">
                              {competition.region.name}
                            </Typography>
                          </div>
                        </div>
                      )}
                      
                      <div>
                        <Typography variant="body-sm" theme="muted" className="mb-1">
                          Date de création
                        </Typography>
                        <Typography variant="body-base" weight="medium">
                          {new Date(competition.created_at).toLocaleDateString('fr-FR')}
                        </Typography>
                      </div>
                    </div>
                  </div>

                  <div>
                    <Typography variant="h4" weight="bold" className="mb-4">
                      Description détaillée
                    </Typography>
                    <div className="prose prose-gray dark:prose-invert max-w-none">
                      {competition.description ? (
                        <div dangerouslySetInnerHTML={{ __html: competition.description }} />
                      ) : (
                        <div className="text-center py-8">
                          <Typography variant="body-base" theme="muted">
                            Aucune description détaillée disponible.
                          </Typography>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </motion.div>
        </div>
      </section>
    </div>
  )
}