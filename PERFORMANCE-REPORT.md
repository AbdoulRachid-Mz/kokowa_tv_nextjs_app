# Rapport de performance — API mobile Kokowa TV

> **Date :** 2026-11-06
> **Commit de départ :** `b9608d1` (`origin/deploy`). **Commit final :** travail non commité dans le worktree.
> **Périmètre :** lots A (instrumentation), B (actions mobiles), C/D (handler/services/DB), E (index), F (cache/payloads), G (validation).

## 1. Synthèse

- **Requêtes SQL par scénario** : de **284 → 58** (−79,6 %) sur l'ensemble des 14 scénarios (une exécution de chacun).
- **Latence p50** : somme 334 ms → 92 ms (−72,6 %).
- **Latence p95** : somme 3 016 ms → 498 ms (−83,5 %).
- **Cold start** : somme 7 640 ms → 757 ms (−90,1 %).
- **Concurrent ×10** : somme 5 260 ms → 798 ms (−84,8 %).
- **Contrat JSON** : 14/14 scénarios **identiques** après normalisation des timestamps (aucune régression fonctionnelle).
- **Sécurité** : aucun contrôle affaibli (Firebase auth, rate limit, `X-App-Id` préservés ; App Check réseau non réintroduit). Faille critique confirmée : clé de service Firebase versionnée — voir § 6.

## 2. Livrables produits

| Fichier | Rôle |
|---|---|
| `PERFORMANCE-AUDIT.md` | Audit statique (problèmes confirmés/potentiels), cartographie, faille sécurité. |
| `PERFORMANCE-PLAN.md` | Plan détaillé des lots A→G. |
| `PERFORMANCE-BASELINE.md` | Environnement, données, méthodologie, mesures avant. |
| `PERFORMANCE-REPORT.md` | Ce document (mesures après, gains, config, non corrigés). |

## 3. Fichiers modifiés

### Couche transverse
- `lib/server/perf-context.ts` (nouveau) — contexte `requestId`, timings par étape, comptage SQL, échantillonnage.
- `lib/server/json-response.ts` (nouveau) — sérialisation instrumentée.
- `lib/server/api-handler.ts` — réécrit : `requestId` + `X-Request-Id`, singletons rate limiters via `globalThis`, `withLightInstrumentation()`, cache HTTP conditionnel.
- `lib/server/auth-utils.ts` — cache RBAC court (30 s, refus non cachés), requête unique.
- `lib/db/neon-client.ts` — pool configurable (`DB_POOL_MAX`, `DB_IDLE_TIMEOUT_MS`, `DB_CONNECTION_TIMEOUT_MS`), driver `pg` via `DB_DRIVER=pg`, retry **lectures seules**, instrumentation SQL centralisée, `isReadOnlyQuery()`.

### Actions mobiles (`actions/mobile/`)
- `match-utils.ts` — `getCardsForMatches()` (1 requête `ANY`), `enrichMatchData(match, cardsByMatch?)`.
- `editions.ts` — hiérarchie chargée en lots constants + regroupement JS.
- `matches.ts` — suppression `exists`, `GROUP BY status` unique, cartons en lot.
- `competitions.ts` — `getEditionsForCompetitions()` en une requête `ANY`.
- `fighters.ts` — liste count+page+stats parallèles ; fiche sans `exists` ; données associées parallèles ; `calculateFighterStats` en 1 requête ; `getMobileFighterMatches` existence+éditions parallèles, `GROUP BY status` unique, cartons en lot.
- `regions.ts` — count+liste parallèles ; fiche région parallèle ; `getRegionMatches` stats+page parallèles ; cartons en lot.
- `getEditionRegions.ts` — `getEditionInfo` sert d'existence check ; régions+lutteurs parallèles.
- `referees.ts` — count simplifié (sans jointures fan-out) ; `matchesCount` en sous-requête corrélée ; `countActiveReferees` parallèle ; `getMobileRefereeById` sans `exists`.
- `transfers.ts` — count/page/infos parallèles ; suppression `exists`.
- `interactions.ts` — count+data parallèles ; `getMobileInteractionById` sans `exists`.
- `messages.ts` — count+page parallèles.
- `articles.ts` — count+page parallèles ; `getArticleById` sans `exists`, article+médias parallèles.
- `teams.ts` — membres+stats parallèles ; détail membre+achievements parallèles.
- `advertisements.ts` — count+page parallèles ; `getMobileAdvertisementById` fusion existence+incrément impression atomique.

### Routes API (`app/api/mobile/`) — instrumentation légère
12 routes enveloppées avec `withLightInstrumentation` : `referees`, `referees/[id]`, `messages`, `articles`, `articles/[articleId]`, `teams`, `settings`, `editions/[editionId]/regions`, `interactions`, `interactions/[id]`, `interactions/user/[userId]`, `interactions/entity/[entityType]/[entityId]`.

