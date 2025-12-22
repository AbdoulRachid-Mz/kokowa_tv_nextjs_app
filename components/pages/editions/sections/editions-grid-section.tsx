// components/editions/sections/editions-grid-section.tsx
'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence, Variants } from 'framer-motion'
import { Typography } from '@/components/ui/typography'
import { Button } from '@/components/ui/button'
import { 
  Grid, 
  List, 
  Calendar, 
  Users, 
  MapPin, 
  Trophy, 
  Play,
  Clock,
  Eye
} from 'lucide-react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Pagination, PaginationContent,
PaginationItem,
PaginationPrevious,
PaginationLink,
PaginationNext } from '@/components/ui/pagination'
import { Skeleton } from '@/components/ui/skeleton'
import { useEditions, useEditionsFilters } from '@/hooks/use-editions'
import { InteractionButton } from '@/components/shared/interactions-button'
import { cn } from '@/lib/utils'
import { CompetitionEdition } from '@/types'

interface EditionsSectionProps {
  editions: CompetitionEdition[]
  loading: boolean
  pagination: { total: number; page: number; totalPages: number }
  refetch: () => Promise<void>
}

export function EditionsGridSection({ editions, loading, pagination, refetch }: EditionsSectionProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const { appliedFilters } = useEditionsFilters() // Utiliser appliedFilters au lieu de applyAllFilters()
  // const { editions, pagination, loading, refetch } = useEditions(appliedFilters)

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants: Variants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    }
  }

  const getStatusBadge = (edition: any) => {
    const now = new Date()
    const startDate = edition.start_date ? new Date(edition.start_date) : null
    const endDate = edition.end_date ? new Date(edition.end_date) : null
    
    if (startDate && endDate) {
      if (now < startDate) {
        return { label: 'À VENIR', color: 'bg-blue-600' }
      } else if (now >= startDate && now <= endDate) {
        return { label: 'EN COURS', color: 'bg-emerald-600' }
      } else {
        return { label: 'TERMINÉE', color: 'bg-purple-600' }
      }
    }
    return { label: 'N/A', color: 'bg-gray-600' }
  }

  // Mémoriser l'affichage des éditions pour éviter les re-rendus
  const renderedEditions = useMemo(() => {
    return editions.map((edition) => ({
      ...edition,
      status: getStatusBadge(edition),
      participantCount: (edition.fighters?.length || 0) + (edition.regions?.length || 0)
    }))
  }, [editions])

  if (loading) {
    return (
      <section className="py-12">
        <div className="container mx-auto px-4">
          <Skeleton className="h-8 w-48 mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-80 rounded-2xl" />
            ))}
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Typography variant="h3" weight="bold" className="mb-2">
              Toutes les Éditions
            </Typography>
            <Typography variant="body-base" theme="muted">
              {pagination.total} éditions trouvées
            </Typography>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-muted/50 rounded-lg p-1">
              <Button
                size="sm"
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                onClick={() => setViewMode('grid')}
                className="h-8 px-3"
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                onClick={() => setViewMode('list')}
                className="h-8 px-3"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Editions grid/list */}
        <AnimatePresence mode="wait">
          {viewMode === 'grid' ? (
            <motion.div
              key="grid"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {renderedEditions.map((edition) => (
                <motion.div
                  key={edition.id}
                  variants={itemVariants}
                  className="group relative"
                >
                  <div className="relative rounded-2xl border bg-card overflow-hidden hover:shadow-xl transition-all duration-300 h-full flex flex-col">
                    {/* Status badge */}
                    <Badge className={`absolute top-4 left-4 z-10 ${edition.status.color}`}>
                      {edition.status.label}
                    </Badge>

                    {/* Header image */}
                    <div className="h-40 relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20" />
                      {edition.competition?.featured_image ? (
                        <img
                          src={edition.competition.featured_image}
                          alt={edition.competition.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Trophy className="h-16 w-16 text-primary/30" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                      
                      {/* Title overlay */}
                      <div className="absolute bottom-4 left-4 right-4">
                        <Typography variant="h5" weight="bold" className="text-white line-clamp-1">
                          {edition.competition?.name}
                        </Typography>
                        <Typography variant="body-sm" className="text-white/80">
                          Édition {edition.edition_number} • {edition.year}
                        </Typography>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-5 flex-1 flex flex-col">
                      {/* Theme */}
                      <Typography variant="h6" weight="medium" className="mb-2">
                        {edition.theme || `Édition ${edition.year}`}
                      </Typography>

                      {/* Description */}
                      <Typography variant="body-sm" theme="muted" className="mb-4 flex-1 line-clamp-2">
                        {edition.competition?.description || 'Compétition de lutte traditionnelle'}
                      </Typography>

                      {/* Stats */}
                      <div className="grid grid-cols-3 gap-3 mb-4">
                        <div className="text-center">
                          <Users className="h-4 w-4 text-muted-foreground mx-auto mb-1" />
                          <Typography variant="body-sm" weight="medium">
                            {edition.participantCount}
                          </Typography>
                          <Typography variant="caption1" theme="muted">
                            Participants
                          </Typography>
                        </div>
                        <div className="text-center">
                          <MapPin className="h-4 w-4 text-muted-foreground mx-auto mb-1" />
                          <Typography variant="body-sm" weight="medium">
                            {edition.regions?.length || 0}
                          </Typography>
                          <Typography variant="caption1" theme="muted">
                            Régions
                          </Typography>
                        </div>
                        <div className="text-center">
                          <Calendar className="h-4 w-4 text-muted-foreground mx-auto mb-1" />
                          <Typography variant="body-sm" weight="medium">
                            {edition.phases?.length || 0}
                          </Typography>
                          <Typography variant="caption1" theme="muted">
                            Phases
                          </Typography>
                        </div>
                      </div>

                      {/* Dates */}
                      {edition.start_date && edition.end_date && (
                        <div className="flex items-center gap-2 mb-4 text-sm">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <Typography variant="body-sm" theme="muted">
                            {new Date(edition.start_date).toLocaleDateString('fr-FR')} - {new Date(edition.end_date).toLocaleDateString('fr-FR')}
                          </Typography>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2 mt-auto">
                        <Button size="sm" className="flex-1 gap-2" asChild>
                          <Link href={`/editions/${edition.id}`}>
                            <Eye className="h-4 w-4" />
                            Voir détails
                          </Link>
                        </Button>
                        <InteractionButton
                          type="like"
                          entityType="edition"
                          entityId={edition.id}
                          iconOnly
                          size="sm"
                          variant="outline"
                        />
                      </div>
                    </div>

                    {/* Hover effect */}
                    <div className="absolute inset-0 border-2 border-transparent group-hover:border-primary/20 rounded-2xl transition-all duration-300 pointer-events-none" />
                  </div>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="list"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="space-y-4"
            >
              {renderedEditions.map((edition) => (
                <motion.div
                  key={edition.id}
                  variants={itemVariants}
                  className="group"
                >
                  <div className="rounded-xl border bg-card p-6 hover:shadow-lg transition-all duration-300">
                    <div className="flex flex-col md:flex-row md:items-center gap-6">
                      {/* Image */}
                      <div className="md:w-48 h-32 rounded-lg overflow-hidden flex-shrink-0">
                        {edition.competition?.featured_image ? (
                          <img
                            src={edition.competition.featured_image}
                            alt={edition.competition.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-r from-primary/10 to-secondary/10 flex items-center justify-center">
                            <Trophy className="h-12 w-12 text-primary/30" />
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="flex items-center gap-3 mb-1">
                              <Badge className={edition.status.color}>
                                {edition.status.label}
                              </Badge>
                              <Typography variant="body-sm" theme="muted">
                                {edition.competition?.name}
                              </Typography>
                            </div>
                            <Typography variant="h6" weight="medium" className="mb-1">
                              Édition {edition.edition_number} • {edition.year}
                            </Typography>
                            {edition.theme && (
                              <Typography variant="body-base" className="text-primary mb-2">
                                {edition.theme}
                              </Typography>
                            )}
                          </div>
                          <InteractionButton
                            type="like"
                            entityType="edition"
                            entityId={edition.id}
                            iconOnly
                            size="sm"
                          />
                        </div>

                        <Typography variant="body-sm" theme="muted" className="mb-4 line-clamp-2">
                          {edition.competition?.description || 'Compétition de lutte traditionnelle'}
                        </Typography>

                        {/* Stats */}
                        <div className="flex flex-wrap gap-6 mb-4">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <Typography variant="body-sm">
                              {edition.participantCount} participants
                            </Typography>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <Typography variant="body-sm">
                              {edition.regions?.length || 0} régions
                            </Typography>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <Typography variant="body-sm">
                              {edition.phases?.length || 0} phases
                            </Typography>
                          </div>
                        </div>

                        {/* Dates and actions */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          {edition.start_date && edition.end_date && (
                            <Typography variant="body-sm" theme="muted">
                              {new Date(edition.start_date).toLocaleDateString('fr-FR')} - {new Date(edition.end_date).toLocaleDateString('fr-FR')}
                            </Typography>
                          )}
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" asChild>
                              <Link href={`/editions/${edition.id}`}>
                                Voir détails
                              </Link>
                            </Button>
                            <Button size="sm" variant="outline" asChild>
                              <Link href={`/editions/${edition.id}/phases`}>
                                <Play className="h-4 w-4 mr-2" />
                                Phases
                              </Link>
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="mt-12">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => {
                      e.preventDefault()
                      if (pagination.page > 1) {
                        console.log('Change to page:', pagination.page - 1)
                      }
                    }}
                    aria-disabled={pagination.page <= 1}
                    className={cn(
                      pagination.page <= 1 && 'pointer-events-none opacity-50'
                    )}
                  />
                </PaginationItem>

                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                  <PaginationItem key={page}>
                    <PaginationLink
                      href="#"
                      onClick={(e) => {
                        e.preventDefault()
                        console.log('Change to page:', page)
                      }}
                      isActive={page === pagination.page}
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                ))}

                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => {
                      e.preventDefault()
                      if (pagination.page < pagination.totalPages) {
                        console.log('Change to page:', pagination.page + 1)
                      }
                    }}
                    aria-disabled={pagination.page >= pagination.totalPages}
                    className={cn(
                      pagination.page >= pagination.totalPages &&
                        'pointer-events-none opacity-50'
                    )}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}

        {/* Empty state */}
        {editions.length === 0 && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <Trophy className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <Typography variant="h4" weight="medium" className="mb-2">
              Aucune édition trouvée
            </Typography>
            <Typography variant="body-base" theme="muted" className="mb-6">
              Essayez de modifier vos critères de recherche
            </Typography>
            <Button onClick={() => refetch()}>
              Réessayer
            </Button>
          </motion.div>
        )}
      </div>
    </section>
  )
}