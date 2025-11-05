// actions/matches.ts - VERSION COMPLÈTEMENT CORRIGÉE
'use server';

import { query, queryOne } from '@/lib/db/neon-client';
import { matchSchema } from '@/validation/schemas';
import { revalidatePath } from 'next/cache';
import { Match, PaginatedResponse } from '@/types';

export interface MatchFilters {
  sub_group_id?: number;
  edition_id?: number;
  phase_id?: number;
  group_id?: number;
  status?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
  page?: number;
  limit?: number;
  with_sub_group?: boolean;
  with_fighters?: boolean;
  with_regions?: boolean;
  with_referees?: boolean;
}

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
      with_regions = true,
      with_referees = false,
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
      whereConditions.push(`(m.venue ILIKE $${paramIndex} OR m.notes ILIKE $${paramIndex + 1})`);
      params.push(`%${search}%`, `%${search}%`);
      paramIndex += 2;
    }

    // Jointures hiérarchiques pour les filtres
    if (edition_id || phase_id || group_id || with_sub_group) {
      joinClauses.push(`
        LEFT JOIN sub_groups sg ON m.sub_group_id = sg.id
        LEFT JOIN phase_groups pg ON sg.group_id = pg.id
        LEFT JOIN phases p ON pg.phase_id = p.id
        LEFT JOIN competition_editions ce ON p.edition_id = ce.id
        LEFT JOIN competitions c ON ce.competition_id = c.id
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

    if (with_regions) {
      joinClauses.push(`
        LEFT JOIN regions r1 ON m.region1_id = r1.id
        LEFT JOIN regions r2 ON m.region2_id = r2.id
        LEFT JOIN regions wr ON m.winner_region_id = wr.id
        LEFT JOIN regions lr ON m.loser_region_id = lr.id
      `);
      
      selectFields.push(`
        CASE WHEN r1.id IS NOT NULL THEN
          JSON_BUILD_OBJECT(
            'id', r1.id,
            'name', r1.name,
            'code', r1.code
          )
        ELSE NULL END as region1,
        CASE WHEN r2.id IS NOT NULL THEN
          JSON_BUILD_OBJECT(
            'id', r2.id,
            'name', r2.name,
            'code', r2.code
          )
        ELSE NULL END as region2,
        CASE WHEN wr.id IS NOT NULL THEN
          JSON_BUILD_OBJECT(
            'id', wr.id,
            'name', wr.name,
            'code', wr.code
          )
        ELSE NULL END as winner_region,
        CASE WHEN lr.id IS NOT NULL THEN
          JSON_BUILD_OBJECT(
            'id', lr.id,
            'name', lr.name,
            'code', lr.code
          )
        ELSE NULL END as loser_region
      `);
    }

    if (with_referees) {
      joinClauses.push(`
        LEFT JOIN referees ref ON m.main_referee_id = ref.id
      `);
      
      selectFields.push(`
        CASE WHEN ref.id IS NOT NULL THEN
          JSON_BUILD_OBJECT(
            'id', ref.id,
            'first_name', ref.first_name,
            'last_name', ref.last_name,
            'nickname', ref.nickname
          )
        ELSE NULL END as main_referee,
        COALESCE(
          (SELECT JSON_AGG(
            JSON_BUILD_OBJECT(
              'id', ra.id,
              'referee', JSON_BUILD_OBJECT(
                'id', r.id,
                'first_name', r.first_name,
                'last_name', r.last_name,
                'nickname', r.nickname
              ),
              'role', ra.role,
              'assigned_at', ra.assigned_at
            ) ORDER BY ra.assigned_at DESC
          ) FROM referee_assignments ra
          JOIN referees r ON ra.referee_id = r.id
          WHERE ra.match_id = m.id),
          '[]'::json
        ) as referee_assignments
      `);
    }

    // Construction du sous-groupe avec toutes les relations
    if (with_sub_group && (edition_id || phase_id || group_id || with_sub_group)) {
      selectFields.push(`
        CASE WHEN sg.id IS NOT NULL THEN
          JSON_BUILD_OBJECT(
            'id', sg.id,
            'name', sg.name,
            'sub_group_order', sg.sub_group_order,
            'is_completed', sg.is_completed,
            'group', CASE WHEN pg.id IS NOT NULL THEN
              JSON_BUILD_OBJECT(
                'id', pg.id,
                'name', pg.name,
                'group_order', pg.group_order,
                'is_completed', pg.is_completed,
                'phase', CASE WHEN p.id IS NOT NULL THEN
                  JSON_BUILD_OBJECT(
                    'id', p.id,
                    'name', p.name,
                    'phase_order', p.phase_order,
                    'phase_type', p.phase_type,
                    'is_completed', p.is_completed,
                    'edition', CASE WHEN ce.id IS NOT NULL THEN
                      JSON_BUILD_OBJECT(
                        'id', ce.id,
                        'edition_number', ce.edition_number,
                        'year', ce.year,
                        'theme', ce.theme,
                        'total_participants', ce.total_participants,
                        'competition', CASE WHEN c.id IS NOT NULL THEN
                          JSON_BUILD_OBJECT(
                            'id', c.id,
                            'name', c.name,
                            'type', c.type,
                            'slug', c.slug
                          )
                        ELSE NULL END
                      )
                    ELSE NULL END
                  )
                ELSE NULL END
              )
            ELSE NULL END
          )
        ELSE NULL END as sub_group
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
    const limitParamIndex = paramIndex;
    const offsetParamIndex = paramIndex + 1;
    
    const dataSql = `
      SELECT ${selectFields.join(', ')}
      FROM matches m
      ${joinClause}
      ${whereClause}
      ORDER BY m.match_date ASC, m.match_number ASC
      LIMIT $${limitParamIndex} OFFSET $${offsetParamIndex}
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
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    throw new Error('Erreur lors de la récupération des matches');
  }
}

export async function getMatchById(id: number, options: { 
  with_relations?: boolean 
} = {}) {
  try {
    const { with_relations = true } = options;
    
    let sql = 'SELECT * FROM matches WHERE id = $1';
    const params: any[] = [id];

    if (with_relations) {
      sql = `
        SELECT 
          m.*,
          JSON_BUILD_OBJECT(
            'id', sg.id,
            'name', sg.name,
            'sub_group_order', sg.sub_group_order,
            'group', JSON_BUILD_OBJECT(
              'id', pg.id,
              'name', pg.name,
              'group_order', pg.group_order,
              'phase', JSON_BUILD_OBJECT(
                'id', p.id,
                'name', p.name,
                'phase_order', p.phase_order,
                'edition', JSON_BUILD_OBJECT(
                  'id', ce.id,
                  'edition_number', ce.edition_number,
                  'year', ce.year,
                  'competition', JSON_BUILD_OBJECT(
                    'id', c.id,
                    'name', c.name,
                    'type', c.type
                  )
                )
              )
            )
          ) as sub_group,
          JSON_BUILD_OBJECT(
            'id', f1.id,
            'first_name', f1.first_name,
            'last_name', f1.last_name,
            'nickname', f1.nickname,
            'ranking', f1.ranking
          ) as fighter1,
          JSON_BUILD_OBJECT(
            'id', f2.id,
            'first_name', f2.first_name,
            'last_name', f2.last_name,
            'nickname', f2.nickname,
            'ranking', f2.ranking
          ) as fighter2,
          JSON_BUILD_OBJECT(
            'id', r1.id,
            'name', r1.name,
            'code', r1.code
          ) as region1,
          JSON_BUILD_OBJECT(
            'id', r2.id,
            'name', r2.name,
            'code', r2.code
          ) as region2,
          JSON_BUILD_OBJECT(
            'id', wf.id,
            'first_name', wf.first_name,
            'last_name', wf.last_name,
            'nickname', wf.nickname
          ) as winner_fighter,
          JSON_BUILD_OBJECT(
            'id', wr.id,
            'name', wr.name,
            'code', wr.code
          ) as winner_region,
          JSON_BUILD_OBJECT(
            'id', lf.id,
            'first_name', lf.first_name,
            'last_name', lf.last_name,
            'nickname', lf.nickname
          ) as loser_fighter,
          JSON_BUILD_OBJECT(
            'id', lr.id,
            'name', lr.name,
            'code', lr.code
          ) as loser_region,
          JSON_BUILD_OBJECT(
            'id', ref.id,
            'first_name', ref.first_name,
            'last_name', ref.last_name,
            'nickname', ref.nickname
          ) as main_referee,
          (SELECT JSON_AGG(
            JSON_BUILD_OBJECT(
              'id', ra.id,
              'referee', JSON_BUILD_OBJECT(
                'id', r.id,
                'first_name', r.first_name,
                'last_name', r.last_name,
                'nickname', r.nickname
              ),
              'role', ra.role
            )
          ) FROM referee_assignments ra
          JOIN referees r ON ra.referee_id = r.id
          WHERE ra.match_id = m.id) as referee_assignments,
          (SELECT JSON_AGG(
            JSON_BUILD_OBJECT(
              'id', fc.id,
              'card_type', fc.card_type,
              'card_reason', fc.card_reason,
              'minute_given', fc.minute_given,
              'fighter', JSON_BUILD_OBJECT(
                'id', f.id,
                'first_name', f.first_name,
                'last_name', f.last_name,
                'nickname', f.nickname
              )
            )
          ) FROM fighter_cards fc
          JOIN fighters f ON fc.fighter_id = f.id
          WHERE fc.match_id = m.id) as cards
        FROM matches m
        LEFT JOIN sub_groups sg ON m.sub_group_id = sg.id
        LEFT JOIN phase_groups pg ON sg.group_id = pg.id
        LEFT JOIN phases p ON pg.phase_id = p.id
        LEFT JOIN competition_editions ce ON p.edition_id = ce.id
        LEFT JOIN competitions c ON ce.competition_id = c.id
        LEFT JOIN fighters f1 ON m.fighter1_id = f1.id
        LEFT JOIN fighters f2 ON m.fighter2_id = f2.id
        LEFT JOIN regions r1 ON m.region1_id = r1.id
        LEFT JOIN regions r2 ON m.region2_id = r2.id
        LEFT JOIN fighters wf ON m.winner_fighter_id = wf.id
        LEFT JOIN regions wr ON m.winner_region_id = wr.id
        LEFT JOIN fighters lf ON m.loser_fighter_id = lf.id
        LEFT JOIN regions lr ON m.loser_region_id = lr.id
        LEFT JOIN referees ref ON m.main_referee_id = ref.id
        WHERE m.id = $1
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

export async function createMatch(formData: FormData) {
  try {
    const rawData = {
      sub_group_id: formData.get('sub_group_id'),
      match_number: formData.get('match_number'),
      match_date: formData.get('match_date'),
      start_time: formData.get('start_time'),
      fighter1_id: formData.get('fighter1_id'),
      fighter2_id: formData.get('fighter2_id'),
      region1_id: formData.get('region1_id'),
      region2_id: formData.get('region2_id'),
      main_referee_id: formData.get('main_referee_id'),
      venue: formData.get('venue'),
      notes: formData.get('notes'),
    };

    // Nettoyer les données
    const cleanedData = {
      sub_group_id: Number(rawData.sub_group_id),
      match_number: rawData.match_number ? Number(rawData.match_number) : undefined,
      match_date: rawData.match_date as string,
      start_time: rawData.start_time as string || undefined,
      fighter1_id: rawData.fighter1_id ? Number(rawData.fighter1_id) : undefined,
      fighter2_id: rawData.fighter2_id ? Number(rawData.fighter2_id) : undefined,
      region1_id: rawData.region1_id ? Number(rawData.region1_id) : undefined,
      region2_id: rawData.region2_id ? Number(rawData.region2_id) : undefined,
      main_referee_id: rawData.main_referee_id ? Number(rawData.main_referee_id) : undefined,
      venue: rawData.venue as string || undefined,
      notes: rawData.notes as string || undefined,
    };

    const validatedData = matchSchema.parse(cleanedData);

    const sql = `
      INSERT INTO matches (
        sub_group_id, match_number, match_date, start_time,
        fighter1_id, fighter2_id, region1_id, region2_id,
        main_referee_id, venue, notes, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'scheduled')
      RETURNING id
    `;
    
    const result = await query<{ id: number }>(sql, [
      validatedData.sub_group_id,
      validatedData.match_number || null,
      validatedData.match_date,
      validatedData.start_time || null,
      validatedData.fighter1_id || null,
      validatedData.fighter2_id || null,
      validatedData.region1_id || null,
      validatedData.region2_id || null,
      validatedData.main_referee_id || null,
      validatedData.venue || null,
      validatedData.notes || null,
    ]);

    // Récupérer l'édition pour revalidation
    const editionInfo = await query(`
      SELECT ce.id as edition_id
      FROM matches m
      JOIN sub_groups sg ON m.sub_group_id = sg.id
      JOIN phase_groups pg ON sg.group_id = pg.id
      JOIN phases p ON pg.phase_id = p.id
      JOIN competition_editions ce ON p.edition_id = ce.id
      WHERE m.id = $1
    `, [result[0].id]);

    const editionId = editionInfo[0]?.edition_id;

    revalidatePath('/matches');
    revalidatePath(`/editions/${editionId}`);
    revalidatePath(`/sub-groups/${validatedData.sub_group_id}`);
    
    return { 
      success: true, 
      id: result[0].id,
      message: 'Match créé avec succès'
    };
  } catch (error) {
    console.error('Error in createMatch:', error);
    throw new Error('Erreur lors de la création du match');
  }
}

export async function updateMatch(id: number, formData: FormData) {
  try {
    const existing = await getMatchById(id, { with_relations: false });
    if (!existing) {
      throw new Error('Match non trouvé');
    }

    const rawData = {
      sub_group_id: formData.get('sub_group_id'),
      match_number: formData.get('match_number'),
      match_date: formData.get('match_date'),
      start_time: formData.get('start_time'),
      end_time: formData.get('end_time'),
      fighter1_id: formData.get('fighter1_id'),
      fighter2_id: formData.get('fighter2_id'),
      region1_id: formData.get('region1_id'),
      region2_id: formData.get('region2_id'),
      score_fighter1: formData.get('score_fighter1'),
      score_fighter2: formData.get('score_fighter2'),
      rounds: formData.get('rounds'),
      winner_fighter_id: formData.get('winner_fighter_id'),
      winner_region_id: formData.get('winner_region_id'),
      loser_fighter_id: formData.get('loser_fighter_id'),
      loser_region_id: formData.get('loser_region_id'),
      match_result: formData.get('match_result'),
      total_duration: formData.get('total_duration'),
      break_count: formData.get('break_count'),
      status: formData.get('status'),
      main_referee_id: formData.get('main_referee_id'),
      audience_count: formData.get('audience_count'),
      video_url: formData.get('video_url'),
      live_stream_url: formData.get('live_stream_url'),
      venue: formData.get('venue'),
      notes: formData.get('notes'),
    };

    const cleanedData = {
      sub_group_id: Number(rawData.sub_group_id),
      match_number: rawData.match_number ? Number(rawData.match_number) : undefined,
      match_date: rawData.match_date as string,
      start_time: rawData.start_time as string || undefined,
      end_time: rawData.end_time as string || undefined,
      fighter1_id: rawData.fighter1_id ? Number(rawData.fighter1_id) : undefined,
      fighter2_id: rawData.fighter2_id ? Number(rawData.fighter2_id) : undefined,
      region1_id: rawData.region1_id ? Number(rawData.region1_id) : undefined,
      region2_id: rawData.region2_id ? Number(rawData.region2_id) : undefined,
      score_fighter1: rawData.score_fighter1 ? Number(rawData.score_fighter1) : 0,
      score_fighter2: rawData.score_fighter2 ? Number(rawData.score_fighter2) : 0,
      rounds: rawData.rounds ? Number(rawData.rounds) : 1,
      winner_fighter_id: rawData.winner_fighter_id ? Number(rawData.winner_fighter_id) : undefined,
      winner_region_id: rawData.winner_region_id ? Number(rawData.winner_region_id) : undefined,
      loser_fighter_id: rawData.loser_fighter_id ? Number(rawData.loser_fighter_id) : undefined,
      loser_region_id: rawData.loser_region_id ? Number(rawData.loser_region_id) : undefined,
      match_result: rawData.match_result as any,
      total_duration: rawData.total_duration as string || undefined,
      break_count: rawData.break_count ? Number(rawData.break_count) : 0,
      status: rawData.status as any || 'scheduled',
      main_referee_id: rawData.main_referee_id ? Number(rawData.main_referee_id) : undefined,
      audience_count: rawData.audience_count ? Number(rawData.audience_count) : undefined,
      video_url: rawData.video_url as string || undefined,
      live_stream_url: rawData.live_stream_url as string || undefined,
      venue: rawData.venue as string || undefined,
      notes: rawData.notes as string || undefined,
    };

    const validatedData = matchSchema.parse(cleanedData);

    const sql = `
      UPDATE matches 
      SET 
        sub_group_id = $1, match_number = $2, match_date = $3, start_time = $4, end_time = $5,
        fighter1_id = $6, fighter2_id = $7, region1_id = $8, region2_id = $9,
        score_fighter1 = $10, score_fighter2 = $11, rounds = $12,
        winner_fighter_id = $13, winner_region_id = $14, loser_fighter_id = $15, loser_region_id = $16,
        match_result = $17, total_duration = $18, break_count = $19, status = $20,
        main_referee_id = $21, audience_count = $22, video_url = $23, live_stream_url = $24,
        venue = $25, notes = $26, updated_at = CURRENT_TIMESTAMP
      WHERE id = $27
    `;
    
    await query(sql, [
      validatedData.sub_group_id,
      validatedData.match_number || null,
      validatedData.match_date,
      validatedData.start_time || null,
      validatedData.end_time || null,
      validatedData.fighter1_id || null,
      validatedData.fighter2_id || null,
      validatedData.region1_id || null,
      validatedData.region2_id || null,
      validatedData.score_fighter1,
      validatedData.score_fighter2,
      validatedData.rounds,
      validatedData.winner_fighter_id || null,
      validatedData.winner_region_id || null,
      validatedData.loser_fighter_id || null,
      validatedData.loser_region_id || null,
      validatedData.match_result || null,
      validatedData.total_duration || null,
      validatedData.break_count,
      validatedData.status,
      validatedData.main_referee_id || null,
      validatedData.audience_count || null,
      validatedData.video_url || null,
      validatedData.live_stream_url || null,
      validatedData.venue || null,
      validatedData.notes || null,
      id,
    ]);

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

    revalidatePath('/matches');
    revalidatePath(`/editions/${editionId}`);
    revalidatePath(`/matches/${id}`);
    revalidatePath(`/sub-groups/${validatedData.sub_group_id}`);
    
    return { 
      success: true, 
      message: 'Match modifié avec succès' 
    };
  } catch (error) {
    console.error('Error in updateMatch:', error);
    throw error;
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