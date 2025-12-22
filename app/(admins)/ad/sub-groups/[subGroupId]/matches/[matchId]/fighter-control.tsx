// app/ad/sub-groups/[subGroupId]/matches/[matchId]/fighter-control.tsx
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Match, Fighter, SubGroup } from "@/types";
import { Trophy, Award, X, User, Target, Activity, Plus, Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";

interface FighterControlProps {
  fighter: Fighter | undefined;
  fighterType: "fighter1" | "fighter2";
  match: Match;
  subGroup: SubGroup;
  onUpdateMatch: (updates: Partial<Match>) => void;
  isSaving: boolean;
  availableFighters: Fighter[];
}

export function FighterControl({
  fighter,
  fighterType,
  match,
  subGroup,
  onUpdateMatch,
  isSaving,
  availableFighters
}: FighterControlProps) {
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedFighterId, setSelectedFighterId] = useState<string>("");
  
  const isWinner = match.winner_fighter_id === fighter?.id;
  const isLoser = match.loser_fighter_id === fighter?.id;
  
  // Obtenir la région pour ce lutteur
  const getRegionForFighter = () => {
    if (fighterType === 'fighter1') return subGroup.region1;
    return subGroup.region2;
  };
  
  // Calculer les cartons
  const getFighterCards = () => {
    if (!fighter || !match.cards) return { yellow: 0, red: 0 };
    
    const fighterCards = match.cards.filter(
      (card) => card.fighter_id === fighter.id && !card.is_cancelled
    );
    
    return {
      yellow: fighterCards.filter(card => card.card_type === 'yellow').length,
      red: fighterCards.filter(card => card.card_type === 'red').length
    };
  };
  
  const cards = getFighterCards();
  
  const handleSetWinner = () => {
    if (!fighter) return;
    
    const updates: Partial<Match> = {
      winner_fighter_id: fighter.id,
      match_result: fighterType === 'fighter1' ? 'fighter1_win' : 'fighter2_win',
      status: 'completed'
    };
    
    // Définir le perdant si l'autre lutteur existe
    if (fighterType === 'fighter1' && match.fighter2) {
      updates.loser_fighter_id = match.fighter2.id;
    } else if (fighterType === 'fighter2' && match.fighter1) {
      updates.loser_fighter_id = match.fighter1.id;
    }
    
    onUpdateMatch(updates);
    toast.success(`${fighter.first_name} désigné comme vainqueur`);
  };
  
  const handleAssignFighter = () => {
    if (!selectedFighterId) {
      toast.error("Veuillez sélectionner un lutteur");
      return;
    }
    
    const fighterId = parseInt(selectedFighterId);
    const selectedFighter = availableFighters.find(f => f.id === fighterId);
    
    if (!selectedFighter) {
      toast.error("Lutteur non trouvé");
      return;
    }
    
    const updates: Partial<Match> = {};
    
    if (fighterType === 'fighter1') {
      updates.fighter1_id = fighterId;
    } else {
      updates.fighter2_id = fighterId;
    }
    
    onUpdateMatch(updates);
    toast.success(`${selectedFighter.first_name} assigné au match`);
    setShowAssignModal(false);
    setSelectedFighterId("");
  };
  
  const handleRemoveFighter = () => {
    if (!fighter) return;
    
    const updates: Partial<Match> = {};
    
    if (fighterType === 'fighter1') {
      updates.fighter1_id = undefined;
      
      // Si c'était le vainqueur, le retirer
      if (match.winner_fighter_id === fighter.id) {
        updates.winner_fighter_id = undefined;
        updates.match_result = undefined;
      }
      
      if (match.loser_fighter_id === fighter.id) {
        updates.loser_fighter_id = undefined;
      }
    } else {
      updates.fighter2_id = undefined;
      
      // Si c'était le vainqueur, le retirer
      if (match.winner_fighter_id === fighter.id) {
        updates.winner_fighter_id = undefined;
        updates.match_result = undefined;
      }
      
      if (match.loser_fighter_id === fighter.id) {
        updates.loser_fighter_id = undefined;
      }
    }
    
    onUpdateMatch(updates);
    toast.success("Lutteur retiré du match");
  };
  
  const region = getRegionForFighter();
  
  if (!fighter) {
    return (
      <Card className="border-dashed border-2 p-3">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Lutteur {fighterType === 'fighter1' ? '1' : '2'} - À définir
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-center">
            <Typography variant="body-lg" theme="muted" className="mb-2">
              {region ? `Région ${region.name}` : 'Aucune région assignée'}
            </Typography>
            <Typography variant="body-sm" theme="muted" className="mb-4">
              {availableFighters.length} lutteur(s) disponible(s)
            </Typography>
          </div>
          
          {availableFighters.length > 0 ? (
            <>
              {showAssignModal ? (
                <div className="space-y-3">
                  <Select
                    value={selectedFighterId}
                    onValueChange={setSelectedFighterId}
                    disabled={isSaving}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un lutteur..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availableFighters.map((fighter) => (
                        <SelectItem key={fighter.id} value={fighter.id.toString()}>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={fighter.profile_image} />
                              <AvatarFallback>
                                {fighter.first_name[0]}{fighter.last_name[0]}
                              </AvatarFallback>
                            </Avatar>
                            <span>
                              {fighter.first_name} {fighter.last_name}
                              {fighter.nickname && ` (${fighter.nickname})`}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <div className="flex gap-2">
                    <Button
                      onClick={handleAssignFighter}
                      disabled={isSaving || !selectedFighterId}
                      className="flex-1 gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Assigner
                    </Button>
                    <Button
                      onClick={() => setShowAssignModal(false)}
                      variant="outline"
                      disabled={isSaving}
                    >
                      Annuler
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  onClick={() => setShowAssignModal(true)}
                  variant="outline"
                  className="w-full gap-2"
                  disabled={isSaving || match.status === 'completed'}
                >
                  <Users className="h-4 w-4" />
                  Assigner un lutteur
                </Button>
              )}
            </>
          ) : (
            <Typography variant="body-sm" theme="muted" className="text-center italic">
              Aucun lutteur disponible pour cette région
            </Typography>
          )}
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className={isWinner ? "border-green-500 border-2" : ""}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 relative">
            <Avatar className="h-8 w-8">
              <AvatarImage src={fighter.profile_image} />
              <AvatarFallback>
                {fighter.first_name[0]}{fighter.last_name[0]}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span>
                {fighter.first_name} {fighter.last_name}
              </span>
              {fighter.nickname && (
                <Typography variant="body-sm" theme="muted">
                  "{fighter.nickname}"
                </Typography>
              )}
            </div>
             {cards.yellow > 0 && (
                <div className="w-6 h-6 rounded-full bg-yellow-500 text-white text-xs font-semibold flex items-center justify-center">
                  {cards.yellow}
                </div>
              )}
              {cards.red > 0 && (
                <div className="w-6 h-6 rounded-full bg-red-500 text-white text-xs font-semibold flex items-center justify-center">
                  {cards.red}
                </div>
              )}
          </CardTitle>
          
          <div className="flex items-center gap-2">
            {isWinner && (
              <Badge variant="default" className="gap-1">
                <Trophy className="h-3 w-3" />
                Vainqueur
              </Badge>
            )}
            {isLoser && (
              <Badge variant="outline" className="gap-1">
                <X className="h-3 w-3" />
                Perdant
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Infos du lutteur */}
        {/* <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <Typography variant="body-sm" weight="medium" theme="muted">
              Classement
            </Typography>
            <Typography variant="h4" className="mt-1">
              {fighter.ranking || 'N/A'}
            </Typography>
          </div>
          
          <div className="text-center">
            <Typography variant="body-sm" weight="medium" theme="muted">
              Région
            </Typography>
            <Typography variant="h4" className="mt-1">
              {fighter.region?.code || region?.code || 'N/A'}
            </Typography>
          </div>
        </div> */}
        
        {/* Cartons */}
        {/* <div className="border rounded-lg p-2">
          <div className="flex items-center justify-between mb-2">
            <Typography variant="body-sm" weight="medium">
              Cartons
            </Typography>
            <div className="flex items-center gap-2">
              {cards.yellow > 0 && (
                <div className="w-6 h-6 rounded-full bg-yellow-500 text-white text-xs font-semibold flex items-center justify-center">
                  {cards.yellow}
                </div>
              )}
              {cards.red > 0 && (
                <div className="w-6 h-6 rounded-full bg-red-500 text-white text-xs font-semibold flex items-center justify-center">
                  {cards.red}
                </div>
              )}
            </div>
          </div>
        </div> */}
        
        {/* Actions */}
        <div className="space-y-2">
          {!match.winner_fighter_id && (
            <Button
              onClick={handleSetWinner}
              disabled={isSaving}
              className="w-full gap-2"
              variant={isWinner ? "default" : "outline"}
            >
              <Trophy className="h-4 w-4" />
              {isWinner ? 'Vainqueur désigné' : 'Désigner vainqueur'}
            </Button>
          )}
          
          <Button
            onClick={handleRemoveFighter}
            disabled={isSaving || match.status === 'completed'}
            variant="ghost"
            className="w-full gap-2 text-destructive"
          >
            <X className="h-4 w-4" />
            Retirer le lutteur
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}