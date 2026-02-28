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

// app/ad/sub-groups/[subGroupId]/matches/[matchId]/match-timer.tsx
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
  const {
    time,
    formattedTime,
    breakCount,
    isRunning,
    matchStatus, // ← Utiliser le statut métier
    startMatch,
    pauseMatch,
    resumeMatch,
    addMedicalBreak,
    completeMatch,
    resetMatch,
    syncWithDatabase
  } = useMatchTimer({
    initialDuration,
    initialBreakCount,
    initialStatus,
    onDurationChange: (seconds) => {
      if (!isRunning || matchStatus === 'completed') {
        onDurationSave?.(seconds);
      }
    },
    onBreakCountChange: onBreakCountSave,
    onStatusChange,
    onTimeChange
  });

  const canControl = !isSubGroupCompleted && matchStatus !== 'completed';
  const canStart = canControl && areBothFightersAssigned && 
                  (matchStatus === 'scheduled' || matchStatus === 'reclamation');
  const canPause = canControl && isRunning;
  const canResume = canControl && !isRunning && matchStatus === 'live';
  const canAddMedicalBreak = canControl && isRunning && matchStatus === 'live';

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

        {!areBothFightersAssigned && matchStatus === 'scheduled' && (
          <div className="p-2 bg-yellow-50 border border-yellow-200 rounded-md">
            <div className="flex items-center gap-2 text-yellow-700 text-xs">
              <AlertCircle className="h-3 w-3" />
              <span>Les deux lutteurs doivent être assignés pour démarrer</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          {matchStatus !== 'completed' ? (
            <>
              {!isRunning ? (
                matchStatus === 'live' ? (
                  <Button
                    onClick={resumeMatch}
                    variant="default"
                    size="lg"
                    className="gap-2"
                  >
                    <Play className="h-5 w-5" />
                    Reprendre
                  </Button>
                ) : (
                  <Button
                    onClick={startMatch}
                    variant="default"
                    size="lg"
                    className="gap-2"
                    disabled={!canStart}
                  >
                    <Play className="h-5 w-5" />
                    {matchStatus === 'scheduled' ? 'Démarrer' : 'Démarrer'}
                  </Button>
                )
              ) : (
                <Button
                  onClick={pauseMatch}
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
                onClick={addMedicalBreak}
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

        {matchStatus !== 'completed' && (
          <Button
            onClick={() => {
              resetMatch();
              onDurationSave?.(0);
              onBreakCountSave?.(0);
            }}
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

          {matchStatus === 'live' && isRunning && (
            <Badge variant="destructive" className="animate-pulse">
              🔴 EN DIRECT
            </Badge>
          )}
          {matchStatus === 'live' && !isRunning && (
            <Badge variant="destructive">
              ⏸️ EN PAUSE
            </Badge>
          )}
          {matchStatus === 'round_break' && (
            <Badge variant="destructive">
              ⏸️ PAUSE MÉDICALE
            </Badge>
          )}
          {matchStatus === 'completed' && (
            <Badge variant="secondary" className="bg-green-500 text-white">
              TERMINÉ
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
