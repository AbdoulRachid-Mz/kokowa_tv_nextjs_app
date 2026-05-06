import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";
import { Article, ArticleType } from "@/types";
import {
  Calendar,
  User,
  Eye,
  Heart,
  Share2,
  BookOpen,
  Edit,
  Globe,
  Clock,
  MoreHorizontal,
  Pencil,
  Trash2,
  Send,
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


// types
interface ArticleProps extends BaseCardProps<Article> {
  onPublish?: (article: Article) => Promise<void>;
}


export function ArticleCard({
  item: article,
  viewMode = "grid",
  status,
  isCliquable = true,
  isMini = false,
  activeAction = "view",
  onEdit,
  onView,
  onDelete,
  onPublish,
  className,
}: ArticleProps) {
  const isListView = viewMode === "list";
  const isCompact = viewMode === "compact" || isMini;

  // Obtenir la couleur du badge en fonction du statut
  const getStatusColor = (status: string) => {
    switch (status) {
      case "published":
        return "bg-green-100 text-green-800";
      case "draft":
        return "bg-yellow-100 text-yellow-800";
      case "archived":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeLabel = (type: ArticleType) => {
    const labels: Record<string, string> = {
      news: "Actualité",
      event: "Événement",
      announcement: "Annonce",
      highlight: "Focus",
      interview: "Interview",
      analyse: "Analyse",
    };
    return labels[type] || type;
  };

  const handleMainAction = () => {
    if (!isCliquable) return;
    if (activeAction === "view" && onView) onView(article);
    else if (activeAction === "edit" && onEdit) onEdit(article);
    else if (activeAction === "delete" && onDelete) onDelete(article);
    else if (onView) onView(article);
  };

  const hasActions = onEdit || onView || onDelete || onPublish;

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
      <div className={cn("p-3 flex w-full gap-3", isListView ? "flex-row items-center" : "flex-col")}>
        {/* Thumbnail Area */}
        <div className={cn("relative flex-shrink-0 overflow-hidden rounded-lg bg-muted", isListView ? "w-24 h-24" : "w-full aspect-video")}>
          {article.featured_image ? (
            <Image
              src={article.featured_image}
              alt={article.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <BookOpen className="h-8 w-8 text-muted-foreground/20" />
            </div>
          )}
          <Badge variant="secondary" className="absolute top-2 left-2 text-[10px] h-5 bg-white/90 backdrop-blur-sm">
            {getTypeLabel(article.type)}
          </Badge>
          
          {!isListView && hasActions && (
            <div className="absolute top-2 right-2" onClick={e => e.stopPropagation()}>
              <CardActionMenu onEdit={() => onEdit?.(article)} onView={() => onView?.(article)} onDelete={() => onDelete?.(article)} onPublish={() => onPublish?.(article)} />
            </div>
          )}
        </div>

        {/* Content Area */}
        <div className="flex-1 min-w-0 flex flex-col gap-1">
          <div className="flex items-center justify-between gap-2">
            <Typography variant={isCompact ? "body-sm" : "h4"} weight="bold" className="truncate group-hover:text-primary transition-colors">
              {article.title}
            </Typography>
            {isListView && hasActions && (
              <div className="flex-shrink-0" onClick={e => e.stopPropagation()}>
                <CardActionMenu onEdit={() => onEdit?.(article)} onView={() => onView?.(article)} onDelete={() => onDelete?.(article)} onPublish={() => onPublish?.(article)} />
              </div>
            )}
          </div>

          {!isCompact && (
            <>
              {article.excerpt && (
                <Typography variant="caption2" theme="muted" className="line-clamp-2">
                  {article.excerpt}
                </Typography>
              )}
              
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <Badge variant="outline" className={cn("text-[10px] h-5", getStatusColor(article.status))}>
                  {article.status}
                </Badge>
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  {article.published_at ? new Date(article.published_at).toLocaleDateString() : 'Brouillon'}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </Card>
  );
}

function CardActionMenu({ onEdit, onView, onDelete, onPublish }: { onEdit?: () => void, onView?: () => void, onDelete?: () => void, onPublish?: () => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="secondary" size="icon" className="h-7 w-7 rounded-full shadow-sm bg-primary/20 text-primary backdrop-blur-sm">
          <MoreHorizontal className="h-4 w-4 " />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {onView && (
          <DropdownMenuItem onClick={onView}>
            <BookOpen className="h-4 w-4 mr-2" /> Lire
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
        {onPublish && (
          <DropdownMenuItem onClick={onPublish} className="text-success">
            <Send className="h-4 w-4 mr-2" /> Publier
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}