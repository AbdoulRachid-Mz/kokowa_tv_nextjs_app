// app/admin/achievements/form.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { fighterAchievementSchema } from "@/validation/schemas";
import { FighterAchievementInput } from "@/validation/schemas";
import { Fighter, Region, CompetitionEdition } from "@/types";
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Typography } from "@/components/ui/typography";
import { Badge } from "@/components/ui/badge";
import { Loader2, Trophy, Medal, Calendar, MapPin, User } from "lucide-react";
import { AdvancedUpload } from "../ui/advanced-upload";
import { archiveFighterAchievement, createArchiveFighterAchievement } from "@/actions/archives";

interface AchievementFormProps {
  // Pour la création
  initialFighterId?: number;
  initialRegionId?: number;
  // Pour l'édition
  achievementId?: number;
  // Callbacks
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function AchievementForm({
  initialFighterId,
  initialRegionId,
  achievementId,
  onSuccess,
  onCancel,
}: AchievementFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(!!achievementId);
  const [fighters, setFighters] = useState<Fighter[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [editions, setEditions] = useState<CompetitionEdition[]>([]);
  const [fightersLoading, setFightersLoading] = useState(false);
  const [regionsLoading, setRegionsLoading] = useState(false);
  const [editionsLoading, setEditionsLoading] = useState(false);
  const [selectedFighter, setSelectedFighter] = useState<Fighter | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);

  const isEditMode = !!achievementId;

  const form = useForm<FighterAchievementInput>({
    resolver: zodResolver(fighterAchievementSchema),
    defaultValues: {
      fighter_id: initialFighterId,
      region_id: initialRegionId,
      title: "",
      edition_id: undefined,
      year: new Date().getFullYear(),
      position: "1st",
      description: "",
      medal_image: "/icons/3d-medal.png",
    },
  });

  // Génère une description dynamique basée sur les données sélectionnées
  const generateDynamicDescription = (): string => {
    const fighterId = form.getValues("fighter_id");
    const regionId = form.getValues("region_id");
    const editionId = form.getValues("edition_id");
    const year = form.getValues("year");
    const position = form.getValues("position");

    const fighter = fighters.find((f) => f.id === fighterId);
    const region = regions.find((r) => r.id === regionId);
    const edition = editions.find((e) => e.id === editionId);

    const positionLabel = getPositionLabel(position).label;

    const parts: string[] = [];

    if (fighter) {
      parts.push(`${fighter.first_name} ${fighter.last_name}`);
      if (fighter.nickname) parts.push(`(${fighter.nickname})`);
    }

    if (region) {
      parts.push(`de la région ${region.name}`);
    }

    if (edition && edition.competition) {
      parts.push(`a obtenu ${positionLabel} à ${edition.competition.name}`);
      if (edition.edition_number) {
        parts.push(`(Édition ${edition.edition_number})`);
      }
    } else {
      parts.push(`a obtenu ${positionLabel}`);
    }

    if (year) {
      parts.push(`en ${year}`);
    }

    return parts.join(" ") + ".";
  };

  // Met à jour la description dynamiquement lors des changements
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (
        name === "fighter_id" ||
        name === "region_id" ||
        name === "edition_id" ||
        name === "year" ||
        name === "position"
      ) {
        const dynamicDesc = generateDynamicDescription();
        form.setValue("description", dynamicDesc, { shouldDirty: false });
      }
    });
    return () => subscription.unsubscribe();
  }, [fighters, regions, editions]);

  // Charger les données initiales pour l'édition
  useEffect(() => {
    const loadInitialData = async () => {
      await Promise.all([loadFighters(), loadRegions(), loadEditions()]);

      if (isEditMode) {
        try {
          const response = await fetch(`/api/achievements/${achievementId}`);
          if (response.ok) {
            const data = await response.json();
            form.reset({
              fighter_id: data.fighter_id,
              region_id: data.region_id,
              title: data.title,
              edition_id: data.edition_id,
              year: data.year,
              position: data.position,
              description: data.description || "",
              medal_image: data.medal_image || "",
            });
            // Charger les infos du lutteur et région sélectionnés
            if (data.fighter) setSelectedFighter(data.fighter);
            if (data.region) setSelectedRegion(data.region);
          } else {
            toast.error("Erreur lors du chargement du palmarès");
          }
        } catch (error) {
          console.error("Error loading achievement:", error);
          toast.error("Erreur lors du chargement des données");
        }
      } else if (initialFighterId) {
        // Charger les infos du lutteur si fourni
        loadFighterDetails(initialFighterId);
      }
      setInitialLoading(false);
    };

    loadInitialData();
  }, [achievementId, initialFighterId, initialRegionId]);

  const loadFighterDetails = async (fighterId: number) => {
    try {
      const response = await fetch(`/api/fighters/${fighterId}?with_region=true`);
      if (response.ok) {
        const fighter = await response.json();
        setSelectedFighter(fighter);
        // Si la région n'est pas déjà définie, utiliser celle du lutteur
        if (!initialRegionId && fighter.region_id) {
          form.setValue("region_id", fighter.region_id);
        }
      }
    } catch (error) {
      console.error("Error loading fighter details:", error);
    }
  };

  const loadFighters = async () => {
    setFightersLoading(true);
    try {
      const response = await fetch("/api/fighters?limit=100&is_active=true&with_region=true");
      if (response.ok) {
        const data = await response.json();
        const fightersList = data.data || data;
        // Sort fighters alphabetically by last name, then first name
        fightersList.sort((a: Fighter, b: Fighter) => {
          const nameA = `${a.last_name} ${a.first_name}`.toLowerCase();
          const nameB = `${b.last_name} ${b.first_name}`.toLowerCase();
          return nameA.localeCompare(nameB);
        });
        setFighters(fightersList);
      }
    } catch (error) {
      console.error("Error loading fighters:", error);
    } finally {
      setFightersLoading(false);
    }
  };

  const loadRegions = async () => {
    setRegionsLoading(true);
    try {
      const response = await fetch("/api/regions?limit=100");
      if (response.ok) {
        const data = await response.json();
        const regionsList = data.data || data;
        // Sort regions alphabetically by name
        regionsList.sort((a: Region, b: Region) => {
          return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
        });
        setRegions(regionsList);
      }
    } catch (error) {
      console.error("Error loading regions:", error);
    } finally {
      setRegionsLoading(false);
    }
  };

  const loadEditions = async () => {
    setEditionsLoading(true);
    try {
      const response = await fetch("/api/editions?limit=100&is_active=true");
      if (response.ok) {
        const data = await response.json();
        setEditions(data.data || data);
      }
    } catch (error) {
      console.error("Error loading editions:", error);
    } finally {
      setEditionsLoading(false);
    }
  };

  // Mettre à jour les infos du lutteur sélectionné
  const handleFighterChange = async (fighterId: string) => {
    const id = parseInt(fighterId);
    form.setValue("fighter_id", id);
    
    try {
      const response = await fetch(`/api/fighters/${id}?with_region=true`);
      if (response.ok) {
        const fighter = await response.json();
        setSelectedFighter(fighter);
        // Suggestion automatique de la région
        if (fighter.region_id && !form.getValues("region_id")) {
          form.setValue("region_id", fighter.region_id);
        }
      }
    } catch (error) {
      console.error("Error loading fighter:", error);
    }
  };

  const handleRegionChange = (regionId: string) => {
    const id = parseInt(regionId);
    form.setValue("region_id", id);
    const region = regions.find(r => r.id === id);
    setSelectedRegion(region || null);
  };

  const onSubmit = async (data: FighterAchievementInput) => {
    setLoading(true);
    try {
      // Archiver l'ancien palmarès si on est en mode création
      if (!isEditMode && achievementId) {
        await archiveFighterAchievement(achievementId);
      }

      if (isEditMode && achievementId) {
        await archiveFighterAchievement(achievementId);
      }

      // Créer le nouveau palmarès dans les archives
      const archiveData = {
        ...data,
        archive_reason: isEditMode ? "Modification via formulaire admin" : "Création via formulaire admin",
        original_id: isEditMode ? achievementId : null,
      };

      const result = isEditMode
        ? await createArchiveFighterAchievement(archiveData)
        : await createArchiveFighterAchievement(archiveData);

      if (result.success) {
        toast.success(
          isEditMode ? "Palmarès modifié avec succès" : "Palmarès créé avec succès"
        );
        
        if (onSuccess) {
          onSuccess();
        } else {
          router.push("/admin/fighter-achievements-archives");
          router.refresh();
        }
      } else {
        throw new Error(result.message || "Erreur lors de l'enregistrement");
      }
    } catch (error) {
      console.error("Error saving achievement:", error);
      toast.error(
        error instanceof Error ? error.message : "Erreur lors de l'enregistrement"
      );
    } finally {
      setLoading(false);
    }
  };

  const getPositionLabel = (position: string) => {
    const positions: Record<string, { label: string; icon: string; color: string }> = {
      "1st": { label: "🥇 1ère Place", icon: "🥇", color: "bg-yellow-100 text-yellow-800" },
      "2nd": { label: "🥈 2ème Place", icon: "🥈", color: "bg-gray-100 text-gray-800" },
      "3rd": { label: "🥉 3ème Place", icon: "🥉", color: "bg-orange-100 text-orange-800" },
      finalist: { label: "🏆 Finaliste", icon: "🏆", color: "bg-purple-100 text-purple-800" },
      semifinalist: { label: "🎯 Demi-finaliste", icon: "🎯", color: "bg-blue-100 text-blue-800" },
      quarterfinalist: { label: "⭐ Quart-de-finaliste", icon: "⭐", color: "bg-green-100 text-green-800" },
    };
    return positions[position] || { label: position, icon: "🏅", color: "bg-gray-100" };
  };

  if (initialLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* En-tête */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">
                  {isEditMode ? "Modifier le palmarès" : "Nouveau palmarès"}
                </CardTitle>
                <CardDescription>
                  {isEditMode
                    ? "Modifiez les informations du palmarès du lutteur"
                    : "Ajoutez un nouveau palmarès à un lutteur"}
                </CardDescription>
              </div>
              {selectedFighter && (
                <Badge variant="outline" className="flex items-center gap-2 px-3 py-1">
                  <User className="h-4 w-4" />
                  {selectedFighter.first_name} {selectedFighter.last_name}
                </Badge>
              )}
            </div>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Formulaire principal */}
          <div className="lg:col-span-2 space-y-6">
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic">Informations</TabsTrigger>
                <TabsTrigger value="details">Détails</TabsTrigger>
                <TabsTrigger value="media">Média</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4 mt-4">
                <Card>
                  <CardContent className="pt-6 space-y-4">
                    {/* Lutteur */}
                    <FormField
                      control={form.control}
                      name="fighter_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            <User className="h-4 w-4 inline mr-2" />
                            Lutteur *
                          </FormLabel>
                          <Select
                            onValueChange={handleFighterChange}
                            value={field.value?.toString()}
                            disabled={fightersLoading || (isEditMode && !!initialFighterId)}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Sélectionner un lutteur" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {fighters.map((fighter) => (
                                <SelectItem key={fighter.id} value={fighter.id.toString()}>
                                  {fighter.first_name} {fighter.last_name}
                                  {fighter.nickname && ` (${fighter.nickname})`}
                                  {fighter.region && ` - ${fighter.region.name}`}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Le lutteur qui a obtenu ce palmarès
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Région */}
                    <FormField
                      control={form.control}
                      name="region_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            <MapPin className="h-4 w-4 inline mr-2" />
                            Région *
                          </FormLabel>
                          <Select
                            onValueChange={handleRegionChange}
                            value={field.value?.toString()}
                            disabled={regionsLoading}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Sélectionner une région" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {regions.map((region) => (
                                <SelectItem key={region.id} value={region.id.toString()}>
                                  {region.name} ({region.code})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            La région représentée par le lutteur
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Titre */}
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            <Trophy className="h-4 w-4 inline mr-2" />
                            Titre *
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Ex: Champion National, Vainqueur de la Coupe..."
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Le nom du titre ou de la distinction obtenue
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="details" className="space-y-4 mt-4">
                <Card>
                  <CardContent className="pt-6 space-y-4">
                    {/* Édition */}
                    <FormField
                      control={form.control}
                      name="edition_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            <Calendar className="h-4 w-4 inline mr-2" />
                            Édition *
                          </FormLabel>
                          <Select
                            onValueChange={(value) => field.onChange(parseInt(value))}
                            value={field.value?.toString()}
                            disabled={editionsLoading}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Sélectionner une édition" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {editions.map((edition) => (
                                <SelectItem key={edition.id} value={edition.id.toString()}>
                                  Édition {edition.edition_number} - {edition.year}
                                  {edition.competition && ` (${edition.competition.name})`}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            L'édition de la compétition concernée
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Année */}
                    <FormField
                      control={form.control}
                      name="year"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Année *</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="2024"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                            />
                          </FormControl>
                          <FormDescription>
                            L'année d'obtention du palmarès
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Position */}
                    <FormField
                      control={form.control}
                      name="position"
                      render={({ field }) => {
                        const positionInfo = getPositionLabel(field.value);
                        return (
                          <FormItem>
                            <FormLabel>Position *</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="1st">
                                  <span className="flex items-center gap-2">
                                    🥇 1ère Place
                                  </span>
                                </SelectItem>
                                <SelectItem value="2nd">
                                  <span className="flex items-center gap-2">
                                    🥈 2ème Place
                                  </span>
                                </SelectItem>
                                <SelectItem value="3rd">
                                  <span className="flex items-center gap-2">
                                    🥉 3ème Place
                                  </span>
                                </SelectItem>
                                <SelectItem value="finalist">
                                  <span className="flex items-center gap-2">
                                    🏆 Finaliste
                                  </span>
                                </SelectItem>
                                <SelectItem value="semifinalist">
                                  <span className="flex items-center gap-2">
                                    🎯 Demi-finaliste
                                  </span>
                                </SelectItem>
                                <SelectItem value="quarterfinalist">
                                  <span className="flex items-center gap-2">
                                    ⭐ Quart-de-finaliste
                                  </span>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              <Badge className={positionInfo.color}>
                                {positionInfo.label}
                              </Badge>
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        );
                      }}
                    />

                    {/* Description */}
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Description détaillée du palmarès..."
                              className="min-h-[120px]"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Informations supplémentaires sur cette distinction
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="media" className="space-y-4 mt-4">
                <Card>
                  <CardContent className="pt-6 space-y-4">
                    <FormField
                      control={form.control}
                      name="medal_image"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            <Medal className="h-4 w-4 inline mr-2" />
                            Image du médaillon
                          </FormLabel>
                          <FormControl>
                            <AdvancedUpload
                              value={field.value ?? ""}
                              onChange={field.onChange}
                              maxSizeMB={2}
                              maxWidthOrHeight={1024}
                              uploadPath="achievements/medals"
                              isRounded
                              showInternalSelection
                              internalImagesFolder="achievements/medals"
                              imageFilters={{
                                withSubfolders: true,
                                sortBy: "name",
                                sortOrder: "asc",
                              }}
                            />
                          </FormControl>
                          <FormDescription>
                            Lien vers l'image du médaillon ou de la récompense
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Résumé / Aperçu */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle className="text-lg">Résumé</CardTitle>
                <CardDescription>Aperçu du palmarès</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 bg-muted/30 rounded-lg text-center">
                  {(() => {
                    const posInfo = getPositionLabel(form.watch("position"));
                    return (
                      <div className="space-y-2">
                        <div className="text-4xl">{posInfo.icon}</div>
                        <Typography variant="body-sm" weight="medium">
                          {posInfo.label}
                        </Typography>
                      </div>
                    );
                  })()}
                </div>

                <div className="space-y-2">
                  <Typography variant="body-sm" weight="medium" className="text-muted-foreground">
                    Titre
                  </Typography>
                  <Typography>
                    {form.watch("title") || "Non renseigné"}
                  </Typography>
                </div>

                {selectedFighter && (
                  <div className="space-y-2">
                    <Typography variant="body-sm" weight="medium" className="text-muted-foreground">
                      Lutteur
                    </Typography>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-4 w-4 text-primary" />
                      </div>
                      <Typography>
                        {selectedFighter.first_name} {selectedFighter.last_name}
                      </Typography>
                    </div>
                  </div>
                )}

                {selectedRegion && (
                  <div className="space-y-2">
                    <Typography variant="body-sm" weight="medium" className="text-muted-foreground">
                      Région
                    </Typography>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <MapPin className="h-4 w-4 text-primary" />
                      </div>
                      <Typography>{selectedRegion.name}</Typography>
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Année:</span>
                    <span className="font-medium">{form.watch("year")}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel || (() => router.back())}
          >
            Annuler
          </Button>
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditMode ? "Mettre à jour" : "Créer"}
          </Button>
        </div>
      </form>
    </Form>
  );
}