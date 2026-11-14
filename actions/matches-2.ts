// actions/matches-2.ts
'use server';

import { pool, query, queryOne } from '@/lib/db/neon-client';
import { revalidatePath, cacheTag, revalidateTag, cacheLife } from 'next/cache';
import { sendPushToTopic } from '@/lib/push';
import { Match } from '@/types/match';
import { PoolClient } from 'pg';
import { MatchUpdate, updateMatchAndRecompute } from '@/lib/services/match-update.service';
import { emitRealtimeEvent, emitMatchEvent, emitSubGroupEvent } from './realtime';

// ========== READ ==========

export async function getMatchesBySubGroup(subGroupId: number): Promise<Match[]> {
  // "use cache";
  // // cacheTag("matches", `matches-subgroup:${subGroupId}`);
  // cacheLife({
  //   stale: 3600, // 1 hour until considered stale
  //   revalidate: 7200, // 2 hours until revalidated
  //   expire: 86400, // 1 day until expired
  // })  

  try {
    const sql = `
      SELECT 
        m.*,
        -- Convertir total_duration en string
        CASE 
          WHEN m.total_duration IS NOT NULL 
          THEN m.total_duration::text 
          ELSE NULL 
        END as total_duration,
        json_build_object(
          'id', f1.id,
          'first_name', f1.first_name,
          'last_name', f1.last_name,
          'nickname', f1.nickname,
          'profile_image', f1.profile_image,
          'region_id', f1.region_id,
          'ranking', f1.ranking
        ) as fighter1,
        json_build_object(
          'id', f2.id,
          'first_name', f2.first_name,
          'last_name', f2.last_name,
          'nickname', f2.nickname,
          'profile_image', f2.profile_image,
          'region_id', f2.region_id,
          'ranking', f2.ranking
        ) as fighter2,
        (
          SELECT json_agg(
            json_build_object(
              'id', fc.id,
              'fighter_id', fc.fighter_id,
              'card_type', fc.card_type,
              'card_reason', fc.card_reason,
              'minute_given', fc.minute_given,
              'is_cancelled', fc.is_cancelled,
              'fighter', json_build_object(
                'id', f.id,
                'first_name', f.first_name,
                'last_name', f.last_name
              )
            )
          )
          FROM fighter_cards fc
          LEFT JOIN fighters f ON fc.fighter_id = f.id
          WHERE fc.match_id = m.id AND fc.is_cancelled = false
        ) as cards
      FROM matches m
      LEFT JOIN fighters f1 ON m.fighter1_id = f1.id
      LEFT JOIN fighters f2 ON m.fighter2_id = f2.id
      WHERE m.sub_group_id = $1 AND m.is_active = true
      ORDER BY m.match_number ASC
    `;

    const results = await query<Match>(sql, [subGroupId]);
    return results.map(m => ({
      ...m,
      cards: m.cards || []
    }));
  } catch (error) {
    console.error('❌ getMatchesBySubGroup error:', error);
    throw new Error('Erreur lors du chargement des matches');
  }
}

export async function getMatchById(matchId: number): Promise<Match | null> {
  // "use cache";
  // // cacheTag("matches", `match:${matchId}`);
  // cacheLife({
  //   stale: 3600, // 1 hour until considered stale
  //   revalidate: 7200, // 2 hours until revalidated
  //   expire: 86400, // 1 day until expired
  // })  

  try {
    const sql = `
      SELECT 
        m.*,
        -- Convertir total_duration en string
        CASE 
          WHEN m.total_duration IS NOT NULL 
          THEN m.total_duration::text 
          ELSE NULL 
        END as total_duration,
        json_build_object(
          'id', f1.id,
          'first_name', f1.first_name,
          'last_name', f1.last_name,
          'nickname', f1.nickname,
          'profile_image', f1.profile_image,
          'region_id', f1.region_id,
          'ranking', f1.ranking
        ) as fighter1,
        json_build_object(
          'id', f2.id,
          'first_name', f2.first_name,
          'last_name', f2.last_name,
          'nickname', f2.nickname,
          'profile_image', f2.profile_image,
          'region_id', f2.region_id,
          'ranking', f2.ranking
        ) as fighter2,
        json_build_object(
          'id', wf.id,
          'first_name', wf.first_name,
          'last_name', wf.last_name,
          'nickname', wf.nickname
        ) as winner_fighter,
        json_build_object(
          'id', lf.id,
          'first_name', lf.first_name,
          'last_name', lf.last_name,
          'nickname', lf.nickname
        ) as loser_fighter,
        (
          SELECT json_agg(
            json_build_object(
              'id', fc.id,
              'fighter_id', fc.fighter_id,
              'card_type', fc.card_type,
              'card_reason', fc.card_reason,
              'minute_given', fc.minute_given,
              'is_cancelled', fc.is_cancelled,
              'fighter', json_build_object(
                'id', f.id,
                'first_name', f.first_name,
                'last_name', f.last_name
              )
            )
          )
          FROM fighter_cards fc
          LEFT JOIN fighters f ON fc.fighter_id = f.id
          WHERE fc.match_id = m.id AND fc.is_cancelled = false
        ) as cards
      FROM matches m
      LEFT JOIN fighters f1 ON m.fighter1_id = f1.id
      LEFT JOIN fighters f2 ON m.fighter2_id = f2.id
      LEFT JOIN fighters wf ON m.winner_fighter_id = wf.id
      LEFT JOIN fighters lf ON m.loser_fighter_id = lf.id
      LEFT JOIN referees ref ON m.referee_id = ref.id
      WHERE m.id = $1
    `;

    const result = await queryOne<Match>(sql, [matchId]);
    if (!result) return null;

    return {
      ...result,
      cards: result.cards || []
    };
  } catch (error) {
    console.error('❌ getMatchById error:', error);
    throw new Error('Erreur lors du chargement du match');
  }
}


