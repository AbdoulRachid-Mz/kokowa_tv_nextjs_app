// app/editions/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
// import { useAllEditions } from '@/hooks/use-all-editions'
import { useAllEditions, useEditionsFilters } from "@/hooks/use-editions";
import { Typography } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { EditionsCompletedSection } from "./sections/editions-completed-section";
import { EditionsCurrentSection } from "./sections/editions-current-section";
import { EditionsFiltersSection } from "./sections/editions-filters-section";
import { EditionsGridSection } from "./sections/editions-grid-section";
import { EditionsHero } from "./sections/editions-hero";
import { EditionsStatsSection } from "./sections/editions-stats-section";
import { EditionsUpcomingSection } from "./sections/editions-upcoming-section";

export default function EditionsPage() {
  // Gestion des filtres
  // Gestion des filtres
  const filterState = useEditionsFilters();
  const [appliedFilters, setAppliedFilters] = useState<any>({});
  const [searchTriggered, setSearchTriggered] = useState(false);

  // Utiliser une seule requête pour toutes les éditions
  const {
    allEditions,
    currentEditions,
    upcomingEditions,
    completedEditions,
    loading,
    error,
    refetch,
    stats,
  } = useAllEditions(appliedFilters);

  // Appliquer les filtres avec un délai
  useEffect(() => {
    const timer = setTimeout(() => {
      setAppliedFilters(filterState.appliedFilters);
    }, 300);

    return () => clearTimeout(timer);
  }, [filterState.appliedFilters]);

  // Appliquer les filtres avec un délai et un contrôle manuel
  useEffect(() => {
    const timer = setTimeout(() => {
      // Mettre à jour les filtres mais ne pas déclencher la recherche automatiquement
      setAppliedFilters(filterState.appliedFilters);
    }, 300);

    return () => clearTimeout(timer);
  }, [filterState.appliedFilters]);

  // Fonction pour déclencher manuellement la recherche
  const handleSearch = useCallback(() => {
    setSearchTriggered(true);
    setAppliedFilters(filterState.appliedFilters);
  }, [filterState.appliedFilters]);

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
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="relative"
    >
      {/* Background avec gradient */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-primary/5" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent" />
      </div>

      <div className="relative space-y-10 pb-10">
        <EditionsHero />

        {/* Passer les stats calculées */}
        <EditionsStatsSection stats={stats} loading={loading} />

        {/* Passer les données filtrées */}
        <EditionsCurrentSection
          editions={currentEditions.slice(0, 3)}
          loading={loading}
        />

        <EditionsFiltersSection onSearch={handleSearch} loading={loading} />

        <EditionsGridSection
          editions={allEditions}
          loading={loading}
          pagination={{ total: allEditions.length, page: 1, totalPages: 1 }}
          refetch={async () => refetch()}
        />

        <EditionsUpcomingSection
          editions={upcomingEditions.slice(0, 4)}
          loading={loading}
          // refetch={refetch}
        />

        <EditionsCompletedSection
          editions={completedEditions.slice(0, 6)}
          loading={loading}
        />
      </div>
    </motion.div>
  );
}
