// hooks/firestore/use-live-matches.ts
// Hook React côté client — écoute la collection Firestore pour les matchs live
// Query : realtime_matches WHERE liveState.isLive == true

"use client";

import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore";
// import { db } from "@/config/firebase-config";
import type { RealtimeMatchDocument } from "@/types/realtime";
import { REALTIME_COLLECTIONS } from "@/types/realtime";
import { db } from "@/configs/firebase/config";

export interface UseLiveMatchesResult {
  /** Liste des matchs actuellement en live */
  liveMatches: RealtimeMatchDocument[];
  isLoading: boolean;
  error: string | null;
  count: number;
}

/**
 * Écoute en temps réel tous les matchs en live dans Firestore.
 * Parfait pour les widgets, dashboards, et la page /matches (onglet "En direct").
 *
 * Requête Firestore : WHERE liveState.isLive == true ORDER BY updatedAt DESC
 *
 * ⚠️ Nécessite un index Firestore composite : liveState.isLive + updatedAt DESC
 *    (Firestore proposera automatiquement le lien pour créer l'index)
 *
 * Usage :
 *   const { liveMatches, count, isLoading } = useLiveMatches();
 */
export function useLiveMatches(): UseLiveMatchesResult {
  const [liveMatches, setLiveMatches] = useState<RealtimeMatchDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);

    const q = query(
      collection(db, REALTIME_COLLECTIONS.MATCHES),
      where("liveState.isLive", "==", true),
      orderBy("updatedAt", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const matches = snapshot.docs.map(
          (doc) => doc.data() as RealtimeMatchDocument
        );
        setLiveMatches(matches);
        setIsLoading(false);
        setError(null);
      },
      (err) => {
        console.error("[useLiveMatches] Erreur Firestore:", err);
        setError(err.message);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return {
    liveMatches,
    isLoading,
    error,
    count: liveMatches.length,
  };
}