// ========== UPDATE ==========

/**
 * Helper pour obtenir l'édition d'un match
 */
async function getMatchEditionId(matchId: number): Promise<number | null> {
  const result = await query<{ edition_id: number }>(`
    SELECT p.edition_id
    FROM matches m
    JOIN sub_groups sg ON m.sub_group_id = sg.id
    JOIN phase_groups pg ON sg.group_id = pg.id
    JOIN phases p ON pg.phase_id = p.id
    WHERE m.id = $1
  `, [matchId]);

  return result[0]?.edition_id || null;
}

/**
 * Helper pour déterminer l'état initial d'un lutteur
 */
async function getFighterInitialState(editionId: number, fighterId: number | null): Promise<'eliminated' | 'not_eliminated'> {
  if (!fighterId) return 'not_eliminated';

  const result = await query<{ is_eliminated: boolean }>(`
    SELECT is_eliminated 
    FROM edition_fighters 
    WHERE edition_id = $1 AND fighter_id = $2
  `, [editionId, fighterId]);

  return result[0]?.is_eliminated ? 'eliminated' : 'not_eliminated';
}

/**
 * ✅ Fonction principale de mise à jour
 * C'est celle-ci qu'il faut utiliser DANS TOUTE L'APPLICATION
 */
export async function updateMatch(
  matchId: number,
  updates: MatchUpdate
): Promise<Match | null> {
  // Récupérer le match existant pour connaître son édition
  const existingMatch = await getMatchById(matchId);

  if (!existingMatch) {
    throw new Error('Match non trouvé');
  }

  // Si on assigne un nouveau lutteur, mettre à jour son état initial
  if (updates.fighter1_id !== undefined && updates.fighter1_id !== existingMatch.fighter1_id) {
    const editionId = await getMatchEditionId(matchId);
    if (editionId) {
      updates.fighter1_initial_state = await getFighterInitialState(editionId, updates.fighter1_id);
    }
  }

  if (updates.fighter2_id !== undefined && updates.fighter2_id !== existingMatch.fighter2_id) {
    const editionId = await getMatchEditionId(matchId);
    if (editionId) {
      updates.fighter2_initial_state = await getFighterInitialState(editionId, updates.fighter2_id);
    }
  }

  // ✅ Appeler le service de mise à jour
  const result = await updateMatchAndRecompute(matchId, updates);

  // ✅ Émettre l'événement explicitement (au match et au sous-groupe) — non bloquant
  emitMatchEvent(matchId, 'match_updated', {
    match: result,
    updates
  }, existingMatch.sub_group_id).catch((err) => console.error('emitMatchEvent error:', err));

  // 🔥 Revalider les chemins
  revalidatePath(`/ad/sub-groups/${existingMatch.sub_group_id}/matches`);
  revalidatePath(`/ad/sub-groups/${existingMatch.sub_group_id}/matches/${matchId}`);
  revalidateTag("matches", {});
  revalidateTag(`match:${matchId}`, {});
  revalidateTag("sub-groups", {});
  revalidateTag("phase-groups", {});

  // 🔥 Relire le match frais
  const freshMatch = await getMatchById(matchId);

  return freshMatch;
}

