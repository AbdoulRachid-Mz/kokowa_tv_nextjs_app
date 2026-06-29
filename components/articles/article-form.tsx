// components/articles/article-form.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { articleSchema, ArticleInput } from "@/validation/schemas";
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
import { ImageIcon, Globe, Eye, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Typography } from "@/components/ui/typography";
import { getUsers } from "@/actions/users";
import {
  createArticle,
  updateArticle,
  getArticleById,
} from "@/actions/articles";
import { Article } from "@/types";
import { ContentUpload } from "./content-upload";

interface ArticleFormProps {
  mode: "create" | "edit";
  articleId?: string;
  initialData?: Article | null;
}

export function ArticleForm({
  mode,
  articleId,
  initialData,
}: ArticleFormProps) {
  const router = useRouter();
  const isEditMode = mode === "edit";

  const [loading, setLoading] = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(
    !!articleId && !initialData,
  );
  const [formError, setFormError] = useState<string | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<ArticleInput>({
    resolver: zodResolver(articleSchema),
    defaultValues: {
      title: "",
      slug: "",
      type: "news",
      excerpt: "",
      content: "",
      featured_image: "",
      author_id: 1,
      status: "draft",
      language: "fr",
      view_count: 0,
      like_count: 0,
      share_count: 0,
      meta_title: "",
      meta_description: "",
    },
  });

  const title = watch("title");
  const slug = watch("slug");
  const type = watch("type");
  const status = watch("status");
  const featuredImage = watch("featured_image");

  // Charger les utilisateurs pour le select d'auteur
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await getUsers({
          limit: 50,
          role: "admin",
          is_active: true,
          with_profile: true,
        });

        if (response.data) {
          setUsers(response.data);
        }
      } catch (error) {
        console.error("Erreur lors du chargement des utilisateurs:", error);
      } finally {
        setLoadingUsers(false);
      }
    };
    fetchUsers();
  }, []);

  // Charger les données de l'article en mode édition
  useEffect(() => {
    if (isEditMode && articleId && !initialData) {
      const fetchArticle = async () => {
        setLoadingInitial(true);
        try {
          const data = await getArticleById(Number(articleId), {
            with_relations: false,
          });

          if (data) {
            const formValues: ArticleInput = {
              title: data.title || "",
              slug: data.slug || "",
              type: data.type || "news",
              excerpt: data.excerpt || "",
              content: data.content || "",
              featured_image: data.featured_image || "",
              author_id: data.author_id || 1,
              status: data.status || "draft",
              language: data.language || "fr",
              view_count: data.view_count || 0,
              like_count: data.like_count || 0,
              share_count: data.share_count || 0,
              meta_title: data.meta_title || "",
              meta_description: data.meta_description || "",
              published_at: data.published_at || "",
            };
            reset(formValues);
          } else {
            toast.error("Erreur lors du chargement de l'article");
          }
        } catch (error) {
          console.error("Erreur:", error);
          toast.error("Erreur lors du chargement de l'article");
        } finally {
          setLoadingInitial(false);
        }
      };
      fetchArticle();
    } else if (isEditMode && initialData) {
      // Si les données initiales sont fournies, les utiliser directement
      const formValues: ArticleInput = {
        title: initialData.title || "",
        slug: initialData.slug || "",
        type: initialData.type || "news",
        excerpt: initialData.excerpt || "",
        content: initialData.content || "",
        featured_image: initialData.featured_image || "",
        author_id: initialData.author_id || 1,
        status: initialData.status || "draft",
        language: initialData.language || "fr",
        view_count: initialData.view_count || 0,
        like_count: initialData.like_count || 0,
        share_count: initialData.share_count || 0,
        meta_title: initialData.meta_title || "",
        meta_description: initialData.meta_description || "",
        published_at: initialData.published_at || "",
      };
      reset(formValues);
    }
  }, [isEditMode, articleId, initialData, reset]);

  // Générer automatiquement le slug à partir du titre
  useEffect(() => {
    if (!isEditMode && title && !slug) {
      const generatedSlug = title
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      setValue("slug", generatedSlug);
    }
  }, [title, isEditMode, slug, setValue]);

  const onSubmit = async (data: ArticleInput) => {
    setLoading(true);
    setFormError(null);

    try {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (
          value === undefined ||
          value === null ||
          value === "" ||
          value === "null"
        ) {
          return;
        }
        if (key === "featured_image") {
          if (value instanceof File) {
            formData.append("featured_image", value);
          } else {
            formData.append("featured_image", value as string);
          }
        } else {
          formData.append(key, String(value));
        }
      });

      let result;
      if (isEditMode && articleId) {
        result = await updateArticle(Number(articleId), formData);
      } else {
        result = await createArticle(formData);
      }

      if (!result.success) {
        throw new Error(result.message || "Erreur lors de l'enregistrement");
      }

      toast.success(
        isEditMode ? "Article modifié avec succès" : "Article créé avec succès",
      );

      // Redirection après succès
      if (isEditMode && articleId) {
        router.push(`/ad/articles/${articleId}`);
      } else {
        router.push("/ad/articles");
      }
    } catch (error) {
      console.error("Erreur:", error);
      setFormError(
        error instanceof Error ? error.message : "Une erreur est survenue",
      );
      toast.error("Erreur lors de l'enregistrement");
    } finally {
      setLoading(false);
    }
  };

  // Gestionnaire de prévisualisation
  const handlePreview = () => {
    const data = watch();
    const previewData = {
      ...data,
      author_id: Number(data.author_id),
    };
    sessionStorage.setItem("article_preview", JSON.stringify(previewData));
    window.open("/articles/preview", "_blank");
  };

  const statusOptions = [
    { value: "draft", label: "Brouillon" },
    { value: "published", label: "Publié" },
    { value: "archived", label: "Archivé" },
  ];

  const typeOptions = [
    { value: "news", label: "Actualité" },
    { value: "event", label: "Événement" },
    { value: "analyse", label: "Analyse" }, // valeur sans accent
    { value: "announcement", label: "Annonce" },
    { value: "highlight", label: "Mise en avant" },
    { value: "interview", label: "Interview" },
  ];

  const languageOptions = [
    { value: "fr", label: "Français" },
    { value: "ha", label: "Hausa" },
    { value: "en", label: "Anglais" },
  ];

  if (loadingInitial) {
    return (
      <Card className="max-w-6xl mx-auto">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
          <Typography variant="body-base">
            Chargement de l'article...
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-6xl mx-auto">
      <CardHeader>
        <CardTitle>
          {isEditMode ? "Modifier l'article" : "Créer un nouvel article"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {formError && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{formError}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Titre et Slug */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="title">
                Titre <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                {...register("title")}
                placeholder="Titre de l'article"
              />
              {errors.title && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.title.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="type">Type d'article</Label>
              <Select
                value={type}
                onValueChange={(value) => setValue("type", value as any)}
              >
                <SelectTrigger id="type">
                  <SelectValue placeholder="Sélectionner un type" />
                </SelectTrigger>
                <SelectContent>
                  {typeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="slug">
                Slug (URL) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="slug"
                {...register("slug")}
                placeholder="slug-de-l-article"
              />
              <p className="text-xs text-gray-500 mt-1">
                URL conviviale pour le référencement
              </p>
              {errors.slug && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.slug.message}
                </p>
              )}
            </div>
          </div>

          {/* Extrait */}
          <div>
            <Label htmlFor="excerpt">Extrait (optionnel)</Label>
            <Textarea
              id="excerpt"
              {...register("excerpt")}
              placeholder="Court résumé de l'article (utilisé dans les listes et pour le SEO)"
              rows={2}
            />
            <p className="text-xs text-gray-500 mt-1">
              Idéalement 150-160 caractères pour le SEO
            </p>
            {errors.excerpt && (
              <p className="text-red-500 text-sm mt-1">
                {errors.excerpt.message}
              </p>
            )}
          </div>

          {/* Image en vedette */}
          <div>
            <Label className="block text-sm font-medium text-gray-700 mb-2">
              Image en vedette (optionnel)
            </Label>
            <AdvancedUpload
              value={typeof featuredImage === "string" ? featuredImage : ""}
              onChange={(url) => setValue("featured_image", url)}
              maxSizeMB={5}
              maxWidthOrHeight={1920}
              uploadPath="articles"
              isRounded={false}
              showInternalSelection={true}
              internalImagesFolder="articles"
              emptyPreview={
                <div className="text-center border-2 border-dashed border-gray-300 rounded-lg p-6">
                  <ImageIcon className="mx-auto h-10 w-10 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600">
                    Aucune image sélectionnée
                  </p>
                </div>
              }
            />
            <p className="text-xs text-gray-500 mt-1">
              Image d'en-tête pour l'article (recommandé: 1200x630 pixels)
            </p>
            {errors.featured_image && (
              <p className="text-red-500 text-sm mt-1">
                {errors.featured_image.message}
              </p>
            )}
          </div>

          {/* Contenu */}
          <div>
            <Label htmlFor="content">
              Contenu <span className="text-red-500">*</span>
            </Label>
            <ContentUpload
              value={watch("content") || ""}
              onChange={(value) => setValue("content", value)}
              disabled={loading}
              placeholder="Contenu de l'article (Markdown, HTML, Texte...)"
              rows={12}
            />
            <p className="text-xs text-gray-500 mt-1">
              Importez un fichier (PDF, Markdown, HTML, TXT, DOC, JSON) ou
              écrivez directement. Le contenu peut être formaté en HTML ou
              Markdown.
            </p>
            {errors.content && (
              <p className="text-red-500 text-sm mt-1">
                {errors.content.message}
              </p>
            )}
          </div>

          {/* Métadonnées */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div>
              <Label htmlFor="author_id">
                Auteur <span className="text-red-500">*</span>
              </Label>
              <Select
                value={watch("author_id")?.toString() || ""}
                onValueChange={(value) => setValue("author_id", Number(value))}
                disabled={loadingUsers}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un auteur" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id.toString()}>
                      {user.username}
                      {user.first_name &&
                        ` (${user.first_name} ${user.last_name})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {loadingUsers && (
                <p className="text-gray-500 text-sm mt-1">
                  Chargement des utilisateurs...
                </p>
              )}
              {errors.author_id && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.author_id.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="status">Statut</Label>
              <Select
                value={status}
                onValueChange={(value) => setValue("status", value as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un statut" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.status && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.status.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="language">Langue</Label>
              <Select
                value={watch("language")}
                onValueChange={(value) => setValue("language", value as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une langue" />
                </SelectTrigger>
                <SelectContent>
                  {languageOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        {option.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.language && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.language.message}
                </p>
              )}
            </div>
          </div>

          {/* SEO */}
          <div className="space-y-6">
            <div className="border-t pt-6">
              <Typography variant="h4" weight="medium" className="mb-4">
                Optimisation SEO
              </Typography>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="meta_title">Meta Title (optionnel)</Label>
                  <Input
                    id="meta_title"
                    {...register("meta_title")}
                    placeholder="Titre pour les moteurs de recherche"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Si vide, le titre de l'article sera utilisé
                  </p>
                  {errors.meta_title && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.meta_title.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="meta_description">
                    Meta Description (optionnel)
                  </Label>
                  <Textarea
                    id="meta_description"
                    {...register("meta_description")}
                    placeholder="Description pour les moteurs de recherche"
                    rows={3}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Idéalement 150-160 caractères. Si vide, l'extrait sera
                    utilisé.
                  </p>
                  {errors.meta_description && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.meta_description.message}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Informations */}
          <Alert>
            <AlertDescription>
              {isEditMode
                ? "Modifiez l'article. N'oubliez pas de mettre à jour le statut pour publier l'article."
                : "Créez un nouvel article. Vous pouvez le sauvegarder en brouillon et le publier plus tard."}
            </AlertDescription>
          </Alert>

          {/* Boutons */}
          <div className="flex justify-between gap-3 pt-4 border-t border-gray-200">
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handlePreview}
                disabled={loading}
              >
                <Eye className="h-4 w-4 mr-2" />
                Prévisualiser
              </Button>
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={loading}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={loading}
                onClick={() => setValue("status", "draft")}
                variant="outline"
              >
                {loading ? "Enregistrement..." : "Sauvegarder en brouillon"}
              </Button>
              <Button
                type="submit"
                disabled={loading}
                onClick={() => setValue("status", "published")}
              >
                {loading ? "Publication..." : "Publier l'article"}
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
