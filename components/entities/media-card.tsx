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
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BaseCardProps } from "./entity-cards";

export function MediaCard({
  item: media,
  viewMode = "grid",
  status,
  isCliquable = true,
  isMini = false,
  activeAction = "view",
  onEdit,
  onView,
  onDelete,
  onDownload,
  className,
}: BaseCardProps<Media> & { onDownload?: (media: Media) => void }) {
  const isListView = viewMode === "list";
  const isCompact = viewMode === "compact" || isMini;

  // Obtenir l'icône en fonction du type de fichier
  const getFileTypeIcon = (fileType: string) => {
    switch (fileType) {
      case "image": return ImageIcon;
      case "video": return Video;
      case "document": return FileText;
      case "audio": return Music;
      default: return FileText;
    }
  };

  const FileTypeIcon = getFileTypeIcon(media.file_type);

  const handleMainAction = () => {
    if (!isCliquable) return;
    if (activeAction === "view" && onView) onView(media);
    else if (activeAction === "edit" && onEdit) onEdit(media);
    else if (activeAction === "delete" && onDelete) onDelete(media);
    else if (onView) onView(media);
  };

  const hasActions = onEdit || onView || onDelete || onDownload;

  return (
    <Card
      className={cn(
        "hover:shadow-md transition-all duration-300 group relative overflow-hidden",
        isListView && "flex items-center",
        isCliquable && "cursor-pointer active:scale-[0.98]",
        status && `border-l-4 ${status}`,
        className
      )}
      onClick={handleMainAction}
    >
      <div className={cn("p-2 flex w-full gap-3", isListView ? "flex-row items-center" : "flex-col")}>
        {/* Preview Area */}
        <div className={cn("relative flex-shrink-0 overflow-hidden rounded-lg bg-muted", isListView ? "w-16 h-16" : "w-full aspect-square max-h-48")}>
          {media.file_type === "image" && media.file_path ? (
            <Image src={media.file_path} alt={media.title} fill className="object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-primary/5">
              <FileTypeIcon className="h-8 w-8 text-primary/20" />
            </div>
          )}
          
          {!isListView && hasActions && (
            <div className="absolute top-2 right-2" onClick={e => e.stopPropagation()}>
              <CardActionMenu 
                onEdit={() => onEdit?.(media)} 
                onView={() => onView?.(media)} 
                onDelete={() => onDelete?.(media)} 
                onDownload={onDownload ? () => onDownload(media) : undefined}
              />
            </div>
          )}
        </div>

        {/* Content Area */}
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <div className="flex items-center justify-between gap-2">
            <Typography variant="body-sm" weight="bold" className="truncate group-hover:text-primary transition-colors">
              {media.title}
            </Typography>
            {isListView && hasActions && (
              <div className="flex-shrink-0" onClick={e => e.stopPropagation()}>
                <CardActionMenu 
                  onEdit={() => onEdit?.(media)} 
                  onView={() => onView?.(media)} 
                  onDelete={() => onDelete?.(media)}
                  onDownload={onDownload ? () => onDownload(media) : undefined}
                />
              </div>
            )}
          </div>
          
          {!isCompact && (
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="text-[9px] h-4 uppercase">{media.file_type}</Badge>
              {media.file_size && (
                <span className="text-[10px] text-muted-foreground">
                  {(media.file_size / 1024 / 1024).toFixed(2)} MB
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

function CardActionMenu({ onEdit, onView, onDelete, onDownload }: { onEdit?: () => void, onView?: () => void, onDelete?: () => void, onDownload?: () => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="secondary" size="icon" className="h-7 w-7 rounded-full shadow-sm bg-primary/20 text-primary backdrop-blur-sm">
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
        {onDownload && (
          <DropdownMenuItem onClick={onDownload}>
            <Download className="h-4 w-4 mr-2" /> Télécharger
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