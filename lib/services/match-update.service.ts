// lib/services/match-update.service.ts - VERSION CORRIGÉE
import { sendMatchPush } from "@/actions/matches";
import { pool } from "../db/neon-client";
import type { PoolClient } from "pg";
import { emitMatchEvent, restoreMatchInitialState } from "@/actions/matches-2";

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
  match_result?: 'fighter1_win' | 'fighter2_win' | 'draw' | 'cancelled' | 'postponed' | undefined;
  total_duration?: string;
  break_count?: number;
  status?: 'scheduled' | 'live' | 'round_break' | 'completed' | 'cancelled' | 'postponed' | 'reclamation';
  audience_count?: number;
  video_url?: string;
  live_stream_url?: string;
  notes?: string;

  // 🔥 AJOUT POUR RESET MANUEL
  force_reset?: boolean;
  initial_state?: JSON;
}
/**
 * ✅ RECALCUL INCRÉMENTAL - BASÉ SUR INITIAL_STATE
 * - Rollback via restoreMatchInitialState si nécessaire
 * - Apply des nouveaux updates
 */
export async function updateMatchAndRecompute(
  matchId: number,
  updates: MatchUpdate
) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 🔒 LOCK
    await client.query(`SELECT id FROM matches WHERE id = $1 FOR UPDATE`, [matchId]);

    const oldMatchRes = await client.query(
      `SELECT m.*, sg.region1_id, sg.region2_id, p.edition_id
       FROM matches m
       JOIN sub_groups sg ON m.sub_group_id = sg.id
       JOIN phase_groups pg ON sg.group_id = pg.id
       JOIN phases p ON pg.phase_id = p.id
       WHERE m.id = $1`,
      [matchId]
    );

    if (!oldMatchRes.rowCount) throw new Error("Match introuvable");
    const oldMatch = oldMatchRes.rows[0];

    // 🟡 RESET MANUEL
    if (updates.force_reset || (oldMatch.status === 'completed' && updates.status === 'reclamation')) {
      await restoreMatchInitialState(client, matchId);
    }

    // 🔄 UPDATE DU MATCH
    const updatedMatch = await updateMatchInTransaction(client, matchId, updates);

    // 🔺 APPLY INCRÉMENTAL DES POINTS
    if (
      updatedMatch.status === 'completed' &&
      updatedMatch.winner_fighter_id &&
      updatedMatch.loser_fighter_id
    ) {
      await applyMatchImpact(client, updatedMatch);
      await sendMatchPush(matchId, 'Le match a été complété', '🔥 Match en direct');
    }

    // 🔥 Si on démarre un match
    if (updates.status === 'live') {
      await client.query(`
    UPDATE sub_groups
    SET status = 'ongoing'
    WHERE id = $1
    AND status != 'completed'
  `, [oldMatch.sub_group_id]);
    }

    await client.query("COMMIT");

    await emitMatchEvent(matchId, "match_updated", { match: updatedMatch });

    return updatedMatch;

  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ updateMatchAndRecompute:", error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * 🔄 APPLY: Ajouter les points du nouveau vainqueur
 */
