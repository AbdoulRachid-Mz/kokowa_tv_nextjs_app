// lib/services/match-update.service.ts - Version améliorée

import { sendMatchPush } from "@/actions/matches";
import { pool, query } from "../db/neon-client";
import type { PoolClient } from "pg";
import { emitMatchEvent } from "@/actions/realtime";
import { getMatchById } from "@/actions/matches-2";
import {
  clearEditionLiveMatchIfMatches,
  syncEditionLiveMatch,
} from "../realtime/rtdb-sync";
import { dlog } from "./match-update.debug";
import { RealtimeLiveMatchInfo } from "@/types/realtime";
import { syncMatchOfficialAchievements } from "@/actions/achievements";

export interface MatchUpdate {
  sub_group_id?: number;
  match_number?: number;
  match_date?: string;
  start_time?: string;
  end_time?: string;
  start_time2?: string; // NOUVEAU - timestamp ISO complet
  fighter1_id?: number | null;
  fighter2_id?: number | null;
  fighter1_initial_state?: "eliminated" | "not_eliminated";
  fighter2_initial_state?: "eliminated" | "not_eliminated";
  referee_id?: number | null;
  winner_fighter_id?: number | null;
  loser_fighter_id?: number | null;
  match_result?:
    | "fighter1_win"
    | "fighter2_win"
    | "draw"
    | "cancelled"
    | "postponed"
    | undefined;
  total_duration?: string;
  break_count?: number;
  status?:
    | "scheduled"
    | "live"
    | "round_break"
    | "completed"
    | "cancelled"
    | "postponed"
    | "reclamation";
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
    excludeMatchId?: number,
  ): Promise<MatchState> {
    // 1. Récupérer les infos de base
    const subGroupRes = await client.query(
      `SELECT sg.region1_id, sg.region2_id, p.edition_id
       FROM sub_groups sg
       JOIN phase_groups pg ON sg.group_id = pg.id
       JOIN phases p ON pg.phase_id = p.id
       WHERE sg.id = $1`,
      [subGroupId],
    );

    if (!subGroupRes.rowCount) {
      throw new Error("Sous-groupe non trouvé");
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
         ${excludeMatchId ? "AND m.id != $2" : ""}`,
      excludeMatchId ? [subGroupId, excludeMatchId] : [subGroupId],
    );

    // 3. Initialiser l'état
    const state: MatchState = {
      sub_group: {
        score_region1: 0,
        score_region2: 0,
        nulls: 0,
      },
      region1_id,
      region2_id,
      edition_regions: new Map(),
      edition_fighters: new Map(),
    };

    // Initialiser les régions avec 0 points
    if (region1_id)
      state.edition_regions.set(region1_id, {
        points: 0,
        is_eliminated: false,
      });
    if (region2_id)
      state.edition_regions.set(region2_id, {
        points: 0,
        is_eliminated: false,
      });

    // 4. Collecter tous les fighter_ids uniques
    const fighterIds = new Set<number>();
    for (const match of matchesRes.rows) {
      if (match.winner_fighter_id) fighterIds.add(match.winner_fighter_id);
      if (match.loser_fighter_id) fighterIds.add(match.loser_fighter_id);
      if (match.fighter1_id) fighterIds.add(match.fighter1_id);
      if (match.fighter2_id) fighterIds.add(match.fighter2_id);
    }

    // 5. Charger les fighters en une seule requête
    const fighterRegionMap = new Map<number, number>();
    if (fighterIds.size > 0) {
      const fightersRes = await client.query(
        `SELECT id, region_id FROM fighters WHERE id = ANY($1)`,
        [Array.from(fighterIds)],
      );
      for (const row of fightersRes.rows) {
        fighterRegionMap.set(row.id, row.region_id);
      }
    }

    // 6. Traiter chaque match
    for (const match of matchesRes.rows) {
      this.applyMatchToState(state, match, fighterRegionMap);
    }

    return state;
  }

  private static applyMatchToState(
    state: MatchState,
    match: any,
    fighterRegionMap: Map<number, number>,
  ) {
    // Match nul
    if (match.match_result === "draw") {
      state.sub_group.nulls += 1;

      // +1 point pour chaque région
      for (const [regionId, regionState] of state.edition_regions) {
        regionState.points += 1;
      }

      // Marquer les DEUX fighters comme éliminés
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
      const winnerRegionId = fighterRegionMap.get(match.winner_fighter_id);

      if (winnerRegionId !== undefined) {
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
          state.edition_fighters.set(match.loser_fighter_id, {
            is_eliminated: true,
          });
        }
      }
    }
  }

  static async syncState(
    client: PoolClient,
    subGroupId: number,
    calculatedState: MatchState,
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
        subGroupId,
      ],
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
        [regionState.points, regionState.is_eliminated, subGroupId, regionId],
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
        [fighterState.is_eliminated, subGroupId, fighterId],
      );
    }
  }
}

/**
 * 🏁 Vérifie si tous les matchs sont terminés et met à jour le statut du sous-groupe ET du groupe parent
 */
async function checkAndUpdateGroupStatus(
  client: PoolClient,
  subGroupId: number,
) {
  // 1. Vérifier si TOUS les matchs actifs sont terminés
  const checkRes = await client.query(
    `SELECT 
       COUNT(*) as total,
       COUNT(*) FILTER (WHERE status = 'completed') as completed
     FROM matches
     WHERE sub_group_id = $1 AND is_active = true`,
    [subGroupId],
  );

  const { total, completed } = checkRes.rows[0];

  // S'il n'y a pas de matchs, on ne fait rien
  if (total === 0) return;

  const allCompleted = total === completed;

  // 🔥 Mettre à jour le statut du sous-groupe
  await client.query(
    `UPDATE sub_groups
     SET status = CASE 
           WHEN $1 THEN 'completed'
           ELSE 'ongoing'
         END,
         is_completed = $1
     WHERE id = $2`,
    [allCompleted, subGroupId],
  );

  // 2. Mettre à jour le groupe parent (phase_groups)
  // Récupérer l'ID du groupe parent
  const groupRes = await client.query(
    `SELECT group_id FROM sub_groups WHERE id = $1`,
    [subGroupId],
  );

  const groupId = groupRes.rows[0]?.group_id;

  if (groupId) {
    // Vérifier si TOUS les sous-groupes de ce groupe sont terminés
    const subGroupsRes = await client.query(
      `SELECT 
         COUNT(*) as total,
         COUNT(*) FILTER (WHERE is_completed = true) as completed
       FROM sub_groups
       WHERE group_id = $1 AND is_active = true`,
      [groupId],
    );

    const { total: subTotal, completed: subCompleted } = subGroupsRes.rows[0];
    const totalNum = parseInt(subTotal, 10);
    const allSubGroupsCompleted = totalNum > 0 && subTotal === subCompleted;

    // Mettre à jour le groupe parent
    await client.query(
      `UPDATE phase_groups
       SET is_completed = $1
       WHERE id = $2`,
      [allSubGroupsCompleted, groupId],
    );

    if (allSubGroupsCompleted) {
      console.log(
        `✅ Groupe parent ${groupId} marqué comme terminé (tous les sous-groupes terminés)`,
      );
    }
  }

  if (allCompleted) {
    console.log(
      `✅ Sous-groupe ${subGroupId} marqué comme terminé (${completed}/${total} matchs)`,
    );
  } else {
    console.log(
      `🔄 Sous-groupe ${subGroupId} en cours (${completed}/${total} matchs terminés)`,
    );
  }
}

/**
 * 🔥 Gère l'unicité des matchs live et des sous-groupes ongoing
 */
interface DisplacedLiveMatch {
  id: number;
  sub_group_id: number;
  edition_id: number;
}

interface LiveTransitionEffects {
  displacedMatches: DisplacedLiveMatch[];
  changedSubGroupIds: number[];
}

/**
 * Garantit un seul match au statut "live" dans toute l'application.
 *
 * Les matchs en round_break/reclamation sont volontairement conservés :
 * ils restent dans leur statut et leur sous-groupe reste ongoing.
 * Les écritures RTDB sont différées après le COMMIT PostgreSQL.
 */
async function ensureUniqueLiveStates(
  client: PoolClient,
  matchId: number,
  subGroupId: number,
  targetStatus: string,
): Promise<LiveTransitionEffects> {
  const effects: LiveTransitionEffects = {
    displacedMatches: [],
    changedSubGroupIds: [],
  };

  if (targetStatus === "live") {
    // Le verrou advisory global est pris par l'appelant avant le verrou de ligne.
    // Il sérialise les démarrages simultanés, toutes éditions confondues.
    const liveMatchesRes = await client.query<DisplacedLiveMatch>(
      `SELECT m.id, m.sub_group_id, p.edition_id
       FROM matches m
       JOIN sub_groups sg ON sg.id = m.sub_group_id
       JOIN phase_groups pg ON pg.id = sg.group_id
       JOIN phases p ON p.id = pg.phase_id
       WHERE m.id <> $1
         AND m.status = 'live'
         AND m.is_active = true
       FOR UPDATE OF m`,
      [matchId],
    );

    effects.displacedMatches = liveMatchesRes.rows;

    if (effects.displacedMatches.length > 0) {
      const displacedIds = effects.displacedMatches.map((match) => match.id);
      const displacedSubGroupIds = [
        ...new Set(effects.displacedMatches.map((match) => match.sub_group_id)),
      ];

      // On arrête uniquement les matchs réellement live.
      // Le temps total et le nombre de pauses sont conservés.
      await client.query(
        `UPDATE matches
         SET status = 'scheduled',
             start_time2 = NULL,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = ANY($1::int[])
           AND status = 'live'`,
        [displacedIds],
      );

      // Un sous-groupe contenant encore un match suspendu reste ongoing.
      // Les autres sous-groupes concernés repassent upcoming.
      const subgroupRes = await client.query<{ id: number }>(
        `UPDATE sub_groups sg
         SET status = CASE
           WHEN EXISTS (
             SELECT 1
             FROM matches m
             WHERE m.sub_group_id = sg.id
               AND m.is_active = true
               AND m.status IN ('live', 'round_break', 'reclamation')
           ) THEN 'ongoing'
           ELSE 'upcoming'
         END
         WHERE sg.id = ANY($1::int[])
           AND sg.id <> $2
           AND sg.status <> 'completed'
           AND sg.is_completed = false
         RETURNING sg.id`,
        [displacedSubGroupIds, subGroupId],
      );

      effects.changedSubGroupIds = subgroupRes.rows.map((row) => row.id);
    }

    // Le sous-groupe du nouveau match devient ongoing.
    await client.query(
      `UPDATE sub_groups
       SET status = 'ongoing'
       WHERE id = $1
         AND status <> 'completed'
         AND is_completed = false`,
      [subGroupId],
    );

    console.log(
      `🔴 Match ${matchId} live ; ${effects.displacedMatches.length} ancien(s) match(s) live remplacé(s). Les matchs en pause/réclamation sont conservés.`,
    );
  } else if (targetStatus === "round_break" || targetStatus === "reclamation") {
    console.log(`⏸️ Match ${matchId} conservé en ${targetStatus}`);
  } else if (targetStatus === "completed") {
    console.log(`✅ Match ${matchId} terminé`);
  }

  return effects;
}

/**
 * ✅ Fonction principale de mise à jour
 */
export async function updateMatchAndRecompute(
  matchId: number,
  updates: MatchUpdate,
) {
  const client = await pool.connect();
  let transactionStarted = false;
  let transactionCommitted = false;

  try {
    dlog(`BEGIN matchId=${matchId}`);
    await client.query("SET lock_timeout = '5s'");
    await client.query("SET statement_timeout = '30s'");
    await client.query("BEGIN");
    transactionStarted = true;
    dlog("after BEGIN");

    // Important : prendre le verrou global AVANT le verrou de la ligne cible.
    // Sinon deux démarrages concurrents pourraient se bloquer mutuellement
    // en verrouillant chacun leur match avant de demander le verrou global.
    if (updates.status === "live") {
      await client.query("SELECT pg_advisory_xact_lock(2026, 1109)");
      dlog("after GLOBAL LIVE advisory lock");
    }

    // 🔒 LOCK du match cible
    try {
      await client.query(
        `SELECT id FROM matches WHERE id = $1 FOR UPDATE NOWAIT`,
        [matchId],
      );
    } catch (lockErr: any) {
      if (lockErr?.code === "55P03") {
        dlog("lock conflict, retrying after 200ms");
        await new Promise((r) => setTimeout(r, 200));
        await client.query(
          `SELECT id FROM matches WHERE id = $1 FOR UPDATE NOWAIT`,
          [matchId],
        );
      } else {
        throw lockErr;
      }
    }
    dlog("after LOCK");

    const oldMatchRes = await client.query(
      `SELECT m.*, sg.region1_id, sg.region2_id, p.edition_id, sg.id as sub_group_id,
              sg.is_completed as sub_group_is_completed,
              sg.status as sub_group_status
       FROM matches m
       JOIN sub_groups sg ON m.sub_group_id = sg.id
       JOIN phase_groups pg ON sg.group_id = pg.id
       JOIN phases p ON pg.phase_id = p.id
       WHERE m.id = $1`,
      [matchId],
    );

    if (!oldMatchRes.rowCount) throw new Error("Match introuvable");
    const oldMatch = oldMatchRes.rows[0];
    dlog(`oldMatch loaded status=${oldMatch.status} subGroup=${oldMatch.sub_group_id}`);

    // 🟡 RESET MANUEL ou passage en réclamation
    if (
      updates.force_reset ||
      (oldMatch.status === "completed" && updates.status === "reclamation")
    ) {
      const stateWithoutMatch = await MatchStateCalculator.calculateState(
        client,
        oldMatch.sub_group_id,
        matchId,
      );

      await MatchStateCalculator.syncState(
        client,
        oldMatch.sub_group_id,
        stateWithoutMatch,
      );
    }

    // 🧠 AUTO CALCUL DU LOSER
    if (
      updates.winner_fighter_id &&
      (updates.loser_fighter_id === undefined || updates.loser_fighter_id === null)
    ) {
      const fighter1 = oldMatch.fighter1_id;
      const fighter2 = oldMatch.fighter2_id;

      if (updates.winner_fighter_id === fighter1 && fighter2) {
        updates.loser_fighter_id = fighter2;
      } else if (updates.winner_fighter_id === fighter2 && fighter1) {
        updates.loser_fighter_id = fighter1;
      } else {
        updates.loser_fighter_id = null;
      }
    }

    let liveTransitionEffects: LiveTransitionEffects = {
      displacedMatches: [],
      changedSubGroupIds: [],
    };

    if (updates.status && updates.status !== oldMatch.status) {
      dlog(`ensureUniqueLiveStates target=${updates.status}`);
      liveTransitionEffects = await ensureUniqueLiveStates(
        client,
        matchId,
        oldMatch.sub_group_id,
        updates.status,
      );
    }

    dlog("before updateMatchInTransaction");
    const updatedMatch = await updateMatchInTransaction(
      client,
      matchId,
      updates,
    );
    dlog(`updatedMatch status=${updatedMatch.status}`);

    if (
      oldMatch.status !== "completed" &&
      updatedMatch.status === "completed"
    ) {
      const fullState = await MatchStateCalculator.calculateState(
        client,
        oldMatch.sub_group_id,
      );

      await MatchStateCalculator.syncState(
        client,
        oldMatch.sub_group_id,
        fullState,
      );
    }

    await checkAndUpdateGroupStatus(client, oldMatch.sub_group_id);

    dlog("before COMMIT");
    await client.query("COMMIT");
    transactionCommitted = true;
    dlog("after COMMIT");

    // PostgreSQL est maintenant libéré : aucune opération Firebase ne prolonge
    // la transaction ni ne retarde la libération des verrous SQL.
    const editionId = Number(oldMatch.edition_id);
    const newStatus = updatedMatch.status;
    const postCommitTasks: Promise<unknown>[] = [];

    // Synchroniser chaque ancien match réellement live qui vient d'être arrêté.
    for (const displaced of liveTransitionEffects.displacedMatches) {
      postCommitTasks.push(
        emitMatchEvent(
          displaced.id,
          "match_replaced",
          undefined,
          displaced.sub_group_id,
        ),
      );
      postCommitTasks.push(
        clearEditionLiveMatchIfMatches(
          Number(displaced.edition_id),
          displaced.id,
        ),
      );
    }

    // Publier le match cible et son sous-groupe une seule fois.
    postCommitTasks.push(
      emitMatchEvent(
        matchId,
        "match_updated",
        { match: updatedMatch },
        oldMatch.sub_group_id,
      ),
    );

    if (
      newStatus === "live" ||
      newStatus === "round_break" ||
      newStatus === "reclamation"
    ) {
      const liveMatchInfo: RealtimeLiveMatchInfo = {
        subGroupId: updatedMatch.sub_group_id,
        matchId: updatedMatch.id,
        status: newStatus,
        fighter1Id: updatedMatch.fighter1_id,
        fighter2Id: updatedMatch.fighter2_id,
        startTime: updatedMatch.start_time2 || null,
      };
      postCommitTasks.push(syncEditionLiveMatch(editionId, liveMatchInfo));
    } else if (
      newStatus === "scheduled" ||
      newStatus === "completed" ||
      newStatus === "cancelled" ||
      newStatus === "postponed"
    ) {
      // Ne pas effacer le pointeur d'un autre match de la même édition.
      postCommitTasks.push(
        clearEditionLiveMatchIfMatches(editionId, matchId),
      );
    }

    void Promise.allSettled(postCommitTasks).then((results) => {
      results.forEach((result) => {
        if (result.status === "rejected") {
          console.error("Post-commit realtime sync failed:", result.reason);
        }
      });
    });

    return updatedMatch;
  } catch (error) {
    if (transactionStarted && !transactionCommitted) {
      try {
        await client.query("ROLLBACK");
      } catch (rollbackError) {
        console.error("❌ PostgreSQL rollback failed:", rollbackError);
      }
    }
    console.error("❌ updateMatchAndRecompute:", error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * 🔄 UPDATE MATCH DANS LA TRANSACTION
 */
async function updateMatchInTransaction(
  client: PoolClient,
  matchId: number,
  updates: MatchUpdate,
) {
  const fields: string[] = [];
  const values: any[] = [];
  let index = 1;

  // 🔥 Filtrer les champs qui n'existent pas dans la table
  const allowedFields = [
    "sub_group_id",
    "match_number",
    "match_date",
    "start_time",
    "start_time2",
    "end_time",
    "fighter1_id",
    "fighter2_id",
    "fighter1_initial_state",
    "fighter2_initial_state",
    "initial_state",
    "winner_fighter_id",
    "loser_fighter_id",
    "match_result",
    "total_duration",
    "break_count",
    "status",
    "audience_count",
    "video_url",
    "live_stream_url",
    "notes",
    "referee_id",
  ];

  for (const [key, value] of Object.entries(updates)) {
    // Ignorer force_reset car ce n'est pas une colonne
    if (key === "force_reset") continue;

    // Ne mettre à jour que les champs autorisés
    if (allowedFields.includes(key)) {
      // ✅ Gérer spécifiquement loser_fighter_id pour éviter -1
      if (key === "loser_fighter_id") {
        // Si la valeur est -1 ou undefined, on met null
        const normalizedValue =
          value === -1 || value === undefined ? null : value;
        fields.push(`${key} = $${index}`);
        values.push(normalizedValue);
        index++;
      }
      // ✅ Gérer winner_fighter_id aussi
      else if (
        key === "winner_fighter_id" &&
        (value === -1 || value === undefined)
      ) {
        fields.push(`${key} = $${index}`);
        values.push(null);
        index++;
      }
      // Pour les autres champs, si la valeur est undefined, on ignore
      else if (value !== undefined) {
        fields.push(`${key} = $${index}`);
        values.push(value);
        index++;
      }
    }
  }

  if (fields.length > 0) {
    await client.query(
      `UPDATE matches SET ${fields.join(", ")}, updated_at = CURRENT_TIMESTAMP WHERE id = $${index}`,
      [...values, matchId],
    );
  }

  const res = await client.query(`SELECT * FROM matches WHERE id = $1`, [
    matchId,
  ]);
  return res.rows[0];
}
