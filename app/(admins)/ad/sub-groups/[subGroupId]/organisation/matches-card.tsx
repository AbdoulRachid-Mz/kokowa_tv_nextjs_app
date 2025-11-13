// app/admin/sub-groups/[subGroupId]/organisation/matches-card.tsx
"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Typography } from "@/components/ui/typography";
import { Match } from "@/types";
import { MoreVertical, Clock, Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MatchDrawer } from "./match-drawer";

interface MatchCardProps {
  match: Match;
  onDelete: (matchId: number) => void;
  onEdit: (match: Match) => void;
}

export function MatchCard({ match, onDelete, onEdit }: MatchCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

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
        className={`transition-all duration-200 cursor-pointer ${
          isHovered ? "shadow-md border-primary/20" : ""
        }`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => setDrawerOpen(true)}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <Typography variant="body-sm" weight="medium">
                Match #{match.match_number}
              </Typography>
              <Badge variant={getStatusVariant(match.status)} className="text-xs">
                {getStatusText(match.status)}
              </Badge>
            </div>

            {isHovered && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  setDrawerOpen(true);
                }}
              >
                <MoreVertical className="h-3 w-3" />
              </Button>
            )}
          </div>

          {/* Participants */}
          <div className="grid grid-cols-2 gap-4 mb-3">
            {/* Fighter 1 */}
            <div className={`text-center p-2 rounded-lg`}>
              {match.fighter1 ? (
                <>
                  <Avatar
                    className={`w-12 h-12 mx-auto mb-2 border-2 ${
                      match.winner_fighter_id === match.fighter1.id 
                        ? "border-green-500" 
                        : "border-gray-300"
                    }`}
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
                  {match.fighter1.ranking && (
                    <Typography variant="body-base" theme="muted">
                      Classement: {match.fighter1.ranking || "N/A"}
                    </Typography>
                  )}
                </>
              ) : (
                <Typography variant="body-sm" theme="muted" className="italic">
                  À définir
                </Typography>
              )}
            </div>

            {/* Fighter 2 */}
            <div className={`text-center p-2 rounded-lg`}>
              {match.fighter2 ? (
                <>
                  <Avatar
                    className={`w-12 h-12 mx-auto mb-2 border-2 ${
                      match.winner_fighter_id === match.fighter2.id 
                        ? "border-green-500" 
                        : "border-gray-300"
                    }`}
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
                  {match.fighter2.ranking && (
                    <Typography variant="body-base" theme="muted">
                      Classement: {match.fighter2.ranking || "N/A"}
                    </Typography>
                  )}
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

              {match.audience_count && (
                <div className="flex items-center space-x-1">
                  <Users className="h-3 w-3" />
                  <span>{match.audience_count} spectateurs</span>
                </div>
              )}
            </div>

            {match.match_result && (
              <Badge variant="outline" className="text-xs">
                {match.match_result === "fighter1_win" && "Victoire Lutteur 1"}
                {match.match_result === "fighter2_win" && "Victoire Lutteur 2"}
                {match.match_result === "draw" && "Match nul"}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      <MatchDrawer
        match={match}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onDelete={onDelete}
        onEdit={onEdit}
      />
    </>
  );
}