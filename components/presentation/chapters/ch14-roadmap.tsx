// components/presentation/chapters/ch14-roadmap.tsx
export function ChapterRoadmap() {
  const phases = [
    {
      horizon: "✅ Réalisé — Refonte 2026",
      periode: "Janv. — Oct. 2026",
      couleur: "green",
      items: [
        { titre: "Refonte complète de l'architecture", desc: "Migration vers Next.js 16 App Router, TypeScript strict, Bun" },
        { titre: "Sécurisation complète", desc: "Résolution des 9 vulnérabilités SEC-01 à SEC-09" },
        { titre: "Middleware Edge sécurisé", desc: "Protection des routes admin avec RBAC, remplacement des anciens proxies" },
        { titre: "API mobile documentée", desc: "Endpoints Flutter stables avec contrat JSON formel" },
        { titre: "Corrections Neon, Firebase, App Check", desc: "SSL strict, distinction ID Token/Session Cookie, bypass App Check dev" },
        { titre: "Cache mémoire Server Actions", desc: "Optimisation getAllAppSettings() : ~32s → quasi-instantané" },
        { titre: "Documentation complète", desc: "README, ANALYSIS, PLAN, TASK, actions/README, api/README" },
        { titre: "Tests unitaires middleware", desc: "17/17 tests pass, 0 fail" },
      ],
    },
    {
      horizon: "🔵 Court terme — Stabilisation",
      periode: "Nov. 2026 — Fév. 2027",
      couleur: "blue",
      items: [
        { titre: "Tests de charge pré-Sabre", desc: "Simulation du pic de trafic lors de la finale nationale" },
        { titre: "Monitoring de production", desc: "Mise en place d'alertes (Uptime Robot ou équivalent)" },
        { titre: "Publication App Flutter", desc: "Déploiement sur App Store et Google Play Store" },
        { titre: "Finalisation du module publicitaire", desc: "Activation des campagnes avec les premiers partenaires" },
        { titre: "Formation équipe terrain", desc: "Formation des arbitres numériques sur la saisie en direct" },
      ],
    },
    {
      horizon: "🟡 Moyen terme — Consolidation",
      periode: "Mars — Déc. 2027",
      couleur: "yellow",
      items: [
        { titre: "Génération automatique des brackets", desc: "Module d'appariement automatique des phases d'élimination" },
        { titre: "Module statistiques avancées", desc: "Dashboard analytics : top lutteurs, tendances régionales, historique" },
        { titre: "Audit de sécurité externe", desc: "Pentest partiel par prestataire spécialisé" },
        { titre: "Amélioration UX mobile", desc: "Refonte de l'expérience utilisateur Flutter basée sur les retours terrain" },
        { titre: "Structuration du modèle économique", desc: "Formalisation des partenariats et des sources de revenus" },
      ],
    },
    {
      horizon: "🚀 Long terme — Accélération",
      periode: "2028 et au-delà",
      couleur: "purple",
      items: [
        { titre: "Streaming vidéo live intégré", desc: "Diffusion des combats en direct avec faible latence (Mux.com ou équivalent)" },
        { titre: "Couverture nationale complète", desc: "Intégration de toutes les compétitions régionales nigériennes" },
        { titre: "Expansion africaine", desc: "Adaptation pour d'autres fédérations de lutte traditionnelle africaine" },
        { titre: "Équipe permanente", desc: "Recrutement d'une équipe technique et éditoriale à plein temps" },
        { titre: "Plateforme de données sportives", desc: "API ouverte pour chercheurs, médias et partenaires institutionnels" },
        { titre: "Préservation du patrimoine", desc: "Numérisation et archivage des archives vidéo historiques depuis 1975" },
      ],
    },
  ];

  const couleurConfig: Record<string, { border: string; header: string; dot: string }> = {
    green: { border: "border-green-500/40", header: "bg-green-500/10 text-green-700 dark:text-green-300", dot: "bg-green-500" },
    blue: { border: "border-blue-500/40", header: "bg-blue-500/10 text-blue-700 dark:text-blue-300", dot: "bg-blue-500" },
    yellow: { border: "border-yellow-500/40", header: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-300", dot: "bg-yellow-500" },
    purple: { border: "border-purple-500/40", header: "bg-purple-500/10 text-purple-700 dark:text-purple-300", dot: "bg-purple-500" },
  };

  return (
    <div className="space-y-8 prose prose-neutral dark:prose-invert max-w-none">
      <section>
        <h2>Feuille de route — Vue d'ensemble</h2>
        <p>
          La feuille de route de Kokowa TV s'articule autour de quatre horizons temporels.
          Les éléments "Réalisés" sont vérifiés dans le code source. Les éléments futurs
          sont des priorités définies sur la base de l'audit et des besoins identifiés.
        </p>
      </section>

      <div className="not-prose space-y-6">
        {phases.map((phase, i) => {
          const cfg = couleurConfig[phase.couleur];
          return (
            <div key={i} className={`rounded-xl border ${cfg.border} overflow-hidden`}>
              <div className={`px-4 py-3 ${cfg.header}`}>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h3 className="font-bold">{phase.horizon}</h3>
                  <span className="text-sm opacity-80">{phase.periode}</span>
                </div>
              </div>
              <div className="p-4">
                <div className="space-y-3">
                  {phase.items.map((item, j) => (
                    <div key={j} className="flex items-start gap-3">
                      <div className={`w-2 h-2 rounded-full ${cfg.dot} mt-1.5 shrink-0`} />
                      <div>
                        <p className="font-medium text-sm">{item.titre}</p>
                        <p className="text-xs text-muted-foreground">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <section>
        <h2>Dépendances et prérequis</h2>
        <p>
          La réalisation des phases futures est conditionnée par plusieurs prérequis :
        </p>
        <ul>
          <li><strong>Financement assuré</strong> : L'infrastructure minimale doit être financée avant tout développement additionnel.</li>
          <li><strong>Équipe constituée</strong> : Au moins un développeur et un responsable éditorial actifs.</li>
          <li><strong>Application Flutter publiée</strong> : Pré-requis pour les fonctionnalités mobile des phases suivantes.</li>
          <li><strong>Partenaires identifiés</strong> : Nécessaire pour activer le module publicitaire et le modèle économique.</li>
        </ul>
      </section>
    </div>
  );
}
