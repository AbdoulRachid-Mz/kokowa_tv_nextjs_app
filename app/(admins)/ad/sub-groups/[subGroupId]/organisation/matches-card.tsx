// app/admin/sub-groups/[subGroupId]/organisation/matches-card.tsx
"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Typography } from "@/components/ui/typography";
import { Match } from "@/types";
import {
  MoreVertical,
  Clock,
  Users,
  Trophy,
  Minus,
  Square,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MatchDrawer } from "./match-drawer";
import { FighterDrawer } from "./fighter-drawer";
import { getBeltColor } from "@/utils/getBeltColor";
import { cn } from "@/lib/utils";

interface MatchCardProps {
  match: Match;
  onDelete: (matchId: number) => void;
  onEdit: (match: Match) => void;
}

export function MatchCard({ match, onDelete, onEdit }: MatchCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [matchDrawerOpen, setMatchDrawerOpen] = useState(false);
  const [fighter1DrawerOpen, setFighter1DrawerOpen] = useState(false);
  const [fighter2DrawerOpen, setFighter2DrawerOpen] = useState(false);

  // Fonction pour compter les cartons par lutteur
  const getFighterCards = (fighterId: number) => {
    if (!match.cards) return { yellow: 0, red: 0 };

    const fighterCards = match.cards.filter(
      (card) => card.fighter_id === fighterId && !card.is_cancelled
    );

    return {
      yellow: fighterCards.filter((card) => card.card_type === "yellow").length,
      red: fighterCards.filter((card) => card.card_type === "red").length,
    };
  };

  const fighter1Cards = match.fighter1
    ? getFighterCards(match.fighter1.id)
    : { yellow: 0, red: 0 };
  const fighter2Cards = match.fighter2
    ? getFighterCards(match.fighter2.id)
    : { yellow: 0, red: 0 };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "completed":
        return "default";
      case "live":
        return "destructive";
      case "scheduled":
        return "secondary";
      case "cancelled":
        return "outline";
      case "postponed":
        return "outline";
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatTime = (timeString?: string) => {
    if (!timeString) return "";
    return timeString.slice(0, 5);
  };

  return (
    <>
      <Card
        className={cn(
          "transition-all duration-200 cursor-pointer border-2",
          isHovered && "shadow-md",
          isHovered && match.status === "scheduled" && "border-default",
          isHovered && match.status === "live" && "border-destructive",
          isHovered && match.status === "round_break" && "border-secondary",
          isHovered && match.status === "completed" && "border-primary2",
          isHovered && match.status === "cancelled" && "border-outline",
          isHovered && match.status === "postponed" && "border-outline",
          isHovered && match.status === "reclamation" && "border-outline",
          match.status === "cancelled" && "opacity-60"
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => setMatchDrawerOpen(true)}
      >
        <CardContent className="p-2">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <Typography variant="body-sm" weight="medium">
                Match #{match.match_number}
              </Typography>
              <Badge
                variant={getStatusVariant(match.status)}
                className="text-xs"
              >
                {getStatusText(match.status)}
              </Badge>
            </div>

            {isHovered && (
              <Button
                variant="default"
                size="sm"
                className="h-8 w-8 p-0 rounded-full"
                onClick={(e) => {
                  e.stopPropagation();
                  setMatchDrawerOpen(true);
                }}
              >
                <MoreVertical className="h-3 w-3" />
              </Button>
            )}
          </div>

          {/* Participants */}
          <div className="grid grid-cols-2 gap-4 mb-3">
            {/* Fighter 1 */}
            <div
              className={`text-center p-2 rounded-lg cursor-pointer ${
                match.match_result === "fighter1_win"
                  ? "bg-green-50 border border-green-200"
                  : match.status === "cancelled"
                  ? "bg-gray-100"
                  : "bg-muted/30"
              }`}
              onClick={(e) => {
                e.stopPropagation();
                setFighter1DrawerOpen(true);
              }}
            >
              {match.fighter1 ? (
                <>
                  <div className="relative inline-block mx-auto mb-2">
                    <Avatar
                      className="w-12 h-12"
                      style={{
                        border: `2px solid ${getBeltColor(
                          match.sub_group?.belt_region1,
                          "#10b981"
                        )}`,
                      }}
                    >
                      <AvatarImage
                        src={match.fighter1.profile_image}
                        alt={`${match.fighter1.first_name} ${match.fighter1.last_name}`}
                      />
                      <AvatarFallback>
                        {match.fighter1.first_name[0]}
                        {match.fighter1.last_name[0]}
                      </AvatarFallback>
                    </Avatar>

                    {/* Badge victoire */}
                    {match.match_result === "fighter1_win" && (
                      <div className="absolute -bottom-1 -right-1 bg-green-500 text-white rounded-full p-1">
                        <Trophy className="w-3 h-3" />
                      </div>
                    )}

                    {/* Badge match nul */}
                    {match.match_result === "draw" && (
                      <div className="absolute -bottom-1 -right-1 bg-blue-500 text-white rounded-full p-1">
                        <Minus className="w-3 h-3" />
                      </div>
                    )}

                    {/* Badges cartons */}
                    {(fighter1Cards.yellow > 0 || fighter1Cards.red > 0) && (
                      <div className="absolute -top-1 -right-1 flex gap-1">
                        {fighter1Cards.yellow > 0 && (
                          <div className="bg-yellow-500 text-white rounded-full w-4 h-4 text-xs flex items-center justify-center">
                            {fighter1Cards.yellow}
                          </div>
                        )}
                        {fighter1Cards.red > 0 && (
                          <div className="bg-red-500 text-white rounded-full w-4 h-4 text-xs flex items-center justify-center">
                            {fighter1Cards.red}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <Typography
                    variant="body-sm"
                    weight="medium"
                    className="truncate"
                    hasTooltip
                    tooltipContent={
                      match.fighter1.nickname && match.fighter1.nickname
                    }
                  >
                    {match.fighter1.first_name} {match.fighter1.last_name}
                  </Typography>

                  {match.fighter1.nickname && (
                    <Typography
                      variant="body-base"
                      theme="muted"
                      className="truncate"
                    >
                      "{match.fighter1.nickname}"
                    </Typography>
                  )}

                  <Typography
                    variant="body-base"
                    theme="muted"
                    className="mt-1"
                  >
                    Cliquer pour gérer
                  </Typography>
                </>
              ) : (
                <Typography variant="body-sm" theme="muted" className="italic">
                  À définir
                </Typography>
              )}
            </div>

            {/* Fighter 2 */}
            <div
              className={`text-center p-2 rounded-lg cursor-pointer ${
                match.match_result === "fighter2_win"
                  ? "bg-green-50 border border-green-200"
                  : match.status === "cancelled"
                  ? "bg-gray-100"
                  : "bg-muted/30"
              }`}
              onClick={(e) => {
                e.stopPropagation();
                setFighter2DrawerOpen(true);
              }}
            >
              {match.fighter2 ? (
                <>
                  <div className="relative inline-block mx-auto mb-2">
                    <Avatar
                      className="w-12 h-12"
                      style={{
                        border: `2px solid ${getBeltColor(
                          match.sub_group?.belt_region2,
                          "#f59e0b"
                        )}`,
                      }}
                    >
                      <AvatarImage
                        src={match.fighter2.profile_image}
                        alt={`${match.fighter2.first_name} ${match.fighter2.last_name}`}
                      />
                      <AvatarFallback>
                        {match.fighter2.first_name[0]}
                        {match.fighter2.last_name[0]}
                      </AvatarFallback>
                    </Avatar>

                    {/* Badge victoire */}
                    {match.match_result === "fighter2_win" && (
                      <div className="absolute -bottom-1 -right-1 bg-green-500 text-white rounded-full p-1">
                        <Trophy className="w-3 h-3" />
                      </div>
                    )}

                    {/* Badge match nul */}
                    {match.match_result === "draw" && (
                      <div className="absolute -bottom-1 -right-1 bg-blue-500 text-white rounded-full p-1">
                        <Minus className="w-3 h-3" />
                      </div>
                    )}

                    {/* Badges cartons */}
                    {(fighter2Cards.yellow > 0 || fighter2Cards.red > 0) && (
                      <div className="absolute -top-1 -right-1 flex gap-1">
                        {fighter2Cards.yellow > 0 && (
                          <div className="bg-yellow-500 text-white rounded-full w-4 h-4 text-xs flex items-center justify-center">
                            {fighter2Cards.yellow}
                          </div>
                        )}
                        {fighter2Cards.red > 0 && (
                          <div className="bg-red-500 text-white rounded-full w-4 h-4 text-xs flex items-center justify-center">
                            {fighter2Cards.red}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <Typography
                    variant="body-sm"
                    weight="medium"
                    className="truncate"
                    hasTooltip
                    tooltipContent={
                      match.fighter2.nickname && match.fighter2.nickname
                    }
                  >
                    {match.fighter2.first_name} {match.fighter2.last_name}
                  </Typography>

                  {match.fighter2.nickname && (
                    <Typography
                      variant="body-base"
                      theme="muted"
                      className="truncate"
                    >
                      "{match.fighter2.nickname}"
                    </Typography>
                  )}

                  <Typography
                    variant="body-base"
                    theme="muted"
                    className="mt-1"
                  >
                    Cliquer pour gérer
                  </Typography>
                </>
              ) : (
                <Typography variant="body-sm" theme="muted" className="italic">
                  À définir
                </Typography>
              )}
            </div>
          </div>

          {/* Informations du match */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center space-x-4">
              {match.match_date && (
                <div className="flex items-center space-x-1">
                  <Clock className="h-3 w-3" />
                  <span>{formatDate(match.match_date)}</span>
                  {match.start_time && (
                    <span>à {formatTime(match.start_time)}</span>
                  )}
                </div>
              )}

              {match.break_count > 0 && (
                <div className="flex items-center space-x-1">
                  <Square className="h-3 w-3" />
                  <span>{match.break_count} pause(s)</span>
                </div>
              )}
            </div>

            {match.match_result && (
              <Badge variant="outline" className="text-xs">
                {match.match_result === "fighter1_win" && "Victoire 1"}
                {match.match_result === "fighter2_win" && "Victoire 2"}
                {match.match_result === "draw" && "Match nul"}
                {match.match_result === "cancelled" && "Annulé"}
                {match.match_result === "postponed" && "Reporté"}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Drawers */}
      <MatchDrawer
        match={match}
        open={matchDrawerOpen}
        onOpenChange={setMatchDrawerOpen}
        onDelete={onDelete}
        onEdit={onEdit}
        onFighterClick={(fighterType) => {
          setMatchDrawerOpen(false);
          if (fighterType === "fighter1") {
            setFighter1DrawerOpen(true);
          } else {
            setFighter2DrawerOpen(true);
          }
        }}
      />

      {match.fighter1 && (
        <FighterDrawer
          match={match}
          fighter={match.fighter1}
          fighterType="fighter1"
          open={fighter1DrawerOpen}
          onOpenChange={setFighter1DrawerOpen}
          onUpdateMatch={async (updatedMatch) => await onEdit(updatedMatch)}
        />
      )}

      {match.fighter2 && (
        <FighterDrawer
          match={match}
          fighter={match.fighter2}
          fighterType="fighter2"
          open={fighter2DrawerOpen}
          onOpenChange={setFighter2DrawerOpen}
          onUpdateMatch={async (updatedMatch) => await onEdit(updatedMatch)}
        />
      )}
    </>
  );
}
