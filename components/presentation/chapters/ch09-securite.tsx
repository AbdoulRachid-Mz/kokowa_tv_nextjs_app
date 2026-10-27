// components/presentation/chapters/ch09-securite.tsx
import { PRESENTATION_DATA } from "@/lib/presentation/data";

const severiteConfig: Record<string, { bg: string; text: string; badge: string }> = {
  CRITIQUE: { bg: "bg-red-500/10", text: "text-red-700 dark:text-red-300", badge: "bg-red-500/20 text-red-700 dark:text-red-300 border-red-500/40" },
  ÉLEVÉE: { bg: "bg-orange-500/10", text: "text-orange-700 dark:text-orange-300", badge: "bg-orange-500/20 text-orange-700 dark:text-orange-300 border-orange-500/40" },
  MOYENNE: { bg: "bg-yellow-500/10", text: "text-yellow-700 dark:text-yellow-300", badge: "bg-yellow-500/20 text-yellow-700 dark:text-yellow-300 border-yellow-500/40" },
};

export function ChapterSecurite() {
  return (
    <div className="space-y-8 prose prose-neutral dark:prose-invert max-w-none">
      <section>
        <h2>Audit de sécurité — Résultats</h2>
        <p>
          Un audit de sécurité approfondi a été conduit sur l'ensemble du code source
          en octobre 2026. Neuf vulnérabilités ont été identifiées et toutes ont été
          corrigées. Aucune vulnérabilité critique n'est active en production.
        </p>
        <div className="not-prose flex gap-4 flex-wrap">
          <div className="px-4 py-3 bg-green-500/10 border border-green-500/30 rounded-lg text-center">
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">9/9</p>
            <p className="text-xs text-muted-foreground">Vulnérabilités résolues</p>
          </div>
          <div className="px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-lg text-center">
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">0</p>
            <p className="text-xs text-muted-foreground">Vulnérabilités actives</p>
          </div>
          <div className="px-4 py-3 bg-blue-500/10 border border-blue-500/30 rounded-lg text-center">
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">17</p>
            <p className="text-xs text-muted-foreground">Tests de sécurité passés</p>
          </div>
        </div>
      </section>

      <section>
        <h2>Tableau des vulnérabilités</h2>
        <div className="not-prose overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-muted/50">
                <th className="text-left p-3 border border-border/50">Réf.</th>
                <th className="text-left p-3 border border-border/50">Vulnérabilité</th>
                <th className="text-left p-3 border border-border/50">Sévérité</th>
                <th className="text-left p-3 border border-border/50">Statut</th>
              </tr>
            </thead>
            <tbody>
              {PRESENTATION_DATA.securiteAudit.map((item, i) => {
                const cfg = severiteConfig[item.severite] ?? severiteConfig["MOYENNE"];
                return (
                  <tr key={i} className={`${cfg.bg}`}>
                    <td className="p-3 border border-border/50 font-mono font-bold">{item.ref}</td>
                    <td className="p-3 border border-border/50">{item.vulnerabilite}</td>
                    <td className="p-3 border border-border/50">
                      <span className={`px-2 py-0.5 rounded border text-xs font-medium ${cfg.badge}`}>
                        {item.severite}
                      </span>
                    </td>
                    <td className="p-3 border border-border/50">
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-500/20 text-green-700 dark:text-green-300 border border-green-500/40">
                        ✅ {item.statut}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2>Mécanismes de protection en place</h2>
        <div className="not-prose grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { titre: "RBAC — Contrôle d'accès basé sur les rôles", items: ["5 rôles : admin, editor, moderator, fighter_manager, user", "Vérification côté serveur dans chaque Server Action", "Middleware Edge pour les routes back-office", "Aucune élévation de privilèges possible via formulaire"] },
            { titre: "Protection des API", items: ["Firebase App Check (App Attest iOS, Play Integrity Android)", "Rate Limiting Upstash Redis par IP et token", "CORS configuré avec origines explicites", "Validation stricte des entrées (Zod)"] },
            { titre: "Authentification & Sessions", items: ["Firebase Authentication (JWT RS256)", "Distinction explicite ID Token vs Session Cookie", "Cookies HttpOnly, SameSite=Lax, Secure en production", "Expiration des sessions configurable"] },
            { titre: "Base de données & Stockage", items: ["Requêtes paramétrées uniquement (zéro concaténation SQL)", "SSL/TLS obligatoire sur la connexion Neon", "Pas de fuite de hash de mot de passe dans les réponses", "Accès Firebase Storage avec règles de sécurité RTDB"] },
          ].map((section, i) => (
            <div key={i} className="p-4 bg-card border border-border/50 rounded-lg">
              <h3 className="font-semibold text-sm mb-2">🔒 {section.titre}</h3>
              <ul className="text-xs space-y-1 text-muted-foreground">
                {section.items.map((item, j) => <li key={j}>• {item}</li>)}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2>En-têtes HTTP de sécurité</h2>
        <p>
          Les en-têtes de sécurité HTTP sont configurés via <code>next.config.ts</code>
          et le middleware. Ils protègent contre les attaques XSS, le clickjacking
          et la divulgation d'informations.
        </p>
        <div className="not-prose bg-muted/30 rounded-lg p-4 border border-border/50 font-mono text-xs">
          <pre>{`X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()`}</pre>
        </div>
      </section>

      <section>
        <h2>Risques résiduels identifiés</h2>
        <p>
          Bien que toutes les vulnérabilités détectées soient résolues, certains
          points de vigilance sont maintenus sous surveillance active :
        </p>
        <ul>
          <li>Rotation régulière des clés Firebase Admin recommandée (tous les 90 jours)</li>
          <li>Audit de dépendances NPM à planifier avant chaque édition du Sabre National</li>
          <li>Monitoring des logs d'accès Neon pour détecter des requêtes anormales</li>
          <li>Tests de charge à réaliser avant la finale du Sabre (pic de trafic prévisible)</li>
        </ul>
      </section>
    </div>
  );
}
