// app/ad/sub-groups/[subGroupId]/matches/[matchId]/cards-manager.tsx
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Match, FighterCard, Fighter } from "@/types";
import { CreditCard as CardIcon, X, Clock, AlertTriangle, User, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";

interface CardsManagerProps {
  match: Match;
  onUpdateMatch: (updates: Partial<Match>) => void;
  currentTime: number;
}

export function CardsManager({ match, onUpdateMatch, currentTime }: CardsManagerProps) {
  const [newCard, setNewCard] = useState({
    fighterId: match.fighter1_id || 0,
    cardType: 'yellow' as 'yellow' | 'red',
    reason: '',
    minuteGiven: formatTime(currentTime)
  });
  
  const [isAdding, setIsAdding] = useState(false);
  
  // Formater le temps en MM:SS
  function formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  
  // Obtenir les cartons par lutteur avec totaux
  const getFighterCardsSummary = (fighterId?: number) => {
    if (!fighterId || !match.cards) return { cards: [], yellow: 0, red: 0 };
    
    const fighterCards = match.cards.filter(card => 
      card.fighter_id === fighterId && !card.is_cancelled
    );
    
    return {
      cards: fighterCards,
      yellow: fighterCards.filter(card => card.card_type === 'yellow').length,
      red: fighterCards.filter(card => card.card_type === 'red').length
    };
  };
  
  const fighter1Summary = getFighterCardsSummary(match.fighter1_id);
  const fighter2Summary = getFighterCardsSummary(match.fighter2_id);
  
  const canAddCard = match.fighter1_id && match.fighter2_id && match.status === 'live';
  
  const handleAddCard = async () => {
    if (!newCard.fighterId || !newCard.minuteGiven) {
      toast.error("Veuillez sélectionner un lutteur et un temps");
      return;
    }
    
    if (!canAddCard) {
      toast.error("Le match doit être en cours avec deux lutteurs");
      return;
    }
    
    try {
      setIsAdding(true);
      
      const formData = new FormData();
      formData.append('match_id', match.id.toString());
      formData.append('fighter_id', newCard.fighterId.toString());
      formData.append('card_type', newCard.cardType);
      formData.append('minute_given', `${newCard.minuteGiven}:00`);
      formData.append('card_reason', newCard.reason || 'Faute non spécifiée');
      
      const response = await api.post('/api/fighter-cards', formData);
      
      if ((response as { success: boolean }).success) {
        toast.success(`Carton ${newCard.cardType === 'yellow' ? 'jaune' : 'rouge'} ajouté`);
        
        // Réinitialiser le formulaire
        setNewCard({
          fighterId: match.fighter1_id || 0,
          cardType: 'yellow',
          reason: '',
          minuteGiven: formatTime(currentTime)
        });
        
        // Recharger les données du match
        // (À implémenter via callback parent si nécessaire)
      }
    } catch (error) {
      console.error("Erreur ajout carton:", error);
      toast.error("Erreur lors de l'ajout du carton");
    } finally {
      setIsAdding(false);
    }
  };
  
  const handleDeleteCard = async (cardId: number) => {
    if (!confirm("Supprimer ce carton ?")) return;
    
    try {
      await api.delete(`/api/fighter-cards/${cardId}`);
      toast.success("Carton supprimé");
      // Recharger les données
    } catch (error) {
      console.error("Erreur suppression carton:", error);
      toast.error("Erreur lors de la suppression");
    }
  };
  
  const handleAutoCard = (fighterId: number, cardType: 'yellow' | 'red') => {
    setNewCard({
      fighterId,
      cardType,
      reason: 'Faute automatique',
      minuteGiven: formatTime(currentTime)
    });
    
    toast.info(`Carton ${cardType === 'yellow' ? 'jaune' : 'rouge'} pré-rempli`);
  };
  
  const renderFighterSummary = (fighter: Fighter | undefined, summary: any, fighterNumber: number) => {
    if (!fighter) return null;
    
    return (
      <div className="border rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Typography variant="body-sm" weight="bold">
                {fighterNumber}
              </Typography>
            </div>
            <div>
              <Typography variant="body-sm" weight="medium">
                {fighter.first_name} {fighter.last_name}
              </Typography>
              {fighter.nickname && (
                <Typography variant="caption1" theme="muted">
                  "{fighter.nickname}"
                </Typography>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {summary.yellow > 0 && (
              <Badge variant="secondary" className="gap-1">
                <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                {summary.yellow}
              </Badge>
            )}
            {summary.red > 0 && (
              <Badge variant="destructive" className="gap-1">
                <div className="w-2 h-2 bg-red-500 rounded-full" />
                {summary.red}
              </Badge>
            )}
          </div>
        </div>
        
        {/* Boutons d'ajout rapide */}
        <div className="flex gap-2 mb-3">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleAutoCard(fighter.id, 'yellow')}
            disabled={!canAddCard || isAdding}
            className="flex-1 gap-1"
          >
            <div className="w-3 h-3 bg-yellow-500 rounded-full" />
            Jaune
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleAutoCard(fighter.id, 'red')}
            disabled={!canAddCard || isAdding}
            className="flex-1 gap-1"
          >
            <div className="w-3 h-3 bg-red-500 rounded-full" />
            Rouge
          </Button>
        </div>
        
        {/* Liste des cartons */}
        {summary.cards.length > 0 ? (
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {summary.cards.map((card: FighterCard) => (
              <div key={card.id} className="flex items-center justify-between p-2 border rounded text-sm">
                <div className="flex items-center gap-3">
                  <Badge variant={card.card_type === 'red' ? 'destructive' : 'secondary'} >
                    {card.card_type === 'red' ? 'R' : 'J'}
                  </Badge>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Typography variant="body-sm" weight="medium">
                        {card.minute_given?.slice(0, 5)}
                      </Typography>
                      {card.card_reason && (
                        <Typography variant="body-sm" theme="muted" className="truncate">
                          {card.card_reason}
                        </Typography>
                      )}
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteCard(card.id)}
                  disabled={isAdding}
                  className="h-5 w-5 p-0"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <Typography variant="body-sm" theme="muted" className="text-center py-3 italic">
            Aucun carton pour ce lutteur
          </Typography>
        )}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CardIcon className="h-5 w-5" />
          Gestion des cartons
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Résumé des cartons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {renderFighterSummary(match.fighter1, fighter1Summary, 1)}
          {renderFighterSummary(match.fighter2, fighter2Summary, 2)}
        </div>
        
        {/* Ajout rapide de carton */}
        <div className="border rounded-lg p-4 bg-muted/30">
          <Typography variant="body-lg" weight="medium" className="mb-3">
            Ajouter un carton manuellement
          </Typography>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="space-y-2">
              <Label>Lutteur</Label>
              <Select
                value={newCard.fighterId.toString()}
                onValueChange={(value) => setNewCard(prev => ({ ...prev, fighterId: parseInt(value) }))}
                disabled={isAdding}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {match.fighter1 && (
                    <SelectItem value={match.fighter1.id.toString()}>
                      {match.fighter1.first_name} {match.fighter1.last_name}
                    </SelectItem>
                  )}
                  {match.fighter2 && (
                    <SelectItem value={match.fighter2.id.toString()}>
                      {match.fighter2.first_name} {match.fighter2.last_name}
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Type</Label>
              <Select
                value={newCard.cardType}
                onValueChange={(value: 'yellow' | 'red') => setNewCard(prev => ({ ...prev, cardType: value }))}
                disabled={isAdding}
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
                  value={newCard.minuteGiven}
                  onChange={(e) => setNewCard(prev => ({ ...prev, minuteGiven: e.target.value }))}
                  placeholder="00:00"
                  disabled={isAdding}
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setNewCard(prev => ({ ...prev, minuteGiven: formatTime(currentTime) }))}
                  disabled={isAdding}
                  title="Utiliser le temps actuel"
                >
                  <Clock className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Raison</Label>
              <Input
                value={newCard.reason}
                onChange={(e) => setNewCard(prev => ({ ...prev, reason: e.target.value }))}
                placeholder="Faute..."
                disabled={isAdding}
              />
            </div>
          </div>
          
          <Button
            onClick={handleAddCard}
            disabled={!canAddCard || isAdding || !newCard.fighterId || !newCard.minuteGiven}
            className="w-full mt-3 gap-2"
          >
            <Plus className="h-4 w-4" />
            {isAdding ? 'Ajout en cours...' : 'Ajouter le carton'}
          </Button>
        </div>
        
        {/* Règles des cartons */}
        <div className="border rounded-lg p-3 bg-amber-50 dark:bg-amber-900/20">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <Typography variant="body-sm" weight="medium" className="text-amber-700">
              Règles et sanctions
            </Typography>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full" />
                <span className="font-medium">Carton Jaune</span>
              </div>
              <div className="text-amber-600 pl-5">• Avertissement</div>
              <div className="text-amber-600 pl-5">• 2 jaunes = 1 rouge</div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full" />
                <span className="font-medium">Carton Rouge</span>
              </div>
              <div className="text-amber-600 pl-5">• Disqualification</div>
              <div className="text-amber-600 pl-5">• Match perdu</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}