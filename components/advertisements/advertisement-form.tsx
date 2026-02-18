"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Advertisement } from "@/types";
import { AdvertisementInput, advertisementSchema } from "@/validation/schemas";
import { createAdvertisement, updateAdvertisement } from "@/actions/advertisements";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  CalendarIcon,
  Image,
  Video,
  Code,
  Globe,
  DollarSign,
  TrendingUp,
  Users,
  Phone,
  MapPin,
  Save,
  Loader2,
  Eye,
} from "lucide-react";
import { Typography } from "../ui/typography";

interface AdvertisementFormProps {
  initialData?: Advertisement;
  isEditing?: boolean;
}

const POSITIONS = [
  { value: "header", label: "En-tête" },
  { value: "sidebar", label: "Barre latérale" },
  { value: "footer", label: "Pied de page" },
  { value: "in_content", label: "Dans le contenu" },
  { value: "popup", label: "Pop-up" },
  { value: "banner_top", label: "Bannière haut" },
  { value: "banner_bottom", label: "Bannière bas" },
  { value: "mobile_sticky", label: "Mobile collant" },
];

const MEDIA_TYPES = [
  { value: "image", label: "Image", icon: Image },
  { value: "video", label: "Vidéo", icon: Video },
  { value: "html", label: "HTML", icon: Code },
];

