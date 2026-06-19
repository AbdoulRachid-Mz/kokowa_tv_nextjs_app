coaches::20,"page":1,"...":"2 items not stringified"}) in 8130ms actions/entities.ts
🔍 SQL: SELECT COUNT(DISTINCT coaches.id) as total ...
🔄 Retry query, remaining retries: 2
🔄 Retry query, remaining retries: 1
❌ Erreur Neon Query: there is no parameter $1
Error in getEntities for coaches: Error: Erreur lors de l’exécution de la requête PostgreSQL
    at query (lib\db\neon-client.ts:93:11)
    at async getEntities (actions\entities.ts:804:25)
  91 |   } catch (error: any) {
  92 |     console.error("❌ Erreur Neon Query:", error.message);
> 93 |     throw new Error("Erreur lors de l’exécution de la requête PostgreS...
     |           ^
  94 |   }
  95 | }
  96 |
⨯ Error: Erreur lors de la récupération des coaches
    at getEntities (actions\entities.ts:840:11)
  838 |       };
  839 |     }
> 840 |     throw new Error(`Erreur lors de la récupération des ${entityType}`);
      |           ^
  841 |   }
  842 | }
  843 | {
  digest: '3482079073'
}
✓ Finished writing to filesystem cache in 11.7s
 POST /ad/coaches 500 in 13.2s (next.js: 10ms, application-code: 13.2s)
  └─ ƒ getEntities("coaches", {"filters":{"is_active":true,"limit":"20"},"limit":20,"page":1,"...":"2 items not stringified"}) in 12692ms actions/entities.ts
(node:7712) [DEP0205] DeprecationWarning: `module.register()` is deprecated. Use `module.registerHooks()` instead.

fighters:
 POST /ad/fighters 500 in 10.3s (next.js: 10ms, application-code: 10.3s)
  └─ ƒ getEntities("fighters", {"filters":{"is_active":"active","limit":"20"},"limit":20,"page":1,"...":"2 items not stringified"}) in 9857ms actions/entities.ts
🔍 SQL: SELECT COUNT(DISTINCT fighters.id) as total ...
🔄 Retry query, remaining retries: 2
✓ Finished writing to filesystem cache in 11.3s
🔄 Retry query, remaining retries: 1
❌ Erreur Neon Query: there is no parameter $1
Error in getEntities for fighters: Error: Erreur lors de l’exécution de la requête PostgreSQL
    at query (lib\db\neon-client.ts:93:11)
    at async getEntities (actions\entities.ts:804:25)
  91 |   } catch (error: any) {
  92 |     console.error("❌ Erreur Neon Query:", error.message);
> 93 |     throw new Error("Erreur lors de l’exécution de la requête PostgreS...
     |           ^
  94 |   }
  95 | }
  96 |
⨯ Error: Erreur lors de la récupération des fighters
    at getEntities (actions\entities.ts:840:11)
  838 |       };
  839 |     }
> 840 |     throw new Error(`Erreur lors de la récupération des ${entityType}`);
      |           ^
  841 |   }
  842 | }
  843 | {
  digest: '1274528728'
}
 POST /ad/fighters 500 in 9.2s (next.js: 58ms, application-code: 9.1s)
  └─ ƒ getEntities("fighters", {"filters":{"is_active":"active","limit":"20"},"limit":20,"page":1,"...":"2 items not stringified"}) in 8666ms actions/entities.ts

palmares:  POST /ad/achievements 500 in 8.7s (next.js: 9ms, application-code: 8.7s)
  └─ ƒ getEntities("archives", {"filters":{"limit":"20","with_edition":true,"with_fighter":true,"...":"1 item not stringified"},"limit":20,"page":1,"...":"2 items not stringified"}) in 8279ms actions/entities.ts
🔍 SQL: SELECT COUNT(DISTINCT fighter_achievements_archive.id) as total ...
🔄 Retry query, remaining retries: 2
🔍 SQL: SELECT EXISTS ( ...
🔍 SQL: SELECT ...
🔍 SQL: SELECT EXISTS ( ...
 GET /api/archives/stats 200 in 20.3s (next.js: 17.5s, application-code: 2.8s)
🔄 Retry query, remaining retries: 1
❌ Erreur Neon Query: relation "fighter_achievements_archive" does not exist
Error in getEntities for archives: Error: Erreur lors de l’exécution de la requête PostgreSQL
    at query (lib\db\neon-client.ts:93:11)
    at async getEntities (actions\entities.ts:804:25)
  91 |   } catch (error: any) {
  92 |     console.error("❌ Erreur Neon Query:", error.message);
> 93 |     throw new Error("Erreur lors de l’exécution de la requête PostgreS...
     |           ^
  94 |   }
  95 | }
  96 |
⨯ Error: Erreur lors de la récupération des archives
    at getEntities (actions\entities.ts:840:11)
  838 |       };
  839 |     }
> 840 |     throw new Error(`Erreur lors de la récupération des ${entityType}`);
      |           ^
  841 |   }
  842 | }
  843 | {
  digest: '3402992740'
}
 POST /ad/achievements 500 in 11.8s (next.js: 28ms, application-code: 11.8s)
  └─ ƒ getEntities("archives", {"filters":{"limit":"20","with_edition":true,"with_fighter":true,"...":"1 item not stringified"},"limit":20,"page":1,"...":"2 items not stringified"}) in 11313ms actions/entities.ts

  transfers:
   GET /api/archives/stats 200 in 16.0s (next.js: 12ms, application-code: 15.9s)
 GET /ad/transfers 200 in 2.4s (next.js: 2.3s, application-code: 91ms)
