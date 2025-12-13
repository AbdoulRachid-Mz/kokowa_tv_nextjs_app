// components/competitions/competitions-page.tsx
'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Typography } from '@/components/ui/typography'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Trophy, 
  Calendar, 
  MapPin, 
  Users, 
  TrendingUp,
  Search,
  Filter,
  Grid3x3,
  List,
  Clock,
  Award,
  Play,
  ChevronRight
} from 'lucide-react'
import Link from 'next/link'
import { useCompetitions, useCompetitionStats } from '@/hooks/use-competitions'
import { CompetitionCard } from './components/competition-card'
import { CompetitionFilters } from './components/competition-filters'
import { Skeleton } from '@/components/ui/skeleton'
import { useScreenSize } from '@/hooks/use-screen'

export default function CompetitionsPage() {
  const { isLargeScreen } = useScreenSize()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showFilters, setShowFilters] = useState(false)

  const { competitions, isLoading, pagination, filters, updateFilters } = useCompetitions({
    limit: 12,
    status: statusFilter === 'all' ? undefined : statusFilter,
    search,
  })

  const { data: stats } = useCompetitionStats()

  const statusOptions = [
    { value: 'all', label: 'Toutes', icon: Trophy, color: 'bg-gray-500' },
    { value: 'upcoming', label: 'À venir', icon: Clock, color: 'bg-blue-500' },
    { value: 'ongoing', label: 'En cours', icon: Play, color: 'bg-green-500' },
    { value: 'completed', label: 'Terminées', icon: Award, color: 'bg-purple-500' },
  ]

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
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-secondary/10" />
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={itemVariants} className="text-center mb-12">
              <div className="inline-flex items-center gap-2 mb-6">
                <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Trophy className="h-6 w-6 text-primary" />
                </div>
                <Typography variant="h1" weight="bold">
                  Compétitions
                </Typography>
              </div>
              
              <Typography variant="body-lg" theme="muted" className="max-w-2xl mx-auto mb-8">
                Découvrez toutes les compétitions de lutte traditionnelle. Suivez les matchs en direct, 
                consultez les résultats et préparez-vous pour les prochains événements.
              </Typography>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
                {stats?.data && (
                  <>
                    <div className="text-center p-4 rounded-xl bg-card border">
                      <Typography variant="h3" weight="bold" className="text-primary">
                        {stats.data.total_competitions}
                      </Typography>
                      <Typography variant="body-sm" theme="muted">
                        Compétitions
                      </Typography>
                    </div>
                    <div className="text-center p-4 rounded-xl bg-card border">
                      <Typography variant="h3" weight="bold" className="text-blue-600">
                        {stats.data.upcoming}
                      </Typography>
                      <Typography variant="body-sm" theme="muted">
                        À venir
                      </Typography>
                    </div>
                    <div className="text-center p-4 rounded-xl bg-card border">
                      <Typography variant="h3" weight="bold" className="text-green-600">
                        {stats.data.ongoing}
                      </Typography>
                      <Typography variant="body-sm" theme="muted">
                        En cours
                      </Typography>
                    </div>
                    <div className="text-center p-4 rounded-xl bg-card border">
                      <Typography variant="h3" weight="bold" className="text-purple-600">
                        {stats.data.completed}
                      </Typography>
                      <Typography variant="body-sm" theme="muted">
                        Terminées
                      </Typography>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-10">
        <div className="container mx-auto px-4">
          {/* Search and Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              {/* Search */}
              <div className="relative flex-1 max-w-lg">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher une compétition..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* View Toggle */}
              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="icon"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid3x3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="icon"
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
                
                {/* Filter Toggle (mobile) */}
                <Button
                  variant="outline"
                  size="icon"
                  className="md:hidden"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <Filter className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Status Filters */}
            <div className="flex flex-wrap gap-2 mt-4">
              {statusOptions.map((option) => (
                <Button
                  key={option.value}
                  variant={statusFilter === option.value ? 'default' : 'outline'}
                  size="sm"
                  className="gap-2"
                  onClick={() => setStatusFilter(option.value)}
                >
                  <option.icon className="h-4 w-4" />
                  {option.label}
                </Button>
              ))}
            </div>

            {/* Advanced Filters (desktop) */}
            {isLargeScreen && (
              <div className="mt-6">
                <CompetitionFilters
                  filters={filters}
                  onFilterChange={updateFilters}
                />
              </div>
            )}
          </motion.div>

          {/* Mobile Filters */}
          {showFilters && !isLargeScreen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6"
            >
              <CompetitionFilters
                filters={filters}
                onFilterChange={updateFilters}
              />
            </motion.div>
          )}

          {/* Competitions Grid/List */}
          {isLoading ? (
            <div className={viewMode === 'grid' ? 
              "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : 
              "space-y-4"
            }>
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className={viewMode === 'grid' ? "h-64" : "h-32"} />
              ))}
            </div>
          ) : competitions.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20"
            >
              <Trophy className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-20" />
              <Typography variant="h4" className="mb-2">
                Aucune compétition trouvée
              </Typography>
              <Typography variant="body-base" theme="muted">
                Essayez de modifier vos critères de recherche
              </Typography>
            </motion.div>
          ) : (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className={viewMode === 'grid' ? 
                "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : 
                "space-y-4"
              }
            >
              {competitions.map((competition: any) => (
                <motion.div key={competition.id} variants={itemVariants}>
                  <CompetitionCard 
                    competition={competition} 
                    viewMode={viewMode}
                  />
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex justify-center items-center gap-4 mt-12"
            >
              <Button
                variant="outline"
                disabled={pagination.page === 1}
                onClick={() => updateFilters({ page: pagination.page - 1 })}
              >
                Précédent
              </Button>
              
              <div className="flex items-center gap-2">
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  let pageNum
                  if (pagination.totalPages <= 5) {
                    pageNum = i + 1
                  } else if (pagination.page <= 3) {
                    pageNum = i + 1
                  } else if (pagination.page >= pagination.totalPages - 2) {
                    pageNum = pagination.totalPages - 4 + i
                  } else {
                    pageNum = pagination.page - 2 + i
                  }
                  
                  return (
                    <Button
                      key={pageNum}
                      variant={pagination.page === pageNum ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => updateFilters({ page: pageNum })}
                    >
                      {pageNum}
                    </Button>
                  )
                })}
              </div>
              
              <Button
                variant="outline"
                disabled={pagination.page === pagination.totalPages}
                onClick={() => updateFilters({ page: pagination.page + 1 })}
              >
                Suivant
              </Button>
            </motion.div>
          )}

          {/* Featured Competitions */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="mt-20"
          >
            <div className="flex items-center justify-between mb-6">
              <Typography variant="h3" weight="bold">
                Compétitions en Vedette
              </Typography>
              <Button variant="ghost" className="gap-2" asChild>
                <Link href="/competitions/featured">
                  Voir tout
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Featured competitions would go here */}
              <div className="relative rounded-2xl overflow-hidden border bg-gradient-to-r from-primary/10 to-secondary/10 p-8">
                <Badge className="mb-4">À VENIR</Badge>
                <Typography variant="h4" weight="bold" className="mb-2">
                  Championnat National 2024
                </Typography>
                <Typography variant="body-base" theme="muted" className="mb-4">
                  La plus grande compétition de lutte traditionnelle de l'année
                </Typography>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <Typography variant="body-sm">15-25 Mars 2024</Typography>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <Typography variant="body-sm">Stade National</Typography>
                  </div>
                </div>
              </div>
              
              <div className="relative rounded-2xl overflow-hidden border bg-gradient-to-r from-blue-500/10 to-purple-500/10 p-8">
                <Badge variant="destructive" className="mb-4">EN DIRECT</Badge>
                <Typography variant="h4" weight="bold" className="mb-2">
                  Tournoi des Régions
                </Typography>
                <Typography variant="body-base" theme="muted" className="mb-4">
                  Affrontement entre les meilleures régions du pays
                </Typography>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <Typography variant="body-sm">12 Régions</Typography>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    <Typography variant="body-sm">+15K spectateurs</Typography>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}