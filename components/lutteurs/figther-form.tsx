"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AdvancedUpload } from "../ui/advanced-upload";
import { ImageIcon } from "lucide-react";
import { Region } from "@/types";
import { getRegionById } from "@/actions/regions";
import { toast } from "sonner";

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
  region?: Region; // Region présélectionnée (priorité 1)
  onSuccess?: () => void; // Callback après succès
}

export default function FighterForm({
  fighter,
  region,
  onSuccess,
}: FighterFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Priorité : 1. Props region, 2. Paramètre URL, 3. undefined
  const regionIdFromProps = region?.id;
  const regionIdFromUrl = searchParams?.get("regionId")
    ? Number(searchParams.get("regionId"))
    : undefined;
  console.log(regionIdFromProps, regionIdFromUrl)

  const [formData, setFormData] = useState<FighterFormData>({
    first_name: "",
    last_name: "",
    nickname: "",
    birth_date: "",
    birth_place: "",
    region_id: regionIdFromProps || regionIdFromUrl || undefined,
    height: 1.7,
    weight: 80,
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
  const [preselectedRegion, setPreselectedRegion] = useState<Region | null>(region || null);

  // Initialiser les données si on est en mode édition
  useEffect(() => {
    if (fighter) {
      setFormData({
        ...fighter,
        birth_date: fighter.birth_date ? fighter.birth_date.split("T")[0] : "", // Format pour input date
      });

      // Si on édite un lutteur, la région présélectionnée est celle du lutteur
      if (fighter.region_id) {
        setPreselectedRegion(null); // On ne force pas la région via props en mode édition
      }
    }
  }, [fighter]);

  // Charger les régions
  useEffect(() => {
    async function loadRegions() {
      try {
        setLoadingRegions(true);
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

  // Mettre à jour le formulaire quand la région présélectionnée change
  useEffect(() => {
    if (preselectedRegion?.id && !fighter) {
      setFormData((prev) => ({ ...prev, region_id: preselectedRegion.id }));
    }
  }, [preselectedRegion, fighter]);

  // Charger les informations de la région présélectionnée depuis l'URL si elle n'est pas fournie en props
  useEffect(() => {
    async function loadPreselectedRegion() {
      if (regionIdFromUrl && !region && !fighter) {
        try {
          // Appel de l'action côté serveur au lieu de l'API
          const regionData = await getRegionById(regionIdFromUrl, { with_relations: false });
          setPreselectedRegion(regionData);
        } catch (error) {
          console.error("Erreur lors du chargement de la région présélectionnée:", error);
        }
      }
    }

    if (regionIdFromUrl && !region && !fighter) {
      loadPreselectedRegion();
    }
  }, [regionIdFromUrl, region, fighter]);

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

      let result;
      if (fighter) {
        // Update existing fighter
        const { updateFighter } = await import("@/actions/fighters");
        if (!fighter.id) throw new Error("Fighter ID is missing");
        result = await updateFighter(fighter.id, formDataToSend);
      } else {
        // Create new fighter
        const { createFighter } = await import("@/actions/fighters");
        const rawData: Record<string, any> = {};
        formDataToSend.forEach((value, key) => {
          rawData[key] = value;
        });
        result = await createFighter(rawData);
      }

      if (onSuccess) {
        onSuccess();
      } else {
        // Redirect to region or back
        toast.success(`Lutteur ${fighter ? "modifié" : "créé"} avec succès`);
        router.back();
      }
    } catch (error: any) {
      console.error("Erreur:", error);

      // Handle validation errors from actions
      if (error.message?.includes("Veuillez corriger les erreurs du formulaire")) {
        // Validation errors already set in state, do nothing
      } else if (error.message) {
        // Show toast for other errors
        toast.error(error.message);
      } else {
        toast.error(
          `Erreur lors de ${fighter ? "la modification" : "la création"
          } du lutteur`
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Trouver le nom de la région présélectionnée pour l'afficher
  const getPreselectedRegionName = () => {
    if (preselectedRegion) {
      return preselectedRegion.name;
    }
    if (regionIdFromProps) {
      const found = regions.find(r => r.id === regionIdFromProps);
      return found?.name;
    }
    return null;
  };

  const preselectedRegionName = getPreselectedRegionName();

  return (
    <div className="max-w-5xl mx-auto bg-white p-4 rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-4">
        {fighter ? "Modifier le Lutteur" : "Ajouter un Lutteur"}
        {preselectedRegionName && !fighter && (
          <span className="text-sm font-normal text-gray-500 ml-2">
            pour la région {preselectedRegionName}
          </span>
        )}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Section des images */}
        <div className="relative w-full mb-10">
          {/* Photo de profil */}
          <div className="absolute left-10 -bottom-10 z-20">
            <AdvancedUpload
              value={formData.profile_image || ""}
              onChange={(url) =>
                setFormData((prev) => ({ ...prev, profile_image: url }))
              }
              maxSizeMB={2}
              uploadPath="fighters/profiles"
              isRounded
              maxWidthOrHeight={200}
              emptyPreview={
                <div className="text-center text-muted-foreground p-4 bg-gray-100 rounded-full w-32 h-32 flex items-center justify-center">
                  <ImageIcon className="h-10 w-10" />
                </div>
              }
            />
          </div>

          {/* Image de couverture */}
          <div className="w-full h-48 bg-gray-100 rounded-lg overflow-hidden">
            {formData.cover_image ? (
              <img
                src={formData.cover_image}
                alt="Couverture"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
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
                      <p className="text-sm">Ajouter une image de couverture</p>
                    </div>
                  }
                />
              </div>
            )}
          </div>
        </div>

        {/* Informations de base */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-16">
          {/* Prénom */}
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
              className={`w-full border rounded px-3 py-2 ${errors.first_name ? "border-red-500" : "border-gray-300"
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
              className={`w-full border rounded px-3 py-2 ${errors.last_name ? "border-red-500" : "border-gray-300"
                }`}
              placeholder="Nom du lutteur"
            />
            {errors.last_name && (
              <p className="text-red-500 text-sm mt-1">{errors.last_name}</p>
            )}
          </div>
        </div>

        {/* Surnom et Région */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Surnom */}
          <div>
            <label
              htmlFor="nickname"
              className="block text-sm font-medium mb-1"
            >
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

          {/* Région */}
          <div>
            <label
              htmlFor="region_id"
              className="block text-sm font-medium mb-1"
            >
              Région {!fighter && preselectedRegion ? (
                <span className="text-blue-600 text-xs ml-2">
                  (Présélectionnée)
                </span>
              ) : (
                <span className="text-red-500">*</span>
              )}
            </label>
            <select
              id="region_id"
              name="region_id"
              value={formData.region_id || ""}
              onChange={handleChange}
              className={`w-full border rounded px-3 py-2 ${errors.region_id ? "border-red-500" : "border-gray-300"
                }`}
              disabled={loadingRegions || (!!preselectedRegion && !fighter)}
            >
              <option value="">Sélectionnez une région</option>
              {regions.map((region) => (
                <option
                  key={region.id}
                  value={region.id}
                  className={region.id === preselectedRegion?.id ? "bg-blue-50" : ""}
                >
                  {region.name} {region.code ? `(${region.code})` : ""}
                  {region.id === preselectedRegion?.id && " ✓"}
                </option>
              ))}
            </select>
            {loadingRegions && (
              <p className="text-gray-500 text-sm mt-1">
                Chargement des régions...
              </p>
            )}
            {errors.region_id && (
              <p className="text-red-500 text-sm mt-1">{errors.region_id}</p>
            )}
            {preselectedRegion && !fighter && (
              <p className="text-blue-600 text-xs mt-1">
                Région verrouillée pour ce formulaire
              </p>
            )}
          </div>
        </div>

        {/* Date et lieu de naissance */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

        {/* Taille et Poids */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

        {/* Année de début, Classement, Style */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
              placeholder="Ex: Lutte traditionnelle, combat au sol..."
            />
          </div>
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
            placeholder="Biographie du lutteur, parcours, palmarès..."
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
              className="h-6 w-6 text-primary border-gray-300 rounded"
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
              className="h-6 w-6 text-primary border-gray-300 rounded"
            />
            <label
              htmlFor="is_champion"
              className="ml-2 block text-sm text-gray-900"
            >
              Champion en titre
            </label>
          </div>
        </div>

        {/* Boutons */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <button
            type="button"
            onClick={() => {
              if (formData.region_id && !fighter) {
                router.push(`/regions/${formData.region_id}?tab=fighters`);
              } else {
                router.back();
              }
            }}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {fighter ? "Modification..." : "Création..."}
              </>
            ) : (
              fighter ? "Modifier le lutteur" : "Créer le lutteur"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}