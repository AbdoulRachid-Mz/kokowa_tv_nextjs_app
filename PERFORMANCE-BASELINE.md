# Baseline de performance — API mobile Kokowa TV

> **Date :** 2026-11-06
> **Dépôt / commit :** `b9608d1` (HEAD détaché = `origin/deploy`), worktree de baseline isolé.
> **Statut :** mesures « avant » (code original, aucune optimisation).

## 1. Environnement de mesure

- **PostgreSQL local reproductible** : `embedded-postgres@18.6.0-beta.19`, cluster UTF-8 (`--encoding=UTF8 --locale=C`), écoute `127.0.0.1:55432`, base `kokowa_perf`, utilisateur `postgres`/`postgres`.
- **Shim baseline uniquement** : `lib/db/neon-client.ts` a reçu un support minimal de `DB_DRIVER=pg` (utilisation du driver `pg` au lieu de `@neondatabase/serverless`) afin d'exécuter le code original contre le PostgreSQL local. Aucun changement de logique métier, aucune instrumentation SQL. Le shim est documenté ici et n'est **pas** présent dans la version optimisée (qui possède son propre support `DB_DRIVER=pg`).
- **Runtime** : Bun, `NODE_ENV=production`, variables `DATABASE_URL=postgres://postgres:postgres@127.0.0.1:55432/kokowa_perf`, `DB_DRIVER=pg`.
- **Schéma** : `database/database.sql` + migrations `007` et `009` (identique au dépôt), avec deux ajustements de harnais uniquement : fonction trigger `update_updated_at_column()` pré-créée et retrait de l'index invalide `idx_competitions_region` (colonne inexistante). La migration `010` (nouveaux index) n'est **pas** appliquée en baseline.
- **Jeu de données synthétique** : 8 régions, 64 lutteurs, 3 compétitions, 12 phases, 24 groupes, 72 sous-groupes, 288 matchs, 432 cartons.

## 2. Méthodologie

- **Harnais** : `C:\Users\user\AppData\Local\Temp\bench.mjs`, exécuté sur chaque worktree (baseline puis optimisé).
- **Scénarios** : 14 actions mobiles représentatives (listes et fiches), appelées directement (contournement HTTP pour isoler la couche métier/DB).
- **Comptage SQL** : interception de `pool.query` sur l'instance singleton `neon-client` (compte chaque requête, temps par requête).
- **Latence** : `performance.now()` autour de chaque appel.
- **Cold** : premier appel (cache froid, pool froid).
- **Warm** : 15 appels consécutifs, p50/p95/avg/min/max.
- **Séquentiel 10** : 10 appels séquentiels, temps total.
- **Concurrent 10** : 10 appels via `Promise.all`, temps total.
- **Charge utile** : `JSON.stringify(result).length` (octets).
- **Contrat JSON** : snapshot normalisé (timestamps remplacés par `<TS>` / `<DATE>`) comparé entre baseline et version optimisée → **identique** (voir `PERFORMANCE-REPORT.md`).

## 3. Résultats baseline (avant)

| Scénario | SQL/appel | p50 (ms) | p95 (ms) | Cold (ms) | Seq×10 (ms) | Conc×10 (ms) | Payload (octets) |
|---|---:|---:|---:|---:|---:|---:|---:|
| regions_list | 2 | 1.49 | 2.35 | 114.91 | 13.70 | 324.44 | 1 207 |
| region_by_id | 28 | 34.78 | 169.41 | 519.91 | 651.68 | 932.26 | 30 111 |
| fighters_list | 3 | 6.51 | 7.50 | 2008.42 | 55.54 | 22.16 | 7 832 |
| fighter_by_id | 10 | 14.65 | 1173.54 | 54.42 | 125.66 | 585.11 | 820 |
| fighter_matches | 5 | 9.71 | 12.38 | 276.91 | 105.20 | 28.11 | 313 |
| matches_by_subgroup | 10 | 28.89 | 177.06 | 1388.95 | 288.24 | 786.23 | 3 688 |
| match_by_id | 2 | 8.29 | 9.84 | 42.52 | 87.46 | 274.28 | 803 |
| competitions_list | 2 | 2.98 | 3.70 | 298.90 | 18.15 | 12.59 | 988 |
| competition_by_id | 1 | 1.04 | 1.40 | 1.18 | 10.94 | 19.51 | 249 |
| latest_edition | 108 | 126.85 | 504.01 | 984.93 | 1418.20 | 646.46 | 63 936 |
| edition_by_id | 106 | 87.01 | 939.09 | 1059.98 | 1089.94 | 1577.23 | 63 051 |
| referees_list | 3 | 9.59 | 12.73 | 879.71 | 78.67 | 30.46 | 4 356 |
| referee_by_id | 2 | 0.69 | 1.13 | 1.37 | 7.43 | 2.40 | 348 |
| transfers_list | 2 | 1.71 | 2.37 | 8.08 | 16.67 | 18.64 | 213 |

**Totaux (une exécution de chaque scénario) :** 284 requêtes SQL, somme p50 ≈ 334 ms, somme p95 ≈ 3 016 ms, somme cold ≈ 7 640 ms.

## 4. Constats confirmés par la baseline

- **N+1 massif** sur les éditions : 106–108 requêtes par fiche d'édition (phases → groupes → sous-groupes → matchs → cartons).
- **N+1 sur les régions** : 28 requêtes par fiche région (lutteurs, matchs, transferts, palmarès, stats).
- **N+1 sur les lutteurs** : 10 requêtes par fiche lutteur (stats, matchs, éditions).
- **Cartons** : `enrichMatchData()` déclenchait 1 requête par match dans toutes les listes.
- **`exists` redondants** : 1 requête d'existence avant chaque fiche (supprimée en optimisé, la fiche sert de check).
- **Compteurs séquentiels** : `COUNT(*)` puis `GROUP BY status` puis page (fusionnés en un seul `GROUP BY`).
- **Concurrence** : les appels concurrents dégradent fortement la latence (pool Neon `max: 15`, timeout 15 s) — p95 très élevé sur `fighter_by_id` (1 173 ms) et `edition_by_id` (939 ms).
- **Cold start** : premier appel très lent (fighters_list 2 008 ms, editions ~1 000 ms) — connexion pool + JIT.
- **Payload** : inchangé entre baseline et optimisé (contrat préservé) ; les endpoints complexes renvoient 63 Ko (édition) — candidat à pagination future (hors scope).
