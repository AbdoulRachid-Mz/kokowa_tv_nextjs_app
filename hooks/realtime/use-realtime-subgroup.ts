// hooks/realtime/use-realtime-subgroup.ts
import { useEffect, useState } from "react";
import { ref, onValue, off } from "firebase/database";
import { database } from "@/configs/firebase/config";
import { REALTIME_NODES } from "@/types/realtime";
import type { RealtimeSubGroupDocument } from "@/types/realtime";

export function useRealtimeSubGroup(
  editionId: number | null,
  subGroupId: number | null
) {
  const [data, setData] = useState<RealtimeSubGroupDocument | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!editionId || !subGroupId) {
      setData(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const path = `${REALTIME_NODES.EDITIONS}/${editionId}/subGroups/${subGroupId}`;
    const subGroupRef = ref(database, path);

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
      (err) => {
        setError(err.message);
        setIsLoading(false);
      }
    );

    return () => off(subGroupRef, "value", unsubscribe);
  }, [editionId, subGroupId]);

  const hasLiveMatch = (data?.summary?.live ?? 0) > 0;

  return { data, isLoading, error, hasLiveMatch };
}