// components/presentation/chapters/ch01-presentation.tsx
import { PRESENTATION_DATA } from "@/lib/presentation/data";

export function ChapterPresentation() {
  const { meta, stackTechnique } = PRESENTATION_DATA;
  return (
    <div className="space-y-8 prose prose-neutral dark:prose-invert max-w-none">
      <section>
        <h2>1.1 Identité du Projet</h2>
        <div className="not-prose grid grid-cols-1 sm:grid-cols-2 gap-4 my-4">
          {[
            { label: "Nom", valeur: meta.titre },
            { label: "Version", valeur: meta.version },
            { label: "Statut", valeur: meta.statut },
            { label: "Périmètre", valeur: "National — Niger" },
          ].map((item) => (
            <div key={item.label} className="bg-card border border-border/50 rounded-xl p-4">
              <p className="text-xs text-muted-foreground mb-1">{item.label}</p>
              <p className="font-semibold text-foreground">{item.valeur}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2>1.2 Nature et Positionnement</h2>
        <p>
          Kokowa TV est une <strong>plateforme numérique complète</strong> dédiée à la gestion opérationnelle,
          à la couverture médiatique en temps réel et à la médiatisation de la <strong>lutte traditionnelle nigérienne</strong>,
          communément appelée <em>Kokowa</em>. La compétition phare gérée est le <strong>Sabre National</strong>,
          championnat annuel opposant les 8 délégations régionales du Niger (Niamey, Zinder, Maradi, Tahoua,
          Dosso, Tillabéri, Agadez et Diffa).
        </p>
        <p>
          La plateforme se distingue des simples sites d&apos;information sportive par sa profondeur fonctionnelle :
          elle intègre un <strong>système de gestion de tournoi complet</strong> (de l&apos;inscription des lutteurs jusqu&apos;à
          la finale), un <strong>module de live-scoring temps réel</strong> avec synchronisation Firebase RTDB
          (latence inférieure à 500ms), un <strong>back-office d&apos;administration</strong> RBAC pour les arbitres,
          éditeurs et gestionnaires, et une <strong>API REST sécurisée</strong> consommée par une application
          mobile Flutter.
        </p>
      </section>

      <section>
        <h2>1.3 Proposition de Valeur</h2>
        <ul>
          <li><strong>Pour les supporters et le grand public :</strong> Accéder en direct aux résultats des combats, suivre leurs lutteurs préférés, lire les actualités et regarder les replays sur le web ou sur mobile.</li>
          <li><strong>Pour la FENILUTTE et les organisateurs :</strong> Disposer d&apos;un outil numérique centralisé pour organiser, arbitrer, documenter et archiver chaque édition du Sabre National avec fiabilité.</li>
          <li><strong>Pour les délégations régionales :</strong> Accéder aux statistiques de leurs lutteurs, gérer les compositions d&apos;équipe et suivre l&apos;avancement du tournoi.</li>
          <li><strong>Pour les médias et partenaires :</strong> Bénéficier d&apos;un accès structuré aux données sportives via l&apos;API mobile, avec des informations fiables, complètes et mises à jour en temps réel.</li>
        </ul>
      </section>

      <section>
        <h2>1.4 État de Développement Actuel</h2>
        <p>
          Le projet est <strong>en production active</strong>. La version 2.0, issue d&apos;une refonte technique et sécuritaire
          complète réalisée en 2026, a résolu l&apos;ensemble des vulnérabilités critiques identifiées lors de l&apos;audit,
          migré le runtime de <code>pnpm</code> vers <code>Bun 1.4+</code>, harmonisé le typage TypeScript (0 erreur de compilation)
          et introduit un middleware de navigation centralisé et testé.
        </p>
      </section>

      <section>
        <h2>1.5 Stack Technique Principale</h2>
        <div className="not-prose overflow-x-auto rounded-xl border border-border/50 my-4">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-muted/50">
                <th className="px-4 py-2.5 text-left font-semibold text-foreground">Technologie</th>
                <th className="px-4 py-2.5 text-left font-semibold text-foreground">Rôle</th>
                <th className="px-4 py-2.5 text-left font-semibold text-foreground">Catégorie</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {stackTechnique.map((s) => (
                <tr key={s.nom} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-2.5 font-mono text-xs font-semibold text-foreground whitespace-nowrap">{s.nom}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{s.role}</td>
                  <td className="px-4 py-2.5">
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full whitespace-nowrap">{s.categorie}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
