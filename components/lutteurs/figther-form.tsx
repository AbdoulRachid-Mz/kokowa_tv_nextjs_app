"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AdvancedUpload } from "../ui/advanced-upload";
import { ImageIcon } from "lucide-react";

interface Region {
  id: number;
  name: string;
  code?: string;
}

interface FighterFormData {
  id?: number;
  first_name: string;
  last_name: string;
  nickname?: string;
  birth_date?: string;
  birth_place?: string;
  region_id?: number;
  height?: number;
  weight?: number;
  profile_image?: string;
  cover_image?: string;
  bio?: string;
  fighting_style?: string;
  debut_year?: number;
  ranking?: number;
  is_active: boolean;
  is_champion: boolean;
}

interface FighterFormProps {
  fighter?: FighterFormData; // Pour l'édition
  region?: Region; // Region présélectionnée
  onSuccess?: () => void; // Callback après succès
}

export default function FighterForm({
  fighter,
  region,
  onSuccess,
}: FighterFormProps) {
  const router = useRouter();
  const regionId = region?.id;
  const [formData, setFormData] = useState<FighterFormData>({
    first_name: "",
    last_name: "",
    nickname: "",
    birth_date: "",
    birth_place: "",
    region_id: regionId ? Number(regionId) : undefined,
    height: undefined,
    weight: undefined,
    profile_image: "",
    cover_image: "",
    bio: "",
    fighting_style: "",
    debut_year: undefined,
    ranking: undefined,
    is_active: true,
    is_champion: false,
  });
  const [regions, setRegions] = useState<Region[]>([]);
  const [errors, setErrors] = useState<
    Partial<Record<keyof FighterFormData, string>>
  >({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingRegions, setLoadingRegions] = useState(true);

  // Initialiser les données si on est en mode édition
  useEffect(() => {
    if (fighter) {
      setFormData({
        ...fighter,
        birth_date: fighter.birth_date ? fighter.birth_date.split("T")[0] : "", // Format pour input date
      });
    }
  }, [fighter]);

  // Charger les régions
  useEffect(() => {
    async function loadRegions() {
      try {
        const response = await fetch("/api/regions");
        if (response.ok) {
          const result = await response.json();
          if (result.data) {
            setRegions(result.data);
          } else if (Array.isArray(result)) {
            setRegions(result);
          }
        }
      } catch (error) {
        console.error("Erreur lors du chargement des régions:", error);
      } finally {
        setLoadingRegions(false);
      }
    }
    loadRegions();
  }, []);

  // When a region is pre-selected via query param, set it in formData
  useEffect(() => {
    if (regionId) {
      setFormData((prev) => ({ ...prev, region_id: Number(regionId) }));
    }
  }, [regionId]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value, type } = e.target;

    let processedValue: any = value;

    if (type === "number") {
      processedValue = value === "" ? undefined : Number(value);
    } else if (name === "region_id") {
      processedValue = value === "" ? undefined : Number(value);
    } else if (name === "is_active" || name === "is_champion") {
      processedValue = (e.target as HTMLInputElement).checked;
    }

    setFormData((prev) => ({ ...prev, [name]: processedValue }));

    // Effacer l'erreur du champ modifié
    if (errors[name as keyof FighterFormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    try {
      const formDataToSend = new FormData();

      // Champs obligatoires
      formDataToSend.append("first_name", formData.first_name);
      formDataToSend.append("last_name", formData.last_name);

      // Champs optionnels
      if (formData.nickname)
        formDataToSend.append("nickname", formData.nickname);
      if (formData.birth_date)
        formDataToSend.append("birth_date", formData.birth_date);
      if (formData.birth_place)
        formDataToSend.append("birth_place", formData.birth_place);
      if (formData.region_id)
        formDataToSend.append("region_id", formData.region_id.toString());
      if (formData.height)
        formDataToSend.append("height", formData.height.toString());
      if (formData.weight)
        formDataToSend.append("weight", formData.weight.toString());
      if (formData.profile_image)
        formDataToSend.append("profile_image", formData.profile_image);
      if (formData.cover_image)
        formDataToSend.append("cover_image", formData.cover_image);
      if (formData.bio) formDataToSend.append("bio", formData.bio);
      if (formData.fighting_style)
        formDataToSend.append("fighting_style", formData.fighting_style);
      if (formData.debut_year)
        formDataToSend.append("debut_year", formData.debut_year.toString());
      if (formData.ranking)
        formDataToSend.append("ranking", formData.ranking.toString());

      formDataToSend.append("is_active", formData.is_active.toString());
      formDataToSend.append("is_champion", formData.is_champion.toString());

      const url = fighter ? `/api/fighters/${fighter.id}` : "/api/fighters";
      const method = fighter ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        body: formDataToSend,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            `Erreur lors de ${
              fighter ? "la modification" : "la création"
            } du lutteur`
        );
      }

      if (result.success) {
        if (onSuccess) {
          onSuccess();
        } else {
          router.push("/fighters");
        }
      } else {
        throw new Error(result.message || "Erreur inconnue");
      }
    } catch (error) {
      console.error("Erreur:", error);
      alert(
        error instanceof Error
          ? error.message
          : `Erreur lors de ${
              fighter ? "la modification" : "la création"
            } du lutteur`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6">
        {fighter ? "Modifier le Lutteur" : "Ajouter un Lutteur"}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="relative w-full mb-10">
         {/* Photo de profil */}
          <div className="">
            <AdvancedUpload
              value={formData.profile_image || ""}
              onChange={(url) =>
                setFormData((prev) => ({ ...prev, profile_image: url }))
              }
              maxSizeMB={2}
              uploadPath="fighters/profiles"
              isRounded
              maxWidthOrHeight={200}
              className="absolute left-10 -bottom-10 z-20 shadow-md rounded-full"
            //   emptyPreview={
            //     <div className="text-center text-muted-foreground">
            //       <ImageIcon className="h-10 w-10 mx-auto mb-2" />
            //       <p className="text-sm">Photo de profil</p>
            //     </div>
            //   }
            />
          </div>
          {/* Image de couverture */}
          <div className="">
            <label
              htmlFor="cover_image"
              className="block text-sm font-medium mb-1"
            >
              Image de couverture
            </label>
            <AdvancedUpload
              value={formData.cover_image || ""}
              onChange={(url) =>
                setFormData((prev) => ({ ...prev, cover_image: url }))
              }
              maxSizeMB={5}
              uploadPath="fighters/covers"
              showInternalSelection
              internalImagesFolder="fighters/covers"
              emptyPreview={
                <div className="text-center text-muted-foreground">
                  <ImageIcon className="h-10 w-10 mx-auto mb-2" />
                  <p className="text-sm">Image de couverture</p>
                </div>
              }
            />
          </div>
          {/* Prénom */}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label
              htmlFor="first_name"
              className="block text-sm font-medium mb-1"
            >
              Prénom <span className="text-red-500">*</span>
            </label>
            <input
              id="first_name"
              name="first_name"
              type="text"
              required
              value={formData.first_name}
              onChange={handleChange}
              className={`w-full border rounded px-3 py-2 ${
                errors.first_name ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Prénom du lutteur"
            />
            {errors.first_name && (
              <p className="text-red-500 text-sm mt-1">{errors.first_name}</p>
            )}
          </div>

          {/* Nom */}
          <div>
            <label
              htmlFor="last_name"
              className="block text-sm font-medium mb-1"
            >
              Nom <span className="text-red-500">*</span>
            </label>
            <input
              id="last_name"
              name="last_name"
              type="text"
              required
              value={formData.last_name}
              onChange={handleChange}
              className={`w-full border rounded px-3 py-2 ${
                errors.last_name ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Nom du lutteur"
            />
            {errors.last_name && (
              <p className="text-red-500 text-sm mt-1">{errors.last_name}</p>
            )}
          </div>
        </div>

        {/* Surnom */}
        <div>
          <label htmlFor="nickname" className="block text-sm font-medium mb-1">
            Surnom
          </label>
          <input
            id="nickname"
            name="nickname"
            type="text"
            value={formData.nickname || ""}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded px-3 py-2"
            placeholder="Surnom (optionnel)"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Date de naissance */}
          <div>
            <label
              htmlFor="birth_date"
              className="block text-sm font-medium mb-1"
            >
              Date de naissance
            </label>
            <input
              id="birth_date"
              name="birth_date"
              type="date"
              value={formData.birth_date || ""}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded px-3 py-2"
            />
          </div>

          {/* Lieu de naissance */}
          <div>
            <label
              htmlFor="birth_place"
              className="block text-sm font-medium mb-1"
            >
              Lieu de naissance
            </label>
            <input
              id="birth_place"
              name="birth_place"
              type="text"
              value={formData.birth_place || ""}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded px-3 py-2"
              placeholder="Ville de naissance"
            />
          </div>
        </div>

        {/* Région */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label
              htmlFor="region_id"
              className="block text-sm font-medium mb-1"
            >
              Région
            </label>
            <select
              id="region_id"
              name="region_id"
              value={formData.region_id || ""}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded px-3 py-2"
              disabled={loadingRegions}
            >
              <option value="">Sélectionnez une région</option>
              {regions.map((region) => (
                <option key={region.id} value={region.id}>
                  {region.name} {region.code ? `(${region.code})` : ""}
                </option>
              ))}
            </select>
            {loadingRegions && (
              <p className="text-gray-500 text-sm mt-1">
                Chargement des régions...
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Taille */}
          <div>
            <label htmlFor="height" className="block text-sm font-medium mb-1">
              Taille (m)
            </label>
            <input
              id="height"
              name="height"
              type="number"
              min="0.5"
              max="3.0"
              step="0.01"
              value={formData.height || ""}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded px-3 py-2"
              placeholder="1.75"
            />
          </div>

          {/* Poids */}
          <div>
            <label htmlFor="weight" className="block text-sm font-medium mb-1">
              Poids (kg)
            </label>
            <input
              id="weight"
              name="weight"
              type="number"
              min="20"
              max="200"
              step="0.1"
              value={formData.weight || ""}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded px-3 py-2"
              placeholder="85.5"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Année de début */}
          <div>
            <label
              htmlFor="debut_year"
              className="block text-sm font-medium mb-1"
            >
              Année de début
            </label>
            <input
              id="debut_year"
              name="debut_year"
              type="number"
              min="1900"
              max={new Date().getFullYear()}
              value={formData.debut_year || ""}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded px-3 py-2"
              placeholder="2010"
            />
          </div>

          {/* Classement */}
          <div>
            <label htmlFor="ranking" className="block text-sm font-medium mb-1">
              Classement
            </label>
            <input
              id="ranking"
              name="ranking"
              type="number"
              min="0"
              value={formData.ranking || ""}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded px-3 py-2"
              placeholder="Position dans le classement"
            />
          </div>
        </div>

        {/* Style de combat */}
        <div>
          <label
            htmlFor="fighting_style"
            className="block text-sm font-medium mb-1"
          >
            Style de combat
          </label>
          <input
            id="fighting_style"
            name="fighting_style"
            type="text"
            value={formData.fighting_style || ""}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded px-3 py-2"
            placeholder="Description du style de combat"
          />
        </div>
        {/* Biographie */}
        <div>
          <label htmlFor="bio" className="block text-sm font-medium mb-1">
            Biographie
          </label>
          <textarea
            id="bio"
            name="bio"
            value={formData.bio || ""}
            onChange={handleChange}
            rows={4}
            className="w-full border border-gray-300 rounded px-3 py-2"
            placeholder="Biographie du lutteur..."
          />
        </div>

        {/* Checkboxes */}
        <div className="flex gap-6">
          <div className="flex items-center">
            <input
              id="is_active"
              name="is_active"
              type="checkbox"
              checked={formData.is_active}
              onChange={handleChange}
              className="h-4 w-4 text-orange-600 border-gray-300 rounded"
            />
            <label
              htmlFor="is_active"
              className="ml-2 block text-sm text-gray-900"
            >
              Lutteur actif
            </label>
          </div>

          <div className="flex items-center">
            <input
              id="is_champion"
              name="is_champion"
              type="checkbox"
              checked={formData.is_champion}
              onChange={handleChange}
              className="h-4 w-4 text-orange-600 border-gray-300 rounded"
            />
            <label
              htmlFor="is_champion"
              className="ml-2 block text-sm text-gray-900"
            >
              Champion
            </label>
          </div>
        </div>

        {/* Boutons */}
        <div className="flex justify-end gap-3 pt-6 border-t">
          <button
            type="button"
            onClick={() => router.push("/lutteurs")}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 transition-colors"
          >
            {isSubmitting
              ? `${fighter ? "Modification..." : "Création..."}`
              : `${fighter ? "Modifier le lutteur" : "Créer le lutteur"}`}
          </button>
        </div>
      </form>
    </div>
  );
}
