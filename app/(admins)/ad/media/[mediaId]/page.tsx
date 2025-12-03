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
  Download,
  ExternalLink,
  Image as ImageIcon,
  Video,
  FileText,
  Music,
  User,
  Calendar,
  FileUp,
  HardDrive,
  Eye,
  Copy,
  Star,
} from "lucide-react";
import { Media } from "@/types";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import Image from "next/image";
import { CardStats } from "@/components/entities/card-stats";
import { toast } from "sonner";

export default function MediaDetailPage() {
  const params = useParams();
  const router = useRouter();
  const mediaId = params.mediaId as string;

  const [media, setMedia] = useState<Media | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [previewLoading, setPreviewLoading] = useState(false);

  // Charger les détails du média
  useEffect(() => {
    const fetchMedia = async () => {
      try {
        const response = await fetch(
          `/api/media/${mediaId}?with_relations=true`
        );
        if (response.ok) {
          const data = await response.json();
          setMedia(data);
        } else {
          toast.error("Erreur lors du chargement du média");
        }
      } catch (error) {
        console.error("Erreur réseau:", error);
        toast.error("Erreur réseau");
      } finally {
        setLoading(false);
      }
    };

    if (mediaId) {
      fetchMedia();
    }
  }, [mediaId]);

  // Obtenir l'icône en fonction du type de fichier
  const getFileTypeIcon = () => {
    if (!media) return FileText;
    
    switch (media.file_type) {
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
  const getFileTypeColor = () => {
    if (!media) return "bg-gray-100 text-gray-800";
    
    switch (media.file_type) {
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
  const getFileExtension = () => {
    if (!media?.file_path) return "";
    const parts = media.file_path.split(".");
    return parts.length > 1 ? parts.pop()?.toUpperCase() : "";
  };

  // Statistiques pour le média
  const getMediaStats = () => {
    if (!media) return [];

    const stats = [
      {
        label: "Type",
        value: media.file_type,
        icon: getFileTypeIcon(),
        color: getFileTypeColor().split(" ")[0],
        description: "Type de fichier",
      },
      {
        label: "Taille",
        value: formatFileSize(media.file_size),
        icon: HardDrive,
        color: "text-blue-600",
        description: "Taille du fichier",
      },
    ];

    if (media.mime_type) {
      stats.push({
        label: "Format",
        value: media.mime_type,
        icon: FileUp,
        color: "text-orange-600",
        description: "Type MIME",
      });
    }

    return stats;
  };

  // Gestionnaires d'actions
  const handleEditMedia = () => {
    router.push(`/ad/media/${mediaId}/edit`);
  };

  const handleDeleteMedia = async () => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce média ?")) {
      return;
    }

    try {
      const response = await fetch(`/api/media/${mediaId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Média supprimé avec succès");
        router.push("/ad/media");
      } else {
        const error = await response.json();
        toast.error(error.error || "Erreur lors de la suppression");
      }
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur réseau");
    }
  };

  const handleDownload = () => {
    if (!media?.file_path) return;
    
    const link = document.createElement("a");
    link.href = media.file_path;
    link.download = media.title;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Téléchargement lancé");
  };

  const handleOpenInNewTab = () => {
    if (!media?.file_path) return;
    window.open(media.file_path, "_blank");
  };

  const handleCopyLink = () => {
    if (!media?.file_path) return;
    navigator.clipboard.writeText(media.file_path);
    toast.success("Lien copié dans le presse-papier");
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

  if (!media) {
    return (
      <div className="text-center py-12">
        <Typography variant="h3" theme="muted">
          Média non trouvé
        </Typography>
        <Button onClick={() => router.push("/ad/media")} className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour aux médias
        </Button>
      </div>
    );
  }

  const FileTypeIcon = getFileTypeIcon();
  const fileTypeColor = getFileTypeColor();
  const fileExtension = getFileExtension();

  return (
    <div className="space-y-4">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/ad/media")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <div>
            <Typography variant="h5" weight="bold" animated>
              {media.title}
            </Typography>
            {media.description && (
              <Typography variant="body-sm" theme="muted" className="line-clamp-1">
                {media.description}
              </Typography>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleEditMedia}>
            <Edit className="h-4 w-4 mr-2" />
            Modifier
          </Button>
          <Button variant="destructive" onClick={handleDeleteMedia}>
            Supprimer
          </Button>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
        {getMediaStats().map((stat, index) => (
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
          <TabsTrigger value="preview">Aperçu</TabsTrigger>
        </TabsList>

        {/* Vue d'ensemble */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Prévisualisation et informations principales */}
            <Card className="lg:col-span-2 p-4">
              <div className="flex flex-col md:flex-row gap-6">
                {/* Prévisualisation */}
                <div className="flex-shrink-0">
                  <div
                    className={cn(
                      "w-64 h-64 rounded-lg overflow-hidden flex items-center justify-center relative",
                      media.file_type === "image"
                        ? "bg-gray-100"
                        : "bg-gradient-to-br from-gray-200 to-gray-300"
                    )}
                  >
                    {media.file_type === "image" && media.file_path ? (
                      <>
                        {previewLoading && (
                          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                            <Skeleton className="w-full h-full" />
                          </div>
                        )}
                        <Image
                          src={media.file_path}
                          alt={media.alt_text || media.title}
                          fill
                          className="object-cover"
                          onLoadingComplete={() => setPreviewLoading(false)}
                          onLoad={() => setPreviewLoading(false)}
                          onError={() => setPreviewLoading(false)}
                        />
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center p-6">
                        <FileTypeIcon className="h-16 w-16 text-gray-600 mb-4" />
                        {fileExtension && (
                          <Badge variant="outline" className="font-mono">
                            .{fileExtension}
                          </Badge>
                        )}
                        <Typography variant="body-sm" theme="muted" className="mt-2">
                          {media.file_type.toUpperCase()}
                        </Typography>
                      </div>
                    )}
                  </div>
                </div>

                {/* Informations principales */}
                <div className="flex-1 space-y-4">
                  <div>
                    <Typography variant="h4" weight="bold">
                      {media.title}
                    </Typography>
                    
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className={fileTypeColor}>
                        {media.file_type}
                      </Badge>

                      {media.is_featured && (
                        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                          <Star className="h-3 w-3 mr-1" />
                          Vedette
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    {/* Taille du fichier */}
                    {media.file_size && (
                      <div className="flex items-center gap-2">
                        <HardDrive className="h-4 w-4 text-muted-foreground" />
                        <Typography variant="body-base">
                          Taille: {formatFileSize(media.file_size)}
                        </Typography>
                      </div>
                    )}

                    {/* Type MIME */}
                    {media.mime_type && (
                      <div className="flex items-center gap-2">
                        <FileUp className="h-4 w-4 text-muted-foreground" />
                        <Typography variant="body-base">
                          Format: {media.mime_type}
                        </Typography>
                      </div>
                    )}

                    {/* Uploader */}
                    {media.uploader && (
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <Typography variant="body-base">
                          Uploadé par: {media.uploader.username}
                        </Typography>
                      </div>
                    )}

                    {/* Date de création */}
                    {media.created_at && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <Typography variant="body-base">
                          {format(new Date(media.created_at), "PPP", {
                            locale: fr,
                          })}
                        </Typography>
                      </div>
                    )}
                  </div>

                  {/* Texte alternatif */}
                  {media.alt_text && (
                    <div>
                      <Typography variant="body-sm" theme="muted" className="mb-1">
                        Texte alternatif
                      </Typography>
                      <Typography variant="body-base">
                        {media.alt_text}
                      </Typography>
                    </div>
                  )}
                </div>
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
                  onClick={handleDownload}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Télécharger
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={handleOpenInNewTab}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Ouvrir
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={handleCopyLink}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copier le lien
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={handleEditMedia}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Modifier
                </Button>
                <Button
                  variant="destructive"
                  className="w-full justify-start"
                  onClick={handleDeleteMedia}
                >
                  Supprimer
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Description */}
          {media.description && (
            <Card>
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                <Typography variant="body-base" className="whitespace-pre-line">
                  {media.description}
                </Typography>
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
                {/* Informations du fichier */}
                <div className="space-y-4">
                  <Typography variant="h6" weight="medium">
                    Informations du fichier
                  </Typography>
                  
                  <div>
                    <Typography variant="body-sm" theme="muted">
                      Chemin du fichier
                    </Typography>
                    <Typography variant="body-base" className="font-mono text-sm break-all">
                      {media.file_path}
                    </Typography>
                  </div>

                  <div>
                    <Typography variant="body-sm" theme="muted">
                      Type de fichier
                    </Typography>
                    <Badge variant="outline" className={fileTypeColor}>
                      {media.file_type}
                    </Badge>
                  </div>

                  {media.mime_type && (
                    <div>
                      <Typography variant="body-sm" theme="muted">
                        Type MIME
                      </Typography>
                      <Typography variant="body-base" className="font-mono">
                        {media.mime_type}
                      </Typography>
                    </div>
                  )}

                  {media.file_size && (
                    <div>
                      <Typography variant="body-sm" theme="muted">
                        Taille du fichier
                      </Typography>
                      <Typography variant="body-base">
                        {formatFileSize(media.file_size)}
                      </Typography>
                    </div>
                  )}

                  <div>
                    <Typography variant="body-sm" theme="muted">
                      Statut vedette
                    </Typography>
                    <Badge
                      variant="outline"
                      className={
                        media.is_featured
                          ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                          : ""
                      }
                    >
                      {media.is_featured ? "En vedette" : "Standard"}
                    </Badge>
                  </div>
                </div>

                {/* Métadonnées */}
                <div className="space-y-4">
                  <Typography variant="h6" weight="medium">
                    Métadonnées
                  </Typography>
                  
                  {media.uploader && (
                    <div>
                      <Typography variant="body-sm" theme="muted">
                        Uploadé par
                      </Typography>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <Typography variant="body-base">
                          {media.uploader.username}
                          {media.uploader.first_name && ` (${media.uploader.first_name} ${media.uploader.last_name})`}
                        </Typography>
                      </div>
                    </div>
                  )}

                  {media.entity_type && media.entity_id && (
                    <div>
                      <Typography variant="body-sm" theme="muted">
                        Associé à
                      </Typography>
                      <Typography variant="body-base">
                        {media.entity_type} #{media.entity_id}
                      </Typography>
                    </div>
                  )}

                  <div>
                    <Typography variant="body-sm" theme="muted">
                      Créé le
                    </Typography>
                    <Typography variant="body-base">
                      {format(new Date(media.created_at), "PPP 'à' p", {
                        locale: fr,
                      })}
                    </Typography>
                  </div>

                  {media.updated_at && (
                    <div>
                      <Typography variant="body-sm" theme="muted">
                        Modifié le
                      </Typography>
                      <Typography variant="body-base">
                        {format(new Date(media.updated_at), "PPP 'à' p", {
                          locale: fr,
                        })}
                      </Typography>
                    </div>
                  )}
                </div>
              </div>

              {/* Texte alternatif */}
              {media.alt_text && (
                <div className="pt-4 border-t">
                  <Typography variant="h6" weight="medium">
                    Texte alternatif
                  </Typography>
                  <Typography variant="body-base" className="mt-2">
                    {media.alt_text}
                  </Typography>
                </div>
              )}

              {/* Description */}
              {media.description && (
                <div className="pt-4 border-t">
                  <Typography variant="h6" weight="medium">
                    Description complète
                  </Typography>
                  <Typography variant="body-base" className="mt-2 whitespace-pre-line">
                    {media.description}
                  </Typography>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aperçu */}
        <TabsContent value="preview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Aperçu du média</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center">
                {/* Contenu en fonction du type de fichier */}
                {media.file_type === "image" ? (
                  <div className="relative w-full max-w-3xl h-[500px] rounded-lg overflow-hidden bg-gray-100">
                    {previewLoading && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Skeleton className="w-full h-full" />
                      </div>
                    )}
                    <Image
                      src={media.file_path}
                      alt={media.alt_text || media.title}
                      fill
                      className="object-contain"
                      onLoadingComplete={() => setPreviewLoading(false)}
                      onLoad={() => setPreviewLoading(false)}
                      onError={() => setPreviewLoading(false)}
                    />
                  </div>
                ) : media.file_type === "video" ? (
                  <div className="w-full max-w-3xl">
                    <video
                      controls
                      className="w-full rounded-lg"
                      poster={media.alt_text || undefined}
                    >
                      <source src={media.file_path} type={media.mime_type} />
                      Votre navigateur ne supporte pas la lecture vidéo.
                    </video>
                  </div>
                ) : media.file_type === "audio" ? (
                  <div className="w-full max-w-3xl">
                    <audio controls className="w-full">
                      <source src={media.file_path} type={media.mime_type} />
                      Votre navigateur ne supporte pas la lecture audio.
                    </audio>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <FileTypeIcon className="h-24 w-24 mx-auto text-muted-foreground mb-4" />
                    <Typography variant="h4" theme="muted" className="mb-2">
                      Aperçu non disponible
                    </Typography>
                    <Typography variant="body-sm" theme="muted" className="mb-4">
                      Ce type de fichier ne peut pas être prévisualisé directement.
                    </Typography>
                    <Button onClick={handleDownload}>
                      <Download className="h-4 w-4 mr-2" />
                      Télécharger pour visualiser
                    </Button>
                  </div>
                )}

                {/* Informations sous l'aperçu */}
                <div className="mt-6 text-center">
                  <Typography variant="h6" weight="medium" className="mb-2">
                    {media.title}
                  </Typography>
                  {media.description && (
                    <Typography variant="body-sm" theme="muted" className="mb-4">
                      {media.description}
                    </Typography>
                  )}
                  <div className="flex gap-2 justify-center">
                    <Button variant="outline" onClick={handleDownload}>
                      <Download className="h-4 w-4 mr-2" />
                      Télécharger
                    </Button>
                    <Button variant="outline" onClick={handleOpenInNewTab}>
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Ouvrir dans un nouvel onglet
                    </Button>
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

// Helper pour cn
function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}