// hooks/use-entity-list.ts
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  FighterFilters,
  RegionFilters,
  CompetitionFilters,
  RefereeFilters,
  EditionFilters,
  MatchFilters,
  PhaseFilters,
  PaginatedResponse,
  ArticleFilters,
  MediaFilters,
  VideoFilters,
  MessageFilters,
  PhaseGroupFilters,
  SubGroupFilters,
  NotificationFilters,
  UserFilters,
  CoachFilters,
  FighterTransferFilters,
  ArchiveFighterAchievementFilters,
  InteractionFilters
} from '@/types';

// Types pour les filtres par entité
export type EntityFilters = 
  | FighterFilters 
  | RegionFilters 
  | CompetitionFilters 
  | EditionFilters 
  | MatchFilters 
  | RefereeFilters 
  | PhaseFilters
  | ArticleFilters
  | MediaFilters
  | VideoFilters
  | MessageFilters
  | PhaseGroupFilters
  | SubGroupFilters
  | NotificationFilters
  | UserFilters
  | CoachFilters
  | FighterTransferFilters
  | ArchiveFighterAchievementFilters
  | InteractionFilters
  | Record<string, any>;

export interface UseEntityListProps<T> {
  entityType: 
    | 'fighters' 
    | 'archives' 
    | 'regions' 
    | 'coaches' 
    | 'transfers' 
    | 'competitions' 
    | 'editions' 
    | 'matches' 
    | 'referees' 
    | 'phases'
    | 'articles'
    | 'media'
    | 'videos'
    | 'messages'
    | 'interactions'
    | 'phase-groups'
    | 'sub-groups'
    | 'notifications'
    | 'users';
  defaultFilters?: EntityFilters;
  defaultLimit?: number;
  withRelations?: boolean;
  defaultData?: T[];
  useDefaultData?: boolean;
  autoFetch?: boolean; // Nouveau: pour contrôler si on fetch automatiquement
}

