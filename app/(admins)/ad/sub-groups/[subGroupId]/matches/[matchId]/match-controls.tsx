// app/ad/sub-groups/[subGroupId]/matches/[matchId]/match-controls.tsx
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
        return <Badge variant="destructive">⏸️ PAUSE</Badge>;
      case "completed":
        return (
          <Badge variant="secondary" className="bg-green-500 text-white">
            ✓ TERMINÉ
          </Badge>
        );
      case "scheduled":
        return <Badge variant="outline">📅 PROGRAMMÉ</Badge>;
      case "cancelled":
        return <Badge variant="destructive">✗ ANNULÉ</Badge>;
      case "postponed":
        return <Badge variant="secondary">⏳ REPORTÉ</Badge>;
      case "reclamation":
        return <Badge variant="destructive" className="bg-orange-500">⚠️ RÉCLAMATION</Badge>;
      default:
        return <Badge variant="outline">{match.status}</Badge>;
    }
  };

  const handleSaveNotes = () => {
    onUpdateMatch({ notes });
    toast.success("Notes sauvegardées");
  };

  const canModify = !isSubGroupCompleted;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Flag className="h-5 w-5" />
            Contrôles du match
          </CardTitle>
          {getStatusBadge()}
        </div>
      </CardHeader>

      <CardContent className="space-y-5 ">


        {/* Actions secondaires */}
        <div className="grid grid-cols-3 gap-3">
          {/* Actions de réclamation */}
          {/* <Dialog
            open={confirmDialog.isOpen && confirmDialog.type === "reclamation"}
            onOpenChange={(open) => setConfirmDialog({ isOpen: open, type: "reclamation" })}
          >
            <DialogTrigger asChild>
              <Button
                onClick={() => setConfirmDialog({ isOpen: true, type: "reclamation" })}
                variant="outline"
                className=" gap-2 border-orange-500 hover:bg-orange-50"
                disabled={!canModify || match.status === "completed"}
              >
                <Flag className="h-4 w-4 text-orange-600" />
                Réclamation
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Activer le mode réclamation</DialogTitle>
              </DialogHeader>
              <p>
                Le mode réclamation vous permet de modifier le résultat du match.
                Êtes-vous sûr de vouloir continuer ?
              </p>
              <DialogFooter>
                <Button variant="outline" onClick={() => setConfirmDialog({ isOpen: false, type: "reclamation" })}>
                  Annuler
                </Button>
                <Button onClick={onReclamation}>Confirmer</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog> */}
          <Button
            onClick={onReclamation}
            variant="outline"
            className=" gap-2 border-orange-500 hover:bg-orange-50"
            disabled={!canModify || match.status === "completed"}
          >
            <Flag className="h-4 w-4 text-orange-600" />
            Réclamation
          </Button>

          {/* Annuler */}
          {/* <Dialog
            open={confirmDialog.isOpen && confirmDialog.type === "cancel"}
            onOpenChange={(open) => setConfirmDialog({ isOpen: open, type: "cancel" })}
          >
            <DialogTrigger asChild>
              <Button
                onClick={() => setConfirmDialog({ isOpen: true, type: "cancel" })}
                variant="outline"
                className="gap-2 border-red-200 hover:bg-red-50"
                disabled={match.status !== "completed" && match.status !== "reclamation"}
              >
                <XCircle className="h-4 w-4 text-red-600" />
                Annuler
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Annuler le match</DialogTitle>
              </DialogHeader>
              <p>Êtes-vous sûr de vouloir annuler ce match ? Cette action est irréversible.</p>
              <DialogFooter>
                <Button variant="outline" onClick={() => setConfirmDialog({ isOpen: false, type: "cancel" })}>
                  Annuler
                </Button>
                <Button variant="destructive" onClick={onCancelMatch}>
                  Confirmer l'annulation
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog> */}

          <Button
            onClick={onCancelMatch}
            variant="outline"
            className="gap-2 border-red-200 hover:bg-red-50"
            disabled={match.status !== "completed" && match.status !== "reclamation"}
          >
            <XCircle className="h-4 w-4 text-red-600" />
            Annuler
          </Button>

          {/* Réinitialiser */}
          {/* <Dialog
            open={confirmDialog.isOpen && confirmDialog.type === "reset"}
            onOpenChange={(open) => setConfirmDialog({ isOpen: open, type: "reset" })}
          >
            <DialogTrigger asChild>
              <Button
                onClick={() => setConfirmDialog({ isOpen: true, type: "reset" })}
                variant="outline"
                className="gap-2"
                disabled={match.status !== "completed" && match.status !== "reclamation"}
              >
                <RotateCcw className="h-4 w-4" />
                Réinitialiser
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Réinitialiser le match</DialogTitle>
              </DialogHeader>
              <p>
                Êtes-vous sûr de vouloir réinitialiser le match ? Cette action va :
                <br />
                • Remettre le chrono à zéro
                <br />
                • Effacer le vainqueur
                <br />
                • Réinitialiser les compteurs
              </p>
              <DialogFooter>
                <Button variant="outline" onClick={() => setConfirmDialog({ isOpen: false, type: "reset" })}>
                  Annuler
                </Button>
                <Button variant="destructive" onClick={onResetMatch}>
                  Réinitialiser
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog> */}

          <Button
            onClick={onResetMatch}
            variant="outline"
            className="gap-2"
            disabled={match.status !== "completed" && match.status !== "reclamation"}
          >
            <RotateCcw className="h-4 w-4" />
            Réinitialiser
          </Button>
        </div>

        {/* Notes */}
        <div className="space-y-2 pt-2 border-t">
          <div className="flex items-center justify-between">
            <Label>Notes du match</Label>
            <Button
              onClick={handleSaveNotes}
              size="sm"
              variant="ghost"
              disabled={isSaving || !canModify}
            >
              <Save className="h-3 w-3" />
            </Button>
          </div>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notes, observations, incidents..."
            className="min-h-[80px] text-sm"
            disabled={isSaving || !canModify}
          />
        </div>

        {/* Message si sous-groupe terminé */}
        {isSubGroupCompleted && (
          <div className="bg-muted p-3 rounded-lg border">
            <Typography variant="body-sm" className="text-muted-foreground text-center">
              🔒 Ce sous-groupe est terminé. Aucune modification n'est possible.
            </Typography>
          </div>
        )}
      </CardContent>
    </Card>
  );
}