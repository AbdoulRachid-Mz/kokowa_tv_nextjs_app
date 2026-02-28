// app/ad/sub-groups/[subGroupId]/matches/[matchId]/match-controls.tsx
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Match } from "@/types";
import {
  CheckCircle,
  XCircle,
  Save,
  AlertTriangle,
  Users,
  RotateCcw,
  Flag
} from "lucide-react";
import { toast } from "sonner";

interface MatchControlsProps {
  match: Match;
  onUpdateMatch: (updates: Partial<Match>) => void;
  isSaving: boolean;
  isSubGroupCompleted: boolean;
  onResetMatch: () => void;
}

export function MatchControls({
  match,
  onUpdateMatch,
  isSaving,
  isSubGroupCompleted,
  onResetMatch
}: MatchControlsProps) {
  const [notes, setNotes] = useState(match.notes || "");
  const [isReclamationMode, setIsReclamationMode] = useState(false);

  // Synchroniser les notes
  useEffect(() => {
    setNotes(match.notes || "");
  }, [match.notes]);

  // Statut du match
  const getStatusBadge = () => {
    switch (match.status) {
      case 'live': 
        return <Badge variant="destructive" className="animate-pulse">🔴 EN DIRECT</Badge>;
      case 'round_break': 
        return <Badge variant="destructive">⏸️ PAUSE</Badge>;
      case 'completed': 
        return <Badge variant="secondary" className="bg-green-500 text-white">✓ TERMINÉ</Badge>;
      case 'scheduled': 
        return <Badge variant="outline">📅 PROGRAMMÉ</Badge>;
      case 'cancelled': 
        return <Badge variant="destructive">✗ ANNULÉ</Badge>;
      case 'postponed': 
        return <Badge variant="secondary">⏳ REPORTÉ</Badge>;
      case 'reclamation': 
        return <Badge variant="destructive" className="bg-orange-500">⚠️ RÉCLAMATION</Badge>;
      default: 
        return <Badge variant="outline">{match.status}</Badge>;
    }
  };

  // Activer le mode réclamation
  const handleReclamation = () => {
    setIsReclamationMode(true);
    onUpdateMatch({ status: 'reclamation' });
    toast.warning("Mode réclamation activé - Vous pouvez maintenant modifier le résultat");
  };

  // Annuler la réclamation et revenir à l'état précédent
  const handleCancelReclamation = () => {
    setIsReclamationMode(false);
    onUpdateMatch({ status: 'scheduled' });
    toast.info("Mode réclamation désactivé");
  };

  // Sauvegarder les modifications après réclamation
// app/ad/sub-groups/[subGroupId]/matches/[matchId]/match-controls.tsx
  const handleSaveReclamation = () => {
    setIsReclamationMode(false);
    // Remettre le statut à 'live' si on veut continuer le match
    // ou à 'completed' si on a modifié le résultat
    if (match.status === 'reclamation' && match.match_result) {
      onUpdateMatch({ status: 'completed' });
      toast.success("Résultat modifié et enregistré");
    } else {
      onUpdateMatch({ status: 'live' }); // ← Pour reprendre le match
      toast.success("Modifications enregistrées, match repris");
    }
  };

  // Annuler le match
  const handleCancelMatch = () => {
    if (window.confirm("Êtes-vous sûr de vouloir annuler ce match ?")) {
      onUpdateMatch({ status: 'cancelled' });
      toast.success("Match annulé");
    }
  };

  // Sauvegarder les notes
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
            <Users className="h-5 w-5" />
            Contrôles du match
          </CardTitle>
          {getStatusBadge()}
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Actions de réclamation */}
        <div className="space-y-3">
          {!isReclamationMode ? (
            <Button
              onClick={handleReclamation}
              variant="outline"
              className="w-full gap-2 border-orange-500 hover:bg-orange-50"
              disabled={!canModify || match.status === 'completed'}
            >
              <Flag className="h-4 w-4 text-orange-600" />
              Réclamation
            </Button>
          ) : (
            <div className="space-y-2">
              <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <Typography variant="body-sm" className="text-orange-700">
                  ⚠️ Mode réclamation actif - Vous pouvez modifier le résultat
                </Typography>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={handleSaveReclamation}
                  variant="default"
                  className="gap-2 bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="h-4 w-4" />
                  Valider
                </Button>
                <Button
                  onClick={handleCancelReclamation}
                  variant="outline"
                  className="gap-2"
                >
                  <XCircle className="h-4 w-4" />
                  Annuler
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Actions secondaires */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={handleCancelMatch}
            variant="outline"
            className="gap-2 border-red-200 hover:bg-red-50"
            disabled={!canModify || match.status === 'completed'}
          >
            <XCircle className="h-4 w-4 text-red-600" />
            Annuler
          </Button>

          <Button
            onClick={onResetMatch}
            variant="outline"
            className="gap-2"
            disabled={!canModify || match.status === 'completed'}
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
