"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createCompetition } from "@/actions/competitions";
import { ImageIcon } from "lucide-react";
import { AdvancedUpload } from "@/components/ui/advanced-upload";
import { Region } from "@/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type CompetitionFormData = {
  name: string;
  description?: string;
  type: string;
  location?: string;
  region_id?: string;
  featured_image?: string;
  registration_deadline?: string;
  max_participants?: string;
  prize_pool?: string;
};

const competitionTypes = [
  { value: "sabre_national", label: "Sabre National" },
  { value: "coupe_regionale", label: "Coupe Régionale" },
  { value: "halarou_bakwai", label: "Halarou Bakwai" },
  { value: "aes", label: "AES" },
  { value: "friendly", label: "Amical" },
  { value: "ministre", label: "Ministre" },
  { value: "coupe_airtel", label: "Coupe Airtel" },
  { value: "other", label: "Autre" },
];

export default function CreateCompetitionPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<CompetitionFormData>({
    name: "",
    description: "",
    type: "sabre_national",
    location: "",
    region_id: "",
    featured_image: "",
    registration_deadline: "",
    max_participants: "",
    prize_pool: "",
  });
  const [errors, setErrors] = useState<
    Partial<Record<keyof CompetitionFormData, string>>
  >({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [regionsData, setRegionsData] = useState<Region[]>([]);
  const [isLoadingRegions, setIsLoadingRegions] = useState(true);

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

  if (isLoadingRegions) {
    return <div>Chargement des régions...</div>;
  }

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
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
          formDataToSend.append(key, value);
        }
      });

      const result = await createCompetition(formDataToSend, {
        with_edition: true,
      });

      if (!result.success) {
        throw new Error(result.message || "Erreur lors de la création");
      }

      // Redirection vers la page de détail de la compétition créée
      router.push(`/competitions/${result.id}`);
    } catch (error) {
      console.error("Erreur création:", error);
      if (error instanceof Error) {
        alert(error.message);
      } else {
        alert("Erreur lors de la création de la compétition");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Créer une compétition
        </h1>
        <p className="text-gray-600 mt-2">
          Créez une nouvelle compétition avec son édition automatique
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-6 bg-white p-6 rounded-lg shadow-md"
      >
        {/* Informations de base */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Image */}
          <div>
            <label
              htmlFor="featured_image"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
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
                <div className="text-center">
                  <ImageIcon className="mx-auto h-10 w-10 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600">
                    Aucune image sélectionnée
                  </p>
                </div>
              }
            />
          </div>
          {/* Nom */}
          <div className="md:col-span-2">
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Nom de la compétition <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              value={formData.name}
              onChange={handleChange}
              className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                errors.name ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Ex: Coupe Nationale 2024"
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name}</p>
            )}
          </div>

          {/* Type */}
          <div>
            <label
              htmlFor="type"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Type de compétition <span className="text-red-500">*</span>
            </label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              {competitionTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Lieu */}
          <div>
            <label
              htmlFor="location"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Lieu
            </label>
            <input
              id="location"
              name="location"
              type="text"
              value={formData.location}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="Ex: Stade National, Niamey"
            />
          </div>

          {/* Région */}
          <div>
            <label
              htmlFor="region_id"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Région
            </label>
            <Select
              value={formData.region_id}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, region_id: value }))
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Sélectionner une région" />
              </SelectTrigger>
              <SelectContent>
                {regionsData.map((region) => (
                  <SelectItem key={region.id} value={String(region.id)}>
                    {region.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date limite d'inscription */}
          <div>
            <label
              htmlFor="registration_deadline"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Date limite d'inscription
            </label>
            <input
              id="registration_deadline"
              name="registration_deadline"
              type="date"
              value={formData.registration_deadline}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          {/* Participants maximum */}
          <div>
            <label
              htmlFor="max_participants"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Participants maximum
            </label>
            <input
              id="max_participants"
              name="max_participants"
              type="number"
              value={formData.max_participants}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="Ex: 64"
            />
          </div>
        {/* Prix */}
        <div>
          <label
            htmlFor="prize_pool"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Prix total (FCFA)
          </label>
          <input
            id="prize_pool"
            name="prize_pool"
            type="number"
            step="0.01"
            value={formData.prize_pool}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
            placeholder="Ex: 5000000"
          />
        </div>
        </div>


        {/* Description */}
        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={4}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
            placeholder="Description détaillée de la compétition..."
          />
        </div>

        {/* Informations */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-blue-800 font-semibold mb-2">ℹ️ Information</h3>
          <p className="text-blue-700 text-sm">
            Une édition automatique sera créée avec cette compétition. Vous
            pourrez ensuite ajouter des phases, groupes et matchs depuis la page
            de détail.
          </p>
        </div>

        {/* Boutons */}
        <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={() => router.push("/competitions")}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 transition-colors font-semibold"
          >
            {isSubmitting ? "Création..." : "Créer la compétition"}
          </button>
        </div>
      </form>
    </div>
  );
}