🔍 SQL: SELECT COUNT(DISTINCT fighter_transfers.id) as total ...
🔍 SQL: SELECT fighter_transfers.*,  ...
🔄 Retry query, remaining retries: 2
🔄 Retry query, remaining retries: 1
❌ Erreur Neon Query: column "f.id" must appear in the GROUP BY clause or be used in an aggregate function
Error in getEntities for transfers: Error: Erreur lors de l’exécution de la requête PostgreSQL
    at query (lib\db\neon-client.ts:93:11)
    at async getEntities (actions\entities.ts:813:18)
  91 |   } catch (error: any) {
  92 |     console.error("❌ Erreur Neon Query:", error.message);
> 93 |     throw new Error("Erreur lors de l’exécution de la requête PostgreS...
     |           ^
  94 |   }
  95 | }
  96 |
⨯ Error: Erreur lors de la récupération des transfers
    at getEntities (actions\entities.ts:840:11)
  838 |       };
  839 |     }
> 840 |     throw new Error(`Erreur lors de la récupération des ${entityType}`);
      |           ^
  841 |   }
  842 | }
  843 | {
  digest: '3720865746'
}
 POST /ad/transfers 500 in 9.3s (next.js: 7ms, application-code: 9.3s)
  └─ ƒ getEntities("transfers", {"filters":{"limit":"20","with_fighter":true,"with_regions":true},"limit":20,"page":1,"...":"2 items not stringified"}) in 8637ms actions/entities.ts
🔍 SQL: SELECT COUNT(DISTINCT fighter_transfers.id) as total ...

referees: 
te PostgreSQL
    at query (lib\db\neon-client.ts:93:11)
    at async getEntities (actions\entities.ts:804:25)
  91 |   } catch (error: any) {
  92 |     console.error("❌ Erreur Neon Query:", error.message);
> 93 |     throw new Error("Erreur lors de l’exécution de la requête PostgreS...
     |           ^
  94 |   }
  95 | }
  96 |
⨯ Error: Erreur lors de la récupération des referees
    at getEntities (actions\entities.ts:840:11)
  838 |       };
  839 |     }
> 840 |     throw new Error(`Erreur lors de la récupération des ${entityType}`);
      |           ^
  841 |   }
  842 | }
  843 | {
  digest: '4038907292'
}
 POST /ad/referees 500 in 11.1s (next.js: 9ms, application-code: 11.1s)
  └─ ƒ getEntities("referees", {"filters":{"is_active":"active","limit":"20","with_region":true},"limit":20,"page":1,"...":"2 items not stringified"}) in 10439ms actions/entities.ts
🔍 SQL: SELECT COUNT(DISTINCT referees.id) as total ...
🔄 Retry query, remaining retries: 2
🔄 Retry query, remaining retries: 1

competitions: ○ Compiling /ad/competitions ...
[browser] [2026-06-18T16:07:05.225Z]  @firebase/app-check: AppCheck: 400 error. Attempts allowed again after 01m:36s (appCheck/initial-throttle). (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/0bij_next_dist_0_ghd7m._.js:2477:13)
 GET /ad/competitions 200 in 37.9s (next.js: 37.8s, application-code: 84ms)
🔍 SQL: SELECT COUNT(DISTINCT competitions.id) as total ...
🔍 SQL: SELECT competitions.* ...
 POST /ad/competitions 200 in 2.7s (next.js: 8ms, application-code: 2.7s)
  └─ ƒ getEntities("competitions", {"filters":{"limit":"20","status":"all"},"limit":20,"page":1,"...":"2 items not stringified"}) in 2690ms actions/entities.ts
✓ Finished filesystem cache database compaction in 91s
✓ Finished writing to filesystem cache in 10.8s

editions:
 POST /ad/editions 500 in 21.6s (next.js: 4.0s, application-code: 17.5s)
  └─ ƒ getEntities("editions", {"filters":{"limit":"20","with_competition":true,"with_fighters":true,"...":"2 items not stringified"},"limit":20,"page":1,"...":"2 items not stringified"}) in 17084ms actions/entities.ts
🔍 SQL: SELECT COUNT(DISTINCT competition_editions.id) as total ...
🔍 SQL: SELECT competition_editions.*,  ...
🔄 Retry query, remaining retries: 2
🔄 Retry query, remaining retries: 1
❌ Erreur Neon Query: column "c.id" must appear in the GROUP BY clause or be used in an aggregate function
Error in getEntities for editions: Error: Erreur lors de l’exécution de la requête PostgreSQL
    at query (lib\db\neon-client.ts:93:11)
    at async getEntities (actions\entities.ts:813:18)
  91 |   } catch (error: any) {
  92 |     console.error("❌ Erreur Neon Query:", error.message);
> 93 |     throw new Error("Erreur lors de l’exécution de la requête PostgreS...
     |           ^
  94 |   }
  95 | }
  96 |
⨯ Error: Erreur lors de la récupération des editions
    at getEntities (actions\entities.ts:840:11)
  838 |       };
  839 |     }
> 840 |     throw new Error(`Erreur lors de la récupération des ${entityType}`);
      |           ^
  841 |   }
  842 | }
  843 | {
  digest: '1314585687'
}
 POST /ad/editions 500 in 12.6s (next.js: 5ms, application-code: 12.6s)
  └─ ƒ getEntities("editions", {"filters":{"limit":"20","with_competition":true,"with_fighters":true,"...":"2 items not stringified"},"limit":20,"page":1,"...":"2 items not stringified"}) in 12118ms actions/entities.ts


  phases: 
  ○ Compiling /ad/phases ...
 GET /ad/phases 200 in 3.7s (next.js: 3.7s, application-code: 71ms)
🔍 SQL: SELECT COUNT(DISTINCT phases.id) as total ...
🔍 SQL: SELECT phases.* ...
 POST /ad/phases 200 in 3.8s (next.js: 5ms, application-code: 3.8s)
  └─ ƒ getEntities("phases", {"filters":{"limit":"20","with_edition":true,"with_groups":true},"limit":20,"page":1,"...":"2 items not stringified"}) in 3802ms actions/entities.ts

  phase-groupes:
  ○ Compiling /ad/phase-groups ...
 GET /ad/phase-groups 200 in 4.1s (next.js: 4.0s, application-code: 58ms)
