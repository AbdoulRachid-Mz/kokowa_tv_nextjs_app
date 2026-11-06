# Audit de performance — API mobile Kokowa TV

> **Date :** 2026-11-06
> **Périmètre :** `app/api/mobile/**`, `actions/mobile/**`, couche `lib/server/**`, `lib/db/neon-client.ts`, schéma PostgreSQL et index.
> **État du dépôt audité :** `b9608d1` (HEAD détaché, identique à `origin/deploy` du 2025-11-05).
> **Statut :** audit terminé, aucune modification de code métier effectuée avant la rédaction de ce document.

---

## 0. AVERTISSEMENT DE SÉCURITÉ PRIORITAIRE

Un fichier de compte de service Firebase **est versionné dans Git** :

- `database/kokowa-tv-firebase-adminsdk-fbsvc-7239554604.json`

Il contient un `private_key_id` et une `private_key`. Le fichier est présent dans l'historique (`7bdb57a`, puis `e09f672` « Initial clean commit ») et sur `origin/main`.

Actions requises **hors intervention de code** :

1. **Révoquer / faire tourner la clé** dans Google Cloud IAM (Firebase Admin SDK). Nous ne l'avons pas fait et nous ne copions aucun secret.
2. Supprimer le fichier du dépôt et de l'historique (`git filter-repo` ou BFG), puis ajouter `database/*adminsdk*.json`, `serviceAccount*.json`, `*.pem` au `.gitignore`.
3. Charger les credentials uniquement via variables d'environnement (`FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`) ou secret manager.
4. Vérifier les logs d'accès GCP pour détecter une éventuelle utilisation abusive de la clé exposée.

Le fichier `services/google-services (2).json` (configuration cliente Firebase) est également versionné : moins critique (clés publiques), mais à nettoyer.

---

## 1. Méthodologie

### 1.1 Sources de vérité

- `origin/main` (`2fe868f`, 2025-10-31) est une **histoire orpheline** : pas de base commune avec `HEAD`, 7 commits contre 106, et **aucune route `app/api/mobile`**. Le code le plus récent et exploitable est `origin/deploy` = `HEAD` (`b9608d1`).
- L'audit porte donc sur `HEAD`, comparé aux règles métier (compétitions, éditions, phases, groupes, sous-groupes, matchs) et aux contrats JSON Flutter documentés dans `app/api/mobile/README.md`.

### 1.2 Méthode

1. Lecture exhaustive des routes mobiles et de leurs actions.
2. Comptage statique des requêtes SQL par endpoint (hors requêtes conditionnelles).
3. Analyse des plans d'accès potentiels (jointures, `OR`, `DISTINCT`, sous-requêtes corrélées) et des index existants (`database/database.sql`, `database/migrations/007-performance-indexes.sql`).
4. Analyse de la couche transverse : `api-handler`, `auth-middleware`, `auth-utils`, `rate-limit`, `rate-limit-redis`, `neon-client`.
5. Baseline reproductible : voir `PERFORMANCE-BASELINE.md` (script de charge, scénarios froid/chaud/séquentiel/concurrent, p50/p95, taille de charge utile, comptage SQL).

### 1.3 Limites

- Aucun `.env` local, aucune variable `DATABASE_URL` / Firebase / Upstash dans l'environnement d'audit.
- L'API de production n'est pas joignable depuis cet environnement (`https://api.kokowatv.com` et `https://kokowatv.com` : échec de connexion).
- Les mesures « avant/après » sont donc produites sur un PostgreSQL local reproductible (même schéma, même code), avec un jeu de données de test proportionné. Les chiffres ne sont pas des mesures du cluster Neon de production : ils mesurent le **nombre de requêtes**, le **coût SQL** et la **latence applicative** à données comparables.

---

## 2. Cartographie de l'architecture

```
Requête HTTP
   │
   ├─ routes AVEC wrapper central (lib/server/api-handler) ──────────────┐
   │     CORS → X-App-Id → Rate limit (Redis/Memory) → Firebase Auth    │
   │     → RBAC (checkUserPermissions → 1 requête SQL) → handler métier  │
   │                                                                     │
   └─ routes SANS wrapper central ────────────────────────────────────────┤
         referees, interactions, messages, pubs, teams, settings,        │
         articles, editions/[editionId]/regions                          │
                                                                         ▼
                                                        actions/mobile/* → query()
                                                                         │
                                                        lib/db/neon-client.ts
                                                        Pool @neondatabase/serverless
```

### 2.1 Couche transverse

