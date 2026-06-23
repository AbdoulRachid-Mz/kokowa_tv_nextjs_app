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
  MoreHorizontal,
  Trash2,
  Pencil,
  RefreshCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BaseCardProps, CardActionMenu } from "./entity-cards";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export { ArchiveCard as ArchiveAchievementCard };
// components/entities/entity-cards.tsx
export function ArchiveCard({
  item,
  viewMode = "grid",
  status,
  isCliquable = true,
  isMini = false,
  activeAction = "view",
  onEdit,
  onView,
  onDelete,
  onRestore,
  className,
}: BaseCardProps<ArchiveFighterAchievement> & {
  onRestore?: () => Promise<void>;
}) {
  const archive = item;
  const isListView = viewMode === "list";
  const isCompact = viewMode === "compact" || isMini;

  const handleMainAction = () => {
    if (!isCliquable) return;
    if (activeAction === "view" && onView) onView(archive);
    else if (activeAction === "edit" && onEdit) onEdit(archive);
    else if (activeAction === "delete" && onDelete) onDelete(archive);
    else if (onView) onView(archive);
  };

  const getPositionLabel = (position: string) => {
    const positions: Record<
      string,
      { label: string; icon: string; color: string }
    > = {
      "1st": {
        label: "1ère Place",
        icon: "🥇",
        color: "bg-yellow-100 text-yellow-800",
      },
      "2nd": {
        label: "2ème Place",
        icon: "🥈",
        color: "bg-gray-100 text-gray-800",
      },
      "3rd": {
        label: "3ème Place",
        icon: "🥉",
        color: "bg-orange-100 text-orange-800",
      },
      finalist: {
        label: "Finaliste",
        icon: "🏆",
        color: "bg-purple-100 text-purple-800",
      },
      semifinalist: {
        label: "Demi-finaliste",
        icon: "🎯",
        color: "bg-blue-100 text-blue-800",
      },
      quarterfinalist: {
        label: "Quart-de-finaliste",
        icon: "⭐",
        color: "bg-green-100 text-green-800",
      },
    };
    return (
      positions[position] || {
        label: position,
        icon: "🏅",
        color: "bg-gray-100 text-gray-800",
      }
    );
  };

  const getReasonBadge = (reason?: string) => {
    const reasons: Record<string, { label: string; color: string }> = {
      correction: { label: "Correction", color: "bg-blue-100 text-blue-800" },
      duplicate: { label: "Doublon", color: "bg-yellow-100 text-yellow-800" },
      error: { label: "Erreur", color: "bg-red-100 text-red-800" },
    };
    return (
      reasons[reason || "other"] || {
        label: "Autre",
        color: "bg-gray-100 text-gray-800",
      }
    );
  };

  const getStatusBorder = (status?: string) => {
    switch (status) {
      case "success":
        return "border-l-4 border-l-green-500";
      case "warning":
        return "border-l-4 border-l-yellow-500";
      case "error":
        return "border-l-4 border-l-red-500";
      case "info":
        return "border-l-4 border-l-blue-500";
      case "default":
        return "border-l-4 border-l-gray-300";
      default:
        return "";
    }
  };

  const hasActions = onEdit || onView || onDelete || onRestore;

  return (
    <Card
      className={cn(
        "hover:shadow-md transition-all duration-300 group relative overflow-hidden",
        isListView && "flex items-center",
        isCliquable && "cursor-pointer active:scale-[0.98]",
        getStatusBorder(status),
        className,
      )}
      onClick={handleMainAction}
    >
      <div
        className={cn(
          "p-2 flex w-full gap-3",
          isListView ? "flex-row items-center" : "flex-col",
        )}
      >
        {/* Header Area */}
        <div className={cn("flex items-center gap-3", !isListView && "w-full")}>
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
            <History className="h-5 w-5" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <Typography
                variant={isCompact ? "body-sm" : "h4"}
                weight="bold"
                className="truncate group-hover:text-primary transition-colors"
              >
                {archive.title}
              </Typography>
              {!isListView && hasActions && (
                <div
                  className="flex-shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <CardActionMenu
                    onEdit={() => onEdit?.(archive)}
                    onView={() => onView?.(archive)}
                    onDelete={() => onDelete?.(archive)}
                    extraActions={
                      onRestore
                        ? [
                            {
                              id: "restore",
                              label: "Restaurer",
                              icon: RotateCcw,
                              onClick: onRestore,
                            },
                          ]
                        : []
                    }
                  />
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Badge
                className={cn(
                  "text-[10px] h-5",
                  getPositionLabel(archive.position).color,
                )}
              >
                {getPositionLabel(archive.position).icon}{" "}
                {getPositionLabel(archive.position).label}
              </Badge>
              {archive.year && (
                <Typography variant="caption2" theme="muted">
                  {archive.year}
                </Typography>
              )}
            </div>
          </div>

          {isListView && hasActions && (
            <div
              className="flex-shrink-0 ml-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <CardActionMenu
                onEdit={() => onEdit?.(archive)}
                onView={() => onView?.(archive)}
                onDelete={() => onDelete?.(archive)}
                extraActions={
                  onRestore
                    ? [
                        {
                          id: "restore",
                          label: "Restaurer",
                          icon: RotateCcw,
                          onClick: onRestore,
                        },
                      ]
                    : []
                }
              />
            </div>
          )}
        </div>

        {/* Content Area */}
        {!isCompact && (
          <div
            className={cn(
              "space-y-2",
              isListView &&
                "flex-1 px-4 border-l border-r border-border/50 mx-4",
            )}
          >
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              {archive.fighter && (
                <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <User className="h-3 w-3" />
                  <span>
                    {archive.fighter.first_name} {archive.fighter.last_name}
                  </span>
                </div>
              )}
              {archive.region && (
                <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  <span>{archive.region.name}</span>
                </div>
              )}
            </div>

            {archive.description && (
              <Typography
                variant="caption1"
                theme="muted"
                className="line-clamp-2 italic"
              >
                {archive.description}
              </Typography>
            )}

            {archive.archive_reason && (
              <div className="pt-1">
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[9px] h-4",
                    getReasonBadge(archive.archive_reason).color,
                  )}
                >
                  Raison: {getReasonBadge(archive.archive_reason).label}
                </Badge>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
