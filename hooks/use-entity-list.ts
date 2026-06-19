'use client';

import { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getEntities } from '@/actions/entities';
import { EntityType, toPluralEntityType } from '@/lib/entity-utils';

export interface UseEntityListProps<T> {
  entityType: EntityType;
  defaultFilters?: any;
  defaultLimit?: number;
  withRelations?: boolean | string[];
  defaultData?: T[];
  useDefaultData?: boolean;
  autoFetch?: boolean;
  apiPath?: string;
}

export function useEntityList<T = any>({
  entityType,
  defaultFilters = {},
  defaultLimit = 20,
  withRelations = true,
  defaultData = [],
  useDefaultData = false,
  autoFetch = true,
  apiPath,
}: UseEntityListProps<T>) {
  const router = useRouter();
  const queryClient = useQueryClient();

  // États
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(defaultLimit);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<any>(defaultFilters);
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'compact'>('grid');

  // Memoiser les filtres pour éviter les re-renders inutiles
  const stableFilters = useMemo(() => filters, [JSON.stringify(filters)]);

  // Query key for TanStack Query
  const queryKey = useMemo(() => [
    'entities',
    entityType,
    page,
    limit,
    searchTerm,
    stableFilters,
    withRelations
  ], [entityType, page, limit, searchTerm, stableFilters, withRelations]);

  // Utiliser TanStack Query avec notre server action
  const { data, isLoading: loading, error, refetch } = useQuery({
    queryKey,
    queryFn: async () => {
      if (useDefaultData && defaultData.length > 0 && page === 1) {
        return {
          data: defaultData,
          pagination: {
            page: 1,
            limit: defaultData.length,
            total: defaultData.length,
            totalPages: 1,
          },
        };
      }
      return await getEntities<T>(entityType, {
        page,
        limit,
        search: searchTerm,
        filters: stableFilters,
        withRelations,
      });
    },
    enabled: autoFetch,
    initialData: useDefaultData && defaultData.length > 0 ? {
      data: defaultData,
      pagination: {
        page: 1,
        limit: defaultData.length,
        total: defaultData.length,
        totalPages: 1,
      },
    } : undefined,
    staleTime: 60 * 1000, // 1 minute
  });

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

  const handleFilterChange = useCallback((newFilters: any) => {
    setFilters(newFilters);
    setPage(1);
  }, []);

  const handleAdd = useCallback(() => {
    const pluralType = toPluralEntityType(entityType);
    router.push(`/ad/${pluralType}/create`);
  }, [router, entityType]);

  const handleEdit = useCallback((item: T) => {
    const itemWithId = item as any;
    const pluralType = toPluralEntityType(entityType);
    if (itemWithId.id) {
      router.push(`/ad/${pluralType}/${itemWithId.id}/edit`);
    }
  }, [router, entityType]);

  const handleView = useCallback((item: T) => {
    const itemWithId = item as any;
    const pluralType = toPluralEntityType(entityType);
    if (itemWithId.id) {
      router.push(`/ad/${pluralType}/${itemWithId.id}`);
    }
  }, [router, entityType]);

  const handleExport = useCallback(async () => {
    try {
      const exportParams = {
        ...stableFilters,
        search: searchTerm,
        limit: '10000',
        with_relations: 'false',
      };
      
      const queryString = new URLSearchParams(exportParams as any).toString();
      const pluralType = toPluralEntityType(entityType);
      const response = await fetch(`/api/${pluralType}/export?${queryString}`);
      
      if (!response.ok) {
        throw new Error('Erreur lors de l\'export');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${pluralType}-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Erreur lors de l\'export:', error);
      alert('Erreur lors de l\'export');
    }
  }, [entityType, searchTerm, stableFilters]);

  const resetFilters = useCallback(() => {
    setSearchTerm('');
    setFilters(defaultFilters);
    setPage(1);
  }, [defaultFilters]);

  const invalidateQuery = useCallback(() => {
    queryClient.invalidateQueries({ queryKey });
  }, [queryClient, queryKey]);

  // Valeurs dérivées
  const currentData = data?.data || [];
  const total = data?.pagination?.total || 0;
  const totalPages = data?.pagination?.totalPages || 1;
  const hasData = currentData.length > 0;
  const isEmpty = !loading && currentData.length === 0;
  const canGoPrev = page > 1;
  const canGoNext = page < totalPages;

  return {
    // Données
    data: currentData,
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
    onRefresh: invalidateQuery,
    onResetFilters: resetFilters,

    // Utilitaires
    refetch: invalidateQuery,
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
