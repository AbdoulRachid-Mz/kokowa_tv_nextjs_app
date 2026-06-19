// hooks/use-entities.ts
import { 
  useQuery, 
  useQueryClient, 
  UseQueryOptions,
  keepPreviousData 
} from '@tanstack/react-query';
import { useState, useCallback, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getEntities, EntityQueryOptions } from '@/actions/entities';
import { PaginatedResponse, BaseFilters } from '@/types';
import { useDebounce } from './use-debounce';
import { EntityType } from '@/lib/entity-utils';

// Types pour les options du hook
export interface UseEntitiesOptions<TFilters = BaseFilters> {
  entityType: EntityType;
  initialFilters?: TFilters;
  initialPage?: number;
  initialLimit?: number;
  initialSearch?: string;
  initialSortBy?: string;
  initialSortOrder?: 'asc' | 'desc';
  withRelations?: boolean | string[];
  enabled?: boolean;
  staleTime?: number;
  gcTime?: number; // Renommé de cacheTime à gcTime (garbage collection time)
  placeholderData?: boolean; // Pour keepPreviousData
  onSuccess?: (data: PaginatedResponse<any>) => void;
  onError?: (error: Error) => void;
}

// Type de retour du hook
export interface UseEntitiesReturn<T, TFilters = BaseFilters> {
  // Données
  data: T[];
  total: number;
  totalPages: number;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  error: Error | null;
  
  // Pagination
  page: number;
  limit: number;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  goToPage: (page: number) => void;
  
  // Recherche
  searchTerm: string;
  setSearchTerm: (search: string) => void;
  debouncedSearchTerm: string;
  
  // Filtres
  filters: TFilters;
  setFilters: (filters: TFilters | ((prev: TFilters) => TFilters)) => void;
  updateFilter: <K extends keyof TFilters>(key: K, value: TFilters[K]) => void;
  resetFilters: () => void;
  
  // Tri
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  setSorting: (sortBy: string, sortOrder?: 'asc' | 'desc') => void;
  
  // Actions
  refetch: () => Promise<any>;
  onAdd?: () => void;
  onEdit?: (item: T) => void;
  onView?: (item: T) => void;
  onDelete?: (item: T) => Promise<void>;
  onExport?: () => void;
  
  // État
  selectedItems: number[];
  toggleSelectItem: (id: number) => void;
  selectAll: () => void;
  deselectAll: () => void;
  isSelected: (id: number) => boolean;
  
  // Utilitaires
  isEmpty: boolean;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  from: number;
  to: number;
}