🔍 SQL: SELECT COUNT(DISTINCT phase_groups.id) as total ...
🔄 Retry query, remaining retries: 2
🔍 SQL: SELECT phase_groups.* ...
 POST /ad/phase-groups 200 in 1872ms (next.js: 7ms, application-code: 1865ms)
  └─ ƒ getEntities("phase-groups", {"filters":{"limit":"20","with_phase":true,"with_sub_groups":true},"limit":20,"page":1,"...":"2 items not stringified"}) in 1849ms actions/entities.ts

  sub-groups: 
  ○ Compiling /ad/sub-groups ...
 GET /ad/sub-groups 200 in 4.9s (next.js: 4.7s, application-code: 169ms)
🔍 SQL: SELECT COUNT(DISTINCT sub_groups.id) as total ...
🔄 Retry query, remaining retries: 2
🔍 SQL: SELECT sub_groups.*,  ...
🔄 Retry query, remaining retries: 2
🔄 Retry query, remaining retries: 1
❌ Erreur Neon Query: column "pg.id" must appear in the GROUP BY clause or be used in an aggregate function
Error in getEntities for sub-groups: Error: Erreur lors de l’exécution de la requête PostgreSQL
    at query (lib\db\neon-client.ts:93:11)
    at async getEntities (actions\entities.ts:813:18)
  91 |   } catch (error: any) {
  92 |     console.error("❌ Erreur Neon Query:", error.message);
> 93 |     throw new Error("Erreur lors de l’exécution de la requête PostgreS...
     |           ^
  94 |   }
  95 | }
  96 |
⨯ Error: Erreur lors de la récupération des sub-groups
    at getEntities (actions\entities.ts:840:11)
  838 |       };
  839 |     }
> 840 |     throw new Error(`Erreur lors de la récupération des ${entityType}`);
      |           ^
  841 |   }
  842 | }
  843 | {
  digest: '3664139222'
}
 POST /ad/sub-groups 500 in 7.6s (next.js: 8ms, application-code: 7.6s)
  └─ ƒ getEntities("sub-groups", {"filters":{"limit":"20","with_group":true,"with_matches":true,"...":"1 item not stringified"},"limit":20,"page":1,"...":"2 items not stringified"}) in 6851ms actions/entities.ts

  articles:
   POST /ad/articles 500 in 8.0s (next.js: 7ms, application-code: 7.9s)
  └─ ƒ getEntities("articles", {"filters":{"limit":20,"with_author":true},"limit":20,"page":1,"...":"2 items not stringified"}) in 7446ms actions/entities.ts
🔍 SQL: SELECT COUNT(DISTINCT articles.id) as total ...
🔍 SQL: SELECT articles.*,  ...
🔄 Retry query, remaining retries: 2
🔄 Retry query, remaining retries: 1
❌ Erreur Neon Query: column "u.id" must appear in the GROUP BY clause or be used in an aggregate function
Error in getEntities for articles: Error: Erreur lors de l’exécution de la requête PostgreSQL
    at query (lib\db\neon-client.ts:93:11)
    at async getEntities (actions\entities.ts:813:18)
  91 |   } catch (error: any) {
  92 |     console.error("❌ Erreur Neon Query:", error.message);
> 93 |     throw new Error("Erreur lors de l’exécution de la requête PostgreS...
     |           ^
  94 |   }
  95 | }
  96 |
⨯ Error: Erreur lors de la récupération des articles
    at getEntities (actions\entities.ts:840:11)
  838 |       };
  839 |     }
> 840 |     throw new Error(`Erreur lors de la récupération des ${entityType}`);
      |           ^
  841 |   }
  842 | }
  843 | {
  digest: '3789727645'
}
 POST /ad/articles 500 in 6.2s (next.js: 6ms, application-code: 6.2s)
  └─ ƒ getEntities("articles", {"filters":{"limit":20,"with_author":true},"limit":20,"page":1,"...":"2 items not stringified"}) in 5813ms actions/entities.ts
[browser] [2026-06-18T16:16:15.564Z]  @firebase/app-check: AppCheck: 400 error. Attempts allowed again after 00m:01s (appCheck/initial-throttle). (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/0bij_next_dist_0_ghd7m._.js:2477:13)

media: 
":20,"page":1,"...":"2 items not stringified"}) in 5813ms actions/entities.ts
[browser] [2026-06-18T16:16:15.564Z]  @firebase/app-check: AppCheck: 400 error. Attempts allowed again after 00m:01s (appCheck/initial-throttle). (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/0bij_next_dist_0_ghd7m._.js:2477:13)
 GET /ad/media 200 in 9.0s (next.js: 9.0s, application-code: 65ms)
🔍 SQL: SELECT COUNT(DISTINCT media.id) as total ...
🔍 SQL: SELECT media.*,  ...
🔄 Retry query, remaining retries: 2
🔄 Retry query, remaining retries: 1
❌ Erreur Neon Query: column "u.id" must appear in the GROUP BY clause or be used in an aggregate function
Error in getEntities for media: Error: Erreur lors de l’exécution de la requête PostgreSQL
    at query (lib\db\neon-client.ts:93:11)
    at async getEntities (actions\entities.ts:813:18)
  91 |   } catch (error: any) {
  92 |     console.error("❌ Erreur Neon Query:", error.message);
> 93 |     throw new Error("Erreur lors de l’exécution de la requête PostgreS...
     |           ^
  94 |   }
  95 | }
  96 |
⨯ Error: Erreur lors de la récupération des media
    at getEntities (actions\entities.ts:840:11)
  838 |       };
  839 |     }
