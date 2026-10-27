# REGISTRE DE SUIVI DES TÂCHES — KOKOWA TV (TASK.md)

Ce registre trace l'ensemble des chantiers de refonte, d'audit de sécurité, d'optimisation de performance et de documentation technique.

---

## 📊 Tableau de Bord Récapitulatif

| Phase | Intitulé du Chantier | Statut | Taux d'Achèvement |
| :--- | :--- | :--- | :--- |
| **Phase 1** | Migration vers Bun & Nettoyage Environnement | **TERMINÉ** | 100% |
| **Phase 2** | Page Détail Match Autonome (`/ad/matches/[matchId]`) | **TERMINÉ** | 100% |
| **Phase 3** | Appariement & Matchmaking Élimination Directe | **TERMINÉ** | 100% |
| **Phase 4** | Audit & Durcissement de la Sécurité (SEC-01 à SEC-08) | **TERMINÉ** | 100% |
| **Phase 5** | Optimisation Base de Données & Index de Performance | **TERMINÉ** | 100% |
| **Phase 6** | Harmonisation TypeScript (`ViewMode`, Hooks, Zéro Erreur) | **TERMINÉ** | 100% |
| **Phase 7** | Documentation Professionnelle & Spécifications (Cahier des charges) | **TERMINÉ** | 100% |
| **Phase 8** | Middleware Edge Sécurisé & Corrections Techniques Systèmes | **TERMINÉ** | 100% |
| **Phase 9** | Module de Présentation Institutionnel & Stratégique (17 Chapitres) | **TERMINÉ** | 100% |

---

## 📝 Détail des Tâches par Phase

### Phase 1 : Migration Runtime vers Bun & Dépendances
- [x] **TASK-1.1** : Remplacement des scripts `npm run`/`pnpm` par `bun run` dans `package.json`.
- [x] **TASK-1.2** : Configuration de `"packageManager": "bun@1.4.3"` dans `package.json`.
- [x] **TASK-1.3** : Mise à jour de `railway.json` (`startCommand: "bun run build && bun run start"`).
- [x] **TASK-1.4** : Validation locale de l'exécution Bun sur les scripts critiques (`bun run typecheck`).
- [x] **TASK-1.5** : Purge des dépendances obsolètes (`@prisma/client`, `mysql2`) et des scripts MySQL hérités (`db:drop`).

### Phase 2 : Page Détail Match Autonome (`/ad/matches/[matchId]`)
- [x] **TASK-2.1** : Création du répertoire et architecture `app/(admins)/ad/matches/[matchId]`.
- [x] **TASK-2.2** : Migration et adaptation des sous-composants :
  - `fighter-control.tsx` (contrôle des avertissements et points)
  - `floating-match-score.tsx` (barre flottante de score en direct)
  - `match-controls.tsx` (déclencheurs de victoire, disqualification, forfait)
  - `match-timer.tsx` (chronomètre synchronisé Firebase RTDB)
  - `media-manager.tsx` (gestion des vidéos et photos de combat)
- [x] **TASK-2.3** : Adaptation de `page.tsx` dans `app/(admins)/ad/matches/[matchId]` :
  - Extraction directe de `matchId` depuis `useParams()`.
  - Résolution dynamique de `subGroupId` et `editionId` via `getMatchById(matchId, { with_relations: true })`.
  - Navigation Précédent/Suivant adaptée vers `/ad/matches/[id]`.
- [x] **TASK-2.4** : Prise en charge du chargement de l'ensemble des matchs du `phase-group` si `phase_type !== 'group'` pour permettre au carrousel d'afficher tous les duels de la phase éliminatoire.

### Phase 3 : Organisation & Matchmaking Élimination Directe
- [x] **TASK-3.1** : Ajout du bouton d'action "Organiser les Matchs" sur `app/(admins)/ad/phase-groups/[groupId]/page.tsx` activé uniquement lorsque `group.phase?.phase_type !== 'group'`.
- [x] **TASK-3.2** : Implémentation du Server Action `createEliminationMatch` dans `actions/matches.ts` :
  - Détection ou création automatique du `sub_group` pour le couple `(region1_id, region2_id)` au sein du groupe.
  - Vérification de non-élimination préalable (`is_eliminated === false`).
  - Vérification de non-duplication : rejet si l'un des lutteurs a déjà combattu dans ce groupe.
- [x] **TASK-3.3** : Création de la page `app/(admins)/ad/phase-groups/[groupId]/organisation/page.tsx`.
- [x] **TASK-3.4** : Implémentation du composant de création multiple (`elimination-bulk-match-creator.tsx`) avec appariement automatique par paires.
- [x] **TASK-3.5** : Correction du filtrage par région dans les sélecteurs de combattants (comparaison stricte ID et fallback `f.region?.id`).
- [x] **TASK-3.6** : Sélecteur de créneau horaire (`period`: Matin / Soir) intégré aux créateurs simples et multiples.
- [x] **TASK-3.7** : Rendu des matchs existants de la phase via `EntityList` avec filtres, pagination, mode carrousel et personnalisation `customHeader`.

