// app/ad/sub-groups/[subGroupId]/matches/[matchId]/match-timer.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";
import { Badge } from "@/components/ui/badge";
import { Play, Pause, RotateCcw, Timer, Square, AlertCircle } from "lucide-react";
import { useMatchTimer } from "@/hooks/use-match-timer";
import { useEffect, useState } from "react";

interface MatchTimerProps {
  matchId: number;
  initialDuration?: string;
  initialBreakCount?: number;
  initialStatus?: string;
  isSubGroupCompleted: boolean;
  areBothFightersAssigned: boolean;
  onMatchStart?: () => void;
  onMatchComplete?: (result: any) => void;
  onDurationSave?: (seconds: number) => void;
  onBreakCountSave?: (count: number) => void;
  onStatusChange?: (status: string) => void;
  onTimeChange?: (seconds: number) => void;
}

export function MatchTimer({
  matchId,
  initialDuration,
  initialBreakCount = 0,
  initialStatus = 'scheduled',
  isSubGroupCompleted,
  areBothFightersAssigned,
  onMatchStart,
  onMatchComplete,
  onDurationSave,
  onBreakCountSave,
  onStatusChange,
  onTimeChange
}: MatchTimerProps) {
  // Utiliser un state local pour éviter les réinitialisations intempestives
  const [localDuration, setLocalDuration] = useState(initialDuration);
  const [localBreakCount, setLocalBreakCount] = useState(initialBreakCount);
  const [localStatus, setLocalStatus] = useState(initialStatus);

  const {
    time,
    formattedTime,
    breakCount,
    isRunning,
    status,
    startMatch,
    pauseMatch,
    addMedicalBreak,
    completeMatch,
    resetMatch,
    syncWithDatabase
  } = useMatchTimer({
    initialDuration: localDuration,
    initialBreakCount: localBreakCount,
    initialStatus: localStatus,
    onDurationChange: (seconds) => {
      // Sauvegarder seulement à des moments clés
      if (!isRunning || status === 'completed') {
        onDurationSave?.(seconds);
      }
    },
    onBreakCountChange: onBreakCountSave,
    onStatusChange: (newStatus) => {
      setLocalStatus(newStatus);
      onStatusChange?.(newStatus);
    },
    onTimeChange
  });

  // Mettre à jour les props locales quand les props initiales changent
  useEffect(() => {
    setLocalDuration(initialDuration);
    setLocalBreakCount(initialBreakCount);
    setLocalStatus(initialStatus);
  }, [initialDuration, initialBreakCount, initialStatus, syncWithDatabase]);

  const canControl = !isSubGroupCompleted && status !== 'completed';
  const canStart = canControl && areBothFightersAssigned && status !== 'live';
  const canPause = canControl && isRunning;
  const canAddMedicalBreak = canControl && isRunning && status === 'live';

  const handleStart = () => {
    startMatch();
    onMatchStart?.();

    // Sauvegarder immédiatement
    onDurationSave?.(time);
  };

  const handlePause = () => {
    pauseMatch();
    // Sauvegarder la durée à la pause
    onDurationSave?.(time);
  };

  const handleMedicalBreak = () => {
    addMedicalBreak();
    // La durée est sauvegardée dans le hook
  };

  const handleReset = () => {
    resetMatch();
    onDurationSave?.(0);
    onBreakCountSave?.(0);
  };

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
            {formattedTime}
          </Typography>
          <Typography variant="body-sm" theme="muted" className="mt-1">
            Durée du match
          </Typography>
        </div>

        {!areBothFightersAssigned && status === 'scheduled' && (
          <div className="p-2 bg-yellow-50 border border-yellow-200 rounded-md">
            <div className="flex items-center gap-2 text-yellow-700 text-xs">
              <AlertCircle className="h-3 w-3" />
              <span>Les deux lutteurs doivent être assignés pour démarrer</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          {status !== 'completed' ? (
            <>
              {!isRunning ? (
                <Button
                  onClick={handleStart}
                  variant="default"
                  size="lg"
                  className="gap-2"
                  disabled={!canStart}
                >
                  <Play className="h-5 w-5" />
                  {status === 'scheduled' ? 'Démarrer' : 'Reprendre'}
                </Button>
              ) : (
                <Button
                  onClick={handlePause}
                  variant="destructive"
                  size="lg"
                  className="gap-2"
                  disabled={!canPause}
                >
                  <Pause className="h-5 w-5" />
                  Pause
                </Button>
              )}

              <Button
                onClick={handleMedicalBreak}
                variant="outline"
                size="lg"
                className="gap-2"
                disabled={!canAddMedicalBreak}
              >
                <Square className="h-5 w-5" />
                Pause médicale
              </Button>
            </>
          ) : (
            <Button
              variant="secondary"
              size="lg"
              className="col-span-2 gap-2 bg-green-500 text-white hover:bg-green-600"
              disabled
            >
              ✓ Match terminé
            </Button>
          )}
        </div>

        {status !== 'completed' && (
          <Button
            onClick={handleReset}
            variant="ghost"
            size="sm"
            className="w-full gap-2"
            disabled={!canControl}
          >
            <RotateCcw className="h-4 w-4" />
            Réinitialiser
          </Button>
        )}

        <div className="flex items-center justify-between pt-2 border-t">
          <Badge variant="outline" className="gap-1">
            <Square className="h-3 w-3" />
            {breakCount} pause{breakCount > 1 ? 's' : ''}
          </Badge>

          {status === 'live' && (
            <Badge variant="destructive" className="animate-pulse">
              🔴 EN DIRECT
            </Badge>
          )}

          {status === 'round_break' && (
            <Badge variant="destructive">
              ⏸️ PAUSE
            </Badge>
          )}

          {status === 'completed' && (
            <Badge variant="secondary" className="bg-green-500 text-white">
              TERMINÉ
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
