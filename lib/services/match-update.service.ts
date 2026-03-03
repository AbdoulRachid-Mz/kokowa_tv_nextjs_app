// lib/services/match-update.service.ts - VERSION FINALE

import { sendMatchPush } from "@/actions/matches";
import { pool } from "../db/neon-client";
import type { PoolClient } from "pg";
import { emitMatchEvent } from "@/actions/matches-2";

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

  // 🔥 Flag pour reset (pas une colonne DB)
  force_reset?: boolean;
}

export interface MatchState {
  sub_group: {
    score_region1: number;
    score_region2: number;
    nulls: number;
  };
  region1_id: number;
  region2_id: number;
  edition_regions: Map<number, { points: number; is_eliminated: boolean }>;
  edition_fighters: Map<number, { is_eliminated: boolean }>;
}

/**
 * 🧮 Calculateur d'état basé sur les matchs terminés
 */
class MatchStateCalculator {
  static async calculateState(
    client: PoolClient,
    subGroupId: number,
    excludeMatchId?: number
  ): Promise<MatchState> {
    // 1. Récupérer les infos de base
    const subGroupRes = await client.query(
      `SELECT sg.region1_id, sg.region2_id, p.edition_id
       FROM sub_groups sg
       JOIN phase_groups pg ON sg.group_id = pg.id
       JOIN phases p ON pg.phase_id = p.id
       WHERE sg.id = $1`,
      [subGroupId]
    );

    if (!subGroupRes.rowCount) {
      throw new Error('Sous-groupe non trouvé');
    }

    const { region1_id, region2_id, edition_id } = subGroupRes.rows[0];

    // 2. Récupérer tous les matchs terminés
    const matchesRes = await client.query(
      `SELECT 
         m.winner_fighter_id,
         m.loser_fighter_id,
         m.match_result,
         m.fighter1_id,
         m.fighter2_id
       FROM matches m
       WHERE m.sub_group_id = $1
         AND m.status = 'completed'
         AND m.is_active = true
         ${excludeMatchId ? 'AND m.id != $2' : ''}`,
      excludeMatchId ? [subGroupId, excludeMatchId] : [subGroupId]
    );

    // 3. Initialiser l'état
    const state: MatchState = {
      sub_group: {
        score_region1: 0,
        score_region2: 0,
        nulls: 0
      },
      region1_id,
      region2_id,
      edition_regions: new Map(),
      edition_fighters: new Map()
    };

    // Initialiser les régions avec 0 points
    if (region1_id) state.edition_regions.set(region1_id, { points: 0, is_eliminated: false });
    if (region2_id) state.edition_regions.set(region2_id, { points: 0, is_eliminated: false });

    // 4. Traiter chaque match
    for (const match of matchesRes.rows) {
      await this.applyMatchToState(client, state, match, edition_id);
    }

    return state;
  }

  private static async applyMatchToState(
    client: PoolClient,
    state: MatchState,
    match: any,
    editionId: number
  ) {
    // Match nul
    if (match.match_result === 'draw') {
      state.sub_group.nulls += 1;

      // +1 point pour chaque région
      for (const [regionId, regionState] of state.edition_regions) {
        regionState.points += 1;
      }

      // Marquer les deux fighters comme éliminés
      if (match.fighter1_id) {
        state.edition_fighters.set(match.fighter1_id, { is_eliminated: true });
      }
      if (match.fighter2_id) {
        state.edition_fighters.set(match.fighter2_id, { is_eliminated: true });
      }

      return;
    }

    // Victoire
    if (match.winner_fighter_id) {
      const winnerRes = await client.query(
        `SELECT region_id FROM fighters WHERE id = $1`,
        [match.winner_fighter_id]
      );

      if (winnerRes.rowCount) {
        const winnerRegionId = winnerRes.rows[0].region_id;

        // Mettre à jour les scores du sous-groupe
        if (winnerRegionId === state.region1_id) {
          state.sub_group.score_region1 += 1;
        } else if (winnerRegionId === state.region2_id) {
          state.sub_group.score_region2 += 1;
        }

        // Mettre à jour les points de la région
        const regionState = state.edition_regions.get(winnerRegionId);
        if (regionState) {
          regionState.points += 3;
        }

        // Marquer le vaincu comme éliminé
        if (match.loser_fighter_id) {
          state.edition_fighters.set(match.loser_fighter_id, { is_eliminated: true });
        }
      }
    }
  }

  static async syncState(
    client: PoolClient,
    subGroupId: number,
    calculatedState: MatchState
  ) {
    // 1. Mettre à jour le sous-groupe
    await client.query(
      `UPDATE sub_groups
       SET score_region1 = $1,
           score_region2 = $2,
           nulls = $3
       WHERE id = $4`,
      [
        calculatedState.sub_group.score_region1,
        calculatedState.sub_group.score_region2,
        calculatedState.sub_group.nulls,
        subGroupId
      ]
    );

    // 2. Mettre à jour edition_regions
    for (const [regionId, regionState] of calculatedState.edition_regions) {
      await client.query(
        `UPDATE edition_regions
         SET points = $1,
             is_eliminated = $2
         WHERE edition_id = (
           SELECT p.edition_id
           FROM sub_groups sg
           JOIN phase_groups pg ON sg.group_id = pg.id
           JOIN phases p ON pg.phase_id = p.id
           WHERE sg.id = $3
         ) AND region_id = $4`,
        [regionState.points, regionState.is_eliminated, subGroupId, regionId]
      );
    }

    // 3. Mettre à jour edition_fighters
    for (const [fighterId, fighterState] of calculatedState.edition_fighters) {
      await client.query(
        `UPDATE edition_fighters
         SET is_eliminated = $1
         WHERE edition_id = (
           SELECT p.edition_id
           FROM sub_groups sg
           JOIN phase_groups pg ON sg.group_id = pg.id
           JOIN phases p ON pg.phase_id = p.id
           WHERE sg.id = $2
         ) AND fighter_id = $3`,
        [fighterState.is_eliminated, subGroupId, fighterId]
      );
    }
  }
}

