// app/ad/sub-groups/[subGroupId]/matches/[matchId]/fighter-control.tsx
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Match, Fighter, SubGroup } from "@/types";
import { Trophy, Award, X, User, Target, Plus, Users, Medal } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";

interface FighterControlProps {
  fighter: Fighter | undefined;
  fighterType: "fighter1" | "fighter2";
  match: Match;
  subGroup: SubGroup;
  onUpdateMatch: (updates: Partial<Match>) => void;
  availableFighters: Fighter[];
  onFighterClick: (fighter: Fighter) => void;
}

export function FighterControl({
  fighter,
  fighterType,
  match,
  subGroup,
  onUpdateMatch,
  availableFighters,
  onFighterClick
}: FighterControlProps) {
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedFighterId, setSelectedFighterId] = useState<string>("");
  
  const isWinner = match.winner_fighter_id === fighter?.id;
  const isLoser = match.loser_fighter_id === fighter?.id;
  
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
  
  if (!fighter) {
    return (
      <Card className="border-dashed border-2 p-3 hover:border-primary/50 transition-colors cursor-pointer">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                <User className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <Typography variant="body-lg" weight="medium">
                  Lutteur {fighterType === 'fighter1' ? '1' : '2'}
                </Typography>
                <Typography variant="body-sm" theme="muted">
                  À définir
                </Typography>
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="text-center space-y-3">
            <Typography variant="body-sm" theme="muted" className="mb-2">
              {availableFighters.length} lutteur(s) disponible(s)
            </Typography>
            
            {availableFighters.length > 0 ? (
              <>
                {showAssignModal ? (
                  <div className="space-y-3">
                    <Select
                      value={selectedFighterId}
                      onValueChange={setSelectedFighterId}
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
                        disabled={!selectedFighterId}
                        className="flex-1 gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        Assigner
                      </Button>
                      <Button
                        onClick={() => setShowAssignModal(false)}
                        variant="outline"
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
                    disabled={match.status === 'completed'}
                  >
                    <Users className="h-4 w-4" />
                    Assigner un lutteur
                  </Button>
                )}
              </>
            ) : (
              <Typography variant="body-sm" theme="muted" className="text-center italic">
                Aucun lutteur disponible
              </Typography>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card 
      className={`relative cursor-pointer hover:shadow-md transition-shadow ${
        isWinner ? "border-green-500 border-2" : isLoser ? "border-red-200 border" : ""
      }`}
      onClick={() => onFighterClick(fighter)}
    >
      {/* Badge vainqueur */}
      {isWinner && (
        <div className="absolute -top-2 -right-2 z-10">
          <Badge variant="default" className="gap-1 shadow-lg">
            <Trophy className="h-3 w-3" />
            Vainqueur
          </Badge>
        </div>
      )}
      
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-14 w-14">
              <AvatarImage src={fighter.profile_image} />
              <AvatarFallback className="text-lg">
                {fighter.first_name[0]}{fighter.last_name[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <Typography variant="h4" className="leading-tight">
                {fighter.first_name} {fighter.last_name}
              </Typography>
              {fighter.nickname && (
                <Typography variant="body-sm" theme="muted">
                  "{fighter.nickname}"
                </Typography>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Cartons */}
        {(cards.yellow > 0 || cards.red > 0) && (
          <div className="flex items-center gap-3">
            {cards.yellow > 0 && (
              <div className="flex items-center gap-1">
                <div className="w-6 h-6 rounded-full bg-yellow-500 flex items-center justify-center">
                  <Typography variant="caption2" weight="bold" className="text-white">
                    {cards.yellow}
                  </Typography>
                </div>
                <Typography variant="body-sm">Jaune{cards.yellow > 1 ? 's' : ''}</Typography>
              </div>
            )}
            {cards.red > 0 && (
              <div className="flex items-center gap-1">
                <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center">
                  <Typography variant="caption2" weight="bold" className="text-white">
                    {cards.red}
                  </Typography>
                </div>
                <Typography variant="body-sm">Rouge{cards.red > 1 ? 's' : ''}</Typography>
              </div>
            )}
          </div>
        )}
        
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center p-2 bg-muted/30 rounded-lg">
            <Typography variant="body-sm" weight="medium" theme="muted">
              Classement
            </Typography>
            <div className="flex items-center justify-center gap-1 mt-1">
              <Award className="h-4 w-4 text-yellow-600" />
              <Typography variant="h4">
                {fighter.ranking || 'N/A'}
              </Typography>
            </div>
          </div>
          
          <div className="text-center p-2 bg-muted/30 rounded-lg">
            <Typography variant="body-sm" weight="medium" theme="muted">
              Région
            </Typography>
            <Typography variant="body-sm" className="mt-1">
              {fighter.region?.name || 'N/A'}
            </Typography>
          </div>
        </div>
        
        {/* Indication pour cliquer */}
        <div className="text-center pt-2 border-t">
          <Typography variant="body-sm" theme="muted" className="flex items-center justify-center gap-1">
            <Target className="h-3 w-3" />
            Cliquer pour plus d'actions
          </Typography>
        </div>
      </CardContent>
    </Card>
  );
}