| Élément | Constat |
|---|---|
| `lib/server/api-handler.ts` | Timings partiels (`Total`, `Handler`, `Auth`, `RateLimit`) mais **pas de `requestId`**, pas de temps SQL, pas de taille de réponse, pas de temps de sérialisation. En dev, log systématique. |
| Rate limiting | `getDefaultRateLimiter()` est un singleton (correct). Mais dès qu'une route passe `options.rateLimit`, un **nouveau `RateLimiter` + `RedisStore`** est instancié **par requête** → nouvelle connexion Redis potentielle. |
| Auth Firebase | Cache mémoire 2 min par token (bien). `verifyIdToken(token, false)` : pas de vérification de révocation, comportement existant conservé. |
| RBAC | `checkUserPermissions()` fait **1 requête `users` par requête protégée**, sans cache. |
| `lib/db/neon-client.ts` | Pool `max: 15` (prod) / `8` (dev), `connectionTimeoutMillis: 15000`. **Aucune instrumentation** (durée, nombre, requête lente). `executeWithRetry` réessaie **toutes** les requêtes, y compris les écritures. |
| `lib/server/api-cache.ts` | Cache mémoire + tags, **utilisé uniquement par les tests** ; aucune route ne s'en sert, aucun `Cache-Control`. |
| App Check | `verifyAppCheckToken()` n'a **aucun appelant** ; aucun appel réseau App Check dans le chemin API. Aucune réintroduction prévue. |
| Pool serverless | `max: 15` par instance peut provoquer une tempête de connexions sur Neon en cas de scale horizontal. À aligner avec la chaîne Neon *pooled* (`-pooler`). |

### 2.2 Routes et contrats

Toutes les routes publiques exigent normalement `X-App-Id` (sauf `skipAppIdValidation`, utilisé par le pont `lib/api-handler.ts`). Les routes sans wrapper central **ne vérifient ni `X-App-Id` ni rate limit** : c'est un écart de sécurité existant, mais le corriger en imposant `X-App-Id` pourrait casser les clients Flutter actuels. L'audit ne propose donc pas de durcissement cassant ; il ajoute l'observabilité sans modifier les règles d'accès.

---

## 3. Tableau de synthèse des endpoints mobiles

Légende : **SQL** = nombre de requêtes SQL par appel à vide/chaud (hors retries), **N+1** = requêtes dépendant du nombre de lignes, **Risque** = impact latence.