export function AdvertisementForm({ initialData, isEditing = false }: AdvertisementFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("general");
  const [mediaPreview, setMediaPreview] = useState<string | null>(
    initialData?.media || null
  );

  const form = useForm<AdvertisementInput>({
    resolver: zodResolver(advertisementSchema),
    defaultValues: {
      title: initialData?.title || "",
      description: initialData?.description || "",
      media: initialData?.media || "",
      media_type: initialData?.media_type || "image",
      price: initialData?.price || 0,
      link_url: initialData?.link_url || "",
      position: initialData?.position || "header",
      priority: initialData?.priority || 0,
      start_date: initialData?.start_date || undefined,
      end_date: initialData?.end_date || undefined,
      is_active: initialData?.is_active ?? true,
      click_count: initialData?.click_count || 0,
      impression_count: initialData?.impression_count || 0,
      target_audience: initialData?.target_audience || "",
      advertiser_name: initialData?.advertiser_name || "",
      advertiser_contact: initialData?.advertiser_contact || "",
    },
  });

  const watchMediaType = form.watch("media_type");
  const watchMedia = form.watch("media");
  const watchIsActive = form.watch("is_active");
  const watchStartDate = form.watch("start_date");
  const watchEndDate = form.watch("end_date");

  // Mettre à jour la prévisualisation quand le média change
  useEffect(() => {
    if (watchMedia && watchMediaType === "image") {
      setMediaPreview(watchMedia);
    } else {
      setMediaPreview(null);
    }
  }, [watchMedia, watchMediaType]);

  const onSubmit = async (data: AdvertisementInput) => {
    try {
      setIsSubmitting(true);
      
      // Créer un FormData pour l'action
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, value.toString());
        }
      });

      let result;
      if (isEditing && initialData) {
        result = await updateAdvertisement(initialData.id, formData);
      } else {
        result = await createAdvertisement(formData);
      }

      if (result.success) {
        toast.success(
          isEditing 
            ? "Publicité modifiée avec succès" 
            : "Publicité créée avec succès"
        );
        router.push(`/ad/advertisements`);
        router.refresh();
      }
    } catch (error: any) {
      toast.error(error.message || "Une erreur est survenue");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getMediaIcon = (type: string) => {
    switch (type) {
      case "image": return <Image className="h-5 w-5" />;
      case "video": return <Video className="h-5 w-5" />;
      case "html": return <Code className="h-5 w-5" />;
      default: return null;
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Header avec actions */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              {isEditing ? "Modifier la publicité" : "Nouvelle publicité"}
            </h2>
            <p className="text-muted-foreground">
              {isEditing 
                ? "Modifiez les informations de la publicité" 
                : "Créez une nouvelle campagne publicitaire"}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEditing ? "Modification..." : "Création..."}
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {isEditing ? "Modifier" : "Créer"}
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Statut actif/inactif */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${watchIsActive ? "bg-green-500 animate-pulse" : "bg-gray-300"}`} />
                <FormField
                  control={form.control}
                  name="is_active"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-2 space-y-0">
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          {field.value ? "Publicité active" : "Publicité inactive"}
                        </FormLabel>
                        <FormDescription>
                          {field.value 
                            ? "Visible sur le site selon les dates définies" 
                            : "Masquée sur le site"}
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid grid-cols-3 w-full max-w-md">
            <TabsTrigger value="general">Général</TabsTrigger>
            <TabsTrigger value="media">Média</TabsTrigger>
            <TabsTrigger value="advanced">Avancé</TabsTrigger>
          </TabsList>

          {/* Onglet Général */}
          <TabsContent value="general" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Informations de base</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Titre *</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Promotion été 2024" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Description de la publicité..." 
                          className="resize-none"
                          rows={3}
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="position"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Position *</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner une position" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {POSITIONS.map((pos) => (
                              <SelectItem key={pos.value} value={pos.value}>
                                <div className="flex items-center gap-2">
                                  <MapPin className="h-4 w-4" />
                                  {pos.label}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Priorité</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="0"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormDescription>
                          Plus le chiffre est élevé, plus la publicité est prioritaire
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="link_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lien de destination</FormLabel>
                      <FormControl>
                        <div className="flex items-center gap-2">
                          <Globe className="h-4 w-4 text-muted-foreground" />
                          <Input 
                            placeholder="https://example.com" 
                            {...field}
                            value={field.value || ""}
                          />
                        </div>
                      </FormControl>
                      <FormDescription>
                        URL vers laquelle rediriger lors du clic
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Période de diffusion</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="start_date"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Date de début</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(new Date(field.value), "PPP HH:mm", { locale: fr })
                                ) : (
                                  <span>Choisir une date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value ? new Date(field.value) : undefined}
                              onSelect={(date) => {
                                if (date) {
                                  const currentValue = field.value ? new Date(field.value) : new Date();
                                  date.setHours(currentValue.getHours());
                                  date.setMinutes(currentValue.getMinutes());
                                  field.onChange(date.toISOString());
                                } else {
                                  field.onChange(undefined);
                                }
                              }}
                              initialFocus
                            />
                            <div className="p-3 border-t">
                              <Input
                                type="time"
                                onChange={(e) => {
                                  if (field.value) {
                                    const date = new Date(field.value);
                                    const [hours, minutes] = e.target.value.split(':');
                                    date.setHours(parseInt(hours), parseInt(minutes));
                                    field.onChange(date.toISOString());
                                  }
                                }}
                                defaultValue={field.value ? format(new Date(field.value), "HH:mm") : "00:00"}
                              />
                            </div>
                          </PopoverContent>
                        </Popover>
                        <FormDescription>
                          Laissez vide pour commencer immédiatement
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="end_date"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Date de fin</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(new Date(field.value), "PPP HH:mm", { locale: fr })
                                ) : (
                                  <span>Choisir une date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value ? new Date(field.value) : undefined}
                              onSelect={(date) => {
                                if (date) {
                                  const currentValue = field.value ? new Date(field.value) : new Date();
                                  date.setHours(currentValue.getHours());
                                  date.setMinutes(currentValue.getMinutes());
                                  field.onChange(date.toISOString());
                                } else {
                                  field.onChange(undefined);
                                }
                              }}
                              initialFocus
                            />
                            <div className="p-3 border-t">
                              <Input
                                type="time"
                                onChange={(e) => {
                                  if (field.value) {
                                    const date = new Date(field.value);
                                    const [hours, minutes] = e.target.value.split(':');
                                    date.setHours(parseInt(hours), parseInt(minutes));
                                    field.onChange(date.toISOString());
                                  }
                                }}
                                defaultValue={field.value ? format(new Date(field.value), "HH:mm") : "00:00"}
                              />
                            </div>
                          </PopoverContent>
                        </Popover>
                        <FormDescription>
                          Laissez vide pour une durée illimitée
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Aperçu de la période */}
                {watchStartDate && watchEndDate && (
                  <div className="mt-4 p-3 bg-muted/30 rounded-lg">
                    <Typography variant="body-sm" weight="medium">
                      Période sélectionnée
                    </Typography>
                    <Typography variant="body-sm" theme="muted">
                      Du {format(new Date(watchStartDate), "dd MMMM yyyy à HH:mm", { locale: fr})}
                      <br />
                      Au {format(new Date(watchEndDate), "dd MMMM yyyy à HH:mm", { locale: fr})}
                    </Typography>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Onglet Média */}
          <TabsContent value="media" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Type de média</CardTitle>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="media_type"
                  render={({ field }) => (
                    <FormItem>
                      <div className="grid grid-cols-3 gap-4">
                        {MEDIA_TYPES.map((type) => {
                          const Icon = type.icon;
                          return (
                            <div
                              key={type.value}
                              className={cn(
                                "flex flex-col items-center gap-2 p-4 border rounded-lg cursor-pointer transition-all",
                                field.value === type.value
                                  ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                                  : "hover:border-gray-400"
                              )}
                              onClick={() => field.onChange(type.value)}
                            >
                              <Icon className={cn(
                                "h-8 w-8",
                                field.value === type.value ? "text-primary" : "text-muted-foreground"
                              )} />
                              <span className={cn(
                                "text-sm font-medium",
                                field.value === type.value ? "text-primary" : "text-muted-foreground"
                              )}>
                                {type.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                      <FormDescription>
                        Choisissez le type de média à afficher
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Contenu média</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="media"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {watchMediaType === "image" && "URL de l'image"}
                        {watchMediaType === "video" && "URL de la vidéo"}
                        {watchMediaType === "html" && "Code HTML"}
                      </FormLabel>
                      <FormControl>
                        {watchMediaType === "html" ? (
                          <Textarea 
                            placeholder="<div>Votre code HTML ici...</div>"
                            className="font-mono text-sm"
                            rows={5}
                            {...field}
                            value={field.value || ""}
                          />
                        ) : (
                          <Input 
                            placeholder={
                              watchMediaType === "image" 
                                ? "https://example.com/image.jpg" 
                                : "https://example.com/video.mp4"
                            }
                            {...field}
                            value={field.value || ""}
                          />
                        )}
                      </FormControl>
                      <FormDescription>
                        {watchMediaType === "image" && "URL de l'image à afficher"}
                        {watchMediaType === "video" && "URL de la vidéo (MP4, YouTube, Vimeo)"}
                        {watchMediaType === "html" && "Code HTML personnalisé pour la publicité"}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Prévisualisation */}
                {watchMedia && watchMediaType === "image" && (
                  <div className="mt-4">
                    <FormLabel>Prévisualisation</FormLabel>
                    <div className="border rounded-lg overflow-hidden">
                      <img 
                        src={watchMedia} 
                        alt="Prévisualisation" 
                        className="w-full h-auto max-h-64 object-contain bg-muted/30"
                        onError={() => setMediaPreview(null)}
                      />
                    </div>
                  </div>
                )}

                {watchMedia && watchMediaType === "video" && (
                  <div className="mt-4">
                    <FormLabel>Prévisualisation</FormLabel>
                    <video 
                      src={watchMedia} 
                      controls 
                      className="w-full rounded-lg border"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Onglet Avancé */}
          <TabsContent value="advanced" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Informations annonceur</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="advertiser_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom de l'annonceur</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Ex: Entreprise XYZ" 
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="advertiser_contact"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact annonceur</FormLabel>
                      <FormControl>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <Input 
                            placeholder="Email ou téléphone" 
                            {...field}
                            value={field.value || ""}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="target_audience"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cible</FormLabel>
                      <FormControl>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <Input 
                            placeholder="Ex: Jeunes, amateurs de sport..." 
                            {...field}
                            value={field.value || ""}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tarification</CardTitle>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prix</FormLabel>
                      <FormControl>
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <Input 
                            type="number" 
                            min="0"
                            step="0.01"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </div>
                      </FormControl>
                      <FormDescription>
                        Prix de la campagne (en FCFA)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Statistiques initiales (uniquement en édition) */}
            {isEditing && (
              <Card>
                <CardHeader>
                  <CardTitle>Statistiques initiales</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="impression_count"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Impressions</FormLabel>
                          <FormControl>
                            <div className="flex items-center gap-2">
                              <Eye className="h-4 w-4 text-muted-foreground" />
                              <Input 
                                type="number" 
                                min="0"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="click_count"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Clics</FormLabel>
                          <FormControl>
                            <div className="flex items-center gap-2">
                              <TrendingUp className="h-4 w-4 text-muted-foreground" />
                              <Input 
                                type="number" 
                                min="0"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormDescription className="mt-2">
                    Ces valeurs seront ajoutées aux compteurs existants
                  </FormDescription>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </form>
    </Form>
  );
}