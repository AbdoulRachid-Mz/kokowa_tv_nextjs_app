// @/actions/matches.ts - VERSION FINALE CORRIGÉE
'use server';

import { query, queryOne } from '@/lib/db/neon-client';
import { matchSchema } from '@/validation/schemas';
import { revalidatePath } from 'next/cache';
import { Match, MatchFilters, PaginatedResponse } from '@/types';
import { connectionManager } from '@/lib/realtime/connection-manager';
import { z } from 'zod';
import { updateMatchAndRecompute } from '@/lib/services/match-update.service';

export async function getMatches(
  filters: MatchFilters = {}
): Promise<PaginatedResponse<Match>> {
  try {
    const {
      sub_group_id,
      edition_id,
      phase_id,
      group_id,
      status,
      date_from,
      date_to,
      search = '',
      page = 1,
      limit = 20,
      with_sub_group = true,
      with_fighters = true,
    } = filters;

    let whereConditions: string[] = ['1=1'];
    let joinClauses: string[] = [];
    const params: any[] = [];
    const selectFields: string[] = ['m.*'];

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
    if (edition_id || phase_id || group_id || with_sub_group) {
      joinClauses.push(`
        LEFT JOIN sub_groups sg ON m.sub_group_id = sg.id
        LEFT JOIN phase_groups pg ON sg.group_id = pg.id
        LEFT JOIN phases p ON pg.phase_id = p.id
        LEFT JOIN competition_editions ce ON p.edition_id = ce.id
      `);
    }

    // Filtres hiérarchiques
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
export async function emitMatchEvent(matchId: number, eventType: string, data: any) {
  try {
    // Récupérer les infos de l'édition pour broadcast
    const editionInfo = await query(`
      SELECT ce.id as edition_id
      FROM matches m
      JOIN sub_groups sg ON m.sub_group_id = sg.id
      JOIN phase_groups pg ON sg.group_id = pg.id
      JOIN phases p ON pg.phase_id = p.id
      JOIN competition_editions ce ON p.edition_id = ce.id
      WHERE m.id = $1
    `, [matchId]);

    const editionId = editionInfo[0]?.edition_id;

    // Émettre aux abonnés du match
    connectionManager.broadcastToMatch(matchId, eventType, {
      matchId,
      ...data
    });

    // Émettre aux abonnés de l'édition
    if (editionId) {
      connectionManager.broadcastToEdition(editionId, eventType, {
        matchId,
        editionId,
        ...data
      });
    }

    console.log(`Event ${eventType} emitted for match ${matchId}`);
  } catch (error) {
    console.error('Error emitting match event:', error);
  }
}


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

    console.log('📥 Mise à jour du match:', id, data);

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

    // Émettre l'événement de mise à jour
    await emitMatchEvent(id, 'match_updated', {
      match: updatedMatch,
      changes: Object.keys(updates)
    });

    // Revalidation des chemins
    revalidatePath('/matches');
    revalidatePath(`/matches/${id}`);
    if (updatedMatch.sub_group_id) {
      revalidatePath(`/ad/sub-groups/${updatedMatch.sub_group_id}`);
      revalidatePath(`/ad/sub-groups/${updatedMatch.sub_group_id}/organisation`);
    }

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
    });

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

    // Émettre l'événement de carton
    await emitMatchEvent(cardData.match_id, 'card_added', {
      card: result[0],
      fighterId: cardData.fighter_id
    });

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

