// app/matches/page.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { MatchesHeader } from '@/components/pages/matches/matches-header'
import { MatchesFilters } from '@/components/pages/matches/matches-filters'
import { MatchesGrid } from '@/components/pages/matches/matches-grid'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'
import { useMatches } from '@/hooks/use-matches'
import { useMatchFilters } from '@/hooks/use-match-filters'
import { Calendar, Grid, List, RefreshCw, Filter, Eye, EyeOff } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { MatchesList } from '@/components/pages/matches/matches-list'
import { MatchesStats } from '@/components/pages/matches/matches-stats'

export default function MatchesPage() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showFilters, setShowFilters] = useState(true)
  const [activeTab, setActiveTab] = useState<'all' | 'live' | 'upcoming' | 'completed'>('all')
  const [appliedFilters, setAppliedFilters] = useState<any>({})

  // Gestion des filtres
  const filterState = useMatchFilters()

  // Gestion des matches avec filtres - utiliser appliedFilters
  const { 
    matches, 
    matchesByStatus,
    isLoading, 
    error, 
    stats,
    updateFilters,
    refetch,
    goToPage,
    nextPage,
    prevPage
  } = useMatches({
    initialFilters: appliedFilters,
    priorityOrder: true,
    autoFetch: Object.keys(appliedFilters).length > 0 // Ne pas auto-fetch si pas de filtres
  })

  // Appliquer les filtres avec un délai pour éviter les requêtes multiples
  useEffect(() => {
    const timer = setTimeout(() => {
      setAppliedFilters(filterState.buildFilters)
    }, 300) // Délai de 300ms pour éviter les requêtes multiples

    return () => clearTimeout(timer)
  }, [filterState.buildFilters])

  // Gestion des erreurs
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <Typography variant="h3" className="text-destructive mb-4">
            Erreur de chargement
          </Typography>
          <Typography variant="body-base" theme="muted" className="mb-6">
            {error.message}
          </Typography>
          <Button onClick={() => refetch()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Réessayer
          </Button>
        </div>
      </div>
    )
  }

  // Filtrer les matches selon l'onglet actif
  const getFilteredMatches = () => {
    switch (activeTab) {
      case 'live':
        return matchesByStatus.live
      case 'upcoming':
        return matchesByStatus.upcoming
      case 'completed':
        return matchesByStatus.completed
      default:
        return matches
    }
  }

  const filteredMatches = getFilteredMatches()

  // Fonction pour déclencher manuellement une recherche
  const handleSearch = useCallback(() => {
    setAppliedFilters(filterState.buildFilters)
  }, [filterState.buildFilters])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen bg-gradient-to-b from-background to-muted/20"
    >
      {/* Header */}
      <MatchesHeader />

      <div className="container mx-auto px-4 py-6">
        {/* Stats et filtres rapides */}
        <MatchesStats stats={stats} />

        {/* Contrôles principaux */}
        <div className="flex flex-col lg:flex-row gap-6 mb-8">
          {/* Filtres (côté gauche) */}
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="lg:w-1/4"
            >
              <div className="sticky top-6">
                <MatchesFilters {...filterState} />
                {/* Bouton de recherche */}
                <Button 
                  className="w-full mt-4" 
                  onClick={handleSearch}
                  disabled={filterState.loading}
                >
                  {filterState.loading ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                      Chargement...
                    </>
                  ) : (
                    'Rechercher'
                  )}
                </Button>
              </div>
            </motion.div>
          )}

          {/* Contenu principal */}
          <div className={`flex-1 ${showFilters ? 'lg:w-3/4' : 'w-full'}`}>
            {/* Barre de contrôle */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 p-4 bg-card rounded-xl border">
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className="gap-2"
                >
                  {showFilters ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                  {showFilters ? 'Masquer' : 'Afficher'} filtres
                </Button>

                <div className="flex items-center gap-2">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className="gap-2"
                  >
                    <Grid className="h-4 w-4" />
                    Grille
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className="gap-2"
                  >
                    <List className="h-4 w-4" />
                    Liste
                  </Button>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <Typography variant="body-sm" theme="muted">
                  {filteredMatches.length} match{filteredMatches.length !== 1 ? 'es' : ''}
                </Typography>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refetch()}
                  disabled={isLoading}
                  className="gap-2"
                >
                  <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                  Actualiser
                </Button>
              </div>
            </div>

            {/* Affichage des filtres actifs */}
            {Object.keys(appliedFilters).length > 0 && (
              <div className="mb-6 p-4 bg-muted/30 rounded-lg">
                <Typography variant="body-sm" weight="medium" className="mb-2">
                  Filtres appliqués:
                </Typography>
                <div className="flex flex-wrap gap-2">
                  {appliedFilters.edition_id && (
                    <Badge variant="secondary">
                      Édition: {appliedFilters.edition_id}
                    </Badge>
                  )}
                  {appliedFilters.phase_id && (
                    <Badge variant="secondary">
                      Phase: {appliedFilters.phase_id}
                    </Badge>
                  )}
                  {appliedFilters.group_id && (
                    <Badge variant="secondary">
                      Groupe: {appliedFilters.group_id}
                    </Badge>
                  )}
                  {appliedFilters.status && (
                    <Badge variant="secondary">
                      Statut: {appliedFilters.status}
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {/* Onglets par statut */}
            <Tabs 
              value={activeTab} 
              onValueChange={(v: any) => setActiveTab(v)}
              className="mb-8"
            >
              <TabsList className="grid grid-cols-4">
                <TabsTrigger value="all" className="gap-2">
                  Tous
                  <Badge variant="secondary" className="ml-1">
                    {stats.total}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="live" className="gap-2">
                  En direct
                  <Badge variant="destructive" className="ml-1">
                    {stats.live}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="upcoming" className="gap-2">
                  À venir
                  <Badge variant="outline" className="ml-1">
                    {stats.upcoming}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="completed" className="gap-2">
                  Terminés
                  <Badge variant="outline" className="ml-1">
                    {stats.completed}
                  </Badge>
                </TabsTrigger>
              </TabsList>

              {/* Contenu des onglets */}
              <TabsContent value="all" className="mt-6">
                {isLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="h-64 bg-muted animate-pulse rounded-xl" />
                    ))}
                  </div>
                ) : viewMode === 'grid' ? (
                  <MatchesGrid matches={filteredMatches} />
                ) : (
                  <MatchesList matches={filteredMatches} />
                )}
              </TabsContent>

              <TabsContent value="live" className="mt-6">
                {matchesByStatus.live.length === 0 ? (
                  <div className="text-center py-12">
                    <Typography variant="h4" className="mb-4">
                      Aucun match en direct
                    </Typography>
                    <Typography variant="body-base" theme="muted">
                      Aucun match n'est actuellement en cours.
                    </Typography>
                  </div>
                ) : viewMode === 'grid' ? (
                  <MatchesGrid matches={matchesByStatus.live} />
                ) : (
                  <MatchesList matches={matchesByStatus.live} />
                )}
              </TabsContent>

              <TabsContent value="upcoming" className="mt-6">
                {matchesByStatus.upcoming.length === 0 ? (
                  <div className="text-center py-12">
                    <Typography variant="h4" className="mb-4">
                      Aucun match à venir
                    </Typography>
                    <Typography variant="body-base" theme="muted">
                      Aucun match n'est programmé pour le moment.
                    </Typography>
                  </div>
                ) : viewMode === 'grid' ? (
                  <MatchesGrid matches={matchesByStatus.upcoming} />
                ) : (
                  <MatchesList matches={matchesByStatus.upcoming} />
                )}
              </TabsContent>

              <TabsContent value="completed" className="mt-6">
                {matchesByStatus.completed.length === 0 ? (
                  <div className="text-center py-12">
                    <Typography variant="h4" className="mb-4">
                      Aucun match terminé
                    </Typography>
                    <Typography variant="body-base" theme="muted">
                      Aucun match n'a été terminé récemment.
                    </Typography>
                  </div>
                ) : viewMode === 'grid' ? (
                  <MatchesGrid matches={matchesByStatus.completed} />
                ) : (
                  <MatchesList matches={matchesByStatus.completed} />
                )}
              </TabsContent>
            </Tabs>

            {/* Pagination */}
            {stats.totalPages > 1 && (
              <div className="flex justify-between items-center mt-8 pt-6 border-t">
                <Button
                  variant="outline"
                  onClick={prevPage}
                  disabled={!stats.hasPrev || isLoading}
                  className="gap-2"
                >
                  Précédent
                </Button>
                
                <Typography variant="body-sm" theme="muted">
                  Page {stats.currentPage} sur {stats.totalPages}
                </Typography>
                
                <Button
                  variant="outline"
                  onClick={nextPage}
                  disabled={!stats.hasNext || isLoading}
                  className="gap-2"
                >
                  Suivant
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}