> 840 |     throw new Error(`Erreur lors de la récupération des ${entityType}`);
      |           ^
  841 |   }
  842 | }
  843 | {
  digest: '2134939619'
}
 POST /ad/media 500 in 6.3s (next.js: 7ms, application-code: 6.3s)
  └─ ƒ getEntities("media", {"filters":{"limit":20,"with_uploader":true},"limit":20,"page":1,"...":"2 items not stringified"}) in 5836ms actions/entities.ts
🔍 SQL: SELECT COUNT(DISTINCT media.id) as total ...

videos: 
## Error Type
Console Error

## Error Message
Encountered two children with the same key, `type`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.


    at createConsoleError (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/0bij_next_dist_0_ghd7m._.js:2379:71)
    at handleConsoleError (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/0bij_next_dist_0_ghd7m._.js:3165:54)
    at console.error (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/0bij_next_dist_0_ghd7m._.js:3312:57)
    at <unknown> (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/0bij_next_dist_compiled_react-dom_0opbpo3._.js:4104:33)
    at runWithFiberInDEV (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/0bij_next_dist_compiled_react-dom_0opbpo3._.js:965:74)
    at warnOnInvalidKey (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/0bij_next_dist_compiled_react-dom_0opbpo3._.js:4103:21)
    at reconcileChildrenArray (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/0bij_next_dist_compiled_react-dom_0opbpo3._.js:4129:160)
    at reconcileChildFibersImpl (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/0bij_next_dist_compiled_react-dom_0opbpo3._.js:4236:51)
    at <unknown> (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/0bij_next_dist_compiled_react-dom_0opbpo3._.js:4261:39)
    at reconcileChildren (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/0bij_next_dist_compiled_react-dom_0opbpo3._.js:5898:51)
    at beginWork (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/0bij_next_dist_compiled_react-dom_0opbpo3._.js:6758:1573)
    at runWithFiberInDEV (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/0bij_next_dist_compiled_react-dom_0opbpo3._.js:965:74)
    at performUnitOfWork (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/0bij_next_dist_compiled_react-dom_0opbpo3._.js:9555:97)
    at workLoopConcurrentByScheduler (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/0bij_next_dist_compiled_react-dom_0opbpo3._.js:9551:58)
    at renderRootConcurrent (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/0bij_next_dist_compiled_react-dom_0opbpo3._.js:9534:71)
    at performWorkOnRoot (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/0bij_next_dist_compiled_react-dom_0opbpo3._.js:9061:150)
    at performWorkOnRootViaSchedulerTask (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/0bij_next_dist_compiled_react-dom_0opbpo3._.js:10255:9)
    at MessagePort.performWorkUntilDeadline (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/0bij_next_dist_compiled_1g-a2v3._.js:2647:64)
    at <unknown> (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/_0who9wd._.js:1964:384)
    at Array.map (<anonymous>:null:null)
    at EntityList (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/_0who9wd._.js:1964:57)
    at VideosPage (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/_0ermrru._.js:3511:325)
    at ClientPageRoot (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/0bij_next_1xlfntj._.js:6896:50)

Next.js version: 16.2.7 (Turbopack)

POST /ad/videos 200 in 2.6s (next.js: 1412ms, application-code: 1150ms)
  └─ ƒ getEntities("videos", {"filters":{"limit":20},"limit":20,"page":1,"...":"2 items not stringified"}) in 1129ms actions/entities.ts
[browser] Encountered two children with the same key, `type`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
    at <unknown> (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/0bij_next_dist_compiled_react-dom_0opbpo3._.js:4104:33)
    at runWithFiberInDEV (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/0bij_next_dist_compiled_react-dom_0opbpo3._.js:965:74)
    at warnOnInvalidKey (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/0bij_next_dist_compiled_react-dom_0opbpo3._.js:4103:21)
    at reconcileChildrenArray (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/0bij_next_dist_compiled_react-dom_0opbpo3._.js:4129:160)
    at reconcileChildFibersImpl (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/0bij_next_dist_compiled_react-dom_0opbpo3._.js:4236:51)
    at <unknown> (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/0bij_next_dist_compiled_react-dom_0opbpo3._.js:4261:39)
    at reconcileChildren (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/0bij_next_dist_compiled_react-dom_0opbpo3._.js:5898:51)
    at beginWork (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/0bij_next_dist_compiled_react-dom_0opbpo3._.js:6758:1573)
    at runWithFiberInDEV (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/0bij_next_dist_compiled_react-dom_0opbpo3._.js:965:74)
    at performUnitOfWork (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/0bij_next_dist_compiled_react-dom_0opbpo3._.js:9555:97)
    at workLoopConcurrentByScheduler (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/0bij_next_dist_compiled_react-dom_0opbpo3._.js:9551:58)
    at renderRootConcurrent (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/0bij_next_dist_compiled_react-dom_0opbpo3._.js:9534:71)
    at performWorkOnRoot (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/0bij_next_dist_compiled_react-dom_0opbpo3._.js:9061:150)
    at performWorkOnRootViaSchedulerTask (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/0bij_next_dist_compiled_react-dom_0opbpo3._.js:10255:9)
    at MessagePort.performWorkUntilDeadline (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/0bij_next_dist_compiled_1g-a2v3._.js:2647:64) (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/0bij_next_dist_compiled_react-dom_0opbpo3._.js:4104:33)
