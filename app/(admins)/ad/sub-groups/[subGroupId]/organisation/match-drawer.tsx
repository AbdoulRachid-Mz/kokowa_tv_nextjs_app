// /ad/sub-groups/[subGroupId]/organisation/match-drawer.tsx
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Match } from "@/types";
import {
  Trash2,
  Pause,
  Play,
  Save,
  X,
  Clock,
  Users,
  Equal,
  Timer,
} from "lucide-react";
import { api } from "@/lib/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface MatchDrawerProps {
  match: Match;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete: (matchId: number) => void;
  onEdit: (match: Match) => void;
  onFighterClick: (fighterType: "fighter1" | "fighter2") => void;
}

export function MatchDrawer({
  match,
  open,
  onOpenChange,
  onDelete,
  onEdit,
  onFighterClick,
}: MatchDrawerProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [breakCount, setBreakCount] = useState(match.break_count || 0);
  const [isLive, setIsLive] = useState(match.status === "live");
  const [matchTime, setMatchTime] = useState("00:00:00");

  const handleUpdateMatch = async (updatedMatch: Match) => {
    try {
      setIsSaving(true);
      await onEdit(updatedMatch);
    } catch (error) {
      console.error("Erreur mise à jour match:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSetResult = async (
    result: "fighter1_win" | "fighter2_win" | "draw" | "cancelled" | "postponed"
  ) => {
    let winnerId = null;
    let status = match.status;

    switch (result) {
      case "fighter1_win":
        winnerId = match.fighter1_id;
        status = "completed";
        break;
      case "fighter2_win":
        winnerId = match.fighter2_id;
        status = "completed";
        break;
      case "draw":
        winnerId = null;
        status = "completed";
        break;
      case "cancelled":
        winnerId = null;
        status = "cancelled";
        break;
      case "postponed":
        winnerId = null;
        status = "postponed";
        break;
    }

    const updatedMatch = {
      ...match,
      winner_fighter_id: winnerId,
      match_result: result,
      status: status,
    };

    await handleUpdateMatch(updatedMatch as Match);
  };

  const handleStatusChange = async (status: string) => {
    const updatedMatch = {
      ...match,
      status,
    };

    await handleUpdateMatch(updatedMatch as Match);
    setIsLive(status === "live");
  };

  const handleAddBreak = async () => {
    const newBreakCount = breakCount + 1;
    setBreakCount(newBreakCount);

    const updatedMatch = {
      ...match,
      break_count: newBreakCount,
    };

    await handleUpdateMatch(updatedMatch as Match);
  };

  const handleToggleLive = async () => {
    const newStatus = isLive ? "scheduled" : "live";
    setIsLive(!isLive);

    const updatedMatch = {
      ...match,
      status: newStatus,
    };

    await handleUpdateMatch(updatedMatch as Match);
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "completed":
        return "default";
      case "live":
        return "destructive";
      case "scheduled":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "completed":
        return "Terminé";
      case "live":
        return "En direct";
      case "scheduled":
        return "Programmé";
      case "cancelled":
        return "Annulé";
      case "postponed":
        return "Reporté";
      default:
        return status;
    }
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader>
          <DrawerTitle className="flex items-center justify-between">
            <span>Match #{match.match_number} - Contrôles</span>
            <div className="flex items-center gap-2">
              {isSaving && (
                <Badge variant="outline" className="text-xs">
                  Sauvegarde...
                </Badge>
              )}
              <Badge variant={getStatusVariant(match.status)}>
                {getStatusText(match.status)}
              </Badge>
            </div>
          </DrawerTitle>
          <DrawerDescription>Contrôles globaux du match</DrawerDescription>
        </DrawerHeader>

        <div className="px-3 overflow-y-auto">
          {/* Résumé des lutteurs */}
          <Card className="mb-3 p-2">
            <CardContent className="p-2">
              <div className="grid grid-cols-2 gap-3">
                {/* Fighter 1 */}
                <div
                  className="text-center p-1 rounded-lg bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => onFighterClick("fighter1")}
                >
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
                      <Typography variant="body-base" theme="muted">
                        Cliquer pour gérer
                      </Typography>
                    </>
                  )}
                </div>

                {/* Fighter 2 */}
                <div
                  className="text-center p-2 rounded-lg bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => onFighterClick("fighter2")}
                >
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
                      <Typography variant="body-base" theme="muted">
                        Cliquer pour gérer
                      </Typography>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contrôles de match */}
          <Card className="mb-3 p-2">
            <CardContent className="p-2">
              <Typography variant="h4" className="mb-3 flex items-center">
                <Timer className="h-5 w-5 mr-2" />
                Contrôles du match
              </Typography>

              {/* Timer et pauses */}
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="text-center">
                  <Typography
                    variant="body-sm"
                    weight="medium"
                    theme="muted"
                    className="mb-2"
                  >
                    Durée
                  </Typography>
                  <Typography variant="h4" className="font-mono">
                    {matchTime}
                  </Typography>
                </div>
                <div className="text-center">
                  <Typography
                    variant="body-sm"
                    weight="medium"
                    theme="muted"
                    className="mb-2"
                  >
                    Pauses
                  </Typography>
                  <Typography variant="h4">{breakCount}</Typography>
                </div>
              </div>

              {/* Boutons de contrôle */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                <Button
                  onClick={handleToggleLive}
                  variant={isLive ? "destructive" : "default"}
                  disabled={isSaving}
                >
                  {isLive ? (
                    <>
                      <Pause className="h-4 w-4 mr-2" />
                      Pause
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Démarrer
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleAddBreak}
                  variant="outline"
                  disabled={isSaving || !isLive}
                >
                  <Clock className="h-4 w-4 mr-2" />
                  Pause +
                </Button>
              </div>

              {/* Statut du match */}
              <div className="space-y-2">
                <Typography variant="body-sm" weight="medium">
                  Statut du match
                </Typography>
                <Select
                  value={match.status}
                  onValueChange={handleStatusChange}
                  disabled={isSaving}
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

          {/* Résultat final */}
          <Card className="mb-3 p-2">
            <CardContent className="p-2">
              <Typography variant="h4" className="mb-3">
                Résultat final
              </Typography>

              <div className="flex justify-center items-center gap-2">
                <Button
                  variant={
                    match.match_result === "fighter1_win"
                      ? "default"
                      : "outline"
                  }
                  size="sm"
                  onClick={() => handleSetResult("fighter1_win")}
                  disabled={isSaving || !match.fighter1}
                >
                  Victoire 1
                </Button>
                <Button
                  variant={
                    match.match_result === "draw" ? "default" : "outline"
                  }
                  size="sm"
                  onClick={() => handleSetResult("draw")}
                  disabled={isSaving}
                >
                  <Equal className="h-4 w-4" />
                </Button>
                <Button
                  variant={
                    match.match_result === "fighter2_win"
                      ? "default"
                      : "outline"
                  }
                  size="sm"
                  onClick={() => handleSetResult("fighter2_win")}
                  disabled={isSaving || !match.fighter2}
                >
                  Victoire 2
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-2">
                <Button
                  variant={
                    match.match_result === "cancelled"
                      ? "destructive"
                      : "outline"
                  }
                  size="sm"
                  onClick={() => handleSetResult("cancelled")}
                  disabled={isSaving}
                >
                  Annuler
                </Button>
                <Button
                  variant={
                    match.match_result === "postponed" ? "default" : "outline"
                  }
                  size="sm"
                  onClick={() => handleSetResult("postponed")}
                  disabled={isSaving}
                >
                  Reporter
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <DrawerFooter>
          <div className="flex justify-between w-full">
            <Button
              variant="outline"
              onClick={() => onDelete(match.id)}
              className="text-destructive"
              disabled={isSaving}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Supprimer
            </Button>

            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
            >
              <X className="h-4 w-4 mr-2" />
              Fermer
            </Button>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
