// app/ad/sub-groups/[subGroupId]/matches/[matchId]/fighter-control.tsx
"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Match, Fighter } from "@/types";
import { Trophy, User, Users, Equal, UserMinus, AlertCircle, Skull } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { useState } from "react";

interface FighterControlProps {
  fighter: Fighter | undefined;
  fighterType: "fighter1" | "fighter2";
  match: Match | undefined;
  onUpdateMatch: (updates: Partial<Match>) => void;
  onAddCard: (fighterId: number) => void;
  availableFighters: Fighter[];
  currentTime: number;
  yellowCardCount: number;
  isSubGroupCompleted: boolean;
  matchStatus: string;
  onCompleteWithWinner: () => void;
  onSetDraw: () => void;
  canSetWinner: boolean;
  canSetDraw: boolean;
  onReplaceFighter?: (fighterId: number, regionId: number) => void;
  onAskRemoveFighter?: (fighterId: number) => void;
  onAskReplaceFighter?: (fighterId: number) => void;
  onRemoveFighter?: (fighterId: number) => void;
}

export function FighterControl({
  fighter,
  fighterType,
  match,
  onUpdateMatch,
  onAddCard,
  availableFighters,
  currentTime,
  yellowCardCount,
  isSubGroupCompleted,
  matchStatus,
  onCompleteWithWinner,
  onSetDraw,
  canSetWinner,
  canSetDraw,
  onReplaceFighter,
  onAskRemoveFighter,
  onAskReplaceFighter,
  onRemoveFighter,
}: FighterControlProps) {
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [selectedFighterId, setSelectedFighterId] = useState<string>("");
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    type: "winner" | "draw" | "addCard" | "replaceFighter" | "removeFighter";
    fighterId?: number;
    regionId?: number;
  }>({
    isOpen: false,
    type: "winner",
  });

  const isFighterAssigned =
    fighterType === "fighter1"
      ? !!match?.fighter1_id
      : !!match?.fighter2_id;

  const isWinner = !!match && match.winner_fighter_id === fighter?.id;
  const isLoser = !!match && match.loser_fighter_id === fighter?.id;
  const canModify = !isSubGroupCompleted && matchStatus !== "completed";
  const canRemove = matchStatus !== "completed";
  const bothFightersAssigned = !!match && !!match.fighter1_id && !!match.fighter2_id;

  // Vérifier si l'autre lutteur est assigné
  const otherFighterAssigned = fighterType === "fighter1"
    ? !!match?.fighter2_id
    : !!match?.fighter1_id;

  // ✅ Obtenir le statut d'élimination du lutteur
  const getFighterEliminationStatus = () => {
    if (!fighter || !match) return null;

    const isFighter1 = fighterType === "fighter1";
    const initialEliminated = isFighter1
      ? match.fighter1_initial_state === 'eliminated'
      : match.fighter2_initial_state === 'eliminated';

    // Vérifier si le lutteur a été éliminé pendant le match
    const eliminatedInMatch = match.loser_fighter_id === fighter.id;

    return {
      initialEliminated,
      eliminatedInMatch,
      isEliminated: initialEliminated || eliminatedInMatch
    };
  };

  const eliminationStatus = getFighterEliminationStatus();

  const filteredAvailableFighters = availableFighters.filter(
    (f) =>
      f.id !== match?.fighter1_id &&
      f.id !== match?.fighter2_id
  );

  const handleAssignFighter = () => {
    if (!selectedFighterId) {
      toast.error("Veuillez sélectionner un lutteur");
      return;
    }

    const fighterId = parseInt(selectedFighterId);
    const updates: Partial<Match> = {};

    if (fighterType === "fighter1") {
      updates.fighter1_id = fighterId;
    } else {
      updates.fighter2_id = fighterId;
    }

    onUpdateMatch(updates);
    setIsAssignDialogOpen(false);
    setSelectedFighterId("");
    toast.success("Lutteur assigné avec succès");
  };

  const handleAddCard = () => {
    if (!fighter) {
      toast.error("Aucun lutteur assigné");
      return;
    }

    if (matchStatus !== "live") {
      toast.error("Le match doit être en cours");
      return;
    }

    onAddCard(fighter.id);
    setConfirmDialog({
      isOpen: false,
      type: "addCard"
    });
  };

  // Si aucun lutteur n'est assigné à cette position
  if (!isFighterAssigned) {
    return (
      <Card className="border-dashed border-2 hover:border-primary/50 transition-colors h-full">
        <CardHeader className="pb-2">
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-2">
              <User className="h-8 w-8 text-muted-foreground" />
            </div>
            <Typography variant="h6" weight="medium">
              Lutteur {fighterType === "fighter1" ? "1" : "2"}
            </Typography>
            <Typography variant="body-sm" theme="muted">
              À définir
            </Typography>
          </div>
        </CardHeader>
        <CardContent>
          <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="w-full gap-2"
                disabled={!canModify}
              >
                <Users className="h-4 w-4" />
                Assigner
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Assigner un lutteur</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <Select value={selectedFighterId} onValueChange={setSelectedFighterId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un lutteur" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredAvailableFighters.length > 0 ? (
                      filteredAvailableFighters.map((f) => (
                        <SelectItem key={f.id} value={f.id.toString()}>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback>
                                {f.first_name?.charAt(0) ?? "?"}
                                {f.last_name?.charAt(0) ?? ""}
                              </AvatarFallback>
                            </Avatar>
                            <span>
                              {f.first_name} {f.last_name}
                            </span>
                            {f.nickname && (
                              <span className="text-xs text-muted-foreground">
                                "{f.nickname}"
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      ))
                    ) : (
                      <div className="p-2 text-center text-muted-foreground">
                        Aucun lutteur disponible
                      </div>
                    )}
                  </SelectContent>
                </Select>
                <div className="flex gap-2">
                  <Button
                    onClick={handleAssignFighter}
                    className="flex-1"
                    disabled={!selectedFighterId}
                  >
                    Assigner
                  </Button>
                  <Button onClick={() => setIsAssignDialogOpen(false)} variant="outline">
                    Annuler
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    );
  }

  // Si un lutteur est assigné, on affiche sa carte
  return (
    <Card
      className={`relative h-full ${isWinner ? "border-2 border-green-500 bg-green-50/50" : ""
        } ${isLoser ? "border-2 border-red-500 bg-red-50/50" : ""
        } ${eliminationStatus?.isEliminated ? "opacity-80" : ""
        } ${isSubGroupCompleted ? "opacity-70" : ""}`}
    >
      <CardHeader className="pb-2">
        <div className="flex flex-col items-center text-center">
          <Avatar className="h-20 w-20 mb-2 border-2 border-primary/20">
            <AvatarImage src={fighter?.profile_image} />
            <AvatarFallback className="text-lg">
              {fighter?.first_name?.charAt(0) ?? "?"}
              {fighter?.last_name?.charAt(0) ?? ""}
            </AvatarFallback>
          </Avatar>
          <div>
            <Typography variant="h6" className="font-bold">
              {fighter?.first_name} {fighter?.last_name}
            </Typography>
            {fighter?.nickname && (
              <Typography variant="body-sm" theme="muted" className="italic">
                "{fighter.nickname}"
              </Typography>
            )}
          </div>

          {/* ✅ Badges de statut */}
          <div className="flex flex-wrap gap-1 mt-2 justify-center">
            {isWinner && (
              <Badge variant="default" className="bg-green-600 gap-1">
                <Trophy className="h-3 w-3" /> Vainqueur
              </Badge>
            )}

            {isLoser && (
              <Badge variant="destructive" className="gap-1">
                <Skull className="h-3 w-3" /> Terrassé
              </Badge>
            )}

            {eliminationStatus?.initialEliminated && !isLoser && (
              <Badge variant="destructive" className="gap-1 bg-orange-600">
                <AlertCircle className="h-3 w-3" /> terrassé
              </Badge>
            )}

          </div>
        </div>

        {/* buttons remove and replace */}
        <div className="absolute top-2 right-2 flex gap-1">
          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              if (fighter?.id) {
                onAskRemoveFighter?.(fighter.id);
              }
            }}
            disabled={!canRemove}
          >
            <Typography hasTooltip={true} tooltipContent="retirer ce lutteur">
              <UserMinus className="h-4 w-4" />
            </Typography>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (fighter?.id) {
                onAskReplaceFighter?.(fighter.id);
              }
            }}
            disabled={!canRemove}
          >
            <Typography hasTooltip={true} tooltipContent="remplacer ce lutteur">
              <Users className="h-4 w-4" />
            </Typography>
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="grid grid-cols-3 gap-2">
          {/* Carton jaune */}
          <Dialog open={confirmDialog.isOpen && confirmDialog.type === "addCard"} onOpenChange={(open) => setConfirmDialog({ isOpen: open, type: "addCard" })}>
            <DialogTrigger asChild>
              <Button
                disabled={!canModify || matchStatus !== "live" || eliminationStatus?.isEliminated}
                variant="outline"
                size="sm"
                className="flex relative flex-col items-center justify-center h-auto py-2 border-yellow-500 hover:bg-yellow-50"
              >
                <div className="w-4 h-4 bg-yellow-500 rounded-full mb-1" />
                <span className="text-xs">Jaune</span>
                {yellowCardCount > 0 && (
                  <Badge variant="secondary" className="absolute -top-2 -right-2 px-1.5 py-0 text-[10px]">
                    {yellowCardCount}
                  </Badge>
                )}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Confirmer le carton jaune</DialogTitle>
              </DialogHeader>
              <p>
                Êtes-vous sûr de vouloir donner un carton jaune à{" "}
                <strong>
                  {fighter?.first_name} {fighter?.last_name}
                </strong>{" "}
                ?
              </p>
              <DialogFooter>
                <Button variant="outline" onClick={() => setConfirmDialog({ isOpen: false, type: "addCard" })}>
                  Annuler
                </Button>
                <Button onClick={handleAddCard}>Confirmer</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Match nul - désactivé si l'autre lutteur n'est pas assigné */}
          <Button
            disabled={matchStatus === "completed" || !canSetDraw || !otherFighterAssigned || eliminationStatus?.isEliminated}
            variant="outline"
            onClick={onSetDraw}
            size="sm"
            className={`flex flex-col items-center justify-center h-auto py-2 border-blue-500 hover:bg-blue-50 ${!otherFighterAssigned ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            title={!otherFighterAssigned ? "Match nul impossible sans adversaire" : ""}
          >
            <Equal className="h-4 w-4 text-blue-600 mb-1" />
            <span className="text-xs">Nul</span>
          </Button>

          {/* Vainqueur */}
          <Button
            onClick={onCompleteWithWinner}
            disabled={matchStatus === "completed"}
            variant="outline"
            size="sm"
            className="flex flex-col items-center justify-center h-auto py-2 border-green-500 hover:bg-green-50"
          >
            <Trophy className="h-4 w-4 text-green-600 mb-1" />
            <span className="text-xs">Gagnant</span>
          </Button>
        </div>

        {/* ✅ Message d'information pour victoire par forfait */}
        {!otherFighterAssigned && matchStatus !== "completed" && (
          <div className="text-center pt-2 border-t border-dashed">
            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 gap-1">
              <AlertCircle className="h-3 w-3" />
              Victoire = repos obtenu
            </Badge>
          </div>
        )}

        {/* Badge de statut */}
        {matchStatus === "completed" && (
          <div className="text-center pt-2 border-t">
            <Badge variant="secondary" className="bg-green-100 text-green-700">
              ✓ Match terminé
            </Badge>
          </div>
        )}

        {isSubGroupCompleted && (
          <div className="text-center">
            <Badge variant="outline" className="text-muted-foreground">
              🔒 Rencontre terminée
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}