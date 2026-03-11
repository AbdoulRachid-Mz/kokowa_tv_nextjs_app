'use client';

import { useEffect, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useMatchTimer } from './use-match-timer-2';
import { getMatchById, updateMatch } from '@/actions/matches-2';
import { MatchUpdate } from '@/lib/services/match-update.service';
import { updateSubGroup } from '@/actions/sub-groups';
import { sendMatchPush } from '@/actions/matches';

interface UseMatchControllerProps {
  matchId: number;
  subGroupId?: number;
}

export function useMatchController({ matchId, subGroupId }: UseMatchControllerProps) {
  const queryClient = useQueryClient();
  const isUpdatingRef = useRef(false); // 🔥 Pour éviter les doubles appels

  // ==========================
  // QUERY
  // ==========================

  const { data: match, isLoading, refetch } = useQuery({
    queryKey: ['match', matchId],
    queryFn: () => getMatchById(matchId),
    enabled: !!matchId
  });




  // ==========================
  // TIMER (ISOLÉ)
  // ==========================

  const timer = useMatchTimer({
    initialDuration: parseDurationToSeconds(match?.total_duration ?? '00:00:00'),
    initialStatus: match?.status ?? 'scheduled'
  });

  useEffect(() => {
    if (!match) return;

    const durationInSeconds = parseDurationToSeconds(
      match.total_duration ?? "00:00:00"
    );

    timer.setTime(durationInSeconds);

    if (match.status === "live") {
      timer.start();
    }

    if (match.status === "round_break") {
      timer.pause();
    }

    if (match.status === "completed") {
      timer.stop();
    }

  }, [match]);

  // ==========================
  // MUTATION
  // ==========================

  const updateMutation = useMutation({
    mutationFn: async (updates: MatchUpdate) => {
      // 🔥 Éviter les appels concurrents
      if (isUpdatingRef.current) {
        console.log('🔄 Mise à jour déjà en cours, ignorée');
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
      queryClient.invalidateQueries({ queryKey: ['match', matchId] });
    },

    onError: () => {
      toast.error('Erreur lors de la synchronisation');
    }
  });

  // sub_group mutation
  const updateSubGroupMutation = useMutation({
    mutationFn: async (updates: { video_url?: string, status?: string }) => {
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
  const timestamp2 = now.toISOString(); // Format ISO complet pour start_time2

  updateMutation.mutate({
    status: 'live',
    start_time: timeString,
    start_time2: timestamp2, // NOUVEAU - timestamp ISO complet
  });

  //push topic
  sendMatchPush(matchId, `Match entre ${match.fighter1?.first_name} ${match.fighter1?.last_name} et ${match.fighter2?.first_name} ${match.fighter2?.last_name} debute !`);
}, [match, timer, updateMutation]);

  const pauseMatch = useCallback(() => {
    if (!match || isUpdatingRef.current) return; // 🔥 Vérification

    // 1️⃣ Stopper le timer et récupérer la durée actuelle
    const currentDuration = timer.pause();

    // 2️⃣ Mettre à jour en base
    updateMutation.mutate({
      status: 'round_break',
      total_duration: formatSecondsToDuration(currentDuration),
      break_count: (match.break_count ?? 0) + 1,
    });
  }, [match, timer, updateMutation]);

  // reclamation
  const reclamation = useCallback(() => {
    if (!match) return;
    timer.pause()

    // 1️⃣ Stopper le timer et récupérer la durée actuelle
    const currentDuration = timer.pause();
    // 2️⃣ Mettre à jour en base
    updateMutation.mutate({
      status: "reclamation",
      total_duration: formatSecondsToDuration(currentDuration),
    });
  }, [match, timer, updateMutation])

  const resumeMatch = useCallback(() => {
    timer.resume();

    updateMutation.mutate({
      status: 'live'
    });
  }, [timer, updateMutation]);

  const completeMatch = useCallback((winnerId: number, loserId: number) => {
    if (!match || isUpdatingRef.current) return; // 🔥 Vérification

    const finalDuration = timer.stop();

    const matchResult =
      winnerId === match.fighter1_id
        ? 'fighter1_win'
        : 'fighter2_win';

    updateMutation.mutate({
      status: 'completed',
      winner_fighter_id: winnerId,
      loser_fighter_id: loserId,
      match_result: matchResult,
      total_duration: formatSecondsToDuration(finalDuration),
      break_count: match.break_count ?? 0,
      end_time: new Date().toTimeString().slice(0, 8)
    });
  }, [match, timer, updateMutation]);

  const setDraw = useCallback(() => {
    if (!match || isUpdatingRef.current) return; // 🔥 Vérification

    const finalDuration = timer.stop();

    updateMutation.mutate({
      status: 'completed',
      match_result: 'draw',
      winner_fighter_id: null,
      loser_fighter_id: null,
      total_duration: formatSecondsToDuration(finalDuration),
      break_count: match.break_count ?? 0,
      end_time: new Date().toTimeString().slice(0, 8)
    });
  }, [match, timer, updateMutation]);

  const resetMatch = useCallback(() => {
    timer.reset();

    updateMutation.mutate({
      force_reset: true
    });
  }, [timer, updateMutation]);


  // ==========================
  // PERMISSIONS
  // ==========================

  const canStart =
    match?.status === 'scheduled' &&
    !!match?.fighter1_id &&
    !!match?.fighter2_id;

  const canPause = match?.status === 'live';

  const canResume = match?.status === 'round_break' || match?.status === "reclamation";

  const canComplete =
    match?.status === 'live' || match?.status === 'round_break';

  // Boutons winner/draw disponibles uniquement en mode live OU réclamation
  const canSetWinner =
    match?.status === 'live' || match?.status === 'reclamation';

  const canSetDraw =
    match?.status === 'live' || match?.status === 'reclamation';

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

    isUpdating: updateMutation.isPending
  };
}

// ========== HELPERS ==========

function formatSecondsToDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function parseDurationToSeconds(duration?: string | null): number {
  if (!duration) return 0;
  const parts = duration.split(':').map(Number);
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }
  return 0;
}