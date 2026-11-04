// app/(admins)/ad/matches/[matchId]/sub-group-referee-manager.tsx
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Referee, SubGroup } from "@/types";
import { assignSubGroupReferee } from "@/actions/sub-group-referee";
import { getReferees } from "@/actions/referees";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { UserCheck, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface SubGroupRefereeManagerProps {
  subGroup?: SubGroup;
  currentMatchNumber?: number;
}

export function SubGroupRefereeManager({
  subGroup,
  currentMatchNumber,
}: SubGroupRefereeManagerProps) {
  const queryClient = useQueryClient();
  const [selectedRefereeId, setSelectedRefereeId] = useState<string>("none");
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [pendingRefereeId, setPendingRefereeId] = useState<number | null>(null);

  // Charger la liste des arbitres actifs
  const { data: referees = [], isLoading: isLoadingReferees } = useQuery({
    queryKey: ["active-referees-list"],
    queryFn: async () => {
      const res = await getReferees({ is_active: true, limit: 100 });
      return res.data || [];
    },
  });

  // Mutation pour changer l'arbitre du sous-groupe
  const assignMutation = useMutation({
    mutationFn: async (refereeId: number | null) => {
      if (!subGroup?.id) throw new Error("Sous-groupe non trouvé");
      return await assignSubGroupReferee(subGroup.id, refereeId);
    },
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: ["sub-group", subGroup?.id] });
      queryClient.invalidateQueries({ queryKey: ["match"] });
      setIsConfirmOpen(false);
      setPendingRefereeId(null);
    },
    onError: (err: any) => {
      toast.error(err.message || "Erreur lors du changement d'arbitre");
      setIsConfirmOpen(false);
      setPendingRefereeId(null);
    },
  });

  if (!subGroup) return null;

  const currentReferee = referees.find((r) => r.id === subGroup.main_referee_id);
  const currentRefereeName = currentReferee
    ? `${currentReferee.first_name} ${currentReferee.last_name}${currentReferee.nickname ? ` (${currentReferee.nickname})` : ""}`
    : subGroup.main_referee_id
    ? `Arbitre #${subGroup.main_referee_id}`
    : "Aucun arbitre désigné";

  const handleSelectChange = (value: string) => {
    setSelectedRefereeId(value);
    const newId = value === "none" ? null : parseInt(value);
    setPendingRefereeId(newId);
    setIsConfirmOpen(true);
  };

  const confirmAssignment = () => {
    assignMutation.mutate(pendingRefereeId);
  };

  return (
    <>
      <Card className="border border-border/60 shadow-sm bg-card">
        <CardHeader className="p-3.5 pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-primary/10 text-primary rounded-md">
                <UserCheck className="h-4 w-4" />
              </div>
              <CardTitle className="text-sm font-semibold">
                Arbitre de la rencontre
              </CardTitle>
            </div>
            <Badge variant="outline" className="text-[10px]">
              {subGroup.name}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-3.5 pt-1 space-y-3">
          <div className="p-2.5 rounded-lg bg-muted/40 border text-xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Arbitre actuel :</span>
              <span className="font-semibold">{currentRefereeName}</span>
            </div>
            <Typography variant="caption2" theme="muted" className="block text-[11px] leading-relaxed pt-1">
              ⚠️ <b>Architecture Kokowa TV</b> : L'arbitre est affecté à la rencontre globale ({subGroup.name}). Tout changement s'appliquera à tous les combats de cette rencontre.
            </Typography>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">
              Modifier l'arbitre principal de la rencontre :
            </label>
            <Select
              value={
                subGroup.main_referee_id
                  ? subGroup.main_referee_id.toString()
                  : "none"
              }
              onValueChange={handleSelectChange}
              disabled={assignMutation.isPending || isLoadingReferees}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Choisir un arbitre" />
              </SelectTrigger>
              <SelectContent className="max-h-[220px]">
                <SelectItem value="none">-- Aucun arbitre assigné --</SelectItem>
                {referees.map((r) => (
                  <SelectItem key={r.id} value={r.id.toString()}>
                    {r.first_name} {r.last_name}
                    {r.nickname ? ` (${r.nickname})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Dialogue de confirmation explicite : impact sur l'ensemble de la rencontre */}
      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              Changement de l'arbitre de la rencontre
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2 text-sm pt-2">
              <p>
                Vous êtes sur le point de modifier l'arbitre principal du sous-groupe <b>{subGroup.name}</b>.
              </p>
              <p className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-md text-amber-800 dark:text-amber-300 text-xs font-medium">
                Conformément aux règles de la lutte traditionnelle au Niger, ce changement concerne <b>l'ensemble des combats de cette rencontre</b> et pas uniquement le combat #{currentMatchNumber || ""}.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={assignMutation.isPending}
              onClick={() => {
                setIsConfirmOpen(false);
                setPendingRefereeId(null);
              }}
            >
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmAssignment}
              disabled={assignMutation.isPending}
              className="gap-2"
            >
              {assignMutation.isPending && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              Confirmer pour toute la rencontre
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
