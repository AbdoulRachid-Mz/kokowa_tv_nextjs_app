// hooks/use-match-timer.ts
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface UseMatchTimerProps {
  initialDuration?: string | number;
  initialBreakCount?: number;
  initialStatus?: string;
  onDurationChange?: (seconds: number) => void;
  onBreakCountChange?: (count: number) => void;
  onStatusChange?: (status: string) => void;
  onTimeChange?: (seconds: number) => void;
}

export function useMatchTimer({
  initialDuration,
  initialBreakCount = 0,
  initialStatus = 'scheduled',
  onDurationChange,
  onBreakCountChange,
  onStatusChange,
  onTimeChange
}: UseMatchTimerProps = {}) {
  const [time, setTime] = useState(() => parseDurationToSeconds(initialDuration));
  const [breakCount, setBreakCount] = useState(initialBreakCount);
  const [isRunning, setIsRunning] = useState(false);
  const [timerStatus, setTimerStatus] = useState<'idle' | 'running' | 'paused'>('idle');
  const [matchStatus, setMatchStatus] = useState(initialStatus); // ← Statut métier
  
  const timerRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const breakTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const lastSyncTimeRef = useRef(Date.now());
  const timeChangeCallbackRef = useRef<typeof onTimeChange>(undefined);

  // Formater le temps
  const formatTime = useCallback((seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Gestion du timer
  useEffect(() => {
    if (isRunning && matchStatus === 'live') {
      timerRef.current = setInterval(() => {
        setTime(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRunning, matchStatus]);

  useEffect(() => {
    timeChangeCallbackRef.current = onTimeChange;
  }, [onTimeChange]);

  useEffect(() => {
    if (timeChangeCallbackRef.current) {
      timeChangeCallbackRef.current(time);
    }
  }, [time]);

  // Démarrer le match
  const startMatch = useCallback(() => {
    if (matchStatus !== 'completed' && matchStatus !== 'cancelled') {
      setIsRunning(true);
      setTimerStatus('running');
      
      // Mettre à jour le statut métier si nécessaire
      if (matchStatus === 'scheduled') {
        setMatchStatus('live');
        onStatusChange?.('live');
      }
    }
  }, [matchStatus, onStatusChange]);

  // Mettre en pause (seulement le timer, pas le statut métier)
  const pauseMatch = useCallback(() => {
    setIsRunning(false);
    setTimerStatus('paused');
    // ⚠️ NE PAS changer le statut métier ici
  }, []);

  // Reprendre (seulement le timer)
  const resumeMatch = useCallback(() => {
    if (matchStatus === 'live') {
      setIsRunning(true);
      setTimerStatus('running');
    }
  }, [matchStatus]);

  // Pause médicale (change le statut métier)
  const addMedicalBreak = useCallback(() => {
    if (matchStatus !== 'live' || !isRunning) return;

    // Pause le timer
    setIsRunning(false);
    setTimerStatus('paused');
    setMatchStatus('round_break'); // ← Ici on change le statut métier
    onStatusChange?.('round_break');

    // Incrémenter le compteur
    const newCount = breakCount + 1;
    setBreakCount(newCount);
    onBreakCountChange?.(newCount);

    // Reprise automatique après 30 secondes
    if (breakTimeoutRef.current) {
      clearTimeout(breakTimeoutRef.current);
    }

    breakTimeoutRef.current = setTimeout(() => {
      setIsRunning(true);
      setTimerStatus('running');
      setMatchStatus('live');
      onStatusChange?.('live');
    }, 30000);
  }, [matchStatus, isRunning, breakCount, onBreakCountChange, onStatusChange]);

  // Terminer le match
  const completeMatch = useCallback((result: {
    winnerId?: number;
    loserId?: number;
    matchResult?: string;
  }) => {
    setIsRunning(false);
    setTimerStatus('idle');
    setMatchStatus('completed');
    onStatusChange?.('completed');
    onDurationChange?.(time);
  }, [time, onDurationChange, onStatusChange]);

  // Réinitialiser
  const resetMatch = useCallback(() => {
    setIsRunning(false);
    setTimerStatus('idle');
    setMatchStatus('scheduled');
    setTime(0);
    setBreakCount(0);
    onStatusChange?.('scheduled');
    onDurationChange?.(0);
    onBreakCountChange?.(0);

    if (breakTimeoutRef.current) {
      clearTimeout(breakTimeoutRef.current);
    }
  }, [onDurationChange, onBreakCountChange, onStatusChange]);

  // Synchroniser avec la BD (manuellement, pas automatique)
  const syncWithDatabase = useCallback((duration: string, breaks: number, newStatus: string) => {
    setTime(parseDurationToSeconds(duration));
    setBreakCount(breaks);
    setMatchStatus(newStatus);
    setIsRunning(newStatus === 'live');
    setTimerStatus(newStatus === 'live' ? 'running' : 'idle');
    lastSyncTimeRef.current = Date.now();
  }, []);

  // Nettoyage
  useEffect(() => {
    return () => {
      if (breakTimeoutRef.current) {
        clearTimeout(breakTimeoutRef.current);
      }
    };
  }, []);

  return {
    time,
    formattedTime: formatTime(time),
    breakCount,
    isRunning,
    timerStatus,
    matchStatus, // ← Exporter les deux statuts
    startMatch,
    pauseMatch,
    resumeMatch,
    addMedicalBreak,
    completeMatch,
    resetMatch,
    syncWithDatabase,
    setTime,
  };
}

// Helper pour parser la durée
function parseDurationToSeconds(duration?: string | number): number {
  if (duration === undefined || duration === null) return 0;
  if (typeof duration === 'number') {
    return Number.isNaN(duration) ? 0 : duration;
  }
  if (typeof duration === 'string') {
    if (!duration.trim()) return 0;
    const parts = duration.split(':').map(Number);
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    if (parts.length === 2) return parts[0] * 60 + parts[1];
  }
  return 0;
}
