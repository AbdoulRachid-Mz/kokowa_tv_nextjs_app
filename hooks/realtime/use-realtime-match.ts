// hooks/realtime/use-realtime-match.ts
"use client";

import { useEffect, useState } from "react";
import { ref, onValue, off } from "firebase/database";
import { database } from "@/configs/firebase/config";
import { REALTIME_NODES } from "@/types/realtime";
import type { RealtimeMatchDocument } from "@/types/realtime";

export interface UseRealtimeMatchResult {
  data: RealtimeMatchDocument | null;
  isLoading: boolean;
  error: string | null;
}

export function useRealtimeMatch(
  subGroupId: number | null,
  matchId: number | null
): UseRealtimeMatchResult {
  const [data, setData] = useState<RealtimeMatchDocument | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!subGroupId || !matchId) {
      setData(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    const matchRef = ref(
      database,
      `${REALTIME_NODES.SUBGROUPS}/${subGroupId}/matches/${matchId}`
    );

    const unsubscribe = onValue(
      matchRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setData(snapshot.val() as RealtimeMatchDocument);
        } else {
          setData(null);
        }
        setIsLoading(false);
      },
      (error) => {
        console.error(`Erreur RTDB match ${matchId}:`, error);
        setError(error.message);
        setIsLoading(false);
      }
    );

    return () => {
      off(matchRef, "value", unsubscribe);
    };
  }, [subGroupId, matchId]);

  return {
    data,
    isLoading,
    error,
  };
}
