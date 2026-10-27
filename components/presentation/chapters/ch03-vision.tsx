// components/presentation/chapters/ch03-vision.tsx
export function ChapterVision() {
  return (
    <div className="space-y-8 prose prose-neutral dark:prose-invert max-w-none">
      <section>
        <h2>3.1 Vision</h2>
        <blockquote>
          Faire de Kokowa TV la référence numérique incontournable de la lutte traditionnelle en Afrique de l&apos;Ouest,
          en valorisant le patrimoine culturel nigérien, en connectant ses supporters à leurs champions et en dotant
          la FENILUTTE d&apos;outils de gestion sportive dignes des meilleures ligues continentales.
        </blockquote>
      </section>
      <section>
        <h2>3.2 Mission</h2>
        <ul>
          <li>Digitaliser intégralement la gestion du Sabre National et des compétitions de lutte traditionnelle au Niger.</li>
          <li>Offrir aux supporters une expérience immersive et temps réel sur le web et sur mobile.</li>
          <li>Fournir à la FENILUTTE, aux arbitres et aux délégations régionales des outils fiables, sécurisés et accessibles.</li>
          <li>Constituer une mémoire numérique du Kokowa avec archives, statistiques et palmarès des athlètes.</li>
        </ul>
      </section>
      <section>
        <h2>3.3 Objectifs Stratégiques</h2>
        <div className="not-prose space-y-4 my-4">
          {[
            {
              horizon: "Court terme (0 — 6 mois)",
              emoji: "⚡",
              objectifs: [
                "Stabiliser et sécuriser la plateforme pour la prochaine édition du Sabre National",
                "Appliquer la migration des index de performance en production (migration 007)",
                "Configurer les alertes de surveillance Firebase et Neon",
                "Former les référents techniques de la FENILUTTE à l'utilisation du back-office",
              ],
            },
            {
              horizon: "Moyen terme (6 — 18 mois)",
              emoji: "🔧",
              objectifs: [
                "Déployer le module de génération automatique des tableaux de tournoi (bracket tree)",
                "Lancer officiellement l'application mobile Flutter sur App Store & Play Store",
                "Intégrer un module de statistiques avancées et de visualisation des performances",
                "Étendre la couverture aux compétitions régionales et aux tournois annexes",
              ],
            },
            {
              horizon: "Long terme (18 — 36 mois)",
              emoji: "🚀",
              objectifs: [
                "Intégrer la diffusion vidéo en direct (streaming live des combats)",
                "Développer des partenariats avec les médias audiovisuels nationaux",
                "Envisager une extension régionale (Afrique de l'Ouest, diaspora nigérienne)",
                "Assurer la pérennité financière par la diversification des revenus",
              ],
            },
          ].map((horizon) => (
            <div key={horizon.horizon} className="bg-card border border-border/50 rounded-xl p-5">
              <h3 className="text-base font-bold text-foreground mb-3">
                {horizon.emoji} {horizon.horizon}
              </h3>
              <ul className="space-y-1">
                {horizon.objectifs.map((obj, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="text-primary mt-0.5 shrink-0">→</span>
                    <span>{obj}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
      <section>
        <h2>3.4 Indicateurs de Succès (KPIs)</h2>
        <ul>
          <li>Disponibilité de la plateforme : <strong>&gt; 99% durant le Sabre National</strong></li>
          <li>Latence de live-scoring : <strong>&lt; 500ms de bout en bout</strong></li>
          <li>Couverture des combats : <strong>100% des matchs saisis en temps réel</strong></li>
          <li>Téléchargements de l&apos;application mobile : <strong>[Cible à définir avec la FENILUTTE]</strong></li>
          <li>Articles publiés par édition : <strong>[Cible à définir avec l&apos;équipe éditoriale]</strong></li>
        </ul>
      </section>
    </div>
  );
}
