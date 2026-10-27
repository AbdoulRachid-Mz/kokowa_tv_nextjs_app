// components/presentation/chapters/ch04-public.tsx
export function ChapterPublic() {
  const segments = [
    {
      titre: "Supporters & Grand Public",
      emoji: "👥",
      description: "Nigériens passionnés de lutte traditionnelle, diaspora, amateurs de sport culturel.",
      besoins: ["Résultats en direct", "Profils des lutteurs", "Actualités et photos", "Replays des combats"],
      acces: "Portail web public (gratuit) + Application mobile Flutter",
    },
    {
      titre: "Arbitres & Superviseurs Terrain",
      emoji: "👨‍⚖️",
      description: "Corps arbitral officiel de la FENILUTTE présent sur les sites de combat.",
      besoins: ["Saisie des résultats en temps réel", "Chronomètre de combat", "Attribution de cartons", "Supervision des sous-groupes"],
      acces: "Back-office /ad — Rôle : moderator",
    },
    {
      titre: "Gestionnaires de Lutteurs",
      emoji: "🤼",
      description: "Responsables des délégations régionales, entraîneurs en chef.",
      besoins: ["Gestion des fiches lutteurs", "Gestion des transferts inter-régionaux", "Consultation du statut d'élimination", "Composition des équipes"],
      acces: "Back-office /ad — Rôle : fighter_manager",
    },
    {
      titre: "Éditeurs & Journalistes",
      emoji: "✏️",
      description: "Équipe éditoriale chargée des actualités, articles et médias de la plateforme.",
      besoins: ["Publication d'articles", "Upload de photos et vidéos", "Gestion des publicités", "Création de contenu"],
      acces: "Back-office /ad — Rôle : editor",
    },
    {
      titre: "Administrateurs Système",
      emoji: "🔧",
      description: "Équipe technique responsable de la gestion de la plateforme et du tournoi.",
      besoins: ["Accès complet à toutes les fonctionnalités", "Gestion des utilisateurs et des rôles", "Configuration système", "Supervision de la base de données"],
      acces: "Back-office /ad — Rôle : admin",
    },
    {
      titre: "Développeurs d'Applications Tierces",
      emoji: "📱",
      description: "Équipe de développement de l'application Flutter et partenaires techniques.",
      besoins: ["API REST documentée et stable", "Schémas JSON fiables", "Authentification sécurisée (Firebase JWT)", "Données temps réel (Firebase RTDB)"],
      acces: "API /api/mobile/* (Bearer Token Firebase)",
    },
  ];

  return (
    <div className="space-y-8 prose prose-neutral dark:prose-invert max-w-none">
      <section>
        <h2>4.1 Segmentation des Utilisateurs</h2>
        <p>
          Kokowa TV s&apos;adresse à des publics aux besoins très différents. La plateforme distingue clairement
          les <strong>utilisateurs du portail public</strong> (accès en lecture seule), les{" "}
          <strong>acteurs du back-office</strong> (rôles RBAC différenciés) et les{" "}
          <strong>clients de l&apos;API mobile</strong> (application Flutter).
        </p>
      </section>
      <section className="not-prose">
        <div className="grid grid-cols-1 gap-4 my-4">
          {segments.map((s) => (
            <div key={s.titre} className="bg-card border border-border/50 rounded-xl p-5">
              <div className="flex items-start gap-3 mb-3">
                <span className="text-2xl shrink-0">{s.emoji}</span>
                <div>
                  <h3 className="font-bold text-foreground">{s.titre}</h3>
                  <p className="text-sm text-muted-foreground">{s.description}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">Besoins principaux</p>
                  <ul className="space-y-1">
                    {s.besoins.map((b, i) => (
                      <li key={i} className="text-sm text-muted-foreground flex items-center gap-1.5">
                        <span className="text-primary">•</span> {b}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">Point d&apos;accès</p>
                  <p className="text-sm text-foreground bg-muted/50 px-3 py-2 rounded-lg font-mono text-xs">{s.acces}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
