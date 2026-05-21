// hooks/realtime/use-realtime-subgroup.ts
"use client";

import { useEffect, useState } from "react";
import { ref, onValue, off } from "firebase/database";
import { database } from "@/configs/firebase/config"; // Assurez-vous d'exporter "database" dans config.ts
import { REALTIME_NODES } from "@/types/realtime";
import type { RealtimeSubGroupDocument } from "@/types/realtime";

export interface UseRealtimeSubGroupResult {
  data: RealtimeSubGroupDocument | null;
  isLoading: boolean;
  error: string | null;
  hasLiveMatch: boolean;
}

export function useRealtimeSubGroup(
  subGroupId: number | null
): UseRealtimeSubGroupResult {
  const [data, setData] = useState<RealtimeSubGroupDocument | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!subGroupId) {
      setData(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    const subGroupRef = ref(database, `${REALTIME_NODES.SUBGROUPS}/${subGroupId}`);

    const unsubscribe = onValue(
      subGroupRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setData(snapshot.val() as RealtimeSubGroupDocument);
        } else {
          setData(null);
        }
        setIsLoading(false);
      },
      (error) => {
        console.error(`Erreur RTDB subGroup ${subGroupId}:`, error);
        setError(error.message);
        setIsLoading(false);
      }
    );

    return () => {
      off(subGroupRef, "value", unsubscribe);
    };
  }, [subGroupId]);

  const hasLiveMatch = (data?.summary?.live ?? 0) > 0;

  return {
    data,
    isLoading,
    error,
    hasLiveMatch,
  };
}
