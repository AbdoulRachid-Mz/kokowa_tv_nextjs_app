"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Region {
  id: number;
  name: string;
  code?: string;
  created_at: string;
}

export default function RegionsList() {
  const [regions, setRegions] = useState<Region[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadRegions() {
      try {
        const response = await fetch('/api/regions');
        
        if (!response.ok) {
          throw new Error(`Erreur HTTP: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success && Array.isArray(result.data)) {
          setRegions(result.data);
        } else {
          setRegions(result); // Fallback si pas de structure standard
        }
      } catch (err) {
        console.error("Erreur lors du chargement:", err);
        setError("Erreur lors du chargement des régions");
      } finally {
        setLoading(false);
      }
    }

    loadRegions();
  }, []);

  async function handleDelete(id: number) {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette région ?")) return;
    
    try {
      const res = await fetch(`/api/regions/${id}`, { method: "DELETE" });
      
      if (res.ok) {
        setRegions((prev) => prev.filter((r) => r.id !== id));
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
        <p className="ml-4 text-gray-500">Chargement des régions...</p>
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

  if (regions.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg mb-4">Aucune région trouvée</p>
        <Link
          href="/regions/create"
          className="bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-700 transition-colors"
        >
          Ajouter la première région
        </Link>
      </div>
    );
  }

  return (
    <>
      {/* Page Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Liste des Régions</h1>
          <p className="text-gray-600 mt-2">
            {regions.length} région{regions.length > 1 ? 's' : ''}
          </p>
        </div>
        <Link
          href="/regions/create"
          className="bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-700 transition-colors"
        >
          Ajouter une Région
        </Link>
      </div>

      {/* Régions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {regions.map((region) => (
          <div
            key={region.id}
            className="bg-white rounded-lg shadow-md p-6 border hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900">
                {region.name}
              </h3>
              {region.code && (
                <span className="bg-orange-100 text-orange-800 text-sm font-medium px-2.5 py-0.5 rounded">
                  {region.code}
                </span>
              )}
            </div>

            <div className="text-sm text-gray-600 space-y-2">
              <p className="flex items-center">
                <span className="mr-2">🆔</span>
                ID: {region.id}
              </p>
              <p className="flex items-center">
                <span className="mr-2">📅</span>
                Créée le {new Date(region.created_at).toLocaleDateString('fr-FR')}
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-2 mt-4 pt-4 border-t">
              <Link
                href={`/regions/${region.id}/edit`}
                className="flex-1 bg-blue-600 text-white text-center py-2 px-4 rounded hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                Modifier
              </Link>

              <button
                onClick={() => handleDelete(region.id)}
                className="flex-1 bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700 transition-colors text-sm font-medium"
              >
                Supprimer
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}