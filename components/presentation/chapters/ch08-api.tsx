// components/presentation/chapters/ch08-api.tsx
export function ChapterApi() {
  return (
    <div className="space-y-8 prose prose-neutral dark:prose-invert max-w-none">
      <section>
        <h2>Organisation des routes API</h2>
        <p>
          L'application expose deux familles de routes API distinctes, chacune avec
          des conventions, des middlewares et des contrats différents.
        </p>
        <div className="not-prose grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-card border border-border/50 rounded-lg">
            <h3 className="font-semibold mb-2">🖥️ /api/* — API Interne Web</h3>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• <code>/api/auth/*</code> : Gestion des sessions Firebase</li>
              <li>• <code>/api/upload</code> : Upload de fichiers vers Firebase Storage</li>
              <li>• <code>/api/admin/*</code> : Actions d'administration système</li>
              <li>• <code>/api/live/*</code> : Endpoints de supervision des matchs</li>
              <li>• Utilisée par l'interface web Next.js uniquement</li>
            </ul>
          </div>
          <div className="p-4 bg-card border border-border/50 rounded-lg">
            <h3 className="font-semibold mb-2">📱 /api/mobile/* — API Publique Flutter</h3>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• <code>/api/mobile/fighters</code> : Catalogue des lutteurs</li>
              <li>• <code>/api/mobile/matches</code> : Résultats des combats</li>
              <li>• <code>/api/mobile/editions</code> : Liste des éditions</li>
              <li>• <code>/api/mobile/news</code> : Flux d'actualités</li>
              <li>• <code>/api/mobile/comments</code> : Commentaires (authentifié)</li>
              <li>• <code>/api/mobile/likes</code> : Likes et favoris (authentifié)</li>
            </ul>
          </div>
        </div>
      </section>

      <section>
        <h2>Le gestionnaire <code>apiHandler</code></h2>
        <p>
          Toutes les routes de l'API mobile passent par un gestionnaire centralisé
          <code>apiHandler()</code> qui applique automatiquement une chaîne de middlewares :
        </p>
        <div className="not-prose space-y-3">
          {[
            { step: "1", label: "CORS", desc: "En-têtes Access-Control pour Flutter (origines autorisées configurables)", color: "blue" },
            { step: "2", label: "Firebase App Check", desc: "Vérification de l'intégrité de l'application cliente (token reCAPTCHA ou App Attest)", color: "purple" },
            { step: "3", label: "Rate Limiting (Upstash)", desc: "Protection contre les abus — limite par IP et par token", color: "orange" },
            { step: "4", label: "Authentification Firebase", desc: "Optionnelle ou requise selon l'endpoint — Bearer token ou Session Cookie", color: "green" },
            { step: "5", label: "Handler métier", desc: "Logique applicative avec accès Neon PostgreSQL", color: "gray" },
          ].map((item) => (
            <div key={item.step} className={`flex items-start gap-4 p-3 rounded-lg border border-border/50 bg-card`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0 bg-primary/10 text-primary`}>
                {item.step}
              </div>
              <div>
                <p className="font-semibold text-sm">{item.label}</p>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2>Synchronisation temps réel — Firebase RTDB</h2>
        <p>
          Le score live des combats n'est pas transmis via REST mais via un abonnement
          direct Firebase Realtime Database. L'application Flutter et le navigateur
          s'abonnent à un nœud RTDB dédié par combat.
        </p>
        <div className="not-prose bg-muted/30 rounded-lg p-4 border border-border/50 font-mono text-sm">
          <p className="text-muted-foreground mb-2">// Pattern d'abonnement Flutter (Dart)</p>
          <pre className="text-xs overflow-x-auto">{`final ref = FirebaseDatabase.instance
  .ref('matches/\${matchId}/live');

ref.onValue.listen((event) {
  final data = event.snapshot.value;
  // Mise à jour UI en < 100ms
  setState(() => score = data['score']);
});`}</pre>
        </div>
        <p>
          Côté administration web, le chronomètre de combat est un Client Component
          React qui s'abonne de la même façon et publie les événements (démarrage,
          pause, résultat) dans RTDB. Les deux clients reçoivent la mise à jour
          simultanément avec une latence inférieure à 100ms.
        </p>
      </section>

      <section>
        <h2>Contrat de l'API mobile — Format de réponse</h2>
        <p>
          Toutes les réponses de l'API mobile suivent un format JSON uniforme.
          Les erreurs sont toujours structurées avec un code et un message.
        </p>
        <div className="not-prose grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-muted/30 rounded-lg p-4 border border-border/50 font-mono text-xs">
            <p className="text-muted-foreground mb-2">// Succès</p>
            <pre>{`{
  "success": true,
  "data": [...],
  "meta": {
    "total": 42,
    "page": 1,
    "limit": 20
  }
}`}</pre>
          </div>
          <div className="bg-muted/30 rounded-lg p-4 border border-border/50 font-mono text-xs">
            <p className="text-muted-foreground mb-2">// Erreur</p>
            <pre>{`{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Token Firebase invalide"
  }
}`}</pre>
          </div>
        </div>
      </section>

      <section>
        <h2>Compatibilité et évolutivité</h2>
        <p>
          Le contrat de l'API mobile est maintenu stable pour ne pas rompre
          la compatibilité avec l'application Flutter en production. Tout changement
          de breaking change suit un versionnement via le préfixe de chemin
          (<code>/api/mobile/v2/*</code>). Les champs sont toujours ajoutifs,
          jamais supprimés des réponses existantes.
        </p>
      </section>
    </div>
  );
}
