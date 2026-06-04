// hooks/use-match-controller.ts
"use client";

import { useEffect, useCallback, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useMatchTimer } from "./use-match-timer-2";
import { getMatchById, updateMatch } from "@/actions/matches-2";
import { MatchUpdate } from "@/lib/services/match-update.service";
import { updateSubGroup } from "@/actions/sub-groups";
import { sendMatchPush } from "@/actions/matches";

interface UseMatchControllerProps {
  matchId: number;
  subGroupId?: number;
}

export function useMatchController({
  matchId,
  subGroupId,
}: UseMatchControllerProps) {
  const queryClient = useQueryClient();
  const isUpdatingRef = useRef(false);
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
    refetchOnWindowFocus: false,
    staleTime: 0, // Toujours stale pour les matchs live
  });

  // Désactiver le polling complètement - WebSocket fait le travail
  useEffect(() => {
    // Plus de polling agressif, on utilise WebSocket
    setPollingInterval(false);
  }, [match?.status]);

  // ==========================
  // TIMER (ISOLÉ)
  // ==========================

  const timer = useMatchTimer({
    initialDuration: parseDurationToSeconds(
      match?.total_duration ?? "00:00:00",
    ),
    initialStatus: match?.status ?? "scheduled",
  });

  // ✅ Synchroniser le timer avec les données serveur (via WebSocket)
  useEffect(() => {
    if (!match) return;

    const durationInSeconds = parseDurationToSeconds(
      match.total_duration ?? "00:00:00",
    );
    const currentDuration = timer.elapsed;
    const durationDiff = Math.abs(currentDuration - durationInSeconds);

    // Only sync time if timer is not running OR difference is extreme (>10s)
    // Avoid jumps during active play to prevent disruption from minor clock differences
    if (!timer.isRunning && durationDiff > 2) {
      console.log(
        `🔄 [Sync] Synchronisation du timer (paused): ${currentDuration}s -> ${durationInSeconds}s`,
      );
      timer.setTime(durationInSeconds);
    } else if (timer.isRunning && durationDiff > 10) {
      console.log(
        `🔄 [Sync] Synchronisation du timer (live, large gap): ${currentDuration}s -> ${durationInSeconds}s`,
      );
      timer.setTime(durationInSeconds);
    }

    // Synchroniser le statut du timer avec le statut du match
    if (match.status === "live" && !timer.isRunning) {
      console.log("🔄 [Sync] Démarrage du timer (match live)");
      timer.start();
    } else if (
      (match.status === "round_break" || match.status === "reclamation") &&
      timer.isRunning
    ) {
      console.log(`🔄 [Sync] Pause du timer (match ${match.status})`);
      timer.pause();
    } else if (match.status === "completed" && timer.isRunning) {
      console.log("🔄 [Sync] Arrêt du timer (match terminé)");
      timer.stop();
    } else if (
      match.status === "scheduled" &&
      (timer.isRunning || timer.elapsed > 0)
    ) {
      console.log("🔄 [Sync] Reset du timer (match programmé)");
      timer.reset();
    }
  }, [match?.total_duration, match?.status, timer]);

  // ==========================
  // MUTATION
  // ==========================

  const updateMutation = useMutation({
    mutationFn: async (updates: MatchUpdate) => {
      if (isUpdatingRef.current) {
        console.log("🔄 Mise à jour déjà en cours, ignorée");
        return;
      }

      isUpdatingRef.current = true;
      try {
        return await updateMatch(matchId, updates);
      } finally {
        isUpdatingRef.current = false;
      }
    },

    onSuccess: () => {
      // Invalider le cache - WebSocket s'occupera du reste
      queryClient.invalidateQueries({ queryKey: ["match", matchId] });
    },

    onError: () => {
      toast.error("Erreur lors de la synchronisation");
    },
  });

  // sub_group mutation
  const updateSubGroupMutation = useMutation({
    mutationFn: async (updates: { video_url?: string; status?: string }) => {
      const formData = new FormData();
      if (updates.video_url !== undefined) {
        formData.append("video_url", updates.video_url || "");
      }
      if (updates.status !== undefined) {
        formData.append("status", updates.status || "");
      }
      const response = await updateSubGroup(subGroupId!, formData);
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

    timer.start();

    const now = new Date();
    const timeString = now.toTimeString().slice(0, 8);
    const timestamp2 = now.toISOString();

    updateMutation.mutate({
      status: "live",
      start_time: timeString,
      start_time2: timestamp2,
    });

    //push topic
    sendMatchPush(
      matchId,
      `Match entre ${match.fighter1?.first_name} ${match.fighter1?.last_name} et ${match.fighter2?.first_name} ${match.fighter2?.last_name} debute !`,
    );
  }, [match, timer, updateMutation]);

  const pauseMatch = useCallback(() => {
    if (!match || isUpdatingRef.current) return;

    const currentDuration = timer.pause();

    updateMutation.mutate({
      status: "round_break",
      total_duration: formatSecondsToDuration(currentDuration),
      break_count: (match.break_count ?? 0) + 1,
    });
  }, [match, timer, updateMutation]);

  // reclamation
  const reclamation = useCallback(() => {
    if (!match) return;
    timer.pause();

    const currentDuration = timer.pause();
    updateMutation.mutate({
      status: "reclamation",
      total_duration: formatSecondsToDuration(currentDuration),
    });
  }, [match, timer, updateMutation]);

  const resumeMatch = useCallback(() => {
    timer.resume();

    updateMutation.mutate({
      status: "live",
    });
  }, [timer, updateMutation]);

  // ✅ VERSION AMÉLIORÉE - Gère les cas où un lutteur est absent
  const completeMatch = useCallback(
    (winnerId: number, loserId?: number) => {
      if (!match || isUpdatingRef.current) return;

      const finalDuration = timer.stop();

      // ✅ Vérifier si le vainqueur était déjà éliminé initialement
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

      // Déterminer le résultat du match
      if (loserId && loserId !== -1) {
        // Victoire normale avec les deux lutteurs
        updates.loser_fighter_id = loserId;
        updates.match_result =
          winnerId === match.fighter1_id ? "fighter1_win" : "fighter2_win";

        // Vérifier si le vainqueur était déjà éliminé (cas rare)
        if (winnerInitialState === "eliminated") {
          updates.notes = match.notes
            ? `${match.notes}\n⚠️ Attention: Le vainqueur était déjà éliminé avant le match!`
            : "⚠️ Attention: Le vainqueur était déjà éliminé avant le match!";
        }
      } else {
        // Victoire par forfait (lutteur absent)
        // ✅ NE PAS définir loser_fighter_id du tout
        updates.match_result =
          winnerId === match.fighter1_id ? "fighter1_win" : "fighter2_win";
        updates.loser_fighter_id = null; // 🔥 Important: mettre à null, pas -1

        const winnerName =
          winnerId === match.fighter1_id
            ? `${match.fighter1?.first_name} ${match.fighter1?.last_name}`
            : `${match.fighter2?.first_name} ${match.fighter2?.last_name}`;

        const forfaitNote = `Victoire par forfait - ${winnerName} a obtenu le repos`;
        updates.notes = match.notes
          ? `${match.notes}\n${forfaitNote}`
          : forfaitNote;
      }

      updateMutation.mutate(updates);
    },
    [match, timer, updateMutation],
  );

  const setDraw = useCallback(() => {
    if (!match || isUpdatingRef.current) return;

    const finalDuration = timer.stop();

    updateMutation.mutate({
      status: "completed",
      match_result: "draw",
      winner_fighter_id: null,
      loser_fighter_id: null,
      total_duration: formatSecondsToDuration(finalDuration),
      break_count: match.break_count ?? 0,
      end_time: new Date().toTimeString().slice(0, 8),
    });
  }, [match, timer, updateMutation]);

  const resetMatch = useCallback(() => {
    timer.reset();

    updateMutation.mutate({
      force_reset: true,
    });
  }, [timer, updateMutation]);

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

  // ✅ Déjà correct dans use-match-controller.ts
  const canSetWinner =
    (match?.status === "live" || match?.status === "reclamation") &&
    (!!match?.fighter1_id || !!match?.fighter2_id); // Un seul lutteur suffit

  const canSetDraw =
    (match?.status === "live" || match?.status === "reclamation") &&
    !!match?.fighter1_id &&
    !!match?.fighter2_id; // Match nul nécessite les deux

  return {
    match,
    isLoading,
    refetch,

    // timer
    elapsed: timer.elapsed,
    formattedTime: formatSecondsToDuration(timer.elapsed),
    isRunning: timer.isRunning,
    breakCount: match?.break_count ?? 0,

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

    isUpdating: updateMutation.isPending,
  };
}

// ========== HELPERS ==========

function formatSecondsToDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

function parseDurationToSeconds(duration?: string | null): number {
  if (!duration) return 0;
  const parts = duration.split(":").map(Number);
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }
  return 0;
}