### Phase 4 : Audit de Sécurité & Remédiation Vulnérabilités (SEC-01 à SEC-08)
- [x] **TASK-4.1 (SEC-01)** : Protection des Server Actions destructives dans `actions/database.ts` (`resetDatabase`, `deleteAllTables`, `exportTableData`, `importTableData`) via `assertAdmin()`.
- [x] **TASK-4.2 (SEC-02)** : Assainissement strict par liste blanche (`/^[a-zA-Z0-9_]+$/`) des noms de tables et colonnes dans `importTableData` pour éliminer le risque d'injection SQL.
- [x] **TASK-4.3 (SEC-03)** : Neutralisation des fuites d'empreintes de mots de passe (`password_hash`) dans `actions/users.ts` via `sanitizeUser()`.
- [x] **TASK-4.4 (SEC-04)** : Protection IDOR/BOLA sur l'API mobile : validation du Bearer Token Firebase (`verifyFirebaseToken`) dans `POST /api/mobile/messages` et `interactions`.
- [x] **TASK-4.5 (SEC-05)** : Verrouillage de l'endpoint d'inspection DB `GET /api/database` avec le middleware `withAdminAuth`.
- [x] **TASK-4.6 (SEC-06)** : Protection contre l'auto-élévation de privilèges dans `createUser` et `updateUser` (`actions/users.ts`).
- [x] **TASK-4.7 (SEC-07)** : Correction de la logique Firebase App Check dans `lib/server/app-check.ts` et `api-handler.ts` (ordre d'évaluation et support multi-plateformes).
- [x] **TASK-4.8 (SEC-08)** : Sécurisation du layout d'administration `app/(admins)/ad/layout.tsx` avec vérification du rôle de session et redirection vers `/unauthorized`.
- [x] **TASK-4.9** : Ajout d'en-têtes HTTP de sécurité stricts dans `next.config.ts` (HSTS, X-Content-Type-Options, X-Frame-Options, CSP, Permissions-Policy).

### Phase 5 : Optimisation Base de Données & Index
- [x] **TASK-5.1** : Ajout du filtre direct `is_eliminated` dans `getEditionFighters` (`actions/editions.ts`).
- [x] **TASK-5.2** : Création de la migration SQL `database/migrations/007-performance-indexes.sql` :
  - Index `idx_edition_fighters_edition_eliminated` sur `edition_fighters(edition_id, is_eliminated)`
  - Index `idx_matches_subgroup_status` sur `matches(sub_group_id, status)`
  - Index `idx_sub_groups_group_id` sur `sub_groups(group_id)`
  - Index `idx_users_auth_id` sur `users(auth_id)`
  - Index `idx_interactions_user_entity` sur `interactions(user_id, entity_type, entity_id)`
  - Index `idx_messages_entity` sur `messages(entity_type, entity_id)`
- [x] **TASK-5.3** : Script de rollback associé `database/migrations/007-performance-indexes.down.sql`.

### Phase 6 : Harmonisation TypeScript & Typage Strict
- [x] **TASK-6.1** : Centralisation du type `ViewMode` (`"grid" | "list" | "compact" | "carousel"`) dans `@/types/index.ts`.
- [x] **TASK-6.2** : Harmonisation de `ViewMode` dans l'ensemble des pages d'administration, `hooks/use-entity-list.ts`, `components/shared/entity-list.tsx`, et `components/entities/entity-cards.tsx`.
- [x] **TASK-6.3** : Correction des paramètres `apiPath` et `defaultFilters` dans `use-entity-list.ts`.
- [x] **TASK-6.4** : Validation complète du build TypeScript : **0 erreurs (Code 0 sur `bun run typecheck`)**.

### Phase 7 : Documentation Technique & Cahier des Charges
- [x] **TASK-7.1** : Rédaction du Cahier des Charges fonctionnel, architectural et technique exhaustif (`CAHIER.md`).
- [x] **TASK-7.2** : Rédaction du Rapport d'Audit technique et sécuritaire v2.0 (`ANALYSIS.md`).
- [x] **TASK-7.3** : Révision de la feuille de route d'optimisation (`PLAN.md`).
- [x] **TASK-7.4** : Mise à jour du guide principal du projet (`README.md`).
- [x] **TASK-7.5** : Rédaction de la cartographie complète des Server Actions (`actions/README.md`).
- [x] **TASK-7.6** : Rédaction du guide des routes API Web et middleware (`app/api/README.md`).
- [x] **TASK-7.7** : Rédaction de la spécification de contrat d'API REST pour l'application Flutter (`app/api/mobile/README.md`).

### Phase 8 : Middleware Edge Sécurisé & Corrections Techniques Systèmes
- [x] **TASK-8.1** : Analyse et élimination des anciens proxies défectueux (`proxy-2.ts` et `proxy-3.ts`) qui bloquaient les utilisateurs autorisés en cascade.
- [x] **TASK-8.2** : Implémentation du middleware unique Next.js (`proxy.ts` / `middleware.ts`) compatible Edge Runtime :
  - Décodage JWT léger sans import lourd Firebase Admin
  - Contrôle d'accès RBAC (rôles `admin`, `editor`, `moderator`, `fighter_manager`)
  - Redirection propre vers `/auth/sign-in?redirect=...` avec assainissement anti-Open-Redirect
  - Injection des en-têtes `x-user-uid`, `x-user-role`, `x-user-email` pour les Server Components
  - Pass-through complet des routes publiques et API `/api/*` (sécurisées au niveau handler)
- [x] **TASK-8.3** : Résolution de l'incident SSL Neon PostgreSQL :
  - Configuration SSL explicite (`rejectUnauthorized: true` en prod, `false` en dev)
  - Suppression automatique du paramètre conflictuel `sslmode` dans la chaîne de connexion
  - Retry automatique avec backoff exponentiel et jitter sur erreurs transitoires
- [x] **TASK-8.4** : Résolution de l'incompatibilité des jetons Firebase Authentication :
  - Distinction formelle du chemin Bearer Token (`verifyIdToken` pour API mobile Flutter) vs Cookie (`verifySessionCookie` pour session web)
  - Élimination de l'erreur d'émetteur `Expected issuer: session.firebase.google.com` (SEC-09)
- [x] **TASK-8.5** : Résolution du blocage Firebase App Check :
  - Détection automatique des clés reCAPTCHA de test Google pour bypass propre en environnement local
  - Élimination du throttling HTTP 400 en boucle
- [x] **TASK-8.6** : Résolution de la lenteur de `getAllAppSettings()` :
  - Mise en place d'un cache mémoire serveur (TTL 5 minutes) avec invalidation automatique lors des mutations
  - Temps de réponse réduit de ~32 secondes à un accès instantané
- [x] **TASK-8.7** : Couverture de tests unitaires Bun :
  - 17/17 tests réussis sur le middleware et la détection de jetons (`tests/middleware.test.ts`, `tests/auth-middleware.test.ts`)

### Phase 9 : Module de Présentation Institutionnel & Stratégique
- [x] **TASK-9.1** : Conception de l'architecture du module `/presentation` (route publique sans barrière d'authentification)
- [x] **TASK-9.2** : Centralisation des données institutionnelles, techniques et financières (`lib/presentation/data.ts`)
- [x] **TASK-9.3** : Création du layout responsive avec barre latérale desktop rétractable et navigation fluide (`components/presentation/sidebar.tsx`, `chapter-navigation.tsx`)
- [x] **TASK-9.4** : Implémentation des 17 chapitres spécialisés (`components/presentation/chapters/`) :
  - Ch. 01 : Présentation Générale (`ch01-presentation.tsx`)
  - Ch. 02 : Contexte & Problématique (`ch02-contexte.tsx`)
  - Ch. 03 : Vision, Mission & Objectifs (`ch03-vision.tsx`)
  - Ch. 04 : Public Cible & Utilisateurs (`ch04-public.tsx`)
  - Ch. 05 : Fonctionnalités Détaillées (`ch05-fonctionnalites.tsx`)
  - Ch. 06 : Parcours Utilisateurs (`ch06-parcours.tsx`)
  - Ch. 07 : Architecture Technique & Diagramme des couches (`ch07-architecture.tsx`)
  - Ch. 08 : Architecture API & Intégration Mobile Flutter (`ch08-api.tsx`)
  - Ch. 09 : Sécurité, Audit des 9 vulnérabilités & Protections (`ch09-securite.tsx`)
  - Ch. 10 : Infrastructure Cloud, Variables d'environnement & Backups (`ch10-infrastructure.tsx`)
  - Ch. 11 : Modèle Économique & Pistes de Monétisation (`ch11-modele.tsx`)
  - Ch. 12 : Besoins en Financement approfondis (3 scénarios chiffrés) (`ch12-financement.tsx`)
  - Ch. 13 : Organisation de l'Équipe & Matrice RACI FENILUTTE (`ch13-equipe.tsx`)
  - Ch. 14 : Feuille de Route pluriannuelle (`ch14-roadmap.tsx`)
  - Ch. 15 : Registre des Risques & Plan de Continuité (`ch15-risques.tsx`)
  - Ch. 16 : Indicateurs Clés de Performance (KPIs) (`ch16-indicateurs.tsx`)
  - Ch. 17 : Conclusion, Perspectives & Appel à l'action (`ch17-conclusion.tsx`)
- [x] **TASK-9.5** : Validation stricte TypeScript : **0 erreurs (Code 0 sur `bunx tsc --noEmit`)**

