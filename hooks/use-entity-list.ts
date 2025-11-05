// hooks/use-entity-list.ts
import { useState, useEffect, useCallback } from 'react';
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
  CityFilters,
  ArticleFilters,
  MediaFilters,
  VideoFilters,
  MessageFilters,
  PhaseGroupFilters,
  SubGroupFilters,
  NotificationFilters
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
  | CityFilters
  | ArticleFilters
  | MediaFilters
  | VideoFilters
  | MessageFilters
  | PhaseGroupFilters
  | SubGroupFilters
  | Record<string, any>;

export interface UseEntityListProps<T> {
  entityType: 
    | 'fighters' 
    | 'regions' 
    | 'competitions' 
    | 'editions' 
    | 'matches' 
    | 'referees' 
    | 'phases'
    | 'cities'
    | 'articles'
    | 'media'
    | 'videos'
    | 'messages'
    | 'phase-groups'
    | 'sub-groups'
    | 'notifications';
  defaultFilters?: EntityFilters;
  defaultLimit?: number;
  withRelations?: boolean;
}

export function useEntityList<T>({
  entityType,
  defaultFilters = {},
  defaultLimit = 20,
  withRelations = true,
}: UseEntityListProps<T>) {
  const router = useRouter();
  
  // États
  const [data, setData] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(defaultLimit);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<EntityFilters>(defaultFilters);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

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
      case 'fighters':
        const fighterFilters = filters as FighterFilters;
        if (fighterFilters.region_id) params.region_id = fighterFilters.region_id.toString();
        if (fighterFilters.city_id) params.city_id = fighterFilters.city_id.toString();
        if (fighterFilters.is_active !== undefined) params.is_active = fighterFilters.is_active.toString();
        if (fighterFilters.is_champion !== undefined) params.is_champion = fighterFilters.is_champion.toString();
        if (fighterFilters.min_ranking) params.min_ranking = fighterFilters.min_ranking.toString();
        if (fighterFilters.max_ranking) params.max_ranking = fighterFilters.max_ranking.toString();
        if (fighterFilters.with_region) params.with_region = 'true';
        if (fighterFilters.with_city) params.with_city = 'true';
        if (fighterFilters.with_achievements) params.with_achievements = 'true';
        if (fighterFilters.with_transfers) params.with_transfers = 'true';
        break;

      case 'regions':
        const regionFilters = filters as RegionFilters;
        if (regionFilters.code) params.code = regionFilters.code;
        if (regionFilters.with_fighters) params.with_fighters = 'true';
        if (regionFilters.with_cities) params.with_cities = 'true';
        if (regionFilters.with_competitions) params.with_competitions = 'true';
        if (regionFilters.fighter_count_min) params.fighter_count_min = regionFilters.fighter_count_min.toString();
        if (regionFilters.fighter_count_max) params.fighter_count_max = regionFilters.fighter_count_max.toString();
        break;

      case 'cities':
        const cityFilters = filters as CityFilters;
        if (cityFilters.region_id) params.region_id = cityFilters.region_id.toString();
        if (cityFilters.with_region) params.with_region = 'true';
        break;

      case 'competitions':
        const competitionFilters = filters as CompetitionFilters;
        if (competitionFilters.type) params.type = competitionFilters.type;
        if (competitionFilters.status) params.status = competitionFilters.status;
        if (competitionFilters.region_id) params.region_id = competitionFilters.region_id.toString();
        if (competitionFilters.with_region) params.with_region = 'true';
        if (competitionFilters.with_editions) params.with_editions = 'true';
        if (competitionFilters.with_phases) params.with_phases = 'true';
        if (competitionFilters.with_matches) params.with_matches = 'true';
        break;

      case 'editions':
        const editionFilters = filters as EditionFilters;
        if (editionFilters.competition_id) params.competition_id = editionFilters.competition_id.toString();
        if (editionFilters.year) params.year = editionFilters.year.toString();
        if (editionFilters.with_competition) params.with_competition = 'true';
        if (editionFilters.with_fighters) params.with_fighters = 'true';
        if (editionFilters.with_regions) params.with_regions = 'true';
        if (editionFilters.with_phases) params.with_phases = 'true';
        break;

      case 'phases':
        const phaseFilters = filters as PhaseFilters;
        if (phaseFilters.edition_id) params.edition_id = phaseFilters.edition_id.toString();
        if (phaseFilters.phase_type) params.phase_type = phaseFilters.phase_type;
        if (phaseFilters.is_completed !== undefined) params.is_completed = phaseFilters.is_completed.toString();
        if (phaseFilters.with_edition) params.with_edition = 'true';
        if (phaseFilters.with_groups) params.with_groups = 'true';
        break;

      case 'phase-groups':
        const phaseGroupFilters = filters as PhaseGroupFilters;
        if (phaseGroupFilters.phase_id) params.phase_id = phaseGroupFilters.phase_id.toString();
        if (phaseGroupFilters.with_phase) params.with_phase = 'true';
        if (phaseGroupFilters.with_sub_groups) params.with_sub_groups = 'true';
        break;

      case 'sub-groups':
        const subGroupFilters = filters as SubGroupFilters;
        if (subGroupFilters.group_id) params.group_id = subGroupFilters.group_id.toString();
        if (subGroupFilters.with_group) params.with_group = 'true';
        if (subGroupFilters.with_matches) params.with_matches = 'true';
        if (subGroupFilters.with_belt_fighters) params.with_belt_fighters = 'true';
        if (subGroupFilters.with_belt_regions) params.with_belt_regions = 'true';
        break;

      case 'matches':
        const matchFilters = filters as MatchFilters;
        if (matchFilters.edition_id) params.edition_id = matchFilters.edition_id.toString();
        if (matchFilters.phase_id) params.phase_id = matchFilters.phase_id.toString();
        if (matchFilters.group_id) params.group_id = matchFilters.group_id.toString();
        if (matchFilters.sub_group_id) params.sub_group_id = matchFilters.sub_group_id.toString();
        if (matchFilters.status) params.status = matchFilters.status;
        if (matchFilters.date_from) params.date_from = matchFilters.date_from;
        if (matchFilters.date_to) params.date_to = matchFilters.date_to;
        if (matchFilters.with_fighters) params.with_fighters = 'true';
        if (matchFilters.with_regions) params.with_regions = 'true';
        if (matchFilters.with_referees) params.with_referees = 'true';
        break;

      case 'referees':
        const refereeFilters = filters as RefereeFilters;
        if (refereeFilters.region_id) params.region_id = refereeFilters.region_id.toString();
        if (refereeFilters.is_active !== undefined) params.is_active = refereeFilters.is_active.toString();
        if (refereeFilters.certification_level) params.certification_level = refereeFilters.certification_level;
        if (refereeFilters.experience_min) params.experience_min = refereeFilters.experience_min.toString();
        if (refereeFilters.with_region) params.with_region = 'true';
        if (refereeFilters.with_assignments) params.with_assignments = 'true';
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
        if (notificationFilters.user_id) params.user_id = notificationFilters.user_id.toString();
        if (notificationFilters.type) params.type = notificationFilters.type;
        if (notificationFilters.is_read !== undefined) params.is_read = notificationFilters.is_read.toString();
        if (notificationFilters.priority) params.priority = notificationFilters.priority;
        if (notificationFilters.with_user) params.with_user = 'true';
        break;
    }

    // Relations par défaut
    if (withRelations) {
      params.with_relations = 'true';
    }

    return params;
  }, [entityType, page, limit, searchTerm, filters, withRelations]);

  // Chargement des données
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams(buildQueryParams());
      const response = await fetch(`/api/${entityType}?${queryParams}`);
      
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
  }, [entityType, buildQueryParams]);

  // Effet pour charger les données
  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
    router.push(`/admin/${entityType}/new`);
  };

  const handleEdit = (item: T) => {
    const itemWithId = item as any;
    if (itemWithId.id) {
      router.push(`/admin/${entityType}/${itemWithId.id}/edit`);
    }
  };

  const handleView = (item: T) => {
    const itemWithId = item as any;
    if (itemWithId.id) {
      router.push(`/admin/${entityType}/${itemWithId.id}`);
    }
  };

  const handleExport = async () => {
    try {
      const exportParams = buildQueryParams();
      exportParams.limit = '10000'; // Exporter tout
      exportParams.with_relations = 'false'; // Simplifier l'export
      
      const queryParams = new URLSearchParams(exportParams);
      const response = await fetch(`/api/${entityType}/export?${queryParams}`);
      
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
    onRefresh: fetchData,
    onResetFilters: resetFilters,
    
    // Utilitaires
    refetch: fetchData,
    totalPages: Math.ceil(total / limit),
    hasData: data.length > 0,
    isEmpty: !loading && data.length === 0,
  };
}