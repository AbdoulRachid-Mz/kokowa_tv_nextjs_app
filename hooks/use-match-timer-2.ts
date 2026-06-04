// hooks/use-match-timer.ts
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
  stop: () => number; // returns final duration
  reset: () => void;
  getDuration: () => number;
  setTime: (seconds: number) => void;
}

export function useMatchTimer({
  initialDuration,
  initialStatus,
}: UseMatchTimerOptions): UseMatchTimerReturn {
  const [elapsed, setElapsed] = useState(initialDuration);
  const [isRunning, setIsRunning] = useState(
    initialStatus === 'live'
  );

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimestampRef = useRef<number | null>(null);
  const accumulatedRef = useRef(initialDuration);

  // On mount only: sync from initial values
  const mountedRef = useRef(false);
  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      accumulatedRef.current = initialDuration;
      setElapsed(initialDuration);
      if (initialStatus === 'live') {
        startTimestampRef.current = Date.now();
        startTicking();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startTicking = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      if (startTimestampRef.current !== null) {
        const now = Date.now();
        const delta = Math.floor((now - startTimestampRef.current) / 1000);
        setElapsed(accumulatedRef.current + delta);
      }
    }, 1000);
  }, []);

  const stopTicking = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    // Save accumulated
    if (startTimestampRef.current !== null) {
      const now = Date.now();
      const delta = Math.floor((now - startTimestampRef.current) / 1000);
      accumulatedRef.current = accumulatedRef.current + delta;
      startTimestampRef.current = null;
    }
  }, []);

  const start = useCallback(() => {
    if (isRunning) return;
    startTimestampRef.current = Date.now();
    setIsRunning(true);
    startTicking();
  }, [isRunning, startTicking]);

const pause = useCallback((): number => {
  if (!isRunning) {
    return accumulatedRef.current;
  }

  stopTicking();
  setIsRunning(false);

  const currentDuration = accumulatedRef.current;
  setElapsed(currentDuration);

  return currentDuration;
}, [isRunning, stopTicking]);

  const resume = useCallback(() => {
    if (isRunning) return;
    startTimestampRef.current = Date.now();
    setIsRunning(true);
    startTicking();
  }, [isRunning, startTicking]);

  const stop = useCallback((): number => {
    stopTicking();
    setIsRunning(false);
    const finalDuration = accumulatedRef.current;
    setElapsed(finalDuration);
    return finalDuration;
  }, [stopTicking]);

  const reset = useCallback(() => {
    stopTicking();
    setIsRunning(false);
    accumulatedRef.current = 0;
    startTimestampRef.current = null;
    setElapsed(0);
  }, [stopTicking]);

  const getDuration = useCallback((): number => {
    if (isRunning && startTimestampRef.current !== null) {
      const now = Date.now();
      const delta = Math.floor((now - startTimestampRef.current) / 1000);
      return accumulatedRef.current + delta;
    }
    return accumulatedRef.current;
  }, [isRunning]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return {
    elapsed,
    isRunning,
    start,
    pause: () => pause(),
    resume,
    stop,
    reset,
    getDuration,
    setTime: (seconds: number) => {
      if (isRunning) {
        // Stop current ticking to reset timestamp with new value
        stopTicking();
        accumulatedRef.current = seconds;
        startTimestampRef.current = Date.now();
        startTicking();
      } else {
        accumulatedRef.current = seconds;
      }
      setElapsed(seconds);
    }
  };
}
