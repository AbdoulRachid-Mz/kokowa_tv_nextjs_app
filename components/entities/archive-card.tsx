// components/entities/entity-cards.tsx
"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArchiveFighterAchievement } from "@/types";
import {
  Trophy,
  User,
  MapPin,
  Calendar,
  History,
  RotateCcw,
  Eye,
  Edit,
} from "lucide-react";

interface ArchiveAchievementCardProps {
  archive: ArchiveFighterAchievement;
  viewMode: "grid" | "list";
  onEdit?: (id: number) => void;
  onView?: (id: number) => void;
  onRestore?: (id: number) => void;
}

export const ArchiveAchievementCard = ({
  archive,
  viewMode,
  onEdit,
  onView,
  onRestore,
}: ArchiveAchievementCardProps) => {
  const isGrid = viewMode === "grid";

  const getPositionColor = (position: string) => {
    switch (position) {
      case "1st":
        return "bg-yellow-100 text-yellow-800";
      case "2nd":
        return "bg-gray-100 text-gray-800";
      case "3rd":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-blue-100 text-blue-800";
    }
  };

  const getReasonColor = (reason: string) => {
    switch (reason?.toLowerCase()) {
      case "correction":
        return "bg-blue-100 text-blue-800";
      case "duplicate":
        return "bg-yellow-100 text-yellow-800";
      case "error":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (isGrid) {
    return (
      <Card className="h-full hover:shadow-lg transition-shadow">
        <CardContent className="p-4 h-full flex flex-col">
          {/* En-tête */}
          <div className="flex justify-between items-start mb-3">
            <Badge className={getPositionColor(archive.position)}>
              <Trophy className="h-3 w-3 mr-1" />
              {archive.position === "1st" ? "🥇" :
               archive.position === "2nd" ? "🥈" :
               archive.position === "3rd" ? "🥉" : "🏅"}
            </Badge>
            <Badge variant="secondary">
              <History className="h-3 w-3 mr-1" />
              Archive
            </Badge>
          </div>

          {/* Titre */}
          <Typography variant="h5" weight="semibold" className="mb-2 line-clamp-2">
            {archive.title}
          </Typography>

          {/* Informations */}
          <div className="space-y-2 mb-4 flex-1">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <Typography variant="body-sm" className="line-clamp-1">
                {archive.fighter?.first_name} {archive.fighter?.last_name}
              </Typography>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <Typography variant="body-sm" className="line-clamp-1">
                {archive.region?.name}
              </Typography>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <Typography variant="body-sm">
                {archive.year}
              </Typography>
            </div>
          </div>

          {/* Raison et actions */}
          <div className="space-y-3">
            {archive.archive_reason && (
              <Badge className={getReasonColor(archive.archive_reason)}>
                {archive.archive_reason}
              </Badge>
            )}
            
            <div className="flex gap-2">
              {onView && (
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={() => onView(archive.id)}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  Voir
                </Button>
              )}
              {onRestore && (
                <Button
                  size="sm"
                  variant="default"
                  className="flex-1"
                  onClick={() => onRestore(archive.id)}
                >
                  <RotateCcw className="h-4 w-4 mr-1" />
                  Restaurer
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Mode liste
  return (
    <Card className="hover:bg-gray-50 transition-colors">
      <CardContent className="p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-3">
              <Typography variant="body-lg" weight="semibold">
                {archive.title}
              </Typography>
              <Badge className={getPositionColor(archive.position)}>
                {archive.position}
              </Badge>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1">
                <User className="h-4 w-4 text-muted-foreground" />
                <Typography variant="body-sm" theme="muted">
                  {archive.fighter?.first_name} {archive.fighter?.last_name}
                </Typography>
              </div>
              <span className="text-gray-300">•</span>
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <Typography variant="body-sm" theme="muted">
                  {archive.region?.name}
                </Typography>
              </div>
              <span className="text-gray-300">•</span>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <Typography variant="body-sm" theme="muted">
                  {archive.year}
                </Typography>
              </div>
            </div>
            
            {archive.description && (
              <Typography variant="body-sm" className="line-clamp-2 text-muted-foreground">
                {archive.description}
              </Typography>
            )}
          </div>

          <div className="flex flex-col items-end gap-2">
            <div className="flex gap-2">
              {archive.archive_reason && (
                <Badge className={getReasonColor(archive.archive_reason)}>
                  {archive.archive_reason}
                </Badge>
              )}
              <Badge variant="outline">
                <History className="h-3 w-3 mr-1" />
                Archive
              </Badge>
            </div>
            
            <div className="flex gap-2">
              {onView && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onView(archive.id)}
                >
                  <Eye className="h-4 w-4" />
                </Button>
              )}
              {onRestore && (
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => onRestore(archive.id)}
                >
                  <RotateCcw className="h-4 w-4" />
                  Restaurer
                </Button>
              )}
            </div>
            
            <Typography variant="caption2" theme="muted">
              Archivé le {new Date(archive.archived_at).toLocaleDateString()}
            </Typography>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};