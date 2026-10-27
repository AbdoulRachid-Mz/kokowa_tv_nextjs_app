// components/presentation/chapters/ch16-indicateurs.tsx
import { PRESENTATION_DATA } from "@/lib/presentation/data";

export function ChapterIndicateurs() {
  const statutColors: Record<string, string> = {
    "À mesurer": "bg-yellow-500/20 text-yellow-700 dark:text-yellow-300",
    "À instrumenter": "bg-orange-500/20 text-orange-700 dark:text-orange-300",
  };

  function getStatutColor(statut: string): string {
    if (statut.startsWith("✅")) return "bg-green-500/20 text-green-700 dark:text-green-300";
    if (statut.includes("mesuré")) return "bg-blue-500/20 text-blue-700 dark:text-blue-300";
    return statutColors[statut] ?? "bg-muted text-muted-foreground";
  }

  const categories = Array.from(new Set(PRESENTATION_DATA.indicateurs.map((i) => i.categorie)));

  return (
    <div className="space-y-8 prose prose-neutral dark:prose-invert max-w-none">
      <section>
        <h2>Indicateurs de performance (KPIs)</h2>
        <p>
          Ces indicateurs permettent de mesurer objectivement la qualité, la performance
          et l&apos;adoption de la plateforme Kokowa TV. Certains sont déjà mesurés grâce
          à l&apos;infrastructure en place. D&apos;autres nécessitent la mise en place d&apos;un
          système de monitoring dédié.
        </p>
        <div className="not-prose flex gap-4 flex-wrap">
          <div className="px-4 py-3 bg-green-500/10 border border-green-500/30 rounded-lg text-center">
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {PRESENTATION_DATA.indicateurs.filter(i => i.statut.startsWith("✅") || i.statut.includes("mesuré")).length}
            </p>
            <p className="text-xs text-muted-foreground">KPIs mesurés</p>
          </div>
          <div className="px-4 py-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-center">
            <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
              {PRESENTATION_DATA.indicateurs.filter(i => i.statut === "À mesurer" || i.statut === "À instrumenter").length}
            </p>
            <p className="text-xs text-muted-foreground">KPIs à instrumenter</p>
          </div>
          <div className="px-4 py-3 bg-blue-500/10 border border-blue-500/30 rounded-lg text-center">
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{PRESENTATION_DATA.indicateurs.length}</p>
            <p className="text-xs text-muted-foreground">KPIs total</p>
          </div>
        </div>
      </section>

      <section>
        <h2>Tableau complet des KPIs</h2>
        <div className="not-prose overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-muted/50">
                <th className="text-left p-3 border border-border/50">Catégorie</th>
                <th className="text-left p-3 border border-border/50">Indicateur</th>
                <th className="text-left p-3 border border-border/50">Cible</th>
                <th className="text-left p-3 border border-border/50">Statut actuel</th>
              </tr>
            </thead>
            <tbody>
              {PRESENTATION_DATA.indicateurs.map((kpi, i) => (
                <tr key={i} className={i % 2 === 0 ? "bg-background" : "bg-muted/20"}>
                  <td className="p-3 border border-border/50">
                    <span className="px-2 py-0.5 rounded-full text-xs bg-primary/10 text-primary">{kpi.categorie}</span>
                  </td>
                  <td className="p-3 border border-border/50 font-medium text-sm">{kpi.indicateur}</td>
                  <td className="p-3 border border-border/50 text-sm text-muted-foreground">{kpi.cible}</td>
                  <td className="p-3 border border-border/50">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatutColor(kpi.statut)}`}>
                      {kpi.statut}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2>KPIs par catégorie</h2>
        <div className="not-prose grid grid-cols-1 md:grid-cols-2 gap-4">
          {categories.map((cat) => {
            const kpis = PRESENTATION_DATA.indicateurs.filter((k) => k.categorie === cat);
            return (
              <div key={cat} className="p-4 bg-card border border-border/50 rounded-lg">
                <h3 className="font-semibold text-sm mb-2">{cat}</h3>
                {kpis.map((kpi, i) => (
                  <div key={i} className="text-xs text-muted-foreground flex items-center justify-between gap-2 py-1 border-b border-border/20 last:border-0">
                    <span>{kpi.indicateur}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] ${getStatutColor(kpi.statut)}`}>{kpi.statut.replace("✅ ", "")}</span>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <h2>Recommandations pour le monitoring</h2>
        <ul>
          <li><strong>Uptime Robot ou BetterUptime</strong> : Surveillance de la disponibilité de la plateforme web et de l&apos;API mobile. Alertes SMS/email en cas de panne.</li>
          <li><strong>Vercel Analytics</strong> : Mesure du Web Vitals (LCP, FID, CLS), temps de réponse des pages et des Server Actions.</li>
          <li><strong>Firebase Performance Monitoring</strong> : Mesure de la latence des appels API depuis l&apos;application Flutter.</li>
          <li><strong>Neon Database Insights</strong> : Monitoring des requêtes lentes, du nombre de connexions et de l&apos;espace disque utilisé.</li>
          <li><strong>Upstash Console</strong> : Suivi du rate limiting et des tentatives d&apos;abus.</li>
        </ul>
      </section>
    </div>
  );
}