| Endpoint | Wrapper | Auth | Action | SQL (typ.) | N+1 / problème | Risque |
|---|---|---|---|---|---|---|
| `GET /api/mobile/editions` | central | non | `getMobileLatestEdition` → `getMobileEditionById` | 5 + 2×(phases/groupes/sous-groupes/matchs) | **Très fort N+1** : 1 requête par groupe, sous-groupe, match, + 1 par match pour les cartons. | **Critique** |
| `GET /api/mobile/editions/[id]` | central | non | `getMobileEditionById` | idem | idem | **Critique** |
| `GET /api/mobile/editions/[id]/regions` | **aucun** | non | `getMobileEditionRegions` | 6 + N | Boucles de lutteurs/matchs, enrichissement par match. | Élevé |
| `GET /api/mobile/competitions` | central | non | `getMobileCompetitions` | 1 (+ N si `with_editions`) | **N+1** : 1 requête `getEditionsForCompetition` par compétition. | Moyen |
| `GET /api/mobile/competitions/[id]` | central (pont) | non | `getMobileCompetitionById` | 2 + N | idem si `with_editions=true` (défaut). | Moyen |
| `GET /api/mobile/regions` | central | non | `getMobileRegions` | 2 | Count + liste. Correct. | Faible |
| `GET /api/mobile/regions/[id]` | central (pont) | non | `getMobileRegionById2` | 6 | Requêtes séquentielles pouvant être parallélisées ; sous-requêtes likes corrélées. | Moyen |
| `GET /api/mobile/regions/[id]/matches` | central | non | `getRegionMatches` | 4 + N | Cartons par match, éventuellement double exécution. | Élevé |
| `GET /api/mobile/matches` | central | non | `getMobileMatchesBySubGroup` | 7 + N cartons | Exists + info + count + live + liste + stats ; **1 requête cartons par match**. Count et stats scannent deux fois. | **Élevé** |
| `GET /api/mobile/matches/[id]` | central | non | `getMobileMatchById` | 2 | 1 match + 1 cartons. Correct, index `fighter_cards(match_id)` manquant. | Faible |
| `GET /api/mobile/fighters` | central | non | `getMobileFighters` | 3 | Count + liste + stats globales ; sous-requête likes corrélée par ligne. | Moyen |
| `GET /api/mobile/fighters/[id]` | central | non | `getMobileFighterById` | 9 | Exists + infos + achievements + transfers + cards + région + stats (3 requêtes) + éditions, **toutes séquentielles**. | Élevé |
| `GET /api/mobile/fighters/[id]/matches` | central | non | `getMobileFighterMatches` | 3 + N | Cartons par match. | Élevé |
| `GET /api/mobile/referees` | **aucun** | non | `getMobileReferees` | 2 | `COUNT(DISTINCT)` avec `LEFT JOIN matches ON (m.referee_id = r.id OR (m.referee_id IS NULL AND ...))` → **OR + jointure lourde**, index non utilisables. | **Élevé** |
| `GET /api/mobile/referees/[id]` | **aucun** | non | `getMobileRefereeById` | 3-6 | Requêtes séquentielles, `countActiveReferees` séparé. | Moyen |
| `GET/POST/PUT/DELETE /api/mobile/referees` | **aucun** | **non** | CRUD arbitres | variable | **Écritures non authentifiées** (écart existant), pas de rate limit. | Sécurité |
| `GET /api/mobile/transfers` | central | non | `getMobileTransfers` | 2 + branches | Selon filtre, count + liste ; pas de N+1 majeur. | Faible |
| `GET /api/mobile/teams` | **aucun** | non | `getMobileTeamMembers` | 2 | Agrégat JSON + stats. Correct, mais cache absent. | Faible |
| `GET /api/mobile/settings` | **aucun** | non | `getAppSettings` | 1-2 | Correct, cache absent. | Faible |
| `GET /api/mobile/pubs` | **aucun** | non | `getMobileAdvertisements` | 2-3 | Correct, cache absent. | Faible |
| `GET /api/mobile/pubs/[id]` | central | non | `getMobileAdvertisementById` | 1-2 | Correct. | Faible |
| `GET /api/mobile/articles` | **aucun** | non | `getArticles` | 2-3 | `authId` → `getUserIdFromAuthId` (1 requête) ; correct sinon. | Faible |
| `GET /api/mobile/articles/[id]` | **aucun** | non | `getArticleById` | 2-3 | idem. | Faible |
| `GET /api/mobile/interactions` | **aucun** | non (GET) | `getMobileInteractions` | 1-3 | `authId` → user lookup. | Faible |
| `GET /api/mobile/interactions/[id]` | **aucun** | non | `getMobileInteractionById` | 1-2 | Correct. | Faible |
| `GET /api/mobile/interactions/user/[userId]` | **aucun** | non | `getMobileUserInteractions` | 1-3 | Correct. | Faible |
| `GET /api/mobile/interactions/entity/[type]/[id]` | **aucun** | non | `getMobileEntityInteractions` | 2-3 | Correct. | Faible |
| `POST /api/mobile/interactions` | **aucun** | token optionnel | `createMobileInteraction` | 2-3 | Écriture ; pas de retry dangereux au niveau handler. | Moyen |
| `GET /api/mobile/messages` | **aucun** | non | `getMobileMessages` | 2-3 | Correct. | Faible |
| `POST /api/mobile/messages` | **aucun** | token requis | `createMobileMessage` | 2-3 | Écriture. | Moyen |

> Le détail route par route (méthodes, paramètres, forme de réponse) reste inchangé : l'objectif des optimisations est de **conserver les contrats JSON**.

---

## 4. Problèmes confirmés (preuves dans le code)

### 4.1 P1 — N+1 majeur sur la hiérarchie d'édition

**Fichier :** `actions/mobile/editions.ts`

`getMobileEditionById()` enchaîne :
- `getEditionInfo()` : 1 requête ;
- `getPhasesWithGroupsAndSubgroups()` : 1 requête phases, puis **1 requête groupes par phase**, puis **1 requête sous-groupes par groupe**, puis **1 requête matchs par sous-groupe** ;
- `getLiveMatchForEdition()` : 1 requête + 1 requête cartons ;
- dans `getMatchesForSubGroup()`, `enrichMatchData()` refait **1 requête cartons par match**.

Pour une édition de `P` phases, `G` groupes, `S` sous-groupes et `M` matchs :
```
SQL ≈ 1 (exists) + 1 (info) + 1 (phases) + G + G×S + S×M + 2 (live) + M (cartes)
```
Soit facilement plusieurs centaines de requêtes, toutes séquentielles pour les groupes/sous-groupes (les cartons sont parallélisés par `Promise.all`, mais cela sature le pool).

