// components/shared/entity-list.tsx
"use client";

import React, { useState, useEffect } from "react";
import { Typography } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Filter,
  Grid,
  List,
  Plus,
  Download,
  RefreshCw,
} from "lucide-react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { EntityFilters } from "@/components/shared/entity-filters";
import { StatsCarousel } from "@/components/shared/stats-carousel";
import { MobileScreen } from "@/components/shared/mobile-screen";
import { useScreenSize } from "@/hooks/use-screen";

// Types génériques
export interface EntityListProps<T> {
  // Données et configuration
  title: string;
  description?: string;
  entityType:
    | "fighter"
    | "region"
    | 'transfers'
    | "competition"
    | "edition"
    | "referee"
    | "match";
  data: T[];
  total: number;
  loading?: boolean;

  // Pagination
  page: number;
  limit: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;

  // Recherche et filtres
  searchTerm: string;
  onSearchChange: (search: string) => void;
  filters: Record<string, any>;
  onFilterChange: (filters: Record<string, any>) => void;

  // Actions
  onAdd?: () => void;
  onExport?: () => void;
  onRefresh?: () => void;

  // Affichage
  viewMode?: "grid" | "list";
  onViewModeChange?: (mode: "grid" | "list") => void;

  // Renderers personnalisés
  renderCard: (item: T, viewMode: "grid" | "list") => React.ReactNode;
  renderStats?: () => React.ReactNode;

  // Filtres disponibles
  availableFilters?: {
    key: string;
    label: string;
    options: { value: string; label: string }[];
  }[];
}

