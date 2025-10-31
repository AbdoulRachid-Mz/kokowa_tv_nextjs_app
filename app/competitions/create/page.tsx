"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createCompetition } from "@/actions/competitions";

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
  { value: "other", label: "Autre" }
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
    prize_pool: ""
  });
  const [errors, setErrors] = useState<Partial<Record<keyof CompetitionFormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name as keyof CompetitionFormData]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
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

      const result = await createCompetition(formDataToSend, { with_edition: true });

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
        <h1 className="text-3xl font-bold text-gray-900">Créer une compétition</h1>
        <p className="text-gray-600 mt-2">
          Créez une nouvelle compétition avec son édition automatique
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow-md">
        {/* Informations de base */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Nom */}
          <div className="md:col-span-2">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
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
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
          </div>

          {/* Type */}
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
              Type de compétition <span className="text-red-500">*</span>
            </label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              {competitionTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Lieu */}
          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
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
            <label htmlFor="region_id" className="block text-sm font-medium text-gray-700 mb-1">
              Région
            </label>
            <input
              id="region_id"
              name="region_id"
              type="number"
              value={formData.region_id}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="ID de la région"
            />
          </div>

          {/* Date limite d'inscription */}
          <div>
            <label htmlFor="registration_deadline" className="block text-sm font-medium text-gray-700 mb-1">
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
            <label htmlFor="max_participants" className="block text-sm font-medium text-gray-700 mb-1">
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
        </div>

        {/* Prix */}
        <div>
          <label htmlFor="prize_pool" className="block text-sm font-medium text-gray-700 mb-1">
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

        {/* Image */}
        <div>
          <label htmlFor="featured_image" className="block text-sm font-medium text-gray-700 mb-1">
            URL de l'image
          </label>
          <input
            id="featured_image"
            name="featured_image"
            type="url"
            value={formData.featured_image}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
            placeholder="https://example.com/image.jpg"
          />
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
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
            Une édition automatique sera créée avec cette compétition. Vous pourrez ensuite 
            ajouter des phases, groupes et matchs depuis la page de détail.
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