**Impact :** chaque aller-retour Neon ajoute de la latence réseau ; sur un déploiement serverless où le pool est limité, la latence explose et le risque de timeout augmente. C'est le premier suspect des 8–10 s.

### 4.2 P2 — Cartons systématiquement requêtés un par un

**Fichiers :** `utils/match-utils.ts`, `actions/mobile/matches.ts`, `actions/mobile/editions.ts`, `actions/mobile/regions.ts`, `actions/mobile/fighters.ts`

`enrichMatchData(match)` appelle **toujours** `getCardsForMatch(match.id)`. Aucun index dédié `fighter_cards(match_id)` n'existe dans `database.sql` ni dans `007-performance-indexes.sql` (PostgreSQL n'indexe pas automatiquement les clés étrangères). Chaque appel est donc un scan de table, répété `M` fois.

### 4.3 P3 — `getMobileMatchesBySubGroup` : 7+ requêtes et double scan

**Fichier :** `actions/mobile/matches.ts`

Séquence : exists → info sous-groupe → `COUNT(*)` → live → autres matchs → stats groupées → cartons (N). `COUNT(*)` et `GROUP BY status` scannent la même table deux fois. `exists` est redondant avec `getSubGroupInfo()`.

### 4.4 P4 — Compétitions : N+1 `withEditions`

**Fichier :** `actions/mobile/competitions.ts`

`getMobileCompetitions(withEditions)` boucle `for (const competition of competitions) competition.editions = await getEditionsForCompetition(...)`. Idem pour `getMobileCompetitionById`. Le paramètre `with_editions` est **actif par défaut** côté route.

### 4.5 P5 — Fiche lutteur : requêtes séquentielles

**Fichier :** `actions/mobile/fighters.ts`

`getMobileFighterById()` exécute en série : exists, infos, achievements, transfers, cards, région, `calculateFighterStats()` (3 requêtes), éditions. Soit ~9 allers-retours + 3 dans les stats. Les requêtes sont indépendantes et pourraient être parallélisées, et plusieurs pourraient être fusionnées.

### 4.6 P6 — Arbitres : jointure `OR` non indexable

**Fichier :** `actions/mobile/referees.ts`

```sql
LEFT JOIN matches m ON (m.referee_id = r.id OR (m.referee_id IS NULL AND sg.id = m.sub_group_id))
```
Cette condition `OR` dans le `JOIN`, combinée à `COUNT(DISTINCT r.id)`, empêche l'usage efficace des index et force des parcours complets. Le tri par nombre de matchs (`matchesCount`) aggrave le coût. Le count est exécuté même quand `sortBy !== 'matches'`.

### 4.7 P7 — Écritures réessayées automatiquement

**Fichier :** `lib/db/neon-client.ts`

`executeWithRetry` s'applique à **toutes** les requêtes. Une coupure réseau après un `INSERT`/`UPDATE` peut provoquer un doublon ou une double application. Le problème est surtout de **correction** ; il peut aussi amplifier la latence en cas d'erreur transitoire. Les écritures ne doivent pas être retentées aveuglément (sauf si idempotentes et explicitement marquées).

### 4.8 P8 — Rate limiter : nouveau client Redis par requête

**Fichier :** `lib/server/api-handler.ts`

Le singleton `getDefaultRateLimiter()` est correct, mais la branche `rateLimit` (options personnalisées) crée `new RateLimiter({ ..., store: new RedisStore(process.env.REDIS_URL) })` à chaque requête. Chaque `RedisStore` instancie son propre client : connexions et handshakes inutiles.

### 4.9 P9 — RBAC : requête SQL par requête protégée

**Fichier :** `lib/server/auth-utils.ts`

`checkUserPermissions()` interroge `users` à chaque requête. Le cache de token Firebase (2 min) n'évite pas cette requête. Un cache court (15–60 s) par `uid` + rôles réduirait la charge, au prix d'un délai de propagation des changements de rôle — à documenter et à rendre configurable.

### 4.10 P10 — Absence d'observabilité corrélée

Aucun `requestId` n'est propagé, aucune mesure du temps SQL, du nombre de requêtes, de la requête la plus lente, de la taille de réponse ni du temps de sérialisation. Impossible de prouver où partent les 8–10 s en production.

### 4.11 P11 — Cache HTTP absent sur les données de référence

`api-cache.ts` existe mais n'est utilisé par aucune route. Les endpoints `teams`, `settings`, `pubs`, `competitions` (données peu changeantes) pourraient bénéficier d'un cache court, avec invalidation par tag. Aucun `Cache-Control` n'est émis.