export async function createMatch(formData: FormData) {
  try {
    const rawData = {
      sub_group_id: formData.get('sub_group_id'),
      match_number: formData.get('match_number'),
      match_date: formData.get('match_date'),
      start_time: formData.get('start_time'),
      fighter1_id: formData.get('fighter1_id'),
      fighter2_id: formData.get('fighter2_id'),
      notes: formData.get('notes'),
    };

    // Build object for schema validation
    const schemaData = {
      sub_group_id: Number(rawData.sub_group_id),
      match_number: rawData.match_number && rawData.match_number !== '' ? Number(rawData.match_number) : undefined,
      match_date: (rawData.match_date as string) || new Date().toISOString().split('T')[0],
      start_time: (rawData.start_time as string) || undefined,
      fighter1_id: rawData.fighter1_id && rawData.fighter1_id !== '' ? Number(rawData.fighter1_id) : undefined,
      fighter2_id: rawData.fighter2_id && rawData.fighter2_id !== '' ? Number(rawData.fighter2_id) : undefined,
      notes: rawData.notes ? (rawData.notes as string).trim() || 'Aucune note' : 'Aucune note',
    };

    // Validate with schema
    const validatedData = matchSchema.parse(schemaData);

    // Determine match number
    let finalMatchNumber = validatedData.match_number;

    if (finalMatchNumber === undefined || finalMatchNumber === null) {
      const maxNumberResult = await query<{ max_number: number }>(
        `SELECT COALESCE(MAX(match_number), 0) as max_number 
         FROM matches WHERE sub_group_id = $1`,
        [validatedData.sub_group_id]
      );

      finalMatchNumber = maxNumberResult[0]?.max_number + 1 || 1;
    } else {
      const existingNumberCheck = await query<{ id: number }>(
        `SELECT id FROM matches WHERE match_number = $1 AND sub_group_id = $2`,
        [finalMatchNumber, validatedData.sub_group_id]
      );

      if (existingNumberCheck.length > 0) {
        const numbersResult = await query<{ match_number: number }>(
          `SELECT match_number FROM matches 
           WHERE sub_group_id = $1 
           ORDER BY match_number`,
          [validatedData.sub_group_id]
        );

        const existingNumbers = numbersResult.map(r => r.match_number);
        let nextNumber = finalMatchNumber;

        while (existingNumbers.includes(nextNumber as number)) {
          nextNumber = (nextNumber as number) + 1;
        }

        finalMatchNumber = nextNumber;
      }
    }

    const sql = `
      INSERT INTO matches (
        sub_group_id, match_number, match_date, start_time,
        fighter1_id, fighter2_id, notes, status, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'scheduled', $8)
      RETURNING id
    `;

    const result = await query<{ id: number }>(sql, [
      validatedData.sub_group_id,
      finalMatchNumber,
      validatedData.match_date,
      validatedData.start_time || null,
      validatedData.fighter1_id || null,
      validatedData.fighter2_id || null,
      validatedData.notes ?? null,
      true,
    ]);

    const matchId = result[0].id;

    // Initialize fighter states in edition
    const ctx = await getMatchEditionContext(matchId);
    if (ctx) {
      await ensureEditionFightersQualified(ctx.edition_id, [validatedData.fighter1_id, validatedData.fighter2_id].filter(Boolean) as number[]);
    }

    await emitMatchEvent(matchId, 'match_created', {
      matchId,
      subGroupId: validatedData.sub_group_id
    });

    revalidatePath(`/ad/sub-groups/${validatedData.sub_group_id}/organisation`);

    return {
      success: true,
      id: matchId,
      message: `Match #${finalMatchNumber} créé avec succès`
    };
  } catch (error) {
    console.error('Error in createMatch:', error);

    if (error instanceof z.ZodError) {
      const errorMessages = error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`).join(', ');
      throw new Error(`Erreur de validation: ${errorMessages}`);
    }

    throw new Error('Erreur lors de la création du match');
  }
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
    
    revalidatePath('/matches');
    revalidatePath(`/editions/${editionId}`);
    revalidatePath(`/sub-groups/${existing.sub_group_id}`);
    
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
      previousStatus: 'scheduled', // Vous pourriez vouloir stocker l'ancien statut
      newStatus: status
    });

    revalidatePath('/matches');
    revalidatePath(`/matches/${id}`);
    
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