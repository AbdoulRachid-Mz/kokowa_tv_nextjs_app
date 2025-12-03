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
  TvMinimalPlay
} from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface VideoCardProps {
  video: Video;
  viewMode: "grid" | "list";
  onEdit?: (video: Video) => void;
  onView?: (video: Video) => void;
  onPlay?: (video: Video) => void;
}

export function VideoCard({
  video,
  viewMode,
  onEdit,
  onView,
  onPlay,
}: VideoCardProps) {
  const isListView = viewMode === "list";

  // Obtenir l'icône en fonction de la plateforme
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
      case "upload":
        return VideoIcon;
      case "rtmp":
        return TvMinimalPlay;
      default:
        return VideoIcon;
    }
  };

  // Obtenir l'icône en fonction de la catégorie
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "match":
        return Award;
      case "interview":
        return Tv;
      case "highlights":
        return VideoIcon;
      case "training":
        return Play;
      case "documentary":
        return Film;
      case "ceremony":
        return Award;
      default:
        return VideoIcon;
    }
  };

  // Obtenir la couleur du badge en fonction de la catégorie
  const getCategoryColor = (category: string) => {
    switch (category) {
      case "match":
        return "bg-red-100 text-red-800";
      case "interview":
        return "bg-blue-100 text-blue-800";
      case "highlights":
        return "bg-green-100 text-green-800";
      case "training":
        return "bg-orange-100 text-orange-800";
      case "documentary":
        return "bg-purple-100 text-purple-800";
      case "ceremony":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Obtenir la couleur du badge en fonction de la plateforme
  const getPlatformColor = (type: string) => {
    switch (type) {
      case "youtube":
        return "bg-red-50 text-red-700 border-red-200";
      case "facebook":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "tiktok":
        return "bg-black text-white border-black";
      case "vimeo":
        return "bg-green-50 text-green-700 border-green-200";
      case "upload":
        return "bg-gray-50 text-gray-700 border-gray-200";
      case "rtmp":
        return "bg-orange-50 text-orange-700 border-orange-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  // Formater la durée
  const formatDuration = (seconds?: number) => {
    if (!seconds) return "N/A";
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${remainingSeconds
        .toString()
        .padStart(2, "0")}`;
    }
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  // Formater le nombre de vues
  const formatViewCount = (count?: number) => {
    if (!count) return "0";
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    }
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  const PlatformIcon = getPlatformIcon(video.type);
  const CategoryIcon = getCategoryIcon(video.category);

  return (
    <Card
      className={cn(
        "hover:shadow-lg transition-all duration-300 cursor-pointer group",
        isListView && "flex",
        video.is_live && "border-l-4 border-l-red-500"
      )}
    >
      <div
        className={cn("p-2", isListView && "flex items-center gap-2 flex-1")}
      >
        {/* Miniature */}
        <div className={cn("flex-shrink-0 relative", isListView && "mb-0")}>
          <div className="w-48 h-28 rounded-lg overflow-hidden relative">
            {video.thumbnail_url ? (
              <Image
                src={video.thumbnail_url}
                alt={video.title}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center">
                <VideoIcon className="h-12 w-12 text-white" />
              </div>
            )}
            
            {/* Overlay pour les badges */}
            <div className="absolute top-2 left-2 flex gap-1">
              {video.is_live && (
                <Badge
                  variant="destructive"
                  className="animate-pulse flex items-center gap-1"
                >
                  <TvMinimalPlay className="h-2 w-2" />
                  LIVE
                </Badge>
              )}
              
              {video.is_featured && !video.is_live && (
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                  Vedette
                </Badge>
              )}
            </div>
            
            {/* Bouton de lecture */}
            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Button
                variant="ghost"
                size="icon"
                className="bg-white/90 hover:bg-white"
                onClick={(e) => {
                  e.stopPropagation();
                  onPlay?.(video);
                }}
              >
                <Play className="h-6 w-6 text-black" fill="currentColor" />
              </Button>
            </div>
            
            {/* Durée */}
            {video.duration && !video.is_live && (
              <div className="absolute bottom-2 right-2 bg-black/75 text-white text-xs px-2 py-1 rounded">
                {formatDuration(video.duration)}
              </div>
            )}
          </div>
        </div>

        <div
          className={cn(
            "flex-1",
            isListView && "flex items-center justify-between"
          )}
        >
          <div className={cn(isListView && "flex items-center gap-3")}>
            <div>
              <CardTitle className="text-lg group-hover:text-primary transition-colors line-clamp-2">
                {video.title}
              </CardTitle>

              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <Badge
                  variant="outline"
                  className={getPlatformColor(video.type)}
                >
                  <PlatformIcon className="h-3 w-3 mr-1" />
                  {video.type}
                </Badge>

                <Badge variant="outline" className={getCategoryColor(video.category)}>
                  <CategoryIcon className="h-3 w-3 mr-1" />
                  {video.category}
                </Badge>
              </div>

              {/* Informations supplémentaires */}
              {!isListView && (
                <div className="mt-2 space-y-1">
                  {video.description && (
                    <Typography
                      variant="body-sm"
                      className="line-clamp-2 text-muted-foreground"
                    >
                      {video.description}
                    </Typography>
                  )}

                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      <span>{formatViewCount(video.view_count)} vues</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <Heart className="h-3 w-3" />
                      <span>{video.like_count || 0} likes</span>
                    </div>

                    {video.published_at && (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>
                          {new Date(video.published_at).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {isListView && (
              <div className="space-y-1 text-right min-w-[200px]">
                <div className="flex items-center justify-end gap-3">
                  <div className="flex items-center gap-1 text-sm">
                    <Eye className="h-3 w-3" />
                    <span>{formatViewCount(video.view_count)} vues</span>
                  </div>
                  
                  <div className="flex items-center gap-1 text-sm">
                    <Heart className="h-3 w-3" />
                    <span>{video.like_count || 0}</span>
                  </div>
                </div>

                {video.published_at && (
                  <Typography variant="caption2" theme="muted">
                    {new Date(video.published_at).toLocaleDateString()}
                  </Typography>
                )}

                {video.duration && (
                  <Typography variant="caption2" theme="muted">
                    {formatDuration(video.duration)}
                  </Typography>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className={cn("flex gap-2 mt-2", isListView && "mt-0")}>
            {!video.is_live && onPlay && (
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onPlay(video);
                }}
              >
                <Play className="h-4 w-4 mr-1" />
                Jouer
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onView?.(video);
              }}
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onEdit?.(video);
              }}
            >
              <Edit className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}