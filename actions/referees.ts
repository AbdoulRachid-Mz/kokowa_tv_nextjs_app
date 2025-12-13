// @/actions/referees.ts - VERSION CORRIGÉE
'use server';

import { query, queryOne } from '@/lib/db/neon-client';
import { refereeSchema } from '@/validation/schemas';
import { revalidatePath } from 'next/cache';
import { Referee, PaginatedResponse } from '@/types';

export interface RefereeFilters {
  search?: string;
  page?: number;
  limit?: number;
  region_id?: number;
  is_active?: boolean;
  certification_level?: string;
  experience_min?: number;
  with_region?: boolean;
  with_sub_groups?: boolean;
}

export async function getReferees(
  options: RefereeFilters = {}
): Promise<PaginatedResponse<Referee>> {
  try {
    const {
      search = '',
      page = 1,
      limit = 20,
      region_id,
      is_active,
      certification_level,
      experience_min,
      with_region = true,
      with_sub_groups = true,
    } = options;

    let whereClause = 'WHERE 1=1';
    const params: any[] = [];
    const selectFields: string[] = ['r.*'];

    // Filtre de recherche
    if (search) {
      params.push(`%${search}%`);
      whereClause += ` AND (
        r.first_name ILIKE $${params.length} 
        OR r.last_name ILIKE $${params.length}
        OR r.nickname ILIKE $${params.length}
        OR r.license_number ILIKE $${params.length}
      )`;
    }

    // Filtres supplémentaires
    if (region_id) {
      params.push(region_id);
      whereClause += ` AND r.region_id = $${params.length}`;
    }

    if (is_active !== undefined) {
      params.push(is_active);
      whereClause += ` AND r.is_active = $${params.length}`;
    }

    if (certification_level) {
      params.push(certification_level);
      whereClause += ` AND r.certification_level = $${params.length}`;
    }

    if (experience_min !== undefined) {
      params.push(experience_min);
      whereClause += ` AND r.experience_years >= $${params.length}`;
    }

    // Jointure avec la région
    let joinClause = '';
    if (with_region) {
      joinClause += ` LEFT JOIN regions reg ON r.region_id = reg.id`;
      selectFields.push(`
        JSON_BUILD_OBJECT(
          'id', reg.id,
          'name', reg.name,
          'code', reg.code,
          'stadium_name', reg.stadium_name,
          'color', reg.color
        ) as region
      `);
    }

    // Jointure avec les sous-groupes si demandé
    if (with_sub_groups) {
      selectFields.push(`
        (
          SELECT COALESCE(
            JSON_AGG(
              JSON_BUILD_OBJECT(
                'id', sg.id,
                'name', sg.name,
                'sub_group_order', sg.sub_group_order,
                'description', sg.description,
                'is_completed', sg.is_completed,
                'is_active', sg.is_active,
                'group', JSON_BUILD_OBJECT(
                  'id', pg.id,
                  'name', pg.name
                ),
                'phase', JSON_BUILD_OBJECT(
                  'id', p.id,
                  'name', p.name,
                  'phase_type', p.phase_type
                ),
                'edition', JSON_BUILD_OBJECT(
                  'id', ce.id,
                  'edition_number', ce.edition_number,
                  'year', ce.year
                ),
                'competition', JSON_BUILD_OBJECT(
                  'id', c.id,
                  'name', c.name
                ),
                'match_count', (
                  SELECT COUNT(*)
                  FROM matches m
                  WHERE m.sub_group_id = sg.id
                )
              )
              ORDER BY ce.year DESC, p.phase_order, pg.group_order, sg.sub_group_order
            ), '[]'::json
          )
          FROM sub_groups sg
          JOIN phase_groups pg ON sg.group_id = pg.id
          JOIN phases p ON pg.phase_id = p.id
          JOIN competition_editions ce ON p.edition_id = ce.id
          JOIN competitions c ON ce.competition_id = c.id
          WHERE sg.main_referee_id = r.id
          LIMIT 5
        ) as recent_sub_groups
      `);
    }

    // Requête pour le total
    const countSql = `
      SELECT COUNT(*) as total
      FROM referees r
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
    params.push(validatedLimit, offset);
    const dataSql = `
      SELECT ${selectFields.join(', ')}
      FROM referees r
      ${joinClause}
      ${whereClause}
      ORDER BY r.is_active DESC, r.experience_years DESC, r.first_name ASC
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `;

    const data = await query<Referee>(dataSql, params);

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
    console.error('Error in getReferees:', error);
    throw new Error('Erreur lors de la récupération des arbitres');
  }
}

export async function getRefereeById(id: number, options: {
  with_relations?: boolean 
} = {}) {
  try {
    const { with_relations = true } = options;
    
    let sql = 'SELECT * FROM referees WHERE id = $1';
    const params: any[] = [id];

    if (with_relations) {
      sql = `
        WITH referee_base AS (
          SELECT 
            r.*,
            JSON_BUILD_OBJECT(
              'id', reg.id,
              'name', reg.name,
              'code', reg.code,
              'stadium_name', reg.stadium_name,
              'color', reg.color
            ) as region
          FROM referees r
          LEFT JOIN regions reg ON r.region_id = reg.id
          WHERE r.id = $1
        ),
        sub_groups_data AS (
          SELECT 
            sg.id,
            sg.name,
            sg.sub_group_order,
            sg.description,
            sg.region1_id,
            sg.region2_id,
            sg.belt_region1,
            sg.belt_region2,
            sg.is_completed,
            sg.is_active,
            sg.created_at as sub_group_created,
            -- Informations du groupe
            JSON_BUILD_OBJECT(
              'id', pg.id,
              'name', pg.name,
              'group_order', pg.group_order,
              'description', pg.description,
              'is_completed', pg.is_completed,
              'is_active', pg.is_active
            ) as phase_group,
            -- Informations de la phase
            JSON_BUILD_OBJECT(
              'id', p.id,
              'name', p.name,
              'phase_type', p.phase_type,
              'phase_order', p.phase_order,
              'is_completed', p.is_completed,
              'is_active', p.is_active,
              'description', p.description,
              'start_date', p.start_date,
              'end_date', p.end_date
            ) as phase,
            -- Informations de l'édition
            JSON_BUILD_OBJECT(
              'id', ce.id,
              'edition_number', ce.edition_number,
              'year', ce.year,
              'theme', ce.theme,
              'start_date', ce.start_date,
              'end_date', ce.end_date,
              'is_active', ce.is_active,
              'total_participants', ce.total_participants,
              'prize_pool', ce.prize_pool
            ) as edition,
            -- Informations de la compétition
            JSON_BUILD_OBJECT(
              'id', c.id,
              'name', c.name,
              'slug', c.slug,
              'description', c.description,
              'status', c.status,
              'featured_image', c.featured_image
            ) as competition
          FROM sub_groups sg
          JOIN phase_groups pg ON sg.group_id = pg.id
          JOIN phases p ON pg.phase_id = p.id
          JOIN competition_editions ce ON p.edition_id = ce.id
          JOIN competitions c ON ce.competition_id = c.id
          WHERE sg.main_referee_id = $1
          ORDER BY ce.year DESC, p.phase_order, pg.group_order, sg.sub_group_order
        ),
        sub_groups_with_matches AS (
          SELECT 
            sgd.*,
            (
              SELECT COALESCE(
                JSON_AGG(
                  JSON_BUILD_OBJECT(
                    'id', m.id,
                    'match_number', m.match_number,
                    'match_date', m.match_date,
                    'start_time', m.start_time,
                    'end_time', m.end_time,
                    'status', m.status,
                    'match_result', m.match_result,
                    'total_duration', m.total_duration,
                    'audience_count', m.audience_count,
                    'video_url', m.video_url,
                    'fighter1', CASE 
                      WHEN f1.id IS NOT NULL THEN 
                        JSON_BUILD_OBJECT(
                          'id', f1.id,
                          'first_name', f1.first_name,
                          'last_name', f1.last_name,
                          'nickname', f1.nickname,
                          'profile_image', f1.profile_image
                        )
                      ELSE NULL
                    END,
                    'fighter2', CASE 
                      WHEN f2.id IS NOT NULL THEN 
                        JSON_BUILD_OBJECT(
                          'id', f2.id,
                          'first_name', f2.first_name,
                          'last_name', f2.last_name,
                          'nickname', f2.nickname,
                          'profile_image', f2.profile_image
                        )
                      ELSE NULL
                    END,
                    'winner', CASE 
                      WHEN fw.id IS NOT NULL THEN 
                        JSON_BUILD_OBJECT(
                          'id', fw.id,
                          'first_name', fw.first_name,
                          'last_name', fw.last_name,
                          'nickname', fw.nickname
                        )
                      ELSE NULL
                    END
                  ) ORDER BY m.match_date DESC, m.match_number
                ), '[]'::json
              )
              FROM matches m
              LEFT JOIN fighters f1 ON m.fighter1_id = f1.id
              LEFT JOIN fighters f2 ON m.fighter2_id = f2.id
              LEFT JOIN fighters fw ON m.winner_fighter_id = fw.id
              WHERE m.sub_group_id = sgd.id
              AND m.is_active = true
            ) as matches
          FROM sub_groups_data sgd
        )
        SELECT 
          rb.*,
          (
            SELECT COALESCE(
              JSON_AGG(
                JSON_BUILD_OBJECT(
                  'id', sg.id,
                  'name', sg.name,
                  'sub_group_order', sg.sub_group_order,
                  'description', sg.description,
                  'region1_id', sg.region1_id,
                  'region2_id', sg.region2_id,
                  'belt_region1', sg.belt_region1,
                  'belt_region2', sg.belt_region2,
                  'is_completed', sg.is_completed,
                  'is_active', sg.is_active,
                  'created_at', sg.sub_group_created,
                  'phase_group', sg.phase_group,
                  'phase', sg.phase,
                  'edition', sg.edition,
                  'competition', sg.competition,
                  'matches', sg.matches
                )
              ), '[]'::json
            )
            FROM sub_groups_with_matches sg
          ) as sub_groups,
          (
            SELECT COUNT(*)
            FROM sub_groups
            WHERE main_referee_id = $1
          ) as total_sub_groups
        FROM referee_base rb
      `;
    }

    const result = await queryOne<Referee>(sql, params);
    
    if (!result) {
      throw new Error('Arbitre non trouvé');
    }
    
    return result;
  } catch (error) {
    console.error('Error in getRefereeById:', error);
    throw error;
  }
}

// Fonction alternative simplifiée pour les statistiques
export async function getRefereeStatistics(id: number) {
  try {
    const sql = `
      SELECT 
        r.*,
        -- Récupérer la région
        JSON_BUILD_OBJECT(
          'id', reg.id,
          'name', reg.name,
          'code', reg.code
        ) as region,
        -- Statistiques générales
        (
          SELECT COUNT(*)
          FROM sub_groups sg
          WHERE sg.main_referee_id = r.id
        ) as total_sub_groups_assigned,
        (
          SELECT COUNT(*)
          FROM sub_groups sg
          WHERE sg.main_referee_id = r.id
          AND sg.is_completed = true
        ) as completed_sub_groups,
        (
          SELECT COUNT(*)
          FROM matches m
          JOIN sub_groups sg ON m.sub_group_id = sg.id
          WHERE sg.main_referee_id = r.id
        ) as total_matches_officiated,
        (
          SELECT COUNT(*)
          FROM matches m
          JOIN sub_groups sg ON m.sub_group_id = sg.id
          WHERE sg.main_referee_id = r.id
          AND m.status = 'completed'
        ) as completed_matches,
        -- Derniers sous-groupes
        (
          SELECT COALESCE(
            JSON_AGG(
              JSON_BUILD_OBJECT(
                'id', sg.id,
                'name', sg.name,
                'created_at', sg.created_at,
                'phase', p.name,
                'edition', ce.year,
                'competition', c.name
              ) ORDER BY sg.created_at DESC
            ), '[]'::json
          )
          FROM sub_groups sg
          JOIN phase_groups pg ON sg.group_id = pg.id
          JOIN phases p ON pg.phase_id = p.id
          JOIN competition_editions ce ON p.edition_id = ce.id
          JOIN competitions c ON ce.competition_id = c.id
          WHERE sg.main_referee_id = r.id
          ORDER BY sg.created_at DESC
          LIMIT 5
        ) as recent_sub_groups,
        -- Compétitions récentes
        (
          SELECT COALESCE(
            JSON_AGG(DISTINCT
              JSON_BUILD_OBJECT(
                'id', c.id,
                'name', c.name,
                'slug', c.slug,
                'status', c.status
              )
            ), '[]'::json
          )
          FROM sub_groups sg
          JOIN phase_groups pg ON sg.group_id = pg.id
          JOIN phases p ON pg.phase_id = p.id
          JOIN competition_editions ce ON p.edition_id = ce.id
          JOIN competitions c ON ce.competition_id = c.id
          WHERE sg.main_referee_id = r.id
          LIMIT 10
        ) as competitions_involved
      FROM referees r
      LEFT JOIN regions reg ON r.region_id = reg.id
      WHERE r.id = $1
    `;

    const result = await queryOne<any>(sql, [id]);
    
    if (!result) {
      throw new Error('Arbitre non trouvé');
    }
    
    return result;
  } catch (error) {
    console.error('Error in getRefereeStatistics:', error);
    throw new Error('Erreur lors de la récupération des statistiques de l\'arbitre');
  }
}

// Fonction pour récupérer les rencontres dirigées par un arbitre
export async function getRefereeEncounters(refereeId: number, options: {
  limit?: number;
  offset?: number;
} = {}) {
  try {
    const { limit = 20, offset = 0 } = options;
    
    const sql = `
      SELECT 
        m.id as match_id,
        m.match_number,
        m.match_date,
        m.start_time,
        m.end_time,
        m.status,
        m.match_result,
        m.audience_count,
        -- Fighter 1
        JSON_BUILD_OBJECT(
          'id', f1.id,
          'first_name', f1.first_name,
          'last_name', f1.last_name,
          'nickname', f1.nickname,
          'profile_image', f1.profile_image,
          'region', JSON_BUILD_OBJECT(
            'id', reg1.id,
            'name', reg1.name,
            'code', reg1.code
          )
        ) as fighter1,
        -- Fighter 2
        JSON_BUILD_OBJECT(
          'id', f2.id,
          'first_name', f2.first_name,
          'last_name', f2.last_name,
          'nickname', f2.nickname,
          'profile_image', f2.profile_image,
          'region', JSON_BUILD_OBJECT(
            'id', reg2.id,
            'name', reg2.name,
            'code', reg2.code
          )
        ) as fighter2,
        -- Winner
        CASE 
          WHEN fw.id IS NOT NULL THEN 
            JSON_BUILD_OBJECT(
              'id', fw.id,
              'first_name', fw.first_name,
              'last_name', fw.last_name,
              'nickname', fw.nickname
            )
          ELSE NULL
        END as winner,
        -- Sub-group info
        JSON_BUILD_OBJECT(
          'id', sg.id,
          'name', sg.name,
          'sub_group_order', sg.sub_group_order
        ) as sub_group,
        -- Group info
        JSON_BUILD_OBJECT(
          'id', pg.id,
          'name', pg.name,
          'group_order', pg.group_order
        ) as phase_group,
        -- Phase info
        JSON_BUILD_OBJECT(
          'id', p.id,
          'name', p.name,
          'phase_type', p.phase_type,
          'phase_order', p.phase_order
        ) as phase,
        -- Edition info
        JSON_BUILD_OBJECT(
          'id', ce.id,
          'edition_number', ce.edition_number,
          'year', ce.year,
          'theme', ce.theme
        ) as edition,
        -- Competition info
        JSON_BUILD_OBJECT(
          'id', c.id,
          'name', c.name,
          'slug', c.slug,
          'status', c.status
        ) as competition
      FROM matches m
      JOIN sub_groups sg ON m.sub_group_id = sg.id
      JOIN phase_groups pg ON sg.group_id = pg.id
      JOIN phases p ON pg.phase_id = p.id
      JOIN competition_editions ce ON p.edition_id = ce.id
      JOIN competitions c ON ce.competition_id = c.id
      LEFT JOIN fighters f1 ON m.fighter1_id = f1.id
      LEFT JOIN fighters f2 ON m.fighter2_id = f2.id
      LEFT JOIN fighters fw ON m.winner_fighter_id = fw.id
      LEFT JOIN regions reg1 ON f1.region_id = reg1.id
      LEFT JOIN regions reg2 ON f2.region_id = reg2.id
      WHERE sg.main_referee_id = $1
      AND m.is_active = true
      ORDER BY m.match_date DESC, m.start_time DESC
      LIMIT $2 OFFSET $3
    `;

    const results = await query<any>(sql, [refereeId, limit, offset]);
    return results;
  } catch (error) {
    console.error('Error in getRefereeEncounters:', error);
    throw new Error('Erreur lors de la récupération des rencontres de l\'arbitre');
  }
}

export async function createReferee(formData: FormData) {
  try {
    const rawData = {
      first_name: formData.get('first_name'),
      last_name: formData.get('last_name'),
      nickname: formData.get('nickname'),
      birth_date: formData.get('birth_date'),
      region_id: formData.get('region_id'),
      license_number: formData.get('license_number'),
      certification_level: formData.get('certification_level'),
      experience_years: formData.get('experience_years'),
      is_active: formData.get('is_active'),
    };

    const cleanedData = {
      first_name: rawData.first_name as string,
      last_name: rawData.last_name as string,
      nickname: rawData.nickname as string || undefined,
      birth_date: rawData.birth_date as string || undefined,
      region_id: rawData.region_id ? Number(rawData.region_id) : undefined,
      license_number: rawData.license_number as string || undefined,
      certification_level: rawData.certification_level as string || undefined,
      experience_years: rawData.experience_years ? Number(rawData.experience_years) : undefined,
      is_active: rawData.is_active === 'true',
    };

    const validatedData = refereeSchema.parse(cleanedData);

    const sql = `
      INSERT INTO referees (
        first_name, last_name, nickname, birth_date, region_id,
        license_number, certification_level, experience_years, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id
    `;
    
    const result = await query<{ id: number }>(sql, [
      validatedData.first_name,
      validatedData.last_name,
      validatedData.nickname || null,
      validatedData.birth_date || null,
      validatedData.region_id || null,
      validatedData.license_number || null,
      validatedData.certification_level || null,
      validatedData.experience_years || null,
      validatedData.is_active,
    ]);

    revalidatePath('/ad/referees');
    return { 
      success: true, 
      id: result[0].id,
      message: 'Arbitre créé avec succès'
    };
  } catch (error) {
    console.error('Error in createReferee:', error);
    throw new Error('Erreur lors de la création de l\'arbitre');
  }
}

export async function updateReferee(id: number, formData: FormData) {
  try {
    const rawData = {
      first_name: formData.get('first_name'),
      last_name: formData.get('last_name'),
      nickname: formData.get('nickname'),
      birth_date: formData.get('birth_date'),
      region_id: formData.get('region_id'),
      license_number: formData.get('license_number'),
      certification_level: formData.get('certification_level'),
      experience_years: formData.get('experience_years'),
      is_active: formData.get('is_active'),
    };

    const cleanedData = {
      first_name: rawData.first_name as string,
      last_name: rawData.last_name as string,
      nickname: rawData.nickname as string || undefined,
      birth_date: rawData.birth_date as string || undefined,
      region_id: rawData.region_id ? Number(rawData.region_id) : undefined,
      license_number: rawData.license_number as string || undefined,
      certification_level: rawData.certification_level as string || undefined,
      experience_years: rawData.experience_years ? Number(rawData.experience_years) : undefined,
      is_active: rawData.is_active === 'true',
    };

    const validatedData = refereeSchema.parse(cleanedData);

    const sql = `
      UPDATE referees
      SET
        first_name = $1,
        last_name = $2,
        nickname = $3,
        birth_date = $4,
        region_id = $5,
        license_number = $6,
        certification_level = $7,
        experience_years = $8,
        is_active = $9,
        updated_at = NOW()
      WHERE id = $10
      RETURNING id
    `;

    const result = await query<{ id: number }>(sql, [
      validatedData.first_name,
      validatedData.last_name,
      validatedData.nickname || null,
      validatedData.birth_date || null,
      validatedData.region_id || null,
      validatedData.license_number || null,
      validatedData.certification_level || null,
      validatedData.experience_years || null,
      validatedData.is_active,
      id,
    ]);

    if (result.length === 0) {
      throw new Error('Arbitre non trouvé');
    }

    revalidatePath('/ad/referees');
    return {
      success: true,
      id: result[0].id,
      message: 'Arbitre mis à jour avec succès'
    };
  } catch (error) {
    console.error('Error in updateReferee:', error);
    throw new Error('Erreur lors de la mise à jour de l\'arbitre');
  }
}

export async function deleteReferee(id: number) {
  try {
    // Vérifier si l'arbitre est utilisé dans des sous-groupes
    const checkSql = 'SELECT COUNT(*) as count FROM sub_groups WHERE main_referee_id = $1';
    const checkResult = await query<{ count: string }>(checkSql, [id]);
    const isUsed = parseInt(checkResult[0]?.count || '0') > 0;

    if (isUsed) {
      throw new Error('Cet arbitre est encore assigné à des sous-groupes. Veuillez d\'abord le retirer des sous-groupes.');
    }

    const sql = 'DELETE FROM referees WHERE id = $1 RETURNING id';
    const result = await query<{ id: number }>(sql, [id]);

    if (result.length === 0) {
      throw new Error('Arbitre non trouvé');
    }

    revalidatePath('/ad/referees');
    return {
      success: true,
      id: result[0].id,
      message: 'Arbitre supprimé avec succès'
    };
  } catch (error) {
    console.error('Error in deleteReferee:', error);
    throw error;
  }
}