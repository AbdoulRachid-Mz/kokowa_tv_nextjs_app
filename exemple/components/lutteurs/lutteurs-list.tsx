"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Lutteur {
  id: number;
  nom: string;
  surnom?: string;
  region_name?: string;
  poids?: number;
  photo_url?: string;
  actif: boolean;
}

interface ApiResponse {
  success: boolean;
  data: Lutteur[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function LutteursList() {
  const [lutteurs, setLutteurs] = useState<Lutteur[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadLutteurs() {
      try {
        const response = await fetch("/api/lutteurs");
        
        if (!response.ok) {
          throw new Error(`Erreur HTTP: ${response.status}`);
        }
        
        const result: ApiResponse = await response.json();
        
        if (result.success && Array.isArray(result.data)) {
          setLutteurs(result.data);
        } else {
          console.error("Format de réponse inattendu:", result);
          setError("Format de données invalide");
        }
      } catch (err) {
        console.error("Erreur lors du chargement:", err);
        setError("Erreur lors du chargement des lutteurs");
      } finally {
        setLoading(false);
      }
    }

    loadLutteurs();
  }, []);

  async function handleDelete(id: number) {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce lutteur ?")) return;
    
    try {
      const res = await fetch(`/api/lutteurs/${id}`, { method: "DELETE" });
      
      if (res.ok) {
        setLutteurs((prev) => prev.filter((l) => l.id !== id));
      } else {
        const errorData = await res.json();
        alert(errorData.error || "Erreur lors de la suppression !");
      }
    } catch (err) {
      console.error("Erreur suppression:", err);
      alert("Erreur lors de la suppression !");
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
        <p className="ml-4 text-gray-500">Chargement des lutteurs...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 text-lg mb-4">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700"
        >
          Réessayer
        </button>
      </div>
    );
  }

  if (lutteurs.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg mb-4">Aucun lutteur trouvé</p>
        <Link
          href="/lutteurs/create"
          className="bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-700 transition-colors"
        >
          Ajouter le premier lutteur
        </Link>
      </div>
    );
  }

  return (
    <>
      {/* Page Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Liste des Lutteurs</h1>
          <p className="text-gray-600 mt-2">
            {lutteurs.length} lutteur{lutteurs.length > 1 ? 's' : ''} trouvé{lutteurs.length > 1 ? 's' : ''}
          </p>
        </div>
        <Link
          href="/lutteurs/create"
          className="bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-700 transition-colors"
        >
          Ajouter un Lutteur
        </Link>
      </div>

      {/* Lutteurs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {lutteurs.map((lutteur) => (
          <div
            key={lutteur.id}
            className="bg-white rounded-lg shadow-md overflow-hidden border hover:shadow-lg transition-shadow"
          >
            {/* Photo */}
            <div className="h-48 bg-gray-200 flex items-center justify-center">
              {lutteur.photo_url ? (
                <img
                  src={lutteur.photo_url}
                  alt={lutteur.nom}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Si l'image ne charge pas, afficher un placeholder
                    (e.target as HTMLImageElement).style.display = 'none';
                    (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                  }}
                />
              ) : null}
              <div className={`text-gray-400 ${lutteur.photo_url ? 'hidden' : ''}`}>
                <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              </div>
            </div>

            {/* Info */}
            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {lutteur.nom}
              </h3>

              {lutteur.surnom && (
                <p className="text-orange-600 font-medium mb-2">
                  "{lutteur.surnom}"
                </p>
              )}

              <div className="space-y-2 text-sm text-gray-600">
                {lutteur.region_name && (
                  <p className="flex items-center">
                    <span className="mr-2">📍</span>
                    {lutteur.region_name}
                  </p>
                )}
                {lutteur.poids && (
                  <p className="flex items-center">
                    <span className="mr-2">⚖️</span>
                    {lutteur.poids} kg
                  </p>
                )}
                <p className={lutteur.actif ? "text-green-600 flex items-center" : "text-red-600 flex items-center"}>
                  <span className="mr-2">{lutteur.actif ? "✅" : "❌"}</span>
                  {lutteur.actif ? "Actif" : "Inactif"}
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-2 mt-4 pt-4 border-t">
                <Link
                  href={`/lutteurs/${lutteur.id}/edit`}
                  className="flex-1 bg-blue-600 text-white text-center py-2 px-4 rounded hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  Modifier
                </Link>

                <button
                  onClick={() => handleDelete(lutteur.id)}
                  className="flex-1 bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700 transition-colors text-sm font-medium"
                >
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}