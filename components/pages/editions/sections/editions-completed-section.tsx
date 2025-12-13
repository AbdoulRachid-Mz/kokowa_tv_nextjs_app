// components/editions/sections/editions-completed-section.tsx
"use client";

import { motion } from "framer-motion";
import { Typography } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import {
  Trophy,
  Award,
  Users,
  Calendar,
  Star,
  History,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { useEditions } from "@/hooks/use-editions";
import { Skeleton } from "@/components/ui/skeleton";
import { CompetitionEdition } from "@/types";

interface EditionsSectionProps {
  editions: CompetitionEdition[];
  loading: boolean;
}

export function EditionsCompletedSection({
  editions,
  loading,
}: EditionsSectionProps) {
  // const { editions, loading } = useEditions({
  //   limit: 6,
  //   with_competition: true,
  //   with_fighters: true,
  //   with_regions: true,
  //   sortBy: 'year',
  //   sortOrder: 'desc'
  // })

  // Filtrer les éditions terminées (dont la date de fin est dans le passé)
  const completedEditions = editions
    .filter((edition) => {
      if (!edition.end_date) return false;
      const endDate = new Date(edition.end_date);
      const now = new Date();
      return endDate < now;
    })
    .slice(0, 6);

  if (loading) {
    return (
      <section className="py-12">
        <div className="container mx-auto px-4">
          <Skeleton className="h-8 w-64 mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-80 rounded-2xl" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (completedEditions.length === 0) return null;

  return (
    <section className="py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-3 w-3 rounded-full bg-purple-500" />
              <Typography
                variant="body-base"
                weight="medium"
                className="text-purple-600"
              >
                ÉDITIONS TERMINÉES
              </Typography>
            </div>
            <Typography variant="h3" weight="bold" className="mb-2">
              Archives des Compétitions
            </Typography>
            <Typography variant="body-base" theme="muted">
              Revivez les éditions passées et leurs moments forts
            </Typography>
          </div>
          <Button variant="outline" asChild>
            <Link href="/editions?status=completed">
              <History className="h-4 w-4 mr-2" />
              Voir toutes les archives
            </Link>
          </Button>
        </motion.div>

        {/* Completed editions grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {completedEditions.map((edition, index) => {
            const participantCount =
              (edition.fighters?.length || 0) + (edition.regions?.length || 0);
            const isRecent = edition.year >= new Date().getFullYear() - 1;
            const hasWinner =
              !!edition.winner_fighter_id || !!edition.winner_region_id;

            return (
              <motion.div
                key={edition.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="group relative"
              >
                <div className="relative rounded-2xl border bg-card overflow-hidden hover:shadow-xl transition-all duration-300 h-full flex flex-col">
                  {/* Year badge */}
                  <Badge className="absolute top-4 left-4 z-10 bg-purple-600">
                    <Calendar className="h-3 w-3 mr-1" />
                    {edition.year}
                  </Badge>

                  {/* Recent indicator */}
                  {isRecent && (
                    <Badge className="absolute top-4 right-4 z-10 bg-amber-600">
                      <Star className="h-3 w-3 mr-1" />
                      Récent
                    </Badge>
                  )}

                  {/* Winner indicator */}
                  {hasWinner && (
                    <div className="absolute top-12 right-4 z-10">
                      <Badge className="bg-emerald-600 gap-1">
                        <Award className="h-3 w-3" />
                        Vainqueur
                      </Badge>
                    </div>
                  )}

                  {/* Image/Color header */}
                  <div
                    className="h-32 bg-gradient-to-r from-purple-600 to-purple-400 relative overflow-hidden"
                    style={{
                      backgroundColor: edition.region?.color || "#8b5cf6",
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                    <div className="absolute bottom-4 left-4">
                      <Typography
                        variant="h5"
                        weight="bold"
                        className="text-white"
                      >
                        {edition.competition?.name}
                      </Typography>
                      <Typography variant="body-sm" className="text-white/80">
                        Édition {edition.edition_number}
                      </Typography>
                    </div>

                    {/* Overlay pattern */}
                    <div className="absolute inset-0 opacity-10">
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.1)_1px,transparent_0)] bg-[size:20px_20px]" />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6 flex-1 flex flex-col">
                    {/* Title */}
                    <Typography variant="h5" weight="medium" className="mb-2">
                      {edition.theme || `Édition ${edition.year}`}
                    </Typography>

                    {/* Description */}
                    <Typography
                      variant="body-sm"
                      theme="muted"
                      className="mb-4 line-clamp-2"
                    >
                      {edition.competition?.description ||
                        "Édition terminée de lutte traditionnelle"}
                    </Typography>

                    {/* Winner info */}
                    {edition.winner_fighter && (
                      <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <Trophy className="h-4 w-4 text-emerald-600" />
                          <Typography
                            variant="body-sm"
                            weight="medium"
                            className="text-emerald-600"
                          >
                            Vainqueur
                          </Typography>
                        </div>
                        <div className="flex items-center gap-2">
                          {edition.winner_fighter.profile_image ? (
                            <img
                              src={edition.winner_fighter.profile_image}
                              alt={edition.winner_fighter.first_name}
                              className="h-6 w-6 rounded-full object-cover"
                            />
                          ) : (
                            <div className="h-6 w-6 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center">
                              <Typography
                                variant="caption1"
                                weight="bold"
                                className="text-emerald-600 dark:text-emerald-400"
                              >
                                {edition.winner_fighter.first_name?.charAt(0)}
                              </Typography>
                            </div>
                          )}
                          <Typography variant="body-sm">
                            {edition.winner_fighter.first_name}{" "}
                            {edition.winner_fighter.last_name}
                          </Typography>
                        </div>
                      </div>
                    )}

                    {edition.winner_region && !edition.winner_fighter && (
                      <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <Trophy className="h-4 w-4 text-emerald-600" />
                          <Typography
                            variant="body-sm"
                            weight="medium"
                            className="text-emerald-600"
                          >
                            Région victorieuse
                          </Typography>
                        </div>
                        <div className="flex items-center gap-2">
                          {edition.winner_region.flag_image ? (
                            <img
                              src={edition.winner_region.flag_image}
                              alt={edition.winner_region.name}
                              className="h-6 w-6 rounded object-cover"
                            />
                          ) : (
                            <div
                              className="h-6 w-6 rounded"
                              style={{
                                backgroundColor:
                                  edition.winner_region.color || "#10b981",
                              }}
                            />
                          )}
                          <Typography variant="body-sm">
                            {edition.winner_region.name}
                          </Typography>
                        </div>
                      </div>
                    )}

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-3 mb-6 mt-auto">
                      <div className="text-center">
                        <Users className="h-4 w-4 text-muted-foreground mx-auto mb-1" />
                        <Typography variant="body-sm" weight="medium">
                          {participantCount}
                        </Typography>
                        <Typography variant="caption1" theme="muted">
                          Participants
                        </Typography>
                      </div>
                      <div className="text-center">
                        <Award className="h-4 w-4 text-muted-foreground mx-auto mb-1" />
                        <Typography variant="body-sm" weight="medium">
                          {edition.phases?.length || 0}
                        </Typography>
                        <Typography variant="caption1" theme="muted">
                          Phases
                        </Typography>
                      </div>
                      <div className="text-center">
                        <Calendar className="h-4 w-4 text-muted-foreground mx-auto mb-1" />
                        <Typography variant="body-sm" weight="medium">
                          {edition.start_date
                            ? new Date(edition.start_date).toLocaleDateString(
                                "fr-FR",
                                { month: "short" }
                              )
                            : "N/A"}
                        </Typography>
                        <Typography variant="caption1" theme="muted">
                          Mois
                        </Typography>
                      </div>
                    </div>

                    {/* Dates */}
                    {edition.start_date && edition.end_date && (
                      <div className="mb-4">
                        <Typography
                          variant="body-sm"
                          theme="muted"
                          className="text-center"
                        >
                          {new Date(edition.start_date).toLocaleDateString(
                            "fr-FR",
                            { day: "numeric", month: "short" }
                          )}{" "}
                          -
                          {new Date(edition.end_date).toLocaleDateString(
                            "fr-FR",
                            { day: "numeric", month: "short", year: "numeric" }
                          )}
                        </Typography>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button size="sm" className="flex-1 gap-2" asChild>
                        <Link href={`/editions/${edition.id}`}>
                          <ChevronRight className="h-4 w-4" />
                          Revivre l'édition
                        </Link>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-2"
                        asChild
                      >
                        <Link href={`/editions/${edition.id}/results`}>
                          <Trophy className="h-4 w-4" />
                          Résultats
                        </Link>
                      </Button>
                    </div>
                  </div>

                  {/* Hover effect */}
                  <div className="absolute inset-0 border-2 border-transparent group-hover:border-purple-500/20 rounded-2xl transition-all duration-300 pointer-events-none" />
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Historical stats */}
        {completedEditions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="mt-12 bg-gradient-to-r from-purple-500/5 to-blue-500/5 rounded-2xl border p-8"
          >
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <Typography
                  variant="h3"
                  weight="bold"
                  className="text-purple-600 mb-2"
                >
                  {completedEditions.length}+
                </Typography>
                <Typography variant="body-base" theme="muted">
                  Éditions archivées
                </Typography>
              </div>
              <div className="text-center">
                <Typography
                  variant="h3"
                  weight="bold"
                  className="text-purple-600 mb-2"
                >
                  {Math.max(...completedEditions.map((e) => e.year))}
                </Typography>
                <Typography variant="body-base" theme="muted">
                  Dernière édition
                </Typography>
              </div>
              <div className="text-center">
                <Typography
                  variant="h3"
                  weight="bold"
                  className="text-purple-600 mb-2"
                >
                  {Math.min(...completedEditions.map((e) => e.year))}
                </Typography>
                <Typography variant="body-base" theme="muted">
                  Première édition
                </Typography>
              </div>
              <div className="text-center">
                <Typography
                  variant="h3"
                  weight="bold"
                  className="text-purple-600 mb-2"
                >
                  {completedEditions
                    .reduce((sum, edition) => {
                      const participants =
                        (edition.fighters?.length || 0) +
                        (edition.regions?.length || 0);
                      return sum + participants;
                    }, 0)
                    .toLocaleString()}
                </Typography>
                <Typography variant="body-base" theme="muted">
                  Participants totaux
                </Typography>
              </div>
            </div>
          </motion.div>
        )}

        {/* Call to action */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="text-center mt-12"
        >
          <Typography variant="h4" weight="medium" className="mb-6">
            Explorez l'histoire riche de la lutte traditionnelle
          </Typography>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="gap-2" asChild>
              <Link href="/editions?status=completed">
                <History className="h-4 w-4" />
                Voir toutes les archives
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="gap-2" asChild>
              <Link href="/competitions">
                <Trophy className="h-4 w-4" />
                Découvrir les compétitions
              </Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
