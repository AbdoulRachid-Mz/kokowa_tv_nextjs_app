import { pool } from "../db/neon-client";
import { recomputeEditionState } from "./edition-recompute.service";
import type { PoolClient } from "pg";

export interface MatchUpdate {
  sub_group_id?: number;
  match_number?: number;
  match_date?: string;
  start_time?: string;
  end_time?: string;
  fighter1_id?: number | null;
  fighter2_id?: number | null;
  fighter1_initial_state?: 'eliminated' | 'not_eliminated';
  fighter2_initial_state?: 'eliminated' | 'not_eliminated';
  winner_fighter_id?: number | null;
  loser_fighter_id?: number | null;
  match_result?: 'fighter1_win' | 'fighter2_win' | 'draw' | 'cancelled' | 'postponed';
  total_duration?: string;
  break_count?: number;
  status?: 'scheduled' | 'live' | 'round_break' | 'completed' | 'cancelled' | 'postponed' | 'reclamation';
  audience_count?: number;
  video_url?: string;
  live_stream_url?: string;
  notes?: string;
}

export async function updateMatchAndRecompute(
  matchId: number,
  updates: MatchUpdate
) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1️⃣ Construction SAFE du UPDATE
    const fields: string[] = [];
    const values: any[] = [];
    let index = 1;

    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        fields.push(`${key} = $${index}`);
        values.push(value);
        index++;
      }
    }

    if (fields.length > 0) {
      await client.query(
        `
        UPDATE matches
        SET ${fields.join(", ")},
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $${index}
        `,
        [...values, matchId]
      );
    }

    // 2️⃣ Trouver l’édition liée
    const editionResult = await client.query<{
      edition_id: number;
    }>(
      `
      SELECT p.edition_id
      FROM matches m
      JOIN sub_groups sg ON m.sub_group_id = sg.id
      JOIN phase_groups pg ON sg.group_id = pg.id
      JOIN phases p ON pg.phase_id = p.id
      WHERE m.id = $1
      `,
      [matchId]
    );

    if (editionResult.rowCount === 0) {
      throw new Error("Edition introuvable pour ce match");
    }

    const editionId = editionResult.rows[0].edition_id;

    // 3️⃣ Recalcul GLOBAL (helper central)
    await recomputeEditionState(client, editionId);

    // 4️⃣ Commit
    await client.query("COMMIT");

    // 5️⃣ Retourner le match mis à jour
    const updatedMatch = await client.query(
      `SELECT * FROM matches WHERE id = $1`,
      [matchId]
    );

    return updatedMatch.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ updateMatchAndRecompute error:", error);
    throw error;
  } finally {
    client.release();
  }
}