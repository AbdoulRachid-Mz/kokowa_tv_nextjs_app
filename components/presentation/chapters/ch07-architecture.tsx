// components/presentation/chapters/ch07-architecture.tsx
import { PRESENTATION_DATA } from "@/lib/presentation/data";

export function ChapterArchitecture() {
  return (
    <div className="space-y-8 prose prose-neutral dark:prose-invert max-w-none">
      <section>
        <h2>Vue d'ensemble de l'architecture</h2>
        <p>
          Kokowa TV est construit sur une architecture moderne orientée serveur,
          exploitant les React Server Components (RSC) de Next.js 16 pour
          réduire le JavaScript envoyé au client, améliorer le SEO et
          raccourcir le Time-to-First-Byte.
        </p>
      </section>

      <section>
        <h2>Diagramme des couches</h2>
        <div className="not-prose overflow-x-auto">
          <div className="min-w-[600px] space-y-3 p-4 bg-muted/30 rounded-xl border border-border/50 font-mono text-sm">
            {/* Couche Client */}
            <div className="flex items-center gap-3">
              <div className="w-32 text-right text-muted-foreground text-xs">CLIENT</div>
              <div className="flex-1 flex gap-2">
                <div className="flex-1 bg-blue-500/20 border border-blue-500/40 rounded px-3 py-2 text-center text-blue-700 dark:text-blue-300">
                  Navigateur Web<br/><span className="text-xs">(Next.js SSR/CSR)</span>
                </div>
                <div className="flex-1 bg-blue-500/20 border border-blue-500/40 rounded px-3 py-2 text-center text-blue-700 dark:text-blue-300">
                  Application Mobile<br/><span className="text-xs">(Flutter iOS/Android)</span>
                </div>
              </div>
            </div>
            {/* Flèches */}
            <div className="flex items-center gap-3">
              <div className="w-32" />
              <div className="flex-1 flex gap-2 text-center text-muted-foreground text-xs">
                <div className="flex-1">↑↓ HTTPS/SSR</div>
                <div className="flex-1">↑↓ REST JSON</div>
              </div>
            </div>
            {/* Edge/Middleware */}
            <div className="flex items-center gap-3">
              <div className="w-32 text-right text-muted-foreground text-xs">EDGE</div>
              <div className="flex-1 bg-purple-500/20 border border-purple-500/40 rounded px-3 py-2 text-center text-purple-700 dark:text-purple-300">
                Next.js Middleware (Edge Runtime) — Vérification JWT, RBAC, Protection routes /ad/** et /dashboard/**
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-32" />
              <div className="flex-1 text-center text-muted-foreground text-xs">↓</div>
            </div>
            {/* Application Layer */}
            <div className="flex items-center gap-3">
              <div className="w-32 text-right text-muted-foreground text-xs">APPLICATION</div>
              <div className="flex-1 flex gap-2">
                <div className="flex-1 bg-green-500/20 border border-green-500/40 rounded px-3 py-2 text-center text-green-700 dark:text-green-300">
                  Pages &amp; Layouts<br/><span className="text-xs">Server Components</span>
                </div>
                <div className="flex-1 bg-green-500/20 border border-green-500/40 rounded px-3 py-2 text-center text-green-700 dark:text-green-300">
                  Server Actions<br/><span className="text-xs">31 actions typées</span>
                </div>
                <div className="flex-1 bg-green-500/20 border border-green-500/40 rounded px-3 py-2 text-center text-green-700 dark:text-green-300">
                  Routes API<br/><span className="text-xs">/api/* &amp; /api/mobile/*</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-32" />
              <div className="flex-1 text-center text-muted-foreground text-xs">↓</div>
            </div>
            {/* Services */}
            <div className="flex items-center gap-3">
              <div className="w-32 text-right text-muted-foreground text-xs">SERVICES</div>
              <div className="flex-1 flex gap-2">
                <div className="flex-1 bg-orange-500/20 border border-orange-500/40 rounded px-3 py-2 text-center text-orange-700 dark:text-orange-300 text-xs">
                  Neon PostgreSQL<br/>Base de données principale
                </div>
                <div className="flex-1 bg-orange-500/20 border border-orange-500/40 rounded px-3 py-2 text-center text-orange-700 dark:text-orange-300 text-xs">
                  Firebase RTDB<br/>Scores temps réel
                </div>
                <div className="flex-1 bg-orange-500/20 border border-orange-500/40 rounded px-3 py-2 text-center text-orange-700 dark:text-orange-300 text-xs">
                  Firebase Auth<br/>Sessions &amp; Tokens
                </div>
                <div className="flex-1 bg-orange-500/20 border border-orange-500/40 rounded px-3 py-2 text-center text-orange-700 dark:text-orange-300 text-xs">
                  Upstash Redis<br/>Cache &amp; Rate Limit
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section>
        <h2>Server Components vs Client Components</h2>
        <div className="not-prose grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
            <h3 className="font-semibold text-green-700 dark:text-green-300 mb-2">🖥️ Server Components (RSC)</h3>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• Pages de consultation publique (lutteurs, matchs, articles)</li>
              <li>• Layouts administrateur (protection RBAC côté serveur)</li>
              <li>• Chargement initial des données via Server Actions</li>
              <li>• Génération des métadonnées SEO (<code>generateMetadata</code>)</li>
              <li>• Réduction du bundle JavaScript client</li>
            </ul>
          </div>
          <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <h3 className="font-semibold text-blue-700 dark:text-blue-300 mb-2">⚛️ Client Components</h3>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• Chronomètre de combat (abonnement Firebase RTDB)</li>
              <li>• Formulaires interactifs (création lutteurs, saisie résultats)</li>
              <li>• Carousels et navigation par onglets</li>
              <li>• Composants de recherche et filtres en temps réel</li>
              <li>• Gestion du thème (dark/light mode)</li>
            </ul>
          </div>
        </div>
      </section>

      <section>
        <h2>Rôle du middleware</h2>
        <p>
          Le middleware Next.js s'exécute sur l'<strong>Edge Runtime</strong> (aucun accès Node.js complet),
          ce qui impose des contraintes strictes : pas d'import Firebase Admin, pas d'accès à la base de données.
          Il procède à une vérification JWT légère du cookie de session Firebase, extrait le rôle utilisateur
          et injecte les en-têtes <code>x-user-uid</code>, <code>x-user-role</code> et <code>x-user-email</code>
          pour les couches applicatives en aval.
        </p>
        <div className="not-prose bg-muted/30 rounded-lg p-4 border border-border/50">
          <p className="text-sm font-mono text-muted-foreground">middleware.ts (Edge Runtime)</p>
          <ul className="mt-2 text-sm space-y-1">
            <li>✅ Routes publiques → passage sans vérification</li>
            <li>✅ Routes <code>/api/*</code> → passage sans vérification (auth gérée au niveau handler)</li>
            <li>🔒 Routes <code>/ad/**</code> → JWT requis + rôle admin/editor/moderator/fighter_manager</li>
            <li>🔒 Routes <code>/dashboard/**</code> → JWT requis + tout rôle authentifié</li>
            <li>↩️ Non authentifié → redirection <code>/auth/sign-in?redirect=...</code></li>
          </ul>
        </div>
      </section>

      <section>
        <h2>Stack technique complète</h2>
        <div className="not-prose overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-muted/50">
                <th className="text-left p-3 border border-border/50">Technologie</th>
                <th className="text-left p-3 border border-border/50">Rôle</th>
                <th className="text-left p-3 border border-border/50">Catégorie</th>
              </tr>
            </thead>
            <tbody>
              {PRESENTATION_DATA.stackTechnique.map((tech, i) => (
                <tr key={i} className={i % 2 === 0 ? "bg-background" : "bg-muted/20"}>
                  <td className="p-3 border border-border/50 font-medium">{tech.nom}</td>
                  <td className="p-3 border border-border/50 text-muted-foreground">{tech.role}</td>
                  <td className="p-3 border border-border/50">
                    <span className="px-2 py-0.5 rounded-full text-xs bg-primary/10 text-primary">{tech.categorie}</span>
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
