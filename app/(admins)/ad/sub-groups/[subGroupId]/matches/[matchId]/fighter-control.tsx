// app/ad/sub-groups/[subGroupId]/matches/[matchId]/fighter-control.tsx
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Match, Fighter } from "@/types";
import { Trophy, User, Users, Equal, AlertCircle, Plus } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";

interface FighterControlProps {
  fighter: Fighter | undefined;
  fighterType: "fighter1" | "fighter2";
  match: Match;
  onUpdateMatch: (updates: Partial<Match>) => void;
  onAddCard: (fighterId: number) => void;
  availableFighters: Fighter[];
  currentTime: number;
  yellowCardCount: number;
  isSubGroupCompleted: boolean;
  matchStatus: string;
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
  matchStatus
}: FighterControlProps) {
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [selectedFighterId, setSelectedFighterId] = useState<string>("");
  const [isSettingWinner, setIsSettingWinner] = useState(false);
  const [isSettingDraw, setIsSettingDraw] = useState(false);

  const isWinner = match.winner_fighter_id === fighter?.id;
  const canModify = !isSubGroupCompleted && matchStatus !== 'completed';
  const bothFightersAssigned = match.fighter1_id && match.fighter2_id;

  // Format time
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Assigner un lutteur
  const handleAssignFighter = () => {
    if (!selectedFighterId) {
      toast.error("Veuillez sélectionner un lutteur");
      return;
    }

    const fighterId = parseInt(selectedFighterId);
    const updates: Partial<Match> = {};
    
    if (fighterType === 'fighter1') {
      updates.fighter1_id = fighterId;
    } else {
      updates.fighter2_id = fighterId;
    }

    onUpdateMatch(updates);
    setIsAssignDialogOpen(false);
    setSelectedFighterId("");
    toast.success("Lutteur assigné avec succès");
  };

  // Désigner vainqueur
  const handleSetWinner = () => {
    if (!fighter) return;

    const opponentId = fighterType === 'fighter1' ? match.fighter2_id : match.fighter1_id;
    const opponent = fighterType === 'fighter1' ? match.fighter2 : match.fighter1;

    setIsSettingWinner(true);

    // Calculer la durée totale
    const hours = Math.floor(currentTime / 3600);
    const minutes = Math.floor((currentTime % 3600) / 60);
    const seconds = currentTime % 60;
    const totalDuration = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    onUpdateMatch({
      winner_fighter_id: fighter.id,
      loser_fighter_id: opponentId ?? undefined,
      match_result: fighterType === 'fighter1' ? 'fighter1_win' : 'fighter2_win',
      status: 'completed',
      total_duration: totalDuration,
      break_count: match.break_count || 0,
      end_time: new Date().toTimeString().slice(0, 8)
    });

    toast.success(`${fighter.first_name} désigné vainqueur`);
    setIsSettingWinner(false);
  };

  // Match nul
  const handleSetDraw = () => {
    setIsSettingDraw(true);

    const hours = Math.floor(currentTime / 3600);
    const minutes = Math.floor((currentTime % 3600) / 60);
    const seconds = currentTime % 60;
    const totalDuration = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    onUpdateMatch({
      match_result: 'draw',
      status: 'completed',
      total_duration: totalDuration,
      break_count: match.break_count || 0,
      winner_fighter_id: undefined,
      loser_fighter_id: undefined,
      end_time: new Date().toTimeString().slice(0, 8)
    });

    toast.success("Match déclaré nul");
    setIsSettingDraw(false);
  };

  // Ajouter un carton
  const handleAddCard = () => {
    if (!fighter) {
      toast.error("Aucun lutteur assigné");
      return;
    }
    
    if (matchStatus !== 'live') {
      toast.error("Le match doit être en cours");
      return;
    }

    onAddCard(fighter.id);
  };
 console.log(availableFighters)
  // Si pas de lutteur assigné
  if (!fighter) {
    return (
      <Card className="border-dashed border-2 hover:border-primary/50 transition-colors h-full">
        <CardHeader className="pb-2">
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-2">
              <User className="h-8 w-8 text-muted-foreground" />
            </div>
            <Typography variant="h6" weight="medium">
              Lutteur {fighterType === 'fighter1' ? '1' : '2'}
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
                <Select
                  value={selectedFighterId}
                  onValueChange={setSelectedFighterId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un lutteur" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableFighters.length > 0 ? (
                      availableFighters.map((f) => (
                        <SelectItem key={f.id} value={f.id.toString()}>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback>{f.first_name[0]}{f.last_name[0]}</AvatarFallback>
                            </Avatar>
                            <span>{f.first_name} {f.last_name}</span>
                            {f.nickname && (
                              <span className="text-xs text-muted-foreground">"{f.nickname}"</span>
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
    <Card className={`relative h-full ${isWinner ? 'border-2 border-green-500 bg-green-50/50' : ''} ${isSubGroupCompleted ? 'opacity-70' : ''}`}>
      <CardHeader className="pb-2">
        <div className="flex flex-col items-center text-center">
          <Avatar className="h-20 w-20 mb-2 border-2 border-primary/20">
            <AvatarImage src={fighter.profile_image} />
            <AvatarFallback className="text-lg">
              {fighter.first_name[0]}{fighter.last_name[0]}
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
            onClick={handleAddCard}
            disabled={!canModify || matchStatus !== 'live'}
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

          {/* Match nul */}
          <Button
            onClick={handleSetDraw}
            disabled={
              !canModify || 
              // !bothFightersAssigned ||
              isSettingDraw
            }
            variant="outline"
            size="sm"
            className="flex flex-col items-center justify-center h-auto py-2 border-blue-500 hover:bg-blue-50"
          >
            <Equal className="h-4 w-4 text-blue-600 mb-1" />
            <span className="text-xs">Nul</span>
          </Button>

          {/* Vainqueur */}
          <Button
            onClick={handleSetWinner}
            disabled={
              !canModify || 
              isSettingWinner 
              // !bothFightersAssigned
            }
            variant="outline"
            size="sm"
            className="flex flex-col items-center justify-center h-auto py-2 border-green-500 hover:bg-green-50"
          >
            <Trophy className="h-4 w-4 text-green-600 mb-1" />
            <span className="text-xs">Gagnant</span>
          </Button>
        </div>

        {/* Badge de statut */}
        {matchStatus === 'completed' && (
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