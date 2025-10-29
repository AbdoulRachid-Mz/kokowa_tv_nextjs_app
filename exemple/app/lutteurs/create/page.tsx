"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { lutteurSchema } from "@/validation/schemas";

type Region = {
  id: number;
  name: string;
  code?: string;
};

type LutteurFormData = {
  nom: string;
  surnom?: string;
  date_naissance?: string; // Changé en string pour le formulaire
  region_id?: number;
  poids?: number;
  actif: boolean;
  photo_url?: string;
};

export default function CreateLutteurPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<LutteurFormData>({
    nom: "",
    surnom: "",
    date_naissance: "",
    region_id: undefined,
    poids: undefined,
    actif: true,
    photo_url: "",
  });
  const [regions, setRegions] = useState<Region[]>([]);
  const [errors, setErrors] = useState<Partial<Record<keyof LutteurFormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingRegions, setLoadingRegions] = useState(true);

  // Charger les régions
  useEffect(() => {
    async function loadRegions() {
      try {
        const response = await fetch('/api/regions');
        if (response.ok) {
          const result = await response.json();
          if (result.data) {
            setRegions(result.data);
          } else {
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    let processedValue: any = value;
    
    if (type === 'number') {
      processedValue = value === '' ? undefined : Number(value);
    } else if (name === 'region_id') {
      processedValue = value === '' ? undefined : Number(value);
    } else if (name === 'actif') {
      processedValue = (e.target as HTMLInputElement).checked;
    }
    
    setFormData(prev => ({ ...prev, [name]: processedValue }));
    
    // Effacer l'erreur du champ modifié
    if (errors[name as keyof LutteurFormData]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    try {
      // Préparer les données pour la validation
      const validationData = {
        ...formData,
        // La validation Zod va transformer la string en Date si nécessaire
      };

      // Validation côté client
      lutteurSchema.parse(validationData);

      const formDataToSend = new FormData();
      formDataToSend.append('nom', formData.nom);
      if (formData.surnom) formDataToSend.append('surnom', formData.surnom);
      if (formData.date_naissance) formDataToSend.append('date_naissance', formData.date_naissance);
      if (formData.region_id) formDataToSend.append('region_id', formData.region_id.toString());
      if (formData.poids) formDataToSend.append('poids', formData.poids.toString());
      formDataToSend.append('actif', formData.actif.toString());
      if (formData.photo_url) formDataToSend.append('photo_url', formData.photo_url);

      const response = await fetch('/api/lutteurs', {
        method: 'POST',
        body: formDataToSend,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erreur lors de la création du lutteur');
      }

      if (result.success) {
        router.push('/lutteurs');
      } else {
        throw new Error(result.error || 'Erreur inconnue');
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Partial<Record<keyof LutteurFormData, string>> = {};
        error.errors.forEach(err => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as keyof LutteurFormData] = err.message;
          }
        });
        setErrors(fieldErrors);
      } else {
        alert(error instanceof Error ? error.message : 'Erreur lors de la création du lutteur');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-orange-600">Kokowa TV</h1>
            <nav className="flex gap-6">
              <a href="/" className="text-gray-700 hover:text-orange-600 font-medium">
                Accueil
              </a>
              <a href="/lutteurs" className="text-orange-600 font-medium border-b-2 border-orange-600">
                Lutteurs
              </a>
              <a href="/competitions" className="text-gray-700 hover:text-orange-600 font-medium">
                Compétitions
              </a>
            </nav>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow-md">
          <h1 className="text-2xl font-bold mb-6">Ajouter un Lutteur</h1>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Nom */}
            <div>
              <label htmlFor="nom" className="block text-sm font-medium mb-1">
                Nom <span className="text-red-500">*</span>
              </label>
              <input
                id="nom"
                name="nom"
                type="text"
                value={formData.nom}
                onChange={handleChange}
                className={`w-full border rounded px-3 py-2 ${
                  errors.nom ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Entrez le nom du lutteur"
              />
              {errors.nom && <p className="text-red-500 text-sm mt-1">{errors.nom}</p>}
            </div>

            {/* Surnom */}
            <div>
              <label htmlFor="surnom" className="block text-sm font-medium mb-1">
                Surnom
              </label>
              <input
                id="surnom"
                name="surnom"
                type="text"
                value={formData.surnom || ""}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded px-3 py-2"
                placeholder="Surnom (optionnel)"
              />
            </div>

            {/* Date de naissance */}
            <div>
              <label htmlFor="date_naissance" className="block text-sm font-medium mb-1">
                Date de naissance
              </label>
              <input
                id="date_naissance"
                name="date_naissance"
                type="date"
                value={formData.date_naissance || ""}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded px-3 py-2"
              />
              {errors.date_naissance && <p className="text-red-500 text-sm mt-1">{errors.date_naissance}</p>}
            </div>

            {/* Région */}
            <div>
              <label htmlFor="region_id" className="block text-sm font-medium mb-1">
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
                    {region.name} {region.code ? `(${region.code})` : ''}
                  </option>
                ))}
              </select>
              {loadingRegions && (
                <p className="text-gray-500 text-sm mt-1">Chargement des régions...</p>
              )}
            </div>

            {/* Poids */}
            <div>
              <label htmlFor="poids" className="block text-sm font-medium mb-1">
                Poids (kg)
              </label>
              <input
                id="poids"
                name="poids"
                type="number"
                min="0"
                step="0.1"
                value={formData.poids || ""}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded px-3 py-2"
                placeholder="Poids en kilogrammes"
              />
            </div>

            {/* Photo URL */}
            <div>
              <label htmlFor="photo_url" className="block text-sm font-medium mb-1">
                URL de la photo
              </label>
              <input
                id="photo_url"
                name="photo_url"
                type="url"
                value={formData.photo_url || ""}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded px-3 py-2"
                placeholder="https://example.com/photo.jpg"
              />
              {errors.photo_url && <p className="text-red-500 text-sm mt-1">{errors.photo_url}</p>}
            </div>

            {/* Statut actif */}
            <div className="flex items-center">
              <input
                id="actif"
                name="actif"
                type="checkbox"
                checked={formData.actif}
                onChange={handleChange}
                className="h-4 w-4 text-orange-600 border-gray-300 rounded"
              />
              <label htmlFor="actif" className="ml-2 block text-sm text-gray-900">
                Lutteur actif
              </label>
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
                {isSubmitting ? "Création..." : "Créer le lutteur"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}