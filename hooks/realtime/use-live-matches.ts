// hooks/realtime/use-live-matches.ts
"use client";

import { useEffect, useState } from "react";
import { ref, onValue, off } from "firebase/database";
import { database } from "@/configs/firebase/config";
import { REALTIME_NODES } from "@/types/realtime";
import type { RealtimeEditionDocument } from "@/types/realtime";

export interface UseLiveMatchesResult {
  data: RealtimeEditionDocument | null;
  isLoading: boolean;
  error: string | null;
  liveMatchRef: { subGroupId: number; matchId: number } | null;
}

export function useLiveMatches(
  editionId: number | null
): UseLiveMatchesResult {
  const [data, setData] = useState<RealtimeEditionDocument | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!editionId) {
      setData(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    const editionRef = ref(database, `${REALTIME_NODES.EDITIONS}/${editionId}`);

    const unsubscribe = onValue(
      editionRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setData(snapshot.val() as RealtimeEditionDocument);
        } else {
          setData(null);
        }
        setIsLoading(false);
      },
      (error) => {
        console.error(`Erreur RTDB edition ${editionId}:`, error);
        setError(error.message);
        setIsLoading(false);
      }
    );

    return () => {
      off(editionRef, "value", unsubscribe);
    };
  }, [editionId]);

  const liveMatchRef = data?.liveMatch?.subGroupId && data?.liveMatch?.matchId
    ? {
        subGroupId: data.liveMatch.subGroupId,
        matchId: data.liveMatch.matchId,
      }
    : null;

  return {
    data,
    isLoading,
    error,
    liveMatchRef,
  };
}
