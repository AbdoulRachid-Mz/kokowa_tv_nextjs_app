import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FighterFilters, RegionFilters } from '@/types';

// Helper to fetch paginated data
async function fetchApi(url: string) {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error('Erreur réseau');
  }
  return res.json();
}

export function buildUrl(base: string, params: Record<string, any>) {
  const url = new URL(base, typeof window !== 'undefined' ? window.location.origin : 'http://localhost');
  Object.keys(params).forEach(key => {
    if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
      url.searchParams.append(key, String(params[key]));
    }
  });
  return url.toString();
}

// 1. Available Fighters (Infinite)
export function useAvailableFightersInfinite(editionId: number, filters: FighterFilters = {}) {
  return useInfiniteQuery({
    queryKey: ['available-fighters', editionId, filters],
    queryFn: ({ pageParam = 1 }) => {
      const url = buildUrl('/api/fighters', {
        ...filters,
        not_in_edition: editionId,
        page: pageParam,
        limit: filters.limit || 20,
      });
      return fetchApi(url);
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.pagination?.page < lastPage.pagination?.totalPages) {
        return lastPage.pagination.page + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
  });
}

// 2. Edition Fighters (Infinite)
export function useEditionFightersInfinite(editionId: number, filters: any = {}) {
  return useInfiniteQuery({
    queryKey: ['edition-fighters', editionId, filters],
    queryFn: ({ pageParam = 1 }) => {
      const url = buildUrl(`/api/editions/${editionId}/fighters/list`, {
        ...filters,
        page: pageParam,
        limit: filters.limit || 20,
      });
      return fetchApi(url);
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.pagination?.page < lastPage.pagination?.totalPages) {
        return lastPage.pagination.page + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
  });
}

// 3. Available Regions (Infinite)
export function useAvailableRegionsInfinite(editionId: number, filters: RegionFilters = {}) {
  return useInfiniteQuery({
    queryKey: ['available-regions', editionId, filters],
    queryFn: ({ pageParam = 1 }) => {
      const url = buildUrl('/api/regions', {
        ...filters,
        not_in_edition: editionId,
        page: pageParam,
        limit: filters.limit || 20,
      });
      return fetchApi(url);
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.pagination?.page < lastPage.pagination?.totalPages) {
        return lastPage.pagination.page + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
  });
}

// 4. Edition Regions (Infinite)
export function useEditionRegionsInfinite(editionId: number, filters: any = {}) {
  return useInfiniteQuery({
    queryKey: ['edition-regions', editionId, filters],
    queryFn: ({ pageParam = 1 }) => {
      const url = buildUrl(`/api/editions/${editionId}/regions/list`, {
        ...filters,
        page: pageParam,
        limit: filters.limit || 20,
      });
      return fetchApi(url);
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.pagination?.page < lastPage.pagination?.totalPages) {
        return lastPage.pagination.page + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
  });
}

// --- Mutations ---

export function useAddFighterToEdition() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ editionId, fighterId, regionId, status, is_eliminated }: any) => {
      const res = await fetch(`/api/editions/${editionId}/fighters`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fighter_id: fighterId, region_id: regionId, status, is_eliminated }),
      });
      if (!res.ok) throw new Error("Erreur lors de l'ajout");
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['available-fighters', variables.editionId] });
      queryClient.invalidateQueries({ queryKey: ['edition-fighters', variables.editionId] });
    },
  });
}

export function useRemoveFighterFromEdition() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ editionId, fighterId }: { editionId: number, fighterId: number }) => {
      const res = await fetch(`/api/editions/${editionId}/fighters?fighter_id=${fighterId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error("Erreur lors de la suppression");
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['available-fighters', variables.editionId] });
      queryClient.invalidateQueries({ queryKey: ['edition-fighters', variables.editionId] });
    },
  });
}

export function useAddRegionToEdition() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ editionId, regionId, status }: any) => {
      const res = await fetch(`/api/editions/${editionId}/regions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ region_id: regionId, status }),
      });
      if (!res.ok) throw new Error("Erreur lors de l'ajout");
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['available-regions', variables.editionId] });
      queryClient.invalidateQueries({ queryKey: ['edition-regions', variables.editionId] });
    },
  });
}

export function useRemoveRegionFromEdition() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ editionId, regionId }: { editionId: number, regionId: number }) => {
      const res = await fetch(`/api/editions/${editionId}/regions?region_id=${regionId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error("Erreur lors de la suppression");
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['available-regions', variables.editionId] });
      queryClient.invalidateQueries({ queryKey: ['edition-regions', variables.editionId] });
    },
  });
}