async function applyMatchImpact(client: PoolClient, match: any) {
  const {
    winner_fighter_id,
    loser_fighter_id,
    sub_group_id,
    edition_id,
    match_result
  } = match;

  // 🎯 MATCH NUL
  if (match_result === 'draw') {

    const subGroupRes = await client.query(
      `SELECT region1_id, region2_id FROM sub_groups WHERE id = $1`,
      [sub_group_id]
    );

    const { region1_id, region2_id } = subGroupRes.rows[0];

    // +1 / +1 dans le sous-groupe
    await client.query(`
      UPDATE sub_groups
      SET score_region1 = COALESCE(score_region1,0) + 1,
          score_region2 = COALESCE(score_region2,0) + 1,
          nulls = COALESCE(nulls,0) + 1
      WHERE id = $1
    `, [sub_group_id]);

    // (optionnel) +1 / +1 dans edition_regions
    await client.query(`
      UPDATE edition_regions
      SET points = points + 1
      WHERE edition_id = $1
      AND region_id IN ($2, $3)
    `, [edition_id, region1_id, region2_id]);

    return;
  }

  // 🎯 VICTOIRE
  if (winner_fighter_id) {

    const winnerRes = await client.query(
      `SELECT region_id FROM fighters WHERE id = $1`,
      [winner_fighter_id]
    );

    const winnerRegionId = winnerRes.rows[0]?.region_id;

    if (!winnerRegionId) return;

    // +3 edition
    await client.query(`
      UPDATE edition_regions
      SET points = points + 3
      WHERE edition_id = $1
      AND region_id = $2
    `, [edition_id, winnerRegionId]);

    // +1 sous-groupe
    await client.query(`
      UPDATE sub_groups
      SET score_region1 = CASE
            WHEN region1_id = $1 THEN COALESCE(score_region1,0) + 1
            ELSE score_region1
          END,
          score_region2 = CASE
            WHEN region2_id = $1 THEN COALESCE(score_region2,0) + 1
            ELSE score_region2
          END
      WHERE id = $2
    `, [winnerRegionId, sub_group_id]);
  }
}

/**
 * 🔄 UPDATE MATCH DANS LA TRANSACTION
 */
async function updateMatchInTransaction(client: PoolClient, matchId: number, updates: MatchUpdate) {
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
      `UPDATE matches SET ${fields.join(", ")}, updated_at = CURRENT_TIMESTAMP WHERE id = $${index}`,
      [...values, matchId]
    );
  }

  const res = await client.query(`SELECT * FROM matches WHERE id = $1`, [matchId]);
  return res.rows[0];
}

/**
 * 🔄 ROLLBACK: Retirer les points de l'ancien vainqueur
 */
async function rollbackMatchImpact(client: PoolClient, match: any) {
  const { winner_fighter_id, sub_group_id, edition_id } = match;

  // Récupérer la région du vainqueur
  const winnerRes = await client.query(
    `SELECT region_id FROM fighters WHERE id = $1`,
    [winner_fighter_id]
  );
  const winnerRegionId = winnerRes.rows[0]?.region_id;

  if (!winnerRegionId) return;

  // 🔻 Retirer 3 points à la région dans l'édition
  await client.query(
    `UPDATE edition_regions
     SET points = GREATEST(0, points - 3)
     WHERE edition_id = $1 AND region_id = $2`,
    [edition_id, winnerRegionId]
  );

  // 🔻 Retirer 3 points au sous-groupe
  await client.query(
    `UPDATE sub_groups
     SET score_region1 = CASE WHEN region1_id = $1 THEN GREATEST(0, score_region1 - 3) ELSE score_region1 END,
         score_region2 = CASE WHEN region2_id = $1 THEN GREATEST(0, score_region2 - 3) ELSE score_region2 END
     WHERE id = $2`,
    [winnerRegionId, sub_group_id]
  );
}


/**
 * 🏁 Vérifier et marquer le sous-groupe comme terminé si tous les matchs sont completed
 */
async function checkAndCompleteSubGroup(client: PoolClient, subGroupId: number) {
  // Vérifier si TOUS les matchs du sous-groupe sont 'completed'
  const checkRes = await client.query(
    `SELECT 
       COUNT(*) as total,
       COUNT(*) FILTER (WHERE status = 'completed') as completed
     FROM matches
     WHERE sub_group_id = $1 AND is_active = true`,
    [subGroupId]
  );

  const { total, completed } = checkRes.rows[0];

  // Si tous les matchs sont terminés et qu'il y a au moins 1 match
  if (total > 0 && total === completed) {
    await client.query(
      `UPDATE sub_groups
       SET status = 'completed',
           is_completed = true
       WHERE id = $1 AND is_completed = false`,
      [subGroupId]
    );

    console.log(`✅ Sous-groupe ${subGroupId} marqué comme terminé`);
  }
}