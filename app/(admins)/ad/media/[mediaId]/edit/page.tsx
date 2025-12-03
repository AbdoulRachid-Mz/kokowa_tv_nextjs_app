"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { mediaSchema, MediaInput } from "@/validation/schemas";
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
import { ImageIcon, FileUp } from "lucide-react";
import { toast } from "sonner";

type MediaFormData = MediaInput;

export default function MediaFormPage() {
  const params = useParams();
  const router = useRouter();
  const mediaId = params.mediaId as string;
  const isEditMode = mediaId !== "create";

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

 const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<MediaFormData>({
    resolver: zodResolver(mediaSchema), // L'erreur TS(2322) disparaîtra
    defaultValues: {
      title: "",
      file_path: "",
      file_type: "image",
      // Les champs suivants sont optional() dans Zod,
      // donc on peut les laisser undefined pour respecter l'absence de valeur initiale.
      // mime_type: undefined, 
      // file_size: undefined,
      // alt_text: undefined,
      // description: undefined,
      uploader_id: 1, // Requis dans Zod
      is_featured: false, // Default dans Zod, doit être un booléen ici
      // entity_type: undefined,
      // entity_id: undefined,
    },
  });

  const filePath = watch("file_path");
  const fileType = watch("file_type");

  // Charger les données du média en mode édition
  useEffect(() => {
    if (isEditMode) {
      const fetchMedia = async () => {
        try {
          const response = await fetch(`/api/media/${mediaId}`);
          if (response.ok) {
            const data = await response.json();
            
            // Préparer les valeurs pour le formulaire
            const formValues: MediaFormData = {
              title: data.title,
              file_path: data.file_path,
              file_type: data.file_type,
              mime_type: data.mime_type || "",
              file_size: data.file_size || undefined,
              alt_text: data.alt_text || "",
              description: data.description || "",
              uploader_id: data.uploader_id,
              is_featured: data.is_featured,
              entity_type: data.entity_type || undefined,
              entity_id: data.entity_id || undefined,
            };
            
            reset(formValues);
          } else {
            toast.error("Erreur lors du chargement du média");
            router.push("/ad/media");
          }
        } catch (error) {
          console.error("Erreur:", error);
          toast.error("Erreur réseau");
        }
      };
      fetchMedia();
    }
  }, [mediaId, isEditMode, reset, router]);

  const onSubmit = async (data: MediaFormData) => {
    setLoading(true);
    setFormError(null);

    try {
      // Nettoyer les données - inclure les valeurs par défaut
      const cleanedData: MediaInput = {
        title: data.title,
        file_path: data.file_path,
        file_type: data.file_type,
        mime_type: data.mime_type || undefined,
        file_size: data.file_size || undefined,
        alt_text: data.alt_text || undefined,
        description: data.description || undefined,
        uploader_id: Number(data.uploader_id),
        is_featured: Boolean(data.is_featured),
        entity_type: data.entity_type || undefined,
        entity_id: data.entity_id ? Number(data.entity_id) : undefined,
      };

      const formData = new FormData();
      Object.entries(cleanedData).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          formData.append(key, value.toString());
        }
      });

      const url = isEditMode ? `/api/media/${mediaId}` : "/api/media";
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
        isEditMode 
          ? "Média modifié avec succès" 
          : "Média créé avec succès"
      );
      
      // Rediriger après succès
      if (isEditMode) {
        router.push(`/ad/media/${mediaId}`);
      } else {
        router.push("/ad/media");
      }
      
    } catch (error) {
      console.error("Erreur:", error);
      setFormError(error instanceof Error ? error.message : "Une erreur est survenue");
      toast.error("Erreur lors de l'enregistrement");
    } finally {
      setLoading(false);
    }
  };

  const fileTypes = [
    { value: "image", label: "Image" },
    { value: "video", label: "Vidéo" },
    { value: "document", label: "Document" },
    { value: "audio", label: "Audio" },
  ];

  const entityTypes = [
    { value: "", label: "Aucune" },
    { value: "fighter", label: "Lutteur" },
    { value: "competition", label: "Compétition" },
    { value: "article", label: "Article" },
    { value: "user", label: "Utilisateur" },
    { value: "coach", label: "Coach" },
    { value: "referee", label: "Arbitre" },
    { value: "region", label: "Région" },
  ];


  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>
          {isEditMode ? "Modifier le média" : "Ajouter un nouveau média"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {formError && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{formError}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Upload de fichier */}
          <div>
            <Label className="block text-sm font-medium text-gray-700 mb-2">
              Fichier <span className="text-red-500">*</span>
            </Label>
            <div className="space-y-4">
              <AdvancedUpload
                value={filePath || ""}
                onChange={(url) => setValue("file_path", url)}
                maxSizeMB={50}
                maxWidthOrHeight={3840}
                uploadPath="media"
                isRounded={false}
                showInternalSelection={true}
                internalImagesFolder="media"
                emptyPreview={
                  <div className="text-center border-2 border-dashed border-gray-300 rounded-lg p-6">
                    <FileUp className="mx-auto h-10 w-10 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600">
                      {uploading ? "Upload en cours..." : "Cliquez ou déposez un fichier"}
                    </p>
                  </div>
                }
              />
              
              {/* Informations sur le fichier sélectionné */}
              {filePath && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <FileUp className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium">Fichier sélectionné:</span>
                    <span className="text-sm text-gray-600 truncate">{filePath}</span>
                  </div>
                </div>
              )}
            </div>
            {errors.file_path && (
              <p className="text-red-500 text-sm mt-1">{errors.file_path.message}</p>
            )}
          </div>

          {/* Informations du média */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="title">
                Titre <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                {...register("title")}
                placeholder="Titre du média"
              />
              {errors.title && (
                <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="file_type">Type de fichier</Label>
              <Select
                value={fileType}
                onValueChange={(value) =>
                  setValue("file_type", value as any)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un type" />
                </SelectTrigger>
                <SelectContent>
                  {fileTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.file_type && (
                <p className="text-red-500 text-sm mt-1">{errors.file_type.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="mime_type">Type MIME (optionnel)</Label>
              <Input
                id="mime_type"
                {...register("mime_type")}
                placeholder="ex: image/jpeg, video/mp4"
              />
              {errors.mime_type && (
                <p className="text-red-500 text-sm mt-1">{errors.mime_type.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="file_size">Taille du fichier (octets, optionnel)</Label>
              <Input
                id="file_size"
                type="number"
                min="0"
                {...register("file_size", { valueAsNumber: true })}
                placeholder="Taille en octets"
              />
              {errors.file_size && (
                <p className="text-red-500 text-sm mt-1">{errors.file_size.message}</p>
              )}
            </div>
          </div>

          {/* Métadonnées */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="entity_type">Type d'entité associée (optionnel)</Label>
              <Select
                value={watch("entity_type") || ""}
                onValueChange={(value) =>
                  setValue("entity_type", value || undefined)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un type" />
                </SelectTrigger>
                <SelectContent>
                  {entityTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.entity_type && (
                <p className="text-red-500 text-sm mt-1">{errors.entity_type.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="entity_id">ID de l'entité associée (optionnel)</Label>
              <Input
                id="entity_id"
                type="number"
                min="0"
                {...register("entity_id", { valueAsNumber: true })}
                placeholder="ID numérique"
              />
              {errors.entity_id && (
                <p className="text-red-500 text-sm mt-1">{errors.entity_id.message}</p>
              )}
            </div>
          </div>

          {/* Texte alternatif */}
          <div>
            <Label htmlFor="alt_text">Texte alternatif (optionnel)</Label>
            <Input
              id="alt_text"
              {...register("alt_text")}
              placeholder="Description pour l'accessibilité"
            />
            <p className="text-xs text-gray-500 mt-1">
              Important pour l'accessibilité (images) et le référencement
            </p>
            {errors.alt_text && (
              <p className="text-red-500 text-sm mt-1">{errors.alt_text.message}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Description (optionnel)</Label>
            <Textarea
              id="description"
              {...register("description")}
              placeholder="Description détaillée du média"
              rows={3}
            />
            {errors.description && (
              <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>
            )}
          </div>

          {/* Options */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_featured"
                {...register("is_featured")}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <Label htmlFor="is_featured" className="text-sm font-medium">
                Mettre en vedette
              </Label>
            </div>

            <div>
              <Label htmlFor="uploader_id">ID de l'uploader</Label>
              <Input
                id="uploader_id"
                type="number"
                min="1"
                {...register("uploader_id", { valueAsNumber: true })}
                placeholder="ID de l'utilisateur"
              />
              <p className="text-xs text-gray-500 mt-1">
                TODO: Remplacer par une sélection d'utilisateur
              </p>
              {errors.uploader_id && (
                <p className="text-red-500 text-sm mt-1">{errors.uploader_id.message}</p>
              )}
            </div>
          </div>

          {/* Informations */}
          <Alert>
            <AlertDescription>
              {isEditMode
                ? "Modifiez les informations du média. Les changements seront visibles immédiatement."
                : "Ajoutez un nouveau fichier média. Assurez-vous que le fichier est correctement uploadé avant de sauvegarder."}
            </AlertDescription>
          </Alert>

          {/* Boutons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={loading || uploading}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={loading || uploading}>
              {loading
                ? "Enregistrement..."
                : isEditMode
                ? "Mettre à jour"
                : "Ajouter le média"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}