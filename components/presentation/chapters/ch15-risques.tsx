// components/presentation/chapters/ch15-risques.tsx
import { PRESENTATION_DATA } from "@/lib/presentation/data";

const impactColors: Record<string, string> = {
  "Critique": "bg-red-500/20 text-red-700 dark:text-red-300 border-red-500/30",
  "Élevé": "bg-orange-500/20 text-orange-700 dark:text-orange-300 border-orange-500/30",
  "Moyen": "bg-yellow-500/20 text-yellow-700 dark:text-yellow-300 border-yellow-500/30",
  "Faible": "bg-green-500/20 text-green-700 dark:text-green-300 border-green-500/30",
};

const probColors: Record<string, string> = {
  "Faible": "text-green-600 dark:text-green-400",
  "Moyen": "text-yellow-600 dark:text-yellow-400",
  "Élevé": "text-red-600 dark:text-red-400",
};

export function ChapterRisques() {
  return (
    <div className="space-y-8 prose prose-neutral dark:prose-invert max-w-none">
      <section>
        <h2>Registre des risques</h2>
        <p>
          Ce registre identifie les risques principaux pesant sur la continuité
          et le développement de Kokowa TV, avec leurs mesures d'atténuation.
          Il doit être révisé avant chaque édition du Sabre National.
        </p>
      </section>

      <section>
        <div className="not-prose overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-muted/50">
                <th className="text-left p-3 border border-border/50">Catégorie</th>
                <th className="text-left p-3 border border-border/50">Risque</th>
                <th className="text-left p-3 border border-border/50">Impact</th>
                <th className="text-left p-3 border border-border/50">Probabilité</th>
                <th className="text-left p-3 border border-border/50">Mesure d'atténuation</th>
              </tr>
            </thead>
            <tbody>
              {PRESENTATION_DATA.risques.map((risque, i) => (
                <tr key={i} className={i % 2 === 0 ? "bg-background" : "bg-muted/20"}>
                  <td className="p-3 border border-border/50">
                    <span className="px-2 py-0.5 rounded-full text-xs bg-primary/10 text-primary">{risque.categorie}</span>
                  </td>
                  <td className="p-3 border border-border/50 font-medium text-sm">{risque.risque}</td>
                  <td className="p-3 border border-border/50">
                    <span className={`px-2 py-0.5 rounded border text-xs font-medium ${impactColors[risque.impact] ?? "bg-muted"}`}>
                      {risque.impact}
                    </span>
                  </td>
                  <td className={`p-3 border border-border/50 font-medium text-sm ${probColors[risque.probabilite] ?? ""}`}>
                    {risque.probabilite}
                  </td>
                  <td className="p-3 border border-border/50 text-sm text-muted-foreground">{risque.mesure}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2>Matrice risques — Synthèse visuelle</h2>
        <div className="not-prose grid grid-cols-3 gap-2 text-center text-xs">
          <div />
          <div className="font-medium text-muted-foreground py-2">Probabilité Faible</div>
          <div className="font-medium text-muted-foreground py-2">Probabilité Moyen/Élevé</div>
          <div className="font-medium text-muted-foreground flex items-center justify-end pr-2">Impact Élevé / Critique</div>
          <div className="p-2 bg-orange-500/20 rounded border border-orange-500/30 text-orange-700 dark:text-orange-300">
            ⚠️ Risque important — Surveiller<br/>
            <span className="text-[10px] text-muted-foreground">Compromission clé Firebase</span>
          </div>
          <div className="p-2 bg-red-500/20 rounded border border-red-500/30 text-red-700 dark:text-red-300">
            🔴 Risque critique — Traiter en priorité<br/>
            <span className="text-[10px] text-muted-foreground">Quota Firebase finale, Maintenance non assurée</span>
          </div>
          <div className="font-medium text-muted-foreground flex items-center justify-end pr-2">Impact Moyen</div>
          <div className="p-2 bg-green-500/20 rounded border border-green-500/30 text-green-700 dark:text-green-300">
            ✅ Risque faible — Accepter<br/>
            <span className="text-[10px] text-muted-foreground">Indisponibilité Neon</span>
          </div>
          <div className="p-2 bg-yellow-500/20 rounded border border-yellow-500/30 text-yellow-700 dark:text-yellow-300">
            🟡 Risque modéré — Atténuer<br/>
            <span className="text-[10px] text-muted-foreground">Dépassement quotas cloud, Adoption mobile</span>
          </div>
        </div>
      </section>

      <section>
        <h2>Plan de continuité d'activité</h2>
        <p>
          En cas d'incident majeur pendant le Sabre National, la procédure suivante
          doit être appliquée :
        </p>
        <ol>
          <li><strong>Indisponibilité Neon</strong> : Le retry automatique avec backoff exponentiel gère les interruptions courtes (&lt; 30s). En cas de panne prolongée, basculement manuel sur une instance de secours.</li>
          <li><strong>Dépassement quota Firebase RTDB</strong> : Activation manuelle du tier Blaze depuis la console Firebase. Délai : &lt; 15 minutes.</li>
          <li><strong>Faille de sécurité détectée</strong> : Isolation immédiate de l'endpoint concerné, notification de la FENILUTTE, correction sous 24h.</li>
          <li><strong>Perte d'accès aux secrets</strong> : Récupération via le gestionnaire de secrets Vercel/Railway. Rotation des clés Firebase si compromission suspectée.</li>
        </ol>
      </section>
    </div>
  );
}
