// components/presentation/chapters/ch12-financement.tsx
import { PRESENTATION_DATA, type BudgetScenario, type BudgetLine } from "@/lib/presentation/data";

const typeColors: Record<string, string> = {
  annuel: "bg-blue-500/20 text-blue-700 dark:text-blue-300",
  mensuel: "bg-purple-500/20 text-purple-700 dark:text-purple-300",
  ponctuel: "bg-orange-500/20 text-orange-700 dark:text-orange-300",
  investissement: "bg-red-500/20 text-red-700 dark:text-red-300",
};

const scenarioBorderColors = [
  "border-green-500/40 bg-green-500/5",
  "border-blue-500/40 bg-blue-500/5",
  "border-purple-500/40 bg-purple-500/5",
];

const scenarioHeaderColors = [
  "bg-green-500/20 text-green-700 dark:text-green-300",
  "bg-blue-500/20 text-blue-700 dark:text-blue-300",
  "bg-purple-500/20 text-purple-700 dark:text-purple-300",
];

function BudgetTable({ scenario, colorIndex }: { scenario: BudgetScenario; colorIndex: number }) {
  return (
    <div className={`rounded-xl border ${scenarioBorderColors[colorIndex]} overflow-hidden`}>
      <div className={`px-4 py-3 ${scenarioHeaderColors[colorIndex]}`}>
        <div className="flex items-start justify-between flex-wrap gap-2">
          <div>
            <h3 className="font-bold">{scenario.nom}</h3>
            <p className="text-sm opacity-80">Durée : {scenario.duree}</p>
          </div>
          <div className="text-right">
            <p className="font-bold text-lg">{scenario.totalEstime}</p>
            <p className="text-xs opacity-70">estimation totale</p>
          </div>
        </div>
        <p className="text-sm mt-2 opacity-90">{scenario.description}</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-muted/50">
              <th className="text-left p-3 border border-border/50">Poste</th>
              <th className="text-left p-3 border border-border/50">Description</th>
              <th className="text-left p-3 border border-border/50">Qté / Durée</th>
              <th className="text-left p-3 border border-border/50">Coût unitaire</th>
              <th className="text-left p-3 border border-border/50">Total estimé</th>
              <th className="text-left p-3 border border-border/50">Type</th>
            </tr>
          </thead>
          <tbody>
            {scenario.lignes.map((ligne: BudgetLine, i: number) => (
              <tr key={i} className={i % 2 === 0 ? "bg-background" : "bg-muted/20"}>
                <td className="p-3 border border-border/50 font-medium text-xs">{ligne.poste}</td>
                <td className="p-3 border border-border/50 text-xs text-muted-foreground">
                  {ligne.description}
                  {ligne.hypothese && (
                    <span className="block mt-1 italic text-[10px] opacity-70">
                      💡 {ligne.hypothese}
                    </span>
                  )}
                </td>
                <td className="p-3 border border-border/50 text-xs text-muted-foreground">{ligne.quantite ?? "—"}</td>
                <td className="p-3 border border-border/50 text-xs text-muted-foreground">{ligne.coutUnitaire ?? "—"}</td>
                <td className="p-3 border border-border/50 text-xs font-medium">{ligne.total ?? "—"}</td>
                <td className="p-3 border border-border/50">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${typeColors[ligne.type] ?? "bg-muted"}`}>
                    {ligne.type}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function ChapterFinancement() {
  return (
    <div className="space-y-8 prose prose-neutral dark:prose-invert max-w-none">
      <section>
        <h2>Besoins en financement — Introduction</h2>
        <div className="not-prose p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg text-sm mb-4">
          <p className="font-semibold text-blue-700 dark:text-blue-300 mb-1">📋 Note méthodologique</p>
          <p className="text-muted-foreground">
            Les montants présentés dans ce chapitre sont des <strong>estimations indicatives</strong>,
            basées sur les tarifs publics des services cloud au moment de la rédaction (octobre 2026)
            et des hypothèses de charge raisonnables pour une organisation sportive nationale.
            Ils ne constituent en aucun cas des devis contractuels.
            Les postes marqués <strong>[À DÉFINIR]</strong> nécessitent une évaluation spécifique
            (appel d'offres, devis développeur, décision FENILUTTE).
            Les taux de conversion USD/FCFA utilisés sont indicatifs (~600 FCFA/USD).
          </p>
        </div>
        <p>
          Trois scénarios de financement ont été élaborés en fonction des ambitions
          et des capacités d'investissement de la FENILUTTE et de ses partenaires.
          Chaque scénario est autonome et peut être mis en œuvre indépendamment.
        </p>
      </section>

      <section>
        <h2>Comparatif des scénarios</h2>
        <div className="not-prose grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {PRESENTATION_DATA.budgetScenarios.map((scenario, i) => (
            <div key={i} className={`p-4 rounded-xl border ${scenarioBorderColors[i]} text-center`}>
              <p className={`text-xs font-medium px-2 py-0.5 rounded-full inline-block mb-2 ${scenarioHeaderColors[i]}`}>
                Scénario {i + 1}
              </p>
              <p className="font-bold text-sm mb-1">{scenario.nom.split("—")[0].trim()}</p>
              <p className="text-lg font-bold">{scenario.totalEstime}</p>
              <p className="text-xs text-muted-foreground mt-1">sur {scenario.duree}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2>Détail par scénario</h2>
        <div className="not-prose space-y-6">
          {PRESENTATION_DATA.budgetScenarios.map((scenario, i) => (
            <BudgetTable key={i} scenario={scenario} colorIndex={i} />
          ))}
        </div>
      </section>

      <section>
        <h2>Sources de financement recommandées</h2>
        <div className="not-prose grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { type: "Institutionnel", icon: "🏛️", items: ["Budget de la FENILUTTE (cotisations fédérales)", "Subvention du Ministère de la Jeunesse et des Sports du Niger", "Fonds de soutien au numérique (ANFICT, ANSI)", "Coopération internationale (Francophonie, UNESCO, UA)"] },
            { type: "Partenariat privé", icon: "🤝", items: ["Opérateurs télécom (Airtel, Orange, Moov Niger)", "Banques et institutions financières nigériennes", "Entreprises agroalimentaires et FMCG présentes au Niger", "Sponsors de compétitions sportives africaines"] },
            { type: "Financement participatif", icon: "🌍", items: ["Diaspora nigérienne (liens culturels forts)", "Crowdfunding via plateformes africaines", "Micro-dons lors des retransmissions de compétitions", "Communauté internationale des arts martiaux traditionnels"] },
            { type: "Revenus propres", icon: "💡", items: ["Activation du module publicitaire (déjà opérationnel)", "Abonnements premium (à concevoir)", "Licences de données sportives", "Prestations de service technique à d'autres fédérations"] },
          ].map((src, i) => (
            <div key={i} className="p-4 bg-card border border-border/50 rounded-lg">
              <h3 className="font-semibold text-sm mb-2">{src.icon} {src.type}</h3>
              <ul className="text-xs space-y-1 text-muted-foreground">
                {src.items.map((item, j) => <li key={j}>• {item}</li>)}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2>Priorités d'investissement</h2>
        <p>
          Quelle que soit la capacité de financement mobilisée, les priorités d'investissement
          doivent être respectées dans l'ordre suivant :
        </p>
        <ol>
          <li><strong>Priorité 1 — Infrastructure minimale</strong> : Assurer la continuité de service (hébergement cloud, domaine, SSL). Sans cela, la plateforme est inaccessible.</li>
          <li><strong>Priorité 2 — Maintenance sécurité</strong> : Maintenir les mises à jour de sécurité et les corrections critiques. La sécurité des données des utilisateurs est non négociable.</li>
          <li><strong>Priorité 3 — Application mobile</strong> : Finaliser et publier l'application Flutter sur les stores pour maximiser la portée auprès du public.</li>
          <li><strong>Priorité 4 — Nouvelles fonctionnalités</strong> : Génération automatique des tableaux, statistiques avancées, streaming live. Investissements à fort impact.</li>
          <li><strong>Priorité 5 — Communication</strong> : Promouvoir la plateforme auprès du public nigérien et de la diaspora.</li>
        </ol>
      </section>

      <section>
        <h2>Retour sur investissement attendu</h2>
        <p>
          Le ROI de Kokowa TV doit être mesuré à deux niveaux complémentaires :
        </p>
        <div className="not-prose grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-card border border-border/50 rounded-lg">
            <h3 className="font-semibold text-sm mb-2">📊 ROI Financier</h3>
            <ul className="text-xs space-y-1 text-muted-foreground">
              <li>• Revenus publicitaires activables dès la prochaine édition</li>
              <li>• Réduction des coûts de communication traditionnels de la FENILUTTE</li>
              <li>• Attractivité augmentée pour les sponsors de compétitions</li>
              <li>• Potentiel d'abonnements premium sur la base d'une audience fidèle</li>
            </ul>
          </div>
          <div className="p-4 bg-card border border-border/50 rounded-lg">
            <h3 className="font-semibold text-sm mb-2">🌍 ROI Institutionnel & Culturel</h3>
            <ul className="text-xs space-y-1 text-muted-foreground">
              <li>• Rayonnement international du Kokowa nigérien</li>
              <li>• Préservation numérique des archives (depuis 1975)</li>
              <li>• Renforcement de l'identité culturelle nationale</li>
              <li>• Attractivité renforcée pour les partenaires de développement</li>
              <li>• Modernisation de la gouvernance sportive nationale</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
