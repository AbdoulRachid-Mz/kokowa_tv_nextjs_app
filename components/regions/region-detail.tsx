"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Region, City, Fighter } from "@/types";

interface RegionDetailProps {
  regionId: number;
}

export default function RegionDetail({ regionId }: RegionDetailProps) {
  const [region, setRegion] = useState<Region | null>(null);
  const [cities, setCities] = useState<City[]>([]);
  const [fighters, setFighters] = useState<Fighter[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'cities' | 'fighters'>('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadRegionData();
  }, [regionId]);

  const loadRegionData = async () => {
    try {
      setLoading(true);
      
      // Charger les données de la région avec ses relations
      const [regionRes, fightersRes] = await Promise.all([
        fetch(`/api/regions/${regionId}?with_relations=true&with_cities`),
        fetch(`/api/fighters?region_id=${regionId}&with_region=false`)
      ]);

      if (!regionRes.ok) throw new Error("Erreur lors du chargement de la région");
      if (!fightersRes.ok) throw new Error("Erreur lors du chargement des lutteurs");

      const regionData = await regionRes.json();
      const fightersData = await fightersRes.json();

      setRegion(regionData);
      setCities(regionData.data?.cities || []);
      setFighters(fightersData.data || fightersData);
      
    } catch (err) {
      console.error("Erreur:", err);
      setError("Erreur lors du chargement des données");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCity = async (cityId: number) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette ville ?")) return;
    
    try {
      const res = await fetch(`/api/cities/${cityId}`, { method: "DELETE" });
      
      if (res.ok) {
        setCities(prev => prev.filter(c => c.id !== cityId));
      } else {
        const errorData = await res.json();
        alert(errorData.error || "Erreur lors de la suppression !");
      }
    } catch (err) {
      alert("Erreur lors de la suppression !");
    }
  };

  const handleDeleteFighter = async (fighterId: number) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce lutteur ?")) return;
    
    try {
      const res = await fetch(`/api/fighters/${fighterId}`, { method: "DELETE" });
      
      if (res.ok) {
        setFighters(prev => prev.filter(f => f.id !== fighterId));
      } else {
        const errorData = await res.json();
        alert(errorData.error || "Erreur lors de la suppression !");
      }
    } catch (err) {
      alert("Erreur lors de la suppression !");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
        <p className="ml-4 text-gray-500">Chargement...</p>
      </div>
    );
  }

  if (error || !region) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 text-lg mb-4">{error || "Région non trouvée"}</p>
        <Link
          href="/regions"
          className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700"
        >
          Retour aux régions
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* En-tête de la région */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{region.name}</h1>
            {region.code && (
              <p className="text-gray-600 mt-1">Code: {region.code}</p>
            )}
          </div>
          <div className="flex gap-3">
            <Link
              href={`/regions/${regionId}/edit`}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
            >
              Modifier
            </Link>
            <Link
              href="/regions"
              className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors"
            >
              Retour
            </Link>
          </div>
        </div>

        {region.description && (
          <p className="text-gray-700 mb-4">{region.description}</p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="bg-orange-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">{region.total_fighters}</div>
            <div className="text-orange-700 font-medium">Lutteurs</div>
          </div>
          <div className="bg-green-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{region.total_champions}</div>
            <div className="text-green-700 font-medium">Champions</div>
          </div>
          <div className="bg-blue-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{cities.length}</div>
            <div className="text-blue-700 font-medium">Villes</div>
          </div>
        </div>
      </div>

      {/* Navigation par onglets */}
      <div className="bg-white rounded-lg shadow-md mb-6">
        <div className="border-b">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-6 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'overview'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Vue d'ensemble
            </button>
            <button
              onClick={() => setActiveTab('cities')}
              className={`py-4 px-6 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'cities'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Villes ({cities.length})
            </button>
            <button
              onClick={() => setActiveTab('fighters')}
              className={`py-4 px-6 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'fighters'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Lutteurs ({fighters.length})
            </button>
          </nav>
        </div>

        {/* Contenu des onglets */}
        <div className="p-6">
          {activeTab === 'overview' && (
            <OverviewTab region={region} cities={cities} fighters={fighters} />
          )}

          {activeTab === 'cities' && (
            <CitiesTab 
              cities={cities} 
              regionId={regionId}
              onDeleteCity={handleDeleteCity}
              onRefresh={loadRegionData}
            />
          )}

          {activeTab === 'fighters' && (
            <FightersTab 
              fighters={fighters}
              regionId={regionId}
              onDeleteFighter={handleDeleteFighter}
              onRefresh={loadRegionData}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// Composant pour l'onglet Vue d'ensemble
function OverviewTab({ region, cities, fighters }: { region: Region; cities: City[]; fighters: Fighter[] }) {
  const activeFighters = fighters.filter(f => f.is_active);
  const champions = fighters.filter(f => f.is_champion);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-semibold mb-4">Statistiques</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span>Lutteurs actifs:</span>
              <span className="font-semibold">{activeFighters.length}</span>
            </div>
            <div className="flex justify-between">
              <span>Champions:</span>
              <span className="font-semibold">{champions.length}</span>
            </div>
            <div className="flex justify-between">
              <span>Villes:</span>
              <span className="font-semibold">{cities.length}</span>
            </div>
            <div className="flex justify-between">
              <span>Créée le:</span>
              <span className="font-semibold">{new Date(region.created_at).toLocaleDateString('fr-FR')}</span>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-4">Top Lutteurs</h3>
          {fighters.slice(0, 5).map(fighter => (
            <div key={fighter.id} className="flex justify-between items-center py-2 border-b">
              <span>{fighter.first_name} {fighter.last_name}</span>
              <span className="bg-gray-100 px-2 py-1 rounded text-sm">
                #{fighter.ranking}
              </span>
            </div>
          ))}
          {fighters.length === 0 && (
            <p className="text-gray-500">Aucun lutteur dans cette région</p>
          )}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Villes principales</h3>
        <div className="flex flex-wrap gap-2">
          {cities.slice(0, 10).map(city => (
            <span key={city.id} className="bg-gray-100 px-3 py-1 rounded-full text-sm">
              {city.name}
            </span>
          ))}
          {cities.length === 0 && (
            <p className="text-gray-500">Aucune ville dans cette région</p>
          )}
        </div>
      </div>
    </div>
  );
}

// Composant pour l'onglet Villes
function CitiesTab({ cities, regionId, onDeleteCity, onRefresh }: { 
  cities: City[]; 
  regionId: number;
  onDeleteCity: (id: number) => void;
  onRefresh: () => void;
}) {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold">Villes de la région</h3>
        <Link
          href={`/cities/create?region_id=${regionId}`}
          className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700 transition-colors"
        >
          Ajouter une Ville
        </Link>
      </div>

      {cities.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500 mb-4">Aucune ville dans cette région</p>
          <Link
            href={`/cities/create?region_id=${regionId}`}
            className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700 transition-colors"
          >
            Ajouter la première ville
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cities.map(city => (
            <div key={city.id} className="bg-gray-50 rounded-lg p-4 border">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-semibold text-gray-900">{city.name}</h4>
                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                  ID: {city.id}
                </span>
              </div>
              
              {city.description && (
                <p className="text-gray-600 text-sm mb-3">{city.description}</p>
              )}

              <div className="flex gap-2">
                <Link
                  href={`/cities/${city.id}/edit`}
                  className="flex-1 bg-blue-600 text-white text-center py-1 px-3 rounded hover:bg-blue-700 text-sm"
                >
                  Modifier
                </Link>
                <button
                  onClick={() => onDeleteCity(city.id)}
                  className="flex-1 bg-red-600 text-white py-1 px-3 rounded hover:bg-red-700 text-sm"
                >
                  Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Composant pour l'onglet Lutteurs
function FightersTab({ fighters, regionId, onDeleteFighter, onRefresh }: { 
  fighters: Fighter[]; 
  regionId: number;
  onDeleteFighter: (id: number) => void;
  onRefresh: () => void;
}) {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold">Lutteurs de la région</h3>
        <Link
          href={`/fighters/create?region_id=${regionId}`}
          className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700 transition-colors"
        >
          Ajouter un Lutteur
        </Link>
      </div>

      {fighters.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500 mb-4">Aucun lutteur dans cette région</p>
          <Link
            href={`/fighters/create?region_id=${regionId}`}
            className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700 transition-colors"
          >
            Ajouter le premier lutteur
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {fighters.map(fighter => (
            <div key={fighter.id} className="bg-white rounded-lg border p-4 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="font-semibold text-gray-900">
                    {fighter.first_name} {fighter.last_name}
                  </h4>
                  {fighter.nickname && (
                    <p className="text-orange-600 text-sm">"{fighter.nickname}"</p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1">
                  {fighter.is_champion && (
                    <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">
                      🏆 Champion
                    </span>
                  )}
                  <span className={`text-xs px-2 py-1 rounded ${
                    fighter.is_active 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {fighter.is_active ? 'Actif' : 'Inactif'}
                  </span>
                </div>
              </div>

              <div className="space-y-2 text-sm text-gray-600 mb-3">
                {fighter.ranking && (
                  <p>Classement: <span className="font-semibold">#{fighter.ranking}</span></p>
                )}
                {fighter.birth_date && (
                  <p>Né le: {new Date(fighter.birth_date).toLocaleDateString('fr-FR')}</p>
                )}
                {fighter.debut_year && (
                  <p>Début: {fighter.debut_year}</p>
                )}
              </div>

              <div className="flex gap-2">
                <Link
                  href={`/fighters/${fighter.id}`}
                  className="flex-1 bg-blue-600 text-white text-center py-1 px-3 rounded hover:bg-blue-700 text-sm"
                >
                  Voir
                </Link>
                <Link
                  href={`/fighters/${fighter.id}/edit`}
                  className="flex-1 bg-gray-600 text-white text-center py-1 px-3 rounded hover:bg-gray-700 text-sm"
                >
                  Modifier
                </Link>
                <button
                  onClick={() => onDeleteFighter(fighter.id)}
                  className="flex-1 bg-red-600 text-white py-1 px-3 rounded hover:bg-red-700 text-sm"
                >
                  Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}