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
import { Match, Referee, SubGroup } from "@/types";
import { assignMatchReferee, assignSubGroupReferee } from "@/actions/sub-group-referee";
import { getReferees } from "@/actions/referees";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { UserCheck, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface SubGroupRefereeManagerProps {
  subGroup?: SubGroup;
  match?: Match;
  currentMatchNumber?: number;
  phaseType?: string | null;
}

export function SubGroupRefereeManager({
  subGroup,
  match,
  currentMatchNumber,
  phaseType,
}: SubGroupRefereeManagerProps) {
  const queryClient = useQueryClient();
  const [selectedRefereeId, setSelectedRefereeId] = useState<string>("none");
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [pendingRefereeId, setPendingRefereeId] = useState<number | null>(null);

  // Déterminer si nous sommes en phase poule (group) ou éliminatoire / autre
  const isGroupPhase = phaseType === "group";

  // Arbitre actif :
  // - Pour les phases group : arbitre du sous-groupe (ou du match)
  // - Pour les autres phases : arbitre individuel du match (avec fallback sous-groupe si non défini)
  const effectiveRefereeId = isGroupPhase
    ? (subGroup?.main_referee_id ?? match?.referee_id ?? null)
    : (match?.referee_id ?? subGroup?.main_referee_id ?? null);

  // Charger la liste des arbitres actifs
  const { data: referees = [], isLoading: isLoadingReferees } = useQuery({
    queryKey: ["active-referees-list"],
    queryFn: async () => {
      const res = await getReferees({ is_active: true, limit: 100 });
      return res.data || [];
    },
  });

  // Mutation pour changer l'arbitre
  const assignMutation = useMutation({
    mutationFn: async (refereeId: number | null) => {
      if (isGroupPhase) {
        if (!subGroup?.id) throw new Error("Sous-groupe non trouvé");
        return await assignSubGroupReferee(subGroup.id, refereeId);
      } else {
        if (!match?.id) throw new Error("Match non trouvé");
        return await assignMatchReferee(match.id, refereeId);
      }
    },
    onSuccess: (data) => {
      toast.success(data.message);
      if (subGroup?.id) {
        queryClient.invalidateQueries({ queryKey: ["sub-group", subGroup.id] });
      }
      if (match?.id) {
        queryClient.invalidateQueries({ queryKey: ["match", match.id] });
      }
      queryClient.invalidateQueries({ queryKey: ["match"] });
      queryClient.invalidateQueries({ queryKey: ["phase-group-matches"] });
      setIsConfirmOpen(false);
      setPendingRefereeId(null);
    },
    onError: (err: any) => {
      toast.error(err.message || "Erreur lors du changement d'arbitre");
      setIsConfirmOpen(false);
      setPendingRefereeId(null);
    },
  });

  if (!subGroup && !match) return null;

  const currentReferee = referees.find((r) => r.id === effectiveRefereeId);
  const currentRefereeName = currentReferee
    ? `${currentReferee.first_name} ${currentReferee.last_name}${currentReferee.nickname ? ` (${currentReferee.nickname})` : ""}`
    : effectiveRefereeId
    ? `Arbitre #${effectiveRefereeId}`
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
                {isGroupPhase ? "Arbitre de la rencontre (Poule)" : "Arbitre du combat"}
              </CardTitle>
            </div>
            <div className="flex items-center gap-1.5">
              <Badge variant="outline" className="text-[10px]">
                {isGroupPhase ? "Affectation par rencontre" : "Affectation par match"}
              </Badge>
              {subGroup?.name && (
                <Badge variant="secondary" className="text-[10px]">
                  {subGroup.name}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-3.5 pt-1 space-y-3">
          <div className="p-2.5 rounded-lg bg-muted/40 border text-xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Arbitre assigné :</span>
              <span className="font-semibold">{currentRefereeName}</span>
            </div>
            <Typography variant="caption2" theme="muted" className="block text-[11px] leading-relaxed pt-1">
              {isGroupPhase ? (
                <>
                  ⚠️ <b>Phase de poule</b> : L'arbitre est affecté au sous-groupe (<code>{subGroup?.name}</code>). Tout changement s'appliquera automatiquement à <b>tous les matchs</b> de cette rencontre.
                </>
              ) : (
                <>
                  ℹ️ <b>Phase éliminatoire</b> : L'arbitre est affecté <b>directement à ce match</b>. La modification de cet arbitre ne modifie pas les autres matchs du même groupe.
                </>
              )}
            </Typography>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">
              {isGroupPhase
                ? "Modifier l'arbitre principal de la rencontre :"
                : "Modifier l'arbitre de ce combat :"}
            </label>
            <Select
              value={effectiveRefereeId ? effectiveRefereeId.toString() : "none"}
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

      {/* Dialogue de confirmation explicite avec message adapté selon la phase */}
      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className={`h-5 w-5 ${isGroupPhase ? "text-amber-500" : "text-primary"}`} />
              {isGroupPhase
                ? "Changement de l'arbitre de la rencontre"
                : `Affectation de l'arbitre du match #${currentMatchNumber || ""}`}
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2 text-sm pt-2">
              {isGroupPhase ? (
                <>
                  <p>
                    Vous êtes sur le point de modifier l'arbitre principal du sous-groupe <b>{subGroup?.name}</b>.
                  </p>
                  <p className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-md text-amber-800 dark:text-amber-300 text-xs font-medium">
                    En phase de poule, ce changement concerne <b>l'ensemble des combats de cette rencontre</b> et pas uniquement le combat #{currentMatchNumber || ""}.
                  </p>
                </>
              ) : (
                <>
                  <p>
                    Vous affectez un nouvel arbitre pour le <b>combat #{currentMatchNumber || ""}</b>.
                  </p>
                  <p className="p-2.5 bg-primary/10 border border-primary/20 rounded-md text-primary text-xs font-medium">
                    Cette affectation s'applique <b>uniquement à ce match</b> et ne modifie pas les autres combats du groupe.
                  </p>
                </>
              )}
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
              {isGroupPhase ? "Confirmer pour toute la rencontre" : "Confirmer pour ce match"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
