// components/presentation/chapters/ch11-modele.tsx
export function ChapterModele() {
  return (
    <div className="space-y-8 prose prose-neutral dark:prose-invert max-w-none">
      <section>
        <h2>Contexte économique actuel</h2>
        <div className="not-prose p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-sm">
          <p className="font-semibold text-yellow-700 dark:text-yellow-300 mb-1">⚠️ Note de transparence</p>
          <p className="text-muted-foreground">
            Le modèle économique de Kokowa TV est en cours de définition formelle.
            Cette section présente les hypothèses de travail et les pistes explorées,
            non un modèle finalisé et validé. Les montants et projections sont des estimations
            indicatives, susceptibles d'évoluer.
          </p>
        </div>
        <p>
          À ce stade, Kokowa TV opère principalement comme un investissement institutionnel
          de la FENILUTTE (Fédération Nigérienne de Lutte Traditionnelle) pour la
          digitalisation du Kokowa. La plateforme n'est pas encore structurée autour
          d'un modèle commercial autonome.
        </p>
      </section>

      <section>
        <h2>Sources de revenus potentielles</h2>
        <div className="not-prose grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            {
              titre: "Publicité & Sponsoring",
              statut: "✅ Infrastructure en place",
              items: [
                "Bannières publicitaires gérées via le back-office",
                "Campagnes avec dates de début et de fin",
                "Ciblage par page et par section",
                "Partenaires potentiels : opérateurs télécom, banques, sponsors sportifs",
              ],
              note: "Le module publicitaire est opérationnel. Aucun contrat commercial actif documenté.",
            },
            {
              titre: "Partenariats institutionnels",
              statut: "🔵 À développer",
              items: [
                "Soutien de la FENILUTTE (structure porteuse)",
                "Subventions ministérielles (Sport, Culture, Numérique)",
                "Partenariats avec des fédérations régionales africaines",
                "Soutien d'organisations de développement (UNESCO, OIF...)",
              ],
              note: "Piste prioritaire compte tenu de la mission culturelle du projet.",
            },
            {
              titre: "Abonnements Premium",
              statut: "🔵 À concevoir",
              items: [
                "Accès aux archives vidéo complètes",
                "Statistiques avancées et analyses de combat",
                "Alertes push personnalisées (lutteur favori, région)",
                "Contenu exclusif en dehors des saisons",
              ],
              note: "Nécessite une base d'utilisateurs active suffisante pour être viable.",
            },
            {
              titre: "Données sportives",
              statut: "🔵 À explorer",
              items: [
                "Vente de données anonymisées à des chercheurs (sport, culture)",
                "Partenariats avec des médias sportifs africains",
                "Intégration dans des plateformes de score africaines",
                "API payante pour des usages tiers",
              ],
              note: "Potentiel à long terme, réglementation RGPD à prévoir.",
            },
          ].map((source, i) => (
            <div key={i} className="p-4 bg-card border border-border/50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-sm">{source.titre}</h3>
                <span className="text-xs">{source.statut}</span>
              </div>
              <ul className="text-xs space-y-1 text-muted-foreground mb-2">
                {source.items.map((item, j) => <li key={j}>• {item}</li>)}
              </ul>
              <p className="text-xs italic text-muted-foreground border-t border-border/30 pt-2">{source.note}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2>Postes de coûts principaux</h2>
        <div className="not-prose overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-muted/50">
                <th className="text-left p-3 border border-border/50">Poste</th>
                <th className="text-left p-3 border border-border/50">Fréquence</th>
                <th className="text-left p-3 border border-border/50">Niveau de coût</th>
              </tr>
            </thead>
            <tbody>
              {[
                { poste: "Infrastructure cloud (Neon, Vercel, Firebase, Upstash)", freq: "Mensuel", niveau: "Maîtrisé (~30-60k FCFA/mois)" },
                { poste: "Maintenance technique et mises à jour de sécurité", freq: "Continu", niveau: "[À DÉFINIR selon ressource]" },
                { poste: "Développement de nouvelles fonctionnalités", freq: "Ponctuel", niveau: "[À DÉFINIR par devis]" },
                { poste: "Production de contenu (articles, vidéos)", freq: "Régulier", niveau: "[À DÉFINIR par équipe éditoriale]" },
                { poste: "Communication et acquisition d'utilisateurs", freq: "Campagnes", niveau: "[À DÉFINIR plan marketing]" },
                { poste: "Nom de domaine et certificats SSL", freq: "Annuel", niveau: "Faible (~15k FCFA/an)" },
              ].map((row, i) => (
                <tr key={i} className={i % 2 === 0 ? "bg-background" : "bg-muted/20"}>
                  <td className="p-3 border border-border/50">{row.poste}</td>
                  <td className="p-3 border border-border/50 text-muted-foreground">{row.freq}</td>
                  <td className="p-3 border border-border/50 text-sm">{row.niveau}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2>Prochaines étapes de structuration</h2>
        <ol>
          <li>Formaliser le modèle économique en partenariat avec la FENILUTTE</li>
          <li>Identifier et approcher les partenaires commerciaux potentiels</li>
          <li>Définir les critères d'activation du module d'abonnement premium</li>
          <li>Établir une politique tarifaire pour l'API et les données sportives</li>
          <li>Consulter un expert juridique pour la conformité RGPD sur les données utilisateurs</li>
        </ol>
      </section>
    </div>
  );
}