[browser] Encountered two children with the same key, `category`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
    at <unknown> (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/0bij_next_dist_compiled_react-dom_0opbpo3._.js:4104:33)
    at runWithFiberInDEV (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/0bij_next_dist_compiled_react-dom_0opbpo3._.js:965:74)
    at warnOnInvalidKey (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/0bij_next_dist_compiled_react-dom_0opbpo3._.js:4103:21)
    at reconcileChildrenArray (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/0bij_next_dist_compiled_react-dom_0opbpo3._.js:4129:160)
    at reconcileChildFibersImpl (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/0bij_next_dist_compiled_react-dom_0opbpo3._.js:4236:51)
    at <unknown> (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/0bij_next_dist_compiled_react-dom_0opbpo3._.js:4261:39)
    at reconcileChildren (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/0bij_next_dist_compiled_react-dom_0opbpo3._.js:5898:51)
    at beginWork (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/0bij_next_dist_compiled_react-dom_0opbpo3._.js:6758:1573)
    at runWithFiberInDEV (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/0bij_next_dist_compiled_react-dom_0opbpo3._.js:965:74)
    at performUnitOfWork (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/0bij_next_dist_compiled_react-dom_0opbpo3._.js:9555:97)
    at workLoopConcurrentByScheduler (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/0bij_next_dist_compiled_react-dom_0opbpo3._.js:9551:58)
    at renderRootConcurrent (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/0bij_next_dist_compiled_react-dom_0opbpo3._.js:9534:71)
    at performWorkOnRoot (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/0bij_next_dist_compiled_react-dom_0opbpo3._.js:9061:150)
    at performWorkOnRootViaSchedulerTask (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/0bij_next_dist_compiled_react-dom_0opbpo3._.js:10255:9)
    at MessagePort.performWorkUntilDeadline (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/0bij_next_dist_compiled_1g-a2v3._.js:2647:64) (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/0bij_next_dist_compiled_react-dom_0opbpo3._.js:4104:33)
○ Compiling /api/videos/[videoId] ...
[browser] Encountered two children with the same key, `type`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
    at <unknown> (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/0bij_next_dist_compiled_react-dom_0opbpo3._.js:4104:33)
    at runWithFiberInDEV (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/0bij_next_dist_compiled_react-dom_0opbpo3._.js:965:74)
    at warnOnInvalidKey (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/0bij_next_dist_compiled_react-dom_0opbpo3._.js:4103:21)
    at reconcileChildrenArray (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/0bij_next_dist_compiled_react-dom_0opbpo3._.js:4120:29)
    at reconcileChildFibersImpl (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/0bij_next_dist_compiled_react-dom_0opbpo3._.js:4236:51)
    at <unknown> (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/0bij_next_dist_compiled_react-dom_0opbpo3._.js:4261:39)
    at reconcileChildren (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/0bij_next_dist_compiled_react-dom_0opbpo3._.js:5898:119)
    at beginWork (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/0bij_next_dist_compiled_react-dom_0opbpo3._.js:6758:1573)
    at runWithFiberInDEV (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/0bij_next_dist_compiled_react-dom_0opbpo3._.js:965:74)
    at performUnitOfWork (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/0bij_next_dist_compiled_react-dom_0opbpo3._.js:9555:97)
    at workLoopSync (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/0bij_next_dist_compiled_react-dom_0opbpo3._.js:9449:40)
    at renderRootSync (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/0bij_next_dist_compiled_react-dom_0opbpo3._.js:9433:13)
    at performWorkOnRoot (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/0bij_next_dist_compiled_react-dom_0opbpo3._.js:9061:186)
    at performSyncWorkOnRoot (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/0bij_next_dist_compiled_react-dom_0opbpo3._.js:10263:9)
    at flushSyncWorkAcrossRoots_impl (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/0bij_next_dist_compiled_react-dom_0opbpo3._.js:10179:316)
    at processRootScheduleInMicrotask (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/0bij_next_dist_compiled_react-dom_0opbpo3._.js:10200:106)
    at <unknown> (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/0bij_next_dist_compiled_react-dom_0opbpo3._.js:10274:158) (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/0bij_next_dist_compiled_react-dom_0opbpo3._.js:4104:33)
[browser] Encountered two children with the same key, `category`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
    at <unknown> (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/0bij_next_dist_compiled_react-dom_0opbpo3._.js:4104:33)
    at runWithFiberInDEV (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/0bij_next_dist_compiled_react-dom_0opbpo3._.js:965:74)
    at warnOnInvalidKey (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/0bij_next_dist_compiled_react-dom_0opbpo3._.js:4103:21)
    at reconcileChildrenArray (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/0bij_next_dist_compiled_react-dom_0opbpo3._.js:4120:29)
    at reconcileChildFibersImpl (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/0bij_next_dist_compiled_react-dom_0opbpo3._.js:4236:51)
    at <unknown> (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/0bij_next_dist_compiled_react-dom_0opbpo3._.js:4261:39)
    at reconcileChildren (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/0bij_next_dist_compiled_react-dom_0opbpo3._.js:5898:119)
    at beginWork (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/0bij_next_dist_compiled_react-dom_0opbpo3._.js:6758:1573)
    at runWithFiberInDEV (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/0bij_next_dist_compiled_react-dom_0opbpo3._.js:965:74)
    at performUnitOfWork (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/0bij_next_dist_compiled_react-dom_0opbpo3._.js:9555:97)
    at workLoopSync (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/0bij_next_dist_compiled_react-dom_0opbpo3._.js:9449:40)
    at renderRootSync (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/0bij_next_dist_compiled_react-dom_0opbpo3._.js:9433:13)
    at performWorkOnRoot (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/0bij_next_dist_compiled_react-dom_0opbpo3._.js:9061:186)
    at performSyncWorkOnRoot (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/0bij_next_dist_compiled_react-dom_0opbpo3._.js:10263:9)
    at flushSyncWorkAcrossRoots_impl (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/0bij_next_dist_compiled_react-dom_0opbpo3._.js:10179:316)
    at processRootScheduleInMicrotask (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/0bij_next_dist_compiled_react-dom_0opbpo3._.js:10200:106)
    at <unknown> (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/0bij_next_dist_compiled_react-dom_0opbpo3._.js:10274:158) (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/0bij_next_dist_compiled_react-dom_0opbpo3._.js:4104:33)
