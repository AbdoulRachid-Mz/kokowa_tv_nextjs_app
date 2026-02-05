// app/ad/sub-groups/[subGroupId]/matches/[matchId]/fighter-control.tsx - VERSION AVEC CARTONS
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Match, Fighter, SubGroup } from "@/types";
import { Trophy, User, Plus, Users, AlertCircle, Shield } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { addFighterCard } from "@/actions/matches";

interface FighterControlProps {
  fighter: Fighter | undefined;
  fighterType: "fighter1" | "fighter2";
  match: Match;
  subGroup: SubGroup;
  onUpdateMatch: (updates: Partial<Match>) => Promise<void>;
  availableFighters: Fighter[];
  currentTime: number;
  fighterCards?: Array<{
    id: number;
    card_type: 'yellow' | 'red';
    minute_given?: string;
    card_reason?: string;
  }>;
}

export function FighterControl({
  fighter,
  fighterType,
  match,
  subGroup,
  onUpdateMatch,
  availableFighters,
  currentTime,
  fighterCards = []
}: FighterControlProps) {
  const queryClient = useQueryClient();
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedFighterId, setSelectedFighterId] = useState<string>("");
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [isSettingWinner, setIsSettingWinner] = useState(false);

  const isWinner = match.winner_fighter_id === fighter?.id;
  const isLoser = match.loser_fighter_id === fighter?.id;

  // Compter les cartons
  const yellowCards = fighterCards.filter(card => card.card_type === 'yellow').length;
  const redCards = fighterCards.filter(card => card.card_type === 'red').length;
  const totalCards = yellowCards + redCards;

  // Formater le temps
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Assigner un lutteur
  const handleAssignFighter = async () => {
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

    try {
      const updates: Partial<Match> = {};
      if (fighterType === 'fighter1') {
        updates.fighter1_id = fighterId;
      } else {
        updates.fighter2_id = fighterId;
      }

      await onUpdateMatch(updates);
      toast.success(`${selectedFighter.first_name} assigné au match`);
      setShowAssignModal(false);
      setSelectedFighterId("");
    } catch (error) {
      console.error("Erreur assignation lutteur:", error);
      toast.error("Erreur lors de l'assignation");
    }
  };

  // Ajouter un carton
  const handleAddCard = async (cardType: 'yellow' | 'red') => {
    if (!fighter || match.status !== 'live') {
      toast.error("Le match doit être en cours");
      return;
    }

    // Vérifier les règles de cartons
    if (cardType === 'red') {
      if (redCards >= 1) {
        toast.error("Un lutteur ne peut pas recevoir plus d'un carton rouge");
        return;
      }
      // Carton rouge = disqualification automatique
      if (confirm("Carton rouge : le lutteur sera disqualifié. Confirmer ?")) {
        try {
          setIsAddingCard(true);

          // Appeler directement la fonction serveur pour ajouter le carton rouge
          const result = await addFighterCard({
            match_id: match.id,
            fighter_id: fighter.id,
            card_type: 'red',
            card_reason: `Carton rouge - Disqualification`,
            minute_given: `${formatTime(currentTime)}:00`
          });

          if (!result.success) throw new Error('Erreur ajout carton');

          // Déclarer l'autre lutteur vainqueur (disqualification)
          const opponentId = fighterType === 'fighter1' ? match.fighter2_id : match.fighter1_id;
          const opponent = fighterType === 'fighter1' ? match.fighter2 : match.fighter1;

          if (opponentId && opponent) {
            const updates: Partial<Match> = {
              winner_fighter_id: opponentId,
              loser_fighter_id: fighter.id,
              match_result: fighterType === 'fighter1' ? 'fighter2_win' : 'fighter1_win',
              status: 'completed',
              end_time: new Date().toTimeString().slice(0, 8)
            };

            await onUpdateMatch(updates);
            toast.success(`${opponent.first_name} déclaré vainqueur par disqualification`);
          }

          // Invalider le cache
          queryClient.invalidateQueries({ queryKey: ['match', match.id] });

        } catch (error) {
          console.error("Erreur ajout carton rouge:", error);
          toast.error("Erreur lors de l'ajout du carton");
        } finally {
          setIsAddingCard(false);
        }
      }
      return;
    }

    // Carton jaune
    if (yellowCards >= 2) {
      toast.error("Un lutteur ne peut pas recevoir plus de 2 cartons jaunes");
      return;
    }

    try {
      setIsAddingCard(true);

      // Appeler directement la fonction serveur pour ajouter le carton jaune
      const result = await addFighterCard({
        match_id: match.id,
        fighter_id: fighter.id,
        card_type: 'yellow',
        card_reason: `Carton jaune`,
        minute_given: `${formatTime(currentTime)}:00`
      });

      if (!result.success) throw new Error('Erreur ajout carton');

      // Vérifier si 2 cartons jaunes = carton rouge automatique
      if (yellowCards === 1) {
        toast.warning("Attention : 2 cartons jaunes = carton rouge (disqualification)");

        // Auto-disqualification après 2 cartons jaunes
        setTimeout(async () => {
          const opponentId = fighterType === 'fighter1' ? match.fighter2_id : match.fighter1_id;
          const opponent = fighterType === 'fighter1' ? match.fighter2 : match.fighter1;

          if (opponentId && opponent) {
            const updates: Partial<Match> = {
              winner_fighter_id: opponentId,
              loser_fighter_id: fighter.id,
              match_result: fighterType === 'fighter1' ? 'fighter2_win' : 'fighter1_win',
              status: 'completed',
              end_time: new Date().toTimeString().slice(0, 8)
            };

            await onUpdateMatch(updates);
            toast.warning(`${opponent.first_name} vainqueur par disqualification (2 cartons jaunes)`);
          }
        }, 1000);
      }

      // Invalider le cache
      queryClient.invalidateQueries({ queryKey: ['match', match.id] });
      queryClient.invalidateQueries({ queryKey: ['cards', match.id] });

      toast.success(`Carton jaune ajouté (${yellowCards + 1}/2)`);
    } catch (error) {
      console.error("Erreur ajout carton jaune:", error);
      toast.error("Erreur lors de l'ajout du carton");
    } finally {
      setIsAddingCard(false);
    }
  };
  // Désigner comme vainqueur
  const handleSetWinner = async () => {
    if (!fighter) return;

    const opponentId = fighterType === 'fighter1' ? match.fighter2_id : match.fighter1_id;
    const opponent = fighterType === 'fighter1' ? match.fighter2 : match.fighter1;

    if (!opponentId || !opponent) {
      toast.error("Les deux lutteurs doivent être assignés");
      return;
    }

    if (!confirm(`Désigner ${fighter.first_name} ${fighter.last_name} comme vainqueur ?`)) {
      return;
    }

    try {
      setIsSettingWinner(true);

      const updates: Partial<Match> = {
        winner_fighter_id: fighter.id,
        loser_fighter_id: opponentId,
        match_result: fighterType === 'fighter1' ? 'fighter1_win' : 'fighter2_win',
        status: 'completed',
        end_time: new Date().toTimeString().slice(0, 8)
      };

      await onUpdateMatch(updates);
      toast.success(`${fighter.first_name} désigné comme vainqueur`);
    } catch (error) {
      console.error("Erreur désignation vainqueur:", error);
      toast.error("Erreur lors de la désignation");
    } finally {
      setIsSettingWinner(false);
    }
  };

  // Interface pour lutteur non assigné
  if (!fighter) {
    return (
      <Card className="border-dashed border-2 p-6 hover:border-primary/50 transition-colors h-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
                <User className="h-7 w-7 text-muted-foreground" />
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
          <div className="text-center space-y-4">
            <Typography variant="body-sm" theme="muted" className="mb-2">
              {availableFighters.length} lutteur(s) disponible(s)
            </Typography>

            {availableFighters.length > 0 ? (
              <>
                {showAssignModal ? (
                  <div className="space-y-4">
                    <Select
                      value={selectedFighterId}
                      onValueChange={setSelectedFighterId}
                    >
                      <SelectTrigger className="w-full">
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
      className={`relative transition-shadow h-full ${
        isWinner 
          ? "border-green-500 border-2 bg-green-50 dark:bg-green-900/10" 
          : isLoser 
          ? "border-red-200 border bg-red-50 dark:bg-red-900/10"
          : ""
      }`}
    >
      {/* Badge vainqueur */}
      {isWinner && (
        <div className="absolute -top-2 -right-2 z-10">
          <Badge variant="default" className="gap-1 shadow-lg bg-green-600">
            <Trophy className="h-3 w-3" />
            Vainqueur
          </Badge>
        </div>
      )}

      {/* Badge cartons */}
      {totalCards > 0 && (
        <div className="absolute -top-2 -left-2 z-10">
          <Badge variant="secondary" className="gap-1 shadow-lg">
            <Shield className="h-3 w-3" />
            {totalCards} carton{totalCards > 1 ? 's' : ''}
          </Badge>
        </div>
      )}

      <CardHeader>
        <div className="flex items-center  justify-center">
          <div className="flex items-center flex-col gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={fighter.profile_image} />
              <AvatarFallback className="text-lg font-semibold">
                {fighter.first_name[0]}{fighter.last_name[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <Typography variant="h5" className="leading-tight font-bold">
                {fighter.first_name} {fighter.last_name}
              </Typography>
              {fighter.nickname && (
                <Typography variant="body-sm" theme="muted" className="italic">
                  "{fighter.nickname}"
                </Typography>
              )}
              <div className="flex items-center gap-2 mt-1">
                {fighter.region && (
                  <Badge variant="outline" className="text-xs">
                    {fighter.region.name}
                  </Badge>
                )}
                {fighter.ranking > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    #{fighter.ranking}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Cartons */}
        {totalCards > 0 && (
          <div className="space-y-3">
            <Typography variant="body-sm" weight="medium" theme="muted">
              Cartons reçus
            </Typography>
            <div className="flex gap-3">
              {yellowCards > 0 && (
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    yellowCards === 2 ? 'bg-red-500' : 'bg-yellow-500'
                  }`}>
                    <Typography variant="caption2" weight="bold" className="text-white">
                      {yellowCards}
                    </Typography>
                  </div>
                  <Typography variant="body-sm">
                    Jaune{yellowCards > 1 ? 's' : ''}
                    {yellowCards === 2 && ' (rouge)'}
                  </Typography>
                </div>
              )}
              {redCards > 0 && (
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center">
                    <Typography variant="caption2" weight="bold" className="text-white">
                      {redCards}
                    </Typography>
                  </div>
                  <Typography variant="body-sm">
                    Rouge{redCards > 1 ? 's' : ''}
                  </Typography>
                </div>
              )}
            </div>
            
            {/* Liste détaillée des cartons */}
            {fighterCards.length > 0 && (
              <div className="mt-2 space-y-1">
                {fighterCards.slice(-3).map((card, index) => (
                  <div key={index} className="flex items-center gap-2 text-xs">
                    <div className={`w-2 h-2 rounded-full ${
                      card.card_type === 'red' ? 'bg-red-500' : 'bg-yellow-500'
                    }`} />
                    <span className="text-muted-foreground">
                      {card.minute_given?.slice(0, 5) || '00:00'}
                    </span>
                    {card.card_reason && (
                      <span className="truncate text-muted-foreground">
                        - {card.card_reason}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Boutons d'action */}
        <div className="space-y-3 pt-4 border-t">
          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={() => handleAddCard('yellow')}
              disabled={match.status !== 'live' || isAddingCard || yellowCards >= 2 || redCards > 0}
              variant="outline"
              className="gap-2 border-yellow-500 hover:bg-yellow-50"
              size="sm"
            >
              <div className={`w-3 h-3 rounded-full ${
                yellowCards === 2 ? 'bg-red-500' : 'bg-yellow-500'
              }`} />
              {isAddingCard ? '...' : `Jaune (${yellowCards}/2)`}
            </Button>

            <Button
              onClick={() => handleAddCard('red')}
              disabled={match.status !== 'live' || isAddingCard || redCards > 0}
              variant="outline"
              className="gap-2 border-red-500 hover:bg-red-50"
              size="sm"
            >
              <div className="w-3 h-3 bg-red-500 rounded-full" />
              {isAddingCard ? '...' : `Rouge ${redCards > 0 ? '(déjà)' : ''}`}
            </Button>
          </div>

          <Button
            onClick={handleSetWinner}
            disabled={
              match.status === 'completed' || 
              isSettingWinner || 
              !match.fighter1_id || 
              !match.fighter2_id ||
              redCards > 0 // Ne peut pas être vainqueur avec carton rouge
            }
            variant="default"
            className="w-full gap-2 bg-green-600 hover:bg-green-700"
            size="sm"
          >
            <Trophy className="h-4 w-4" />
            {isSettingWinner ? 'Désignation...' : 'Désigner Vainqueur'}
          </Button>
        </div>

        {/* Règles des cartons */}
        {(yellowCards > 0 || redCards > 0) && (
          <div className="pt-2 border-t">
            <Typography variant="caption1" theme="muted" className="block mb-1">
              Règles des cartons :
            </Typography>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• 1 carton rouge = disqualification</li>
              <li>• 2 cartons jaunes = 1 carton rouge</li>
              {yellowCards === 1 && (
                <li className="text-amber-600 font-medium">
                  ⚠️ Prochain carton jaune = disqualification
                </li>
              )}
              {redCards > 0 && (
                <li className="text-red-600 font-medium">
                  ❌ Disqualifié - ne peut pas être vainqueur
                </li>
              )}
            </ul>
          </div>
        )}

        {match.status === 'completed' && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2 border-t">
            <AlertCircle className="h-4 w-4" />
            <Typography variant="body-sm" theme="muted">
              Match terminé
            </Typography>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 