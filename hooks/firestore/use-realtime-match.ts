// hooks/firestore/use-realtime-match.ts
// Hook React côté client — écoute un document Firestore realtime_matches/{matchId}
// Remplace useRealtime + subscribe('match', id) + queryClient.invalidateQueries

"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { doc, onSnapshot } from "firebase/firestore";
// import { db } from "@/config/firebase-config";
import type { RealtimeMatchDocument } from "@/types/realtime";
import { REALTIME_COLLECTIONS } from "@/types/realtime";
import { db } from "@/configs/firebase/config";

export interface UseRealtimeMatchResult {
  /** Données live depuis Firestore (null si pas encore chargé) */
  data: RealtimeMatchDocument | null;
  /** True pendant la première résolution du snapshot */
  isLoading: boolean;
  /** True si le match est actuellement en live (liveState.isLive) */
  isLive: boolean;
  /** True si le document Firestore existe */
  exists: boolean;
  /** Erreur éventuelle */
  error: string | null;
  /** True si connecté à Firestore et en écoute active */
  isListening: boolean;
}

/**
 * Écoute en temps réel le document Firestore d'un match.
 *
 * - Si le document n'existe pas encore → exists=false, data=null
 * - Unsubscribe automatique au unmount ou changement de matchId
 * - Pas de refetch API : le frontend reçoit directement les données finales
 *
 * Usage :
 *   const { data, isLive, isLoading } = useRealtimeMatch(matchId);
 */
export function useRealtimeMatch(
  matchId: number | null
): UseRealtimeMatchResult {
  const [data, setData] = useState<RealtimeMatchDocument | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [exists, setExists] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);

  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    // Pas d'ID valide → réinitialiser
    if (!matchId || isNaN(matchId)) {
      setData(null);
      setIsLoading(false);
      setExists(false);
      setIsListening(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    const docRef = doc(db, REALTIME_COLLECTIONS.MATCHES, String(matchId));

    const unsubscribe = onSnapshot(
      docRef,
      (snap) => {
        if (snap.exists()) {
          setData(snap.data() as RealtimeMatchDocument);
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
          `[useRealtimeMatch] Erreur Firestore match ${matchId}:`,
          err
        );
        setError(err.message);
        setIsLoading(false);
        setIsListening(false);
      }
    );

    unsubscribeRef.current = unsubscribe;

    return () => {
      unsubscribe();
      unsubscribeRef.current = null;
      setIsListening(false);
    };
  }, [matchId]);

  const isLive = data?.liveState?.isLive ?? false;

  return {
    data,
    isLoading,
    isLive,
    exists,
    error,
    isListening,
  };
}