// export async function updateMatch(
//   matchId: number, 
//   updates: MatchUpdate
// ): Promise<Match> {
//   // Vérifier que le sous-groupe n'est pas terminé
//   const checkSql = `
//     SELECT sg.is_completed
//     FROM matches m
//     JOIN sub_groups sg ON m.sub_group_id = sg.id
//     WHERE m.id = $1
//   `;
//   const checkResult = await queryOne<{ is_completed: boolean }>(checkSql, [matchId]);

//   if (checkResult?.is_completed) {
//     throw new Error('Ce sous-groupe est terminé. Aucune modification autorisée.');
//   }

//   // Construire la requête dynamique
//   const fields: string[] = [];
//   const values: any[] = [];
//   let index = 1;

//   const allowedFields: (keyof MatchUpdate)[] = [
//     'fighter1_id', 'fighter2_id', 'winner_fighter_id', 'loser_fighter_id',
//     'match_result', 'status', 'total_duration', 'break_count',
//     'audience_count', 'video_url', 'live_stream_url', 'notes', 'end_time'
//   ];

//   for (const field of allowedFields) {
// // actions/matches.ts
//     if (field in updates) {
//       fields.push(`${String(field)} = $${index}`);
//       values.push(updates[field as keyof MatchUpdate] ?? null);
//       index++;
//     }
//   }

//   if (fields.length === 0) {
//     throw new Error('Aucune donnée à mettre à jour');
//   }

//   values.push(matchId);

//   const sql = `
//     UPDATE matches
//     SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
//     WHERE id = $${index}
//     RETURNING *
//   `;

//   const result = await queryOne<Match>(sql, values);
//   if (!result) {
//     throw new Error('Erreur lors de la mise à jour');
//   }

//   // Émettre l'événement temps réel
//   await emitMatchEvent(matchId, 'match_updated', { match: result });

//   // Push notifications
//   if (updates.status === 'live') {
//     await sendPushToTopic('global', '🔥 Match en direct', 'Le match commence');
//   } else if (updates.status === 'completed') {
//     await sendPushToTopic('global', '✅ Match terminé', 'Découvrez le résultat');
//   }

//   // Revalidation
//   revalidatePath(`/ad/sub-groups/${result.sub_group_id}/matches`);
//   revalidatePath(`/ad/sub-groups/${result.sub_group_id}/matches/${matchId}`);

//   return result;
// }

export async function generateInitialState(client: PoolClient, matchId: number) {
  const data = await client.query(`
    SELECT 
      m.id,
      m.sub_group_id,
      sg.score_region1,
      sg.score_region2,
      sg.nulls,
      sg.status as sub_group_status,
      p.edition_id,
      sg.region1_id,
      sg.region2_id,
      m.fighter1_id,
      m.fighter2_id
    FROM matches m
    JOIN sub_groups sg ON m.sub_group_id = sg.id
    JOIN phase_groups pg ON sg.group_id = pg.id
    JOIN phases p ON pg.phase_id = p.id
    WHERE m.id = $1
  `, [matchId]);
  const row = data.rows[0];
  // Filter out null region IDs to prevent SQL issues with IN clause
  const regions = [row.region1_id, row.region2_id].filter(Boolean);
  const editionRegions = await client.query(`
    SELECT region_id, points, is_eliminated, status
    FROM edition_regions
    WHERE edition_id = $1
      AND region_id = ANY($2::int[])
  `, [row.edition_id, regions]);
  // Filter out null fighter IDs to prevent SQL issues with IN clause
  const fighters = [row.fighter1_id, row.fighter2_id].filter(Boolean);
  const editionFighters = await client.query(`
    SELECT fighter_id, is_eliminated, status
    FROM edition_fighters
    WHERE edition_id = $1
      AND fighter_id = ANY($2::int[])
  `, [row.edition_id, fighters]);
  return {
    sub_group: {
      score_region1: row.score_region1,
      score_region2: row.score_region2,
      nulls: row.nulls,
      status: row.sub_group_status
    },
    edition_regions: editionRegions.rows,
    edition_fighters: editionFighters.rows
  };
}

