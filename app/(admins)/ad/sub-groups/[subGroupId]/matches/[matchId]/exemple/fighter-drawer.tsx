// app/ad/sub-groups/[subGroupId]/matches/[matchId]/fighter-drawer.tsx
"use client";

import { useState } from "react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Match, Fighter } from "@/types";
import { 
  Trophy, 
  X, 
  Award, 
  Clock, 
  Flag, 
  Target, 
  Activity, 
  User, 
  CreditCard,
  Trash2
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface FighterDrawerProps {
  fighter: Fighter;
  match: Match;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAction: (action: string, fighterId: number, data?: any) => void;
  currentTime: number;
}

export function FighterDrawer({
  fighter,
  match,
  open,
  onOpenChange,
  onAction,
  currentTime
}: FighterDrawerProps) {
  const [selectedAction, setSelectedAction] = useState<string>("");
  const [cardData, setCardData] = useState({
    cardType: 'yellow' as 'yellow' | 'red',
    minute: formatTime(currentTime),
    reason: ''
  });

  const isWinner = match.winner_fighter_id === fighter.id;
  const isLoser = match.loser_fighter_id === fighter.id;

  // Calculer les cartons
  const getFighterCards = () => {
    if (!match.cards) return { yellow: 0, red: 0 };
    
    const fighterCards = match.cards.filter(
      (card) => card.fighter_id === fighter.id && !card.is_cancelled
    );
    
    return {
      yellow: fighterCards.filter(card => card.card_type === 'yellow').length,
      red: fighterCards.filter(card => card.card_type === 'red').length
    };
  };

  const cards = getFighterCards();

  // Formater le temps en MM:SS
  function formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  const handleAction = () => {
    if (!selectedAction) return;

    switch (selectedAction) {
      case 'assign_winner':
        onAction('assign_winner', fighter.id);
        break;
      case 'add_card':
        onAction('add_card', fighter.id, cardData);
        break;
      case 'remove_fighter':
        onAction('remove_fighter', fighter.id);
        break;
    }

    setSelectedAction("");
    setCardData({
      cardType: 'yellow',
      minute: formatTime(currentTime),
      reason: ''
    });
  };

  const canPerformAction = (action: string) => {
    switch (action) {
      case 'assign_winner':
        return !match.winner_fighter_id && match.fighter1 && match.fighter2 && 
               match.status !== 'cancelled' && match.status !== 'postponed';
      case 'add_card':
        return match.status === 'live';
      case 'remove_fighter':
        return match.status !== 'completed';
      default:
        return true;
    }
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader>
          <DrawerTitle className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={fighter.profile_image} />
              <AvatarFallback>
                {fighter.first_name[0]}{fighter.last_name[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <Typography variant="h4">
                {fighter.first_name} {fighter.last_name}
              </Typography>
              {fighter.nickname && (
                <Typography variant="body-sm" theme="muted">
                  "{fighter.nickname}"
                </Typography>
              )}
            </div>
          </DrawerTitle>
        </DrawerHeader>

        <div className="px-4 pb-4 space-y-6 overflow-y-auto">
          {/* Infos du lutteur */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Typography variant="body-sm" weight="medium" theme="muted">
                Classement
              </Typography>
              <div className="flex items-center gap-2">
                <Award className="h-4 w-4 text-yellow-600" />
                <Typography variant="h4">
                  {fighter.ranking || 'N/A'}
                </Typography>
              </div>
            </div>

            <div className="space-y-2">
              <Typography variant="body-sm" weight="medium" theme="muted">
                Région
              </Typography>
              <div className="flex items-center gap-2">
                <Flag className="h-4 w-4 text-blue-600" />
                <Typography>
                  {fighter.region?.name || 'N/A'}
                </Typography>
              </div>
            </div>
          </div>

          {/* Cartons */}
          <div className="space-y-3">
            <Typography variant="body-lg" weight="medium">
              Cartons reçus
            </Typography>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-yellow-500 flex items-center justify-center">
                  <Typography variant="caption2" weight="bold" className="text-white">
                    {cards.yellow}
                  </Typography>
                </div>
                <Typography>Jaunes</Typography>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center">
                  <Typography variant="caption2" weight="bold" className="text-white">
                    {cards.red}
                  </Typography>
                </div>
                <Typography>Rouges</Typography>
              </div>
            </div>
          </div>

          <Separator />

          {/* Actions */}
          <div className="space-y-4">
            <Typography variant="body-lg" weight="medium">
              Actions disponibles
            </Typography>

            {/* Sélection d'action */}
            <Select
              value={selectedAction}
              onValueChange={setSelectedAction}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner une action..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="assign_winner" disabled={!canPerformAction('assign_winner')}>
                  <div className="flex items-center gap-2">
                    <Trophy className="h-4 w-4" />
                    Désigner vainqueur
                  </div>
                </SelectItem>
                <SelectItem value="add_card" disabled={!canPerformAction('add_card')}>
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Ajouter un carton
                  </div>
                </SelectItem>
                <SelectItem value="remove_fighter" disabled={!canPerformAction('remove_fighter')}>
                  <div className="flex items-center gap-2">
                    <Trash2 className="h-4 w-4" />
                    Retirer du match
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>

            {/* Formulaire pour les cartons */}
            {selectedAction === 'add_card' && (
              <div className="space-y-3 p-3 border rounded-lg">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Type de carton</Label>
                    <Select
                      value={cardData.cardType}
                      onValueChange={(value: 'yellow' | 'red') => 
                        setCardData(prev => ({ ...prev, cardType: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yellow">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-yellow-500 rounded-full" />
                            Jaune
                          </div>
                        </SelectItem>
                        <SelectItem value="red">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-red-500 rounded-full" />
                            Rouge
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Temps (MM:SS)</Label>
                    <div className="flex gap-2">
                      <Input
                        value={cardData.minute}
                        onChange={(e) => 
                          setCardData(prev => ({ ...prev, minute: e.target.value }))
                        }
                        placeholder="00:00"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => 
                          setCardData(prev => ({ ...prev, minute: formatTime(currentTime) }))
                        }
                        title="Utiliser le temps actuel"
                      >
                        <Clock className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Raison (optionnel)</Label>
                  <Input
                    value={cardData.reason}
                    onChange={(e) => 
                      setCardData(prev => ({ ...prev, reason: e.target.value }))
                    }
                    placeholder="Faute..."
                  />
                </div>
              </div>
            )}

            {/* Bouton d'action */}
            {selectedAction && (
              <Button
                onClick={handleAction}
                className="w-full"
                variant={selectedAction === 'remove_fighter' ? 'destructive' : 'default'}
              >
                {selectedAction === 'assign_winner' && 'Désigner vainqueur'}
                {selectedAction === 'add_card' && 'Ajouter le carton'}
                {selectedAction === 'remove_fighter' && 'Retirer le lutteur'}
              </Button>
            )}
          </div>

          {/* Statut */}
          <div className="p-3 border rounded-lg">
            <div className="flex items-center justify-between">
              <Typography variant="body-sm" weight="medium">
                Statut dans ce match
              </Typography>
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
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}