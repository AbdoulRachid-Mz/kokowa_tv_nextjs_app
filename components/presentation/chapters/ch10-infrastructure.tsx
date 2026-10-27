// components/presentation/chapters/ch10-infrastructure.tsx
export function ChapterInfrastructure() {
  const services = [
    {
      nom: "Neon PostgreSQL Serverless",
      categorie: "Base de données",
      tier: "Pro recommandé en prod",
      description: "Base de données principale. Stocke lutteurs, matchs, éditions, phases, articles, utilisateurs. Connexions serverless avec pooling Neon. SSL/TLS obligatoire. Retry automatique avec backoff exponentiel.",
      envVars: ["DATABASE_URL"],
      icon: "🐘",
    },
    {
      nom: "Vercel / Railway",
      categorie: "Hébergement Application",
      tier: "Pro",
      description: "Déploiement de l'application Next.js. Fonctions serverless pour les Server Actions et les routes API. CDN intégré pour les assets statiques. Déploiement via Bun.",
      envVars: ["NODE_ENV", "NEXTAUTH_URL"],
      icon: "▲",
    },
    {
      nom: "Firebase Authentication",
      categorie: "Authentification",
      tier: "Firebase Blaze (pay-as-you-go)",
      description: "Gestion des identités utilisateurs. Supporte l'email/password. Sessions via cookies HttpOnly sécurisés. Distinction ID Token (mobile) / Session Cookie (web).",
      envVars: ["FIREBASE_PROJECT_ID", "FIREBASE_PRIVATE_KEY", "FIREBASE_CLIENT_EMAIL"],
      icon: "🔐",
    },
    {
      nom: "Firebase Realtime Database",
      categorie: "Temps réel",
      tier: "Firebase Blaze",
      description: "Synchronisation des scores de combat en direct. Latence < 100ms. Utilisé par le chronomètre web et l'application Flutter via abonnements WebSocket.",
      envVars: ["FIREBASE_DATABASE_URL"],
      icon: "⚡",
    },
    {
      nom: "Firebase Cloud Storage",
      categorie: "Stockage médias",
      tier: "Firebase Blaze",
      description: "Stockage des photos de lutteurs, images d'articles, bannières publicitaires. Upload sécurisé côté serveur via Firebase Admin SDK.",
      envVars: ["FIREBASE_STORAGE_BUCKET"],
      icon: "📦",
    },
    {
      nom: "Firebase App Check",
      categorie: "Intégrité applicative",
      tier: "Gratuit",
      description: "Vérification que les requêtes API proviennent d'applications légitimes (reCAPTCHA v3 web, App Attest iOS, Play Integrity Android). Bypass propre en développement.",
      envVars: ["NEXT_PUBLIC_FIREBASE_RECAPTCHA_KEY"],
      icon: "🛡️",
    },
    {
      nom: "Upstash Redis",
      categorie: "Cache & Rate Limiting",
      tier: "Pay-per-request",
      description: "Limitation des appels API (rate limiting) par IP et par token. Cache distribué pour les données fréquemment consultées. Compatible Edge Runtime.",
      envVars: ["UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN"],
      icon: "🚀",
    },
  ];

  return (
    <div className="space-y-8 prose prose-neutral dark:prose-invert max-w-none">
      <section>
        <h2>Architecture cloud</h2>
        <p>
          Kokowa TV repose sur une architecture 100% cloud, sans serveur physique dédié.
          Chaque service est sélectionné pour sa fiabilité, sa scalabilité automatique
          et son modèle de tarification adapté aux besoins d'une organisation sportive
          avec des pics de charge prévisibles (saison du Sabre National).
        </p>
      </section>

      <section>
        <h2>Services cloud utilisés</h2>
        <div className="not-prose grid grid-cols-1 gap-4">
          {services.map((service, i) => (
            <div key={i} className="p-4 bg-card border border-border/50 rounded-lg">
              <div className="flex items-start gap-3">
                <span className="text-2xl">{service.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-sm">{service.nom}</h3>
                    <span className="px-2 py-0.5 rounded-full text-xs bg-primary/10 text-primary">{service.categorie}</span>
                    <span className="px-2 py-0.5 rounded-full text-xs bg-muted text-muted-foreground">{service.tier}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{service.description}</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {service.envVars.map((env, j) => (
                      <code key={j} className="text-xs px-2 py-0.5 bg-muted rounded">{env}</code>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2>Environnements de déploiement</h2>
        <div className="not-prose grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <h3 className="font-semibold text-blue-700 dark:text-blue-300 mb-2">🧪 Développement</h3>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• <code>bun run dev</code> — serveur Turbopack local</li>
              <li>• Firebase App Check désactivé (clé test détectée)</li>
              <li>• SSL Neon en mode <code>rejectUnauthorized: false</code></li>
              <li>• Logs détaillés avec requêtes SQL (non en prod)</li>
              <li>• Variables dans <code>.env.local</code> (non versionné)</li>
            </ul>
          </div>
          <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
            <h3 className="font-semibold text-green-700 dark:text-green-300 mb-2">🚀 Production</h3>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• <code>bun run build && bun run start</code></li>
              <li>• Firebase App Check actif (reCAPTCHA v3 requis)</li>
              <li>• SSL Neon strict (<code>rejectUnauthorized: true</code>)</li>
              <li>• Logs structurés sans fuite SQL</li>
              <li>• Variables dans Vercel/Railway Secrets</li>
            </ul>
          </div>
        </div>
      </section>

      <section>
        <h2>Variables d'environnement requises</h2>
        <p>
          Les variables d'environnement sensibles ne doivent jamais être versionnées
          dans le dépôt Git. Elles sont gérées via les secrets du service d'hébergement.
        </p>
        <div className="not-prose bg-muted/30 rounded-lg p-4 border border-border/50">
          <p className="text-sm font-semibold mb-2">Variables obligatoires en production :</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-1 text-xs font-mono text-muted-foreground">
            {[
              "DATABASE_URL", "FIREBASE_PROJECT_ID", "FIREBASE_PRIVATE_KEY",
              "FIREBASE_CLIENT_EMAIL", "FIREBASE_DATABASE_URL", "FIREBASE_STORAGE_BUCKET",
              "UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN",
              "NEXT_PUBLIC_FIREBASE_API_KEY", "NEXT_PUBLIC_FIREBASE_RECAPTCHA_KEY",
            ].map((v) => <code key={v} className="px-2 py-0.5 bg-muted rounded">{v}</code>)}
          </div>
        </div>
      </section>

      <section>
        <h2>Stratégie de sauvegarde</h2>
        <ul>
          <li><strong>Neon PostgreSQL</strong> : Sauvegardes automatiques quotidiennes incluses dans le tier Pro (Point-in-Time Recovery sur 7 jours minimum). Branches Neon disponibles pour les tests.</li>
          <li><strong>Firebase RTDB</strong> : Exports manuels recommandés avant et après chaque édition du Sabre.</li>
          <li><strong>Firebase Storage</strong> : Médias répliqués dans la région choisie lors de la configuration. Pas de suppression automatique.</li>
          <li><strong>Code source</strong> : Versionné dans un dépôt Git privé. Tags recommandés avant chaque déploiement en production.</li>
        </ul>
      </section>
    </div>
  );
}
