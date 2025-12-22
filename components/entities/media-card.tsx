import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";
import { Media } from "@/types";
import {
  Image as ImageIcon,
  Video,
  FileText,
  Music,
  User,
  Calendar,
  Download,
  Eye,
  Edit,
  Star,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface MediaCardProps {
  media: Media;
  viewMode: "grid" | "list";
  onEdit?: (media: Media) => void;
  onView?: (media: Media) => void;
  onDownload?: (media: Media) => void;
}

export function MediaCard({
  media,
  viewMode,
  onEdit,
  onView,
  onDownload,
}: MediaCardProps) {
  const isListView = viewMode === "list";

  // Obtenir l'icône en fonction du type de fichier
  const getFileTypeIcon = (fileType: string) => {
    switch (fileType) {
      case "image":
        return ImageIcon;
      case "video":
        return Video;
      case "document":
        return FileText;
      case "audio":
        return Music;
      default:
        return FileText;
    }
  };

  // Obtenir la couleur du badge en fonction du type
  const getFileTypeColor = (fileType: string) => {
    switch (fileType) {
      case "image":
        return "bg-green-100 text-green-800";
      case "video":
        return "bg-blue-100 text-blue-800";
      case "document":
        return "bg-orange-100 text-orange-800";
      case "audio":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Formater la taille du fichier
  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "0 B";
    const units = ["B", "KB", "MB", "GB"];
    let size = bytes;
    let unitIndex = 0;
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    return `${size.toFixed(2)} ${units[unitIndex]}`;
  };

  // Obtenir l'extension du fichier
  const getFileExtension = (filePath: string) => {
    const parts = filePath.split(".");
    return parts.length > 1 ? parts.pop()?.toUpperCase() : "";
  };

  const FileTypeIcon = getFileTypeIcon(media.file_type);
  const fileExtension = getFileExtension(media.file_path);

  return (
    <Card
      className={cn(
        "hover:shadow-lg transition-all duration-300 cursor-pointer group",
        isListView && "flex"
      )}
    >
      <div
        className={cn("p-2", isListView && "flex items-center gap-2 flex-1")}
      >
        {/* Miniature */}
        <div className={cn("flex-shrink-0", isListView && "mb-0")}>
          <div
            className={cn(
              "w-16 h-16 rounded-lg overflow-hidden flex items-center justify-center relative",
              media.file_type === "image"
                ? "bg-gray-100"
                : "bg-gradient-to-br from-gray-200 to-gray-300"
            )}
          >
            {media.file_type === "image" && media.file_path ? (
              <Image
                src={media.file_path}
                alt={media.alt_text || media.title}
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex flex-col items-center justify-center p-2">
                <FileTypeIcon className="h-8 w-8 text-gray-600 mb-1" />
                {fileExtension && (
                  <span className="text-xs font-mono text-gray-500">
                    {fileExtension}
                  </span>
                )}
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
              <CardTitle className="text-lg group-hover:text-primary transition-colors line-clamp-1">
                {media.title}
              </CardTitle>

              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <Badge variant="outline" className={getFileTypeColor(media.file_type)}>
                  {media.file_type}
                </Badge>

                {media.is_featured && (
                  <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                    <Star className="h-3 w-3 mr-1" />
                    Vedette
                  </Badge>
                )}

                {media.file_size && (
                  <Typography variant="body-sm" theme="muted">
                    {formatFileSize(media.file_size)}
                  </Typography>
                )}
              </div>

              {/* Informations supplémentaires */}
              {!isListView && (
                <div className="mt-2 space-y-1">
                  {media.description && (
                    <Typography
                      variant="body-sm"
                      className="line-clamp-2 text-muted-foreground"
                    >
                      {media.description}
                    </Typography>
                  )}

                  {media.uploader && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <User className="h-3 w-3" />
                      <span>{media.uploader.username}</span>
                    </div>
                  )}

                  {media.created_at && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>
                        {new Date(media.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {isListView && (
              <div className="space-y-1 text-right">
                {media.uploader && (
                  <div className="flex items-center gap-1 justify-end text-sm text-muted-foreground">
                    <User className="h-3 w-3" />
                    <span>{media.uploader.username}</span>
                  </div>
                )}

                {media.created_at && (
                  <Typography variant="caption2" theme="muted">
                    {new Date(media.created_at).toLocaleDateString()}
                  </Typography>
                )}

                {media.file_size && (
                  <Typography variant="caption2" theme="muted">
                    {formatFileSize(media.file_size)}
                  </Typography>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className={cn("flex gap-2 mt-2", isListView && "mt-0")}>
            {onDownload && (
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onDownload(media);
                }}
              >
                <Download className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onView?.(media);
              }}
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onEdit?.(media);
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