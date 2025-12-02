// app/admin/sub-groups/[subGroupId]/organisation/fighter-drawer.tsx
"use client";

import { useState, useEffect } from "react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
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
import { Match, Fighter, FighterCard } from "@/types";
import { Trophy, Square as CardIcon, X, Award } from "lucide-react";
import { api } from "@/lib/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getBeltColor } from "@/utils/getBeltColor";

interface FighterDrawerProps {
  match: Match;
  fighter: Fighter;
  fighterType: "fighter1" | "fighter2";
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateMatch: (updatedMatch: Match) => Promise<void>;
}

export function FighterDrawer({
  match,
  fighter,
  fighterType,
  open,
  onOpenChange,
  onUpdateMatch,
}: FighterDrawerProps) {
  const [cards, setCards] = useState<FighterCard[]>([]);
  const [newCard, setNewCard] = useState({
    card_type: "yellow" as "yellow" | "red",
    minute_given: "",
    card_reason: "",
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (fighter && open) {
      loadFighterCards();
    }
  }, [fighter, open]);

  const loadFighterCards = async () => {
    if (!fighter) return;

    try {
      const response = await api.get(
        `/api/fighter-cards?match_id=${match.id}&fighter_id=${fighter.id}`
      );
      if (response && response) {
        setCards((response as { data: FighterCard[] }).data);
      }
    } catch (error) {
      console.error("Erreur chargement des cartons:", error);
    }
  };

  const handleAddCard = async () => {
    if (!fighter) return;

    try {
      const formData = new FormData();
      formData.append("match_id", match.id.toString());
      formData.append("fighter_id", fighter.id.toString());
      formData.append("card_type", newCard.card_type);
      formData.append("minute_given", `${newCard.minute_given}:00`);
      formData.append("card_reason", newCard.card_reason);

      const response = await api.post("/api/fighter-cards", formData);

      if (response && (response as any).success) {
        setNewCard({
          card_type: "yellow",
          minute_given: "",
          card_reason: "",
        });
        loadFighterCards();
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
      loadFighterCards();
    } catch (error) {
      console.error("Erreur suppression carton:", error);
    }
  };

  const handleSetWinner = async () => {
    if (!fighter) return;

    try {
      setIsSaving(true);
      const updatedMatch = {
        ...match,
        winner_fighter_id: fighter.id,
        match_result:
          fighterType === "fighter1" ? "fighter1_win" : "fighter2_win",
        status: "completed",
      };
      await onUpdateMatch(updatedMatch as Match);
      onOpenChange(false);
    } catch (error) {
      console.error("Erreur désignation vainqueur:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const getCardCount = (type: "yellow" | "red") => {
    return cards.filter((card) => card.card_type === type && !card.is_cancelled)
      .length;
  };

  const yellowCards = getCardCount("yellow");
  const redCards = getCardCount("red");

  if (!fighter) return null;

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader>
          <DrawerTitle className="flex items-center justify-between">
            <span>
              {fighter.first_name} {fighter.last_name}
            </span>
            <div className="flex items-center gap-2">
              {match.winner_fighter_id === fighter.id && (
                <Badge variant="default" className="flex items-center gap-1">
                  <Award className="h-3 w-3" />
                  Vainqueur
                </Badge>
              )}
            </div>
          </DrawerTitle>
          <DrawerDescription>Gestion individuelle du lutteur</DrawerDescription>
        </DrawerHeader>

        <div className="px-4 overflow-y-auto">
          {/* Informations du lutteur */}
          <Card className="mb-3 p-2">
            <CardContent className="p-2">
              <div className="text-center">
                <Avatar
                  className="w-20 h-20 mx-auto mb-2 border-4"
                  style={{
                    borderColor: getBeltColor(
                      fighterType === "fighter1"
                        ? match.sub_group?.belt_region1
                        : match.sub_group?.belt_region2,
                      fighterType === "fighter1" ? "#10b981" : "#f59e0b"
                    ),
                  }}
                >
                  <AvatarImage
                    src={fighter.profile_image}
                    alt={`${fighter.first_name} ${fighter.last_name}`}
                  />
                  <AvatarFallback>
                    {fighter.first_name[0]}
                    {fighter.last_name[0]}
                  </AvatarFallback>
                </Avatar>

                <Typography variant="h4" weight="bold" className="mb-1">
                  {fighter.first_name} {fighter.last_name}
                </Typography>

                {fighter.nickname && (
                  <Typography variant="body-lg" theme="muted" className="mb-2">
                    "{fighter.nickname}"
                  </Typography>
                )}

                <div className="grid grid-cols-2 gap-3 mt-2">
                  <div>
                    <Typography variant="body-sm" weight="medium" theme="muted">
                      Classement
                    </Typography>
                    <Typography variant="body-lg">
                      {fighter.ranking || "N/A"}
                    </Typography>
                  </div>
                  <div>
                    <Typography variant="body-sm" weight="medium" theme="muted">
                      Région
                    </Typography>
                    <Typography variant="body-lg">
                      {fighter.region?.name || "N/A"}
                    </Typography>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cartons du lutteur */}
          <Card className="mb-2 p-2">
            <CardContent className="p-2">
              <Typography
                variant="h4"
                className="mb-3 flex items-center justify-between"
              >
                <span className="flex items-center">
                  <CardIcon className="h-5 w-5 mr-2" />
                  Cartons
                </span>
                <div className="flex gap-2">
                  {yellowCards > 0 && (
                    <Badge
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                      {yellowCards}
                    </Badge>
                  )}
                  {redCards > 0 && (
                    <Badge
                      variant="destructive"
                      className="flex items-center gap-1"
                    >
                      <div className="w-2 h-2 bg-red-500 rounded-full" />
                      {redCards}
                    </Badge>
                  )}
                </div>
              </Typography>

              {/* Formulaire d'ajout de carton */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-3">
                <div>
                  <Label>Type</Label>
                  <Select
                    value={newCard.card_type}
                    onValueChange={(value: "yellow" | "red") =>
                      setNewCard((prev) => ({ ...prev, card_type: value }))
                    }
                    disabled={isSaving}
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
                    placeholder="00:00:00"
                    value={newCard.minute_given}
                    onChange={(e) =>
                      setNewCard((prev) => ({
                        ...prev,
                        minute_given: e.target.value,
                      }))
                    }
                    disabled={isSaving}
                  />
                </div>

                <div className="md:col-span-2">
                  <Label>Raison</Label>
                  <Input
                    type="text"
                    placeholder="Raison du carton..."
                    value={newCard.card_reason}
                    onChange={(e) =>
                      setNewCard((prev) => ({
                        ...prev,
                        card_reason: e.target.value,
                      }))
                    }
                    disabled={isSaving}
                  />
                </div>
              </div>

              <Button
                onClick={handleAddCard}
                disabled={!newCard.minute_given || isSaving}
                className="w-full"
              >
                <CardIcon className="h-4 w-4 mr-2" />
                Ajouter Carton
              </Button>

              {/* Liste des cartons */}
              <div className="mt-3 space-y-2">
                {cards.map((card) => (
                  <div
                    key={card.id}
                    className="flex items-center justify-between p-2 border rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <Badge
                        variant={
                          card.card_type === "red" ? "destructive" : "secondary"
                        }
                      >
                        {card.card_type === "red" ? "Rouge" : "Jaune"}
                      </Badge>
                      <div>
                        <Typography variant="body-sm" weight="medium">
                          {card.minute_given}
                        </Typography>
                        {card.card_reason && (
                          <Typography variant="body-base" theme="muted">
                            {card.card_reason}
                          </Typography>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteCard(card.id)}
                      disabled={isSaving}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card className="p-2">
            <CardContent className="p-2">
              <Typography variant="h4" className="mb-3 flex items-center">
                <Trophy className="h-5 w-5 mr-2" />
                Actions
              </Typography>

              <Button
                onClick={handleSetWinner}
                disabled={isSaving || match.winner_fighter_id === fighter.id}
                className="w-full"
                variant={
                  match.winner_fighter_id === fighter.id ? "default" : "outline"
                }
              >
                <Trophy className="h-4 w-4 mr-2" />
                {match.winner_fighter_id === fighter.id
                  ? "Vainqueur désigné"
                  : "Désigner vainqueur"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
