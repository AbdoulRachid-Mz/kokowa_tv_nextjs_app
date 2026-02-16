// app/ad/sub-groups/[subGroupId]/matches/[matchId]/match-timer.tsx
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";
import { Badge } from "@/components/ui/badge";
import { Match } from "@/types";
import { Play, Pause, RotateCcw, Timer, Square, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface MatchTimerProps {
  match: Match;
  initialTime: number;
  breakCount: number;
  isRunning: boolean;
  onTimeUpdate: (seconds: number) => void;
  onStatusChange: (status: Match['status']) => void;
  onBreakCountChange: (count: number) => void;
  onTimerToggle: (running: boolean) => void;
  isSubGroupCompleted: boolean;
}

export function MatchTimer({
  match,
  initialTime,
  breakCount,
  isRunning,
  onTimeUpdate,
  onStatusChange,
  onBreakCountChange,
  onTimerToggle,
  isSubGroupCompleted
}: MatchTimerProps) {
  const [time, setIsBreak] = useState(initialTime);
  const [isMedicalBreak, setIsMedicalBreak] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localBreakCount, setLocalBreakCount] = useState(breakCount);
  
  const timerRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const isRunningRef = useRef(isRunning);
  const breakTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Synchroniser les refs
  useEffect(() => {
    isRunningRef.current = isRunning;
  }, [isRunning]);

  // Synchroniser le temps initial
  useEffect(() => {
    if (match.total_duration) {
      const dbTime = parseDurationToSeconds(match.total_duration);
      if (Math.abs(dbTime - time) > 2 || !isRunning) {
        setIsBreak(dbTime);
      }
    }
  }, [match.total_duration, time, isRunning]);

  // Gestion du timer
  useEffect(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = undefined;
    }

    if (isRunning && !isMedicalBreak && match.status !== 'completed' && !isSubGroupCompleted) {
      timerRef.current = setInterval(() => {
        setIsBreak(prev => {
          const newTime = prev + 1;
          // Mettre à jour toutes les 60 secondes
          if (newTime % 60 === 0) {
            onTimeUpdate(newTime);
          }
          return newTime;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = undefined;
      }
    };
  }, [isRunning, isMedicalBreak, match.status, onTimeUpdate, isSubGroupCompleted]);

  // Formater le temps
  const formatTime = useCallback((seconds: number) => {
    try {
      const safeSeconds = isNaN(seconds) ? 0 : Math.max(0, seconds);
      const hours = Math.floor(safeSeconds / 3600);
      const minutes = Math.floor((safeSeconds % 3600) / 60);
      const secs = safeSeconds % 60;
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    } catch {
      return "00:00:00";
    }
  }, []);

  // Démarrer/Arrêter le timer
  const toggleTimer = useCallback(() => {
    if (match.status === 'completed' || isSubGroupCompleted) {
      setError("Match déjà terminé");
      return;
    }

    if (!match.fighter1_id || !match.fighter2_id) {
      setError("Les deux lutteurs doivent être assignés");
      return;
    }

    const newRunningState = !isRunning;
    
    if (newRunningState) {
      // Démarrer
      setIsMedicalBreak(false);
      onTimerToggle(true);
      onStatusChange('live');
      if (!match.start_time) {
        onTimeUpdate(0);
      }
      toast.success("Match démarré");
    } else {
      // Mettre en pause
      onTimerToggle(false);
      onStatusChange('round_break');
      toast.info("Match en pause");
    }
    
    setError(null);
  }, [isRunning, match.status, match.fighter1_id, match.fighter2_id, match.start_time, isSubGroupCompleted, onTimerToggle, onStatusChange, onTimeUpdate]);

  // Ajouter une pause médicale
  const addMedicalBreak = useCallback(() => {
    if (match.status === 'completed' || isSubGroupCompleted) {
      setError("Impossible d'ajouter une pause");
      return;
    }

    if (!isRunning) {
      setError("Le match doit être en cours");
      return;
    }

    // Mettre en pause
    setIsMedicalBreak(true);
    onTimerToggle(false);
    onStatusChange('round_break');

    // Incrémenter le compteur de pauses
    const newBreakCount = localBreakCount + 1;
    setLocalBreakCount(newBreakCount);
    onBreakCountChange(newBreakCount);

    toast.info(`Pause médicale #${newBreakCount}`);

    // Reprise automatique après 30 secondes
    if (breakTimeoutRef.current) {
      clearTimeout(breakTimeoutRef.current);
    }

    breakTimeoutRef.current = setTimeout(() => {
      if (!isSubGroupCompleted && match.status !== 'completed') {
        setIsMedicalBreak(false);
        onTimerToggle(true);
        onStatusChange('live');
        toast.success("Reprise du match");
      }
    }, 30000);

  }, [isRunning, match.status, localBreakCount, isSubGroupCompleted, onTimerToggle, onStatusChange, onBreakCountChange]);

  // Réinitialiser
  const resetTimer = useCallback(() => {
    if (match.status === 'completed' || isSubGroupCompleted) {
      setError("Impossible de réinitialiser");
      return;
    }

    setIsBreak(0);
    setIsMedicalBreak(false);
    setLocalBreakCount(0);
    setError(null);
    
    onTimeUpdate(0);
    onTimerToggle(false);
    onStatusChange('scheduled');
    onBreakCountChange(0);

    if (breakTimeoutRef.current) {
      clearTimeout(breakTimeoutRef.current);
    }

    toast.info("Timer réinitialisé");
  }, [match.status, isSubGroupCompleted, onTimeUpdate, onTimerToggle, onStatusChange, onBreakCountChange]);

  // Nettoyer les timeouts
  useEffect(() => {
    return () => {
      if (breakTimeoutRef.current) {
        clearTimeout(breakTimeoutRef.current);
      }
    };
  }, []);

  const canControl = !isSubGroupCompleted && match.status !== 'completed';

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Timer className="h-5 w-5" />
          Chronomètre
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Affichage du temps */}
        <div className="text-center">
          <Typography variant="h2" className="font-mono tracking-wider text-4xl font-bold">
            {formatTime(time)}
          </Typography>
          <Typography variant="body-sm" theme="muted" className="mt-1">
            Durée du match
          </Typography>
        </div>

        {error && (
          <div className="p-2 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-center gap-2 text-red-700 text-xs">
              <AlertCircle className="h-3 w-3" />
              <span>{error}</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={toggleTimer}
            variant={isRunning ? "destructive" : "default"}
            size="lg"
            className="gap-2"
            disabled={!canControl}
          >
            {isRunning ? (
              <>
                <Pause className="h-5 w-5" />
                Pause
              </>
            ) : (
              <>
                <Play className="h-5 w-5" />
                {match.status === 'scheduled' ? 'Démarrer' : 'Reprendre'}
              </>
            )}
          </Button>

          <Button
            onClick={addMedicalBreak}
            variant="outline"
            size="lg"
            className="gap-2"
            disabled={!canControl || !isRunning}
          >
            <Square className="h-5 w-5" />
            Pause médicale
          </Button>
        </div>

        <Button
          onClick={resetTimer}
          variant="ghost"
          size="sm"
          className="w-full gap-2"
          disabled={!canControl}
        >
          <RotateCcw className="h-4 w-4" />
          Réinitialiser
        </Button>

        <div className="flex items-center justify-between pt-2 border-t">
          <Badge variant="outline" className="gap-1">
            <Square className="h-3 w-3" />
            {localBreakCount} pause{localBreakCount > 1 ? 's' : ''}
          </Badge>
          
          {isMedicalBreak && (
            <Badge variant="destructive" className="animate-pulse">
              PAUSE MÉDICALE
            </Badge>
          )}
          
          {match.status === 'completed' && (
            <Badge variant="secondary" className="bg-green-500 text-white">
              TERMINÉ
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Helper pour parser la durée
function parseDurationToSeconds(duration?: any): number {
  if (!duration) return 0;
  if (typeof duration === 'number') return duration;
  if (typeof duration === 'string') {
    const parts = duration.split(':').map(Number);
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    if (parts.length === 2) return parts[0] * 60 + parts[1];
  }
  return 0;
}