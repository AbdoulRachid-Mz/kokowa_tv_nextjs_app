// app/ad/sub-groups/[subGroupId]/matches/[matchId]/match-timer.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Play, Pause, Timer, AlertCircle } from "lucide-react";
import { useEffect, useState, useRef } from "react";

interface MatchTimerProps {
  matchId: number;
  formattedTime: string;
  breakCount: number;
  isRunning: boolean;
  matchStatus: string;
  isSubGroupCompleted: boolean;
  areBothFightersAssigned: boolean;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  canStart: boolean;
  canPause: boolean;
  canResume: boolean;
}

export function MatchTimer({
  formattedTime: externalFormattedTime,
  breakCount,
  isRunning: externalIsRunning,
  matchStatus,
  isSubGroupCompleted,
  areBothFightersAssigned,
  onStart,
  onPause,
  onResume,
  canStart,
  canPause,
  canResume,
}: MatchTimerProps) {
  const [showStartDialog, setShowStartDialog] = useState(false);
  // État local pour éviter les à-coups d’affichage
  const [displayTime, setDisplayTime] = useState(externalFormattedTime);
  const prevStatusRef = useRef(matchStatus);

  // Synchroniser l’affichage avec la prop externe (venant du controller)
  useEffect(() => {
    setDisplayTime(externalFormattedTime);
  }, [externalFormattedTime]);

  // Détecter les changements de statut pour forcer un arrêt local si nécessaire
  useEffect(() => {
    if (prevStatusRef.current !== matchStatus) {
      // Si le statut devient "completed" ou "scheduled" alors que le timer tournait,
      // le controller devrait déjà avoir arrêté, mais on peut émettre un avertissement
      if (
        (matchStatus === "completed" || matchStatus === "scheduled") &&
        externalIsRunning
      ) {
        console.warn("Timer running but match status is", matchStatus);
        onPause(); // sécurité
      }
      prevStatusRef.current = matchStatus;
    }
  }, [matchStatus, externalIsRunning, onPause]);

  const handleStartClick = () => {
    if (displayTime === "00:00:00") {
      setShowStartDialog(true);
    } else {
      onStart();
    }
  };

  const handleConfirmStart = () => {
    onStart();
    setShowStartDialog(false);
  };

  return (
    <>
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
            <Typography
              variant="h2"
              className="font-mono tracking-wider text-3xl font-bold"
            >
              {displayTime}
            </Typography>
            <Typography variant="body-sm" theme="muted" className="mt-1">
              Durée du match
            </Typography>
          </div>

          {!areBothFightersAssigned && matchStatus === "scheduled" && (
            <div className="p-2 bg-yellow-50 border border-yellow-200 rounded-md">
              <div className="flex items-center gap-2 text-yellow-700 text-xs">
                <AlertCircle className="h-3 w-3" />
                <span>Les deux lutteurs doivent être assignés pour démarrer</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-3">
            {matchStatus === "scheduled" && (
              <Button
                onClick={handleStartClick}
                size="lg"
                className="gap-2 w-full"
                disabled={!canStart || isSubGroupCompleted}
              >
                <Play className="h-5 w-5" />
                Démarrer
              </Button>
            )}

            {matchStatus === "live" && (
              <Button
                onClick={onPause}
                variant="destructive"
                size="lg"
                className="gap-2 w-full"
                disabled={!canPause || isSubGroupCompleted}
              >
                <Pause className="h-5 w-5" />
                Pause
              </Button>
            )}

            {(matchStatus === "round_break" || matchStatus === "reclamation") && (
              <Button
                onClick={onResume}
                size="lg"
                className="gap-2 w-full"
                disabled={!canResume || isSubGroupCompleted}
              >
                <Play className="h-5 w-5" />
                Reprendre
              </Button>
            )}

            {matchStatus === "completed" && (
              <Button
                variant="secondary"
                size="lg"
                className="gap-2 w-full bg-green-500 text-white"
                disabled
              >
                ✓ Match terminé
              </Button>
            )}
          </div>

          <div className="flex items-center justify-between pt-2 border-t">
            <Badge variant="outline" className="gap-1">
              <Pause className="h-3 w-3" />
              {breakCount} pause{breakCount > 1 ? "s" : ""}
            </Badge>

            {matchStatus === "live" && (
              <Badge variant="destructive" className="animate-pulse">
                🔴 EN DIRECT
              </Badge>
            )}
            {matchStatus === "reclamation" && (
              <Badge variant="destructive">⏸️ EN RÉCLAMATION</Badge>
            )}
            {matchStatus === "round_break" && (
              <Badge variant="default">⏸️ PAUSE</Badge>
            )}
            {matchStatus === "completed" && (
              <Badge variant="secondary" className="bg-green-500 text-white">
                TERMINÉ
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={showStartDialog} onOpenChange={setShowStartDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Démarrer le match</DialogTitle>
          </DialogHeader>
          <p>Êtes-vous sûr de vouloir démarrer le match ?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStartDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleConfirmStart}>Confirmer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}