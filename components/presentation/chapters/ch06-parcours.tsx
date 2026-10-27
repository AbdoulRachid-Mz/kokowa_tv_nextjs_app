// components/presentation/chapters/ch06-parcours.tsx
export function ChapterParcours() {
  const parcours = [
    {
      titre: "Parcours Supporter — Suivre un combat en direct",
      emoji: "📺",
      etapes: [
        { action: "Accéder au portail web public ou ouvrir l'application Flutter", acteur: "Supporter" },
        { action: "Naviguer vers la page de l'édition en cours du Sabre National", acteur: "Supporter" },
        { action: "Consulter le programme des combats du jour (matin / soir)", acteur: "Supporter" },
        { action: "Ouvrir la page du combat (match) de son choix", acteur: "Supporter" },
        { action: "Voir le score en direct synchronisé depuis Firebase RTDB (< 500ms)", acteur: "Système" },
        { action: "Commenter le combat via le tchat intégré", acteur: "Supporter authentifié" },
        { action: "Liker le combat ou ajouter son lutteur en favori", acteur: "Supporter authentifié" },
      ],
    },
    {
      titre: "Parcours Arbitre — Saisir le résultat d'un combat",
      emoji: "👨‍⚖️",
      etapes: [
        { action: "Se connecter au back-office /ad avec ses identifiants (rôle moderator)", acteur: "Arbitre" },
        { action: "Accéder à la page du match en cours depuis la liste des matchs", acteur: "Arbitre" },
        { action: "Démarrer le chronomètre de combat via le bouton de contrôle", acteur: "Arbitre" },
        { action: "Enregistrer un avertissement si nécessaire (carton jaune/rouge)", acteur: "Arbitre" },
        { action: "Désigner le vainqueur (chute, points, disqualification ou forfait)", acteur: "Arbitre" },
        { action: "Confirmer le résultat → Mise à jour instantanée Firebase RTDB + PostgreSQL", acteur: "Système" },
        { action: "Le statut du lutteur perdant est mis à jour (is_eliminated si éliminatoire)", acteur: "Système" },
      ],
    },
    {
      titre: "Parcours Administrateur — Organiser une phase éliminatoire",
      emoji: "🏗️",
      etapes: [
        { action: "Créer une nouvelle phase (ex: Quarts de Finale) pour l'édition en cours", acteur: "Admin" },
        { action: "Créer un groupe de phase et accéder à la page Organisation", acteur: "Admin" },
        { action: "Sélectionner les lutteurs non éliminés via le sélecteur avec recherche et filtre région", acteur: "Admin" },
        { action: "Apparier deux lutteurs pour créer un combat (avec choix du créneau matin/soir)", acteur: "Admin" },
        { action: "Le système crée automatiquement le sous-groupe régional si nécessaire", acteur: "Système" },
        { action: "Le match est créé avec statut 'scheduled' et apparaît dans la liste", acteur: "Système" },
        { action: "Les matchs nouvellement créés sont visibles en temps réel par l'équipe", acteur: "Arbitres / Éditeurs" },
      ],
    },
  ];

  return (
    <div className="space-y-8 prose prose-neutral dark:prose-invert max-w-none">
      <section>
        <h2>6.1 Principaux Parcours Utilisateurs</h2>
        <p>
          Les parcours ci-dessous correspondent au fonctionnement réel du système tel qu&apos;implémenté
          dans le code. Ils permettent de comprendre les interactions entre les différents acteurs et
          les composants de la plateforme.
        </p>
      </section>
      {parcours.map((p, i) => (
        <section key={i} className="not-prose">
          <div className="bg-card border border-border/50 rounded-xl p-5 mb-2">
            <h3 className="font-bold text-foreground text-base mb-4 flex items-center gap-2">
              <span>{p.emoji}</span> {p.titre}
            </h3>
            <ol className="space-y-3">
              {p.etapes.map((e, j) => (
                <li key={j} className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center mt-0.5">
                    {j + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground leading-snug">{e.action}</p>
                    <span className="text-xs text-muted-foreground italic">{e.acteur}</span>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>
      ))}
      <section>
        <h2>6.2 Cycle de Vie d&apos;un Match</h2>
        <div className="not-prose flex flex-wrap items-center gap-2 my-4 text-sm font-mono">
          {["scheduled", "→", "live", "→", "completed"].map((step, i) => (
            <span
              key={i}
              className={
                step === "→"
                  ? "text-muted-foreground"
                  : i === 0
                  ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 px-3 py-1.5 rounded-lg border border-blue-500/20"
                  : i === 2
                  ? "bg-orange-500/10 text-orange-600 dark:text-orange-400 px-3 py-1.5 rounded-lg border border-orange-500/20"
                  : "bg-green-500/10 text-green-600 dark:text-green-400 px-3 py-1.5 rounded-lg border border-green-500/20"
              }
            >
              {step}
            </span>
          ))}
          <span className="text-muted-foreground text-xs ml-2">ou cancelled / interrupted</span>
        </div>
        <p className="text-sm text-muted-foreground">
          Un match passe de <code>scheduled</code> (programmé) à <code>live</code> (en cours) lors du démarrage
          du chronomètre, puis à <code>completed</code> à la désignation du vainqueur. Chaque transition
          déclenche une mise à jour synchrone en base PostgreSQL ET en temps réel sur Firebase RTDB.
        </p>
      </section>
    </div>
  );
}
