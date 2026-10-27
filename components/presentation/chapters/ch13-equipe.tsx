// components/presentation/chapters/ch13-equipe.tsx
export function ChapterEquipe() {
  const roles = [
    {
      titre: "Lead Développeur Full-Stack",
      responsabilites: ["Architecture et développement Next.js/TypeScript", "Maintenance de la base de données Neon PostgreSQL", "Intégration Firebase (Auth, RTDB, Storage)", "Revue de code et qualité technique"],
      profil: "Expert Next.js, TypeScript, PostgreSQL, Firebase",
      priorite: "Critique",
      statut: "Recommandé : 1 personne (temps plein ou contrat cadre)",
    },
    {
      titre: "Développeur Mobile Flutter",
      responsabilites: ["Développement et maintenance de l'application iOS/Android", "Intégration avec l'API mobile Kokowa TV", "Publication sur App Store et Play Store", "Tests sur appareils réels"],
      profil: "Expert Flutter/Dart, Firebase SDK mobile",
      priorite: "Élevée",
      statut: "Recommandé : 1 personne (temps partiel ou prestataire)",
    },
    {
      titre: "DevOps / Administrateur système cloud",
      responsabilites: ["Gestion des environnements Vercel/Railway", "Monitoring et alertes de production", "Gestion des secrets et variables d'environnement", "Automatisation des déploiements (CI/CD)"],
      profil: "Vercel, Firebase, Neon, Upstash, Git",
      priorite: "Moyenne",
      statut: "Peut être assuré par le Lead Dev en phase initiale",
    },
    {
      titre: "Responsable éditorial",
      responsabilites: ["Publication des articles et actualités du Kokowa", "Coordination avec les arbitres pour les résultats", "Gestion du calendrier de contenu", "Modération des commentaires"],
      profil: "Connaissance du milieu Kokowa, maîtrise du back-office",
      priorite: "Élevée",
      statut: "Rôle opérationnel dès le lancement des saisons",
    },
    {
      titre: "Arbitre numérique / Opérateur terrain",
      responsabilites: ["Saisie des résultats en temps réel depuis le terrain", "Gestion du chronomètre de combat live", "Coordination avec le jury d'arbitrage", "Formation sur l'utilisation du back-office"],
      profil: "Connaissance des règles du Kokowa, formation technique",
      priorite: "Critique pendant les compétitions",
      statut: "Minimum 2 personnes formées par édition",
    },
    {
      titre: "Responsable FENILUTTE (Coordinateur projet)",
      responsabilites: ["Validation des données officielles (lutteurs, résultats)", "Liaison entre la fédération et l'équipe technique", "Définition des priorités fonctionnelles", "Communication institutionnelle"],
      profil: "Membre de la FENILUTTE, sensible au numérique",
      priorite: "Stratégique",
      statut: "Rôle de gouvernance — supervision générale",
    },
  ];

  const prioriteColors: Record<string, string> = {
    "Critique": "bg-red-500/20 text-red-700 dark:text-red-300 border-red-500/30",
    "Élevée": "bg-orange-500/20 text-orange-700 dark:text-orange-300 border-orange-500/30",
    "Moyenne": "bg-yellow-500/20 text-yellow-700 dark:text-yellow-300 border-yellow-500/30",
    "Stratégique": "bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/30",
    "Critique pendant les compétitions": "bg-red-500/20 text-red-700 dark:text-red-300 border-red-500/30",
  };

  return (
    <div className="space-y-8 prose prose-neutral dark:prose-invert max-w-none">
      <section>
        <h2>Organisation recommandée</h2>
        <div className="not-prose p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-sm mb-4">
          <p className="font-semibold text-yellow-700 dark:text-yellow-300 mb-1">⚠️ Note</p>
          <p className="text-muted-foreground">
            L'organisation présentée ici est une proposition basée sur les besoins identifiés lors de l'audit technique.
            Elle n'est pas formalisée à ce stade et doit être validée par la FENILUTTE.
          </p>
        </div>
        <div className="not-prose grid grid-cols-1 gap-4">
          {roles.map((role, i) => (
            <div key={i} className="p-4 bg-card border border-border/50 rounded-lg">
              <div className="flex items-start justify-between flex-wrap gap-2 mb-2">
                <h3 className="font-semibold">{role.titre}</h3>
                <span className={`px-2 py-0.5 rounded border text-xs font-medium ${prioriteColors[role.priorite] ?? "bg-muted"}`}>
                  {role.priorite}
                </span>
              </div>
              <p className="text-xs text-muted-foreground italic mb-2">📋 {role.statut}</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <p className="text-xs font-medium mb-1">Responsabilités :</p>
                  <ul className="text-xs space-y-0.5 text-muted-foreground">
                    {role.responsabilites.map((r, j) => <li key={j}>• {r}</li>)}
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-medium mb-1">Profil requis :</p>
                  <p className="text-xs text-muted-foreground">{role.profil}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2>Matrice RACI simplifiée</h2>
        <div className="not-prose overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-muted/50">
                <th className="text-left p-2 border border-border/50">Activité</th>
                <th className="text-center p-2 border border-border/50">FENILUTTE</th>
                <th className="text-center p-2 border border-border/50">Lead Dev</th>
                <th className="text-center p-2 border border-border/50">Dev Flutter</th>
                <th className="text-center p-2 border border-border/50">Éditeur</th>
                <th className="text-center p-2 border border-border/50">Arbitre Num.</th>
              </tr>
            </thead>
            <tbody>
              {[
                { activite: "Validation données officielles", feni: "R", dev: "C", flutter: "I", edit: "C", arbitre: "C" },
                { activite: "Développement technique", feni: "A", dev: "R", flutter: "C", edit: "I", arbitre: "I" },
                { activite: "Saisie résultats (live)", feni: "A", dev: "I", flutter: "I", edit: "I", arbitre: "R" },
                { activite: "Publication contenu", feni: "A", dev: "C", flutter: "I", edit: "R", arbitre: "C" },
                { activite: "Sécurité et déploiement", feni: "I", dev: "R", flutter: "C", edit: "I", arbitre: "I" },
                { activite: "Application mobile", feni: "A", dev: "C", flutter: "R", edit: "I", arbitre: "I" },
                { activite: "Décisions stratégiques", feni: "R", dev: "C", flutter: "I", edit: "I", arbitre: "I" },
              ].map((row, i) => (
                <tr key={i} className={i % 2 === 0 ? "bg-background" : "bg-muted/20"}>
                  <td className="p-2 border border-border/50">{row.activite}</td>
                  {[row.feni, row.dev, row.flutter, row.edit, row.arbitre].map((val, j) => (
                    <td key={j} className="p-2 border border-border/50 text-center font-bold">
                      <span className={`${val === "R" ? "text-green-600 dark:text-green-400" : val === "A" ? "text-blue-600 dark:text-blue-400" : "text-muted-foreground"}`}>
                        {val}
                      </span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-xs text-muted-foreground mt-2">
            <strong>R</strong> = Responsable (fait le travail) · <strong>A</strong> = Approbateur (valide) · <strong>C</strong> = Consulté · <strong>I</strong> = Informé
          </p>
        </div>
      </section>

      <section>
        <h2>Gouvernance FENILUTTE</h2>
        <p>
          La Fédération Nigérienne de Lutte Traditionnelle (FENILUTTE) est la structure
          porteuse et garante du projet Kokowa TV. Elle définit les priorités fonctionnelles,
          valide les données officielles des compétitions et représente le projet vis-à-vis
          des partenaires institutionnels et des sponsors.
        </p>
        <p>
          Il est recommandé de mettre en place un <strong>comité technique</strong> réunissant
          un représentant de la FENILUTTE, le Lead Développeur et le Responsable éditorial,
          se réunissant mensuellement hors saison et hebdomadairement pendant les compétitions.
        </p>
      </section>
    </div>
  );
}