export function useEntities<T = any, TFilters = BaseFilters>({
  entityType,
  initialFilters = {} as TFilters,
  initialPage = 1,
  initialLimit = 20,
  initialSearch = '',
  initialSortBy = 'created_at',
  initialSortOrder = 'desc',
  withRelations = true,
  enabled = true,
  staleTime = 5 * 60 * 1000, // 5 minutes
  gcTime = 10 * 60 * 1000, // 10 minutes - renamed from cacheTime
  placeholderData = true,
  onSuccess,
  onError,
}: UseEntitiesOptions<TFilters>): UseEntitiesReturn<T, TFilters> {
  const router = useRouter();
  const queryClient = useQueryClient();
  
  // États
  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [filters, setFilters] = useState<TFilters>(initialFilters);
  const [sortBy, setSortBy] = useState(initialSortBy);
  const [sortOrder, setSortOrder] = useState(initialSortOrder);
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  
  // Debounce pour la recherche
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  
  // Réinitialiser la page quand les filtres changent
  useEffect(() => {
    setPage(1);
  }, [debouncedSearchTerm, JSON.stringify(filters), sortBy, sortOrder]);
  
  // Construire les options de requête
  const queryOptions = useMemo<EntityQueryOptions>(() => {
    return {
      page,
      limit,
      search: debouncedSearchTerm,
      filters: filters as BaseFilters | undefined,
      sortBy,
      sortOrder,
      withRelations,
    };
  }, [page, limit, debouncedSearchTerm, filters, sortBy, sortOrder, withRelations]);
  
  // Requête TanStack Query v5
  const {
    data: response,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: [entityType, queryOptions],
    queryFn: () => getEntities<T>(entityType, queryOptions),
    enabled,
    staleTime,
    gcTime, // Utiliser gcTime au lieu de cacheTime
    placeholderData: placeholderData ? keepPreviousData : undefined,
  });
  
  // Gérer les callbacks onSuccess et onError
  useEffect(() => {
    if (response && onSuccess) {
      onSuccess(response);
    }
  }, [response, onSuccess]);

  useEffect(() => {
    if (error && onError) {
      onError(error);
    }
  }, [error, onError]);

  // Précharger la page suivante quand les données sont disponibles
  useEffect(() => {
    if (response?.pagination) {
      const { page: currentPage, totalPages: maxPages } = response.pagination;
      if (currentPage < maxPages) {
        const nextPageOptions = { ...queryOptions, page: currentPage + 1 };
        queryClient.prefetchQuery({
          queryKey: [entityType, nextPageOptions],
          queryFn: () => getEntities<T>(entityType, nextPageOptions),
        });
      }
    }
  }, [response, entityType, queryOptions, queryClient]);
  
  // Données extraites avec typage correct
  const data = (response?.data ?? []) as T[];
  const total = response?.pagination?.total ?? 0;
  const totalPages = response?.pagination?.totalPages ?? 1;
  
  // Calculs pour l'affichage
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);
  
  // Gestionnaires de pagination
  const nextPage = useCallback(() => {
    if (page < totalPages) setPage(p => p + 1);
  }, [page, totalPages]);
  
  const prevPage = useCallback(() => {
    if (page > 1) setPage(p => p - 1);
  }, [page]);
  
  const goToPage = useCallback((newPage: number) => {
    setPage(Math.max(1, Math.min(newPage, totalPages)));
  }, [totalPages]);
  
  // Gestionnaire pour setLimit avec réinitialisation de la page
  const handleSetLimit = useCallback((newLimit: number) => {
    setLimit(newLimit);
    setPage(1);
  }, []);
  
  // Gestionnaires de filtres
  const updateFilter = useCallback(<K extends keyof TFilters>(key: K, value: TFilters[K]) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);
  
  const resetFilters = useCallback(() => {
    setFilters(initialFilters);
    setSearchTerm('');
    setSortBy(initialSortBy);
    setSortOrder(initialSortOrder);
  }, [initialFilters, initialSortBy, initialSortOrder]);
  
  // Gestionnaire de tri
  const setSorting = useCallback((newSortBy: string, newSortOrder?: 'asc' | 'desc') => {
    setSortBy(newSortBy);
    if (newSortOrder) {
      setSortOrder(newSortOrder);
    } else {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    }
  }, []);
  
  // Gestionnaires de sélection
  const toggleSelectItem = useCallback((id: number) => {
    setSelectedItems(prev => 
      prev.includes(id) 
        ? prev.filter(itemId => itemId !== id)
        : [...prev, id]
    );
  }, []);
  
  const selectAll = useCallback(() => {
    const ids = data
      .map(item => (item as any).id)
      .filter((id): id is number => typeof id === 'number' && id !== undefined);
    setSelectedItems(ids);
  }, [data]);
  
  const deselectAll = useCallback(() => {
    setSelectedItems([]);
  }, []);
  
  const isSelected = useCallback((id: number) => {
    return selectedItems.includes(id);
  }, [selectedItems]);
  
  // Actions par défaut
  const onAdd = useCallback(() => {
    router.push(`/ad/${entityType}/create`);
  }, [router, entityType]);
  
  const onEdit = useCallback((item: T) => {
    const id = (item as any).id;
    if (typeof id === 'number') {
      router.push(`/ad/${entityType}/${id}/edit`);
    }
  }, [router, entityType]);
  
  const onView = useCallback((item: T) => {
    const id = (item as any).id;
    if (typeof id === 'number') {
      router.push(`/ad/${entityType}/${id}`);
    }
  }, [router, entityType]);
  
  const onExport = useCallback(async () => {
    try {
      const exportResponse = await getEntities<T>(entityType, {
        ...queryOptions,
        limit: 10000, // Récupérer plus d'éléments pour l'export
      });
      
      // Convertir en CSV
      const csv = convertToCSV(exportResponse.data);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${entityType}-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export error:', error);
    }
  }, [entityType, queryOptions]);
  
  return {
    // Données
    data,
    total,
    totalPages,
    isLoading,
    isFetching,
    isError,
    error: error || null,
    
    // Pagination
    page,
    limit,
    setPage,
    setLimit: handleSetLimit,
    nextPage,
    prevPage,
    goToPage,
    
    // Recherche
    searchTerm,
    setSearchTerm,
    debouncedSearchTerm,
    
    // Filtres
    filters,
    setFilters,
    updateFilter,
    resetFilters,
    
    // Tri
    sortBy,
    sortOrder,
    setSorting,
    
    // Actions
    refetch,
    onAdd,
    onEdit,
    onView,
    onExport,
    
    // Sélection
    selectedItems,
    toggleSelectItem,
    selectAll,
    deselectAll,
    isSelected,
    
    // Utilitaires
    isEmpty: data.length === 0 && !isLoading,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
    from,
    to,
  };
}

// Helper pour convertir en CSV
function convertToCSV(data: any[]): string {
  if (data.length === 0) return '';
  
  // Obtenir toutes les clés uniques de tous les objets
  const allKeys = new Set<string>();
  data.forEach(item => {
    Object.keys(item).forEach(key => allKeys.add(key));
  });
  
  const headers = Array.from(allKeys).join(',');
  
  const rows = data.map(item => 
    Array.from(allKeys).map(key => {
      const value = item[key];
      if (value === null || value === undefined) return '""';
      if (typeof value === 'object') {
        return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
      }
      // Échapper les guillemets et les virgules
      const stringValue = String(value).replace(/"/g, '""');
      return `"${stringValue}"`;
    }).join(',')
  );
  
  return [headers, ...rows].join('\n');
}