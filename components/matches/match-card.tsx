// components/matches/simple-match-card.tsx
"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Typography } from "@/components/ui/typography";
import { Match } from "@/types";
import {
  Clock,
  Swords,
  Trophy,
  ChevronRight,
  Play,
  Pause,
  Edit,
  Trash2
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface SimpleMatchCardProps {
  match: Match;
  subGroupId: number;
  compact?: boolean;
  onDelete: (matchId: number) => void;
  onEdit: (match: Match) => void;
}

export function SimpleMatchCard({
  match,
  subGroupId,
  compact = false,
  onDelete,
  onEdit
}: SimpleMatchCardProps) {
  const router = useRouter();
  const [isHovered, setIsHovered] = useState(false);

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "completed": return "default";
      case "live": return "destructive";
      case "scheduled": return "secondary";
      case "cancelled": return "outline";
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

  const formatTime = (timeString?: string) => {
    if (!timeString) return "";
    return timeString.slice(0, 5);
  };

  const handleCardClick = () => {
    router.push(`/ad/matches/${match.id}`);
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(match);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(match.id);
  };

  // Version compacte (pour aperçu rapide)
  if (compact) {
    return (
      <Card
        className={cn(
          "cursor-pointer transition-all hover:shadow-md relative",
          isHovered && "border-primary"
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleCardClick}
      >
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-center">
                <Typography variant="body-sm" weight="medium">
                  Match #{match.match_number}
                </Typography>
                {match.match_date && (
                  <Typography variant="caption1" theme="muted">
                    {formatTime(match.start_time)}
                  </Typography>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={match.fighter1?.profile_image} />
                  <AvatarFallback>
                    {match.fighter1?.first_name?.[0]}{match.fighter1?.last_name?.[0]}
                  </AvatarFallback>
                </Avatar>
                <Swords className="h-3 w-3 text-muted-foreground" />
                <Avatar className="h-8 w-8">
                  <AvatarImage src={match.fighter2?.profile_image} />
                  <AvatarFallback>
                    {match.fighter2?.first_name?.[0]}{match.fighter2?.last_name?.[0]}
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant={getStatusVariant(match.status)} className="text-xs">
                {getStatusText(match.status)}
              </Badge>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>

          {/* Boutons d'action au survol (version compacte) */}
          {isHovered && (
            <div className="absolute top-2 right-2 flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 rounded-full text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                onClick={handleEditClick}
              >
                <Edit className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 rounded-full text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={handleDeleteClick}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Version normale
  return (
    <Card
      className={cn(
        "cursor-pointer transition-all hover:shadow-lg relative",
        isHovered && "border-primary border-2",
        match.status === "live" && "border-destructive border-2 animate-pulse"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleCardClick}
    >
      <CardContent className="p-4">
        {/* En-tête */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Typography variant="body-lg" weight="bold">
              Match #{match.match_number}
            </Typography>
            {match.status === "live" && (
              <div className="flex items-center gap-1 animate-pulse">
                <div className="h-2 w-2 rounded-full bg-red-500" />
                <Typography variant="body-sm" className="text-red-500">
                  EN DIRECT
                </Typography>
              </div>
            )}
          </div>
          <Badge variant={getStatusVariant(match.status)}>
            {getStatusText(match.status)}
          </Badge>

          {/* Boutons d'action au survol */}
          {isHovered && (
            <div className="absolute top-2 right-2 flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 rounded-full text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                onClick={handleEditClick}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 rounded-full text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={handleDeleteClick}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Participants */}
        <div className="grid grid-cols-2 gap-4 mb-3">
          {/* Fighter 1 */}
          <div className="text-center p-3 rounded-lg bg-muted/30">
            {match.fighter1 ? (
              <>
                <Avatar className="h-16 w-16 mx-auto mb-2">
                  <AvatarImage src={match.fighter1.profile_image} />
                  <AvatarFallback>
                    {match.fighter1.first_name[0]}{match.fighter1.last_name[0]}
                  </AvatarFallback>
                </Avatar>
                <Typography variant="body-sm" weight="medium">
                  {match.fighter1.first_name} {match.fighter1.last_name}
                </Typography>
                {match.fighter1.nickname && (
                  <Typography variant="caption1" theme="muted">
                    "{match.fighter1.nickname}"
                  </Typography>
                )}
                {match.winner_fighter_id === match.fighter1.id && (
                  <Trophy className="h-4 w-4 mx-auto mt-1 text-yellow-500" />
                )}
              </>
            ) : (
              <Typography variant="body-sm" theme="muted" className="italic">
                À définir
              </Typography>
            )}
          </div>

          {/* Fighter 2 */}
          <div className="text-center p-3 rounded-lg bg-muted/30">
            {match.fighter2 ? (
              <>
                <Avatar className="h-16 w-16 mx-auto mb-2">
                  <AvatarImage src={match.fighter2.profile_image} />
                  <AvatarFallback>
                    {match.fighter2.first_name[0]}{match.fighter2.last_name[0]}
                  </AvatarFallback>
                </Avatar>
                <Typography variant="body-sm" weight="medium">
                  {match.fighter2.first_name} {match.fighter2.last_name}
                </Typography>
                {match.fighter2.nickname && (
                  <Typography variant="caption1" theme="muted">
                    "{match.fighter2.nickname}"
                  </Typography>
                )}
                {match.winner_fighter_id === match.fighter2.id && (
                  <Trophy className="h-4 w-4 mx-auto mt-1 text-yellow-500" />
                )}
              </>
            ) : (
              <Typography variant="body-sm" theme="muted" className="italic">
                À définir
              </Typography>
            )}
          </div>
        </div>

        {/* Infos bas */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-4">
            {match.match_date && (
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{formatTime(match.start_time)}</span>
              </div>
            )}
            {match.break_count > 0 && (
              <div className="flex items-center gap-1">
                <Pause className="h-3 w-3" />
                <span>{match.break_count} pause(s)</span>
              </div>
            )}
          </div>
          <ChevronRight className="h-4 w-4" />
        </div>
      </CardContent>
    </Card>
  );
}