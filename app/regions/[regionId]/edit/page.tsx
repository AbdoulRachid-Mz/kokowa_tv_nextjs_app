"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

interface Region {
  id: number;
  name: string;
  code?: string;
}

export default function EditRegionPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [formData, setFormData] = useState({
    name: "",
    code: "",
  });
  const [errors, setErrors] = useState<{ name?: string; code?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadRegion() {
      try {
        const response = await fetch(`/api/regions/${id}`);
        if (response.ok) {
          const result = await response.json();
          const region = result.data || result;
          setFormData({
            name: region.name,
            code: region.code || "",
          });
        } else {
          throw new Error('Région non trouvée');
        }
      } catch (error) {
        console.error('Erreur chargement région:', error);
        alert('Erreur lors du chargement de la région');
        router.push('/regions');
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      loadRegion();
    }
  }, [id, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    if (!formData.name.trim()) {
      setErrors({ name: "Le nom est requis" });
      setIsSubmitting(false);
      return;
    }

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      if (formData.code) formDataToSend.append('code', formData.code);

      const response = await fetch(`/api/regions/${id}`, {
        method: 'PUT',
        body: formDataToSend,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erreur lors de la modification de la région');
      }

      if (result.success) {
        router.push('/regions');
      } else {
        throw new Error(result.error || 'Erreur inconnue');
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Erreur lors de la modification de la région');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

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
              <a href="/lutteurs" className="text-gray-700 hover:text-orange-600 font-medium">
                Lutteurs
              </a>
              <a href="/competitions" className="text-gray-700 hover:text-orange-600 font-medium">
                Compétitions
              </a>
              <a href="/regions" className="text-orange-600 font-medium border-b-2 border-orange-600">
                Régions
              </a>
            </nav>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-md">
          <h1 className="text-2xl font-bold mb-6">Modifier la Région</h1>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Nom */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-1">
                Nom de la région <span className="text-red-500">*</span>
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                className={`w-full border rounded px-3 py-2 ${
                  errors.name ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Ex: Dakar"
              />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
            </div>

            {/* Code */}
            <div>
              <label htmlFor="code" className="block text-sm font-medium mb-1">
                Code (optionnel)
              </label>
              <input
                id="code"
                name="code"
                type="text"
                value={formData.code}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded px-3 py-2"
                placeholder="Ex: DK"
                maxLength={10}
              />
            </div>

            {/* Boutons */}
            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => router.push("/regions")}
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100 transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50 transition-colors"
              >
                {isSubmitting ? "Modification..." : "Modifier la région"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}