❌ Erreur Neon Query: syntax error at or near "'edition_fighters'"
Error in getSubGroupById: Error: Erreur lors de l’exécution de la requête PostgreSQL
    at query (lib\db\neon-client.ts:93:11)
    at async queryOne (lib\db\neon-client.ts:101:18)
    at async getSubGroupById (actions\sub-groups.ts:677:20)
  91 |   } catch (error: any) {
  92 |     console.error("❌ Erreur Neon Query:", error.message);
> 93 |     throw new Error("Erreur lors de l’exécution de la requête PostgreSQL");
     |           ^
  94 |   }
  95 | }
  96 |
 Cache  🔄 Retry query, remaining retries: 2
 Cache  🔄 Retry query, remaining retries: 1
 Cache  ❌ Erreur Neon Query: syntax error at or near "'edition_fighters'"
 Cache  Error in getSubGroupById: Error: Erreur lors de l’exécution de la requête PostgreSQL
    at query (lib\db\neon-client.ts:93:11)
    at queryOne (lib\db\neon-client.ts:101:18)
    at getSubGroupById (actions\sub-groups.ts:677:20)
  91 |   } catch (error: any) {
  92 |     console.error("❌ Erreur Neon Query:", error.message);
> 93 |     throw new Error("Erreur lors de l’exécution de la requête PostgreSQL");
     |           ^
  94 |   }
  95 | }
  96 | {
  environmentName: 'Cache'
}
⨯ Error: Erreur lors de l’exécution de la requête PostgreSQL
    at query (lib\db\neon-client.ts:93:11)
    at queryOne (lib\db\neon-client.ts:101:18)
    at getSubGroupById (actions\sub-groups.ts:677:20)
  91 |   } catch (error: any) {
  92 |     console.error("❌ Erreur Neon Query:", error.message);
> 93 |     throw new Error("Erreur lors de l’exécution de la requête PostgreSQL");
     |           ^
  94 |   }
  95 | }
  96 | {
  environmentName: 'Cache',
  digest: '1552419315'
}
 POST /ad/sub-groups/82/matches/304 500 in 4.9s (compile: 13ms, generate-params: 137µs, render: 4.9s)
🔍 SQL: SELECT  ...
 Cache  🔍 SQL: SELECT  ...
🔄 Retry query, remaining retries: 2
🔄 Retry query, remaining retries: 1
❌ Erreur Neon Query: syntax error at or near "'edition_fighters'"
Error in getSubGroupById: Error: Erreur lors de l’exécution de la requête PostgreSQL
    at query (lib\db\neon-client.ts:93:11)
    at async queryOne (lib\db\neon-client.ts:101:18)
    at async getSubGroupById (actions\sub-groups.ts:677:20)
  91 |   } catch (error: any) {
  92 |     console.error("❌ Erreur Neon Query:", error.message);
> 93 |     throw new Error("Erreur lors de l’exécution de la requête PostgreSQL");
     |           ^
  94 |   }
  95 | }
  96 |
 Cache  🔄 Retry query, remaining retries: 2
 Cache  🔄 Retry query, remaining retries: 1
 Cache  ❌ Erreur Neon Query: syntax error at or near "'edition_fighters'"
 Cache  Error in getSubGroupById: Error: Erreur lors de l’exécution de la requête PostgreSQL
    at query (lib\db\neon-client.ts:93:11)
    at queryOne (lib\db\neon-client.ts:101:18)
    at getSubGroupById (actions\sub-groups.ts:677:20)
  91 |   } catch (error: any) {
  92 |     console.error("❌ Erreur Neon Query:", error.message);
> 93 |     throw new Error("Erreur lors de l’exécution de la requête PostgreSQL");
     |           ^
  94 |   }
  95 | }
  96 | {
  environmentName: 'Cache'
}
⨯ Error: Erreur lors de l’exécution de la requête PostgreSQL
    at query (lib\db\neon-client.ts:93:11)
    at queryOne (lib\db\neon-client.ts:101:18)
    at getSubGroupById (actions\sub-groups.ts:677:20)
  91 |   } catch (error: any) {
  92 |     console.error("❌ Erreur Neon Query:", error.message);
> 93 |     throw new Error("Erreur lors de l’exécution de la requête PostgreSQL");
     |           ^
  94 |   }
  95 | }
  96 | {
  environmentName: 'Cache',
  digest: '1552419315'
}
 POST /ad/sub-groups/82/matches/304 500 in 5.3s (compile: 34ms, generate-params: 26ms, render: 5.3s)