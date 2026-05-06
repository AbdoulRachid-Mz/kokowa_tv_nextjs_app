import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";
import { Video } from "@/types";
import {
  Video as VideoIcon,
  Youtube,
  Facebook,
  Tv,
  Music,
  Film,
  Award,
  Calendar,
  Eye,
  Heart,
  Edit,
  Play,
  TvMinimalPlay,
  MoreHorizontal,
  Trash2,
  Pencil,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { BaseCardProps } from "./entity-cards";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function VideoCard({
  item: video,
  viewMode = "grid",
  status,
  isCliquable = true,
  isMini = false,
  activeAction = "view",
  onEdit,
  onView,
  onDelete,
  className,
}: BaseCardProps<Video>) {
  const isListView = viewMode === "list";
  const isCompact = viewMode === "compact" || isMini;

  const handleMainAction = () => {
    if (!isCliquable) return;
    if (activeAction === "view" && onView) onView(video);
    else if (activeAction === "edit" && onEdit) onEdit(video);
    else if (activeAction === "delete" && onDelete) onDelete(video);
    else if (onView) onView(video);
  };

  const getPlatformIcon = (type: string) => {
    switch (type) {
      case "youtube":
        return Youtube;
      case "facebook":
        return Facebook;
      case "tiktok":
        return Music;
      case "vimeo":
        return Film;
      case "rtmp":
        return TvMinimalPlay;
      default:
        return VideoIcon;
    }
  };

  const getPlatformColor = (type: string) => {
    switch (type) {
      case "youtube":
        return "bg-red-50 text-red-700 border-red-200";
      case "facebook":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "tiktok":
        return "bg-black text-white border-black";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return "N/A";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return h > 0
      ? `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
      : `${m}:${s.toString().padStart(2, "0")}`;
  };

  const formatViews = (count?: number) => {
    if (!count) return "0";
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  const PlatformIcon = getPlatformIcon(video.type);
  const hasActions = onEdit || onView || onDelete;

  const getStatusBorder = (status?: string) => {
    if (video.is_live) return "border-l-4 border-l-red-500";
    switch (status) {
      case "success":
        return "border-l-4 border-l-green-500";
      case "warning":
        return "border-l-4 border-l-yellow-500";
      case "error":
        return "border-l-4 border-l-red-500";
      case "info":
        return "border-l-4 border-l-blue-500";
      default:
        return "";
    }
  };

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
        {/* Thumbnail Area */}
        <div
          className={cn(
            "relative flex-shrink-0",
            isListView ? "w-32 h-20" : "w-full aspect-video",
          )}
        >
          <div className="w-full h-full rounded-md overflow-hidden bg-muted relative">
            {video.thumbnail_url ? (
              <Image
                src={video.thumbnail_url}
                alt={video.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                <VideoIcon className="h-10 w-10" />
              </div>
            )}

            {/* Overlay Badges */}
            <div className="absolute top-1.5 left-1.5 flex flex-col gap-1">
              {video.is_live && (
                <Badge
                  variant="destructive"
                  className="text-[8px] h-4 px-1.5 animate-pulse uppercase font-black tracking-tighter"
                >
                  LIVE
                </Badge>
              )}
              {video.is_featured && !video.is_live && (
                <Badge className="text-[8px] h-4 px-1.5 bg-yellow-500 text-white border-none uppercase font-black tracking-tighter">
                  VEDETTE
                </Badge>
              )}
            </div>

            {/* Play Button Overlay */}
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground shadow-lg">
                <Play className="h-5 w-5 fill-current" />
              </div>
            </div>

            {/* Duration */}
            {video.duration && !video.is_live && (
              <div className="absolute bottom-1 right-1 bg-black/80 text-white text-[9px] px-1 rounded font-mono">
                {formatDuration(video.duration)}
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <Typography
              variant={isCompact ? "body-sm" : "body-lg"}
              weight="bold"
              className="truncate group-hover:text-primary transition-colors leading-tight"
            >
              {video.title}
            </Typography>
            {!isListView && hasActions && (
              <div
                className="flex-shrink-0"
                onClick={(e) => e.stopPropagation()}
              >
                <CardActionMenu
                  onEdit={() => onEdit?.(video)}
                  onView={() => onView?.(video)}
                  onDelete={() => onDelete?.(video)}
                />
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 mt-1">
            <Badge
              variant="outline"
              className={cn("text-[9px] h-4", getPlatformColor(video.type))}
            >
              <PlatformIcon className="h-2.5 w-2.5 mr-1" /> {video.type}
            </Badge>
            {!isCompact && (
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                <div className="flex items-center gap-0.5">
                  <Eye className="h-2.5 w-2.5" />{" "}
                  {formatViews(video.view_count)}
                </div>
                {video.published_at && (
                  <div className="flex items-center gap-0.5">
                    <Calendar className="h-2.5 w-2.5" />{" "}
                    {new Date(video.published_at).toLocaleDateString()}
                  </div>
                )}
              </div>
            )}
          </div>

          {isListView && hasActions && (
            <div
              className="flex-shrink-0 ml-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <CardActionMenu
                onEdit={() => onEdit?.(video)}
                onView={() => onView?.(video)}
                onDelete={() => onDelete?.(video)}
              />
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

function CardActionMenu({
  onEdit,
  onView,
  onDelete,
}: {
  onEdit?: () => void;
  onView?: () => void;
  onDelete?: () => void;
}) {
  if (!onEdit && !onView && !onDelete) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-full  bg-primary/20 text-primary"
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {onView && (
          <DropdownMenuItem onClick={onView}>
            <Eye className="h-4 w-4 mr-2" /> Voir
          </DropdownMenuItem>
        )}
        {onEdit && (
          <DropdownMenuItem onClick={onEdit}>
            <Pencil className="h-4 w-4 mr-2" /> Modifier
          </DropdownMenuItem>
        )}
        {onDelete && (
          <DropdownMenuItem onClick={onDelete} className="text-destructive">
            <Trash2 className="h-4 w-4 mr-2" /> Supprimer
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
