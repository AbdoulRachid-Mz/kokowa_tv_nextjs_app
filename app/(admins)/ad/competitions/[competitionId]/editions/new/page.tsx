// app/admin/competitions/[competitionId]/editions/new/page.tsx
// app/admin/editions/[editionId]/edit/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Typography } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  Save,
  Plus,
  Calendar,
  Trophy,
  Users,
  MapPin,
} from "lucide-react";
import { Competition, CompetitionEdition, Fighter, Region } from "@/types";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

// Schéma de validation
const editionSchema = z.object({
  edition_number: z.number().min(1, "Le numéro d'édition est requis"),
  year: z
    .number()
    .min(2000, "L'année doit être au moins 2000")
    .max(2100, "Année invalide"),
  theme: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  winner_fighter_id: z.number().optional(),
});

type EditionFormData = z.infer<typeof editionSchema>;

export default function EditionFormPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  const competitionId = params.competitionId as string;
  const editionId = params.editionId as string;
  const isEdit = !!editionId;

  const [competition, setCompetition] = useState<Competition | null>(null);
  const [edition, setEdition] = useState<CompetitionEdition | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [availableFighters, setAvailableFighters] = useState<Fighter[]>([]);
  const [availableRegions, setAvailableRegions] = useState<Region[]>([]);

  // React Hook Form
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<EditionFormData>({
    resolver: zodResolver(editionSchema),
    defaultValues: {
      edition_number: competition?.editions?.length
        ? competition.editions.length + 1
        : 1,
      year: new Date().getFullYear(),
    },
  });

  // Charger les données
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Charger la compétition
        if (competitionId) {
          const competitionResponse = await fetch(
            `/api/competitions/${competitionId}`
          );
          if (competitionResponse.ok) {
            const competitionData = await competitionResponse.json();
            setCompetition(competitionData);
          }
        }

        // Charger l'édition si en mode édition
        if (isEdit && editionId) {
          const editionResponse = await fetch(
            `/api/editions/${editionId}?with_relations=true`
          );
          if (editionResponse.ok) {
            const editionData = await editionResponse.json();
            setEdition(editionData);

            // Pré-remplir le formulaire
            reset({
              edition_number: editionData.edition_number,
              year: editionData.year,
              theme: editionData.theme || "",
              start_date: editionData.start_date
                ? new Date(editionData.start_date).toISOString().split("T")[0]
                : "",
              end_date: editionData.end_date
                ? new Date(editionData.end_date).toISOString().split("T")[0]
                : "",
              winner_fighter_id: editionData.winner_fighter_id || undefined,
            });

            // Utiliser les lutteurs et régions déjà inclus dans l'édition
            if (editionData.fighters) {
              setAvailableFighters(editionData.fighters);
            }
            if (editionData.regions) {
              setAvailableRegions(editionData.regions);
            }
          }
        } else {
          // En création, charger les lutteurs et régions disponibles
          const fightersResponse = await fetch(
            "/api/fighters?limit=100&is_active=true&with_region=true"
          );
          if (fightersResponse.ok) {
            const fightersData = await fightersResponse.json();
            setAvailableFighters(fightersData.data || []);
          }

          const regionsResponse = await fetch(
            "/api/regions?limit=100&with_fighters=true"
          );
          if (regionsResponse.ok) {
            const regionsData = await regionsResponse.json();
            setAvailableRegions(regionsData.data || []);
          }
        }
      } catch (error) {
        console.error("Erreur lors du chargement:", error);
        toast.error("Erreur lors du chargement des données");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [competitionId, editionId, isEdit, reset]);

  // Soumission du formulaire
  const onSubmit = async (data: EditionFormData) => {
    setSaving(true);
    try {
      const url = isEdit ? `/api/editions/${editionId}` : "/api/editions";

      const method = isEdit ? "PUT" : "POST";

      const payload = {
        ...data,
        competition_id: parseInt(competitionId),
        // Convertir les dates si présentes
        start_date: data.start_date || null,
        end_date: data.end_date || null,
        winner_fighter_id: data.winner_fighter_id || null,
      };

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const result = await response.json();

        toast.success(
          isEdit ? "Édition modifiée avec succès" : "Édition créée avec succès"
        );

        // Rediriger vers la page de détail
        const redirectUrl = isEdit
          ? `/ad/editions/${editionId}`
          : `/ad/competitions/${competitionId}`;

        router.push(redirectUrl);
      } else {
        const error = await response.json();
        throw new Error(error.message || "Erreur lors de la sauvegarde");
      }
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
      toast.error(
        error instanceof Error ? error.message : "Erreur lors de la sauvegarde"
      );
    } finally {
      setSaving(false);
    }
  };

  // Calculer le prochain numéro d'édition
  const getNextEditionNumber = () => {
    if (isEdit && edition) return edition.edition_number;

    // En création, trouver le plus grand numéro d'édition existant
    if (competition?.editions && competition.editions.length > 0) {
      const maxEdition = Math.max(
        ...competition.editions.map((e) => e.edition_number)
      );
      return maxEdition + 1;
    }

    return 1;
  };

  // Gestionnaire d'annulation
  const handleCancel = () => {
    if (isEdit) {
      router.push(`/ad/editions/${editionId}`);
    } else {
      router.push(`/ad/competitions/${competitionId}`);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-64" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-12" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-12" />
            <Skeleton className="h-32" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={handleCancel}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <div>
            <Typography variant="h5" weight="bold">
              {isEdit ? "Modifier l'Édition" : "Nouvelle Édition"}
            </Typography>
            <Typography variant="lead" theme="muted">
              {competition?.name || "Chargement..."}
            </Typography>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleCancel} disabled={saving}>
            Annuler
          </Button>
          <Button onClick={handleSubmit(onSubmit)} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Sauvegarde..." : "Sauvegarder"}
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Formulaire principal */}
          <div className="lg:col-span-2 space-y-4">
            {/* Informations de base */}
            <Card className="p-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Informations de l'Édition
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Numéro d'édition */}
                  {/* <div className="space-y-2">
                    <Label htmlFor="edition_number">Numéro d'édition *</Label>
                    <Input
                      id="edition_number"
                      type="number"
                      min="1"
                      {...register("edition_number", { valueAsNumber: true })}
                      defaultValue={getNextEditionNumber()}
                    />
                    {errors.edition_number && (
                      <Typography variant="caption2" theme="danger">
                        {errors.edition_number.message}
                      </Typography>
                    )}
                  </div> */}

                  {/* Thème */}
                  <div className="space-y-2">
                    <Label htmlFor="theme">Thème de l'édition</Label>
                    <Input
                      id="theme"
                      placeholder="Ex: Édition de la Renaissance, Lutte pour la Paix..."
                      {...register("theme")}
                    />
                    {errors.theme && (
                      <Typography variant="caption2" theme="danger">
                        {errors.theme.message}
                      </Typography>
                    )}
                  </div>

                  {/* Année */}
                  <div className="space-y-2">
                    <Label htmlFor="year">Année *</Label>
                    <Input
                      id="year"
                      type="number"
                      min="2000"
                      max="2100"
                      {...register("year", { valueAsNumber: true })}
                    />
                    {errors.year && (
                      <Typography variant="caption2" theme="danger">
                        {errors.year.message}
                      </Typography>
                    )}
                  </div>
                </div>

                {/* Période */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start_date">Date de début</Label>
                    <Input
                      id="start_date"
                      type="date"
                      {...register("start_date")}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="end_date">Date de fin</Label>
                    <Input
                      id="end_date"
                      type="date"
                      {...register("end_date")}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Vainqueur */}
            {isEdit && (
              <Card className="p-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5" />
                    Vainqueur de l'Édition
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Label htmlFor="winner_fighter_id">Lutteur vainqueur</Label>
                    <Select
                      onValueChange={(value) =>
                        setValue(
                          "winner_fighter_id",
                          value ? parseInt(value) : undefined
                        )
                      }
                      defaultValue={
                        watch("winner_fighter_id")?.toString() || ""
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un lutteur vainqueur" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Aucun vainqueur</SelectItem>
                        {availableFighters.map((fighter) => (
                          <SelectItem
                            key={fighter.id}
                            value={fighter.id.toString()}
                          >
                            {fighter.first_name} {fighter.last_name}
                            {fighter.nickname && ` "${fighter.nickname}"`}
                            {fighter.region && ` - ${fighter.region.name}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar - Informations et actions */}
          <div className="space-y-3">
            {/* Statut et résumé */}
            <Card className="p-3">
              <CardHeader>
                <CardTitle>Résumé</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Typography variant="body-sm" theme="muted" className="mb-1">
                    Compétition
                  </Typography>
                  <Typography variant="body-base" weight="medium">
                    {competition?.name}
                  </Typography>
                </div>
              </CardContent>
            </Card>

            {/* Actions rapides */}
            <Card className="p-3">
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button type="submit" className="w-full" disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? "Sauvegarde..." : "Sauvegarder l'édition"}
                </Button>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleCancel}
                  disabled={saving}
                >
                  Annuler
                </Button>

                {isEdit && (
                  <>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() =>
                        router.push(`/ad/editions/${editionId}/figthers`)
                      }
                    >
                      <Users className="h-4 w-4 mr-2" />
                      Gérer les lutteurs
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() =>
                        router.push(`/ad/editions/${editionId}/regions`)
                      }
                    >
                      <Users className="h-4 w-4 mr-2" />
                      Gérer les régions
                    </Button>

                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() =>
                        router.push(`/ad/editions/${editionId}/phases`)
                      }
                    >
                      <Trophy className="h-4 w-4 mr-2" />
                      Configurer les phases
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Aide */}
            <Card className="p-3">
              <CardHeader>
                <CardTitle>Conseils</CardTitle>
              </CardHeader>
              <CardContent>
                <Typography variant="body-sm" className="space-y-2">
                  <div>
                    • Le numéro d'édition doit être unique pour cette
                    compétition
                  </div>
                  <div>• L'année correspond à l'année de l'événement</div>
                  <div>• Le thème aide à identifier l'édition</div>
                  <div>• Le vainqueur peut être défini plus tard</div>
                </Typography>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
