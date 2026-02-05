// hooks/use-safe-query.ts 
import { useQuery, UseQueryOptions, QueryKey } from '@tanstack/react-query';

interface UseSafeQueryOptions<TData, TError> extends Omit<UseQueryOptions<TData, TError, TData>, 'queryFn'> {
  queryFn: () => Promise<TData | null>;
  fallbackData?: TData;
}

export function useSafeQuery<TData = unknown, TError = Error>(
  options: UseSafeQueryOptions<TData, TError>
) {
  const { queryFn, fallbackData, ...queryOptions } = options;

  const safeQueryFn = async () => {
    try {
      const data = await queryFn();
      return data ?? (fallbackData as TData);
    } catch (error) {
      console.error('Query error:', error);
      return fallbackData as TData;
    }
  };

  return useQuery<TData, TError>({
    ...queryOptions,
    queryFn: safeQueryFn,
  });
}