### 4.12 P12 — Payload potentiellement volumineux

`GET /api/mobile/editions/[id]` renvoie toute la hiérarchie (phases → groupes → sous-groupes → matchs → cartons) sans pagination. La taille peut atteindre plusieurs centaines de Ko. La sérialisation JSON et le transfert mobile contribuent à la latence perçue. Le contrat doit être préservé ; des options de pagination/`fields` pourront être ajoutées sans casser l'existant.

### 4.13 P13 — Routes sans wrapper central

Neuf familles de routes contournent `apiHandler` : aucune mesure, aucun `X-Request-Id`, aucun rate limit, et pour certaines aucun `X-App-Id`. Cela n'explique pas à lui seul les 8–10 s, mais empêche l'observabilité et expose des écritures (arbitres) sans authentification. **Ne pas modifier les règles d'accès sans validation produit** ; l'instrumentation sera ajoutée sans durcissement cassant.

### 4.14 P14 — Configuration pool Neon

`max: 15` par instance et `connectionTimeoutMillis: 15000` : en cas de saturation, une requête peut attendre jusqu'à 15 s avant d'échouer, ce qui ressemble exactement à une latence de 8–10 s. Il faut rendre ces valeurs configurables, instrumenter l'attente de connexion et recommander la chaîne *pooled* Neon.

---

## 5. Problèmes potentiels (dépendants du volume / de la prod)

| # | Sujet | Condition de déclenchement | Recommandation |
|---|---|---|---|
| PP1 | Plan PostgreSQL sur `matches`/`sub_groups` | volume élevé, statistiques obsolètes | `EXPLAIN (ANALYZE, BUFFERS)` sur les requêtes instrumentées, `ANALYZE` après migration. |
| PP2 | Tempête de connexions Neon | scale horizontal Vercel + `max: 15` | URL `-pooler`, `DB_POOL_MAX` bas (5–10), PgBouncer Neon. |
| PP3 | Froid serverless | première requête après idle (connexion + Firebase) | mesurer cold start séparément ; garder le pool chaud si possible. |
| PP4 | Cache Firebase/RBAC | changements de rôle fréquents | TTL court configurable, invalidation documentée. |
| PP5 | Réseau mobile | payload > 300 Ko, 3G | compression (déjà négociée par Next/Vercel), pagination optionnelle. |
| PP6 | Upstash | latence inter-région | colocaliser Redis et fonctions, réutiliser le client. |

---

## 6. Ce qui n'est pas un problème (vérifié)

- **App Check réseau :** aucun appel dans le chemin API (`verifyAppCheckToken` sans appelant). Ne pas le réintroduire.
- **Auth Firebase :** un cache cryptographique de 2 min existe déjà et évite la vérification réseau à chaque requête.
- **Rate limit par défaut :** singleton `globalThis`, store Redis unique en production.
- **`X-App-Id` :** bien vérifié sur les routes qui passent par `apiHandler`.
- **Contrats JSON :** aucune modification de forme prévue ; les optimisations doivent être strictement équivalentes fonctionnellement.
- **Compétitions/éditions/phases/groupes/sous-groupes/matchs :** les règles de hiérarchie et de calcul sont conservées ; seules les stratégies de lecture changent.

---

## 7. Priorisation

| Priorité | Lot | Action | Gain attendu |
|---|---|---|---|
| 1 | A | Instrumentation `requestId` + timings + SQL | Rendre la latence mesurable et attribuable |
| 2 | B | Suppression des N+1 éditions/matchs/cartons/compétitions | **Le plus gros gain** : division du nombre de requêtes par 10–100 |
| 3 | C | Pool Neon + retry lectures seules | Suppression des attentes 15 s et des doublons d'écriture |
| 4 | D | Rate limiter mutualisé + cache RBAC | Quelques ms à dizaines de ms par requête protégée |
| 5 | E | Index manquants (`fighter_cards(match_id)`, etc.) | Requêtes de cartons et jointures en index-only |
| 6 | F | Cache HTTP court + payload | Gain sur endpoints de référence |
| 7 | G | Validation (tests, build, mesures avant/après) | Non-régression prouvée |

---

## 8. Livrables associés

- `PERFORMANCE-BASELINE.md` — protocole et mesures de référence.
- `PERFORMANCE-PLAN.md` — plan d'implémentation détaillé par lot.
- `PERFORMANCE-REPORT.md` — rapport final (créé après implémentation) avec fichiers touchés, migrations, optimisations, tests et mesures avant/après.
