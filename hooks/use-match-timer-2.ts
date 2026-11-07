// hooks/use-match-timer-2.ts
// Timer local ultra-stable : tout l'état mutable vit dans des refs.
// Seul `elapsed` est un useState, mis à jour par un unique setInterval.
'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

interface UseMatchTimerOptions {
  initialDuration: number; // seconds
  initialStatus: string;
}

interface UseMatchTimerReturn {
  elapsed: number;
  isRunning: boolean;
  start: () => void;
  pause: () => number;
  resume: () => void;
  stop: () => number;
  reset: () => void;
  getDuration: () => number;
  setTime: (seconds: number) => void;
  sync: (seconds: number, running: boolean) => void;
}

export function useMatchTimer({
  initialDuration,
  initialStatus,
}: UseMatchTimerOptions): UseMatchTimerReturn {
  // ─── Refs for mutable timer internals (NO re-renders) ───
  const accumulatedRef = useRef(initialDuration);   // seconds accumulated before current run
  const startTsRef = useRef<number | null>(null);   // Date.now() when current run started
  const runningRef = useRef(initialStatus === 'live');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef = useRef(false);

  // ─── Single reactive state: what the UI sees ───
  const [elapsed, setElapsed] = useState(initialDuration);
  const [isRunning, setIsRunning] = useState(initialStatus === 'live');

  // ─── Compute current elapsed from refs (no state) ───
  const computeElapsed = useCallback((): number => {
    if (startTsRef.current !== null) {
      const delta = Math.floor((Date.now() - startTsRef.current) / 1000);
      return accumulatedRef.current + delta;
    }
    return accumulatedRef.current;
  }, []);

  // ─── Start/stop the ticking interval ───
  const startTicking = useCallback(() => {
    if (intervalRef.current) return; // already ticking
    intervalRef.current = setInterval(() => {
      setElapsed(computeElapsed());
    }, 250); // 250ms for smooth display, computeElapsed is time-based so no drift
  }, [computeElapsed]);

  const stopTicking = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // ─── Freeze accumulated time (call when pausing/stopping) ───
  const freezeAccumulated = useCallback(() => {
    if (startTsRef.current !== null) {
      const delta = Math.floor((Date.now() - startTsRef.current) / 1000);
      accumulatedRef.current += delta;
      startTsRef.current = null;
    }
  }, []);

  // ─── Timer actions (stable callbacks) ───

  const start = useCallback(() => {
    if (runningRef.current) return;
    runningRef.current = true;
    startTsRef.current = Date.now();
    setIsRunning(true);
    startTicking();
  }, [startTicking]);

  const pause = useCallback((): number => {
    if (!runningRef.current) return accumulatedRef.current;
    freezeAccumulated();
    stopTicking();
    runningRef.current = false;
    const dur = accumulatedRef.current;
    setElapsed(dur);
    setIsRunning(false);
    return dur;
  }, [freezeAccumulated, stopTicking]);

  const resume = useCallback(() => {
    if (runningRef.current) return;
    runningRef.current = true;
    startTsRef.current = Date.now();
    setIsRunning(true);
    startTicking();
  }, [startTicking]);

  const stop = useCallback((): number => {
    freezeAccumulated();
    stopTicking();
    runningRef.current = false;
    const dur = accumulatedRef.current;
    setElapsed(dur);
    setIsRunning(false);
    return dur;
  }, [freezeAccumulated, stopTicking]);

  const reset = useCallback(() => {
    stopTicking();
    runningRef.current = false;
    accumulatedRef.current = 0;
    startTsRef.current = null;
    setElapsed(0);
    setIsRunning(false);
  }, [stopTicking]);

  const getDuration = useCallback((): number => {
    return computeElapsed();
  }, [computeElapsed]);

  const setTime = useCallback((seconds: number) => {
    if (runningRef.current) {
      // While running: update accumulated base and reset the start timestamp
      accumulatedRef.current = seconds;
      startTsRef.current = Date.now();
    } else {
      accumulatedRef.current = seconds;
    }
    setElapsed(seconds);
  }, []);

  const sync = useCallback((seconds: number, running: boolean) => {
    stopTicking();
    accumulatedRef.current = seconds;
    if (running) {
      runningRef.current = true;
      startTsRef.current = Date.now();
      setIsRunning(true);
      setElapsed(seconds);
      startTicking();
    } else {
      runningRef.current = false;
      startTsRef.current = null;
      setIsRunning(false);
      setElapsed(seconds);
    }
  }, [stopTicking, startTicking]);

  // ─── Mount: bootstrap the timer once ───
  useEffect(() => {
    if (mountedRef.current) return;
    mountedRef.current = true;

    accumulatedRef.current = initialDuration;
    setElapsed(initialDuration);

    if (initialStatus === 'live') {
      runningRef.current = true;
      startTsRef.current = Date.now();
      setIsRunning(true);
      startTicking();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Cleanup ───
  useEffect(() => {
    return () => {
      stopTicking();
    };
  }, [stopTicking]);

  return {
    elapsed,
    isRunning,
    start,
    pause,
    resume,
    stop,
    reset,
    getDuration,
    setTime,
    sync,
  };
}