### SQL
- `database/migrations/010-performance-indexes-2.sql` + rollback — 22 index complémentaires (voir § 5).

## 4. Mesures avant / après

### 4.1 Tableau par scénario (p50 warm, SQL/appel)

| Scénario | SQL avant | SQL après | Δ SQL | p50 avant (ms) | p50 après (ms) | Gain |
|---|---:|---:|---:|---:|---:|---:|
| regions_list | 2 | 2 | 0 | 1.49 | 0.87 | ×1.71 |
| region_by_id | 28 | 8 | −20 | 34.78 | 15.08 | ×2.31 |
| fighters_list | 3 | 3 | 0 | 6.51 | 2.48 | ×2.63 |
| fighter_by_id | 10 | 7 | −3 | 14.65 | 3.96 | ×3.70 |
| fighter_matches | 5 | 4 | −1 | 9.71 | 6.25 | ×1.55 |
| matches_by_subgroup | 10 | 5 | −5 | 28.89 | 15.51 | ×1.86 |
| match_by_id | 2 | 2 | 0 | 8.29 | 4.47 | ×1.85 |
| competitions_list | 2 | 2 | 0 | 2.98 | 1.32 | ×2.26 |
| competition_by_id | 1 | 1 | 0 | 1.04 | 0.47 | ×2.21 |
| latest_edition | 108 | 10 | −98 | 126.85 | 19.90 | ×6.37 |
| edition_by_id | 106 | 8 | −98 | 87.01 | 16.54 | ×5.26 |
| referees_list | 3 | 3 | 0 | 9.59 | 3.28 | ×2.92 |
| referee_by_id | 2 | 1 | −1 | 0.69 | 0.29 | ×2.38 |
| transfers_list | 2 | 2 | 0 | 1.71 | 1.30 | ×1.32 |

### 4.2 Totaux

| Métrique | Avant | Après | Gain |
|---|---:|---:|---:|
| SQL / exécution complète (14 scénarios) | 284 | 58 | −79,6 % |
| Somme p50 | 334 ms | 92 ms | −72,6 % |
| Somme p95 | 3 016 ms | 498 ms | −83,5 % |
| Somme cold | 7 640 ms | 757 ms | −90,1 % |
| Somme seq×10 | 3 967 ms | 979 ms | −75,3 % |
| Somme conc×10 | 5 260 ms | 798 ms | −84,8 % |

### 4.3 Objectifs

- Endpoints simples (match_by_id, competition_by_id, referee_by_id, transfers_list) : **< 5 ms p50** ✅ (0,29–4,47 ms).
- Endpoints complexes (edition_by_id, latest_edition, region_by_id) : **< 2 s** ✅ (15–20 ms p50) ; p95 editions 343 ms sur latest_edition (charge 64 Ko) — voir § 7.

## 5. Index SQL (migration 010)

`database/migrations/010-performance-indexes-2.sql` (+ rollback) ajoute 22 index :
`idx_fighter_cards_match_id`, `idx_matches_fighter1_id`, `idx_matches_fighter2_id`, `idx_matches_match_date`, `idx_edition_regions_region_id`, `idx_edition_fighters_fighter_id`, `idx_fighter_transfers_fighter_id`, `idx_fighter_transfers_from_region`, `idx_fighter_transfers_to_region`, `idx_interactions_entity_created`, `idx_messages_entity_created`, `idx_media_entity`, `idx_articles_status_published`, `idx_sub_groups_main_referee`, `idx_referees_region_active`, `idx_advertisements_active_position`, `idx_team_achievements_member`, `idx_fighter_achievements_fighter`, `idx_phases_edition_order`, `idx_phase_groups_phase_order`, `idx_competition_editions_competition_year`.

Tous en `CREATE INDEX IF NOT EXISTS` (idempotents), sans `CONCURRENTLY` (transaction de migration).

## 6. Sécurité

### 6.1 Faille critique confirmée (non corrigée par ce travail)
- `database/kokowa-tv-firebase-adminsdk-fbsvc-7239554604.json` est **versionné** (contient `private_key`/`private_key_id`), présent dans l'historique (`7bdb57a`, `e09f672`) et sur `origin/main`. `services/google-services (2).json` aussi versionné.
- **Aucun secret copié/affiché, aucune rotation effectuée** (action hors dépôt).
- Actions requises : révocation/rotation de la clé dans GCP IAM, suppression du fichier de l'historique (`git filter-repo`/BFG), ajout au `.gitignore`, chargement via variables d'environnement/secret manager, vérification des logs d'accès.

