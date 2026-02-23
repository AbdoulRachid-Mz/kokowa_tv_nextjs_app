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
} from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface ArticleCardProps {
  article: Article;
  viewMode: "grid" | "list";
  onEdit?: (article: Article) => void;
  onView?: (article: Article) => void;
  onPublish?: (article: Article) => void;
}

export function ArticleCard({
  article,
  viewMode,
  onEdit,
  onView,
  onPublish,
}: ArticleCardProps) {
  const isListView = viewMode === "list";

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

  // typelabel
  const getTypeLabel = (type: ArticleType) => {
    switch (type) {
      case "news":
        return "Actualité";
      case "event":
        return "Événement";
      case "announcement":
        return "Annonce";
      case "highlight":
        return "Emphasis";
      case "interview":
        return "Interviews";
      case "analyse":
        return "Analyse";
      default:
        return type;
    }
  };

  // Obtenir le label du statut
  const getStatusLabel = (status: string) => {
    switch (status) {
      case "published":
        return "Publié";
      case "draft":
        return "Brouillon";
      case "archived":
        return "Archivé";
      default:
        return status;
    }
  };

  // Obtenir le label de la langue
  const getLanguageLabel = (language: string) => {
    switch (language) {
      case "fr":
        return "Français";
      case "ha":
        return "Hausa";
      case "en":
        return "Anglais";
      default:
        return language.toUpperCase();
    }
  };

  // Formater la date
  const formatDate = (dateString?: string) => {
    if (!dateString) return "Non publié";
    return new Date(dateString).toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Estimer le temps de lecture
  const estimateReadingTime = (content: string) => {
    const wordsPerMinute = 200;
    const words = content.trim().split(/\s+/).length;
    const minutes = Math.ceil(words / wordsPerMinute);
    return `${minutes} min`;
  };

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
        {/* Image en vedette */}
        {article.featured_image && !isListView && (
          <div className="flex-shrink-0 mb-2">
            <div className="relative w-full h-48 rounded-lg overflow-hidden">
              <Image
                src={article.featured_image}
                alt={article.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
              />
              {/* Type */}
              <Badge variant="outline" className="absolute top-2 right-2">
                {getTypeLabel(article.type)}
              </Badge>
            </div>
          </div>
        )}

        {/* En mode liste, l'image est à gauche */}
        {isListView && article.featured_image && (
          <div className="flex-shrink-0">
            <div className="relative w-24 h-24 rounded-lg overflow-hidden">
              <Image
                src={article.featured_image}
                alt={article.title}
                fill
                className="object-cover"
              />
              {/* Type */}
              <Badge variant="outline" className="absolute top-2 right-2">
                {getTypeLabel(article.type)}
              </Badge>
            </div>
          </div>
        )}

        <div
          className={cn(
            "flex-1",
            isListView && "flex items-center justify-between"
          )}
        >
          <div className={cn(isListView && "flex items-center gap-3")}>
            <div>
              <CardTitle className="text-lg group-hover:text-primary transition-colors line-clamp-2">
                {article.title}
              </CardTitle>

              {/* Extrait */}
              {article.excerpt && (
                <Typography
                  variant="body-sm"
                  className="mt-2 text-muted-foreground line-clamp-2"
                >
                  {article.excerpt}
                </Typography>
              )}

              <div className="flex items-center gap-2 mt-2 flex-wrap">
                {/* Statut */}
                <Badge variant="outline" className={getStatusColor(article.status)}>
                  {getStatusLabel(article.status)}
                </Badge>

                {/* Langue */}
                <Badge variant="outline" className="flex items-center gap-1">
                  <Globe className="h-3 w-3" />
                  {getLanguageLabel(article.language)}
                </Badge>

                {/* Date de publication */}
                {article.published_at && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>{formatDate(article.published_at)}</span>
                  </div>
                )}

                {/* Auteur */}
                {article.author && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <User className="h-3 w-3" />
                    <span>{article.author.username}</span>
                  </div>
                )}
              </div>

              {/* Métriques */}
              {!isListView && (
                <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    <span>{article.view_count || 0} vues</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Heart className="h-3 w-3" />
                    <span>{article.like_count || 0} likes</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{estimateReadingTime(article.content)}</span>
                  </div>
                </div>
              )}
            </div>

            {/* En mode liste, afficher les métriques à droite */}
            {isListView && (
              <div className="space-y-2 text-right">
                <div className="space-y-1">
                  <div className="flex items-center gap-1 justify-end text-sm">
                    <Eye className="h-3 w-3" />
                    <span>{article.view_count || 0}</span>
                  </div>
                  <div className="flex items-center gap-1 justify-end text-sm">
                    <Heart className="h-3 w-3" />
                    <span>{article.like_count || 0}</span>
                  </div>
                </div>
                {article.published_at && (
                  <Typography variant="caption2" theme="muted">
                    {formatDate(article.published_at)}
                  </Typography>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className={cn("flex gap-2 mt-3", isListView && "mt-0")}>
            {onView && (
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onView(article);
                }}
              >
                <BookOpen className="h-4 w-4" />
              </Button>
            )}
            {onEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(article);
                }}
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
            {onPublish && article.status === "draft" && (
              <Button
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onPublish(article);
                }}
              >
                Publier
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}