export async function restoreMatchInitialState(
  client: PoolClient,
  matchId: number
) {
  const res = await client.query(
    `SELECT initial_state, sub_group_id,
            (SELECT p.edition_id
             FROM matches m
             JOIN sub_groups sg ON m.sub_group_id = sg.id
             JOIN phase_groups pg ON sg.group_id = pg.id
             JOIN phases p ON pg.phase_id = p.id
             WHERE m.id = $1) as edition_id
     FROM matches
     WHERE id = $1`,
    [matchId]
  );
  const snapshot = res.rows[0]?.initial_state;
  const editionId = res.rows[0]?.edition_id;
  const subGroupId = res.rows[0]?.sub_group_id;
  if (!snapshot) return;
  // Restore sub_group
  await client.query(
    `UPDATE sub_groups
     SET score_region1 = $1,
         score_region2 = $2,
         nulls = $3,
         status = $4
     WHERE id = $5`,
    [
      snapshot.sub_group.score_region1,
      snapshot.sub_group.score_region2,
      snapshot.sub_group.nulls,
      snapshot.sub_group.status,
      subGroupId
    ]
  );
  // Restore edition_regions
  for (const region of snapshot.edition_regions) {
    await client.query(
      `UPDATE edition_regions
       SET points = $1,
           is_eliminated = $2,
           status = $3
       WHERE region_id = $4
       AND edition_id = $5`,
      [
        region.points,
        region.is_eliminated,
        region.status,
        region.region_id,
        editionId
      ]
    );
  }
  // Restore edition_fighters
  for (const fighter of snapshot.edition_fighters) {
    await client.query(
      `UPDATE edition_fighters
       SET is_eliminated = $1,
           status = $2
       WHERE fighter_id = $3
       AND edition_id = $4`,
      [
        fighter.is_eliminated,
        fighter.status,
        fighter.fighter_id,
        editionId
      ]
    );
  }
}
// ========== CREATE ==========

export async function createMatch(
  subGroupId: number,
  data: {
    match_number?: number;
    fighter1_id?: number | null;
    fighter2_id?: number | null;
    notes?: string | null;
  }
) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 🔢 Déterminer numéro
    let matchNumber = data.match_number;

    if (!matchNumber) {
      const maxResult = await client.query(
        `
        SELECT COALESCE(MAX(match_number), 0) as max
        FROM matches
        WHERE sub_group_id = $1
        `,
        [subGroupId]
      );

      matchNumber = (maxResult.rows[0]?.max || 0) + 1;
    }

    // 🆕 Insert match
    const insertRes = await client.query(
      `
      INSERT INTO matches (
        sub_group_id,
        match_number,
        fighter1_id,
        fighter2_id,
        notes,
        status,
        break_count,
        is_active
      )
      VALUES ($1, $2, $3, $4, $5, 'scheduled', 0, true)
      RETURNING id
      `,
      [
        subGroupId,
        matchNumber,
        data.fighter1_id || null,
        data.fighter2_id || null,
        data.notes || null
      ]
    );

    const matchId = insertRes.rows[0].id;

    // 📸 Snapshot initial
    const snapshot = await generateInitialState(client, matchId);

    await client.query(
      `UPDATE matches SET initial_state = $1 WHERE id = $2`,
      [snapshot, matchId]
    );

    await client.query('COMMIT');

    // 🔥 Émettre l'événement de création (RTDB désactivé pour 'scheduled')
    // Le match ne sera créé dans RTDB que lors du passage à 'live' via updateMatch
    
    revalidatePath(`/ad/sub-groups/${subGroupId}/matches`);
    revalidateTag("matches", {});
    revalidateTag(`matches-subgroup:${subGroupId}`, {});

    return {
      id: matchId,
      match_number: matchNumber
    };

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ createMatch error:', error);
    throw error;
  } finally {
    client.release();
  }
}

// ========== CARDS ==========

export async function addFighterCard(
  matchId: number,
  fighterId: number,
  cardType: 'yellow' | 'red',
  minuteGiven: string,
  reason?: string
) {
  const sql = `
    INSERT INTO fighter_cards (
      match_id, fighter_id, card_type, minute_given, card_reason
    ) VALUES ($1, $2, $3, $4, $5)
    RETURNING *
  `;

  const result = await queryOne(sql, [
    matchId,
    fighterId,
    cardType,
    minuteGiven,
    reason || null
  ]);

  if (!result) {
    throw new Error('Erreur lors de l\'ajout du carton');
  }

  await emitMatchEvent(matchId, 'card_added', {
    card: result,
    fighterId
  });

  revalidatePath(`/ad/sub-groups/*/matches/${matchId}`);
  revalidateTag("matches", {});
  revalidateTag(`match:${matchId}`, {});

  return result;
}

/**
 * Annule (soft-delete) le dernier carton non annulé d'un match.
 * Si fighterId est fourni, annule le dernier carton de ce lutteur.
 */
