"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Resolver, useForm } from "react-hook-form";
import { z } from "zod";
import { videoSchema, VideoInput } from "@/validation/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AdvancedUpload } from "@/components/ui/advanced-upload";
import { ImageIcon, Video, Link } from "lucide-react";
import { toast } from "sonner";

export default function VideoFormPage() {
  const params = useParams();
  const router = useRouter();
  const videoId = params.videoId as string;
  const isEditMode = videoId !== "create";

  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<VideoInput>({
    resolver: zodResolver(videoSchema) as Resolver<VideoInput>,
    defaultValues: {
      title: "",
      slug: "",
      description: "",
      video_url: "",
      thumbnail_url: "",
      duration: undefined,
      type: "youtube",
      category: "match",
      is_live: false,
      is_featured: false,
      view_count: 0,
      like_count: 0,
      published_at: undefined,
    },
  });

  const videoUrl = watch("video_url");
  const thumbnailUrl = watch("thumbnail_url");
  const type = watch("type");
  const isLive = watch("is_live");

  // Générer automatiquement le slug à partir du titre
  useEffect(() => {
    const title = watch("title");
    if (title && !isEditMode) {
      const slug = title
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");
      setValue("slug", slug);
    }
  }, [watch("title"), isEditMode, setValue]);

  // Charger les données de la vidéo en mode édition
  useEffect(() => {
    if (isEditMode) {
      const fetchVideo = async () => {
        try {
          const response = await fetch(`/api/videos/${videoId}`);
          if (response.ok) {
            const data = await response.json();
            const video = data;

            // Préparer les valeurs pour le formulaire
            const formValues: VideoInput = {
              title: video.title,
              slug: video.slug,
              description: video.description || "",
              video_url: video.video_url,
              thumbnail_url: video.thumbnail_url || "",
              duration: video.duration ?? undefined,
              type: video.type,
              category: video.category,
              is_live: video.is_live,
              is_featured: video.is_featured,
              view_count: video.view_count ?? 0,
              like_count: video.like_count ?? 0,
              published_at: video.published_at ?? undefined,
            };

            reset(formValues);
          } else {
            toast.error("Erreur lors du chargement de la vidéo");
            router.push("/ad/videos");
          }
        } catch (error) {
          console.error("Erreur:", error);
          toast.error("Erreur réseau");
        }
      };
      fetchVideo();
    }
  }, [videoId, isEditMode, reset, router]);

  const onSubmit = async (data: VideoInput) => {
    setLoading(true);
    setFormError(null);

    try {
      // Nettoyer les données
      const cleanedData = {
        ...data,
        duration: data.duration ? Number(data.duration) : undefined,
        is_live: Boolean(data.is_live),
        is_featured: Boolean(data.is_featured),
      };

      const formData = new FormData();
      Object.entries(cleanedData).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          formData.append(key, value.toString());
        }
      });

      const url = isEditMode ? `/api/videos/${videoId}` : "/api/videos";
      const method = isEditMode ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Erreur lors de l'enregistrement");
      }

      toast.success(
        isEditMode ? "Vidéo modifiée avec succès" : "Vidéo créée avec succès"
      );

      // Rediriger après succès
      if (isEditMode) {
        router.push(`/ad/videos/${videoId}`);
      } else {
        router.push("/ad/videos");
      }
    } catch (error) {
      console.error("Erreur:", error);
      setFormError(
        error instanceof Error ? error.message : "Une erreur est survenue"
      );
      toast.error("Erreur lors de l'enregistrement");
    } finally {
      setLoading(false);
    }
  };

  const videoTypes = [
    { value: "youtube", label: "YouTube" },
    { value: "facebook", label: "Facebook" },
    { value: "tiktok", label: "TikTok" },
    { value: "vimeo", label: "Vimeo" },
    { value: "upload", label: "Upload direct" },
    { value: "rtmp", label: "RTMP/Live Stream" },
  ];

  const categories = [
    { value: "match", label: "Match" },
    { value: "interview", label: "Interview" },
    { value: "highlights", label: "Highlights" },
    { value: "training", label: "Entraînement" },
    { value: "documentary", label: "Documentaire" },
    { value: "ceremony", label: "Cérémonie" },
  ];

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>
          {isEditMode ? "Modifier la vidéo" : "Ajouter une nouvelle vidéo"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {formError && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{formError}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Informations de base */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="title">
                Titre <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                {...register("title")}
                placeholder="Titre de la vidéo"
              />
              {errors.title && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.title.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="slug">
                Slug <span className="text-red-500">*</span>
              </Label>
              <Input
                id="slug"
                {...register("slug")}
                placeholder="slug-de-la-video"
              />
              <p className="text-xs text-gray-500 mt-1">
                Identifiant unique pour l'URL
              </p>
              {errors.slug && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.slug.message}
                </p>
              )}
            </div>
          </div>

          {/* URL de la vidéo */}
          <div>
            <Label htmlFor="video_url">
              URL de la vidéo <span className="text-red-500">*</span>
            </Label>
            <Input
              id="video_url"
              {...register("video_url")}
              placeholder="https://www.youtube.com/watch?v=..."
            />
            <p className="text-xs text-gray-500 mt-1">
              Lien vers la vidéo sur YouTube, Vimeo, Facebook, ou URL directe
            </p>
            {errors.video_url && (
              <p className="text-red-500 text-sm mt-1">
                {errors.video_url.message}
              </p>
            )}
          </div>

          {/* Type et catégorie */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="type">Plateforme</Label>
              <Select
                value={type}
                onValueChange={(value) => setValue("type", value as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une plateforme" />
                </SelectTrigger>
                <SelectContent>
                  {videoTypes.map((videoType) => (
                    <SelectItem key={videoType.value} value={videoType.value}>
                      {videoType.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.type && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.type.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="category">Catégorie</Label>
              <Select
                value={watch("category")}
                onValueChange={(value) => setValue("category", value as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une catégorie" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.category.message}
                </p>
              )}
            </div>
          </div>

          {/* Miniature */}
          <div>
            <Label className="block text-sm font-medium text-gray-700 mb-2">
              Miniature (optionnel)
            </Label>
            <AdvancedUpload
              value={thumbnailUrl || ""}
              onChange={(url) => setValue("thumbnail_url", url)}
              maxSizeMB={2}
              maxWidthOrHeight={1280}
              uploadPath="videos/thumbnails"
              isRounded={false}
              showInternalSelection={true}
              internalImagesFolder="videos"
              emptyPreview={
                <div className="text-center border-2 border-dashed border-gray-300 rounded-lg p-6">
                  <ImageIcon className="mx-auto h-10 w-10 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600">
                    Aucune miniature sélectionnée
                  </p>
                </div>
              }
            />
            {errors.thumbnail_url && (
              <p className="text-red-500 text-sm mt-1">
                {errors.thumbnail_url.message}
              </p>
            )}
          </div>

          {/* Durée et options */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <Label htmlFor="duration">Durée en secondes (optionnel)</Label>
              <Input
                id="duration"
                type="number"
                min="0"
                {...register("duration", { valueAsNumber: true })}
                placeholder="300"
              />
              <p className="text-xs text-gray-500 mt-1">
                Durée en secondes (ex: 300 = 5 minutes)
              </p>
              {errors.duration && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.duration.message}
                </p>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_live"
                  {...register("is_live")}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <Label htmlFor="is_live" className="text-sm font-medium">
                  Vidéo en direct
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_featured"
                  {...register("is_featured")}
                  className="h-4 w-4 text-yellow-600 border-gray-300 rounded focus:ring-yellow-500"
                />
                <Label htmlFor="is_featured" className="text-sm font-medium">
                  Mettre en vedette
                </Label>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Description (optionnel)</Label>
            <Textarea
              id="description"
              {...register("description")}
              placeholder="Description détaillée de la vidéo..."
              rows={4}
            />
            {errors.description && (
              <p className="text-red-500 text-sm mt-1">
                {errors.description.message}
              </p>
            )}
          </div>

          {/* Informations */}
          <Alert>
            <AlertDescription>
              {isEditMode
                ? "Modifiez les informations de la vidéo. Les changements seront visibles immédiatement."
                : "Ajoutez une nouvelle vidéo. Assurez-vous que l'URL est accessible et valide."}
            </AlertDescription>
          </Alert>

          {/* Boutons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading
                ? "Enregistrement..."
                : isEditMode
                ? "Mettre à jour"
                : "Ajouter la vidéo"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