[browser] TypeError: Failed to construct 'URL': Invalid URL
    at defaultLoader (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/node_modules__pnpm_0ig86ui._.js:5259:29)
    at <unknown> (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/node_modules__pnpm_0ig86ui._.js:2696:39)
    at Array.map (<anonymous>)
    at generateImgAttrs (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/node_modules__pnpm_0ig86ui._.js:2696:24)
    at getImgProps (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/node_modules__pnpm_0ig86ui._.js:3109:27)
    at <unknown> (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/node_modules__pnpm_0ig86ui._.js:5640:82)
    at Object.react_stack_bottom_frame (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/0bij_next_dist_compiled_react-dom_0opbpo3._.js:15037:24)
    at renderWithHooks (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/0bij_next_dist_compiled_react-dom_0opbpo3._.js:4620:24)
    at updateForwardRef (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/0bij_next_dist_compiled_react-dom_0opbpo3._.js:5908:21)
    at beginWork (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/0bij_next_dist_compiled_react-dom_0opbpo3._.js:6766:24)
    at runWithFiberInDEV (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/0bij_next_dist_compiled_react-dom_0opbpo3._.js:965:74)
    at performUnitOfWork (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/0bij_next_dist_compiled_react-dom_0opbpo3._.js:9555:97)
    at workLoopSync (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/0bij_next_dist_compiled_react-dom_0opbpo3._.js:9449:40)
    at renderRootSync (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/0bij_next_dist_compiled_react-dom_0opbpo3._.js:9433:13)
    at performWorkOnRoot (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/0bij_next_dist_compiled_react-dom_0opbpo3._.js:9061:186)
    at performSyncWorkOnRoot (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/0bij_next_dist_compiled_react-dom_0opbpo3._.js:10263:9)
    at flushSyncWorkAcrossRoots_impl (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/0bij_next_dist_compiled_react-dom_0opbpo3._.js:10179:316)
    at processRootScheduleInMicrotask (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/0bij_next_dist_compiled_react-dom_0opbpo3._.js:10200:106)
    at <unknown> (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/0bij_next_dist_compiled_react-dom_0opbpo3._.js:10274:158)
    at VideoCard (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/_0ermrru._.js:2506:364)
    at renderCard (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/_0ermrru._.js:3533:353)
    at <unknown> (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/_0who9wd._.js:2190:47)
    at Array.map (<anonymous>)
    at EntityList (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/_0who9wd._.js:2189:44)
    at VideosPage (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/_0ermrru._.js:3511:325)
    at ClientPageRoot (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/0bij_next_1xlfntj._.js:6896:50) (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/node_modules__pnpm_0ig86ui._.js:5261:25)
[browser] Encountered two children with the same key, `type`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
    at <unknown> (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/0bij_next_dist_compiled_react-dom_0opbpo3._.js:4104:33)
    at runWithFiberInDEV (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/0bij_next_dist_compiled_react-dom_0opbpo3._.js:965:74)
    at warnOnInvalidKey (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/0bij_next_dist_compiled_react-dom_0opbpo3._.js:4103:21)
    at reconcileChildrenArray (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/0bij_next_dist_compiled_react-dom_0opbpo3._.js:4120:29)
    at reconcileChildFibersImpl (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/0bij_next_dist_compiled_react-dom_0opbpo3._.js:4236:51)
    at <unknown> (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/0bij_next_dist_compiled_react-dom_0opbpo3._.js:4261:39)
    at reconcileChildren (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/0bij_next_dist_compiled_react-dom_0opbpo3._.js:5898:119)
    at beginWork (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/0bij_next_dist_compiled_react-dom_0opbpo3._.js:6758:1573)
    at runWithFiberInDEV (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/0bij_next_dist_compiled_react-dom_0opbpo3._.js:965:74)
    at performUnitOfWork (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/0bij_next_dist_compiled_react-dom_0opbpo3._.js:9555:97)
    at workLoopSync (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/0bij_next_dist_compiled_react-dom_0opbpo3._.js:9449:40)
    at renderRootSync (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/0bij_next_dist_compiled_react-dom_0opbpo3._.js:9433:13)
    at performWorkOnRoot (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/0bij_next_dist_compiled_react-dom_0opbpo3._.js:9098:47)
    at performSyncWorkOnRoot (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/0bij_next_dist_compiled_react-dom_0opbpo3._.js:10263:9)
    at flushSyncWorkAcrossRoots_impl (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/0bij_next_dist_compiled_react-dom_0opbpo3._.js:10179:316)
    at processRootScheduleInMicrotask (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/0bij_next_dist_compiled_react-dom_0opbpo3._.js:10200:106)
    at <unknown> (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/0bij_next_dist_compiled_react-dom_0opbpo3._.js:10274:158) (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/0bij_next_dist_compiled_react-dom_0opbpo3._.js:4104:33)
[browser] Encountered two children with the same key, `category`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
    at <unknown> (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/0bij_next_dist_compiled_react-dom_0opbpo3._.js:4104:33)
    at runWithFiberInDEV (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/0bij_next_dist_compiled_react-dom_0opbpo3._.js:965:74)
    at warnOnInvalidKey (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/0bij_next_dist_compiled_react-dom_0opbpo3._.js:4103:21)
    at reconcileChildrenArray (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/0bij_next_dist_compiled_react-dom_0opbpo3._.js:4120:29)
    at reconcileChildFibersImpl (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/0bij_next_dist_compiled_react-dom_0opbpo3._.js:4236:51)
    at <unknown> (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/0bij_next_dist_compiled_react-dom_0opbpo3._.js:4261:39)
    at reconcileChildren (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/0bij_next_dist_compiled_react-dom_0opbpo3._.js:5898:119)
    at beginWork (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/0bij_next_dist_compiled_react-dom_0opbpo3._.js:6758:1573)
    at runWithFiberInDEV (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/0bij_next_dist_compiled_react-dom_0opbpo3._.js:965:74)
    at performUnitOfWork (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/0bij_next_dist_compiled_react-dom_0opbpo3._.js:9555:97)
    at workLoopSync (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/0bij_next_dist_compiled_react-dom_0opbpo3._.js:9449:40)
    at renderRootSync (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/0bij_next_dist_compiled_react-dom_0opbpo3._.js:9433:13)
    at performWorkOnRoot (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/0bij_next_dist_compiled_react-dom_0opbpo3._.js:9098:47)
    at performSyncWorkOnRoot (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/0bij_next_dist_compiled_react-dom_0opbpo3._.js:10263:9)
    at flushSyncWorkAcrossRoots_impl (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/0bij_next_dist_compiled_react-dom_0opbpo3._.js:10179:316)
    at processRootScheduleInMicrotask (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/0bij_next_dist_compiled_react-dom_0opbpo3._.js:10200:106)
    at <unknown> (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/0bij_next_dist_compiled_react-dom_0opbpo3._.js:10274:158) (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/0bij_next_dist_compiled_react-dom_0opbpo3._.js:4104:33)
