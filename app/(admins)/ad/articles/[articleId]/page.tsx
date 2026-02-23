"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Typography } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  Edit,
  Eye,
  Heart,
  Share2,
  Calendar,
  User,
  Globe,
  Clock,
  FileText,
  ExternalLink,
  Copy,
  Trash2,
  BookOpen,
  TrendingUp,
} from "lucide-react";
import { Article, ArticleType } from "@/types";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import Image from "next/image";
import { CardStats } from "@/components/entities/card-stats";
import { toast } from "sonner";

export default function ArticleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const articleId = params.articleId as string;

  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [contentLoading, setContentLoading] = useState(false);

  // Charger les détails de l'article
  useEffect(() => {
    const fetchArticle = async () => {
      try {
        const response = await fetch(
          `/api/articles/${articleId}?with_relations=true`
        );
        if (response.ok) {
          const data = await response.json();
          setArticle(data);
        } else {
          toast.error("Erreur lors du chargement de l'article");
        }
      } catch (error) {
        console.error("Erreur réseau:", error);
        toast.error("Erreur réseau");
      } finally {
        setLoading(false);
      }
    };

    if (articleId) {
      fetchArticle();
    }
  }, [articleId]);

  // Obtenir la couleur du badge en fonction du statut
  const getStatusColor = () => {
    if (!article) return "bg-gray-100 text-gray-800";
    
    switch (article.status) {
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

  // Obtenir le label du statut
  const getStatusLabel = () => {
    if (!article) return "";
    
    switch (article.status) {
      case "published":
        return "Publié";
      case "draft":
        return "Brouillon";
      case "archived":
        return "Archivé";
      default:
        return article.status;
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

  // Obtenir le label de la langue
  const getLanguageLabel = () => {
    if (!article) return "";
    
    switch (article.language) {
      case "fr":
        return "Français";
      case "ha":
        return "Hausa";
      case "en":
        return "Anglais";
      default:
        return (article.language as string).toUpperCase();
    }
  };

  // Estimer le temps de lecture
  const estimateReadingTime = () => {
    if (!article?.content) return "0 min";
    const wordsPerMinute = 200;
    const words = article.content.trim().split(/\s+/).length;
    const minutes = Math.ceil(words / wordsPerMinute);
    return `${minutes} min`;
  };

  // Statistiques pour l'article
  const getArticleStats = () => {
    if (!article) return [];

    const stats = [
      {
        label: "Statut",
        value: getStatusLabel(),
        icon: FileText,
        color: getStatusColor().split(" ")[0],
        description: "Statut de publication",
      },
      {
        label: "Vues",
        value: article.view_count?.toLocaleString() || "0",
        icon: Eye,
        color: "text-blue-600",
        description: "Nombre de vues",
      },
      {
        label: "Likes",
        value: article.like_count?.toLocaleString() || "0",
        icon: Heart,
        color: "text-red-600",
        description: "Nombre de likes",
      },
      {
        label: "Temps de lecture",
        value: estimateReadingTime(),
        icon: Clock,
        color: "text-orange-600",
        description: "Durée estimée",
      },
    ];

    return stats;
  };

  // Gestionnaires d'actions
  const handleEditArticle = () => {
    router.push(`/ad/articles/${articleId}/edit`);
  };

  const handleDeleteArticle = async () => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cet article ?")) {
      return;
    }

    try {
      const response = await fetch(`/api/articles/${articleId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Article supprimé avec succès");
        router.push("/ad/articles");
      } else {
        const error = await response.json();
        toast.error(error.error || "Erreur lors de la suppression");
      }
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur réseau");
    }
  };

  const handlePublishArticle = async () => {
    if (!article || article.status === "published") return;

    try {
      const formData = new FormData();
      formData.append("status", "published");
      
      const response = await fetch(`/api/articles/${articleId}`, {
        method: "PUT",
        body: formData,
      });

      if (response.ok) {
        toast.success("Article publié avec succès");
        // Recharger l'article
        const updatedResponse = await fetch(`/api/articles/${articleId}?with_relations=true`);
        if (updatedResponse.ok) {
          const data = await updatedResponse.json();
          setArticle(data);
        }
      } else {
        const error = await response.json();
        toast.error(error.error || "Erreur lors de la publication");
      }
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur réseau");
    }
  };

  const handleViewArticle = () => {
    if (article?.status === "published" && article?.slug) {
      window.open(`/articles/${article.slug}`, "_blank");
    } else {
      toast.info("Cet article n'est pas encore publié");
    }
  };

  const handleCopyLink = () => {
    if (!article?.slug) return;
    
    const baseUrl = window.location.origin;
    const articleUrl = `${baseUrl}/articles/${article.slug}`;
    navigator.clipboard.writeText(articleUrl);
    toast.success("Lien copié dans le presse-papier");
  };

  const handleShare = () => {
    if (!article) return;
    
    if (navigator.share) {
      navigator.share({
        title: article.title,
        text: article.excerpt || article.title,
        url: window.location.href,
      });
    } else {
      handleCopyLink();
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-64" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!article) {
    return (
      <div className="text-center py-12">
        <Typography variant="h3" theme="muted">
          Article non trouvé
        </Typography>
        <Button onClick={() => router.push("/ad/articles")} className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour aux articles
        </Button>
      </div>
    );
  }

  const statusColor = getStatusColor();

  return (
    <div className="space-y-4">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/ad/articles")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <div>
            <Typography variant="h5" weight="bold" animated className="line-clamp-1">
              {article.title}
            </Typography>
            {/* Type */}
            <Badge variant="outline" className="ml-2">
              {getTypeLabel(article.type)}
            </Badge>
            {article.excerpt && (
              <Typography variant="body-sm" theme="muted" className="line-clamp-1">
                {article.excerpt}
              </Typography>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {article.status === "draft" && (
            <Button onClick={handlePublishArticle}>
              Publier
            </Button>
          )}
          <Button variant="outline" onClick={handleEditArticle}>
            <Edit className="h-4 w-4 mr-2" />
            Modifier
          </Button>
          <Button variant="destructive" onClick={handleDeleteArticle}>
            <Trash2 className="h-4 w-4 mr-2" />
            Supprimer
          </Button>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
        {getArticleStats().map((stat, index) => (
          <CardStats
            key={index}
            label={stat.label}
            icon={stat.icon}
            value={stat.value}
            color={stat.color}
            description={stat.description}
          />
        ))}
      </div>

      {/* Informations et navigation */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="content">Contenu</TabsTrigger>
          <TabsTrigger value="seo">SEO & Métadonnées</TabsTrigger>
        </TabsList>

        {/* Vue d'ensemble */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Contenu principal */}
            <Card className="lg:col-span-2">
              <CardContent className="p-4">
                {/* Image en vedette */}
                {article.featured_image && (
                  <div className="mb-6">
                    <div className="relative w-full h-64 rounded-lg overflow-hidden">
                      <Image
                        src={article.featured_image}
                        alt={article.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                  </div>
                )}

                {/* Informations principales */}
                <div className="space-y-4">
                  <div>
                    <Typography variant="h4" weight="bold">
                      {article.title}
                    </Typography>
                    
                    {/* Métadonnées */}
                    <div className="flex items-center gap-4 mt-2 flex-wrap">
                      <Badge variant="outline" className={statusColor}>
                        {getStatusLabel()}
                      </Badge>

                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Globe className="h-3 w-3" />
                        <span>{getLanguageLabel()}</span>
                      </div>

                      {article.published_at && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>
                            {format(new Date(article.published_at), "PPP", {
                              locale: fr,
                            })}
                          </span>
                        </div>
                      )}

                      {article.author && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <User className="h-3 w-3" />
                          <span>{article.author.username}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Extrait */}
                  {article.excerpt && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <Typography variant="body-base" className="italic">
                        {article.excerpt}
                      </Typography>
                    </div>
                  )}

                  {/* Métriques d'engagement */}
                  <div className="grid grid-cols-3 gap-4">
                    <Card className="text-center p-4">
                      <div className="flex flex-col items-center">
                        <Eye className="h-6 w-6 text-blue-600 mb-2" />
                        <Typography variant="h4" weight="bold">
                          {article.view_count?.toLocaleString() || "0"}
                        </Typography>
                        <Typography variant="body-sm" theme="muted">
                          Vues
                        </Typography>
                      </div>
                    </Card>

                    <Card className="text-center p-4">
                      <div className="flex flex-col items-center">
                        <Heart className="h-6 w-6 text-red-600 mb-2" />
                        <Typography variant="h4" weight="bold">
                          {article.like_count?.toLocaleString() || "0"}
                        </Typography>
                        <Typography variant="body-sm" theme="muted">
                          Likes
                        </Typography>
                      </div>
                    </Card>

                    <Card className="text-center p-4">
                      <div className="flex flex-col items-center">
                        <Share2 className="h-6 w-6 text-green-600 mb-2" />
                        <Typography variant="h4" weight="bold">
                          {article.share_count?.toLocaleString() || "0"}
                        </Typography>
                        <Typography variant="body-sm" theme="muted">
                          Partages
                        </Typography>
                      </div>
                    </Card>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions rapides */}
            <Card>
              <CardHeader>
                <CardTitle>Actions Rapides</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  className="w-full justify-start"
                  onClick={handleViewArticle}
                  disabled={article.status !== "published"}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Voir l'article
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={handleEditArticle}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Modifier
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={handleCopyLink}
                  disabled={article.status !== "published"}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copier le lien
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={handleShare}
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Partager
                </Button>
                {article.status === "draft" && (
                  <Button
                    className="w-full justify-start"
                    onClick={handlePublishArticle}
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Publier maintenant
                  </Button>
                )}
                <Button
                  variant="destructive"
                  className="w-full justify-start"
                  onClick={handleDeleteArticle}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Supprimer
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Informations supplémentaires */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Informations techniques */}
            <Card>
              <CardHeader>
                <CardTitle>Informations techniques</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Typography variant="body-sm" theme="muted">
                    Slug
                  </Typography>
                  <Typography variant="body-base" className="font-mono">
                    {article.slug}
                  </Typography>
                </div>
                <div>
                  <Typography variant="body-sm" theme="muted">
                    ID
                  </Typography>
                  <Typography variant="body-base" className="font-mono">
                    {article.id}
                  </Typography>
                </div>
                <div>
                  <Typography variant="body-sm" theme="muted">
                    Créé le
                  </Typography>
                  <Typography variant="body-base">
                    {format(new Date(article.created_at), "PPP 'à' p", {
                      locale: fr,
                    })}
                  </Typography>
                </div>
                {article.updated_at && (
                  <div>
                    <Typography variant="body-sm" theme="muted">
                      Modifié le
                    </Typography>
                    <Typography variant="body-base">
                      {format(new Date(article.updated_at), "PPP 'à' p", {
                        locale: fr,
                      })}
                    </Typography>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Auteur */}
            {article.author && (
              <Card>
                <CardHeader>
                  <CardTitle>Auteur</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-3">
                    {article.author.profile_picture ? (
                      <div className="relative w-12 h-12 rounded-full overflow-hidden">
                        <Image
                          src={article.author.profile_picture}
                          alt={article.author.username}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                        <User className="h-6 w-6 text-gray-500" />
                      </div>
                    )}
                    <div>
                      <Typography variant="body-base" weight="medium">
                        {article.author.username}
                      </Typography>
                      {article.author.first_name && (
                        <Typography variant="body-sm" theme="muted">
                          {article.author.first_name} {article.author.last_name}
                        </Typography>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Contenu */}
        <TabsContent value="content" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Contenu de l'article</CardTitle>
            </CardHeader>
            <CardContent>
              {contentLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-8 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-4 w-4/5" />
                  <Skeleton className="h-8 w-2/4 mt-8" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                </div>
              ) : (
                <div className="prose max-w-none">
                  <div
                    className="article-content"
                    dangerouslySetInnerHTML={{ __html: article.content }}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* SEO & Métadonnées */}
        <TabsContent value="seo" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Optimisation SEO</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Meta Title */}
              <div>
                <Typography variant="h6" weight="medium" className="mb-2">
                  Meta Title
                </Typography>
                {article.meta_title ? (
                  <div className="bg-gray-50 p-3 rounded border">
                    <Typography variant="body-base">{article.meta_title}</Typography>
                  </div>
                ) : (
                  <div className="text-center py-4 border-2 border-dashed border-gray-300 rounded">
                    <Typography variant="body-sm" theme="muted">
                      Aucun meta title défini. Le titre de l'article sera utilisé.
                    </Typography>
                  </div>
                )}
              </div>

              {/* Meta Description */}
              <div>
                <Typography variant="h6" weight="medium" className="mb-2">
                  Meta Description
                </Typography>
                {article.meta_description ? (
                  <div className="bg-gray-50 p-3 rounded border">
                    <Typography variant="body-base">{article.meta_description}</Typography>
                  </div>
                ) : article.excerpt ? (
                  <div className="space-y-2">
                    <div className="bg-yellow-50 p-3 rounded border border-yellow-200">
                      <Typography variant="body-sm" className="text-yellow-800">
                        Aucune meta description définie. L'extrait de l'article sera utilisé :
                      </Typography>
                    </div>
                    <div className="bg-gray-50 p-3 rounded border">
                      <Typography variant="body-base">{article.excerpt}</Typography>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4 border-2 border-dashed border-gray-300 rounded">
                    <Typography variant="body-sm" theme="muted">
                      Aucune meta description ni extrait défini. Cela peut affecter le référencement.
                    </Typography>
                    <Button variant="outline" className="mt-2" onClick={handleEditArticle}>
                      <Edit className="h-4 w-4 mr-2" />
                      Ajouter une description
                    </Button>
                  </div>
                )}
              </div>

              {/* URL Slug */}
              <div>
                <Typography variant="h6" weight="medium" className="mb-2">
                  URL (Slug)
                </Typography>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-50 p-3 rounded border font-mono">
                    /articles/{article.slug}
                  </div>
                  <Button variant="outline" onClick={handleCopyLink}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Analyse SEO */}
              <div className="pt-4 border-t">
                <Typography variant="h6" weight="medium" className="mb-3">
                  Analyse SEO
                </Typography>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Typography variant="body-base">Longueur du titre</Typography>
                    <Badge variant={article.title.length > 60 ? "default" : "outline"}>
                      {article.title.length} caractères
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <Typography variant="body-base">Meta description</Typography>
                    <Badge variant={
                      article.meta_description 
                        ? article.meta_description.length >= 120 && article.meta_description.length <= 160 
                          ? "default" 
                          : "outline"
                        : "secondary"
                    }>
                      {article.meta_description ? `${article.meta_description.length} caractères` : "Non défini"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <Typography variant="body-base">Image en vedette</Typography>
                    <Badge variant={article.featured_image ? "default" : "secondary"}>
                      {article.featured_image ? "Présente" : "Absente"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <Typography variant="body-base">Contenu</Typography>
                    <Badge variant={article.content.length > 300 ? "default" : "outline"}>
                      {article.content.length} caractères
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}