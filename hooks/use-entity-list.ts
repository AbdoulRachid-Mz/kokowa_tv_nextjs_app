// hooks/use-entity-list.ts
import { useState, useEffect, useCallback, useMemo } from 'react';
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
  useDefaultData?: boolean; // Option pour désactiver l'utilisation de defaultData
}

export function useEntityList<T>({
  entityType,
  defaultFilters = {},
  defaultLimit = 20,
  withRelations = true,
  defaultData = [],
  useDefaultData = true,
}: UseEntityListProps<T>) {
  const router = useRouter();
  
  // États
  const [data, setData] = useState<T[]>(useDefaultData ? defaultData : []);
  const [total, setTotal] = useState(useDefaultData ? defaultData.length : 0);
  const [loading, setLoading] = useState(!useDefaultData || defaultData.length === 0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(defaultLimit);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<EntityFilters>(defaultFilters);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Mémorisation pour éviter les recalculs inutiles
  const queryParams = useMemo(() => {
    return buildQueryParams();
  }, [entityType, page, limit, searchTerm, filters, withRelations]);

  // Construction des paramètres de requête selon le type d'entité
  const buildQueryParams = useCallback(() => {
    const params: Record<string, string> = {
      page: page.toString(),
      limit: limit.toString(),
    };

    // Paramètres communs
    if (searchTerm) {
      params.search = searchTerm;
    }

    // Paramètres spécifiques selon le type d'entité
    switch (entityType) {
      case 'users':
        const userFilters = filters as UserFilters;
        if (userFilters.role) params.role = userFilters.role;
        if (userFilters.is_active !== undefined) params.is_active = userFilters.is_active.toString();
        if (userFilters.is_verified !== undefined) params.is_verified = userFilters.is_verified.toString();
        if (userFilters.country) params.country = userFilters.country;
        if (userFilters.date_from) params.date_from = userFilters.date_from;
        if (userFilters.date_to) params.date_to = userFilters.date_to;
        if (userFilters.with_profile) params.with_profile = 'true';
        if (userFilters.with_permissions) params.with_permissions = 'true';
        if (userFilters.with_interactions) params.with_interactions = 'false';
        if (userFilters.with_messages) params.with_messages = 'false';
        break;
      
      case 'fighters':
        const fighterFilters = filters as FighterFilters;
        if (fighterFilters.region_id) params.region_id = fighterFilters.region_id.toString();
        if (fighterFilters.is_active !== undefined) params.is_active = fighterFilters.is_active.toString();
        if (fighterFilters.is_champion !== undefined) params.is_champion = fighterFilters.is_champion.toString();
        if (fighterFilters.min_ranking) params.min_ranking = fighterFilters.min_ranking.toString();
        if (fighterFilters.max_ranking) params.max_ranking = fighterFilters.max_ranking.toString();
        if (fighterFilters.with_region) params.with_region = 'true';
        if (fighterFilters.with_achievements) params.with_achievements = 'true';
        if (fighterFilters.with_transfers) params.with_transfers = 'true';
        break;
      
      case 'archives':
        const archiveFilters = filters as ArchiveFighterAchievementFilters;
        if (archiveFilters.fighter_id) params.fighter_id = archiveFilters.fighter_id.toString();
        if (archiveFilters.region_id) params.region_id = archiveFilters.region_id.toString();
        if (archiveFilters.edition_id) params.edition_id = archiveFilters.edition_id.toString();
        if (archiveFilters.year) params.year = archiveFilters.year.toString();
        if (archiveFilters.position) params.position = archiveFilters.position;
        if (archiveFilters.archive_reason) params.archive_reason = archiveFilters.archive_reason;
        if (archiveFilters.date_from) params.date_from = archiveFilters.date_from;
        if (archiveFilters.date_to) params.date_to = archiveFilters.date_to;
        if (archiveFilters.with_fighter) params.with_fighter = 'true';
        if (archiveFilters.with_region) params.with_region = 'true';
        if (archiveFilters.with_edition) params.with_edition = 'true';
        break;

      case 'transfers':
        const transferFilters = filters as FighterTransferFilters;
        if (transferFilters.fighter_id) params.fighter_id = transferFilters.fighter_id.toString();
        if (transferFilters.from_region_id) params.from_region_id = transferFilters.from_region_id.toString();
        if (transferFilters.to_region_id) params.to_region_id = transferFilters.to_region_id.toString();
        if (transferFilters.status) params.status = transferFilters.status;
        if (transferFilters.date_from) params.date_from = transferFilters.date_from;
        if (transferFilters.date_to) params.date_to = transferFilters.date_to;
        if (transferFilters.with_fighter) params.with_fighter = 'true';
        if (transferFilters.with_regions) params.with_regions = 'true';
        if (transferFilters.with_approver) params.with_approver = 'true';
        break;

      case 'regions':
        const regionFilters = filters as RegionFilters;
        if (regionFilters.code) params.code = regionFilters.code;
        if (regionFilters.with_fighters) params.with_fighters = 'true';
        if (regionFilters.with_competitions) params.with_competitions = 'true';
        if (regionFilters.with_coach) params.with_coach = 'true';
        if (regionFilters.fighter_count_min) params.fighter_count_min = regionFilters.fighter_count_min.toString();
        if (regionFilters.fighter_count_max) params.fighter_count_max = regionFilters.fighter_count_max.toString();
        break;

      case 'coaches':
        const coachFilters = filters as CoachFilters;
        if (coachFilters.region_id) params.region_id = coachFilters.region_id.toString();
        if (coachFilters.with_region) params.with_region = 'true';
        break;

      case 'competitions':
        const competitionFilters = filters as CompetitionFilters;
        if (competitionFilters.status) params.status = competitionFilters.status;
        if (competitionFilters.region_id) params.region_id = competitionFilters.region_id.toString();
        if (competitionFilters.with_region) params.with_region = 'true';
        if (competitionFilters.with_editions) params.with_editions = 'true';
        if (competitionFilters.is_active !== undefined) params.is_active = competitionFilters.is_active.toString();
        if (competitionFilters.edition_year) params.edition_year = competitionFilters.edition_year.toString();
        if (competitionFilters.date_from) params.date_from = competitionFilters.date_from;
        if (competitionFilters.date_to) params.date_to = competitionFilters.date_to;
        if (competitionFilters.with_phases) params.with_phases = 'true';
        if (competitionFilters.with_matches) params.with_matches = 'true';
        break;

      case 'editions':
        const editionFilters = filters as EditionFilters;
        if (editionFilters.competition_id) params.competition_id = editionFilters.competition_id.toString();
        if (editionFilters.year) params.year = editionFilters.year.toString();
        if (editionFilters.with_competition) params.with_competition = 'true';
        if (editionFilters.with_fighters) params.with_fighters = 'true';
        if (editionFilters.with_phases) params.with_phases = 'true';
        if (editionFilters.with_groups) params.with_groups = 'true';
        if (editionFilters.with_subGroups) params.with_subGroups = 'true';
        if (editionFilters.with_matches) params.with_matches = 'true';
        if (editionFilters.is_active !== undefined) params.is_active = editionFilters.is_active.toString();
        break;

      case 'phases':
        const phaseFilters = filters as PhaseFilters;
        if (phaseFilters.edition_id) params.edition_id = phaseFilters.edition_id.toString();
        if (phaseFilters.search) params.search = phaseFilters.search;
        if (phaseFilters.phase_type) params.phase_type = phaseFilters.phase_type;
        if (phaseFilters.page) params.page = phaseFilters.page.toString();
        if (phaseFilters.limit) params.limit = phaseFilters.limit.toString();
        if (phaseFilters.is_completed !== undefined) params.is_completed = phaseFilters.is_completed.toString();
        if (phaseFilters.with_edition) params.with_edition = 'true';
        if (phaseFilters.with_groups) params.with_groups = 'true';
        if (phaseFilters.is_active !== undefined) params.is_active = phaseFilters.is_active.toString();
        break;

      case 'phase-groups':
        const phaseGroupFilters = filters as PhaseGroupFilters;
        if (phaseGroupFilters.phase_id) params.phase_id = phaseGroupFilters.phase_id.toString();
        if (phaseGroupFilters.with_phase) params.with_phase = 'true';
        if (phaseGroupFilters.is_active !== undefined) params.is_active = phaseGroupFilters.is_active.toString();
        break;

      case 'sub-groups':
        const subGroupFilters = filters as SubGroupFilters;
        if (subGroupFilters.group_id) params.group_id = subGroupFilters.group_id.toString();
        if (subGroupFilters.region1_id) params.region1_id = subGroupFilters.region1_id.toString();
        if (subGroupFilters.region2_id) params.region2_id = subGroupFilters.region2_id.toString();
        if (subGroupFilters.belt_region1) params.belt_region1 = subGroupFilters.belt_region1.toString();
        if (subGroupFilters.belt_region2) params.belt_region2 = subGroupFilters.belt_region2.toString();
        if (subGroupFilters.main_referee_id) params.main_referee_id = subGroupFilters.main_referee_id.toString();
        if (subGroupFilters.is_completed !== undefined) params.is_completed = subGroupFilters.is_completed.toString();
        if (subGroupFilters.is_active !== undefined) params.is_active = subGroupFilters.is_active.toString();
        if (subGroupFilters.with_group) params.with_group = 'true';
        if (subGroupFilters.with_matches) params.with_matches = 'true';
        if (subGroupFilters.with_regions) params.with_regions = 'true';
        if (subGroupFilters.with_belts) params.with_belts = 'true';
        if (subGroupFilters.with_referee) params.with_referee = 'true';
        break;

      case 'matches':
        const matchFilters = filters as MatchFilters;
        if (matchFilters.sub_group_id) params.sub_group_id = matchFilters.sub_group_id.toString();
        if (matchFilters.edition_id) params.edition_id = matchFilters.edition_id.toString();
        if (matchFilters.phase_id) params.phase_id = matchFilters.phase_id.toString();
        if (matchFilters.group_id) params.group_id = matchFilters.group_id.toString();
        if (matchFilters.status) params.status = matchFilters.status;
        if (matchFilters.date_from) params.date_from = matchFilters.date_from;
        if (matchFilters.date_to) params.date_to = matchFilters.date_to;
        if (matchFilters.with_sub_group) params.with_sub_group = 'true';
        if (matchFilters.with_fighters) params.with_fighters = 'true';
        break;
        
      case "interactions":
        const interactionFilters = filters as InteractionFilters;
        if (interactionFilters.user_id) params.user_id = interactionFilters.user_id.toString();
        if (interactionFilters.entity_type) params.entity_type = interactionFilters.entity_type;
        if (interactionFilters.entity_id) params.entity_id = interactionFilters.entity_id.toString();
        if (interactionFilters.interaction_type) params.interaction_type = interactionFilters.interaction_type;
        if (interactionFilters.with_user) params.with_user = 'true';
        break;

      case 'referees':
        const refereeFilters = filters as RefereeFilters;
        if (refereeFilters.region_id) params.region_id = refereeFilters.region_id.toString();
        if (refereeFilters.is_active !== undefined) params.is_active = refereeFilters.is_active.toString();
        if (refereeFilters.certification_level) params.certification_level = refereeFilters.certification_level;
        if (refereeFilters.experience_min) params.experience_min = refereeFilters.experience_min.toString();
        if (refereeFilters.with_region) params.with_region = 'true';
        break;

      case 'articles':
        const articleFilters = filters as ArticleFilters;
        if (articleFilters.status) params.status = articleFilters.status;
        if (articleFilters.language) params.language = articleFilters.language;
        if (articleFilters.author_id) params.author_id = articleFilters.author_id.toString();
        if (articleFilters.with_author) params.with_author = 'true';
        break;

      case 'media':
        const mediaFilters = filters as MediaFilters;
        if (mediaFilters.file_type) params.file_type = mediaFilters.file_type;
        if (mediaFilters.entity_type) params.entity_type = mediaFilters.entity_type;
        if (mediaFilters.entity_id) params.entity_id = mediaFilters.entity_id.toString();
        if (mediaFilters.with_uploader) params.with_uploader = 'true';
        break;

      case 'videos':
        const videoFilters = filters as VideoFilters;
        if (videoFilters.type) params.type = videoFilters.type;
        if (videoFilters.category) params.category = videoFilters.category;
        if (videoFilters.is_live !== undefined) params.is_live = videoFilters.is_live.toString();
        if (videoFilters.is_featured !== undefined) params.is_featured = videoFilters.is_featured.toString();
        break;

      case 'messages':
        const messageFilters = filters as MessageFilters;
        if (messageFilters.message_type) params.message_type = messageFilters.message_type;
        if (messageFilters.entity_type) params.entity_type = messageFilters.entity_type;
        if (messageFilters.entity_id) params.entity_id = messageFilters.entity_id.toString();
        if (messageFilters.author_id) params.author_id = messageFilters.author_id.toString();
        if (messageFilters.is_active !== undefined) params.is_active = messageFilters.is_active.toString();
        if (messageFilters.with_author) params.with_author = 'true';
        if (messageFilters.with_recipient) params.with_recipient = 'true';
        break;

      case 'notifications':
        const notificationFilters = filters as NotificationFilters;
        if (notificationFilters.notification_type) params.notification_type = notificationFilters.notification_type;
        if (notificationFilters.is_read !== undefined) params.is_read = notificationFilters.is_read.toString();
        if (notificationFilters.with_user) params.with_user = 'true';
        break;
    }

    // Relations par défaut
    if (withRelations) {
      params.with_relations = 'true';
    }

    // Tri et ordre
    if (filters.sortBy) {
      params.sortBy = filters.sortBy;
    }
    if (filters.sortOrder) {
      params.sortOrder = filters.sortOrder;
    }

    return params;
  }, [entityType, page, limit, searchTerm, filters, withRelations]);

  // Filtrer les données locales si defaultData est fourni
  const filterLocalData = useCallback(() => {
    if (!useDefaultData || defaultData.length === 0) return [];

    let filtered = [...defaultData];

    // Filtre par recherche
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(item => {
        // Recherche générique dans toutes les propriétés string de l'objet
        return Object.values(item as Record<string, any>).some(value => {
          if (typeof value === 'string') {
            return value.toLowerCase().includes(term);
          }
          return false;
        });
      });
    }

    // Filtres spécifiques par type d'entité
    switch (entityType) {
      case 'fighters':
        const fighterFilters = filters as FighterFilters;
        if (fighterFilters.region_id) {
          filtered = filtered.filter(item => 
            (item as any).region_id === fighterFilters.region_id
          );
        }
        if (fighterFilters.is_active !== undefined) {
          filtered = filtered.filter(item => 
            (item as any).is_active === fighterFilters.is_active
          );
        }
        break;
      
      case 'regions':
        const regionFilters = filters as RegionFilters;
        if (regionFilters.code) {
          filtered = filtered.filter(item => 
            (item as any).code?.toLowerCase().includes(regionFilters.code?.toLowerCase() || '')
          );
        }
        break;
      
      case 'competitions':
        const competitionFilters = filters as CompetitionFilters;
        if (competitionFilters.status) {
          filtered = filtered.filter(item => 
            (item as any).status === competitionFilters.status
          );
        }
        break;
      
      // Ajouter d'autres cas au besoin
    }

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedData = filtered.slice(startIndex, endIndex);

    return paginatedData;
  }, [useDefaultData, defaultData, searchTerm, filters, page, limit, entityType]);

  // Chargement des données depuis l'API
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const queryString = new URLSearchParams(queryParams).toString();
      const response = await fetch(`/api/${entityType}?${queryString}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: PaginatedResponse<T> = await response.json();

      setData(result.data || []);
      setTotal(result.pagination?.total || 0);
      
    } catch (error) {
      console.error(`Erreur lors du chargement des ${entityType}:`, error);
      setData([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [entityType, queryParams]);

  // Déterminer si on doit utiliser les données locales ou fetch l'API
  const shouldUseLocalData = useMemo(() => {
    return useDefaultData && defaultData.length > 0 && !searchTerm && 
           Object.keys(filters).length === Object.keys(defaultFilters).length &&
           page === 1;
  }, [useDefaultData, defaultData, searchTerm, filters, defaultFilters, page]);

  // Effet pour gérer le chargement des données
  useEffect(() => {
    if (shouldUseLocalData) {
      // Utiliser les données locales
      const filteredData = filterLocalData();
      setData(filteredData);
      setTotal(filteredData.length);
      setLoading(false);
    } else if (useDefaultData && defaultData.length > 0) {
      // Si on a des filtres ou recherche, filtrer localement d'abord
      const filteredData = filterLocalData();
      setData(filteredData);
      setTotal(filteredData.length);
      
      // Si besoin, fetch aussi depuis l'API pour avoir les données complètes
      if (searchTerm || Object.keys(filters).length > Object.keys(defaultFilters).length) {
        fetchData();
      } else {
        setLoading(false);
      }
    } else {
      // Pas de defaultData, fetch depuis l'API
      fetchData();
    }
  }, [shouldUseLocalData, useDefaultData, defaultData, filterLocalData, fetchData, searchTerm, filters, defaultFilters]);

  // Gestionnaires d'événements
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setPage(1);
  };

  const handleSearchChange = (newSearch: string) => {
    setSearchTerm(newSearch);
    setPage(1);
  };

  const handleFilterChange = (newFilters: EntityFilters) => {
    setFilters(newFilters);
    setPage(1);
  };

  const handleAdd = () => {
    router.push(`/ad/${entityType}/create`);
  };

  const handleEdit = (item: T) => {
    const itemWithId = item as any;
    if (itemWithId.id) {
      router.push(`/ad/${entityType}/${itemWithId.id}/edit`);
    }
  };

  const handleView = (item: T) => {
    const itemWithId = item as any;
    if (itemWithId.id) {
      router.push(`/ad/${entityType}/${itemWithId.id}`);
    }
  };

  const handleExport = async () => {
    try {
      const exportParams = { ...queryParams };
      exportParams.limit = '10000'; // Exporter tout
      exportParams.with_relations = 'false'; // Simplifier l'export
      
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
      // Fallback: exporter les données actuelles
      exportCurrentData();
    }
  };

  // Fallback pour l'export
  const exportCurrentData = () => {
    if (data.length === 0) return;
    
    const headers = Object.keys(data[0] || {}).join(',');
    const rows = data.map(item => 
      Object.values(item as Record<string, unknown>).map(value => 
        typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value
      ).join(',')
    ).join('\n');
    
    const csv = `${headers}\n${rows}`;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${entityType}-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  // Réinitialiser les filtres
  const resetFilters = () => {
    setSearchTerm('');
    setFilters(defaultFilters);
    setPage(1);
  };

  // Fonction pour forcer un refresh depuis l'API
  const forceRefresh = () => {
    fetchData();
  };

  return {
    // Données
    data,
    total,
    loading,
    
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
    onRefresh: forceRefresh,
    onResetFilters: resetFilters,
    
    // Utilitaires
    refetch: forceRefresh,
    totalPages: Math.ceil(total / limit) || 1,
    hasData: data.length > 0,
    isEmpty: !loading && data.length === 0,
    isUsingLocalData: shouldUseLocalData,
  };
}