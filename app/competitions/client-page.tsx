"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Competition {
  id: number;
  name: string;
  description?: string;
  location: string;
  type: string;
  status: string;
  registration_deadline?: string;
  featured_image?: string;
  region?: {
    id: number;
    name: string;
    code: string;
  };
}

export default function CompetitionsList() {
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCompetitions = async () => {
      try {
        const res = await fetch("/api/competitions");
        const data = await res.json();
        
        if (!res.ok) {
          throw new Error(data.error || "Erreur lors du chargement");
        }

        if (data.success && Array.isArray(data.data)) {
          setCompetitions(data.data);
        } else if (Array.isArray(data.data)) {
          setCompetitions(data.data);
        } else {
          console.error("Format de réponse inattendu :", data);
          setCompetitions([]);
        }
      } catch (err) {
        console.error("Erreur API :", err);
        setError("Erreur lors du chargement des compétitions");
        setCompetitions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCompetitions();
  }, []);

  async function handleDelete(id: number) {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette compétition ?")) return;
    
    try {
      const res = await fetch(`/api/competitions/${id}`, { 
        method: "DELETE" 
      });
      
      if (res.ok) {
        setCompetitions((prev) => prev.filter((c) => c.id !== id));
      } else {
        const errorData = await res.json();
        alert(errorData.error || "Erreur lors de la suppression !");
      }
    } catch (err) {
      alert("Erreur lors de la suppression !");
    }
  }

  const getStatusBadge = (status: string) => {
    const statusColors = {
      upcoming: "bg-blue-100 text-blue-800",
      ongoing: "bg-green-100 text-green-800",
      completed: "bg-gray-100 text-gray-800",
      cancelled: "bg-red-100 text-red-800",
      postponed: "bg-yellow-100 text-yellow-800"
    };
    
    const statusLabels = {
      upcoming: "À venir",
      ongoing: "En cours",
      completed: "Terminée",
      cancelled: "Annulée",
      postponed: "Reportée"
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}`}>
        {statusLabels[status as keyof typeof statusLabels] || status}
      </span>
    );
  };

  const getTypeLabel = (type: string) => {
    const typeLabels: Record<string, string> = {
      sabre_national: "Sabre National",
      coupe_regionale: "Coupe Régionale",
      halarou_bakwai: "Halarou Bakwai",
      aes: "AES",
      friendly: "Amical",
      ministre: "Ministre",
      coupe_airtel: "Coupe Airtel",
      other: "Autre"
    };
    
    return typeLabels[type] || type;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <p className="text-gray-500">Chargement des compétitions...</p>
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

  if (competitions.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg mb-4">Aucune compétition trouvée</p>
        <Link
          href="/competitions/create"
          className="bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-700 transition-colors"
        >
          Créer la première compétition
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Liste des Compétitions</h1>
          <p className="text-gray-600 mt-2">Gérez les compétitions et leurs éditions</p>
        </div>
        <Link
          href="/competitions/create"
          className="bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-700 transition-colors"
        >
          Nouvelle Compétition
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {competitions.map((comp) => (
          <div
            key={comp.id}
            className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow"
          >
            {comp.featured_image && (
              <div className="h-40 bg-gray-200 overflow-hidden">
                <img 
                  src={comp.featured_image} 
                  alt={comp.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            
            <div className="p-6">
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-xl font-semibold text-gray-900 line-clamp-2">
                  {comp.name}
                </h3>
                {getStatusBadge(comp.status)}
              </div>

              <div className="space-y-2 text-sm text-gray-600 mb-4">
                <p className="flex items-center gap-2">
                  <span>🏆</span>
                  <span>{getTypeLabel(comp.type)}</span>
                </p>
                
                <p className="flex items-center gap-2">
                  <span>📍</span>
                  <span>{comp.location || "Lieu non spécifié"}</span>
                </p>
                
                {comp.region && (
                  <p className="flex items-center gap-2">
                    <span>🏛️</span>
                    <span>{comp.region.name}</span>
                  </p>
                )}
                
                {comp.registration_deadline && (
                  <p className="flex items-center gap-2">
                    <span>📅</span>
                    <span>Inscriptions jusqu'au {new Date(comp.registration_deadline).toLocaleDateString("fr-FR")}</span>
                  </p>
                )}
              </div>

              {comp.description && (
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {comp.description}
                </p>
              )}

              <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200">
                <Link
                  href={`/competitions/${comp.id}`}
                  className="flex-1 bg-blue-600 text-white text-center py-2 px-4 rounded hover:bg-blue-700 transition-colors text-sm"
                >
                  Voir
                </Link>
                
                <Link
                  href={`/competitions/${comp.id}/edit`}
                  className="flex-1 bg-gray-600 text-white text-center py-2 px-4 rounded hover:bg-gray-700 transition-colors text-sm"
                >
                  Modifier
                </Link>

                <button
                  onClick={() => handleDelete(comp.id)}
                  className="flex-1 bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700 transition-colors text-sm"
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