export async function cancelLastFighterCard(
  matchId: number,
  fighterId?: number
): Promise<any> {
  const findSql = `
    SELECT id, fighter_id, card_type, card_reason, minute_given
    FROM fighter_cards
    WHERE match_id = $1 AND is_cancelled = false
      ${fighterId ? 'AND fighter_id = $2' : ''}
    ORDER BY created_at DESC, id DESC
    LIMIT 1
  `;
  const findParams = fighterId ? [matchId, fighterId] : [matchId];
  const card = await queryOne<any>(findSql, findParams);

  if (!card) {
    throw new Error('Aucun carton à annuler');
  }

  const sql = `
    UPDATE fighter_cards
    SET is_cancelled = true
    WHERE id = $1
    RETURNING *
  `;
  const result = await queryOne(sql, [card.id]);

  await emitMatchEvent(matchId, 'card_cancelled', {
    card: result,
    fighterId: card.fighter_id,
  });

  revalidatePath(`/ad/sub-groups/*/matches/${matchId}`);
  revalidateTag("matches", {});
  revalidateTag(`match:${matchId}`, {});

  return result;
}

export async function removeFighterCard(cardId: number) {
  // Récupérer le match_id avant suppression
  const card = await queryOne<{ match_id: number }>(
    'SELECT match_id FROM fighter_cards WHERE id = $1',
    [cardId]
  );

  if (!card) {
    throw new Error('Carton non trouvé');
  }

  await query('DELETE FROM fighter_cards WHERE id = $1', [cardId]);

  await emitMatchEvent(card.match_id, 'card_removed', { cardId });

  revalidatePath(`/ad/sub-groups/*/matches/${card.match_id}`);
  revalidateTag("matches", {});
  revalidateTag(`match:${card.match_id}`, {});

  return { success: true };
}

// ========== UTILS ==========

// async function emitMatchEvent(matchId: number, type: string, data: any) {
//   try {
//     // Récupérer l'édition pour broadcast
//     const editionInfo = await queryOne<{ edition_id: number }>(`
//       SELECT p.edition_id
//       FROM matches m
//       JOIN sub_groups sg ON m.sub_group_id = sg.id
//       JOIN phase_groups pg ON sg.group_id = pg.id
//       JOIN phases p ON pg.phase_id = p.id
//       WHERE m.id = $1
//     `, [matchId]);

//     connectionManager.broadcastToMatch(matchId, type, data);

//     if (editionInfo?.edition_id) {
//       connectionManager.broadcastToEdition(editionInfo.edition_id, type, {
//         matchId,
//         ...data
//       });
//     }
//   } catch (error) {
//     console.error('❌ emitMatchEvent error:', error);
//   }
// }

// export async function emitMatchEvent(matchId: number, type: string, data: any) {
//   try {
//     // Récupérer l'édition pour le broadcast
//     const editionInfo = await queryOne<{ edition_id: number }>(`
//       SELECT p.edition_id
//       FROM matches m
//       JOIN sub_groups sg ON m.sub_group_id = sg.id
//       JOIN phase_groups pg ON sg.group_id = pg.id
//       JOIN phases p ON pg.phase_id = p.id
//       WHERE m.id = $1
//     `, [matchId]);

//     // Rendre l'objet 100% plain
//     const safeData = JSON.parse(JSON.stringify(data));

//     // Émettre l'événement match
//     await emitRealtimeEvent('match', matchId, type, safeData);

//     // Émettre aussi pour l'édition si disponible
//     if (editionInfo?.edition_id) {
//       await emitRealtimeEvent('edition', editionInfo.edition_id, type, {
//         matchId,
//         ...safeData
//       });
//     }
//   } catch (error) {
//     console.error('❌ emitMatchEvent error:', error);
//   }
// }


// actions/sub-groups.ts (ajout)
export async function completeSubGroup(subGroupId: number) {
  try {
    // Vérifier que tous les matchs sont terminés
    const checkRes = await query(`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'completed') as completed
      FROM matches
      WHERE sub_group_id = $1 AND is_active = true
    `, [subGroupId]);

    const { total, completed } = checkRes[0];

    if (total === 0) {
      throw new Error('Ce sous-groupe n\'a aucun match');
    }

    if (completed !== total) {
      throw new Error(`${completed}/${total} matchs terminés seulement`);
    }

    // Marquer comme terminé
    await query(`
      UPDATE sub_groups
      SET status = 'completed',
          is_completed = true
      WHERE id = $1
    `, [subGroupId]);

    revalidatePath(`/ad/sub-groups/${subGroupId}`);
    revalidatePath(`/ad/sub-groups/${subGroupId}/matches`);
    revalidateTag("sub-groups", {});
    revalidateTag(`sub-group:${subGroupId}`, {});
    
    // 🔥 Émission WS
    await emitSubGroupEvent(subGroupId, 'subgroup_completed', { id: subGroupId });

    return { success: true };
  } catch (error) {
    console.error('❌ completeSubGroup error:', error);
    throw error;
  }
}