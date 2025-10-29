export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-600 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-900">Chargement...</h2>
        <p className="text-gray-600 mt-2">Kokowa TV</p>
      </div>
    </div>
  );
}