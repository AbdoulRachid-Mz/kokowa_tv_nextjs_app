// components/presentation/chapters/ch17-conclusion.tsx
import { PRESENTATION_DATA } from "@/lib/presentation/data";

export function ChapterConclusion() {
  return (
    <div className="space-y-8 prose prose-neutral dark:prose-invert max-w-none">
      <section>
        <h2>Synthèse de la valeur</h2>
        <p>
          Kokowa TV est aujourd&apos;hui une plateforme web et mobile professionnelle,
          sécurisée et opérationnelle, dédiée à la lutte traditionnelle nigérienne — le Kokowa.
          Elle représente un investissement structurant pour la FENILUTTE et pour la
          préservation du patrimoine sportif et culturel du Niger.
        </p>
        <div className="not-prose grid grid-cols-1 md:grid-cols-3 gap-4 my-6">
          {[
            { chiffre: "9/9", label: "Vulnérabilités sécurité résolues", couleur: "green" },
            { chiffre: "17/17", label: "Tests unitaires passés", couleur: "blue" },
            { chiffre: "0", label: "Erreur TypeScript en production", couleur: "purple" },
          ].map((stat, i) => (
            <div key={i} className={`p-6 rounded-xl border text-center ${
              stat.couleur === "green" ? "border-green-500/40 bg-green-500/10" :
              stat.couleur === "blue" ? "border-blue-500/40 bg-blue-500/10" :
              "border-purple-500/40 bg-purple-500/10"
            }`}>
              <p className={`text-4xl font-bold ${
                stat.couleur === "green" ? "text-green-600 dark:text-green-400" :
                stat.couleur === "blue" ? "text-blue-600 dark:text-blue-400" :
                "text-purple-600 dark:text-purple-400"
              }`}>{stat.chiffre}</p>
              <p className="text-sm text-muted-foreground mt-2">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2>État actuel — En production</h2>
        <p>
          La plateforme est <strong>en production active</strong>. Elle gère en temps réel
          les compétitions de lutte, les résultats des combats et le contenu éditorial.
          L&apos;API mobile est opérationnelle et prête à servir l&apos;application Flutter.
        </p>
        <div className="not-prose grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { titre: "✅ Ce qui est opérationnel", items: [
              "Gestion complète des tournois, phases et combats",
              "Saisie des résultats en temps réel (Firebase RTDB < 100ms)",
              "Back-office multi-rôles sécurisé (5 rôles RBAC)",
              "API mobile documentée pour Flutter",
              "Module publicitaire et contenu éditorial",
              "Archives des éditions depuis 1975",
              "Authentification sécurisée (Firebase Auth)",
            ]},
            { titre: "🔵 Ce qui est prévu", items: [
              "Publication de l'application Flutter sur les stores",
              "Génération automatique des tableaux de tournoi",
              "Module statistiques avancées",
              "Streaming vidéo live des combats",
              "Couverture de toutes les compétitions régionales",
              "Structuration formelle du modèle économique",
              "Équipe permanente technique et éditoriale",
            ]},
          ].map((col, i) => (
            <div key={i} className="p-4 bg-card border border-border/50 rounded-lg">
              <h3 className="font-semibold text-sm mb-2">{col.titre}</h3>
              <ul className="text-xs space-y-1 text-muted-foreground">
                {col.items.map((item, j) => <li key={j}>• {item}</li>)}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2>Appel à l&apos;action</h2>
        <div className="not-prose space-y-4">
          {[
            {
              type: "💰 Financement",
              desc: "La pérennité de Kokowa TV repose sur un financement minimal couvrant l'infrastructure cloud et la maintenance technique. Le Scénario Minimal (2,5 à 4 millions FCFA) garantit la continuité de service pour une année complète.",
              cta: "→ Consulter le chapitre Financement pour les détails budgétaires",
              couleur: "green",
            },
            {
              type: "🤝 Partenariat institutionnel",
              desc: "La FENILUTTE, le Ministère de la Jeunesse et des Sports, et les institutions culturelles peuvent s'appuyer sur Kokowa TV comme outil officiel de valorisation du Kokowa nigérien.",
              cta: "→ Contact disponible via la FENILUTTE",
              couleur: "blue",
            },
            {
              type: "🛠️ Collaboration technique",
              desc: "Développeurs, DevOps et spécialistes Flutter souhaitant contribuer à la préservation du patrimoine sportif nigérien sont les bienvenus. Le code est professionnel, documenté et testé.",
              cta: "→ Consulter la documentation technique dans le dépôt Git",
              couleur: "purple",
            },
          ].map((action, i) => (
            <div key={i} className={`p-4 rounded-xl border ${
              action.couleur === "green" ? "border-green-500/40 bg-green-500/10" :
              action.couleur === "blue" ? "border-blue-500/40 bg-blue-500/10" :
              "border-purple-500/40 bg-purple-500/10"
            }`}>
              <h3 className="font-semibold mb-1">{action.type}</h3>
              <p className="text-sm text-muted-foreground mb-2">{action.desc}</p>
              <p className={`text-sm font-medium ${
                action.couleur === "green" ? "text-green-700 dark:text-green-300" :
                action.couleur === "blue" ? "text-blue-700 dark:text-blue-300" :
                "text-purple-700 dark:text-purple-300"
              }`}>{action.cta}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2>Remerciements</h2>
        <p>
          Ce projet est rendu possible grâce à l&apos;engagement de la{" "}
          <strong>Fédération Nigérienne de Lutte Traditionnelle (FENILUTTE)</strong>,
          gardienne du patrimoine sportif et culturel du Kokowa nigérien.
        </p>
        <p>
          Kokowa TV est un hommage numérique aux lutteurs qui perpétuent depuis des
          générations cet art martial traditionnel, à leurs familles, à leurs régions
          et à tous les passionnés du Kokowa au Niger et à travers le monde.
        </p>
        <div className="not-prose text-center py-8">
          <p className="text-4xl mb-4">🏆</p>
          <p className="text-xl font-bold">{PRESENTATION_DATA.meta.slogan}</p>
          <p className="text-sm text-muted-foreground mt-2">{PRESENTATION_DATA.meta.titre} — {PRESENTATION_DATA.meta.version}</p>
        </div>
      </section>
    </div>
  );
}
