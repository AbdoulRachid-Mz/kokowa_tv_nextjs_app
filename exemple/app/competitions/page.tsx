import CompetitionsList from "./client-page";

export default function CompetitionsPage() {
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

      {/* Liste des lutteurs */}
      <div className="container mx-auto px-4 py-8">
        <CompetitionsList />
      </div>
    </div>
  );
}