export function useEntityList<T>({
  entityType,
  defaultFilters = {},
  defaultLimit = 20,
  withRelations = true,
  defaultData = [],
  useDefaultData = false,
  autoFetch = true, // Par défaut, on fetch automatiquement
}: UseEntityListProps<T>) {
  const router = useRouter();
  const abortControllerRef = useRef<AbortController | null>(null);
  const isMounted = useRef(true);
  
  // États
  const [data, setData] = useState<T[]>(useDefaultData ? defaultData : []);
  const [total, setTotal] = useState(useDefaultData ? defaultData.length : 0);
  const [loading, setLoading] = useState(autoFetch && (!useDefaultData || defaultData.length === 0));
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(defaultLimit);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<EntityFilters>(defaultFilters);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [error, setError] = useState<string | null>(null);
  
  // Nettoyage à la destruction du composant
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);
  
  // Mémoriser les filtres pour éviter les re-renders inutiles
  const stableFilters = useMemo(() => filters, [JSON.stringify(filters)]);
  
  // Construction des paramètres de requête
  const buildQueryParams = useCallback((): Record<string, string> => {
    const params: Record<string, string> = {
      page: page.toString(),
      limit: limit.toString(),
    };

    // Paramètres communs
    if (searchTerm) {
      params.search = searchTerm;
    }

    // Relations par défaut
    if (withRelations) {
      params.with_relations = 'true';
    }

    // Tri et ordre
    if (stableFilters.sortBy) {
      params.sortBy = stableFilters.sortBy;
    }
    if (stableFilters.sortOrder) {
      params.sortOrder = stableFilters.sortOrder;
    }

    // Paramètres spécifiques selon le type d'entité
    const addFilter = (key: string, value: any) => {
      if (value !== undefined && value !== null && value !== '') {
        params[key] = value.toString();
      }
    };

    switch (entityType) {
      case 'users':
        const userFilters = stableFilters as UserFilters;
        addFilter('role', userFilters.role);
        addFilter('is_active', userFilters.is_active);
        addFilter('is_verified', userFilters.is_verified);
        addFilter('country', userFilters.country);
        addFilter('date_from', userFilters.date_from);
        addFilter('date_to', userFilters.date_to);
        if (userFilters.with_profile) params.with_profile = 'true';
        if (userFilters.with_permissions) params.with_permissions = 'true';
        break;
      
      case 'fighters':
        const fighterFilters = stableFilters as FighterFilters;
        addFilter('region_id', fighterFilters.region_id);
        addFilter('is_active', fighterFilters.is_active);
        addFilter('is_champion', fighterFilters.is_champion);
        addFilter('min_ranking', fighterFilters.min_ranking);
        addFilter('max_ranking', fighterFilters.max_ranking);
        if (fighterFilters.with_region) params.with_region = 'true';
        if (fighterFilters.with_achievements) params.with_achievements = 'true';
        break;
      
      case 'archives':
        const archiveFilters = stableFilters as ArchiveFighterAchievementFilters;
        addFilter('fighter_id', archiveFilters.fighter_id);
        addFilter('region_id', archiveFilters.region_id);
        addFilter('edition_id', archiveFilters.edition_id);
        addFilter('year', archiveFilters.year);
        addFilter('position', archiveFilters.position);
        addFilter('archive_reason', archiveFilters.archive_reason);
        addFilter('date_from', archiveFilters.date_from);
        addFilter('date_to', archiveFilters.date_to);
        if (archiveFilters.with_fighter) params.with_fighter = 'true';
        if (archiveFilters.with_region) params.with_region = 'true';
        if (archiveFilters.with_edition) params.with_edition = 'true';
        break;

      case 'transfers':
        const transferFilters = stableFilters as FighterTransferFilters;
        addFilter('fighter_id', transferFilters.fighter_id);
        addFilter('from_region_id', transferFilters.from_region_id);
        addFilter('to_region_id', transferFilters.to_region_id);
        addFilter('status', transferFilters.status);
        addFilter('date_from', transferFilters.date_from);
        addFilter('date_to', transferFilters.date_to);
        if (transferFilters.with_fighter) params.with_fighter = 'true';
        if (transferFilters.with_regions) params.with_regions = 'true';
        break;

      case 'regions':
        const regionFilters = stableFilters as RegionFilters;
        addFilter('code', regionFilters.code);
        addFilter('fighter_count_min', regionFilters.fighter_count_min);
        addFilter('fighter_count_max', regionFilters.fighter_count_max);
        if (regionFilters.with_fighters) params.with_fighters = 'true';
        if (regionFilters.with_competitions) params.with_competitions = 'true';
        break;

      case 'coaches':
        const coachFilters = stableFilters as CoachFilters;
        addFilter('region_id', coachFilters.region_id);
        if (coachFilters.with_region) params.with_region = 'true';
        break;

      case 'competitions':
        const competitionFilters = stableFilters as CompetitionFilters;
        addFilter('status', competitionFilters.status);
        addFilter('region_id', competitionFilters.region_id);
        addFilter('is_active', competitionFilters.is_active);
        addFilter('edition_year', competitionFilters.edition_year);
        addFilter('date_from', competitionFilters.date_from);
        addFilter('date_to', competitionFilters.date_to);
        if (competitionFilters.with_region) params.with_region = 'true';
        if (competitionFilters.with_editions) params.with_editions = 'true';
        if (competitionFilters.with_phases) params.with_phases = 'true';
        break;

      case 'editions':
        const editionFilters = stableFilters as EditionFilters;
        addFilter('competition_id', editionFilters.competition_id);
        addFilter('year', editionFilters.year);
        addFilter('is_active', editionFilters.is_active);
        if (editionFilters.with_competition) params.with_competition = 'true';
        if (editionFilters.with_fighters) params.with_fighters = 'true';
        if (editionFilters.with_phases) params.with_phases = 'true';
        break;

      case 'phases':
        const phaseFilters = stableFilters as PhaseFilters;
        addFilter('edition_id', phaseFilters.edition_id);
        addFilter('phase_type', phaseFilters.phase_type);
        addFilter('is_completed', phaseFilters.is_completed);
        addFilter('is_active', phaseFilters.is_active);
        if (phaseFilters.with_edition) params.with_edition = 'true';
        if (phaseFilters.with_groups) params.with_groups = 'true';
        break;

      case 'phase-groups':
        const phaseGroupFilters = stableFilters as PhaseGroupFilters;
        addFilter('phase_id', phaseGroupFilters.phase_id);
        addFilter('is_active', phaseGroupFilters.is_active);
        if (phaseGroupFilters.with_phase) params.with_phase = 'true';
        break;

      case 'sub-groups':
        const subGroupFilters = stableFilters as SubGroupFilters;
        addFilter('group_id', subGroupFilters.group_id);
        addFilter('region1_id', subGroupFilters.region1_id);
        addFilter('region2_id', subGroupFilters.region2_id);
        addFilter('belt_region1', subGroupFilters.belt_region1);
        addFilter('belt_region2', subGroupFilters.belt_region2);
        addFilter('main_referee_id', subGroupFilters.main_referee_id);
        addFilter('is_active', subGroupFilters.is_active);
        if (subGroupFilters.with_group) params.with_group = 'true';
        if (subGroupFilters.with_matches) params.with_matches = 'true';
        if (subGroupFilters.with_regions) params.with_regions = 'true';
        break;

      case 'matches':
        const matchFilters = stableFilters as MatchFilters;
        addFilter('sub_group_id', matchFilters.sub_group_id);
        addFilter('edition_id', matchFilters.edition_id);
        addFilter('phase_id', matchFilters.phase_id);
        addFilter('group_id', matchFilters.group_id);
        addFilter('status', matchFilters.status);
        addFilter('date_from', matchFilters.date_from);
        addFilter('date_to', matchFilters.date_to);
        if (matchFilters.with_sub_group) params.with_sub_group = 'true';
        if (matchFilters.with_fighters) params.with_fighters = 'true';
        break;
        
      case "interactions":
        const interactionFilters = stableFilters as InteractionFilters;
        addFilter('user_id', interactionFilters.user_id);
        addFilter('entity_type', interactionFilters.entity_type);
        addFilter('entity_id', interactionFilters.entity_id);
        addFilter('interaction_type', interactionFilters.interaction_type);
        if (interactionFilters.with_user) params.with_user = 'true';
        break;

      case 'referees':
        const refereeFilters = stableFilters as RefereeFilters;
        addFilter('region_id', refereeFilters.region_id);
        addFilter('is_active', refereeFilters.is_active);
        addFilter('certification_level', refereeFilters.certification_level);
        addFilter('experience_min', refereeFilters.experience_min);
        if (refereeFilters.with_region) params.with_region = 'true';
        break;

      case 'articles':
        const articleFilters = stableFilters as ArticleFilters;
        addFilter('status', articleFilters.status);
        addFilter('language', articleFilters.language);
        addFilter('author_id', articleFilters.author_id);
        if (articleFilters.with_author) params.with_author = 'true';
        break;

      case 'media':
        const mediaFilters = stableFilters as MediaFilters;
        addFilter('file_type', mediaFilters.file_type);
        addFilter('entity_type', mediaFilters.entity_type);
        addFilter('entity_id', mediaFilters.entity_id);
        if (mediaFilters.with_uploader) params.with_uploader = 'true';
        break;

      case 'videos':
        const videoFilters = stableFilters as VideoFilters;
        addFilter('type', videoFilters.type);
        addFilter('category', videoFilters.category);
        addFilter('is_live', videoFilters.is_live);
        addFilter('is_featured', videoFilters.is_featured);
        break;

      case 'messages':
        const messageFilters = stableFilters as MessageFilters;
        addFilter('message_type', messageFilters.message_type);
        addFilter('entity_type', messageFilters.entity_type);
        addFilter('entity_id', messageFilters.entity_id);
        addFilter('author_id', messageFilters.author_id);
        addFilter('is_active', messageFilters.is_active);
        if (messageFilters.with_author) params.with_author = 'true';
        if (messageFilters.with_recipient) params.with_recipient = 'true';
        break;

      case 'notifications':
        const notificationFilters = stableFilters as NotificationFilters;
        addFilter('notification_type', notificationFilters.notification_type);
        addFilter('is_read', notificationFilters.is_read);
        if (notificationFilters.with_user) params.with_user = 'true';
        break;
    }

    return params;
  }, [entityType, page, limit, searchTerm, stableFilters, withRelations]);

  // Mémoriser les query params
  const queryParams = useMemo(() => buildQueryParams(), [buildQueryParams]);

  // Chargement des données depuis l'API
  const fetchData = useCallback(async (isInitial = false) => {
    // Annuler la requête précédente si elle existe
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    abortControllerRef.current = new AbortController();
    
    if (!isMounted.current) return;
    
    if (isInitial) {
      setLoading(true);
    }
    
    setError(null);

    try {
      const queryString = new URLSearchParams(queryParams).toString();
      const response = await fetch(`/api/${entityType}?${queryString}`, {
        signal: abortControllerRef.current.signal,
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      // Validation de la structure de la réponse
      if (!result || typeof result !== 'object') {
        throw new Error('Format de réponse invalide');
      }

      // Gestion des différents formats de réponse possibles
      let dataArray: T[] = [];
      let totalCount = 0;

      if (Array.isArray(result.data)) {
        dataArray = result.data;
      } else if (Array.isArray(result)) {
        dataArray = result;
      } else if (result.items && Array.isArray(result.items)) {
        dataArray = result.items;
      }

      if (result.pagination?.total !== undefined) {
        totalCount = result.pagination.total;
      } else if (result.total !== undefined) {
        totalCount = result.total;
      } else if (result.count !== undefined) {
        totalCount = result.count;
      } else {
        totalCount = dataArray.length;
      }

      if (isMounted.current) {
        setData(dataArray);
        setTotal(totalCount);
      }
      
    } catch (error: any) {
      if (error.name === 'AbortError') {
        // Requête annulée, on ignore
        return;
      }
      
      console.error(`Erreur lors du chargement des ${entityType}:`, error);
      
      if (isMounted.current) {
        setError(error.message || 'Erreur lors du chargement des données');
        setData([]);
        setTotal(0);
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, [entityType, queryParams]);

  // Effet pour le chargement initial
  useEffect(() => {
    if (!autoFetch) return;
    
    if (useDefaultData && defaultData.length > 0) {
      // Utiliser les données par défaut
      setData(defaultData);
      setTotal(defaultData.length);
      setLoading(false);
    } else {
      // Charger depuis l'API
      fetchData(true);
    }
  }, []); // Seulement au montage

  // Effet pour les changements de filtres/recherche/pagination
  useEffect(() => {
    if (!autoFetch) return;
    
    // Délai pour éviter trop de requêtes lors de la saisie
    const timeoutId = setTimeout(() => {
      fetchData();
    }, 300); // Délai de debounce

    return () => clearTimeout(timeoutId);
  }, [page, limit, searchTerm, JSON.stringify(stableFilters), autoFetch]);

  // Fonction pour forcer un refresh manuel
  const refetch = useCallback(() => {
    fetchData(true);
  }, [fetchData]);

  // Gestionnaires d'événements
  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  const handleLimitChange = useCallback((newLimit: number) => {
    setLimit(newLimit);
    setPage(1);
  }, []);

  const handleSearchChange = useCallback((newSearch: string) => {
    setSearchTerm(newSearch);
    setPage(1);
  }, []);

  const handleFilterChange = useCallback((newFilters: EntityFilters) => {
    setFilters(newFilters);
    setPage(1);
  }, []);

  const handleAdd = useCallback(() => {
    router.push(`/ad/${entityType}/create`);
  }, [router, entityType]);

  const handleEdit = useCallback((item: T) => {
    const itemWithId = item as any;
    if (itemWithId.id) {
      router.push(`/ad/${entityType}/${itemWithId.id}/edit`);
    }
  }, [router, entityType]);

  const handleView = useCallback((item: T) => {
    const itemWithId = item as any;
    if (itemWithId.id) {
      router.push(`/ad/${entityType}/${itemWithId.id}`);
    }
  }, [router, entityType]);

  const handleExport = useCallback(async () => {
    try {
      const exportParams = { ...queryParams };
      exportParams.limit = '10000';
      exportParams.with_relations = 'false';
      
      const queryString = new URLSearchParams(exportParams).toString();
      const response = await fetch(`/api/${entityType}/export?${queryString}`);
      
      if (!response.ok) {
        throw new Error('Erreur lors de l\'export');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${entityType}-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Erreur lors de l\'export:', error);
      alert('Erreur lors de l\'export');
    }
  }, [entityType, queryParams]);

  const resetFilters = useCallback(() => {
    setSearchTerm('');
    setFilters(defaultFilters);
    setPage(1);
  }, [defaultFilters]);

  // Calcul des valeurs dérivées
  const totalPages = Math.ceil(total / limit) || 1;
  const hasData = data.length > 0;
  const isEmpty = !loading && data.length === 0;
  const canGoPrev = page > 1;
  const canGoNext = page < totalPages;

  return {
    // Données
    data,
    total,
    loading,
    error,
    
    // États
    page,
    limit,
    searchTerm,
    filters,
    viewMode,
    
    // Setters
    setPage: handlePageChange,
    setLimit: handleLimitChange,
    setSearchTerm: handleSearchChange,
    setFilters: handleFilterChange,
    setViewMode,
    
    // Actions
    onAdd: handleAdd,
    onEdit: handleEdit,
    onView: handleView,
    onExport: handleExport,
    onRefresh: refetch,
    onResetFilters: resetFilters,
    
    // Utilitaires
    refetch,
    totalPages,
    hasData,
    isEmpty,
    canGoPrev,
    canGoNext,
    
    // Navigation
    goToPrevPage: () => canGoPrev && handlePageChange(page - 1),
    goToNextPage: () => canGoNext && handlePageChange(page + 1),
    goToFirstPage: () => handlePageChange(1),
    goToLastPage: () => handlePageChange(totalPages),
  };
}