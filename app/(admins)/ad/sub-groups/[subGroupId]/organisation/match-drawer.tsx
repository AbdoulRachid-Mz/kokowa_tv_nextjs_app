// app/admin/sub-groups/[subGroupId]/organisation/match-drawer.tsx
"use client";

import { useState, useEffect } from "react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Typography } from "@/components/ui/typography";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Match, FighterCard, Fighter } from "@/types";
import {
  Edit,
  Trash2,
  Trophy,
  Square as CardIcon,
  Pause,
  Play,
  Save,
  X,
  Clock,
  Users,
} from "lucide-react";
import { api } from "@/lib/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface MatchDrawerProps {
  match: Match | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete: (matchId: number) => void;
  onEdit: (match: Match) => void;
}

export function MatchDrawer({
  match,
  open,
  onOpenChange,
  onDelete,
  onEdit,
}: MatchDrawerProps) {
  const [cards, setCards] = useState<FighterCard[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editedMatch, setEditedMatch] = useState<Match | null>(null);
  const [newCard, setNewCard] = useState({
    fighter_id: "",
    card_type: "yellow" as "yellow" | "red",
    minute_given: "",
    card_reason: "",
  });

  useEffect(() => {
    if (match && open) {
      loadMatchCards();
      setEditedMatch(match);
    }
  }, [match, open]);

  const loadMatchCards = async () => {
    if (!match) return;
    
    try {
      const response = await api.get(`/api/fighter-cards?match_id=${match.id}`);
      if (response && response) {
        setCards((response as { data: FighterCard[] }).data);
      }
    } catch (error) {
      console.error("Erreur chargement des cartons:", error);
    }
  };

  const handleSaveEdit = async () => {
    if (!editedMatch) return;
    
    try {
      await onEdit(editedMatch);
      setIsEditing(false);
    } catch (error) {
      console.error("Erreur sauvegarde:", error);
    }
  };

  const handleAddCard = async () => {
    if (!match || !newCard.fighter_id) return;

    try {
      const formData = new FormData();
      formData.append("match_id", match.id.toString());
      formData.append("fighter_id", newCard.fighter_id);
      formData.append("card_type", newCard.card_type);
      formData.append("minute_given", `${newCard.minute_given}:00`);
      formData.append("card_reason", newCard.card_reason);

      const response = await api.post("/api/fighter-cards", formData);
      
      if (response && (response as any).success) {
        setNewCard({
          fighter_id: "",
          card_type: "yellow",
          minute_given: "",
          card_reason: "",
        });
        loadMatchCards();
      }
    } catch (error) {
      console.error("Erreur ajout carton:", error);
      alert("Erreur lors de l'ajout du carton");
    }
  };

  const handleDeleteCard = async (cardId: number) => {
    if (!confirm("Supprimer ce carton ?")) return;

    try {
      await api.delete(`/api/fighter-cards/${cardId}`);
      loadMatchCards();
    } catch (error) {
      console.error("Erreur suppression carton:", error);
    }
  };

  const handleSetWinner = async (fighterId: number) => {
    if (!editedMatch) return;

    const updatedMatch = {
      ...editedMatch,
      winner_fighter_id: fighterId,
      match_result: fighterId === editedMatch.fighter1_id ? "fighter1_win" : "fighter2_win",
      status: "completed",
    };

    setEditedMatch(updatedMatch as Match);
  };

  const handleStatusChange = async (status: string) => {
    if (!editedMatch) return;

    const updatedMatch = {
      ...editedMatch,
      status,
    };

    setEditedMatch(updatedMatch as Match);
  };

  if (!match) return null;

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "completed": return "default";
      case "live": return "destructive";
      case "scheduled": return "secondary";
      default: return "outline";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "completed": return "Terminé";
      case "live": return "En direct";
      case "scheduled": return "Programmé";
      case "cancelled": return "Annulé";
      case "postponed": return "Reporté";
      default: return status;
    }
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader>
          <DrawerTitle className="flex items-center justify-between">
            <span>Match #{match.match_number}</span>
            <Badge variant={getStatusVariant(match.status)}>
              {getStatusText(match.status)}
            </Badge>
          </DrawerTitle>
          <DrawerDescription>
            Gestion détaillée du match
          </DrawerDescription>
        </DrawerHeader>

        <div className="px-4 overflow-y-auto">
          {/* Informations du match */}
          <Card className="mb-4">
            <CardContent className="p-4">
              <div className="grid grid-cols-2 gap-4 mb-4">
                {/* Fighter 1 */}
                <div className={`text-center p-3 rounded-lg ${
                  match.winner_fighter_id === match.fighter1_id 
                    ? 'bg-green-50 border-2 border-green-200' 
                    : 'bg-muted/30'
                }`}>
                  {match.fighter1 && (
                    <>
                      <Avatar className="w-16 h-16 mx-auto mb-2">
                        <AvatarImage
                          src={match.fighter1.profile_image}
                          alt={`${match.fighter1.first_name} ${match.fighter1.last_name}`}
                        />
                        <AvatarFallback>
                          {match.fighter1.first_name[0]}
                          {match.fighter1.last_name[0]}
                        </AvatarFallback>
                      </Avatar>
                      <Typography variant="body-sm" weight="medium">
                        {match.fighter1.first_name} {match.fighter1.last_name}
                      </Typography>
                      {match.fighter1.nickname && (
                        <Typography variant="body-base" theme="muted">
                          "{match.fighter1.nickname}"
                        </Typography>
                      )}
                      <Typography variant="body-base">
                        Classement: {match.fighter1.ranking || "N/A"}
                      </Typography>
                    </>
                  )}
                </div>

                {/* Fighter 2 */}
                <div className={`text-center p-3 rounded-lg ${
                  match.winner_fighter_id === match.fighter2_id 
                    ? 'bg-green-50 border-2 border-green-200' 
                    : 'bg-muted/30'
                }`}>
                  {match.fighter2 && (
                    <>
                      <Avatar className="w-16 h-16 mx-auto mb-2">
                        <AvatarImage
                          src={match.fighter2.profile_image}
                          alt={`${match.fighter2.first_name} ${match.fighter2.last_name}`}
                        />
                        <AvatarFallback>
                          {match.fighter2.first_name[0]}
                          {match.fighter2.last_name[0]}
                        </AvatarFallback>
                      </Avatar>
                      <Typography variant="body-sm" weight="medium">
                        {match.fighter2.first_name} {match.fighter2.last_name}
                      </Typography>
                      {match.fighter2.nickname && (
                        <Typography variant="body-base" theme="muted">
                          "{match.fighter2.nickname}"
                        </Typography>
                      )}
                      <Typography variant="body-base">
                        Classement: {match.fighter2.ranking || "N/A"}
                      </Typography>
                    </>
                  )}
                </div>
              </div>

              {/* Actions rapides */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => match.fighter1 && handleSetWinner(match.fighter1.id)}
                  disabled={!match.fighter1}
                >
                  <Trophy className="h-4 w-4 mr-1" />
                  Vainqueur 1
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => match.fighter2 && handleSetWinner(match.fighter2.id)}
                  disabled={!match.fighter2}
                >
                  <Trophy className="h-4 w-4 mr-1" />
                  Vainqueur 2
                </Button>
              </div>

              {/* Statut du match */}
              <div className="space-y-2">
                <Label>Statut du match</Label>
                <Select
                  value={editedMatch?.status || match.status}
                  onValueChange={handleStatusChange}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scheduled">Programmé</SelectItem>
                    <SelectItem value="live">En direct</SelectItem>
                    <SelectItem value="completed">Terminé</SelectItem>
                    <SelectItem value="cancelled">Annulé</SelectItem>
                    <SelectItem value="postponed">Reporté</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Gestion des cartons */}
          <Card className="mb-4">
            <CardContent className="p-4">
              <Typography variant="h4" className="mb-4 flex items-center">
                <CardIcon className="h-5 w-5 mr-2" />
                Cartons
              </Typography>

              {/* Formulaire d'ajout de carton */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-2 mb-4">
                <div>
                  <Label>Lutteur</Label>
                  <Select
                    value={newCard.fighter_id}
                    onValueChange={(value) => setNewCard(prev => ({ ...prev, fighter_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez" />
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

                <div>
                  <Label>Type</Label>
                  <Select
                    value={newCard.card_type}
                    onValueChange={(value: "yellow" | "red") => setNewCard(prev => ({ ...prev, card_type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yellow">Jaune</SelectItem>
                      <SelectItem value="red">Rouge</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Minute</Label>
                  <Input
                    type="text"
                    placeholder="MM:SS"
                    value={newCard.minute_given}
                    onChange={(e) => setNewCard(prev => ({ ...prev, minute_given: e.target.value }))}
                  />
                </div>

                <div className="md:col-span-2">
                  <Label>Raison</Label>
                  <Input
                    type="text"
                    placeholder="Raison du carton..."
                    value={newCard.card_reason}
                    onChange={(e) => setNewCard(prev => ({ ...prev, card_reason: e.target.value }))}
                  />
                </div>
              </div>

              <Button onClick={handleAddCard} disabled={!newCard.fighter_id}>
                <CardIcon className="h-4 w-4 mr-2" />
                Ajouter Carton
              </Button>

              {/* Liste des cartons */}
              <div className="mt-4 space-y-2">
                {cards.map((card) => (
                  <div key={card.id} className="flex items-center justify-between p-2 border rounded">
                    <div className="flex items-center space-x-3">
                      <Badge variant={card.card_type === "red" ? "destructive" : "secondary"}>
                        {card.card_type === "red" ? "Rouge" : "Jaune"}
                      </Badge>
                      <Typography variant="body-sm">
                        {card.fighter?.first_name} {card.fighter?.last_name}
                      </Typography>
                      <Typography variant="body-base" theme="muted">
                        {card.minute_given}
                      </Typography>
                      {card.card_reason && (
                        <Typography variant="body-base" theme="muted">
                          - {card.card_reason}
                        </Typography>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteCard(card.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <DrawerFooter>
          <div className="flex justify-between w-full">
            <div className="space-x-2">
              <Button
                variant="outline"
                onClick={() => onDelete(match.id)}
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer
              </Button>
            </div>
            
            <div className="space-x-2">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                <X className="h-4 w-4 mr-2" />
                Fermer
              </Button>
              <Button onClick={handleSaveEdit}>
                <Save className="h-4 w-4 mr-2" />
                Sauvegarder
              </Button>
            </div>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}