// components/editions/sections/editions-filters-section.tsx
"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Typography } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import {
  Search,
  Filter,
  Calendar,
  Trophy,
  X,
  ChevronDown,
  ChevronUp,
  RefreshCw,
} from "lucide-react";
import { useEditionsFilters } from "@/hooks/use-editions";
import { useCompetitions } from "@/hooks/use-competitions";
import { Competition } from "@/types";

interface EditionsFiltersSectionProps {
  onSearch?: () => void;
  loading?: boolean;
}

export function EditionsFiltersSection({
  onSearch,
  loading,
}: EditionsFiltersSectionProps) {
  const {
    search,
    yearFilter,
    competitionFilter,
    statusFilter,
    setSearch,
    setYearFilter,
    setCompetitionFilter,
    setStatusFilter,
    resetFilters,
    hasFilters,
  } = useEditionsFilters();

  const [isExpanded, setIsExpanded] = useState(false);
  const { competitions } = useCompetitions({ limit: 50 });

  // Générer les années (dernières 20 années)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 20 }, (_, i) => currentYear - i);

  const statusOptions = [
    { value: "all", label: "Tous les statuts" },
    { value: "active", label: "En cours" },
    { value: "upcoming", label: "À venir" },
    { value: "completed", label: "Terminées" },
  ];

  // Gérer la recherche avec debounce local
  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearch(e.target.value);
    },
    [setSearch]
  );

  // Gérer le clic sur le bouton de recherche
  const handleSearchClick = useCallback(() => {
    onSearch?.();
  }, [onSearch]);

  return (
    <section className="py-8">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="bg-card/50 backdrop-blur-sm rounded-2xl border p-6"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Filter className="h-5 w-5 text-primary" />
              <Typography variant="h5" weight="medium">
                Filtres de Recherche
              </Typography>
              {hasFilters && (
                <span className="px-2 py-1 text-xs bg-primary/10 text-primary rounded-full">
                  Filtres actifs
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="gap-2"
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="h-4 w-4" />
                    Réduire
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4" />
                    Plus de filtres
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={resetFilters}
                className="gap-2"
                disabled={loading}
              >
                <RefreshCw className="h-4 w-4" />
                Réinitialiser
              </Button>
            </div>
          </div>

          {/* Main search avec bouton de recherche manuel */}
          <div className="relative mb-6 flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Rechercher une édition, un thème, une compétition..."
                value={search}
                onChange={handleSearchChange}
                className="pl-12 pr-10 py-6 text-lg"
                disabled={loading}
              />
              {search && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2"
                  onClick={() => setSearch("")}
                  disabled={loading}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            <Button
              onClick={handleSearchClick}
              disabled={loading}
              className="py-6 px-6"
            >
              <Search className="h-5 w-5 mr-2" />
              Rechercher
            </Button>
          </div>

          {/* Quick filters */}
          <div className="flex flex-wrap gap-3 mb-6">
            <Select
              value={statusFilter}
              onValueChange={(value: any) => setStatusFilter(value)}
              disabled={loading}
            >
              <SelectTrigger className="w-[180px]">
                <Trophy className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={yearFilter?.toString() || ""}
              onValueChange={(value) =>
                setYearFilter(value ? parseInt(value) : null)
              }
              disabled={loading}
            >
              <SelectTrigger className="w-[140px]">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Année" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les années</SelectItem>
                {years.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={competitionFilter?.toString() || ""}
              onValueChange={(value) =>
                setCompetitionFilter(value ? parseInt(value) : null)
              }
              disabled={loading}
            >
              <SelectTrigger className="w-[200px]">
                <Trophy className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Compétition" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les compétitions</SelectItem>
                {competitions.map((comp: Competition) => (
                  <SelectItem key={comp.id} value={comp.id.toString()}>
                    {comp.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Expanded filters */}
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="border-t pt-6 mt-6"
            >
              <Typography variant="h6" className="mb-4">
                Filtres Avancés
              </Typography>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Participants range */}
                <div>
                  <Typography
                    variant="body-sm"
                    weight="medium"
                    className="mb-3"
                  >
                    Nombre de participants
                  </Typography>
                  <Slider
                    defaultValue={[0, 100]}
                    max={500}
                    step={10}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground mt-2">
                    <span>0</span>
                    <span>500+</span>
                  </div>
                </div>

                {/* Date range */}
                <div>
                  <Typography
                    variant="body-sm"
                    weight="medium"
                    className="mb-3"
                  >
                    Période
                  </Typography>
                  <div className="flex gap-2">
                    <Input type="date" placeholder="De" className="flex-1" />
                    <Input type="date" placeholder="À" className="flex-1" />
                  </div>
                </div>

                {/* Sort options */}
                <div>
                  <Typography
                    variant="body-sm"
                    weight="medium"
                    className="mb-3"
                  >
                    Trier par
                  </Typography>
                  <Select defaultValue="year-desc" disabled={loading}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="year-desc">Année (récente)</SelectItem>
                      <SelectItem value="year-asc">Année (ancienne)</SelectItem>
                      <SelectItem value="participants-desc">
                        Participants (haut)
                      </SelectItem>
                      <SelectItem value="participants-asc">
                        Participants (bas)
                      </SelectItem>
                      <SelectItem value="edition-desc">
                        Édition (récente)
                      </SelectItem>
                      <SelectItem value="edition-asc">
                        Édition (ancienne)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Advanced options */}
              <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="rounded"
                    disabled={loading}
                  />
                  <Typography variant="body-sm">Avec phases</Typography>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="rounded"
                    disabled={loading}
                  />
                  <Typography variant="body-sm">Avec lutteurs</Typography>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="rounded"
                    disabled={loading}
                  />
                  <Typography variant="body-sm">Avec régions</Typography>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="rounded"
                    disabled={loading}
                  />
                  <Typography variant="body-sm">Actives uniquement</Typography>
                </label>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </section>
  );
}
