// hooks/use-match-controller.ts
"use client";

import { useEffect, useCallback, useRef, useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useMatchTimer } from "./use-match-timer-2";
import { getMatchById, updateMatch } from "@/actions/matches-2";
import { MatchUpdate } from "@/lib/services/match-update.service";
import { updateSubGroup } from "@/actions/sub-groups";
import { sendMatchPush } from "@/actions/matches";
import type { RealtimeMatchDocument } from "@/types/realtime";

interface UseMatchControllerProps {
  matchId: number;
  subGroupId?: number;
  remoteMatch?: RealtimeMatchDocument | null;
}

export function useMatchController({
  matchId,
  subGroupId,
  remoteMatch,
}: UseMatchControllerProps) {
  const queryClient = useQueryClient();
  const isUpdatingRef = useRef(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [pollingInterval, setPollingInterval] = useState<number | false>(false);

  // ==========================
  // QUERY
  // ==========================

  const {
    data: match,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["match", matchId],
    queryFn: () => getMatchById(matchId),
    enabled: !!matchId,
    refetchInterval: pollingInterval,
    refetchOnWindowFocus: true,
    staleTime: 0,
  });

  // Polling uniquement quand le match est live (fallback si RTDB indisponible)
  const remoteStatus = remoteMatch?.status ?? match?.status ?? "scheduled";
  useEffect(() => {
    setPollingInterval(remoteStatus === "live" ? 30000 : false);
  }, [remoteStatus]);

  // ==========================
  // TIMER (ISOLÉ)
  // ==========================

  const timer = useMatchTimer({
    initialDuration: 0,
    initialStatus: "scheduled",
  });

  // ─── Refs pour détecter les vrais changements ───
  const prevSyncKeyRef = useRef<string>("");
  const timerRef = useRef(timer);
  timerRef.current = timer; // toujours à jour, mais pas dans les deps

  const queueRef = useRef<Promise<unknown>>(Promise.resolve());

  // Valeurs effectives (DB + RTDB)
  const effectiveStatus = (remoteMatch?.status ?? match?.status ?? "scheduled") as string;
  const effectiveTotalDuration =
    remoteMatch?.totalDuration ?? (match as any)?.total_duration ?? null;
  const effectiveStartTs =
    remoteMatch?.startTime ?? (match as any)?.start_time2 ?? null;
  const effectiveBreakCount =
    remoteMatch?.breakCount ?? (match as any)?.break_count ?? 0;

  function parseDur(s: any): number {
    if (!s) return 0;
    if (typeof s === "string") {
      const parts = s.split(":").map(Number);
      if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
      if (parts.length === 2) return parts[0] * 60 + parts[1];
    }
    return 0;
  }

  function computeBase(): number {
    const stored = parseDur(effectiveTotalDuration);
    if (effectiveStatus === "live" && effectiveStartTs) {
      const startMs = new Date(effectiveStartTs).getTime();
      if (Number.isFinite(startMs)) {
        const delta = Math.floor((Date.now() - startMs) / 1000);
        if (delta >= 0 && delta < 24 * 3600) return stored + delta;
      }
    }
    return stored;
  }

  // ✅ Synchroniser le timer avec les données serveur (DB + RTDB)
  useEffect(() => {
    if (!match && !remoteMatch) return;

    const t = timerRef.current;
    const key = `${effectiveStatus}|${effectiveTotalDuration}|${effectiveStartTs}`;
    if (key === prevSyncKeyRef.current) return;
    prevSyncKeyRef.current = key;

    const base = computeBase();
    const running = effectiveStatus === "live";

    if (effectiveStatus === "live") {
      if (Math.abs(t.getDuration() - base) > 2 || !t.isRunning) {
        t.sync(base, true);
      }
    } else {
      if (Math.abs(t.getDuration() - base) > 1 || t.isRunning) {
        t.sync(base, false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveStatus, effectiveTotalDuration, effectiveStartTs, match?.id, remoteMatch?.updatedAt]);

  // ==========================
  // PERSISTENCE SÉRIALISÉE
  // ==========================

  const persist = useCallback(
    (updates: MatchUpdate) => {
      const p = queueRef.current.then(async () => {
        isUpdatingRef.current = true;
        setIsUpdating(true);
        try {
          const res = await updateMatch(matchId, updates);
          queryClient.invalidateQueries({ queryKey: ["match", matchId] });
          return res;
        } catch (e) {
          console.error("updateMatch error:", e);
          toast.error("Erreur lors de la synchronisation");
          queryClient.invalidateQueries({ queryKey: ["match", matchId] });
          throw e;
        } finally {
          isUpdatingRef.current = false;
          setIsUpdating(false);
        }
      });
      queueRef.current = p.catch(() => undefined);
      return p;
    },
    [matchId, queryClient],
  );

  // ==========================
  // SUB-GROUP MUTATION
  // ==========================
  const updateSubGroupMutation = useMutation({
    mutationFn: async (updates: { video_url?: string; status?: string }) => {
      if (!subGroupId) return;
      const formData = new FormData();
      if (updates.video_url !== undefined) {
        formData.append("video_url", updates.video_url || "");
      }
      if (updates.status !== undefined) {
        formData.append("status", updates.status || "");
      }
      const { updateSubGroup } = await import("@/actions/sub-groups");
      const response = await updateSubGroup(subGroupId, formData);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sub-group", subGroupId] });
    },
  });

  // ==========================
  // ACTIONS
  // ==========================

  const startMatch = useCallback(() => {
    if (!match || isUpdatingRef.current) return;
    if (match.status === "live") return;

    const now = new Date();
    const timeString = now.toTimeString().slice(0, 8);
    const timestamp2 = now.toISOString();

    const current = timer.getDuration();
    timer.sync(current, true);

    persist({
      status: "live",
      start_time: timeString,
      start_time2: timestamp2,
      total_duration: formatSecondsToDuration(current),
    });

    sendMatchPush(
      matchId,
      `Match entre ${match.fighter1?.first_name} ${match.fighter1?.last_name} et ${match.fighter2?.first_name} ${match.fighter2?.last_name} debute !`,
    ).catch(() => {});
  }, [match, timer, persist, matchId]);

  const pauseMatch = useCallback(() => {
    if (!match || isUpdatingRef.current) return;
    if (match.status !== "live") return;

    const currentDuration = timer.pause();
    timer.sync(currentDuration, false);

    persist({
      status: "round_break",
      total_duration: formatSecondsToDuration(currentDuration),
      break_count: (match.break_count ?? 0) + 1,
    });
  }, [match, timer, persist]);

  const reclamation = useCallback(() => {
    if (!match) return;
    const currentDuration = timer.pause();
    timer.sync(currentDuration, false);

    persist({
      status: "reclamation",
      total_duration: formatSecondsToDuration(currentDuration),
    });
  }, [match, timer, persist]);

  const resumeMatch = useCallback(() => {
    if (!match || isUpdatingRef.current) return;
    if (match.status !== "round_break" && match.status !== "reclamation") return;

    const current = timer.getDuration();
    timer.sync(current, true);

    persist({
      status: "live",
      start_time2: new Date().toISOString(),
    });
  }, [match, timer, persist]);

  const completeMatch = useCallback(
    (winnerId: number, loserId?: number) => {
      if (!match || isUpdatingRef.current) return;

      const finalDuration = timer.stop();
      timer.sync(finalDuration, false);

      const isWinnerFighter1 = winnerId === match.fighter1_id;
      const winnerInitialState = isWinnerFighter1
        ? match.fighter1_initial_state
        : match.fighter2_initial_state;

      const updates: MatchUpdate = {
        status: "completed",
        winner_fighter_id: winnerId,
        total_duration: formatSecondsToDuration(finalDuration),
        break_count: match.break_count ?? 0,
        end_time: new Date().toTimeString().slice(0, 8),
      };

      if (loserId && loserId !== -1) {
        updates.loser_fighter_id = loserId;
        updates.match_result =
          winnerId === match.fighter1_id ? "fighter1_win" : "fighter2_win";

        if (winnerInitialState === "eliminated") {
          updates.notes = match.notes
            ? `${match.notes}\n⚠️ Attention: Le vainqueur était déjà éliminé avant le match!`
            : "⚠️ Attention: Le vainqueur était déjà éliminé avant le match!";
        }
      } else {
        updates.match_result =
          winnerId === match.fighter1_id ? "fighter1_win" : "fighter2_win";
        updates.loser_fighter_id = null;

        const winnerName =
          winnerId === match.fighter1_id
            ? `${match.fighter1?.first_name} ${match.fighter1?.last_name}`
            : `${match.fighter2?.first_name} ${match.fighter2?.last_name}`;

        const forfaitNote = `Victoire par forfait - ${winnerName} a obtenu le repos`;
        updates.notes = match.notes
          ? `${match.notes}\n${forfaitNote}`
          : forfaitNote;
      }

      persist(updates);
    },
    [match, timer, persist],
  );

  const setDraw = useCallback(() => {
    if (!match || isUpdatingRef.current) return;

    const finalDuration = timer.stop();
    timer.sync(finalDuration, false);

    persist({
      status: "completed",
      match_result: "draw",
      winner_fighter_id: null,
      loser_fighter_id: null,
      total_duration: formatSecondsToDuration(finalDuration),
      break_count: match.break_count ?? 0,
      end_time: new Date().toTimeString().slice(0, 8),
    });
  }, [match, timer, persist]);

  const resetMatch = useCallback(() => {
    timer.reset();
    timer.sync(0, false);

    persist({
      force_reset: true,
      status: "scheduled",
      total_duration: "00:00:00",
      break_count: 0,
    });
  }, [timer, persist]);

  // ==========================
  // PERMISSIONS
  // ==========================

  const canStart =
    match?.status === "scheduled" &&
    !!match?.fighter1_id &&
    !!match?.fighter2_id;

  const canPause = match?.status === "live";
  const canResume =
    match?.status === "round_break" || match?.status === "reclamation";
  const canComplete =
    match?.status === "live" || match?.status === "round_break";

  const canSetWinner =
    (match?.status === "live" || match?.status === "reclamation") &&
    (!!match?.fighter1_id || !!match?.fighter2_id);

  const canSetDraw =
    (match?.status === "live" || match?.status === "reclamation") &&
    !!match?.fighter1_id &&
    !!match?.fighter2_id;

  return {
    match,
    isLoading,
    refetch,

    // timer
    elapsed: timer.elapsed,
    formattedTime: formatSecondsToDuration(timer.elapsed),
    isRunning: timer.isRunning,
    breakCount: match?.break_count ?? effectiveBreakCount,

    // actions
    startMatch,
    pauseMatch,
    resumeMatch,
    completeMatch,
    setDraw,
    resetMatch,
    reclamation,
    updateSubGroupMutation,

    // permissions
    canStart,
    canPause,
    canResume,
    canComplete,
    canSetWinner,
    canSetDraw,

    isUpdating,
  };
}

// ========== HELPERS ==========

function formatSecondsToDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}