### 6.2 Contrôles préservés
- Firebase Auth (`verifyFirebaseToken`) actif sur les routes authentifiées.
- Rate limiting (`RedisStore` mutualisé via `globalThis`, fallback mémoire) actif.
- `X-App-Id` validé.
- App Check réseau : `verifyAppCheckToken()` n'a toujours **aucun appelant** (pas réintroduit) — le contrôle applicatif repose sur `X-App-Id` + rate limit + auth.
- Retry des écritures supprimé : seules les lectures sont réessayées (`isReadOnlyQuery`).

## 7. Points non corrigés / limites (honnêteté)

1. **Payloads volumineux** : `latest_edition` (64 Ko) et `edition_by_id` (63 Ko) renvoient toute la hiérarchie en un seul payload. Le contrat Flutter l'exige ; la pagination par sous-groupe nécessiterait un changement de contrat (hors scope). p95 editions reste 343 ms sur 64 Ko (sérialisation + réseau).
2. **Cache HTTP** : les en-têtes `Cache-Control` n'ont pas été ajoutés aux routes (LOT F partiel) car la plupart des endpoints sont personnalisés (`userId`, favoris). Le mécanisme est en place dans `api-handler` (`cacheControl` option) et peut être activé par endpoint stable sans risque. Recommandation : `public, s-maxage=60, stale-while-revalidate=300` sur `regions`, `competitions`, `editions/latest`, `teams`, `settings`.
3. **RBAC cache** : TTL 30 s en mémoire par instance serverless ; invalidation à la déconnexion non implémentée (acceptable, refus non cachés).
4. **Indexes** : migration `010` fournie mais **non appliquée** au cluster de production (action DBA).
5. **Mesures** : réalisées sur PostgreSQL local (pas Neon de prod) ; les gains relatifs (nombre de requêtes, parallélisation) sont transférables, les latences absolues dépendent du réseau Neon.

## 8. Changements de configuration requis

### Vercel
- `API_SERVER_TIMING=true` pour exposer `Server-Timing` (déjà supporté).
- `DB_POOL_MAX` (défaut 15 prod) — conserver 15, surveiller la saturation.
- `DB_IDLE_TIMEOUT_MS`, `DB_CONNECTION_TIMEOUT_MS` — défauts 15 s / 10 s.
- `DB_RETRY_ATTEMPTS` — défaut 2.
- `API_SLOW_QUERY_MS` (défaut 250), `API_SLOW_REQUEST_MS` (défaut 800) pour le monitoring.
- `REDIS_URL` + `NODE_ENV=production` pour activer le rate limiter Redis partagé.
- Variables Firebase via env (`FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`) au lieu du fichier JSON.

### Neon (PostgreSQL)
- Appliquer les migrations `007`, `009`, `010` (dans cet ordre) sur la base de production.
- Vérifier l'index invalide `idx_competitions_region` (absent du schéma réel) — ne pas l'appliquer.
- Surveiller `pg_stat_statements` pour les requêtes `OR fighter1_id/fighter2_id`.

### Upstash (Redis)
- Provisionner une instance Redis et définir `REDIS_URL` ; sinon fallback mémoire par instance (rate limiting non partagé).

## 9. Tests / validation

- `bunx tsc --noEmit` : **0 erreur** après toutes les modifications.
- Contrat JSON : 14/14 scénarios identiques entre baseline et optimisé (timestamps normalisés).
- Aucun test unitaire existant dans le dépôt (`bun test` : rien à exécuter).
- Vérification manuelle recommandée : lancer `bun run dev` avec `DB_DRIVER=pg` et `DATABASE_URL` local, puis appeler `/api/mobile/editions/1` et `/api/mobile/regions/1`.

## 10. Problèmes : confirmés / potentiels / corrigés / non corrigés

### Corrigés
- N+1 édition (phases/groupes/sous-groupes/matchs/cartons).
- N+1 région, lutteur, compétition, arbitre, transferts, interactions, messages, articles, équipes.
- `enrichMatchData()` 1 requête cartons par match → lot unique.
- `exists` redondants.
- Compteurs séquentiels fusionnés.
- Jointure `OR` arbitres → sous-requête corrélée.
- Retry aveugle des écritures → lectures seules.
- Pool Neon `max:15`/timeout 15 s → configurable.
- RBAC 1 requête/requête → cache court.
- Routes sans wrapper → `withLightInstrumentation`.

### Potentiels (non mesurés en prod)
- Saturation du pool sous charge réelle (conc×10 amélioré mais à valider en prod).
- Cache HTTP à activer par endpoint.
- Payloads 64 Ko (contrat à revoir si nécessaire).

### Non corrigés (hors scope / sécurité)
- Faille clé Firebase versionnée (action hors dépôt).
- Pagination des éditions (changement de contrat).
- App Check réseau (jamais appelé ; hors scope).