/**
 * 🏁 Vérifie si tous les matchs sont terminés et met à jour le statut du sous-groupe
 */
async function checkAndUpdateSubGroupStatus(
  client: PoolClient,
  subGroupId: number
) {
  // Vérifier si TOUS les matchs actifs sont terminés
  const checkRes = await client.query(
    `SELECT 
       COUNT(*) as total,
       COUNT(*) FILTER (WHERE status = 'completed') as completed
     FROM matches
     WHERE sub_group_id = $1 AND is_active = true`,
    [subGroupId]
  );

  const { total, completed } = checkRes.rows[0];

  // S'il n'y a pas de matchs, on ne fait rien
  if (total === 0) return;

  const allCompleted = (total === completed);

  // Mettre à jour le statut du sous-groupe
  await client.query(
    `UPDATE sub_groups
     SET status = CASE 
           WHEN $1 THEN 'completed'
           ELSE 'upcoming'
         END,
         is_completed = $1
     WHERE id = $2`,
    [allCompleted, subGroupId]
  );

  if (allCompleted) {
    console.log(`✅ Sous-groupe ${subGroupId} marqué comme terminé (${completed}/${total} matchs)`);
  }
}

/**
 * ✅ Fonction principale de mise à jour
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
      `SELECT m.*, sg.region1_id, sg.region2_id, p.edition_id, sg.id as sub_group_id
       FROM matches m
       JOIN sub_groups sg ON m.sub_group_id = sg.id
       JOIN phase_groups pg ON sg.group_id = pg.id
       JOIN phases p ON pg.phase_id = p.id
       WHERE m.id = $1`,
      [matchId]
    );

    if (!oldMatchRes.rowCount) throw new Error("Match introuvable");
    const oldMatch = oldMatchRes.rows[0];

    // 🟡 RESET MANUEL ou passage en réclamation
    if (updates.force_reset ||
      (oldMatch.status === 'completed' && updates.status === 'reclamation')) {

      console.log(`🔄 Reset du match ${matchId} - recalcul sans ce match`);

      // Recalculer l'état SANS ce match
      const stateWithoutMatch = await MatchStateCalculator.calculateState(
        client,
        oldMatch.sub_group_id,
        matchId
      );

      // Appliquer l'état recalculé
      await MatchStateCalculator.syncState(
        client,
        oldMatch.sub_group_id,
        stateWithoutMatch
      );
    }

    // 🧠 AUTO CALCUL DU LOSER
    if (
      updates.winner_fighter_id &&
      (updates.loser_fighter_id === undefined)
    ) {
      const fighter1 = oldMatch.fighter1_id;
      const fighter2 = oldMatch.fighter2_id;

      if (updates.winner_fighter_id === fighter1) {
        updates.loser_fighter_id = fighter2;
      } else if (updates.winner_fighter_id === fighter2) {
        updates.loser_fighter_id = fighter1;
      }
    }

    // 🔄 UPDATE DU MATCH
    const updatedMatch = await updateMatchInTransaction(client, matchId, updates);

    // 🔺 Si le match est maintenant terminé, recalculer l'état COMPLET
    if (
      oldMatch.status !== 'completed' &&
      updatedMatch.status === 'completed'
    ) {

      // Recalculer l'état complet (avec tous les matchs)
      const fullState = await MatchStateCalculator.calculateState(
        client,
        oldMatch.sub_group_id
      );

      // Synchroniser
      await MatchStateCalculator.syncState(
        client,
        oldMatch.sub_group_id,
        fullState
      );

      // Notification push
      await sendMatchPush(matchId, 'Le match a été complété', '🔥 Match terminé');
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

    // 🏁 Vérifier et mettre à jour le statut du sous-groupe APRÈS toutes les modifications
    await checkAndUpdateSubGroupStatus(client, oldMatch.sub_group_id);

    await client.query("COMMIT");

    // Émettre l'événement temps réel
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
 * 🔄 UPDATE MATCH DANS LA TRANSACTION
 */
async function updateMatchInTransaction(client: PoolClient, matchId: number, updates: MatchUpdate) {
  const fields: string[] = [];
  const values: any[] = [];
  let index = 1;

  // 🔥 Filtrer les champs qui n'existent pas dans la table
  const allowedFields = [
    'sub_group_id', 'match_number', 'match_date', 'start_time', 'end_time',
    'fighter1_id', 'fighter2_id', 'fighter1_initial_state', 'fighter2_initial_state',
    'initial_state', 'winner_fighter_id', 'loser_fighter_id', 'match_result',
    'total_duration', 'break_count', 'status', 'audience_count', 'video_url',
    'live_stream_url', 'notes'
  ];

  for (const [key, value] of Object.entries(updates)) {
    // Ignorer force_reset car ce n'est pas une colonne
    if (key === 'force_reset') continue;

    // Ne mettre à jour que les champs autorisés et non undefined
    if (allowedFields.includes(key) && value !== undefined) {
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