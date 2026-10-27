// components/presentation/chapters/ch05-fonctionnalites.tsx
import { PRESENTATION_DATA } from "@/lib/presentation/data";

export function ChapterFonctionnalites() {
  const { fonctionnalites } = PRESENTATION_DATA;
  return (
    <div className="space-y-8 prose prose-neutral dark:prose-invert max-w-none">
      <section>
        <h2>5.1 Vue d&apos;Ensemble des Fonctionnalités</h2>
        <p>
          Les fonctionnalités sont organisées en six domaines fonctionnels majeurs correspondant aux modules
          opérationnels de la plateforme. Chaque domaine est autonome mais interconnecté aux autres via la
          hiérarchie de données du tournoi.
        </p>
      </section>
      {fonctionnalites.map((domaine, i) => (
        <section key={i} className="not-prose">
          <div className="bg-card border border-border/50 rounded-xl p-5 mb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-foreground">{domaine.domaine}</h3>
              <span className="text-xs font-medium bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20 px-2.5 py-1 rounded-full">
                {domaine.statut}
              </span>
            </div>
            <ul className="space-y-2">
              {domaine.items.map((item, j) => (
                <li key={j} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="text-primary mt-0.5 shrink-0 font-bold">→</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ))}
      <section>
        <h2>5.2 Modèle Hiérarchique du Tournoi</h2>
        <p>
          Toutes les fonctionnalités s&apos;articulent autour d&apos;un modèle de données hiérarchique strict
          qui reflète la structure réelle du Sabre National :
        </p>
        <div className="not-prose bg-muted/30 rounded-xl p-5 font-mono text-sm my-4 overflow-x-auto">
          <pre className="text-muted-foreground leading-relaxed">{`COMPÉTITIONS
  └── ÉDITIONS (ex: 45ème Sabre National - Agadez 2024)
        └── PHASES (Poules, Quarts, Demies, Finale)
              └── GROUPES DE PHASE (Journée A, B, C...)
                    └── SOUS-GROUPES (Niamey vs Zinder)
                          └── MATCHS (Combat individuel)
                                └── CARTONS (Sanctions)`}</pre>
        </div>
        <p>
          Les <strong>lutteurs</strong> (<code>edition_fighters</code>) sont associés à chaque édition
          avec leur statut d&apos;élimination (<code>is_eliminated</code>). Les <strong>régions</strong>
          accumulent des scores collectifs au fil des confrontations en phases de poules.
        </p>
      </section>
    </div>
  );
}
