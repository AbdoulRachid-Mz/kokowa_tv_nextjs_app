import RegionDetail from '@/components/regions/region-detail';

interface PageProps {
  params: {
    regionId: string;
  };
}

export default function RegionPage({ params }: PageProps) {
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
              <a href="/fighters" className="text-gray-700 hover:text-orange-600 font-medium">
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

      {/* Détail de la région */}
      <div className="container mx-auto px-4 py-8">
        <RegionDetail regionId={parseInt(params.regionId)} />
      </div>
    </div>
  );
}