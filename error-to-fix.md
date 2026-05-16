GET /ad/teams/create 200 in 7.3s (compile: 7.2s, render: 101ms)
🔍 SQL: INSERT INTO team_members (full_name, first_name, last_name, email, phone, role, department, avatar_url, profile_image, cover_image, bio, quote, social_links, badges, expertise, languages, is_lead, is_active, years_experience, projects_count, contributions_count, position_order, availability) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23) RETURNING * ...
🔄 Retry query, remaining retries: 2
🔄 Retry query, remaining retries: 1
❌ Erreur Neon Query: column "full_name" of relation "team_members" does not exist
⨯ Error: Erreur lors de l’exécution de la requête PostgreSQL
    at query (lib\db\neon-client.ts:90:11)
    at async createTeamMember (actions\teams.ts:127:15)
    at async Server.<anonymous> (server.ts:86:13)
  88 |   } catch (error: any) {
  89 |     console.error("❌ Erreur Neon Query:", error.message);
> 90 |     throw new Error("Erreur lors de l’exécution de la requête PostgreSQL");
     |           ^
  91 |   }
  92 | }
  93 | {
  digest: '4112055723'
}