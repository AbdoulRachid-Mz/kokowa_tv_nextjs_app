// components/matches/cancel-last-card-button.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cancelLastFighterCard } from "@/actions/matches-2";
import { toast } from "sonner";
import { RotateCcw } from "lucide-react";

interface CancelLastCardButtonProps {
  matchId: number;
  lastCard: any | null;
  onDone?: () => void;
}

export function CancelLastCardButton({ matchId, lastCard, onDone }: CancelLastCardButtonProps) {
  const [loading, setLoading] = useState(false);

  if (!lastCard) return null;

  const handleCancel = async () => {
    setLoading(true);
    try {
      await cancelLastFighterCard(matchId, lastCard.fighter_id);
      toast.success("Carton annulé avec succès");
      onDone?.();
    } catch (e: any) {
      toast.error(e?.message || "Erreur lors de l'annulation du carton");
    } finally {
      setLoading(false);
    }
  };

  const isRed = lastCard.card_type === "red";

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Badge variant={isRed ? "destructive" : "secondary"} className="gap-1">
            {isRed ? "R" : "J"}
          </Badge>
          Annuler le dernier carton
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Annuler le dernier carton ?</AlertDialogTitle>
          <AlertDialogDescription>
            Le dernier carton ({isRed ? "rouge" : "jaune"}) donné à{" "}
            {lastCard.fighter?.first_name} {lastCard.fighter?.last_name} sera
            annulé. Cette action est irréversible.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Annuler</AlertDialogCancel>
          <AlertDialogAction onClick={handleCancel} disabled={loading}>
            {loading ? "Annulation..." : "Confirmer"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
