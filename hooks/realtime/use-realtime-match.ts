// hooks/realtime/use-realtime-match.ts
import { useEffect, useState } from "react";
import { ref, onValue, off } from "firebase/database";
import { database } from "@/configs/firebase/config";
import { REALTIME_NODES } from "@/types/realtime";
import type { RealtimeMatchDocument } from "@/types/realtime";

export function useRealtimeMatch(
  editionId: number | null,
  subGroupId: number | null,
  matchId: number | null,
) {
  const [data, setData] = useState<RealtimeMatchDocument | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!editionId || !subGroupId || !matchId) {
      setData(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const path = `${REALTIME_NODES.EDITIONS}/${editionId}/subGroups/${subGroupId}/matches/${matchId}`;
    const matchRef = ref(database, path);

    const unsubscribe = onValue(
      matchRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const matchData = snapshot.val() as RealtimeMatchDocument;
          matchData.allCards = matchData.allCards || [];
          setData(matchData);
        } else {
          setData(null);
        }
        setIsLoading(false);
      },
      (err) => {
        setError(err.message);
        setIsLoading(false);
      },
    );

    return () => off(matchRef, "value", unsubscribe);
  }, [editionId, subGroupId, matchId]);

  return { data, isLoading, error };
}
