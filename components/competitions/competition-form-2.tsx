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

interface CompetitionFormData {
  id?: number;
  name: string;
  slug?: string;
  description?: string;
  status: string;
  featured_image?: string;
  is_active: boolean;
}

interface CompetitionFormProps {
  competition?: CompetitionFormData; // Pour l'édition
  regionId?: string; // Region présélectionnée
  onSuccess?: () => void; // Callback après succès
  withEdition?: boolean; // Option pour créer une édition automatiquement
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
  onSuccess,
  withEdition = false, // Par défaut pas d'édition automatique
}: CompetitionFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState<CompetitionFormData>({
    name: "",
    slug: "",
    description: "",
    status: "upcoming",
    featured_image: "",
    is_active: true,
  });
  const [errors, setErrors] = useState<
    Partial<Record<keyof CompetitionFormData, string>>
  >({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createWithEdition, setCreateWithEdition] = useState(withEdition);

  // Initialiser les données si on est en mode édition
  useEffect(() => {
    if (competition) {
      setFormData({
        ...competition,
      });
    }
  }, [competition]);

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
    // Validation simple côté client
    if (!formData.name.trim()) {
      setErrors({ name: 'Le nom est requis' });
      setIsSubmitting(false);
      return;
    }

    // Créer un FormData pour l'envoi
    const formDataToSend = new FormData();

    // Ajouter tous les champs au FormData
    Object.entries(formData).forEach(([key, value]) => {
      if (value !== undefined && value !== "") {
        formDataToSend.append(key, value?.toString());
      }
    });

    const url = competition
      ? `/api/competitions/${competition.id}`
      : "/api/competitions";
    const method = competition ? "PUT" : "POST";

    // Ajouter un paramètre pour indiquer si on veut créer avec édition
    if (!competition && createWithEdition) {
      formDataToSend.append("with_edition", "true");
    }

    const response = await fetch(url, {
      method,
      body: formDataToSend,
    });

    const result = await response.json();

    if (!response.ok) {
      // Gestion spécifique des erreurs de nom dupliqué
      if (response.status === 409 || result.error?.includes('existe déjà')) {
        setErrors({ name: 'Une compétition avec ce nom existe déjà' });
        alert('Une compétition avec ce nom existe déjà');
      } else {
        throw new Error(
          result.error ||
            `Erreur lors de ${
              competition ? "la modification" : "la création"
            } de la compétition`
        );
      }
      return;
    }

    if (result.success) {
      // Afficher un message de succès avec éventuellement un avertissement
      if (result.warning) {
        alert(`${result.message}\n\nNote: ${result.warning}`);
      } else {
        alert(result.message);
      }
      
      if (onSuccess) {
        onSuccess();
      } else {
        router.push(
          competition
            ? `/ad/competitions/${competition.id}`
            : `/ad/competitions`
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
            : "Créez une nouvelle compétition sans édition automatique"}
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Nom */}
            <div className="">
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
            {competition && (
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
            )}
          </div>

          {/* Option création avec édition (seulement en mode création) */}
          {/* {!competition && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <input
                  id="create_with_edition"
                  type="checkbox"
                  checked={createWithEdition}
                  onChange={(e) => setCreateWithEdition(e.target.checked)}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <div>
                  <label
                    htmlFor="create_with_edition"
                    className="text-sm font-medium text-gray-700"
                  >
                    Créer automatiquement une première édition
                  </label>
                  <p className="text-xs text-gray-500 mt-1">
                    Si coché, une édition sera créée automatiquement avec le numéro 1 et l'année en cours.
                    Sinon, vous devrez créer manuellement une édition plus tard.
                  </p>
                </div>
              </div>
            </div>
          )} */}

          {competition && (
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
          )}

          {/* Statut actif */}

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
          {/* <Alert>
            <AlertDescription>
              {competition
                ? "Modifiez les informations de la compétition. Les changements seront visibles immédiatement."
                : createWithEdition
                ? "La compétition sera créée avec une première édition automatique. Vous pourrez ensuite ajouter des phases et matchs."
                : "La compétition sera créée sans édition. Vous devrez créer manuellement une édition pour pouvoir ajouter des phases et matchs."}
            </AlertDescription>
          </Alert> */}

          {/* Boutons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/ad/competitions")}
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
