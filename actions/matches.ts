// @/actions/matches.ts
'use server';

import { pool, query, queryOne } from '@/lib/db/neon-client';
import { matchSchema } from '@/validation/schemas';
import { revalidatePath, cacheTag, revalidateTag, cacheLife } from 'next/cache';
import { Match, MatchFilters, PaginatedResponse } from '@/types';
import { z } from 'zod';
import { updateMatchAndRecompute } from '@/lib/services/match-update.service';
import { sendPushNotification, sendPushToTopic } from '@/lib/push';
import { PoolClient } from 'pg';

import { emitMatchEvent, emitRealtimeEvent } from './realtime';

export async function getMatches(
  filters: MatchFilters = {}
): Promise<PaginatedResponse<Match>> {
  // "use cache";
  // // cacheTag("matches");
  // cacheLife({
  //   stale: 3600, // 1 hour until considered stale
  //   revalidate: 7200, // 2 hours until revalidated
  //   expire: 86400, // 1 day until expired
  // })

  try {
    const {
      sub_group_id,
      edition_id,
      phase_id,
      group_id,
      competition_id,
      status,
      date,
      date_from,
      date_to,
      period,
      search = '',
      page = 1,
      limit = 20,
      with_sub_group = true,
      with_fighters = true,
    } = filters;

    let whereConditions: string[] = ['1=1'];
    let joinClauses: string[] = [];
    const params: any[] = [];
    const selectFields: string[] = [
      'm.*',
      `CASE WHEN mref.id IS NOT NULL THEN
        JSON_BUILD_OBJECT(
          'id', mref.id,
          'first_name', mref.first_name,
          'last_name', mref.last_name,
          'nickname', mref.nickname,
          'profile_image', mref.profile_image
        )
      ELSE NULL END as referee`
    ];
    joinClauses.push('LEFT JOIN referees mref ON m.referee_id = mref.id');

    let paramIndex = 1;

    // Filtres de base
    if (sub_group_id) {
      whereConditions.push(`m.sub_group_id = $${paramIndex}`);
      params.push(sub_group_id);
      paramIndex++;
    }

    if (status) {
      whereConditions.push(`m.status = $${paramIndex}`);
      params.push(status);
      paramIndex++;
    }

    if (date) {
      whereConditions.push(`DATE(m.match_date) = DATE($${paramIndex})`);
      params.push(date);
      paramIndex++;
    }

    if (date_from) {
      whereConditions.push(`m.match_date >= $${paramIndex}`);
      params.push(date_from);
      paramIndex++;
    }

    if (date_to) {
      whereConditions.push(`m.match_date <= $${paramIndex}`);
      params.push(date_to);
      paramIndex++;
    }

    if (search) {
      whereConditions.push(`(m.notes ILIKE $${paramIndex})`);
      params.push(`%${search}%`);
      paramIndex++;
    }

    // Jointures hiérarchiques pour les filtres
    if (competition_id || edition_id || phase_id || group_id || period || with_sub_group) {
      joinClauses.push(`
        LEFT JOIN sub_groups sg ON m.sub_group_id = sg.id
        LEFT JOIN phase_groups pg ON sg.group_id = pg.id
        LEFT JOIN phases p ON pg.phase_id = p.id
        LEFT JOIN competition_editions ce ON p.edition_id = ce.id
      `);
    }

    // Filtres hiérarchiques
    if (competition_id) {
      whereConditions.push(`ce.competition_id = $${paramIndex}`);
      params.push(competition_id);
      paramIndex++;
    }

    if (edition_id) {
      whereConditions.push(`ce.id = $${paramIndex}`);
      params.push(edition_id);
      paramIndex++;
    }

    if (phase_id) {
      whereConditions.push(`p.id = $${paramIndex}`);
      params.push(phase_id);
      paramIndex++;
    }

    if (group_id) {
      whereConditions.push(`pg.id = $${paramIndex}`);
      params.push(group_id);
      paramIndex++;
    }

    if (period) {
      if (period === 'matin' || period === 'soir') {
        whereConditions.push(`sg.period = $${paramIndex}`);
        params.push(period);
        paramIndex++;
      } else if (period === 'today') {
        whereConditions.push(`DATE(m.match_date) = CURRENT_DATE`);
      } else if (period === 'week') {
        whereConditions.push(`m.match_date >= CURRENT_DATE - INTERVAL '7 days'`);
      } else if (period === 'month') {
        whereConditions.push(`m.match_date >= CURRENT_DATE - INTERVAL '30 days'`);
      }
    }

    // Jointures pour les relations
    if (with_fighters) {
      joinClauses.push(`
        LEFT JOIN fighters f1 ON m.fighter1_id = f1.id
        LEFT JOIN fighters f2 ON m.fighter2_id = f2.id
        LEFT JOIN fighters wf ON m.winner_fighter_id = wf.id
        LEFT JOIN fighters lf ON m.loser_fighter_id = lf.id
      `);

      selectFields.push(`
        CASE WHEN f1.id IS NOT NULL THEN
          JSON_BUILD_OBJECT(
            'id', f1.id,
            'first_name', f1.first_name,
            'last_name', f1.last_name,
            'nickname', f1.nickname,
            'ranking', f1.ranking
          )
        ELSE NULL END as fighter1,
        CASE WHEN f2.id IS NOT NULL THEN
          JSON_BUILD_OBJECT(
            'id', f2.id,
            'first_name', f2.first_name,
            'last_name', f2.last_name,
            'nickname', f2.nickname,
            'ranking', f2.ranking
          )
        ELSE NULL END as fighter2,
        CASE WHEN wf.id IS NOT NULL THEN
          JSON_BUILD_OBJECT(
            'id', wf.id,
            'first_name', wf.first_name,
            'last_name', wf.last_name,
            'nickname', wf.nickname
          )
        ELSE NULL END as winner_fighter,
        CASE WHEN lf.id IS NOT NULL THEN
          JSON_BUILD_OBJECT(
            'id', lf.id,
            'first_name', lf.first_name,
            'last_name', lf.last_name,
            'nickname', lf.nickname
          )
        ELSE NULL END as loser_fighter
      `);
    }

    // Construction du sous-groupe avec relations (incluant les régions)
    if (with_sub_group) {
      selectFields.push(`
        CASE WHEN sg.id IS NOT NULL THEN
          JSON_BUILD_OBJECT(
            'id', sg.id,
            'name', sg.name,
            'sub_group_order', sg.sub_group_order,
            'region1', CASE WHEN r1.id IS NOT NULL THEN
              JSON_BUILD_OBJECT(
                'id', r1.id,
                'name', r1.name,
                'code', r1.code
              )
            ELSE NULL END,
            'region2', CASE WHEN r2.id IS NOT NULL THEN
              JSON_BUILD_OBJECT(
                'id', r2.id,
                'name', r2.name,
                'code', r2.code
              )
            ELSE NULL END,
            'belt1', CASE WHEN b1.id IS NOT NULL THEN
              JSON_BUILD_OBJECT(
                'id', b1.id,
                'color', b1.color
              )
            ELSE NULL END,
            'belt2', CASE WHEN b2.id IS NOT NULL THEN
              JSON_BUILD_OBJECT(
                'id', b2.id,
                'color', b2.color
              )
            ELSE NULL END,
            'main_referee', CASE WHEN ref.id IS NOT NULL THEN
              JSON_BUILD_OBJECT(
                'id', ref.id,
                'first_name', ref.first_name,
                'last_name', ref.last_name,
                'nickname', ref.nickname
              )
            ELSE NULL END,
            'group', CASE WHEN pg.id IS NOT NULL THEN
              JSON_BUILD_OBJECT(
                'id', pg.id,
                'name', pg.name,
                'group_order', pg.group_order,
                'phase', CASE WHEN p.id IS NOT NULL THEN
                  JSON_BUILD_OBJECT(
                    'id', p.id,
                    'name', p.name,
                    'phase_order', p.phase_order,
                    'phase_type', p.phase_type,
                    'edition', CASE WHEN ce.id IS NOT NULL THEN
                      JSON_BUILD_OBJECT(
                        'id', ce.id,
                        'edition_number', ce.edition_number,
                        'year', ce.year
                      )
                    ELSE NULL END
                  )
                ELSE NULL END
              )
            ELSE NULL END
          )
        ELSE NULL END as sub_group
      `);

      // Ajouter les jointures pour les régions et ceintures du sous-groupe
      joinClauses.push(`
        LEFT JOIN regions r1 ON sg.region1_id = r1.id
        LEFT JOIN regions r2 ON sg.region2_id = r2.id
        LEFT JOIN belt b1 ON sg.belt_region1 = b1.id
        LEFT JOIN belt b2 ON sg.belt_region2 = b2.id
        LEFT JOIN referees ref ON sg.main_referee_id = ref.id
      `);
    }

    // Construction des clauses SQL finales
    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
    const joinClause = joinClauses.join(' ');

    // Requête pour le total
    const countSql = `
      SELECT COUNT(DISTINCT m.id) as total
      FROM matches m
      ${joinClause}
      ${whereClause}
    `;

    const countResult = await query<{ total: string }>(countSql, params);
    const total = parseInt(countResult[0]?.total ?? '0');

    // Pagination
    const validatedPage = Math.max(1, page);
    const validatedLimit = Math.max(1, Math.min(100, limit));
    const offset = (validatedPage - 1) * validatedLimit;
    const totalPages = Math.ceil(total / validatedLimit);

    // Requête principale
    const dataSql = `
      SELECT ${selectFields.join(', ')}
      FROM matches m
      ${joinClause}
      ${whereClause}
      ORDER BY m.match_date ASC, m.match_number ASC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;

    const finalParams = [...params, validatedLimit, offset];

    const data = await query<Match>(dataSql, finalParams);

    return {
      data,
      pagination: {
        page: validatedPage,
        limit: validatedLimit,
        total,
        totalPages
      }
    };
  } catch (error) {
    console.error('Error in getMatches:', error);
    throw new Error('Erreur lors de la récupération des matches');
  }
}

export async function getMatchById(id: number, options: {
  with_relations?: boolean;
  relations?: {
    with_sub_group?: boolean;
    with_group?: boolean;
    with_phase?: boolean;
    with_edition?: boolean;
    with_regions?: boolean;
    with_belts?: boolean;
    with_referee?: boolean;
    with_fighters?: boolean;
    with_winner_loser?: boolean;
    with_cards?: boolean;
  };
  is_active?: boolean;
} = {}) {
  // "use cache";
  // cacheTag("matches", `match:${id}`);

  try {
    const {
      with_relations = true,
      relations = {
        with_sub_group: true,
        with_group: true,
        with_phase: true,
        with_edition: true,
        with_regions: true,
        with_belts: true,
        with_referee: true,
        with_fighters: true,
        with_winner_loser: true,
        with_cards: true
      },
      is_active
    } = options;

    // Extraire les relations avec des valeurs par défaut
    const {
      with_sub_group = true,
      with_group = true,
      with_phase = true,
      with_edition = true,
      with_regions = true,
      with_belts = true,
      with_referee = true,
      with_fighters = true,
      with_winner_loser = true,
      with_cards = true
    } = relations;

    const params: any[] = [id];
    let whereClause = 'WHERE m.id = $1';

    // Ajouter le filtre is_active si spécifié
    if (typeof is_active === 'boolean') {
      params.push(is_active);
      whereClause += ` AND m.is_active = $${params.length}`;
    }

    let sql = `SELECT * FROM matches m ${whereClause}`;

    if (with_relations) {
      const isActiveFlag = typeof is_active === 'boolean' ? is_active : true;

      sql = `
        SELECT 
          m.*,
          CASE WHEN mref.id IS NOT NULL THEN
            JSON_BUILD_OBJECT(
              'id', mref.id,
              'first_name', mref.first_name,
              'last_name', mref.last_name,
              'nickname', mref.nickname,
              'profile_image', mref.profile_image
            )
          ELSE NULL END as referee,
          ${with_sub_group ? `
          JSON_BUILD_OBJECT(
            'id', sg.id,
            'name', sg.name,
            'sub_group_order', sg.sub_group_order,
            ${with_regions ? `
            'region1', CASE WHEN r1.id IS NOT NULL THEN
              JSON_BUILD_OBJECT(
                'id', r1.id,
                'name', r1.name,
                'code', r1.code
              )
            ELSE NULL END,
            'region2', CASE WHEN r2.id IS NOT NULL THEN
              JSON_BUILD_OBJECT(
                'id', r2.id,
                'name', r2.name,
                'code', r2.code
              )
            ELSE NULL END,
            ` : `'region1', NULL, 'region2', NULL,`}
            ${with_belts ? `
            'belt1', CASE WHEN b1.id IS NOT NULL THEN
              JSON_BUILD_OBJECT(
                'id', b1.id,
                'color', b1.color
              )
            ELSE NULL END,
            'belt2', CASE WHEN b2.id IS NOT NULL THEN
              JSON_BUILD_OBJECT(
                'id', b2.id,
                'color', b2.color
              )
            ELSE NULL END,
            ` : `'belt1', NULL, 'belt2', NULL,`}
            ${with_referee ? `
            'main_referee', CASE WHEN ref.id IS NOT NULL THEN
              JSON_BUILD_OBJECT(
                'id', ref.id,
                'first_name', ref.first_name,
                'last_name', ref.last_name,
                'nickname', ref.nickname
              )
            ELSE NULL END,
            ` : `'main_referee', NULL,`}
            ${with_group ? `
            'group', JSON_BUILD_OBJECT(
              'id', pg.id,
              'name', pg.name,
              'group_order', pg.group_order,
              ${with_phase ? `
              'phase', JSON_BUILD_OBJECT(
                'id', p.id,
                'name', p.name,
                'phase_order', p.phase_order,
                ${with_edition ? `
                'edition', JSON_BUILD_OBJECT(
                  'id', ce.id,
                  'edition_number', ce.edition_number,
                  'year', ce.year
                )
                ` : `'edition', NULL`}
              )
              ` : `'phase', NULL`}
            )
            ` : `'group', NULL`}
          ) as sub_group,
          ` : `'sub_group', NULL,`}
          ${with_fighters ? `
          CASE 
            WHEN m.fighter1_id IS NOT NULL THEN
              JSON_BUILD_OBJECT(
                'id', f1.id,
                'first_name', f1.first_name,
                'last_name', f1.last_name,
                'nickname', f1.nickname,
                'ranking', f1.ranking
              )
            ELSE NULL
          END as fighter1,
          CASE 
            WHEN m.fighter2_id IS NOT NULL THEN
              JSON_BUILD_OBJECT(
                'id', f2.id,
                'first_name', f2.first_name,
                'last_name', f2.last_name,
                'nickname', f2.nickname,
                'ranking', f2.ranking
              )
            ELSE NULL
          END as fighter2,
          ` : `'fighter1', NULL, 'fighter2', NULL,`}
          ${with_winner_loser ? `
          CASE 
            WHEN m.winner_fighter_id IS NOT NULL THEN
              JSON_BUILD_OBJECT(
                'id', wf.id,
                'first_name', wf.first_name,
                'last_name', wf.last_name,
                'nickname', wf.nickname
              )
            ELSE NULL
          END as winner_fighter,
          CASE 
            WHEN m.loser_fighter_id IS NOT NULL THEN
              JSON_BUILD_OBJECT(
                'id', lf.id,
                'first_name', lf.first_name,
                'last_name', lf.last_name,
                'nickname', lf.nickname
              )
            ELSE NULL
          END as loser_fighter,
          ` : `'winner_fighter', NULL, 'loser_fighter', NULL,`}
          ${with_cards ? `
          COALESCE(
            (SELECT JSON_AGG(
              JSON_BUILD_OBJECT(
                'id', fc.id,
                'card_type', fc.card_type,
                'card_reason', fc.card_reason,
                'minute_given', fc.minute_given,
                ${with_fighters ? `
                'fighter', CASE 
                  WHEN fc.fighter_id IS NOT NULL THEN
                    JSON_BUILD_OBJECT(
                      'id', f.id,
                      'first_name', f.first_name,
                      'last_name', f.last_name,
                      'nickname', f.nickname
                    )
                  ELSE NULL
                END
                ` : `'fighter', NULL`}
              )
            ) FROM fighter_cards fc
            ${with_fighters ? 'JOIN fighters f ON fc.fighter_id = f.id' : ''}
            WHERE fc.match_id = m.id
              AND (${isActiveFlag} IS FALSE OR fc.is_cancelled = false)
            ),
            '[]'::json
          ) as cards
          ` : `'[]'::json as cards`}
        FROM matches m
        ${with_sub_group ? 'LEFT JOIN sub_groups sg ON m.sub_group_id = sg.id' : ''}
        ${with_sub_group && with_group ? 'LEFT JOIN phase_groups pg ON sg.group_id = pg.id' : ''}
        ${with_sub_group && with_group && with_phase ? 'LEFT JOIN phases p ON pg.phase_id = p.id' : ''}
        ${with_sub_group && with_group && with_phase && with_edition ? 'LEFT JOIN competition_editions ce ON p.edition_id = ce.id' : ''}
        ${with_sub_group && with_regions ? 'LEFT JOIN regions r1 ON sg.region1_id = r1.id' : ''}
        ${with_sub_group && with_regions ? 'LEFT JOIN regions r2 ON sg.region2_id = r2.id' : ''}
        ${with_sub_group && with_belts ? 'LEFT JOIN belt b1 ON sg.belt_region1 = b1.id' : ''}
        ${with_sub_group && with_belts ? 'LEFT JOIN belt b2 ON sg.belt_region2 = b2.id' : ''}
        ${with_sub_group && with_referee ? 'LEFT JOIN referees ref ON sg.main_referee_id = ref.id' : ''}
        LEFT JOIN referees mref ON m.referee_id = mref.id
        ${with_fighters ? 'LEFT JOIN fighters f1 ON m.fighter1_id = f1.id' : ''}
        ${with_fighters ? 'LEFT JOIN fighters f2 ON m.fighter2_id = f2.id' : ''}
        ${with_winner_loser ? 'LEFT JOIN fighters wf ON m.winner_fighter_id = wf.id' : ''}
        ${with_winner_loser ? 'LEFT JOIN fighters lf ON m.loser_fighter_id = lf.id' : ''}
        ${whereClause}
      `;
    }

    const result = await queryOne<Match>(sql, params);

    if (!result) {
      throw new Error('Match non trouvé');
    }

    return result;
  } catch (error) {
    console.error('Error in getMatchById:', error);
    throw error;
  }
}

// Helper pour déterminer l'état initial d'un lutteur
async function getFighterInitialState(editionId: number, fighterId: number | null): Promise<'eliminated' | 'not_eliminated'> {
  if (!fighterId) return 'not_eliminated';

  const result = await query<{ is_eliminated: boolean }>(`
    SELECT is_eliminated 
    FROM edition_fighters 
    WHERE edition_id = $1 AND fighter_id = $2
  `, [editionId, fighterId]);

  return result[0]?.is_eliminated ? 'eliminated' : 'not_eliminated';
}

// Helper pour obtenir l'édition d'un match
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


// Fonction utilitaire pour émettre des événements match
// export async function emitMatchEvent(matchId: number, eventType: string, data: any) {
//   try {
//     // Récupérer les infos de l'édition pour broadcast
//     const editionInfo = await query(`
//       SELECT ce.id as edition_id
//       FROM matches m
//       JOIN sub_groups sg ON m.sub_group_id = sg.id
//       JOIN phase_groups pg ON sg.group_id = pg.id
//       JOIN phases p ON pg.phase_id = p.id
//       JOIN competition_editions ce ON p.edition_id = ce.id
//       WHERE m.id = $1
//     `, [matchId]);

//     const editionId = editionInfo[0]?.edition_id;

//     // Émettre aux abonnés du match
//     connectionManager.broadcastToMatch(matchId, eventType, {
//       matchId,
//       ...data
//     });

//     // Émettre aux abonnés de l'édition
//     if (editionId) {
//       connectionManager.broadcastToEdition(editionId, eventType, {
//         matchId,
//         editionId,
//         ...data
//       });
//     }

//     console.log(`Event ${eventType} emitted for match ${matchId}`);
//   } catch (error) {
//     console.error('Error emitting match event:', error);
//   }
// }



// Helper to fetch edition context for a match
async function getMatchEditionContext(matchId: number) {
  const res = await query<{
    edition_id: number;
    sub_group_id: number;
    region1_id: number | null;
    region2_id: number | null;
  }>(`
    SELECT ce.id as edition_id, sg.id as sub_group_id, sg.region1_id, sg.region2_id
    FROM matches m
    JOIN sub_groups sg ON m.sub_group_id = sg.id
    JOIN phase_groups pg ON sg.group_id = pg.id
    JOIN phases p ON pg.phase_id = p.id
    JOIN competition_editions ce ON p.edition_id = ce.id
    WHERE m.id = $1
  `, [matchId]);
  return res[0] || null;
}

// Helper to ensure edition_fighters rows exist and are qualified
async function ensureEditionFightersQualified(editionId: number, fighterIds: number[]) {
  if (!fighterIds.length) return;
  await query(`
    WITH to_insert AS (
      SELECT $1::int AS edition_id, unnest($2::int[]) AS fighter_id
    ),
    valid_fighters AS (
      SELECT fighter_id
      FROM to_insert
      JOIN fighters f ON f.id = to_insert.fighter_id
      WHERE f.is_active = true
    ),
    inserted AS (
      INSERT INTO edition_fighters (edition_id, fighter_id, status)
      SELECT edition_id, fighter_id, 'qualified'
      FROM to_insert
      WHERE fighter_id IN (SELECT fighter_id FROM valid_fighters)
        AND NOT EXISTS (
          SELECT 1
          FROM edition_fighters ef
          WHERE ef.edition_id = to_insert.edition_id
            AND ef.fighter_id = to_insert.fighter_id
        )
      ON CONFLICT DO NOTHING
    )
    -- Only update status to qualified if not disqualified or withdrawn
    UPDATE edition_fighters
    SET status = 'qualified'
    WHERE edition_id = $1
      AND fighter_id = ANY($2)
      AND status NOT IN ('disqualified', 'withdrawn')
  `, [editionId, fighterIds as any]);
}

// ✅ NOUVELLE FONCTION updateMatch avec recomputation
export async function updateMatch(id: number, data: Record<string, any>) {
  try {
    // 1️⃣ Vérifier si le sous-groupe est déjà terminé
    const subGroupCheck = await queryOne<{ is_completed: boolean }>(`
      SELECT sg.is_completed
      FROM matches m
      JOIN sub_groups sg ON m.sub_group_id = sg.id
      WHERE m.id = $1
    `, [id]);

    if (subGroupCheck?.is_completed) {
      throw new Error("Ce sous-groupe est terminé. Aucune modification n'est autorisée.");
    }

    // Validation des données
    const validatedData = matchSchema.partial().parse(data);

    // Préparer les mises à jour
    const updates: any = { ...validatedData };

    // Si on change le statut à 'completed', s'assurer qu'il y a un résultat
    if (updates.status === 'completed') {
      if (!updates.match_result && !updates.winner_fighter_id) {
        throw new Error('Un match terminé doit avoir un résultat défini');
      }
    }

    // Si on définit un résultat, s'assurer que le statut est 'completed'
    if (updates.match_result && updates.status !== 'completed') {
      updates.status = 'completed';
    }

    // Si on définit un vainqueur/perdant, définir le résultat automatiquement
    if (updates.winner_fighter_id && updates.loser_fighter_id) {
      // Déterminer quel fighter est le vainqueur
      const existing = await getMatchById(id, { with_relations: false });
      if (existing.fighter1_id === updates.winner_fighter_id) {
        updates.match_result = 'fighter1_win';
      } else if (existing.fighter2_id === updates.winner_fighter_id) {
        updates.match_result = 'fighter2_win';
      }
    }

    // Obtenir l'édition pour déterminer les états initiaux
    const editionId = await getMatchEditionId(id);
    if (editionId) {
      // Mettre à jour les états initiaux si les fighters changent
      if (updates.fighter1_id !== undefined) {
        updates.fighter1_initial_state = await getFighterInitialState(editionId, updates.fighter1_id);
      }
      if (updates.fighter2_id !== undefined) {
        updates.fighter2_initial_state = await getFighterInitialState(editionId, updates.fighter2_id);
      }
    }

    // Utiliser le nouveau service de mise à jour avec recomputation
    const updatedMatch = await updateMatchAndRecompute(id, updates);

    // Émettre l'événement de mise à jour (au match et au sous-groupe)
    await emitMatchEvent(id, 'match_updated', {
      match: updatedMatch,
      changes: Object.keys(updates)
    }, updatedMatch.sub_group_id);

    // Revalidation des chemins
    revalidatePath('/matches');
    revalidatePath(`/matches/${id}`);
    if (updatedMatch.sub_group_id) {
      revalidatePath(`/ad/sub-groups/${updatedMatch.sub_group_id}`);
      revalidatePath(`/ad/sub-groups/${updatedMatch.sub_group_id}/organisation`);
    }
    revalidateTag("matches", {});
    revalidateTag(`match:${id}`, {});

    return {
      success: true,
      message: 'Match mis à jour avec succès',
      match: updatedMatch
    };
  } catch (error) {
    console.error('❌ Error in updateMatch:', error);

    if (error instanceof z.ZodError) {
      const errorMessages = error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`).join(', ');
      throw new Error(`Erreur de validation: ${errorMessages}`);
    }

    throw error;
  }
}

// ✅ NOUVELLE FONCTION pour match nul
export async function setMatchDraw(id: number) {
  try {
    const existing = await getMatchById(id, { with_relations: false });
    if (!existing) {
      throw new Error('Match non trouvé');
    }

    const updates = {
      match_result: 'draw',
      status: 'completed',
      winner_fighter_id: null,
      loser_fighter_id: null,
      end_time: new Date().toTimeString().slice(0, 8)
    };

    const result = await updateMatch(id, updates);

    await emitMatchEvent(id, 'match_draw', {
      matchId: id,
      message: 'Match déclaré nul'
    }, existing.sub_group_id);

    return result;
  } catch (error) {
    console.error('Error in setMatchDraw:', error);
    throw error;
  }
}

// ✅ NOUVELLE FONCTION pour ajouter un carton
export async function addFighterCard(cardData: {
  match_id: number;
  fighter_id: number;
  card_type: 'yellow' | 'red';
  card_reason?: string;
  minute_given?: string;
}) {
  try {
    const sql = `
      INSERT INTO fighter_cards (match_id, fighter_id, card_type, card_reason, minute_given)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

    const result = await query(sql, [
      cardData.match_id,
      cardData.fighter_id,
      cardData.card_type,
      cardData.card_reason || 'Faute non spécifiée',
      cardData.minute_given || '00:00'
    ]);

    // Récupérer le sub_group_id pour l'émission
    const match = await queryOne<{ sub_group_id: number }>(
      'SELECT sub_group_id FROM matches WHERE id = $1',
      [cardData.match_id]
    );

    // Émettre l'événement de carton (au match et au sous-groupe)
    await emitMatchEvent(cardData.match_id, 'card_added', {
      card: result[0],
      fighterId: cardData.fighter_id
    }, match?.sub_group_id);

    return {
      success: true,
      card: result[0]
    };
  } catch (error) {
    console.error('Error in addFighterCard:', error);
    throw error;
  }
}

// ✅ NOUVELLE FONCTION pour supprimer un carton
export async function deleteFighterCard(cardId: number) {
  try {
    // Récupérer le match_id avant suppression
    const cardInfo = await query<{ match_id: number; fighter_id: number }>(`
      SELECT match_id, fighter_id FROM fighter_cards WHERE id = $1
    `, [cardId]);

    if (!cardInfo[0]) {
      throw new Error('Carton non trouvé');
    }

    const sql = 'DELETE FROM fighter_cards WHERE id = $1 RETURNING *';
    const result = await query(sql, [cardId]);

    // Émettre l'événement de suppression
    await emitMatchEvent(cardInfo[0].match_id, 'card_deleted', {
      cardId,
      fighterId: cardInfo[0].fighter_id
    });

    return {
      success: true,
      message: 'Carton supprimé'
    };
  } catch (error) {
    console.error('Error in deleteFighterCard:', error);
    throw error;
  }
}

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

    // Récupérer le groupe, la phase et l'édition associés au sous-groupe
    const phaseGroupInfo = await client.query(`
      SELECT sg.group_id, p.id as phase_id, p.phase_type, p.edition_id
      FROM sub_groups sg
      JOIN phase_groups pg ON sg.group_id = pg.id
      JOIN phases p ON pg.phase_id = p.id
      WHERE sg.id = $1
    `, [subGroupId]);

    const groupRow = phaseGroupInfo.rows[0];
    const groupId = groupRow?.group_id;
    const phaseType = groupRow?.phase_type;
    const editionId = groupRow?.edition_id;

    // Déterminer si la phase est éliminatoire
    const isEliminationPhase = Boolean(
      phaseType && ['knockout', 'quarterfinal', 'semifinal', 'final', 'third_place'].includes(phaseType)
    );

    // 🔢 Déterminer numéro
    let matchNumber = data.match_number;

    if (!matchNumber) {
      if (isEliminationPhase && groupId) {
        // En phase éliminatoire, incrémenter le numéro de match par groupe global au lieu du sous-groupe
        const maxResult = await client.query(
          `
          SELECT COALESCE(MAX(m.match_number), 0) as max
          FROM matches m
          JOIN sub_groups sg ON m.sub_group_id = sg.id
          WHERE sg.group_id = $1
          `,
          [groupId]
        );

        matchNumber = (maxResult.rows[0]?.max || 0) + 1;
      } else {
        // En phase normale (poules), incrémenter par sous-groupe (rencontre)
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
    }

    // Déterminer les états initiaux des lutteurs
    let fighter1_initial_state: 'eliminated' | 'not_eliminated' = 'not_eliminated';
    let fighter2_initial_state: 'eliminated' | 'not_eliminated' = 'not_eliminated';

    if (editionId && data.fighter1_id) {
      const fighter1State = await client.query(`
        SELECT is_eliminated 
        FROM edition_fighters 
        WHERE edition_id = $1 AND fighter_id = $2
      `, [editionId, data.fighter1_id]);

      fighter1_initial_state = fighter1State.rows[0]?.is_eliminated ? 'eliminated' : 'not_eliminated';
    }

    if (editionId && data.fighter2_id) {
      const fighter2State = await client.query(`
        SELECT is_eliminated 
        FROM edition_fighters 
        WHERE edition_id = $1 AND fighter_id = $2
      `, [editionId, data.fighter2_id]);

      fighter2_initial_state = fighter2State.rows[0]?.is_eliminated ? 'eliminated' : 'not_eliminated';
    }

    // 🆕 Insert match
    const insertRes = await client.query(
      `
      INSERT INTO matches (
        sub_group_id,
        match_number,
        fighter1_id,
        fighter2_id,
        fighter1_initial_state,
        fighter2_initial_state,
        notes,
        status,
        break_count,
        is_active,
        match_date
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'scheduled', 0, true, CURRENT_DATE)
      RETURNING id
      `,
      [
        subGroupId,
        matchNumber,
        data.fighter1_id || null,
        data.fighter2_id || null,
        fighter1_initial_state,
        fighter2_initial_state,
        data.notes || null
      ]
    );

    const matchId = insertRes.rows[0].id;

    // 📸 Snapshot initial (inclut maintenant les états des lutteurs)
    const snapshot = await generateInitialState(client, matchId);

    await client.query(
      `UPDATE matches SET initial_state = $1 WHERE id = $2`,
      [JSON.stringify(snapshot), matchId]
    );

    await client.query('COMMIT');

    // 🔥 Émettre l'événement de création
    await emitMatchEvent(matchId, 'match_created', {
      matchId,
      subGroupId: subGroupId
    });

    revalidatePath(`/ad/sub-groups/${subGroupId}/matches`);
    revalidatePath(`/matches`);

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

export async function sendMatchPush(matchId: number, description?: string, title?: string) {
  await sendPushToTopic(
    `global`,
    title || '🔥 Match en direct',
    description || 'Un match est en direct !'
  );
}



export async function deleteMatch(id: number) {
  try {
    const existing = await getMatchById(id, { with_relations: false });
    if (!existing) {
      throw new Error('Match non trouvé');
    }

    // Récupérer l'édition pour revalidation
    const editionInfo = await query(`
      SELECT ce.id as edition_id
      FROM matches m
      JOIN sub_groups sg ON m.sub_group_id = sg.id
      JOIN phase_groups pg ON sg.group_id = pg.id
      JOIN phases p ON pg.phase_id = p.id
      JOIN competition_editions ce ON p.edition_id = ce.id
      WHERE m.id = $1
    `, [id]);

    const editionId = editionInfo[0]?.edition_id;

    const sql = 'DELETE FROM matches WHERE id = $1';
    await query(sql, [id]);

    // Supprimer du realtime Firestore
    await emitRealtimeEvent("match", id, "deleted");

    revalidatePath('/matches');
    revalidatePath(`/editions/${editionId}`);
    revalidatePath(`/sub-groups/${existing.sub_group_id}`);
    revalidateTag("matches", {});
    revalidateTag(`match:${id}`, {});

    return {
      success: true,
      message: 'Match supprimé avec succès'
    };
  } catch (error) {
    console.error('Error in deleteMatch:', error);
    throw new Error('Erreur lors de la suppression du match');
  }
}

export async function updateMatchStatus(id: number, status: string) {
  try {
    const validStatuses = ['scheduled', 'live', 'round_break', 'completed', 'cancelled', 'postponed', 'reclamation'];
    if (!validStatuses.includes(status)) {
      throw new Error('Statut invalide');
    }

    const sql = `
      UPDATE matches 
      SET status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
    `;

    await query(sql, [status, id]);

    // Émettre l'événement de changement de statut
    await emitMatchEvent(id, 'match_status_changed', {
      match: updateMatch,
      previousStatus: 'live', // Vous pourriez vouloir stocker l'ancien statut
      newStatus: status
    });

    if (status === 'live') {
      await sendPushToTopic(
        `global`,
        '🔥 Match en direct !',
        'Le match vient de commencer',
        { matchId: id.toString() }
      );
    }

    if (status === 'completed') {
      await sendPushToTopic(
        `global`,
        '✅ Match terminé',
        'Le match est terminé, découvrez le résultat',
        { matchId: id.toString() }
      );
    }

    revalidatePath('/matches');
    revalidatePath(`/matches/${id}`);
    revalidateTag("matches", {});
    revalidateTag(`match:${id}`, {});

    return {
      success: true,
      message: `Statut du match mis à jour: ${status}`
    };
  } catch (error) {
    console.error('Error in updateMatchStatus:', error);
    throw new Error('Erreur lors de la mise à jour du statut');
  }
}

// NOUVELLE FONCTION pour les mises à jour en temps réel pendant les matches
export async function updateLiveMatchData(id: number, updates: {
  status?: string;
  start_time?: string;
  end_time?: string;
  break_count?: number;
  audience_count?: number;
  notes?: string;
}) {
  try {
    const existing = await getMatchById(id, { with_relations: false });
    if (!existing) {
      throw new Error('Match non trouvé');
    }

    const sql = `
      UPDATE matches 
      SET 
        status = COALESCE($1, status),
        start_time = COALESCE($2, start_time),
        end_time = COALESCE($3, end_time),
        break_count = COALESCE($4, break_count),
        audience_count = COALESCE($5, audience_count),
        notes = COALESCE($6, notes),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $7
    `;

    await query(sql, [
      updates.status ?? null,
      updates.start_time || null,
      updates.end_time ?? null,
      updates.break_count ?? null,
      updates.audience_count ?? null,
      updates.notes ?? null,
      id
    ]);

    // Récupérer le match mis à jour
    const updatedMatch = await getMatchById(id, {
      with_relations: true,
      relations: {
        with_fighters: true,
        with_sub_group: true
      }
    });

    // Émettre l'événement de mise à jour en direct
    await emitMatchEvent(id, 'match_live_update', {
      match: updatedMatch,
      updates
    });

    return {
      success: true,
      message: 'Données du match mises à jour',
      match: updatedMatch
    };
  } catch (error) {
    console.error('Error in updateLiveMatchData:', error);
    throw new Error('Erreur lors de la mise à jour des données du match');
  }
}

/**
 * Crée un combat d'élimination directe pour un groupe de phase non-poule.
 * Crée ou réutilise automatiquement le sub_group correspondant aux régions des deux lutteurs.
 * Valide que les lutteurs ne sont pas déjà éliminés et n'ont pas encore combattu dans ce tour.
 */
export async function createEliminationMatch(
  groupId: number,
  data: {
    fighter1_id?: number | null;
    fighter2_id?: number | null;
    match_number?: number;
    notes?: string;
    period?: "matin" | "soir";
    is_exceptional?: boolean;
    referee_id?: number | null;
  }
) {
  try {
    const {
      fighter1_id,
      fighter2_id,
      match_number,
      notes,
      period = "matin",
      is_exceptional = false,
      referee_id,
    } = data;

    // A. Validation : au moins un lutteur requis
    if (!fighter1_id && !fighter2_id) {
      throw new Error("Au moins un lutteur doit être sélectionné pour créer un match");
    }

    if (fighter1_id && fighter2_id && fighter1_id === fighter2_id) {
      throw new Error("Un lutteur ne peut pas combattre contre lui-même");
    }

    // 1. Récupérer le groupe, la phase et l'édition
    const groupSql = `
      SELECT pg.id as group_id, pg.name as group_name, pg.date as group_date,
             p.id as phase_id, p.name as phase_name, p.phase_type,
             p.edition_id
      FROM phase_groups pg
      JOIN phases p ON pg.phase_id = p.id
      WHERE pg.id = $1
    `;
    const groupRes = await queryOne<{
      group_id: number;
      group_name: string;
      group_date: string | null;
      phase_id: number;
      phase_name: string;
      phase_type: string;
      edition_id: number;
    }>(groupSql, [groupId]);

    if (!groupRes) {
      throw new Error("Groupe de phase non trouvé");
    }

    const { edition_id } = groupRes;

    // 2. Vérifier les lutteurs sélectionnés dans edition_fighters
    const requestedFighterIds = [fighter1_id, fighter2_id].filter(
      (id): id is number => typeof id === "number" && id > 0
    );

    const fightersSql = `
      SELECT ef.fighter_id, ef.region_id, ef.is_eliminated,
             f.first_name, f.last_name, f.nickname,
             r.name as region_name, r.code as region_code
      FROM edition_fighters ef
      JOIN fighters f ON ef.fighter_id = f.id
      LEFT JOIN regions r ON ef.region_id = r.id
      WHERE ef.edition_id = $1 AND ef.fighter_id = ANY($2::int[])
    `;
    const fightersRes = await query<{
      fighter_id: number;
      region_id: number;
      is_eliminated: boolean;
      first_name: string;
      last_name: string;
      nickname: string | null;
      region_name: string;
      region_code: string;
    }>(fightersSql, [edition_id, requestedFighterIds]);

    if (fightersRes.length !== requestedFighterIds.length) {
      throw new Error("Un ou plusieurs lutteurs sélectionnés ne participent pas à cette édition");
    }

    const f1 = fighter1_id ? fightersRes.find((f) => f.fighter_id === fighter1_id) : null;
    const f2 = fighter2_id ? fightersRes.find((f) => f.fighter_id === fighter2_id) : null;

    // En mode normal (non exceptionnel), vérifier que les lutteurs ne sont pas éliminés
    if (!is_exceptional) {
      if (f1 && f1.is_eliminated) {
        throw new Error(`Le lutteur ${f1.first_name} ${f1.last_name} a déjà été terrassé / éliminé`);
      }
      if (f2 && f2.is_eliminated) {
        throw new Error(`Le lutteur ${f2.first_name} ${f2.last_name} a déjà été terrassé / éliminé`);
      }
    }

    // 3. Vérifier la participation dans le groupe
    // En mode normal : interdire les doublons dans le tour
    // En mode exceptionnel : autoriser les lutteurs même s'ils ont déjà un match (ex: 3e place)
    if (!is_exceptional && requestedFighterIds.length > 0) {
      const existingGroupMatchesSql = `
        SELECT m.id, m.match_number, m.fighter1_id, m.fighter2_id
        FROM matches m
        JOIN sub_groups sg ON m.sub_group_id = sg.id
        WHERE sg.group_id = $1
          AND (m.fighter1_id = ANY($2::int[]) OR m.fighter2_id = ANY($2::int[]))
          AND m.status != 'cancelled'
      `;
      const existingGroupMatches = await query(existingGroupMatchesSql, [
        groupId,
        requestedFighterIds,
      ]);

      if (existingGroupMatches.length > 0) {
        throw new Error(
          "L'un des lutteurs sélectionnés a déjà un combat prévu ou terminé dans ce tour. Utilisez le mode 'Match exceptionnel' si vous organisez un match de classement."
        );
      }
    }

    // 4. Trouver ou créer le sous-groupe (rencontre) pour ces régions
    let subGroupId: number;
    let existingSubGroupMainRefereeId: number | null = null;
    const region1Id = f1?.region_id ?? f2?.region_id ?? null;
    const region2Id = f1 && f2 ? f2.region_id : null;
    const isGroupPhase = groupRes.phase_type === 'group';

    if (region1Id && region2Id) {
      const findSubGroupSql = `
        SELECT id, name, main_referee_id FROM sub_groups
        WHERE group_id = $1
          AND (
            (region1_id = $2 AND region2_id = $3) OR
            (region1_id = $3 AND region2_id = $2)
          )
        LIMIT 1
      `;
      const existingSubGroup = await queryOne<{ id: number; name: string; main_referee_id: number | null }>(
        findSubGroupSql,
        [groupId, region1Id, region2Id]
      );

      if (existingSubGroup) {
        subGroupId = existingSubGroup.id;
        existingSubGroupMainRefereeId = existingSubGroup.main_referee_id;
        const updates: string[] = [];
        const params: any[] = [];

        if (period) {
          params.push(period);
          updates.push(`period = ${params.length}`);
        }
        // Pour les phases 'group' uniquement, l'arbitre est synchronisé sur le sous-groupe
        if (isGroupPhase && referee_id !== undefined && referee_id !== null) {
          params.push(referee_id);
          updates.push(`main_referee_id = ${params.length}`);
          existingSubGroupMainRefereeId = referee_id;
        }
        if (updates.length > 0) {
          params.push(subGroupId);
          await query(`UPDATE sub_groups SET ${updates.join(", ")} WHERE id = ${params.length}`, params);
        }
        // Si phase group et nouvel arbitre, synchroniser tous les matchs existants du sous-groupe
        if (isGroupPhase && referee_id) {
          await query(`UPDATE matches SET referee_id = $1 WHERE sub_group_id = $2`, [referee_id, subGroupId]);
        }
      } else {
        const subGroupName = `${f1?.region_name || 'Région 1'} vs ${f2?.region_name || 'Région 2'}`;
        const insertSubGroupSql = `
          INSERT INTO sub_groups (
            group_id, name, sub_group_order, region1_id, region2_id,
            status, is_active, is_completed, period, main_referee_id
          )
          VALUES (
            $1,
            $2,
            (SELECT COALESCE(MAX(sub_group_order), 0) + 1 FROM sub_groups WHERE group_id = $1),
            $3,
            $4,
            'upcoming',
            TRUE,
            FALSE,
            $5,
            $6
          )
          RETURNING id
        `;
        // main_referee_id n'est affecté au sous-groupe que pour les phases 'group'
        const subGroupRefereeToSet = isGroupPhase ? (referee_id || null) : null;
        const createdSubGroup = await queryOne<{ id: number }>(insertSubGroupSql, [
          groupId,
          subGroupName,
          region1Id,
          region2Id,
          period,
          subGroupRefereeToSet,
        ]);

        if (!createdSubGroup) {
          throw new Error("Erreur lors de la création automatique du sous-groupe");
        }
        subGroupId = createdSubGroup.id;
        existingSubGroupMainRefereeId = subGroupRefereeToSet;
      }
    } else {
      // 1 seul lutteur présent : sous-groupe régional individuel
      const singleRegion = f1?.region_name || f2?.region_name || "Individuel";
      const findSingleSubGroupSql = `
        SELECT id, name, main_referee_id FROM sub_groups
        WHERE group_id = $1
          AND region1_id = $2 AND region2_id IS NULL
        LIMIT 1
      `;
      const existingSubGroup = await queryOne<{ id: number; name: string; main_referee_id: number | null }>(
        findSingleSubGroupSql,
        [groupId, region1Id]
      );

      if (existingSubGroup) {
        subGroupId = existingSubGroup.id;
        existingSubGroupMainRefereeId = existingSubGroup.main_referee_id;
        if (isGroupPhase && referee_id) {
          await query(`UPDATE sub_groups SET main_referee_id = $1 WHERE id = $2`, [referee_id, subGroupId]);
          await query(`UPDATE matches SET referee_id = $1 WHERE sub_group_id = $2`, [referee_id, subGroupId]);
          existingSubGroupMainRefereeId = referee_id;
        }
      } else {
        const subGroupName = `${singleRegion} (Tour)`;
        const insertSubGroupSql = `
          INSERT INTO sub_groups (
            group_id, name, sub_group_order, region1_id, region2_id,
            status, is_active, is_completed, period, main_referee_id
          )
          VALUES (
            $1,
            $2,
            (SELECT COALESCE(MAX(sub_group_order), 0) + 1 FROM sub_groups WHERE group_id = $1),
            $3,
            NULL,
            'upcoming',
            TRUE,
            FALSE,
            $4,
            $5
          )
          RETURNING id
        `;
        const subGroupRefereeToSet = isGroupPhase ? (referee_id || null) : null;
        const createdSubGroup = await queryOne<{ id: number }>(insertSubGroupSql, [
          groupId,
          subGroupName,
          region1Id,
          period,
          subGroupRefereeToSet,
        ]);
        if (!createdSubGroup) {
          throw new Error("Erreur lors de la création du sous-groupe");
        }
        subGroupId = createdSubGroup.id;
        existingSubGroupMainRefereeId = subGroupRefereeToSet;
      }
    }

    // 5. Déterminer le match_number par groupe
    let nextMatchNumber = match_number;
    if (!nextMatchNumber) {
      const maxNumberRes = await queryOne<{ max_num: number }>(
        `SELECT COALESCE(MAX(m.match_number), 0) + 1 as max_num
         FROM matches m
         JOIN sub_groups sg ON m.sub_group_id = sg.id
         WHERE sg.group_id = $1`,
        [groupId]
      );
      nextMatchNumber = maxNumberRes?.max_num || 1;
    }

    const matchDate = groupRes.group_date
      ? new Date(groupRes.group_date).toISOString()
      : new Date().toISOString();

    // 6. Insérer le match avec son propre referee_id
    // Si phase group et aucun arbitre spécifié, hériter de l'arbitre du sous-groupe
    const matchRefereeId = referee_id ?? (isGroupPhase ? existingSubGroupMainRefereeId : null) ?? null;

    const combinedNotes = is_exceptional
      ? [notes, "[Match exceptionnel]"].filter(Boolean).join(" ")
      : notes || null;

    const insertMatchSql = `
      INSERT INTO matches (
        sub_group_id, match_number, match_date, fighter1_id, fighter2_id,
        fighter1_initial_state, fighter2_initial_state, status, is_active, notes, referee_id
      )
      VALUES (
        $1, $2, $3, $4, $5,
        $6, $7,
        'scheduled', TRUE, $8, $9
      )
      RETURNING id
    `;
    const createdMatch = await queryOne<{ id: number }>(insertMatchSql, [
      subGroupId,
      nextMatchNumber,
      matchDate,
      fighter1_id || null,
      fighter2_id || null,
      f1?.is_eliminated ? 'eliminated' : 'not_eliminated',
      f2?.is_eliminated ? 'eliminated' : 'not_eliminated',
      combinedNotes,
      matchRefereeId,
    ]);

    if (!createdMatch) {
      throw new Error("Erreur lors de la création du match");
    }

    revalidatePath(`/ad/phase-groups/${groupId}`);
    revalidatePath(`/ad/phase-groups/${groupId}/organisation`);
    revalidatePath(`/ad/matches`);

    return {
      success: true,
      matchId: createdMatch.id,
      subGroupId,
      message: "Match d'élimination créé avec succès",
    };
  } catch (error: any) {
    console.error("Error in createEliminationMatch:", error);
    throw new Error(error.message || "Erreur lors de la création du match d'élimination");
  }
}
