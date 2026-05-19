// hooks/firestore/use-realtime-subgroup.ts
// Hook React côté client — écoute un document Firestore realtime_subgroups/{subGroupId}

"use client";

import { useEffect, useState, useRef } from "react";
import { doc, onSnapshot } from "firebase/firestore";
// import { db } from "@/config/firebase-config";
import type { RealtimeSubGroupDocument } from "@/types/realtime";
import { REALTIME_COLLECTIONS } from "@/types/realtime";
import { db } from "@/configs/firebase/config";

export interface UseRealtimeSubGroupResult {
  data: RealtimeSubGroupDocument | null;
  isLoading: boolean;
  exists: boolean;
  error: string | null;
  isListening: boolean;
  /** True si le sous-groupe a un match live en cours */
  hasLiveMatch: boolean;
}

/**
 * Écoute en temps réel le document Firestore d'un sous-groupe.
 *
 * - Unsubscribe automatique au unmount ou changement de subGroupId
 * - Expose hasLiveMatch pour afficher des indicateurs visuels
 *
 * Usage :
 *   const { data, hasLiveMatch, isLoading } = useRealtimeSubGroup(subGroupId);
 */
export function useRealtimeSubGroup(
  subGroupId: number | null
): UseRealtimeSubGroupResult {
  const [data, setData] = useState<RealtimeSubGroupDocument | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [exists, setExists] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    if (!subGroupId || isNaN(subGroupId)) {
      setData(null);
      setIsLoading(false);
      setExists(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    const docRef = doc(
      db,
      REALTIME_COLLECTIONS.SUBGROUPS,
      String(subGroupId)
    );

    const unsubscribe = onSnapshot(
      docRef,
      (snap) => {
        if (snap.exists()) {
          setData(snap.data() as RealtimeSubGroupDocument);
          setExists(true);
        } else {
          setData(null);
          setExists(false);
        }
        setIsLoading(false);
        setIsListening(true);
        setError(null);
      },
      (err) => {
        console.error(
          `[useRealtimeSubGroup] Erreur Firestore subGroup ${subGroupId}:`,
          err
        );
        setError(err.message);
        setIsLoading(false);
        setIsListening(false);
      }
    );

    return () => {
      unsubscribe();
      setIsListening(false);
    };
  }, [subGroupId]);

  const hasLiveMatch = (data?.matchesSummary?.live ?? 0) > 0;

  return {
    data,
    isLoading,
    exists,
    error,
    isListening,
    hasLiveMatch,
  };
}
