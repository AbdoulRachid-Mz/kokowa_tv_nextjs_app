# Plan d'optimisation — API mobile Kokowa TV

> **Référence audit :** `PERFORMANCE-AUDIT.md`
> **Baseline :** `PERFORMANCE-BASELINE.md`
> **Contrainte absolue :** aucun changement de contrat JSON Flutter, aucune règle métier (compétition / édition / phase / groupe / sous-groupe / match) modifiée, aucun contrôle de sécurité affaibli.

---

## Principe directeur

Les 8–10 s ne viennent pas d'une seule ligne. L'audit identifie trois familles de causes, par ordre d'impact :

1. **Explosion du nombre d'allers-retours SQL** (N+1 éditions, cartons, compétitions, fiches lutteur).
2. **Attentes de connexion / pool Neon** (`connectionTimeoutMillis: 15000`, `max: 15`, retries).
3. **Coûts transverses** (RBAC SQL, rate limiter Redis recréé, absence de cache et d'observabilité).

Le plan suit l'ordre imposé : **A instrumentation → B actions mobiles → C PostgreSQL/Neon → D handler/services transverses → E SQL/index → F cache/payloads → G validation**.

---

## LOT A — Instrumentation

### A1. Contexte de requête corrélé

Créer `lib/server/perf-context.ts` :

- `AsyncLocalStorage` (avec repli si indisponible) contenant :
  - `requestId` (header entrant `x-request-id` validé, sinon UUID) ;
  - timings par étape (`appId`, `rateLimit`, `auth`, `permissions`, `handler`) ;
  - compteurs SQL (`count`, `timeMs`, `slowestMs`, `slowestSnippet`) ;
  - temps de sérialisation JSON et taille de réponse ;
  - `sampled` (booléen) pour ne pas payer le coût en production.
- API : `runWithPerfContext(request, fn)`, `getPerfContext()`, `recordSql(durationMs, sql)`, `recordSerialization(ms, bytes)`.
- **Aucune donnée sensible** : pas de paramètres SQL, pas de token, pas d'e-mail, pas d'IP complète dans les logs.

### A2. Instrumentation SQL centralisée

Dans `lib/db/neon-client.ts` :

- Mesurer chaque `query()` autour de `pool.query` (durée, succès/échec, nombre de lignes).
- Alimenter le contexte A1 (`sqlCount`, `sqlTimeMs`, requête la plus lente + extrait **sans paramètres**).
- Logs configurables :
  - `API_PERF_LOG=true|false` (défaut : dev uniquement) ;
  - `API_PERF_SAMPLE_RATE` (0–1, défaut 0.01 en prod, 1 en dev) ;
  - `API_SLOW_QUERY_MS` (défaut 250) ;
  - `API_SLOW_REQUEST_MS` (défaut 800).
- Ne jamais logger `sql` complet ni les `params`. Extraire uniquement le verbe + la première table (`SELECT ... FROM x`), tronqué.

### A3. Instrumentation du handler

Dans `lib/server/api-handler.ts` :

- Générer/propager `x-request-id`, l'ajouter à la réponse.
- Mesurer : CORS, App ID, rate limit, auth Firebase, permissions, handler, sérialisation, taille.
- Log structuré unique en fin de requête :
  ```
  [api-perf] {requestId, method, path, status, appId, totalMs, appIdMs, rateLimitMs,
              authMs, permissionsMs, handlerMs, sqlCount, sqlMs, slowestSqlMs,
              serializationMs, responseBytes, sampled}
  ```
- `Server-Timing` optionnel (`API_SERVER_TIMING=true`).
- Suspecter / signaler les requêtes > `API_SLOW_REQUEST_MS`.

### A4. Instrumentation des routes sans wrapper

Ajouter un helper léger `withLightInstrumentation(handler)` (même contexte, même `requestId`, mêmes logs) aux routes qui n'utilisent pas `apiHandler`, **sans ajouter de validation** qui casserait les clients :
`referees`, `interactions`, `messages`, `pubs`, `teams`, `settings`, `articles`, `editions/[editionId]/regions`.

### A5. Tests

- Un test unitaire du contexte (imbrication, valeurs par défaut, absence de fuite de paramètres).
- Un test du format de log (pas de token/secret).

---

## LOT B — Actions mobiles

> Règle : chaque optimisation doit produire **exactement la même structure de retour** (mêmes clés, mêmes types, mêmes valeurs calculées). Les tests de contrat (snapshot JSON sur jeu de données fixe) sont ajoutés avant/après.

### B1. Éditions — suppression du N+1 (`actions/mobile/editions.ts`)

Remplacer la cascade par des requêtes ensemblistes :

1. `getEditionInfo` (1 requête) — inchangé.
2. Phases + groupes : **1 requête** `phases LEFT JOIN phase_groups` ou 2 requêtes (`phases`, `phase_groups WHERE phase_id IN (...)`) puis regroupement JS.
3. Sous-groupes : **1 requête** `sub_groups WHERE group_id = ANY($1)` + jointures régions/ceintures, regroupement JS par `group_id`.
4. Matchs : **1 requête** `matches WHERE sub_group_id = ANY($1)` avec les jointures lutteurs/régions, regroupement JS par `sub_group_id`.
5. Cartons : **1 requête** `fighter_cards WHERE match_id = ANY($1)`, regroupement JS par `match_id`.
6. Live match : **1 requête** (existant), cartons inclus dans la requête globale.

Coût : `1 (exists) + 1 (info) + 1 (phases) + 1 (groupes) + 1 (sous-groupes) + 1 (matchs) + 1 (cartons) + 1 (live) ≈ 8` requêtes, **indépendant du volume**.

Points d'attention :
- `phases.phase_order` est `UNIQUE` global au schéma : ne pas changer.
- `phase_type === 'group'` ⇒ pas de `matches` dans les sous-groupes (comportement existant à conserver).
- L'ordre des tableaux doit rester identique (`phase_order`, `group_order`, `sub_group_order`, `match_number`).
- `enrichMatchData` reçoit les cartons préchargés (voir B3) pour ne pas requêter.
- `getMobileLatestEdition` : conserver la requête de sélection puis appeler `getMobileEditionById`.

### B2. Matchs par sous-groupe (`actions/mobile/matches.ts`)

- Supprimer la requête `exists` : `getSubGroupInfo()` retourne `undefined` si absent ⇒ 404 identique.
- Fusionner `COUNT(*)` et `GROUP BY status` en **une requête** :
  ```sql
  SELECT status, COUNT(*) AS count
  FROM matches WHERE sub_group_id = $1
  GROUP BY status
  ```
  Le total « hors live/round_break » et le total global se déduisent des counts.
- Charger live + autres matchs (2 requêtes) puis **1 seule requête cartons** pour tous les `match_id`.
- `summary.total` doit rester `(live ? 1 : 0) + total hors live`.
- Pagination inchangée.

### B3. `enrichMatchData` préchargé (`utils/match-utils.ts`)

- Ajouter un paramètre optionnel : `enrichMatchData(match, cardsByMatch?: Map<number, Card[]>)`.
- Si fourni, aucune requête ; sinon comportement actuel (rétrocompatible).
- Ajouter `getCardsForMatches(matchIds: number[])` : une requête `WHERE match_id = ANY($1)`, retourne une `Map`.
- Utiliser cette fonction dans editions, matches, fighters, regions.

### B4. Compétitions (`actions/mobile/competitions.ts`)

- `getMobileCompetitions(withEditions)` : si `withEditions`, **une requête** `competition_editions WHERE competition_id = ANY($1)` puis regroupement JS. Sinon comportement actuel.
- `getMobileCompetitionById(id, withEditions)` : idem avec une seule requête.
- Conserver l'ordre des éditions (année/numéro décroissants) et les champs.

### B5. Fiche lutteur (`actions/mobile/fighters.ts`)

- Paralléliser les requêtes indépendantes : `getFighterAchievements`, `getFighterTransfers`, `getFighterCards`, `getFighterRegion`, `getParticipatedEditions`.
- Fusionner `calculateFighterStats` (3 requêtes) en **une requête** avec agrégats conditionnels.
- Supprimer la requête `exists` : `getFighterInfo` retourne `undefined` ⇒ 404 identique.
- `getMobileFighters` : conserver count + liste + stats globales ; ajouter l'index interactions (lot E) pour la sous-requête likes.

### B6. Régions (`actions/mobile/regions.ts`, `actions/mobile/getEditionRegions.ts`)

- `getMobileRegionById2` : paralléliser `getRegionFighters`, `getParticipatedEditions`, `getRegionTransfers`, `getRegionAchievements`.
- `getRegionMatches` : précharger les cartons en une requête (via `getCardsForMatches`).
- `getMobileEditionRegions` : regrouper les lutteurs/matchs par lots, supprimer les requêtes par ligne, précharger les cartons.

### B7. Arbitres (`actions/mobile/referees.ts`)

- Remplacer la jointure `OR` par un `LEFT JOIN LATERAL` ou deux agrégats précalculés :
  ```sql
  LEFT JOIN LATERAL (
    SELECT COUNT(*) AS cnt
    FROM matches m
    WHERE m.referee_id = r.id
       OR (m.referee_id IS NULL AND m.sub_group_id IN (
             SELECT id FROM sub_groups WHERE main_referee_id = r.id))
  ) mc ON TRUE
  ```
- Ne calculer `matchesCount` que si nécessaire (`sortBy === 'matches'` ou `withStatistics`), sinon count simple sur `referees`.
- Conserver strictement filtres, tri et pagination.

### B8. Transfers / messages / interactions / articles

- Vérifier les requêtes `authId → userId` : conserver, mais réutiliser le résultat dans la même requête quand c'est possible.
- Aucun N+1 détecté ; ne pas modifier les contrats.

---

## LOT C — PostgreSQL / Neon

### C1. Pool configurable (`lib/db/neon-client.ts`)

- `DB_POOL_MAX` (défaut 15 prod / 8 dev, recommandé 5–10 sur Vercel).
- `DB_IDLE_TIMEOUT_MS` (défaut 15000).
- `DB_CONNECTION_TIMEOUT_MS` (défaut 10000, configurable).
- `DB_STATEMENT_TIMEOUT_MS` optionnel via `options=-c statement_timeout=...` (à activer prudemment).
- Instrumenter l'attente de connexion (temps `pool.connect` vs `query`), nombre de connexions actives/idle.

### C2. Retry : lectures uniquement

- Classer la requête : `SELECT`, `WITH ... SELECT`, `SHOW`, `EXPLAIN` ⇒ retry autorisé.
- `INSERT`, `UPDATE`, `DELETE`, `MERGE`, `ALTER`, `CREATE`, `DROP`, `TRUNCATE`, `CALL` ⇒ **aucun retry automatique**.
- Les écritures idempotentes peuvent passer un flag explicite (`{ retryable: true }`) mais aucun appel existant ne le fera.
- Réduire les tentatives à 2 pour les lectures (au lieu de 3) et backoff plafonné (400 ms → 800 ms max).

### C3. Recommandations Neon (hors code)

- Utiliser la chaîne **pooled** (`...-pooler...`) pour les fonctions serverless.
- Vérifier la région Neon vs région Vercel.
- Surveiller `pg_stat_activity`, connexions actives, temps d'attente.
- `ANALYZE` après migration d'index.

### C4. Timeouts

- Ne pas laisser une requête attendre 15 s : `connectionTimeoutMillis` configurable, défaut 10 s, alerte si > 2 s.
- `statement_timeout` recommandé 10–15 s pour les lectures massives, à valider avec l'équipe.

---

## LOT D — Handler & services transverses

### D1. Rate limiter mutualisé

- Cache `globalThis` des `RateLimiter` par clé `windowMs:max`, avec un seul `RedisStore` partagé.
- Conserver l'identifiant IP et les headers `X-RateLimit-*`.
- Ne pas modifier les seuils.

### D2. Cache de permissions

- `checkUserPermissions()` : cache mémoire court (défaut 30 s, `RBAC_CACHE_TTL_MS`) par `uid` + rôles requis.
- Invalidation : TTL uniquement ; documenter le délai de propagation.
- Ne pas mettre en cache un refus négatif plus longtemps que le succès (ou pas du tout) pour éviter de bloquer un utilisateur nouvellement promu.
- En cas d'erreur DB : comportement actuel (refus).

### D3. Sérialisation / taille de réponse

- Mesurer `JSON.stringify` et `Buffer.byteLength` sur un échantillon.
- Ne pas bufferiser toutes les réponses en production : échantillonnage uniquement.
- `Content-Length` ajouté quand calculable sans surcoût.

### D4. Cache HTTP court (optionnel, sûr)

- Ajouter `Cache-Control: public, max-age=0, s-maxage=N, stale-while-revalidate=M` aux GET publics **stables** (`teams`, `settings`, `pubs`, `competitions`) via une option du handler.
- Ne pas cacher les données utilisateur (`authId`, favoris) ni les matchs live.
- Invalidation : TTL court (30–60 s), pas de cache applicatif mémoire traversant les instances.
- Aucune route ne doit renvoyer de données obsolètes critiques.

### D5. Wrapper des routes non instrumentées

- Utiliser `withLightInstrumentation` (A4) sans changer l'ordre des contrôles ni en ajouter.

---

## LOT E — SQL & index

Créer `database/migrations/010-performance-indexes-2.sql` + rollback. Index additifs, `IF NOT EXISTS`, sans contrainte :

| Index | Justification |
|---|---|
| `fighter_cards(match_id)` | **Manquant critique** : cartons par match |
| `matches(sub_group_id, match_number)` | Tri pagination |
| `matches(sub_group_id, status, match_number)` | Live + count/stats |
| `phases(edition_id, phase_order)` | Hiérarchie édition |
| `phase_groups(phase_id, group_order)` | Hiérarchie édition |
| `sub_groups(group_id, sub_group_order)` | Hiérarchie édition |
| `edition_fighters(edition_id, status, is_champion)` | Stats / champions |
| `interactions(entity_type, entity_id, interaction_type)` | Likes par entité (existe partiellement `user_id, entity_type, entity_id` : l'ordre ne couvre pas ce sens) |
| `messages(entity_type, entity_id, created_at DESC)` | Commentaires par entité |
| `matches(referee_id)` | Matchs par arbitre |
| `sub_groups(main_referee_id)` | Sous-groupes par arbitre |
| `fighters(region_id)` | Lutteurs par région |
| `referees(is_active, region_id)` | Filtres arbitres |
| `fighter_transfers(fighter_id, transfer_date DESC)` | Fiche lutteur |
| `fighter_transfers(to_region_id, transfer_date DESC)` | Fiche région |
| `competition_editions(competition_id, year DESC, edition_number DESC)` | Éditions par compétition |

> Ne pas dupliquer les index existants (`007` et `database.sql`). Vérifier avec `pg_indexes` avant application. Les index composites doivent être validés par `EXPLAIN` sur les vraies requêtes.

---

## LOT F — Cache & payloads

- Cache HTTP court (D4) uniquement sur les endpoints stables.
- Préchargement groupé des cartons (B3) : moins de requêtes, moins de latence, pas de changement de payload.
- Option `?compact=true` (facultative, rétrocompatible) pour exclure les cartons/gros champs des listes si le client Flutter le demande — **ne pas changer le défaut**.
- Compression : laisser Vercel/Next négocier `br`/`gzip` ; vérifier `Content-Encoding` en prod.
- Ne pas mettre en cache les réponses authentifiées.

---

## LOT G — Validation

### G1. Tests automatisés

- `bun test` : tests existants (`api-handler-lot1`, `middleware`, etc.) + nouveaux tests :
  - contexte de perf (A1) ;
  - classification retry (C2) ;
  - `enrichMatchData` avec cartons préchargés (B3) ;
  - snapshot de contrat JSON des actions optimisées (B1, B2, B4, B5).
- `bunx tsc --noEmit` (ou script équivalent) : aucune erreur de type.
- `bun run build` si l'environnement le permet.

### G2. Tests fonctionnels

- Vérifier chaque endpoint mobile : codes HTTP, `success`, pagination, tri, 404, erreurs.
- Vérifier les règles : phase `group` sans matchs de sous-groupe, live séparé, `summary`, `matchNumber`, cartons, vainqueur/perdant.
- Vérifier auth/RBAC/rate limit : aucun affaiblissement.

### G3. Mesures avant/après

- Même jeu de données, même machine, mêmes scénarios (voir `PERFORMANCE-BASELINE.md`).
- Relever : p50, p95, min/max, nombre SQL, temps SQL, taille de payload, cold/warm.
- Objectifs :
  - endpoints simples < 500 ms serveur ;
  - endpoints complexes < 1–2 s ;
  - réduction ≥ 80 % du nombre de requêtes sur éditions/matchs.

### G4. Livrable final

`PERFORMANCE-REPORT.md` : causes confirmées vs potentielles, correctifs appliqués vs non appliqués, fichiers modifiés, migrations, liste des tests, mesures, configuration Vercel/Neon/Upstash requise.

---

## Ordre d'exécution et points de contrôle

1. **A** (instrumentation) → vérifier que les logs sortent, sans secret.
2. **C2** (retry lectures seules) → test unitaire, aucune régression d'écriture.
3. **B1–B6** (N+1) → tests de contrat + mesure du nombre SQL.
4. **E** (index) → migration + `EXPLAIN`.
5. **D1–D2** (rate limiter, RBAC) → tests de sécurité.
6. **F** (cache/payload) → vérifier la fraîcheur.
7. **G** (validation complète) → rapport.

Aucun lot ne doit être fusionné sans test de non-régression du contrat Flutter.
