import Link from 'next/link';
import { getLutteurs } from '@/actions/lutteurs';
import { getCompetitions } from '@/actions/competitions';
import { getRegions } from '@/actions/regions';

async function getStats() {
  try {
    const [lutteursResult, competitionsResult, regionsResult] = await Promise.all([
      getLutteurs({ actif: true }, { limit: 1000 }), // Récupérer tous les lutteurs actifs
      getCompetitions({}, { limit: 1000 }), // Récupérer toutes les compétitions
      getRegions()
    ]);

    return {
      lutteursCount: lutteursResult.pagination.total,
      competitionsCount: competitionsResult.pagination.total,
      regionsCount: regionsResult.length,
      dernierLutteurs: lutteursResult.data.slice(0, 3), // 3 derniers lutteurs
      prochainesCompetitions: competitionsResult.data
        .filter(comp => new Date(comp.date) >= new Date())
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(0, 2) // 2 prochaines compétitions
    };
  } catch (error) {
    console.error('Erreur lors du chargement des stats:', error);
    // Retourner des valeurs par défaut en cas d'erreur
    return {
      lutteursCount: 8,
      competitionsCount: 4,
      regionsCount: 14,
      dernierLutteurs: [],
      prochainesCompetitions: []
    };
  }
}

export default async function HomePage() {
  const stats = await getStats();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-orange-600">Kokowa TV</h1>
            <nav className="flex gap-6">
              <Link href="/" className="text-gray-700 hover:text-orange-600 font-medium">
                Accueil
              </Link>
              <Link href="/lutteurs" className="text-gray-700 hover:text-orange-600 font-medium">
                Lutteurs
              </Link>
              <Link href="/competitions" className="text-gray-700 hover:text-orange-600 font-medium">
                Compétitions
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-6">
          Bienvenue sur <span className="text-orange-600">Kokowa TV</span>
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          La plateforme de référence pour suivre la lutte sénégalaise. 
          Découvrez les lutteurs, les compétitions et les résultats en temps réel.
        </p>
        
        <div className="flex gap-4 justify-center flex-wrap">
          <Link 
            href="/lutteurs" 
            className="bg-orange-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-orange-700 transition-colors"
          >
            Voir les Lutteurs ({stats.lutteursCount})
          </Link>
          <Link 
            href="/competitions" 
            className="border border-orange-600 text-orange-600 px-8 py-3 rounded-lg font-semibold hover:bg-orange-50 transition-colors"
          >
            Compétitions ({stats.competitionsCount})
          </Link>
        </div>
      </section>

      {/* Stats Section */}
      <section className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-md text-center hover:shadow-lg transition-shadow">
            <div className="text-3xl font-bold text-orange-600 mb-2">{stats.lutteursCount}</div>
            <div className="text-gray-600">Lutteurs Actifs</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md text-center hover:shadow-lg transition-shadow">
            <div className="text-3xl font-bold text-orange-600 mb-2">{stats.competitionsCount}</div>
            <div className="text-gray-600">Compétitions</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md text-center hover:shadow-lg transition-shadow">
            <div className="text-3xl font-bold text-orange-600 mb-2">{stats.regionsCount}</div>
            <div className="text-gray-600">Régions</div>
          </div>
        </div>
      </section>

      {/* Derniers Lutteurs */}
      {stats.dernierLutteurs.length > 0 && (
        <section className="container mx-auto px-4 py-12">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">
            Derniers Lutteurs
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {stats.dernierLutteurs.map((lutteur) => (
              <div key={lutteur.id} className="bg-white rounded-lg shadow-md overflow-hidden border hover:shadow-lg transition-shadow">
                <div className="h-32 bg-gray-200 flex items-center justify-center">
                  {lutteur.photo_url ? (
                    <img
                      src={lutteur.photo_url}
                      alt={lutteur.nom}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-gray-400">
                      <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-1">{lutteur.nom}</h3>
                  {lutteur.surnom && (
                    <p className="text-orange-600 text-sm mb-2">"{lutteur.surnom}"</p>
                  )}
                  {lutteur.region_name && (
                    <p className="text-gray-600 text-sm">📍 {lutteur.region_name}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-6">
            <Link 
              href="/lutteurs" 
              className="text-orange-600 hover:text-orange-700 font-semibold"
            >
              Voir tous les lutteurs →
            </Link>
          </div>
        </section>
      )}

      {/* Prochaines Compétitions */}
      {stats.prochainesCompetitions.length > 0 && (
        <section className="container mx-auto px-4 py-12 bg-white">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">
            Prochaines Compétitions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {stats.prochainesCompetitions.map((competition) => (
              <div key={competition.id} className="bg-orange-50 rounded-lg p-6 border border-orange-200 hover:shadow-md transition-shadow">
                <h3 className="font-semibold text-gray-900 mb-2">{competition.title}</h3>
                <p className="text-gray-600 text-sm mb-2 line-clamp-2">{competition.description}</p>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">📍 {competition.lieu}</span>
                  <span className="text-orange-600 font-semibold">
                    {new Date(competition.date).toLocaleDateString('fr-FR')}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-6">
            <Link 
              href="/competitions" 
              className="text-orange-600 hover:text-orange-700 font-semibold"
            >
              Voir toutes les compétitions →
            </Link>
          </div>
        </section>
      )}

      {/* Features Section */}
      <section className="container mx-auto px-4 py-12">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
          Ce que nous offrons
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
            <h3 className="text-xl font-semibold text-gray-900 mb-3">📊 Gestion des Lutteurs</h3>
            <p className="text-gray-600">
              Profils détaillés avec statistiques, régions et palmarès de chaque lutteur.
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
            <h3 className="text-xl font-semibold text-gray-900 mb-3">🏆 Compétitions</h3>
            <p className="text-gray-600">
              Suivez toutes les compétitions, phases et résultats des matchs en temps réel.
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
            <h3 className="text-xl font-semibold text-gray-900 mb-3">🔄 Transferts</h3>
            <p className="text-gray-600">
              Historique complet des transferts entre régions avec dates et détails.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
            <h3 className="text-xl font-semibold text-gray-900 mb-3">📈 Palmarès</h3>
            <p className="text-gray-600">
              Suivez les performances et accomplissements de chaque lutteur.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
            <h3 className="text-xl font-semibold text-gray-900 mb-3">🎯 Matchs & Résultats</h3>
            <p className="text-gray-600">
              Détails complets des matchs avec scores et statistiques.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
            <h3 className="text-xl font-semibold text-gray-900 mb-3">📱 Mobile Friendly</h3>
            <p className="text-gray-600">
              Interface responsive optimisée pour tous les appareils.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 mt-16">
        <div className="container mx-auto px-4 text-center">
          <p>&copy; 2024 Kokowa TV. Tous droits réservés.</p>
          <p className="text-gray-400 mt-2">
            {stats.lutteursCount} lutteurs • {stats.competitionsCount} compétitions • {stats.regionsCount} régions
          </p>
        </div>
      </footer>
    </div>
  );
}