export function EntityList<T>({
  title,
  description,
  entityType,
  data,
  total,
  loading = false,
  page,
  limit,
  onPageChange,
  onLimitChange,
  searchTerm,
  onSearchChange,
  filters,
  onFilterChange,
  onAdd,
  onExport,
  onRefresh,
  viewMode = "grid",
  onViewModeChange,
  renderCard,
  renderStats,
  availableFilters = [],
}: EntityListProps<T>) {
  const { isMobile } = useScreenSize();
  const totalPages = Math.ceil(total / limit);

  // Filtres spécifiques par type d'entité
  const getEntitySpecificFilters = () => {
    const baseFilters = [
      {
        key: "limit",
        label: "Éléments par page",
        options: [
          { value: "10", label: "10" },
          { value: "20", label: "20" },
          { value: "50", label: "50" },
          { value: "100", label: "100" },
        ],
      },
    ];

    switch (entityType) {
      case "fighter":
        return [
          ...baseFilters,
          {
            key: "is_active",
            label: "Statut",
            options: [
              { value: "all", label: "Tous" },
              { value: "active", label: "Actifs" },
              { value: "inactive", label: "Inactifs" },
            ],
          },
          {
            key: "is_champion",
            label: "Champion",
            options: [
              { value: "all", label: "Tous" },
              { value: "champion", label: "Champions" },
              { value: "not_champion", label: "Non champions" },
            ],
          },
        ];

      case "competition":
        return [
          ...baseFilters,
          {
            key: "status",
            label: "Statut",
            options: [
              { value: "all", label: "Tous" },
              { value: "upcoming", label: "À venir" },
              { value: "ongoing", label: "En cours" },
              { value: "completed", label: "Terminées" },
            ],
          },
          {
            key: "type",
            label: "Type",
            options: [
              { value: "all", label: "Tous" },
              { value: "sabre_national", label: "Sabre National" },
              { value: "coupe_regionale", label: "Coupe Régionale" },
              { value: "halarou_bakwai", label: "Halarou Bakwai" },
              { value: "aes", label: "AES" },
            ],
          },
        ];

      case "region":
        return [
          ...baseFilters,
          {
            key: "sort",
            label: "Trier par",
            options: [
              { value: "name", label: "Nom" },
              { value: "fighters", label: "Nombre de lutteurs" },
              { value: "champions", label: "Nombre de champions" },
            ],
          },
        ];

      default:
        return baseFilters;
    }
  };

  const entityFilters = [...getEntitySpecificFilters(), ...availableFilters];

  return (
    <div className="space-y-6">
      {/* En-tête avec titre et actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <Typography variant="h3" weight="bold" gradient animated>
            {title}
          </Typography>
          {description && (
            <Typography variant="lead" theme="muted">
              {description}
            </Typography>
          )}
        </div>

        <div className="flex items-center gap-2">
          {onViewModeChange && (
            <div className="flex border rounded-lg p-1">
              <Button
                variant={viewMode === "grid" ? "default" : "ghost"}
                size="sm"
                onClick={() => onViewModeChange("grid")}
                className="h-8 w-8 p-0"
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="sm"
                onClick={() => onViewModeChange("list")}
                className="h-8 w-8 p-0"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          )}

          {onExport && (
            <Button variant="outline" size="sm" onClick={onExport}>
              <Download className="h-4 w-4 mr-2" />
              Exporter
            </Button>
          )}

          {onRefresh && (
            <Button variant="outline" size="sm" onClick={onRefresh}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          )}

          {onAdd && (
            <Button size="sm" onClick={onAdd}>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter
            </Button>
          )}
        </div>
      </div>

      {/* Statistiques */}
      {renderStats && (
        <div className="mb-6">
          <StatsCarousel>
            {renderStats()}
          </StatsCarousel>
        </div>
      )}

      {/* Barre de recherche et filtres */}
      <EntityFilters
        searchTerm={searchTerm}
        onSearchChange={onSearchChange}
        filters={filters}
        onFilterChange={onFilterChange}
        availableFilters={[...getEntitySpecificFilters(), ...availableFilters]}
        onReset={() => {
          onSearchChange("");
          onFilterChange({});
        }}
      />

      {/* Contenu */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>
              {total} {total > 1 ? "éléments" : "élément"} trouvé(s)
            </CardTitle>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>
                Page {page} sur {totalPages}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div
              className={cn(
                "grid gap-4",
                viewMode === "grid"
                  ? "grid-cols-1 md:grid-cols-2 xl:grid-cols-3"
                  : "grid-cols-1"
              )}
            >
              {Array.from({ length: 6 }).map((_, index) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <Skeleton className="h-4 w-2/3" />
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-3 w-3/4" />
                      <div className="flex gap-2">
                        <Skeleton className="h-6 w-16" />
                        <Skeleton className="h-6 w-20" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : data.length === 0 ? (
            <div className="text-center py-12">
              <Typography variant="h4" theme="muted" className="mb-2">
                Aucun résultat trouvé
              </Typography>
              <Typography variant="body-sm" theme="muted">
                Aucun {title.toLowerCase()} ne correspond à vos critères de
                recherche.
              </Typography>
            </div>
          ) : (
            <div
              className={cn(
                "grid gap-4",
                viewMode === "grid"
                  ? "grid-cols-1 md:grid-cols-2 xl:grid-cols-3"
                  : "grid-cols-1"
              )}
            >
              {data.map((item, index) => (
                <React.Fragment key={index}>
                  {renderCard(item, viewMode)}
                </React.Fragment>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center">
          <div className="text-sm text-muted-foreground">
            Affichage de {(page - 1) * limit + 1} à{" "}
            {Math.min(page * limit, total)} sur {total} éléments
          </div>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (page > 1) onPageChange(page - 1);
                  }}
                  aria-disabled={page <= 1}
                  className={cn(page <= 1 && "pointer-events-none opacity-50")}
                />
              </PaginationItem>

              {/* Page numbers */}
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <PaginationItem key={p}>
                  <PaginationLink
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      onPageChange(p);
                    }}
                    isActive={p === page}
                  >
                    {p}
                  </PaginationLink>
                </PaginationItem>
              ))}

              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (page < totalPages) onPageChange(page + 1);
                  }}
                  aria-disabled={page >= totalPages}
                  className={cn(
                    page >= totalPages && "pointer-events-none opacity-50"
                  )}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}
