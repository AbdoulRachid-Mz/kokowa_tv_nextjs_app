// components/presentation/chapters/ch02-contexte.tsx
export function ChapterContexte() {
  return (
    <div className="space-y-8 prose prose-neutral dark:prose-invert max-w-none">
      <section>
        <h2>2.1 Un Sport Ancré dans la Culture Nigérienne</h2>
        <p>
          La lutte traditionnelle nigérienne, le <strong>Kokowa</strong>, est bien plus qu&apos;un sport : c&apos;est une pratique
          culturelle millénaire transmise de génération en génération dans les 8 régions du Niger. Le{" "}
          <strong>Sabre National</strong>, organisé annuellement par la Fédération Nigérienne de Lutte Traditionnelle
          (FENILUTTE), est l&apos;événement sportif national le plus suivi du pays, rassemblant des centaines de lutteurs
          et des dizaines de milliers de supporters à travers tout le territoire.
        </p>
      </section>

      <section>
        <h2>2.2 Problèmes Identifiés Avant Kokowa TV</h2>
        <p>Avant la mise en place d&apos;une solution numérique dédiée, la gestion du Sabre National faisait face à plusieurs limitations importantes :</p>
        <ul>
          <li><strong>Gestion manuelle des combats :</strong> Les tableaux de matchs, les scores et les résultats étaient gérés sur papier ou avec des outils bureautiques non adaptés aux contraintes d&apos;un tournoi en direct.</li>
          <li><strong>Absence de diffusion en temps réel :</strong> Les supporters qui ne pouvaient pas se déplacer sur les sites de combat n&apos;avaient aucun moyen fiable de suivre les résultats en direct.</li>
          <li><strong>Perte d&apos;informations historiques :</strong> Les archives des éditions passées, les statistiques des lutteurs et les palmarès n&apos;étaient pas centralisés ni facilement accessibles.</li>
          <li><strong>Manque de visibilité nationale et internationale :</strong> La lutte traditionnelle nigérienne ne disposait d&apos;aucune vitrine numérique professionnelle pour valoriser ses athlètes et ses compétitions.</li>
          <li><strong>Coordination difficile entre les délégations régionales :</strong> Les informations sur les lutteurs inscrits, leur état de santé, les transferts entre régions et les compositions d&apos;équipe étaient difficiles à centraliser.</li>
        </ul>
      </section>

      <section>
        <h2>2.3 Comment Kokowa TV Répond à ces Besoins</h2>
        <div className="not-prose grid grid-cols-1 sm:grid-cols-2 gap-4 my-4">
          {[
            { probleme: "Gestion manuelle et papier", solution: "Système de gestion de tournoi complet (phases, matchs, résultats) en base de données PostgreSQL" },
            { probleme: "Pas de résultats en direct", solution: "Live-scoring temps réel avec Firebase RTDB (< 500ms de latence)" },
            { probleme: "Archives perdues", solution: "Module d'archives historiques avec palmarès depuis 1975" },
            { probleme: "Faible visibilité", solution: "Portail web public + API mobile Flutter + flux d'actualités" },
            { probleme: "Coordination difficile", solution: "Back-office RBAC pour la gestion des lutteurs, transferts et compositions" },
          ].map((item, i) => (
            <div key={i} className="bg-card border border-border/50 rounded-xl p-4 space-y-2">
              <p className="text-xs text-red-500 font-semibold">❌ {item.probleme}</p>
              <p className="text-sm text-muted-foreground">✅ {item.solution}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2>2.4 Contexte de Développement</h2>
        <p>
          Le projet a été développé avec une contrainte majeure : la rigueur sportive. Les règles métier de la lutte
          traditionnelle (types de victoire, gestion des éliminations, logique des phases de poules vs élimination directe)
          ont été encodées précisément dans le système. Chaque type de victoire (chute directe, accumulation de points,
          disqualification, forfait) est traçable et consultable dans l&apos;historique de chaque combat.
        </p>
        <p>
          Parallèlement, le projet doit être robuste en conditions difficiles : connectivité intermittente sur certains
          sites de combat, pics d&apos;audience lors des finales, et nécessité de fonctionner sans interruption pendant
          toute la durée du Sabre National (généralement une à deux semaines).
        </p>
      </section>
    </div>
  );
}
