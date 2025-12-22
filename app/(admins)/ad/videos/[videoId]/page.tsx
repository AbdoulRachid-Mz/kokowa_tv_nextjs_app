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
  Play,
  Eye,
  Heart,
  Calendar,
  Clock,
  Youtube,
  Facebook,
  Share2,
  Download,
  ExternalLink,
  TvMinimalPlay,
  Award,
  Film,
} from "lucide-react";
import { Video } from "@/types";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import Image from "next/image";
import { CardStats } from "@/components/entities/card-stats";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";

export default function VideoDetailPage() {
  const params = useParams();
  const router = useRouter();
  const videoId = params.videoId as string;

  const [video, setVideo] = useState<Video | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  // Charger les détails de la vidéo
  useEffect(() => {
    const fetchVideo = async () => {
      try {
        const response = await fetch(`/api/videos/${videoId}`);
        if (response.ok) {
          const data = await response.json();
          setVideo(data);
        } else {
          toast.error("Erreur lors du chargement de la vidéo");
        }
      } catch (error) {
        console.error("Erreur réseau:", error);
        toast.error("Erreur réseau");
      } finally {
        setLoading(false);
      }
    };

    if (videoId) {
      fetchVideo();
    }
  }, [videoId]);

  // Obtenir l'icône en fonction de la plateforme
  const getPlatformIcon = () => {
    if (!video) return Youtube;
    
    switch (video.type) {
      case "youtube":
        return Youtube;
      case "facebook":
        return Facebook;
      case "tiktok":
        return Film;
      case "vimeo":
        return Film;
      case "upload":
        return Film;
      case "rtmp":
        return TvMinimalPlay;
      default:
        return Film;
    }
  };

  // Obtenir l'icône en fonction de la catégorie
  const getCategoryIcon = () => {
    if (!video) return Film;
    
    switch (video.category) {
      case "match":
        return Award;
      case "interview":
        return Film;
      case "highlights":
        return Film;
      case "training":
        return Play;
      case "documentary":
        return Film;
      case "ceremony":
        return Award;
      default:
        return Film;
    }
  };

  // Obtenir la couleur du badge en fonction de la catégorie
  const getCategoryColor = () => {
    if (!video) return "bg-gray-100 text-gray-800";
    
    switch (video.category) {
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
  const getPlatformColor = () => {
    if (!video) return "bg-gray-50 text-gray-700 border-gray-200";
    
    switch (video.type) {
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
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m ${remainingSeconds}s`;
  };

  // Formater le nombre de vues
  const formatViewCount = (count?: number) => {
    if (!count) return "0";
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)} million`;
    }
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  // Statistiques pour la vidéo
  const getVideoStats = () => {
    if (!video) return [];

    const stats = [
      {
        label: "Vues",
        value: formatViewCount(video.view_count),
        icon: Eye,
        color: "text-green-600",
        description: "Nombre de vues",
      },
      {
        label: "Likes",
        value: video.like_count || 0,
        icon: Heart,
        color: "text-red-600",
        description: "Nombre de likes",
      },
      {
        label: "Catégorie",
        value: video.category,
        icon: getCategoryIcon(),
        color: getCategoryColor().split(" ")[0],
        description: "Type de contenu",
      },
    ];

    if (video.duration) {
      stats.push({
        label: "Durée",
        value: formatDuration(video.duration),
        icon: Clock,
        color: "text-blue-600",
        description: "Durée de la vidéo",
      });
    }

    return stats;
  };

  // Gestionnaires d'actions
  const handleEditVideo = () => {
    router.push(`/ad/videos/${videoId}/edit`);
  };

  const handleDeleteVideo = async () => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette vidéo ?")) {
      return;
    }

    try {
      const response = await fetch(`/api/videos/${videoId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Vidéo supprimée avec succès");
        router.push("/ad/videos");
      } else {
        const error = await response.json();
        toast.error(error.error || "Erreur lors de la suppression");
      }
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur réseau");
    }
  };

  const handlePlayVideo = () => {
    if (!video?.video_url) return;
    
    window.open(video.video_url, "_blank");
  };

  const handleShareVideo = async () => {
    if (!video) return;
    
    try {
      if (navigator.share) {
        await navigator.share({
          title: video.title,
          text: video.description || "Regardez cette vidéo",
          url: video.video_url,
        });
      } else {
        navigator.clipboard.writeText(video.video_url);
        toast.success("Lien copié dans le presse-papier");
      }
    } catch (error) {
      console.error("Erreur lors du partage:", error);
    }
  };

  const handleLikeVideo = async () => {
    if (!video) return;
    
    try {
      const response = await fetch(`/api/videos/${videoId}/like`, {
        method: "POST",
      });
      
      if (response.ok) {
        toast.success("Vidéo likée !");
        // Recharger les données
        const refreshResponse = await fetch(`/api/videos/${videoId}`);
        if (refreshResponse.ok) {
          const data = await refreshResponse.json();
          setVideo(data);
        }
      }
    } catch (error) {
      console.error("Erreur lors du like:", error);
      toast.error("Erreur lors du like");
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
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!video) {
    return (
      <div className="text-center py-12">
        <Typography variant="h3" theme="muted">
          Vidéo non trouvée
        </Typography>
        <Button onClick={() => router.push("/ad/videos")} className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour aux vidéos
        </Button>
      </div>
    );
  }

  const PlatformIcon = getPlatformIcon();
  const CategoryIcon = getCategoryIcon();
  const categoryColor = getCategoryColor();
  const platformColor = getPlatformColor();

  return (
    <div className="space-y-4">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/ad/videos")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <div>
            <Typography variant="h5" weight="bold" animated>
              {video.title}
            </Typography>
            {video.slug && (
              <Typography variant="body-sm" theme="muted">
                {video.slug}
              </Typography>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleEditVideo}>
            <Edit className="h-4 w-4 mr-2" />
            Modifier
          </Button>
          <Button variant="destructive" onClick={handleDeleteVideo}>
            Supprimer
          </Button>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
        {getVideoStats().map((stat, index) => (
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
          <TabsTrigger value="details">Détails</TabsTrigger>
          <TabsTrigger value="embed">Intégration</TabsTrigger>
        </TabsList>

        {/* Vue d'ensemble */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Player et informations principales */}
            <Card className="lg:col-span-2 p-4">
              {/* Player ou miniature */}
              <div className="aspect-video rounded-lg overflow-hidden bg-black mb-4">
                {video.type === "youtube" ? (
                  <iframe
                    src={`https://www.youtube.com/embed/${extractYouTubeId(video.video_url)}`}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : video.type === "vimeo" ? (
                  <iframe
                    src={`https://player.vimeo.com/video/${extractVimeoId(video.video_url)}`}
                    className="w-full h-full"
                    allow="autoplay; fullscreen; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <div className="relative w-full h-full">
                    {video.thumbnail_url ? (
                      <Image
                        src={video.thumbnail_url}
                        alt={video.title}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                        <Film className="h-16 w-16 text-white" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <Button
                        size="lg"
                        onClick={handlePlayVideo}
                        className="bg-white text-black hover:bg-white/90"
                      >
                        <Play className="h-6 w-6 mr-2" />
                        {video.is_live ? "Regarder le direct" : "Jouer la vidéo"}
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <Typography variant="h4" weight="bold">
                    {video.title}
                  </Typography>
                  
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" className={platformColor}>
                      <PlatformIcon className="h-3 w-3 mr-1" />
                      {video.type}
                    </Badge>

                    <Badge variant="outline" className={categoryColor}>
                      <CategoryIcon className="h-3 w-3 mr-1" />
                      {video.category}
                    </Badge>

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
                </div>

                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  {video.view_count !== undefined && (
                    <div className="flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                      <span>{formatViewCount(video.view_count)} vues</span>
                    </div>
                  )}

                  <div className="flex items-center gap-1">
                    <Heart className="h-4 w-4" />
                    <span>{video.like_count || 0} likes</span>
                  </div>

                  {video.published_at && (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {format(new Date(video.published_at), "PPP", {
                          locale: fr,
                        })}
                      </span>
                    </div>
                  )}

                  {video.duration && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>{formatDuration(video.duration)}</span>
                    </div>
                  )}
                </div>

                {video.description && (
                  <div>
                    <Typography variant="body-base" className="whitespace-pre-line">
                      {video.description}
                    </Typography>
                  </div>
                )}
              </div>
            </Card>

            {/* Actions rapides */}
            <Card>
              <CardHeader>
                <CardTitle>Actions Rapides</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  className="w-full justify-start"
                  onClick={handlePlayVideo}
                >
                  <Play className="h-4 w-4 mr-2" />
                  {video.is_live ? "Regarder le direct" : "Jouer la vidéo"}
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={handleLikeVideo}
                >
                  <Heart className="h-4 w-4 mr-2" />
                  Like ({video.like_count || 0})
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={handleShareVideo}
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Partager
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={handleEditVideo}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Modifier
                </Button>
                <Button
                  variant="destructive"
                  className="w-full justify-start"
                  onClick={handleDeleteVideo}
                >
                  Supprimer
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Vidéos similaires */}
          {video.category && (
            <Card>
              <CardHeader>
                <CardTitle>Vidéos similaires</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Typography variant="body-sm" theme="muted">
                    Les vidéos similaires seront affichées ici
                  </Typography>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => {
                      router.push(`/ad/videos?category=${video.category}`);
                    }}
                  >
                    Voir toutes les vidéos de cette catégorie
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Détails */}
        <TabsContent value="details" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Informations détaillées</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Informations techniques */}
                <div className="space-y-4">
                  <Typography variant="h6" weight="medium">
                    Informations techniques
                  </Typography>
                  
                  <div>
                    <Typography variant="body-sm" theme="muted">
                      URL de la vidéo
                    </Typography>
                    <Typography variant="body-base" className="break-all">
                      <a
                        href={video.video_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {video.video_url}
                      </a>
                    </Typography>
                  </div>

                  <div>
                    <Typography variant="body-sm" theme="muted">
                      Type
                    </Typography>
                    <Badge variant="outline" className={platformColor}>
                      <PlatformIcon className="h-3 w-3 mr-1" />
                      {video.type}
                    </Badge>
                  </div>

                  <div>
                    <Typography variant="body-sm" theme="muted">
                      Catégorie
                    </Typography>
                    <Badge variant="outline" className={categoryColor}>
                      <CategoryIcon className="h-3 w-3 mr-1" />
                      {video.category}
                    </Badge>
                  </div>

                  {video.duration && (
                    <div>
                      <Typography variant="body-sm" theme="muted">
                        Durée
                      </Typography>
                      <Typography variant="body-base">
                        {formatDuration(video.duration)}
                      </Typography>
                    </div>
                  )}
                </div>

                {/* Métadonnées */}
                <div className="space-y-4">
                  <Typography variant="h6" weight="medium">
                    Métadonnées
                  </Typography>
                  
                  <div>
                    <Typography variant="body-sm" theme="muted">
                      Slug
                    </Typography>
                    <Typography variant="body-base" className="font-mono">
                      {video.slug}
                    </Typography>
                  </div>

                  {video.thumbnail_url && (
                    <div>
                      <Typography variant="body-sm" theme="muted">
                        URL de la miniature
                      </Typography>
                      <Typography variant="body-base" className="break-all">
                        <a
                          href={video.thumbnail_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {video.thumbnail_url}
                        </a>
                      </Typography>
                    </div>
                  )}

                  <div>
                    <Typography variant="body-sm" theme="muted">
                      Statut
                    </Typography>
                    <div className="flex gap-2">
                      <Badge
                        variant={video.is_live ? "destructive" : "outline"}
                        className={video.is_live ? "animate-pulse" : ""}
                      >
                        {video.is_live ? "En direct" : "Pré-enregistrée"}
                      </Badge>
                      
                      <Badge
                        variant="outline"
                        className={
                          video.is_featured
                            ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                            : ""
                        }
                      >
                        {video.is_featured ? "En vedette" : "Standard"}
                      </Badge>
                    </div>
                  </div>

                  {video.published_at && (
                    <div>
                      <Typography variant="body-sm" theme="muted">
                        Publiée le
                      </Typography>
                      <Typography variant="body-base">
                        {format(new Date(video.published_at), "PPP 'à' p", {
                          locale: fr,
                        })}
                      </Typography>
                    </div>
                  )}

                  <div>
                    <Typography variant="body-sm" theme="muted">
                      Créée le
                    </Typography>
                    <Typography variant="body-base">
                      {format(new Date(video.created_at), "PPP 'à' p", {
                        locale: fr,
                      })}
                    </Typography>
                  </div>
                </div>
              </div>

              {/* Description complète */}
              {video.description && (
                <div className="pt-4 border-t">
                  <Typography variant="h6" weight="medium">
                    Description complète
                  </Typography>
                  <Typography variant="body-base" className="mt-2 whitespace-pre-line">
                    {video.description}
                  </Typography>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Intégration */}
        <TabsContent value="embed" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Code d'intégration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Typography variant="body-base">
                Utilisez ce code pour intégrer cette vidéo sur votre site web.
              </Typography>

              <div className="space-y-2">
                <Label>Code HTML</Label>
                <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                  {getEmbedCode(video)}
                </pre>
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(getEmbedCode(video));
                      toast.success("Code copié dans le presse-papier");
                    }}
                  >
                    <Share2 className="h-4 w-4 mr-2" />
                    Copier le code
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(video.video_url);
                      toast.success("URL copiée dans le presse-papier");
                    }}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Copier l'URL
                  </Button>
                </div>
              </div>

              <div className="pt-4 border-t">
                <Typography variant="body-sm" theme="muted">
                  Note: L'intégration peut ne pas fonctionner pour tous les types de vidéos.
                  Les vidéos RTMP nécessitent un player spécial.
                </Typography>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Fonctions utilitaires
function extractYouTubeId(url: string): string {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : '';
}

function extractVimeoId(url: string): string {
  const regExp = /(?:vimeo\.com\/|video\/)(\d+)/;
  const match = url.match(regExp);
  return match ? match[1] : '';
}

function getEmbedCode(video: Video): string {
  if (video.type === "youtube") {
    const videoId = extractYouTubeId(video.video_url);
    return `<iframe width="560" height="315" src="https://www.youtube.com/embed/${videoId}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
  } else if (video.type === "vimeo") {
    const videoId = extractVimeoId(video.video_url);
    return `<iframe src="https://player.vimeo.com/video/${videoId}" width="640" height="360" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>`;
  } else {
    return `<video width="640" height="360" controls>
  <source src="${video.video_url}" type="video/mp4">
  Votre navigateur ne supporte pas la lecture vidéo.
</video>`;
  }
}