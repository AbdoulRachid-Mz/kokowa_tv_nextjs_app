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
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

// Types génériques
export interface EntityListProps<T> {
  // Données et configuration
  title: string;
  description?: string;
  entityType:
    | "fighter"
    | "region"
    | "competition"
    | "edition"
    | "referee"
    | "match"
    | "phase"
    | "article"
    | "media"
    | "video"
    | "message"
    | "phase-groups"
    | "sub-groups"
    | "notification";
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
  const totalPages = Math.ceil(total / limit);

  // Filtres spécifiques par type d'entité
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
        {
          key: "region_id",
          label: "Région",
          options: [
            { value: "all", label: "Toutes régions" },
            // Les options seront chargées dynamiquement
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
            { value: "friendly", label: "Amical" },
            { value: "ministre", label: "Ministre" },
            { value: "coupe_airtel", label: "Coupe Airtel" },
            { value: "other", label: "Autre" },
          ],
        },
      ];

    case "edition":
      return [
        ...baseFilters,
        {
          key: "year",
          label: "Année",
          options: [
            { value: "all", label: "Toutes années" },
            { value: "2024", label: "2024" },
            { value: "2023", label: "2023" },
            { value: "2022", label: "2022" },
          ],
        },
        {
          key: "competition_id",
          label: "Compétition",
          options: [
            { value: "all", label: "Toutes compétitions" },
          ],
        },
      ];

    case "phase":
      return [
        ...baseFilters,
        {
          key: "phase_type",
          label: "Type de Phase",
          options: [
            { value: "all", label: "Tous" },
            { value: "qualification", label: "Qualification" },
            { value: "group", label: "Groupe" },
            { value: "knockout", label: "Élimination directe" },
            { value: "quarterfinal", label: "Quart de finale" },
            { value: "semifinal", label: "Demi-finale" },
            { value: "final", label: "Finale" },
          ],
        },
        {
          key: "is_completed",
          label: "Statut",
          options: [
            { value: "all", label: "Tous" },
            { value: "true", label: "Terminé" },
            { value: "false", label: "En cours" },
          ],
        },
      ];

    case "phase-groups":
      return [
        ...baseFilters,
        {
          key: "is_completed",
          label: "Statut",
          options: [
            { value: "all", label: "Tous" },
            { value: "true", label: "Terminé" },
            { value: "false", label: "En cours" },
          ],
        },
      ];

    case "sub-groups":
      return [
        ...baseFilters,
        {
          key: "is_completed",
          label: "Statut",
          options: [
            { value: "all", label: "Tous" },
            { value: "true", label: "Terminé" },
            { value: "false", label: "En cours" },
          ],
        },
      ];

    case "match":
      return [
        ...baseFilters,
        {
          key: "status",
          label: "Statut",
          options: [
            { value: "all", label: "Tous" },
            { value: "scheduled", label: "Programmé" },
            { value: "live", label: "En direct" },
            { value: "completed", label: "Terminé" },
            { value: "cancelled", label: "Annulé" },
          ],
        },
      ];

    case "referee":
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
          key: "certification_level",
          label: "Niveau Certification",
          options: [
            { value: "all", label: "Tous niveaux" },
            { value: "national", label: "National" },
            { value: "regional", label: "Régional" },
            { value: "international", label: "International" },
          ],
        },
      ];

    case "article":
      return [
        ...baseFilters,
        {
          key: "status",
          label: "Statut",
          options: [
            { value: "all", label: "Tous" },
            { value: "draft", label: "Brouillon" },
            { value: "published", label: "Publié" },
            { value: "archived", label: "Archivé" },
          ],
        },
        {
          key: "language",
          label: "Langue",
          options: [
            { value: "all", label: "Toutes" },
            { value: "fr", label: "Français" },
            { value: "ha", label: "Haoussa" },
            { value: "en", label: "Anglais" },
          ],
        },
      ];

    case "media":
      return [
        ...baseFilters,
        {
          key: "file_type",
          label: "Type de fichier",
          options: [
            { value: "all", label: "Tous" },
            { value: "image", label: "Image" },
            { value: "video", label: "Vidéo" },
            { value: "document", label: "Document" },
            { value: "audio", label: "Audio" },
          ],
        },
      ];

    case "video":
      return [
        ...baseFilters,
        {
          key: "category",
          label: "Catégorie",
          options: [
            { value: "all", label: "Toutes" },
            { value: "match", label: "Match" },
            { value: "interview", label: "Interview" },
            { value: "highlights", label: "Highlights" },
            { value: "training", label: "Entraînement" },
            { value: "documentary", label: "Documentaire" },
            { value: "ceremony", label: "Cérémonie" },
          ],
        },
        {
          key: "type",
          label: "Plateforme",
          options: [
            { value: "all", label: "Toutes" },
            { value: "youtube", label: "YouTube" },
            { value: "facebook", label: "Facebook" },
            { value: "tiktok", label: "TikTok" },
            { value: "upload", label: "Upload" },
          ],
        },
      ];

    case "message":
      return [
        ...baseFilters,
        {
          key: "message_type",
          label: "Type de message",
          options: [
            { value: "all", label: "Tous" },
            { value: "comment", label: "Commentaire" },
            { value: "direct_message", label: "Message direct" },
            { value: "group_message", label: "Message groupe" },
            { value: "match_commentary", label: "Commentaire match" },
            { value: "system_notification", label: "Notification système" },
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
      {renderStats && renderStats()}

      {/* Barre de recherche et filtres */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Recherche */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={`Rechercher des ${title.toLowerCase()}...`}
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Filtres */}
            <div className="flex flex-wrap gap-2">
              {entityFilters.map((filter, idx) => (
                <Select
                  key={filter.key+idx}
                  value={filters[filter.key] || "all"}
                  onValueChange={(value) =>
                    onFilterChange({ ...filters, [filter.key]: value })
                  }
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder={filter.label} />
                  </SelectTrigger>
                  <SelectContent>
                    {filter.options.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

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
                  className={page <= 1 ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>

              {/* Première page */}
              <PaginationItem>
                <PaginationLink
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    onPageChange(1);
                  }}
                  isActive={page === 1}
                >
                  1
                </PaginationLink>
              </PaginationItem>

              {/* Ellipsis avant la fenêtre */}
              {page > 3 && totalPages > 5 && (
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
              )}

              {/* Fenêtre centrée autour de la page courante */}
              {Array.from({ length: Math.min(3, totalPages) }, (_, i) => {
                const center = Math.min(Math.max(page, 3), totalPages - 2);
                const p = center - 1 + i;
                if (p <= 1 || p >= totalPages) return null;
                return (
                  <PaginationItem key={p}>
                    <PaginationLink
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        onPageChange(p);
                      }}
                      isActive={page === p}
                    >
                      {p}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}

              {/* Ellipsis après la fenêtre */}
              {page < totalPages - 2 && totalPages > 5 && (
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
              )}

              {/* Dernière page */}
              {totalPages > 1 && (
                <PaginationItem>
                  <PaginationLink
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      onPageChange(totalPages);
                    }}
                    isActive={page === totalPages}
                  >
                    {totalPages}
                  </PaginationLink>
                </PaginationItem>
              )}

              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (page < totalPages) onPageChange(page + 1);
                  }}
                  aria-disabled={page >= totalPages}
                  className={
                    page >= totalPages ? "pointer-events-none opacity-50" : ""
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}
