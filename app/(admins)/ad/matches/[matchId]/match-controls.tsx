// app/(admins)/ad/matches/[matchId]/match-controls.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Match } from "@/types";
import { XCircle, RotateCcw, Flag, Save } from "lucide-react";
import { toast } from "sonner";
import { useState, useEffect } from "react";

interface MatchControlsProps {
  match: Match;
  onUpdateMatch: (updates: Partial<Match>) => void;
  isSaving: boolean;
  isSubGroupCompleted: boolean;
  onResetMatch: () => void;
  onReclamation: () => void;
  onCancelMatch: () => void;
}

export function MatchControls({
  match,
  onUpdateMatch,
  isSaving,
  isSubGroupCompleted,
  onResetMatch,
  onReclamation,
  onCancelMatch,
}: MatchControlsProps) {
  const [notes, setNotes] = useState(match.notes || "");
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    type: "reclamation" | "cancel" | "reset";
  }>({
    isOpen: false,
    type: "reclamation",
  });

  useEffect(() => {
    setNotes(match.notes || "");
  }, [match.notes]);

  const getStatusBadge = () => {
    switch (match.status) {
      case "live":
        return (
          <Badge variant="destructive" className="animate-pulse">
            🔴 EN DIRECT
          </Badge>
        );
      case "round_break":
        return (
          <Badge
            variant="outline"
            className="border-yellow-500 text-yellow-600 bg-yellow-50"
          >
            ⏸️ PAUSE
          </Badge>
        );
      case "reclamation":
        return (
          <Badge
            variant="outline"
            className="border-purple-500 text-purple-600 bg-purple-50"
          >
            ⚖️ RÉCLAMATION
          </Badge>
        );
      case "completed":
        return (
          <Badge
            variant="outline"
            className="border-green-500 text-green-600 bg-green-50"
          >
            ✓ TERMINÉ
          </Badge>
        );
      case "cancelled":
        return (
          <Badge
            variant="outline"
            className="border-red-500 text-red-600 bg-red-50"
          >
            ✗ ANNULÉ
          </Badge>
        );
      case "scheduled":
      default:
        return (
          <Badge
            variant="outline"
            className="border-blue-500 text-blue-600 bg-blue-50"
          >
            📅 PROGRAMMÉ
          </Badge>
        );
    }
  };

  const handleSaveNotes = () => {
    onUpdateMatch({ notes });
    toast.success("Notes sauvegardées");
  };

  const handleAction = (type: "reclamation" | "cancel" | "reset") => {
    setConfirmDialog({
      isOpen: true,
      type,
    });
  };

  const confirmAction = () => {
    switch (confirmDialog.type) {
      case "reclamation":
        onReclamation();
        toast.info("Mode réclamation activé");
        break;
      case "cancel":
        onCancelMatch();
        toast.warning("Match annulé");
        break;
      case "reset":
        onResetMatch();
        toast.info("Match réinitialisé");
        break;
    }
    setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <CardTitle className="text-base flex items-center gap-2">
              Statut et Contrôles
            </CardTitle>
            {getStatusBadge()}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Actions rapides */}
          <div className="grid grid-cols-3 gap-2">
            {/* Mode Réclamation */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAction("reclamation")}
              disabled={
                match.status !== "live" && match.status !== "round_break"
              }
              className="gap-1 border-purple-500 hover:bg-purple-50 text-purple-700"
            >
              <Flag className="h-4 w-4" />
              Réclamation
            </Button>

            {/* Annuler le match */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAction("cancel")}
              disabled={match.status === "completed" || isSubGroupCompleted}
              className="gap-1 border-red-500 hover:bg-red-50 text-red-700"
            >
              <XCircle className="h-4 w-4" />
              Annuler
            </Button>

            {/* Réinitialiser le match */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAction("reset")}
              disabled={isSubGroupCompleted}
              className="gap-1 border-gray-500 hover:bg-gray-50 text-gray-700"
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </Button>
          </div>

          {/* Notes du match */}
          <div className="space-y-2 pt-2 border-t">
            <div className="flex justify-between items-center">
              <Label htmlFor="match-notes" className="text-xs">
                Notes du match
              </Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSaveNotes}
                disabled={isSaving || notes === match.notes}
                className="h-7 text-xs gap-1"
              >
                <Save className="h-3 w-3" />
                Enregistrer
              </Button>
            </div>
            <Textarea
              id="match-notes"
              placeholder="Ajouter des notes sur le combat (ex: contestation, décision arbitrale, blessure...)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[80px] text-xs resize-none"
              disabled={isSubGroupCompleted}
            />
          </div>

          {/* Informations complémentaires */}
          <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t">
            {match.start_time && (
              <div className="flex justify-between">
                <span>Heure de début :</span>
                <span className="font-mono">{match.start_time}</span>
              </div>
            )}
            {match.end_time && (
              <div className="flex justify-between">
                <span>Heure de fin :</span>
                <span className="font-mono">{match.end_time}</span>
              </div>
            )}
            {match.total_duration && (
              <div className="flex justify-between">
                <span>Durée totale :</span>
                <span className="font-mono">{match.total_duration}</span>
              </div>
            )}
            {match.break_count !== undefined && match.break_count > 0 && (
              <div className="flex justify-between">
                <span>Nombre de pauses :</span>
                <span>{match.break_count}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dialog de confirmation */}
      <Dialog
        open={confirmDialog.isOpen}
        onOpenChange={(open) =>
          setConfirmDialog((prev) => ({ ...prev, isOpen: open }))
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirmDialog.type === "reclamation" && "Activer le mode réclamation"}
              {confirmDialog.type === "cancel" && "Annuler le match"}
              {confirmDialog.type === "reset" && "Réinitialiser le match"}
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {confirmDialog.type === "reclamation" &&
              "Le chronomètre sera mis en pause et le statut passera à 'reclamation'. Les arbitres pourront examiner la situation."}
            {confirmDialog.type === "cancel" &&
              "Le match sera marqué comme annulé. Aucun vainqueur ne sera désigné et les points ne seront pas attribués."}
            {confirmDialog.type === "reset" &&
              "Le match sera remis à zéro : statut 'programmé', chronomètre remis à zéro, vainqueur et cartons supprimés. Cette action est irréversible."}
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                setConfirmDialog((prev) => ({ ...prev, isOpen: false }))
              }
            >
              Annuler
            </Button>
            <Button
              variant={confirmDialog.type === "reset" ? "destructive" : "default"}
              onClick={confirmAction}
            >
              Confirmer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
