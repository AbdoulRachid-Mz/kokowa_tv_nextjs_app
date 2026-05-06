"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { ReactNode, useState } from "react";

export default function QueryProvider({ children }: { children: ReactNode }) {
  // Important : créer 1 seul QueryClient par session
  const [client] = useState(() => new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute au lieu de 0
      gcTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false, // ← Important : éviter refetch au focus
      refetchOnReconnect: false, // ← Évite refetch à la reconnexion
      retry: 1,
    },
  },
}));

  return (
    <QueryClientProvider client={client}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
