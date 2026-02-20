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
  const [status, setStatus] = useState(initialStatus);
  
  const timerRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const breakTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const lastSyncTimeRef = useRef(Date.now());
// hooks/use-match-timer.ts
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
    if (isRunning && status === 'live') {
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
  }, [isRunning, status]);

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
    if (status !== 'completed' && status !== 'cancelled') {
      setIsRunning(true);
      setStatus('live');
      onStatusChange?.('live');
    }
  }, [status, onStatusChange]);

  // Mettre en pause
  const pauseMatch = useCallback(() => {
    setIsRunning(false);
    setStatus('round_break');
    onStatusChange?.('round_break');
  }, [onStatusChange]);

  // Ajouter une pause médicale
  const addMedicalBreak = useCallback(() => {
    if (status !== 'live' || !isRunning) return;

    // Pause le timer
    setIsRunning(false);
    setStatus('round_break');
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
      setStatus('live');
      onStatusChange?.('live');
    }, 30000);

  }, [status, isRunning, breakCount, onBreakCountChange, onStatusChange]);

  // Terminer le match
  const completeMatch = useCallback((result: {
    winnerId?: number;
    loserId?: number;
    matchResult?: string;
  }) => {
    setIsRunning(false);
    setStatus('completed');
    onStatusChange?.('completed');
    
    // Sauvegarder la durée finale
    onDurationChange?.(time);
  }, [time, onDurationChange, onStatusChange]);

  // Réinitialiser
  const resetMatch = useCallback(() => {
    setIsRunning(false);
    setStatus('scheduled');
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
    setStatus(newStatus);
    setIsRunning(newStatus === 'live');
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
    status,
    startMatch,
    pauseMatch,
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
