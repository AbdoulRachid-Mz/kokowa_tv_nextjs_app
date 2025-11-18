// lib/actions/matches.ts - VERSION FINALE CORRIGÉE
'use server';

import { query, queryOne } from '@/lib/db/neon-client';
import { matchSchema } from '@/validation/schemas';
import { revalidatePath } from 'next/cache';
import { Match, MatchFilters, PaginatedResponse } from '@/types';
import { connectionManager } from '@/lib/realtime/connection-manager';
import { z } from 'zod';

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

// Fonction utilitaire pour émettre des événements match
async function emitMatchEvent(matchId: number, eventType: string, data: any) {
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

    console.log('📥 Données reçues (create):', rawData);

    // Nettoyer les données
    const cleanedData = {
      sub_group_id: Number(rawData.sub_group_id),
      match_number: rawData.match_number && rawData.match_number !== '' ? Number(rawData.match_number) : undefined,
      match_date: (rawData.match_date as string) || new Date().toISOString().split('T')[0],
      start_time: (rawData.start_time as string) || undefined,
      fighter1_id: rawData.fighter1_id && rawData.fighter1_id !== '' ? Number(rawData.fighter1_id) : undefined,
      fighter2_id: rawData.fighter2_id && rawData.fighter2_id !== '' ? Number(rawData.fighter2_id) : undefined,
      notes: rawData.notes ? (rawData.notes as string).trim() || 'Aucune note' : 'Aucune note',
    };

    console.log('🧹 Données nettoyées (create):', cleanedData);

    const validatedData = matchSchema.parse(cleanedData);

    const sql = `
      INSERT INTO matches (
        sub_group_id, match_number, match_date, start_time,
        fighter1_id, fighter2_id, notes, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'scheduled')
      RETURNING id
    `;
    
    const result = await query<{ id: number }>(sql, [
      validatedData.sub_group_id,
      validatedData.match_number || null,
      validatedData.match_date,
      validatedData.start_time || null,
      validatedData.fighter1_id || null,
      validatedData.fighter2_id || null,
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
    revalidatePath(`/ad/sub-groups/${validatedData.sub_group_id}`);
    revalidatePath(`/ad/sub-groups/${validatedData.sub_group_id}/organisation`);
    
    return { 
      success: true, 
      id: result[0].id,
      message: 'Match créé avec succès'
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
      winner_fighter_id: formData.get('winner_fighter_id'),
      loser_fighter_id: formData.get('loser_fighter_id'),
      match_result: formData.get('match_result'),
      total_duration: formData.get('total_duration'),
      break_count: formData.get('break_count'),
      status: formData.get('status'),
      audience_count: formData.get('audience_count'),
      video_url: formData.get('video_url'),
      live_stream_url: formData.get('live_stream_url'),
      notes: formData.get('notes'),
    };

    console.log('📥 Données reçues:', rawData);

    // Nettoyer les données avec gestion des valeurs vides
    const cleanedData: any = {
      sub_group_id: rawData.sub_group_id ? Number(rawData.sub_group_id) : existing.sub_group_id,
      match_number: rawData.match_number && rawData.match_number !== '' ? Number(rawData.match_number) : undefined,
      match_date: rawData.match_date && rawData.match_date !== '' 
        ? rawData.match_date as string 
        : (existing.match_date 
            ? (typeof existing.match_date === 'string' 
                ? existing.match_date.split('T')[0] 
                : (existing.match_date as any) instanceof Date 
                  ? ((existing.match_date as any) instanceof Date
                      ? (existing.match_date as Date).toISOString().split('T')[0]
                      : String(existing.match_date).split('T')[0])
                  : String(existing.match_date).split('T')[0])
            : undefined),
      start_time: rawData.start_time && rawData.start_time !== '' ? rawData.start_time as string : undefined,
      end_time: rawData.end_time && rawData.end_time !== '' ? rawData.end_time as string : undefined,
      fighter1_id: rawData.fighter1_id && rawData.fighter1_id !== '' ? Number(rawData.fighter1_id) : undefined,
      fighter2_id: rawData.fighter2_id && rawData.fighter2_id !== '' ? Number(rawData.fighter2_id) : undefined,
      winner_fighter_id: rawData.winner_fighter_id && rawData.winner_fighter_id !== '' ? Number(rawData.winner_fighter_id) : undefined,
      loser_fighter_id: rawData.loser_fighter_id && rawData.loser_fighter_id !== '' ? Number(rawData.loser_fighter_id) : undefined,
      match_result: rawData.match_result && rawData.match_result !== '' ? rawData.match_result as any : undefined,
      total_duration: rawData.total_duration && rawData.total_duration !== '' ? rawData.total_duration as string : undefined,
      break_count: rawData.break_count && rawData.break_count !== '' ? Number(rawData.break_count) : existing.break_count || 0,
      status: rawData.status && rawData.status !== '' ? rawData.status as any : existing.status,
      audience_count: rawData.audience_count && rawData.audience_count !== '' ? Number(rawData.audience_count) : undefined,
      video_url: rawData.video_url && rawData.video_url !== '' ? rawData.video_url as string : undefined,
      live_stream_url: rawData.live_stream_url && rawData.live_stream_url !== '' ? rawData.live_stream_url as string : undefined,
      notes: rawData.notes && rawData.notes !== '' ? rawData.notes as string : undefined,
    };

    console.log('🧹 Données nettoyées:', cleanedData);

    // Utiliser partial() pour permettre les mises à jour partielles
    const validatedData = matchSchema.partial().parse(cleanedData);

    console.log('✅ Données validées:', validatedData);

    // Construire la requête SQL dynamiquement
    const updates: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    // Ajouter chaque champ modifié
    if (validatedData.sub_group_id !== undefined) {
      updates.push(`sub_group_id = $${paramIndex}`);
      params.push(validatedData.sub_group_id);
      paramIndex++;
    }

    if (validatedData.match_number !== undefined) {
      updates.push(`match_number = $${paramIndex}`);
      params.push(validatedData.match_number);
      paramIndex++;
    }

    if (validatedData.match_date !== undefined) {
      updates.push(`match_date = $${paramIndex}`);
      params.push(validatedData.match_date);
      paramIndex++;
    }

    if (validatedData.start_time !== undefined) {
      updates.push(`start_time = $${paramIndex}`);
      params.push(validatedData.start_time);
      paramIndex++;
    }

    if (validatedData.end_time !== undefined) {
      updates.push(`end_time = $${paramIndex}`);
      params.push(validatedData.end_time);
      paramIndex++;
    }

    if (validatedData.fighter1_id !== undefined) {
      updates.push(`fighter1_id = $${paramIndex}`);
      params.push(validatedData.fighter1_id);
      paramIndex++;
    }

    if (validatedData.fighter2_id !== undefined) {
      updates.push(`fighter2_id = $${paramIndex}`);
      params.push(validatedData.fighter2_id);
      paramIndex++;
    }

    if (validatedData.winner_fighter_id !== undefined) {
      updates.push(`winner_fighter_id = $${paramIndex}`);
      params.push(validatedData.winner_fighter_id);
      paramIndex++;
    }

    if (validatedData.loser_fighter_id !== undefined) {
      updates.push(`loser_fighter_id = $${paramIndex}`);
      params.push(validatedData.loser_fighter_id);
      paramIndex++;
    }

    if (validatedData.match_result !== undefined) {
      updates.push(`match_result = $${paramIndex}`);
      params.push(validatedData.match_result);
      paramIndex++;
    }

    if (validatedData.total_duration !== undefined) {
      updates.push(`total_duration = $${paramIndex}`);
      params.push(validatedData.total_duration);
      paramIndex++;
    }

    if (validatedData.break_count !== undefined) {
      updates.push(`break_count = $${paramIndex}`);
      params.push(validatedData.break_count);
      paramIndex++;
    }

    if (validatedData.status !== undefined) {
      updates.push(`status = $${paramIndex}`);
      params.push(validatedData.status);
      paramIndex++;
    }

    if (validatedData.audience_count !== undefined) {
      updates.push(`audience_count = $${paramIndex}`);
      params.push(validatedData.audience_count);
      paramIndex++;
    }

    if (validatedData.video_url !== undefined) {
      updates.push(`video_url = $${paramIndex}`);
      params.push(validatedData.video_url);
      paramIndex++;
    }

    if (validatedData.live_stream_url !== undefined) {
      updates.push(`live_stream_url = $${paramIndex}`);
      params.push(validatedData.live_stream_url);
      paramIndex++;
    }

    if (validatedData.notes !== undefined) {
      updates.push(`notes = $${paramIndex}`);
      params.push(validatedData.notes);
      paramIndex++;
    }

    // Toujours mettre à jour updated_at
    updates.push(`updated_at = CURRENT_TIMESTAMP`);

    if (updates.length === 1) { // Seulement updated_at
      throw new Error('Aucune donnée à mettre à jour');
    }

    // Ajouter l'ID à la fin
    params.push(id);

    const sql = `
      UPDATE matches 
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
    `;

    console.log('📝 SQL:', sql);
    console.log('🔢 Paramètres:', params);

    await query(sql, params);

    // Récupérer le match mis à jour
    const updatedMatch = await getMatchById(id, { 
      with_relations: true,
      relations: {
        with_fighters: true,
        with_sub_group: true
      }
    });

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

    // Émettre l'événement de mise à jour
    await emitMatchEvent(id, 'match_updated', {
      match: updatedMatch,
      changes: Object.keys(validatedData).filter(key => validatedData[key as keyof typeof validatedData] !== undefined)
    });

    revalidatePath('/matches');
    revalidatePath(`/editions/${editionId}`);
    revalidatePath(`/matches/${id}`);
    revalidatePath(`/ad/sub-groups/${validatedData.sub_group_id || existing.sub_group_id}`);
    revalidatePath(`/ad/sub-groups/${validatedData.sub_group_id || existing.sub_group_id}/organisation`);
    
    return { 
      success: true, 
      message: 'Match modifié avec succès',
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
}                                                                                          