[browser] TypeError: Failed to construct 'URL': Invalid URL
    at defaultLoader (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/node_modules__pnpm_0ig86ui._.js:5259:29)
    at <unknown> (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/node_modules__pnpm_0ig86ui._.js:2696:39)
    at Array.map (<anonymous>)
    at generateImgAttrs (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/node_modules__pnpm_0ig86ui._.js:2696:24)
    at getImgProps (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/node_modules__pnpm_0ig86ui._.js:3109:27)
    at <unknown> (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/node_modules__pnpm_0ig86ui._.js:5640:82)
    at Object.react_stack_bottom_frame (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/0bij_next_dist_compiled_react-dom_0opbpo3._.js:15037:24)
    at renderWithHooks (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/0bij_next_dist_compiled_react-dom_0opbpo3._.js:4620:24)
    at updateForwardRef (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/0bij_next_dist_compiled_react-dom_0opbpo3._.js:5908:21)
    at beginWork (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/0bij_next_dist_compiled_react-dom_0opbpo3._.js:6766:24)
    at runWithFiberInDEV (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/0bij_next_dist_compiled_react-dom_0opbpo3._.js:965:74)
    at performUnitOfWork (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/0bij_next_dist_compiled_react-dom_0opbpo3._.js:9555:97)
    at workLoopSync (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/0bij_next_dist_compiled_react-dom_0opbpo3._.js:9449:40)
    at renderRootSync (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/0bij_next_dist_compiled_react-dom_0opbpo3._.js:9433:13)
    at performWorkOnRoot (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/0bij_next_dist_compiled_react-dom_0opbpo3._.js:9098:47)
    at performSyncWorkOnRoot (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/0bij_next_dist_compiled_react-dom_0opbpo3._.js:10263:9)
    at flushSyncWorkAcrossRoots_impl (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/0bij_next_dist_compiled_react-dom_0opbpo3._.js:10179:316)
    at processRootScheduleInMicrotask (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/0bij_next_dist_compiled_react-dom_0opbpo3._.js:10200:106)
    at <unknown> (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/0bij_next_dist_compiled_react-dom_0opbpo3._.js:10274:158)
    at VideoCard (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/_0ermrru._.js:2506:364)
    at renderCard (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/_0ermrru._.js:3533:353)
    at <unknown> (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/_0who9wd._.js:2190:47)
    at Array.map (<anonymous>)
    at EntityList (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/_0who9wd._.js:2189:44)
    at VideosPage (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/_0ermrru._.js:3511:325)
    at ClientPageRoot (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/0bij_next_1xlfntj._.js:6896:50) (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/node_modules__pnpm_0ig86ui._.js:5261:25)
