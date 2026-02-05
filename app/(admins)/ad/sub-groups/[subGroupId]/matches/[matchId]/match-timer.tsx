// app/ad/sub-groups/[subGroupId]/matches/[matchId]/match-timer.tsx - VERSION CORRIGÉE
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";
import { Badge } from "@/components/ui/badge";
import { Match } from "@/types";
import { Play, Pause, RotateCcw, Timer, Square, AlertCircle } from "lucide-react";

interface MatchTimerProps {
  match: Match;
  initialTime: number;
  breakCount: number;
  isRunning: boolean;
  onTimeUpdate: (seconds: number) => void;
  onStatusChange: (status: Match['status']) => void;
  onBreakCountChange: (count: number) => void;
  onTimerToggle: (running: boolean) => void;
}

export function MatchTimer({
  match,
  initialTime,
  breakCount,
  isRunning,
  onTimeUpdate,
  onStatusChange,
  onBreakCountChange,
  onTimerToggle
}: MatchTimerProps) {
  const [time, setTime] = useState(initialTime);
  const [isBreak, setIsBreak] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Format HH:MM:SS avec validation
  const formatTime = useCallback((seconds: number) => {
    try {
      // S'assurer que seconds est un nombre valide
      const safeSeconds = isNaN(seconds) ? 0 : Math.max(0, seconds);
      
      const hours = Math.floor(safeSeconds / 3600);
      const minutes = Math.floor((safeSeconds % 3600) / 60);
      const secs = safeSeconds % 60;
      
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    } catch (err) {
      console.error('Error formatting time:', err);
      return "00:00:00";
    }
  }, []);

  // Démarrer/arrêter le timer
  const toggleTimer = () => {
    try {
      const newRunningState = !isRunning;
      onTimerToggle(newRunningState);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Erreur lors du démarrage/arrêt du timer");
    }
  };

  // Ajouter une pause médicale
  const addMedicalBreak = () => {
    if (match.status === 'completed') {
      setError("Impossible d'ajouter une pause sur un match terminé");
      return;
    }

    try {
      const newBreakCount = breakCount + 1;
      onBreakCountChange(newBreakCount);
      setIsBreak(true);
      onTimerToggle(false);
      onStatusChange('round_break');
      setError(null);
      
      // Auto-reprise après 30 secondes
      const resumeTimeout = setTimeout(() => {
        if (match.status === 'round_break') {
          setIsBreak(false);
          onTimerToggle(true);
          onStatusChange('live');
        }
      }, 30000);

      // Nettoyer le timeout si le composant est démonté
      return () => clearTimeout(resumeTimeout);
    } catch (err: any) {
      setError(err.message || "Erreur lors de l'ajout de la pause");
    }
  };

  // Réinitialiser le timer
  const resetTimer = () => {
    if (match.status === 'completed') {
      setError("Impossible de réinitialiser un match terminé");
      return;
    }

    try {
      setTime(0);
      onTimeUpdate(0);
      onTimerToggle(false);
      onStatusChange('scheduled');
      onBreakCountChange(0);
      setIsBreak(false);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Erreur lors de la réinitialisation");
    }
  };

  // Gérer le timer
  useEffect(() => {
    if (isRunning && !isBreak) {
      timerRef.current = setInterval(() => {
        setTime(prev => {
          const newTime = prev + 1;
          try {
            onTimeUpdate(newTime);
            return newTime;
          } catch (err) {
            console.error('Error updating time:', err);
            return prev;
          }
        });
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
  }, [isRunning, isBreak, onTimeUpdate]);

  // Synchroniser le temps initial
  useEffect(() => {
    try {
      // S'assurer que initialTime est un nombre valide
      const safeInitialTime = isNaN(initialTime) ? 0 : Math.max(0, initialTime);
      setTime(safeInitialTime);
      setError(null);
    } catch (err: any) {
      console.error('Error syncing initial time:', err);
      setError("Erreur de synchronisation du temps initial");
      setTime(0);
    }
  }, [initialTime]);

  // Vérifier l'état du match
  useEffect(() => {
    // Si le match est terminé, arrêter le timer
    if (match.status === 'completed' && isRunning) {
      onTimerToggle(false);
    }
  }, [match.status, isRunning, onTimerToggle]);

  return (
    <Card className="p-3">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Timer className="h-5 w-5" />
          Chronomètre
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Affichage du temps */}
        <div className="text-center">
          <Typography variant="h3" className="font-mono tracking-wider">
            {formatTime(time)}
          </Typography>
          <Typography variant="body-sm" theme="muted" className="mt-2">
            Durée du match
          </Typography>
        </div>

        {/* Message d'erreur */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle className="h-4 w-4" />
              <Typography variant="body-sm">{error}</Typography>
            </div>
          </div>
        )}

        {/* Contrôles */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={toggleTimer}
            variant={isRunning ? "destructive" : "default"}
            size="lg"
            className="gap-2"
            disabled={match.status === 'completed'}
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
            disabled={!isRunning || match.status === 'completed'}
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
          disabled={match.status === 'completed'}
        >
          <RotateCcw className="h-4 w-4" />
          Réinitialiser
        </Button>

        {/* Infos */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1">
              <Square className="h-3 w-3" />
              {breakCount} pause{breakCount > 1 ? 's' : ''}
            </Badge>
          </div>
          
          <div className="flex items-center gap-2">
            {isBreak && (
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
        </div>

        {/* Informations supplémentaires */}
        {(match.start_time || match.end_time) && (
          <div className="pt-3 border-t space-y-2">
            {match.start_time && (
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Début :</span>
                <span className="font-medium">{match.start_time.slice(0, 5)}</span>
              </div>
            )}
            {match.end_time && (
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Fin :</span>
                <span className="font-medium">{match.end_time.slice(0, 5)}</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}