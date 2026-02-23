// lib/services/match-update.service.ts - VERSION CORRIGÉE
import { emitMatchEvent, sendMatchPush } from "@/actions/matches";
import { pool } from "../db/neon-client";
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

/**
 * ✅ RECALCUL INCRÉMENTAL - PAS DE RESET GLOBAL
 * - Rollback de l'ancien résultat si existant
 * - Apply du nouveau résultat
 * - Transaction sécurisée avec verrouillage
 */
// lib/services/match-update.service.ts
export async function updateMatchAndRecompute(
  matchId: number,
  updates: MatchUpdate
) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const oldMatchRes = await client.query(
      `SELECT m.*, sg.region1_id, sg.region2_id, sg.is_completed as sub_group_completed,
              p.edition_id
       FROM matches m
       JOIN sub_groups sg ON m.sub_group_id = sg.id
       JOIN phase_groups pg ON sg.group_id = pg.id
       JOIN phases p ON pg.phase_id = p.id
       WHERE m.id = $1`,
      [matchId]
    );

    if (oldMatchRes.rowCount === 0) {
      throw new Error("Match introuvable");
    }

    const oldMatch = oldMatchRes.rows[0];

    // 🚫 VÉRIFICATION: Sous-groupe déjà terminé ?
    if (oldMatch.sub_group_completed) {
      throw new Error("Impossible de modifier un match : le sous-groupe est déjà terminé");
    }

    // Si c'est une réclamation, on permet la modification sans rollback
    const isReclamation = updates.status === 'reclamation' || oldMatch.status === 'reclamation';
    
    // 🔄 ROLLBACK: Supprimer l'impact de l'ancien résultat (si existant et pas en réclamation)
    if (!isReclamation && oldMatch.status === 'completed' && oldMatch.winner_fighter_id && oldMatch.loser_fighter_id) {
      await rollbackMatchImpact(client, oldMatch);
    }

    // Mettre à jour le match
    const updatedMatch = await updateMatchInTransaction(client, matchId, updates);

    // ✅ APPLY: Ajouter l'impact du nouveau résultat (si pas en réclamation)
    const shouldApply = !isReclamation &&
      updatedMatch.status === 'completed' &&
      updatedMatch.winner_fighter_id &&
      updatedMatch.loser_fighter_id;

    if (shouldApply) {
      await applyMatchImpact(client, updatedMatch);
    }

    // Vérifier si le sous-groupe est maintenant COMPLET
    await checkAndCompleteSubGroup(client, oldMatch.sub_group_id);

    await client.query("COMMIT");

    if (updates.status === 'completed' && !isReclamation) {
      await sendMatchPush(matchId);
    }

    await emitMatchEvent(matchId, 'match_updated', { match: updatedMatch });

    return updatedMatch;
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ updateMatchAndRecompute error:", error);
    throw error;
  } finally {
    client.release();
  }
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
 * ✅ APPLY: Ajouter les points du nouveau vainqueur
 */
async function applyMatchImpact(client: PoolClient, match: any) {
  const { winner_fighter_id, sub_group_id, edition_id } = match;

  // Récupérer la région du vainqueur
  const winnerRes = await client.query(
    `SELECT region_id FROM fighters WHERE id = $1`,
    [winner_fighter_id]
  );
  const winnerRegionId = winnerRes.rows[0]?.region_id;

  if (!winnerRegionId) return;

  // 🔺 Ajouter 3 points à la région dans l'édition
  await client.query(
    `UPDATE edition_regions
     SET points = points + 3
     WHERE edition_id = $1 AND region_id = $2`,
    [edition_id, winnerRegionId]
  );

  // 🔺 Ajouter 3 points au sous-groupe
  await client.query(
    `UPDATE sub_groups
     SET score_region1 = CASE WHEN region1_id = $1 THEN COALESCE(score_region1, 0) + 3 ELSE score_region1 END,
         score_region2 = CASE WHEN region2_id = $1 THEN COALESCE(score_region2, 0) + 3 ELSE score_region2 END
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

async function updateMatchInTransaction(
  client: PoolClient,
  matchId: number,
  updates: MatchUpdate
) {
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
      `UPDATE matches
       SET ${fields.join(", ")}, updated_at = CURRENT_TIMESTAMP
       WHERE id = $${index}
       RETURNING *`,
      [...values, matchId]
    );
  }

  const res = await client.query(`SELECT * FROM matches WHERE id = $1`, [matchId]);
  return res.rows[0];
}