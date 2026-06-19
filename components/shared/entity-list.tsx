'use client';

import React, { useMemo } from 'react';
import { Typography } from '@/components/ui/typography';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Search,
  Grid,
  List,
  Plus,
  RefreshCw,
  LayoutGrid,
} from 'lucide-react';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { EntityType, toPluralEntityType } from '@/lib/entity-utils';

// Types génériques
export interface EntityListProps<T> {
  // Données et configuration
  title: string;
  description?: string;
  entityType: EntityType;
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
  onRefresh?: () => void;
  onExport?: () => void;

  // Affichage
  viewMode?: 'grid' | 'list' | 'compact';
  onViewModeChange?: (mode: 'grid' | 'list' | 'compact') => void;

  // Renderers personnalisés
  renderCard: (item: T, viewMode: 'grid' | 'list' | 'compact') => React.ReactNode;
  renderStats?: () => React.ReactNode;

  // Filtres disponibles supplémentaires
  availableFilters?: Array<{
    key: string;
    label: string;
    options: Array<{ value: string; label: string }>;
  }>;
}

// Définition des filtres par entité
const getEntityFilters = (entityType: EntityType) => {
  const baseFilters = [
    {
      key: 'limit',
      label: 'Éléments par page',
      options: [
        { value: '10', label: '10' },
        { value: '20', label: '20' },
        { value: '50', label: '50' },
        { value: '100', label: '100' },
      ],
    },
  ];

  const pluralType = toPluralEntityType(entityType);

  const entityFiltersMap: Record<string, Array<{
    key: string;
    label: string;
    options: Array<{ value: string; label: string }>;
  }>> = {
    fighters: [
      {
        key: 'is_active',
        label: 'Statut',
        options: [
          { value: 'all', label: 'Tous' },
          { value: 'true', label: 'Actifs' },
          { value: 'false', label: 'Inactifs' },
        ],
      },
      {
        key: 'is_champion',
        label: 'Champion',
        options: [
          { value: 'all', label: 'Tous' },
          { value: 'true', label: 'Champions' },
          { value: 'false', label: 'Non champions' },
        ],
      },
    ],
    regions: [],
    competitions: [
      {
        key: 'status',
        label: 'Statut',
        options: [
          { value: 'all', label: 'Tous' },
          { value: 'upcoming', label: 'À venir' },
          { value: 'ongoing', label: 'En cours' },
          { value: 'completed', label: 'Terminées' },
          { value: 'cancelled', label: 'Annulées' },
          { value: 'postponed', label: 'Reportés' },
        ],
      },
      {
        key: 'is_active',
        label: 'Actif',
        options: [
          { value: 'all', label: 'Tous' },
          { value: 'true', label: 'Oui' },
          { value: 'false', label: 'Non' },
        ],
      },
    ],
    editions: [
      {
        key: 'year',
        label: 'Année',
        options: [
          { value: 'all', label: 'Toutes années' },
          { value: '2026', label: '2026' },
          { value: '2025', label: '2025' },
          { value: '2024', label: '2024' },
          { value: '2023', label: '2023' },
          { value: '2022', label: '2022' },
          { value: '2021', label: '2021' },
          { value: '2020', label: '2020' },
        ],
      },
      {
        key: 'is_active',
        label: 'Actif',
        options: [
          { value: 'all', label: 'Tous' },
          { value: 'true', label: 'Oui' },
          { value: 'false', label: 'Non' },
        ],
      },
    ],
    matches: [
      {
        key: 'status',
        label: 'Statut',
        options: [
          { value: 'all', label: 'Tous' },
          { value: 'scheduled', label: 'Programmé' },
          { value: 'live', label: 'En direct' },
          { value: 'completed', label: 'Terminé' },
          { value: 'cancelled', label: 'Annulé' },
        ],
      },
    ],
    referees: [
      {
        key: 'is_active',
        label: 'Statut',
        options: [
          { value: 'all', label: 'Tous' },
          { value: 'true', label: 'Actifs' },
          { value: 'false', label: 'Inactifs' },
        ],
      },
      {
        key: 'certification_level',
        label: 'Niveau Certification',
        options: [
          { value: 'all', label: 'Tous niveaux' },
          { value: 'regional', label: 'Régional' },
          { value: 'national', label: 'National' },
          { value: 'international', label: 'International' },
        ],
      },
    ],
    phases: [
      {
        key: 'phase_type',
        label: 'Type de Phase',
        options: [
          { value: 'all', label: 'Tous' },
          { value: 'qualification', label: 'Qualification' },
          { value: 'group', label: 'Groupe' },
          { value: 'knockout', label: 'Élimination directe' },
          { value: 'quarterfinal', label: 'Quart de finale' },
          { value: 'semifinal', label: 'Demi-finale' },
          { value: 'final', label: 'Finale' },
        ],
      },
      {
        key: 'is_completed',
        label: 'Terminé',
        options: [
          { value: 'all', label: 'Tous' },
          { value: 'true', label: 'Oui' },
          { value: 'false', label: 'Non' },
        ],
      },
    ],
    'phase-groups': [
      {
        key: 'is_completed',
        label: 'Terminé',
        options: [
          { value: 'all', label: 'Tous' },
          { value: 'true', label: 'Oui' },
          { value: 'false', label: 'Non' },
        ],
      },
    ],
    'sub-groups': [
      {
        key: 'is_completed',
        label: 'Terminé',
        options: [
          { value: 'all', label: 'Tous' },
          { value: 'true', label: 'Oui' },
          { value: 'false', label: 'Non' },
        ],
      },
    ],
    articles: [
      {
        key: 'status',
        label: 'Statut',
        options: [
          { value: 'all', label: 'Tous' },
          { value: 'draft', label: 'Brouillon' },
          { value: 'published', label: 'Publié' },
          { value: 'archived', label: 'Archivé' },
        ],
      },
      {
        key: 'language',
        label: 'Langue',
        options: [
          { value: 'all', label: 'Toutes' },
          { value: 'fr', label: 'Français' },
          { value: 'ha', label: 'Haoussa' },
          { value: 'en', label: 'Anglais' },
        ],
      },
    ],
    media: [
      {
        key: 'file_type',
        label: 'Type de fichier',
        options: [
          { value: 'all', label: 'Tous' },
          { value: 'image', label: 'Image' },
          { value: 'video', label: 'Vidéo' },
          { value: 'document', label: 'Document' },
          { value: 'audio', label: 'Audio' },
        ],
      },
    ],
    videos: [
      {
        key: 'category',
        label: 'Catégorie',
        options: [
          { value: 'all', label: 'Toutes' },
          { value: 'match', label: 'Match' },
          { value: 'interview', label: 'Interview' },
          { value: 'highlights', label: 'Highlights' },
          { value: 'training', label: 'Entraînement' },
          { value: 'documentary', label: 'Documentaire' },
          { value: 'ceremony', label: 'Cérémonie' },
        ],
      },
      {
        key: 'type',
        label: 'Plateforme',
        options: [
          { value: 'all', label: 'Toutes' },
          { value: 'youtube', label: 'YouTube' },
          { value: 'facebook', label: 'Facebook' },
          { value: 'tiktok', label: 'TikTok' },
          { value: 'upload', label: 'Upload' },
        ],
      },
      {
        key: 'is_live',
        label: 'Live',
        options: [
          { value: 'all', label: 'Tous' },
          { value: 'true', label: 'Oui' },
          { value: 'false', label: 'Non' },
        ],
      },
      {
        key: 'is_featured',
        label: 'En vedette',
        options: [
          { value: 'all', label: 'Tous' },
          { value: 'true', label: 'Oui' },
          { value: 'false', label: 'Non' },
        ],
      },
    ],
    messages: [
      {
        key: 'message_type',
        label: 'Type de message',
        options: [
          { value: 'all', label: 'Tous' },
          { value: 'comment', label: 'Commentaire' },
          { value: 'direct_message', label: 'Message direct' },
          { value: 'group_message', label: 'Message groupe' },
          { value: 'match_commentary', label: 'Commentaire match' },
          { value: 'system_notification', label: 'Notification système' },
        ],
      },
    ],
    notifications: [
      {
        key: 'notification_type',
        label: 'Type de notification',
        options: [
          { value: 'all', label: 'Tous' },
          { value: 'match_update', label: 'Mise à jour match' },
          { value: 'fighter_update', label: 'Mise à jour lutteur' },
          { value: 'competition_update', label: 'Mise à jour compétition' },
          { value: 'system_notification', label: 'Notification système' },
          { value: 'achievement', label: 'Réalisation' },
          { value: 'message', label: 'Message' },
        ],
      },
      {
        key: 'is_read',
        label: 'Lu',
        options: [
          { value: 'all', label: 'Tous' },
          { value: 'true', label: 'Oui' },
          { value: 'false', label: 'Non' },
        ],
      },
    ],
    users: [
      {
        key: 'role',
        label: 'Rôle',
        options: [
          { value: 'all', label: 'Tous' },
          { value: 'admin', label: 'Administrateur' },
          { value: 'editor', label: 'Éditeur' },
          { value: 'user', label: 'Utilisateur' },
          { value: 'moderator', label: 'Modérateur' },
          { value: 'fighter_manager', label: 'Gestionnaire de lutteurs' },
        ],
      },
      {
        key: 'is_active',
        label: 'Statut',
        options: [
          { value: 'all', label: 'Tous' },
          { value: 'true', label: 'Actifs' },
          { value: 'false', label: 'Inactifs' },
        ],
      },
      {
        key: 'is_verified',
        label: 'Vérifié',
        options: [
          { value: 'all', label: 'Tous' },
          { value: 'true', label: 'Oui' },
          { value: 'false', label: 'Non' },
        ],
      },
    ],
    coaches: [
      {
        key: 'is_active',
        label: 'Statut',
        options: [
          { value: 'all', label: 'Tous' },
          { value: 'true', label: 'Actifs' },
          { value: 'false', label: 'Inactifs' },
        ],
      },
      {
        key: 'certification_level',
        label: 'Niveau Certification',
        options: [
          { value: 'all', label: 'Tous niveaux' },
          { value: 'regional', label: 'Régional' },
          { value: 'national', label: 'National' },
          { value: 'international', label: 'International' },
        ],
      },
    ],
    transfers: [
      {
        key: 'status',
        label: 'Statut',
        options: [
          { value: 'all', label: 'Tous' },
          { value: 'pending', label: 'En attente' },
          { value: 'approved', label: 'Approuvé' },
          { value: 'rejected', label: 'Rejeté' },
          { value: 'cancelled', label: 'Annulé' },
        ],
      },
    ],
    advertisements: [
      {
        key: 'position',
        label: 'Position',
        options: [
          { value: 'all', label: 'Toutes' },
          { value: 'header', label: 'En-tête' },
          { value: 'sidebar', label: 'Barre latérale' },
          { value: 'footer', label: 'Pied de page' },
          { value: 'inline', label: 'En ligne' },
        ],
      },
      {
        key: 'media_type',
        label: 'Type média',
        options: [
          { value: 'all', label: 'Tous' },
          { value: 'image', label: 'Image' },
          { value: 'video', label: 'Vidéo' },
        ],
      },
      {
        key: 'is_active',
        label: 'Actif',
        options: [
          { value: 'all', label: 'Tous' },
          { value: 'true', label: 'Oui' },
          { value: 'false', label: 'Non' },
        ],
      },
    ],
    interactions: [
      {
        key: 'entity_type',
        label: 'Type d\'entité',
        options: [
          { value: 'all', label: 'Tous' },
          { value: 'fighter', label: 'Lutteur' },
          { value: 'article', label: 'Article' },
          { value: 'video', label: 'Vidéo' },
          { value: 'match', label: 'Match' },
        ],
      },
      {
        key: 'interaction_type',
        label: 'Type d\'interaction',
        options: [
          { value: 'all', label: 'Tous' },
          { value: 'like', label: 'Like' },
          { value: 'comment', label: 'Commentaire' },
          { value: 'share', label: 'Partage' },
          { value: 'view', label: 'Vue' },
        ],
      },
    ],
    archives: [
      {
        key: 'year',
        label: 'Année',
        options: [
          { value: 'all', label: 'Toutes années' },
          { value: '2026', label: '2026' },
          { value: '2025', label: '2025' },
          { value: '2024', label: '2024' },
          { value: '2023', label: '2023' },
          { value: '2022', label: '2022' },
          { value: '2021', label: '2021' },
          { value: '2020', label: '2020' },
        ],
      },
      {
        key: 'position',
        label: 'Position',
        options: [
          { value: 'all', label: 'Toutes positions' },
          { value: '1st', label: '1er' },
          { value: '2nd', label: '2e' },
          { value: '3rd', label: '3e' },
          { value: 'finalist', label: 'Finaliste' },
          { value: 'semifinalist', label: 'Demi-finaliste' },
          { value: 'quarterfinalist', label: 'Quart-finaliste' },
        ],
      },
    ],
    belts: [
      {
        key: 'is_active',
        label: 'Actif',
        options: [
          { value: 'all', label: 'Tous' },
          { value: 'true', label: 'Oui' },
          { value: 'false', label: 'Non' },
        ],
      },
    ],
    'fighter-achievements': [
      {
        key: 'year',
        label: 'Année',
        options: [
          { value: 'all', label: 'Toutes années' },
          { value: '2026', label: '2026' },
          { value: '2025', label: '2025' },
          { value: '2024', label: '2024' },
          { value: '2023', label: '2023' },
          { value: '2022', label: '2022' },
          { value: '2021', label: '2021' },
          { value: '2020', label: '2020' },
        ],
      },
      {
        key: 'position',
        label: 'Position',
        options: [
          { value: 'all', label: 'Toutes positions' },
          { value: '1st', label: '1er' },
          { value: '2nd', label: '2e' },
          { value: '3rd', label: '3e' },
        ],
      },
    ],
    'edition-fighters': [
      {
        key: 'status',
        label: 'Statut',
        options: [
          { value: 'all', label: 'Tous' },
          { value: 'active', label: 'Actif' },
          { value: 'eliminated', label: 'Éliminé' },
        ],
      },
      {
        key: 'is_champion',
        label: 'Champion',
        options: [
          { value: 'all', label: 'Tous' },
          { value: 'true', label: 'Oui' },
          { value: 'false', label: 'Non' },
        ],
      },
    ],
    'edition-regions': [
      {
        key: 'status',
        label: 'Statut',
        options: [
          { value: 'all', label: 'Tous' },
          { value: 'active', label: 'Actif' },
          { value: 'eliminated', label: 'Éliminé' },
        ],
      },
    ],
    'fighter-cards': [],
    teams: [
      {
        key: 'is_active',
        label: 'Statut',
        options: [
          { value: 'all', label: 'Tous' },
          { value: 'true', label: 'Actifs' },
          { value: 'false', label: 'Inactifs' },
        ],
      },
      {
        key: 'is_lead',
        label: 'Lead',
        options: [
          { value: 'all', label: 'Tous' },
          { value: 'true', label: 'Leads' },
          { value: 'false', label: 'Membres' },
        ],
      },
      {
        key: 'role',
        label: 'Rôle',
        options: [
          { value: 'all', label: 'Tous les rôles' },
          { value: 'Lead Developer', label: 'Lead Developer' },
          { value: 'UI/UX Designer', label: 'UI/UX Designer' },
          { value: 'Backend Engineer', label: 'Backend Engineer' },
          { value: 'Project Manager', label: 'Project Manager' },
        ],
      },
    ],
  };

  return [
    ...baseFilters,
    ...(entityFiltersMap[pluralType] || []),
  ];
};

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
  onRefresh,
  onExport,
  viewMode = 'grid',
  onViewModeChange,
  renderCard,
  renderStats,
  availableFilters = [],
}: EntityListProps<T>) {
  const totalPages = Math.ceil(total / limit) || 1;

  // Obtenir les filtres pour cette entité
  const entityFilters = useMemo(() => {
    const allFilters = [
      ...getEntityFilters(entityType),
      ...availableFilters,
    ];
    
    // Dédupliquer par clé pour éviter les erreurs de clés React (ex: filtres vidéos)
    const uniqueFilters: Array<any> = [];
    const seenKeys = new Set<string>();
    
    for (const filter of allFilters) {
      if (!seenKeys.has(filter.key)) {
        seenKeys.add(filter.key);
        uniqueFilters.push(filter);
      }
    }
    
    return uniqueFilters;
  }, [entityType, availableFilters]);

  return (
    <div className="space-y-4">
      {/* En-tête avec titre et actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <Typography variant="body-lg" weight="bold" animated>
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
            <div className="flex border rounded-lg p-1 bg-muted/50">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onViewModeChange('grid')}
                className="h-8 w-8 p-0"
                title="Grille"
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onViewModeChange('list')}
                className="h-8 w-8 p-0"
                title="Liste"
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'compact' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onViewModeChange('compact')}
                className="h-8 w-8 p-0"
                title="Compact"
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
            </div>
          )}

          {onRefresh && (
            <Button variant="outline" size="sm" onClick={onRefresh}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          )}

          {onExport && (
            <Button variant="outline" size="sm" onClick={onExport}>
              <Plus className="h-4 w-4 mr-2" />
              Exporter
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
      <Card className="py-1 gap-1">
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
              {entityFilters.map((filter) => (
                <Select
                  key={filter.key}
                  value={filter.key === 'limit' ? limit.toString() : (filters[filter.key] ?? 'all')}
                  onValueChange={(value) => {
                    if (filter.key === 'limit') {
                      onLimitChange(Number(value));
                    } else {
                      onFilterChange({ ...filters, [filter.key]: value === 'all' ? undefined : value });
                    }
                  }}
                >
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder={filter.label || filter.key} />
                  </SelectTrigger>
                  <SelectContent>
                    {filter.options.map((option: any, index: number) => (
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
              {total} {total > 1 ? 'éléments' : 'élément'} trouvé{total > 1 ? 's' : ''}
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
                'grid gap-4',
                viewMode === 'grid' && 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3',
                viewMode === 'list' && 'grid-cols-1',
                viewMode === 'compact' && 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
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
            <div className="text-center py-10">
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
                'grid gap-4',
                viewMode === 'grid' && 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3',
                viewMode === 'list' && 'grid-cols-1',
                viewMode === 'compact' && 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
              )}
            >
              {data.map((item, index) => (
                <React.Fragment key={(item as any).id || index}>
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
            Affichage de {(page - 1) * limit + 1} à{' '}
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
                  className={page <= 1 ? 'pointer-events-none opacity-50' : ''}
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
                    page >= totalPages ? 'pointer-events-none opacity-50' : ''
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
