POST /ad/teams/create 500 in 5.5s (compile: 11ms, render: 5.5s)
🔍 SQL: SELECT * FROM team_members WHERE id = $1 ...
🔄 Retry query, remaining retries: 2
🔄 Retry query, remaining retries: 1
❌ Erreur Neon Query: invalid input syntax for type integer: "NaN"
⨯ Error: Erreur lors de l’exécution de la requête PostgreSQL
    at query (lib\db\neon-client.ts:90:11)
    at async queryOne (lib\db\neon-client.ts:98:18)
    at async getTeamMemberById (actions\teams.ts:102:18)
    at async Server.<anonymous> (server.ts:86:13)
  88 |   } catch (error: any) {
  89 |     /* eslint-disable */console.error(...oo_tx(`1819536672_89_4_89_56_11`,"❌ Erreur Neon Query:", error.message));
> 90 |     throw new Error("Erreur lors de l’exécution de la requête PostgreSQL");
     |           ^
  91 |   }
  92 | }
  93 | {
  digest: '1335798022'
}
 POST /ad/teams/create 500 in 6.6s (compile: 137ms, render: 6.4s)