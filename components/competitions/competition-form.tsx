"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ImageIcon } from "lucide-react";
import { AdvancedUpload } from "@/components/ui/advanced-upload";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Region {
  id: number;
  name: string;
  code?: string;
}

interface CompetitionFormData {
  id?: number;
  name: string;
  slug?: string;
  description?: string;
  status: string;
  featured_image?: string;
  is_active: boolean;
  region_id?: string;
}

interface CompetitionFormProps {
  competition?: CompetitionFormData; // Pour l'édition
  regionId?: string; // Region présélectionnée
  onSuccess?: () => void; // Callback après succès
}

const competitionStatuses = [
  { value: "upcoming", label: "À venir" },
  { value: "ongoing", label: "En cours" },
  { value: "completed", label: "Terminée" },
  { value: "cancelled", label: "Annulée" },
  { value: "postponed", label: "Reportée" },
];

export default function CompetitionForm({
  competition,
  regionId,
  onSuccess,
}: CompetitionFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState<CompetitionFormData>({
    name: "",
    slug: "",
    description: "",
    status: "upcoming",
    featured_image: "",
    is_active: true,
    region_id: regionId || "",
  });
  const [errors, setErrors] = useState<
    Partial<Record<keyof CompetitionFormData, string>>
  >({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [regionsData, setRegionsData] = useState<Region[]>([]);
  const [isLoadingRegions, setIsLoadingRegions] = useState(true);

  // Initialiser les données si on est en mode édition
  useEffect(() => {
    if (competition) {
      setFormData({
        ...competition,
        region_id: competition.region_id?.toString() || "",
      });
    }
  }, [competition]);

  // Charger les régions
  useEffect(() => {
    const loadRegions = async () => {
      try {
        const response = await fetch("/api/regions");
        const data = await response.json();
        setRegionsData(data.data || []);
      } catch (error) {
        console.error("Erreur lors du chargement des régions:", error);
      } finally {
        setIsLoadingRegions(false);
      }
    };

    loadRegions();
  }, []);

  // When a region is pre-selected via prop, set it in formData
  useEffect(() => {
    if (regionId) {
      setFormData((prev) => ({ ...prev, region_id: regionId }));
    }
  }, [regionId]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof CompetitionFormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof CompetitionFormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    try {
      const formDataToSend = new FormData();

      // Ajouter tous les champs au FormData
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== undefined && value !== "") {
          formDataToSend.append(key, value.toString());
        }
      });

      const url = competition
        ? `/api/competitions/${competition.id}`
        : "/api/competitions";
      const method = competition ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        body: formDataToSend,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            `Erreur lors de ${
              competition ? "la modification" : "la création"
            } de la compétition`
        );
      }

      if (result.success) {
        if (onSuccess) {
          onSuccess();
        } else {
          router.push(
            `/ad/competitions${competition ? `/${competition.id}` : ""}`
          );
        }
      } else {
        throw new Error(result.message || "Erreur inconnue");
      }
    } catch (error) {
      console.error("Erreur:", error);
      if (error instanceof Error) {
        alert(error.message);
      } else {
        alert(
          `Erreur lors de ${
            competition ? "la modification" : "la création"
          } de la compétition`
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="p-3">
      <CardHeader>
        <CardTitle>
          {competition ? "Modifier la Compétition" : "Créer une Compétition"}
        </CardTitle>
        <CardDescription>
          {competition
            ? "Modifiez les informations de la compétition"
            : "Créez une nouvelle compétition"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Image de couverture */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Image de couverture
            </label>
            <AdvancedUpload
              value={formData.featured_image || ""}
              onChange={(url) =>
                setFormData((prev) => ({ ...prev, featured_image: url }))
              }
              maxSizeMB={2}
              maxWidthOrHeight={1920}
              uploadPath="competitions"
              isRounded={false}
              showInternalSelection={true}
              internalImagesFolder="competitions"
              emptyPreview={
                <div className="text-center border-2 border-dashed border-gray-300 rounded-lg p-6">
                  <ImageIcon className="mx-auto h-10 w-10 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600">
                    Aucune image sélectionnée
                  </p>
                </div>
              }
            />
          </div>

          {/* Informations de base */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Nom */}
            <div className="md:col-span-2">
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Nom de la compétition <span className="text-red-500">*</span>
              </label>
              <Input
                id="name"
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={handleChange}
                placeholder="Ex: Coupe Nationale 2024"
                className={errors.name ? "border-red-500" : ""}
              />
              {errors.name && (
                <p className="text-red-500 text-sm mt-1">{errors.name}</p>
              )}
            </div>

            {/* Slug */}
            <div>
              <label
                htmlFor="slug"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Slug (URL)
              </label>
              <Input
                id="slug"
                name="slug"
                type="text"
                value={formData.slug || ""}
                onChange={handleChange}
                placeholder="ex: coupe-nationale-2024"
              />
              <p className="text-xs text-gray-500 mt-1">
                Identifiant unique pour l'URL. Laissé vide pour génération
                automatique.
              </p>
            </div>

            {/* Statut */}
            <div>
              <label
                htmlFor="status"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Statut <span className="text-red-500">*</span>
              </label>
              <Select
                value={formData.status}
                onValueChange={(value) => handleSelectChange("status", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un statut" />
                </SelectTrigger>
                <SelectContent>
                  {competitionStatuses.map((status) => (
                    <SelectItem
                      key={status.value}
                      value={status.value}
                      disabled={status.value === ""}
                    >
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Région */}
            {/* <div>
              <label
                htmlFor="region_id"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Région
              </label>
              <Select
                value={formData.region_id || ""}
                onValueChange={(value) =>
                  handleSelectChange("region_id", value)
                }
                disabled={isLoadingRegions}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une région" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="empty">Aucune région</SelectItem>
                  {regionsData.map((region) => (
                    <SelectItem key={region.id} value={String(region.id)}>
                      {region.name} {region.code ? `(${region.code})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {isLoadingRegions && (
                <p className="text-gray-500 text-sm mt-1">
                  Chargement des régions...
                </p>
              )}
            </div> */}

            {/* Statut actif */}
            <div className="flex items-center space-x-2">
              <input
                id="is_active"
                name="is_active"
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    is_active: e.target.checked,
                  }))
                }
                className="h-4 w-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
              />
              <label
                htmlFor="is_active"
                className="text-sm font-medium text-gray-700"
              >
                Compétition active
              </label>
            </div>
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Description
            </label>
            <Textarea
              id="description"
              name="description"
              value={formData.description || ""}
              onChange={handleChange}
              rows={4}
              placeholder="Description détaillée de la compétition..."
            />
          </div>

          {/* Information */}
          <Alert>
            <AlertDescription>
              {competition
                ? "Modifiez les informations de la compétition. Les changements seront visibles immédiatement."
                : "La compétition sera créée avec le statut 'À venir'. Vous pourrez ensuite ajouter des éditions, phases et matchs."}
            </AlertDescription>
          </Alert>

          {/* Boutons */}
          <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("ad/competitions")}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {isSubmitting
                ? `${competition ? "Modification..." : "Création..."}`
                : `${
                    competition
                      ? "Modifier la compétition"
                      : "Créer la compétition"
                  }`}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
