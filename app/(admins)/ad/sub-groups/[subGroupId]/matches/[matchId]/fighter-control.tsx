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
import { Trophy, User, Users, Equal, Plus } from "lucide-react";
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
}: FighterControlProps) {
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [selectedFighterId, setSelectedFighterId] = useState<string>("");
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    type: "winner" | "draw" | "addCard";
  }>({
    isOpen: false,
    type: "winner",
  });

  const isWinner = !!match && match.winner_fighter_id === fighter?.id;
  const canModify = !isSubGroupCompleted && matchStatus !== "completed";
  const bothFightersAssigned = !!match && !!match.fighter1_id && !!match.fighter2_id;

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
    })
  };

  if (!fighter) {
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
                    {availableFighters.length > 0 ? (
                      availableFighters.map((f) => (
                        <SelectItem key={f.id} value={f.id.toString()}>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback>
                                {f.first_name[0]}
                                {f.last_name[0]}
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
                  <Button onClick={handleAssignFighter} className="flex-1">
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

  return (
    <Card
      className={`relative h-full ${isWinner ? "border-2 border-green-500 bg-green-50/50" : ""
        } ${isSubGroupCompleted ? "opacity-70" : ""}`}
    >
      <CardHeader className="pb-2">
        <div className="flex flex-col items-center text-center">
          <Avatar className="h-20 w-20 mb-2 border-2 border-primary/20">
            <AvatarImage src={fighter.profile_image} />
            <AvatarFallback className="text-lg">
              {fighter.first_name[0]}
              {fighter.last_name[0]}
            </AvatarFallback>
          </Avatar>
          <div>
            <Typography variant="h6" className="font-bold">
              {fighter.first_name} {fighter.last_name}
            </Typography>
            {fighter.nickname && (
              <Typography variant="body-sm" theme="muted" className="italic">
                "{fighter.nickname}"
              </Typography>
            )}
          </div>
          {isWinner && (
            <Badge variant="default" className="mt-2 bg-green-600 gap-1">
              <Trophy className="h-3 w-3" /> Vainqueur
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="grid grid-cols-3 gap-2">
          {/* Carton jaune */}
          <Button
            // onClick={handleAddCard}
            onClick={() => setConfirmDialog({ isOpen: true, type: "addCard" })}
            disabled={!canModify || matchStatus !== "live"}
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

          <Dialog open={confirmDialog.isOpen && confirmDialog.type === "addCard"} onOpenChange={(open) => setConfirmDialog({ isOpen: open, type: "addCard" })}>
            {/* <DialogTrigger asChild>
              <Button
                onClick={() => setConfirmDialog({ isOpen: true, type: "addCard" })}
                disabled={!canSetDraw || !canModify || matchStatus === "completed"}
                variant="outline"
                size="sm"
                className="flex flex-col items-center justify-center h-auto py-2 border-blue-500 hover:bg-blue-50"
              >
                <Equal className="h-4 w-4 text-blue-600 mb-1" />
                <span className="text-xs">Carton</span>
              </Button>
            </DialogTrigger> */}
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Confirmer le carton</DialogTitle>
              </DialogHeader>
              <p>Êtes-vous sûr de vouloir ajouter un carton ?</p>
              <DialogFooter>
                <Button variant="outline" onClick={() => setConfirmDialog({ isOpen: false, type: "addCard" })}>
                  Annuler
                </Button>
                <Button onClick={handleAddCard}>Confirmer</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Match nul */}
          <Dialog open={confirmDialog.isOpen && confirmDialog.type === "draw"} onOpenChange={(open) => setConfirmDialog({ isOpen: open, type: "draw" })}>
            <DialogTrigger asChild>
              <Button
                onClick={() => setConfirmDialog({ isOpen: true, type: "draw" })}
                disabled={matchStatus === "completed"}
                variant="outline"
                size="sm"
                className="flex flex-col items-center justify-center h-auto py-2 border-blue-500 hover:bg-blue-50"
              >
                <Equal className="h-4 w-4 text-blue-600 mb-1" />
                <span className="text-xs">Nul</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Confirmer le match nul</DialogTitle>
              </DialogHeader>
              <p>Êtes-vous sûr de vouloir déclarer ce match nul ?</p>
              <DialogFooter>
                <Button variant="outline" onClick={() => setConfirmDialog({ isOpen: false, type: "draw" })}>
                  Annuler
                </Button>
                <Button onClick={onSetDraw}>Confirmer</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Vainqueur */}
          <Dialog open={confirmDialog.isOpen && confirmDialog.type === "winner"} onOpenChange={(open) => setConfirmDialog({ isOpen: open, type: "winner" })}>
            <DialogTrigger asChild>
              <Button
                onClick={() => setConfirmDialog({ isOpen: true, type: "winner" })}
                disabled={matchStatus === "completed"}
                variant="outline"
                size="sm"
                className="flex flex-col items-center justify-center h-auto py-2 border-green-500 hover:bg-green-50"
              >
                <Trophy className="h-4 w-4 text-green-600 mb-1" />
                <span className="text-xs">Gagnant</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Confirmer la victoire</DialogTitle>
              </DialogHeader>
              <p>
                Êtes-vous sûr de vouloir désigner{" "}
                <strong>
                  {fighter.first_name} {fighter.last_name}
                </strong>{" "}
                comme vainqueur ?
              </p>
              <DialogFooter>
                <Button variant="outline" onClick={() => setConfirmDialog({ isOpen: false, type: "winner" })}>
                  Annuler
                </Button>
                <Button onClick={onCompleteWithWinner}>Confirmer</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

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
              🔒 Sous-groupe terminé
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}