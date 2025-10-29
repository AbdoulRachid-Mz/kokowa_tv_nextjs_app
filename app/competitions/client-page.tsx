"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Competition {
  id: number;
  title: string;
  description?: string;
  lieu: string;
  date: string;
}

export default function CompetitionsList() {
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/competitions")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data)) {
          setCompetitions(data.data);
        } else {
          console.error("Format de réponse inattendu :", data);
          setCompetitions(data);
        }
      })
      .catch((err) => {
        console.error("Erreur API :", err);
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleDelete(id: number) {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette compétition ?")) return;
    const res = await fetch(`/api/competitions/${id}`, { method: "DELETE" });
    if (res.ok) {
      setCompetitions((prev) => prev.filter((c) => c.id !== id));
    } else {
      alert("Erreur lors de la suppression !");
    }
  }

  if (loading) {
    return <p className="text-center text-gray-500">Chargement des compétitions...</p>;
  }

  if (competitions.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">Aucune compétition trouvée</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Liste des Compétitions</h1>
          <p className="text-gray-600 mt-2">Gérez les compétitions</p>
        </div>
        <Link
          href="/competitions/create"
          className="bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-700 transition-colors"
        >
          Ajouter une Compétition
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {competitions.map((comp) => (
          <div
            key={comp.id}
            className="bg-white rounded-lg shadow-md overflow-hidden border"
          >
            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {comp.title}
              </h3>

              {comp.description && (
                <p className="text-gray-600 mb-2">{comp.description}</p>
              )}

              <div className="space-y-2 text-sm text-gray-600">
                <p>📍 {comp.lieu}</p>
                <p>📅 {new Date(comp.date).toLocaleDateString("fr-FR")}</p>
              </div>

              <div className="flex gap-2 mt-4 pt-4 border-t">
                <Link
                  href={`/competitions/${comp.id}/edit`}
                  className="flex-1 bg-blue-600 text-white text-center py-2 px-4 rounded hover:bg-blue-700 transition-colors"
                >
                  Modifier
                </Link>

                <button
                  onClick={() => handleDelete(comp.id)}
                  className="flex-1 bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700 transition-colors"
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