[browser] Uncaught Error: Failed to parse src "finale2023-thumb.jpg" on `next/image`, if using relative image it must start with a leading slash "/" or be an absolute URL (http:// or https://)
    at defaultLoader (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/node_modules__pnpm_0ig86ui._.js:5262:45)
    at <unknown> (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/node_modules__pnpm_0ig86ui._.js:2696:39)
    at Array.map (<anonymous>)
    at generateImgAttrs (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/node_modules__pnpm_0ig86ui._.js:2696:24)
    at getImgProps (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/node_modules__pnpm_0ig86ui._.js:3109:27)
    at <unknown> (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/node_modules__pnpm_0ig86ui._.js:5640:82)
    at Object.react_stack_bottom_frame (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/0bij_next_dist_compiled_react-dom_0opbpo3._.js:15037:24)
    at renderWithHooks (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/0bij_next_dist_compiled_react-dom_0opbpo3._.js:4620:24)
    at updateForwardRef (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/0bij_next_dist_compiled_react-dom_0opbpo3._.js:5908:21)
    at beginWork (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/0bij_next_dist_compiled_react-dom_0opbpo3._.js:6766:24)
    at runWithFiberInDEV (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/0bij_next_dist_compiled_react-dom_0opbpo3._.js:965:74)
    at performUnitOfWork (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/0bij_next_dist_compiled_react-dom_0opbpo3._.js:9555:97)
    at workLoopSync (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/0bij_next_dist_compiled_react-dom_0opbpo3._.js:9449:40)
    at renderRootSync (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/0bij_next_dist_compiled_react-dom_0opbpo3._.js:9433:13)
    at performWorkOnRoot (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/0bij_next_dist_compiled_react-dom_0opbpo3._.js:9098:47)
    at performSyncWorkOnRoot (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/0bij_next_dist_compiled_react-dom_0opbpo3._.js:10263:9)
    at flushSyncWorkAcrossRoots_impl (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/0bij_next_dist_compiled_react-dom_0opbpo3._.js:10179:316)
    at processRootScheduleInMicrotask (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/0bij_next_dist_compiled_react-dom_0opbpo3._.js:10200:106)
    at <unknown> (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/0bij_next_dist_compiled_react-dom_0opbpo3._.js:10274:158)
    at VideoCard (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/_0ermrru._.js:2506:364)
    at renderCard (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/_0ermrru._.js:3533:353)
    at <unknown> (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/_0who9wd._.js:2190:47)
    at Array.map (<anonymous>)
    at EntityList (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/_0who9wd._.js:2189:44)
    at VideosPage (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/_0ermrru._.js:3511:325)
    at ClientPageRoot (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/0bij_next_1xlfntj._.js:6896:50)

advertisements: 
## Error Type
Console Error

## Error Message
Encountered two children with the same key, `position`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.


    at createConsoleError (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/0bij_next_dist_0_ghd7m._.js:2379:71)
    at handleConsoleError (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/0bij_next_dist_0_ghd7m._.js:3165:54)
    at error (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/0bij_next_dist_0_ghd7m._.js:3312:57)
    at console.overrideMethod [as error] (chrome-extension://gpphkfbcpidddadnkolkpfckpihlkkil/build/installHook.js:1:174822)
    at <unknown> (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/0bij_next_dist_compiled_react-dom_0opbpo3._.js:4104:33)
    at runWithFiberInDEV (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/0bij_next_dist_compiled_react-dom_0opbpo3._.js:965:74)
    at warnOnInvalidKey (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/0bij_next_dist_compiled_react-dom_0opbpo3._.js:4103:21)
    at reconcileChildrenArray (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/0bij_next_dist_compiled_react-dom_0opbpo3._.js:4129:160)
    at reconcileChildFibersImpl (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/0bij_next_dist_compiled_react-dom_0opbpo3._.js:4236:51)
    at <unknown> (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/0bij_next_dist_compiled_react-dom_0opbpo3._.js:4261:39)
    at reconcileChildren (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/0bij_next_dist_compiled_react-dom_0opbpo3._.js:5898:51)
    at beginWork (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/0bij_next_dist_compiled_react-dom_0opbpo3._.js:6758:1573)
    at runWithFiberInDEV (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/0bij_next_dist_compiled_react-dom_0opbpo3._.js:965:74)
    at performUnitOfWork (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/0bij_next_dist_compiled_react-dom_0opbpo3._.js:9555:97)
    at workLoopConcurrentByScheduler (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/0bij_next_dist_compiled_react-dom_0opbpo3._.js:9551:58)
    at renderRootConcurrent (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/0bij_next_dist_compiled_react-dom_0opbpo3._.js:9534:71)
    at performWorkOnRoot (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/0bij_next_dist_compiled_react-dom_0opbpo3._.js:9061:150)
    at performWorkOnRootViaSchedulerTask (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/0bij_next_dist_compiled_react-dom_0opbpo3._.js:10255:9)
    at MessagePort.performWorkUntilDeadline (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/0bij_next_dist_compiled_1g-a2v3._.js:2647:64)
    at <unknown> (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/_074smnu._.js:1964:384)
    at Array.map (<anonymous>:null:null)
    at EntityList (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/_074smnu._.js:1964:57)
    at ClientAdvertisementsPage (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/_1460a0j._.js:8477:325)
    at ClientPageRoot (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/0bij_next_1xlfntj._.js:6896:50)

Next.js version: 16.2.7 (Turbopack)

browser] [2026-06-18T16:23:07.243Z]  @firebase/app-check: AppCheck: 400 error. Attempts allowed again after 00m:02s (appCheck/initial-throttle). (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/0bij_next_dist_0_ghd7m._.js:2477:13)
🔄 Retry query, remaining retries: 1
❌ Erreur Neon Query: column reference "position" is ambiguous
Error in getAdvertisementStats: Error: Erreur lors de l’exécution de la requête PostgreSQL
    at query (lib\db\neon-client.ts:93:11)
    at async queryOne (lib\db\neon-client.ts:101:18)
    at async getAdvertisementStats (actions\advertisements.ts:467:20)
  91 |   } catch (error: any) {
  92 |     console.error("❌ Erreur Neon Query:", error.message);
> 93 |     throw new Error("Erreur lors de l’exécution de la requête PostgreS...
     |           ^
  94 |   }
  95 | }
  96 |
 POST /ad/advertisements 200 in 8.5s (next.js: 6ms, application-code: 8.5s)
  └─ ƒ getAdvertisementStats() in 8510ms actions/advertisements.ts
🔍 SQL: SELECT  ...
🔄 Retry query, remaining retries: 2
🔄 Retry query, remaining retries: 1
❌ Erreur Neon Query: column reference "position" is ambiguous
Error in getAdvertisementStats: Error: Erreur lors de l’exécution de la requête PostgreSQL
    at query (lib\db\neon-client.ts:93:11)
    at async queryOne (lib\db\neon-client.ts:101:18)
    at async getAdvertisementStats (actions\advertisements.ts:467:20)
  91 |   } catch (error: any) {
  92 |     console.error("❌ Erreur Neon Query:", error.message);
> 93 |     throw new Error("Erreur lors de l’exécution de la requête PostgreS...
     |           ^
  94 |   }
  95 | }
  96 |
 POST /ad/advertisements 200 in 7.9s (next.js: 5ms, application-code: 7.9s)
  └─ ƒ getAdvertisementStats() in 7858ms actions/advertisements.ts

  teams: 
    └─ ƒ getEntities("media", {"filters":{"limit":20,"with_uploader":true},"limit":20,"page":1,"...":"2 items not stringified"}) in 5527ms actions/entities.ts
 GET /ad/teams 200 in 15.7s (next.js: 15.6s, application-code: 52ms)
 GET /ad/teams 200 in 73ms (next.js: 7ms, application-code: 67ms)
🔍 SQL: SELECT COUNT(DISTINCT team_members.id) as total ...
🔍 SQL: SELECT team_members.* ...
 POST /ad/teams 200 in 2.2s (next.js: 26ms, application-code: 2.1s)
  └─ ƒ getEntities("teams", {"filters":{"is_active":"all","limit":"20"},"limit":20,"page":1,"...":"2 items not stringified"}) in 2107ms actions/entities.ts


  et c'est pareil pour tout le reste des entites.