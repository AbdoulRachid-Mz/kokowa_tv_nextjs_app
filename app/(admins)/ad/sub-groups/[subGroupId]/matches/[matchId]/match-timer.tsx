// app/ad/sub-groups/[subGroupId]/matches/[matchId]/match-timer.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";
import { Badge } from "@/components/ui/badge";
import { Match } from "@/types";
import { Play, Pause, RotateCcw, Timer, Square } from "lucide-react";

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
  const timerRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Format HH:MM:SS
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Démarrer/arrêter le timer
  const toggleTimer = () => {
    const newRunningState = !isRunning;
    onTimerToggle(newRunningState);
  };

  // Ajouter une pause médicale
  const addMedicalBreak = () => {
    const newBreakCount = breakCount + 1;
    onBreakCountChange(newBreakCount);
    setIsBreak(true);
    onTimerToggle(false);
    onStatusChange('round_break');
    
    // Auto-reprise après 30 secondes
    setTimeout(() => {
      if (match.status === 'round_break') {
        setIsBreak(false);
        onTimerToggle(true);
        onStatusChange('live');
      }
    }, 30000);
  };

  // Réinitialiser le timer
  const resetTimer = () => {
    setTime(0);
    onTimeUpdate(0);
    onTimerToggle(false);
    onStatusChange('scheduled');
    onBreakCountChange(0);
  };

  // Gérer le timer
  useEffect(() => {
    if (isRunning && !isBreak) {
      timerRef.current = setInterval(() => {
        setTime(prev => {
          const newTime = prev + 1;
          onTimeUpdate(newTime);
          return newTime;
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }

    return () => clearInterval(timerRef.current);
  }, [isRunning, isBreak, onTimeUpdate]);

  // Synchroniser le temps initial
  useEffect(() => {
    setTime(initialTime);
  }, [initialTime]);

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

        {/* Contrôles */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={toggleTimer}
            variant={isRunning ? "destructive" : "default"}
            size="lg"
            className="gap-2"
          >
            {isRunning ? (
              <>
                <Pause className="h-5 w-5" />
                Pause
              </>
            ) : (
              <>
                <Play className="h-5 w-5" />
                Démarrer
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
          </div>
        </div>
      </CardContent>
    </Card>
  );
}