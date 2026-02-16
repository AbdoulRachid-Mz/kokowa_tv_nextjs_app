// @/actions/sub-groups.ts - VERSION CORRIGÉE
'use server';

import { pool, query, queryOne } from '@/lib/db/neon-client';
import { subGroupSchema } from '@/validation/schemas';
import { revalidatePath } from 'next/cache';
import { SubGroup, SubGroupFilters, PaginatedResponse, Region } from '@/types';
import { getEditionFighters, getEditionRegions } from '@/actions/editions';


export async function getSubGroups(
  filters: SubGroupFilters = {}
): Promise<PaginatedResponse<SubGroup>> {
  try {
    const {
      group_id,
      search = '',
      page = 1,
      limit = 20,
      with_group = true,
      with_matches = true,
      with_regions = true,
      with_belts = true,
      with_referee = true,
      is_active,
      is_completed,
      period,
      status,
      region1_id,
      region2_id,
      belt_region1,
      belt_region2,
      main_referee_id,
    } = filters;

    let whereClause = 'WHERE 1=1';
    const params: any[] = [];
    const selectFields: string[] = ['sg.*'];
    const joins: string[] = [];

    // Filtres de base
    if (group_id) {
      params.push(group_id);
      whereClause += ` AND sg.group_id = $${params.length}`;
    }

    if (search) {
      params.push(`%${search}%`);
      whereClause += ` AND (
        sg.name ILIKE $${params.length} 
        OR sg.description ILIKE $${params.length}
      )`;
    }

    if (typeof is_active === 'boolean') {
      params.push(is_active);
      whereClause += ` AND sg.is_active = $${params.length}`;
    }

    if (typeof is_completed === 'boolean') {
      params.push(is_completed);
      whereClause += ` AND sg.is_completed = $${params.length}`;
    }

    if (period) {
      params.push(period);
      whereClause += ` AND sg.period = $${params.length}`;
    }

    if (status) {
      params.push(status);
      whereClause += ` AND sg.status = $${params.length}`;
    }

    if (region1_id) {
      params.push(region1_id);
      whereClause += ` AND sg.region1_id = $${params.length}`;
    }

    if (region2_id) {
      params.push(region2_id);
      whereClause += ` AND sg.region2_id = $${params.length}`;
    }

    if (belt_region1) {
      params.push(belt_region1);
      whereClause += ` AND sg.belt_region1 = $${params.length}`;
    }

    if (belt_region2) {
      params.push(belt_region2);
      whereClause += ` AND sg.belt_region2 = $${params.length}`;
    }

    if (main_referee_id) {
      params.push(main_referee_id);
      whereClause += ` AND sg.main_referee_id = $${params.length}`;
    }

    // Jointures hiérarchiques
    joins.push(`
      LEFT JOIN phase_groups pg ON sg.group_id = pg.id
      LEFT JOIN phases p ON pg.phase_id = p.id
      LEFT JOIN competition_editions ce ON p.edition_id = ce.id
      LEFT JOIN competitions c ON ce.competition_id = c.id
    `);

    // Régions
    if (with_regions) {
      joins.push('LEFT JOIN regions r1 ON sg.region1_id = r1.id');
      joins.push('LEFT JOIN regions r2 ON sg.region2_id = r2.id');
      
      selectFields.push(`
        CASE WHEN r1.id IS NOT NULL THEN
          JSON_BUILD_OBJECT(
            'id', r1.id,
            'name', r1.name,
            'code', r1.code,
            'flag_image', r1.flag_image,
            'color', r1.color,
            'stadium_name', r1.stadium_name,
            'stadium_image', r1.stadium_image
          )
        ELSE NULL END as region1,
        CASE WHEN r2.id IS NOT NULL THEN
          JSON_BUILD_OBJECT(
            'id', r2.id,
            'name', r2.name,
            'code', r2.code,
            'flag_image', r2.flag_image,
            'color', r2.color,
            'stadium_name', r2.stadium_name,
            'stadium_image', r2.stadium_image
          )
        ELSE NULL END as region2
      `);
    }

    // Ceintures
    if (with_belts) {
      joins.push('LEFT JOIN belt b1 ON sg.belt_region1 = b1.id');
      joins.push('LEFT JOIN belt b2 ON sg.belt_region2 = b2.id');
      
      selectFields.push(`
        CASE WHEN b1.id IS NOT NULL THEN
          JSON_BUILD_OBJECT(
            'id', b1.id,
            'color', b1.color,
            'is_active', b1.is_active
          )
        ELSE NULL END as belt1,
        CASE WHEN b2.id IS NOT NULL THEN
          JSON_BUILD_OBJECT(
            'id', b2.id,
            'color', b2.color,
            'is_active', b2.is_active
          )
        ELSE NULL END as belt2
      `);
    }

    // Arbitre principal avec sa région
    if (with_referee) {
      joins.push('LEFT JOIN referees ref ON sg.main_referee_id = ref.id');
      joins.push('LEFT JOIN regions ref_r ON ref.region_id = ref_r.id');
      
      selectFields.push(`
        CASE WHEN ref.id IS NOT NULL THEN
          JSON_BUILD_OBJECT(
            'id', ref.id,
            'first_name', ref.first_name,
            'last_name', ref.last_name,
            'nickname', ref.nickname,
            'profile_image', ref.profile_image,
            'license_number', ref.license_number,
            'certification_level', ref.certification_level,
            'experience_years', ref.experience_years,
            'region_id', ref.region_id,
            'is_active', ref.is_active,
            'region', CASE WHEN ref_r.id IS NOT NULL THEN
              JSON_BUILD_OBJECT(
                'id', ref_r.id,
                'name', ref_r.name,
                'code', ref_r.code,
                'flag_image', ref_r.flag_image,
                'color', ref_r.color
              )
            ELSE NULL END
          )
        ELSE NULL END as main_referee
      `);
    }

    // Groupe avec phase, édition et compétition
    if (with_group) {
      selectFields.push(`
        JSON_BUILD_OBJECT(
          'id', pg.id,
          'name', pg.name,
          'group_order', pg.group_order,
          'description', pg.description,
          'is_completed', pg.is_completed,
          'is_active', pg.is_active,
          'date', pg.date,
          'phase', JSON_BUILD_OBJECT(
            'id', p.id,
            'name', p.name,
            'phase_order', p.phase_order,
            'phase_type', p.phase_type,
            'description', p.description,
            'is_completed', p.is_completed,
            'is_active', p.is_active,
            'edition', JSON_BUILD_OBJECT(
              'id', ce.id,
              'edition_number', ce.edition_number,
              'year', ce.year,
              'theme', ce.theme,
              'start_date', ce.start_date,
              'end_date', ce.end_date,
              'total_participants', ce.total_participants,
              'prize_pool', ce.prize_pool,
              'is_active', ce.is_active,
              'competition', JSON_BUILD_OBJECT(
                'id', c.id,
                'name', c.name,
                'slug', c.slug,
                'description', c.description,
                'status', c.status,
                'featured_image', c.featured_image,
                'is_active', c.is_active
              )
            )
          )
        ) as group
      `);
    }

    // Matchs avec leurs relations
    if (with_matches) {
      const isActiveFlag = typeof is_active === 'boolean' ? is_active : true;
      
      selectFields.push(`
        COALESCE(
          (SELECT JSON_AGG(
            JSON_BUILD_OBJECT(
              'id', m.id,
              'match_number', m.match_number,
              'match_date', m.match_date,
              'start_time', m.start_time,
              'end_time', m.end_time,
              'status', m.status,
              'match_result', m.match_result,
              'fighter1_id', m.fighter1_id,
              'fighter2_id', m.fighter2_id,
              'winner_fighter_id', m.winner_fighter_id,
              'loser_fighter_id', m.loser_fighter_id,
              'total_duration', m.total_duration,
              'break_count', m.break_count,
              'audience_count', m.audience_count,
              'video_url', m.video_url,
              'live_stream_url', m.live_stream_url,
              'notes', m.notes,
              'is_active', m.is_active,
              'fighter1', CASE WHEN f1.id IS NOT NULL THEN
                JSON_BUILD_OBJECT(
                  'id', f1.id,
                  'first_name', f1.first_name,
                  'last_name', f1.last_name,
                  'nickname', f1.nickname,
                  'ranking', f1.ranking,
                  'profile_image', f1.profile_image,
                  'region', CASE WHEN f1_r.id IS NOT NULL THEN
                    JSON_BUILD_OBJECT(
                      'id', f1_r.id,
                      'name', f1_r.name,
                      'code', f1_r.code,
                      'color', f1_r.color
                    )
                  ELSE NULL END
                )
              ELSE NULL END,
              'fighter2', CASE WHEN f2.id IS NOT NULL THEN
                JSON_BUILD_OBJECT(
                  'id', f2.id,
                  'first_name', f2.first_name,
                  'last_name', f2.last_name,
                  'nickname', f2.nickname,
                  'ranking', f2.ranking,
                  'profile_image', f2.profile_image,
                  'region', CASE WHEN f2_r.id IS NOT NULL THEN
                    JSON_BUILD_OBJECT(
                      'id', f2_r.id,
                      'name', f2_r.name,
                      'code', f2_r.code,
                      'color', f2_r.color
                    )
                  ELSE NULL END
                )
              ELSE NULL END,
              'winner_fighter', CASE WHEN wf.id IS NOT NULL THEN
                JSON_BUILD_OBJECT(
                  'id', wf.id,
                  'first_name', wf.first_name,
                  'last_name', wf.last_name,
                  'nickname', wf.nickname
                )
              ELSE NULL END,
              'loser_fighter', CASE WHEN lf.id IS NOT NULL THEN
                JSON_BUILD_OBJECT(
                  'id', lf.id,
                  'first_name', lf.first_name,
                  'last_name', lf.last_name,
                  'nickname', lf.nickname
                )
              ELSE NULL END
            ) ORDER BY m.match_number, m.match_date
          ) FROM matches m
          LEFT JOIN fighters f1 ON m.fighter1_id = f1.id
          LEFT JOIN regions f1_r ON f1.region_id = f1_r.id
          LEFT JOIN fighters f2 ON m.fighter2_id = f2.id
          LEFT JOIN regions f2_r ON f2.region_id = f2_r.id
          LEFT JOIN fighters wf ON m.winner_fighter_id = wf.id
          LEFT JOIN fighters lf ON m.loser_fighter_id = lf.id
          WHERE m.sub_group_id = sg.id
            AND (${isActiveFlag} IS FALSE OR m.is_active = true)
          ),
          '[]'::json
        ) as matches
      `);
    }

    // Requête pour le total
    const countSql = `
      SELECT COUNT(*) as total
      FROM sub_groups sg
      ${joins.join(' ')}
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
      FROM sub_groups sg
      ${joins.join(' ')}
      ${whereClause}
      ORDER BY sg.sub_group_order ASC, sg.name ASC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;

    const data = await query<SubGroup>(
      dataSql, 
      [...params, validatedLimit, offset]
    );

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
    console.error('Error in getSubGroups:', error);
    throw new Error('Erreur lors de la récupération des sous-groupes');
  }
}

// ==================== FONCTION PRINCIPALE CORRIGÉE ====================

export async function getSubGroupById(id: number, options: { 
  with_relations?: boolean;
  relations?: {
    with_group?: boolean;
    with_phase?: boolean;
    with_edition?: boolean;
    with_competition?: boolean;
    with_fighters?: boolean;
    with_regions?: boolean;
    with_belts?: boolean;
    with_referee?: boolean;
    with_matches?: boolean;
    with_edition_fighters?: boolean;
    with_edition_regions?: boolean;
  };
  is_active?: boolean;
} = {}) {
  try {
    const { 
      with_relations = true,
      relations = {},
      is_active 
    } = options;
    
    // Extraire les relations avec des valeurs par défaut
    const {
      with_group = true,
      with_phase = true,
      with_edition = true,
      with_competition = true,
      with_regions = true,
      with_belts = true, 
      with_referee = true,
      with_matches = true,
      with_edition_fighters = true,
      with_edition_regions = true
    } = relations;
    
    const params: any[] = [id];
    let whereClause = 'WHERE sg.id = $1';
    
    // Ajouter le filtre is_active si spécifié
    if (typeof is_active === 'boolean') {
      params.push(is_active);
      whereClause += ` AND sg.is_active = $${params.length}`;
    }

    // Si with_relations est false, retourner seulement les données de base
    if (!with_relations) {
      const sql = `SELECT * FROM sub_groups sg ${whereClause}`;
      const result = await queryOne<SubGroup>(sql, params);
      
      if (!result) {
        throw new Error('Sous-groupe non trouvé');
      }
      
      return result;
    }

    // Construire la requête complète avec toutes les relations
    const selectFields = ['sg.*']; // NOUVEAU: tous les champs du sous-groupe incluent les nouveaux
    const joins: string[] = [];

    // 1. Groupe avec arbre hiérarchique complet
    if (with_group) {
      const hierarchyJoins = [];
      hierarchyJoins.push('LEFT JOIN phase_groups pg ON sg.group_id = pg.id');
      
      if (with_phase) {
        hierarchyJoins.push('LEFT JOIN phases p ON pg.phase_id = p.id');
        
        if (with_edition) {
          hierarchyJoins.push('LEFT JOIN competition_editions ce ON p.edition_id = ce.id');
          
          if (with_competition) {
            hierarchyJoins.push('LEFT JOIN competitions c ON ce.competition_id = c.id');
          }
        }
      }
      
      joins.push(...hierarchyJoins);
      
      selectFields.push(`
        JSON_BUILD_OBJECT(
          'id', pg.id,
          'name', pg.name,
          'group_order', pg.group_order,
          'description', pg.description,
          'date', pg.date, -- NOUVEAU: date du groupe de phase
          'is_completed', pg.is_completed,
          'is_active', pg.is_active,
          'phase', ${with_phase ? `
            JSON_BUILD_OBJECT(
              'id', p.id,
              'name', p.name,
              'phase_order', p.phase_order,
              'phase_type', p.phase_type,
              'description', p.description,
              'is_completed', p.is_completed,
              'is_active', p.is_active,
              'edition', ${with_edition ? `
                JSON_BUILD_OBJECT(
                  'id', ce.id,
                  'edition_number', ce.edition_number,
                  'year', ce.year,
                  'theme', ce.theme,
                  'start_date', ce.start_date,
                  'end_date', ce.end_date,
                  'total_participants', ce.total_participants,
                  'prize_pool', ce.prize_pool,
                  'is_active', ce.is_active,
                  'competition', ${with_competition ? `
                    JSON_BUILD_OBJECT(
                      'id', c.id,
                      'name', c.name,
                      'slug', c.slug,
                      'description', c.description,
                      'status', c.status,
                      'featured_image', c.featured_image,
                      'is_active', c.is_active
                    )
                  ` : 'NULL'}
                )
              ` : 'NULL'}
            )
          ` : 'NULL'}
        ) as group
      `);
    }

    // 2. Régions du sous-groupe
    if (with_regions) {
      joins.push('LEFT JOIN regions r1 ON sg.region1_id = r1.id');
      joins.push('LEFT JOIN regions r2 ON sg.region2_id = r2.id');
      
      selectFields.push(`
        CASE WHEN r1.id IS NOT NULL THEN
          JSON_BUILD_OBJECT(
            'id', r1.id,
            'name', r1.name,
            'code', r1.code,
            'description', r1.description,
            'flag_image', r1.flag_image,
            'stadium_name', r1.stadium_name,
            'stadium_image', r1.stadium_image,
            'color', r1.color,
            'total_fighters', r1.total_fighters,
            'total_champions', r1.total_champions,
            'created_at', r1.created_at
          )
        ELSE NULL END as region1,
        CASE WHEN r2.id IS NOT NULL THEN
          JSON_BUILD_OBJECT(
            'id', r2.id,
            'name', r2.name,
            'code', r2.code,
            'description', r2.description,
            'flag_image', r2.flag_image,
            'stadium_name', r2.stadium_name,
            'stadium_image', r2.stadium_image,
            'color', r2.color,
            'total_fighters', r2.total_fighters,
            'total_champions', r2.total_champions,
            'created_at', r2.created_at
          )
        ELSE NULL END as region2
      `);
    }

    // 3. Ceintures
    if (with_belts) {
      joins.push('LEFT JOIN belt b1 ON sg.belt_region1 = b1.id');
      joins.push('LEFT JOIN belt b2 ON sg.belt_region2 = b2.id');
      
      selectFields.push(`
        CASE WHEN b1.id IS NOT NULL THEN
          JSON_BUILD_OBJECT(
            'id', b1.id,
            'color', b1.color,
            'is_active', b1.is_active,
            'created_at', b1.created_at
          )
        ELSE NULL END as belt1,
        CASE WHEN b2.id IS NOT NULL THEN
          JSON_BUILD_OBJECT(
            'id', b2.id,
            'color', b2.color,
            'is_active', b2.is_active,
            'created_at', b2.created_at
          )
        ELSE NULL END as belt2
      `);
    }

    // 4. Arbitre principal avec sa région
    if (with_referee) {
      joins.push('LEFT JOIN referees ref ON sg.main_referee_id = ref.id');
      joins.push('LEFT JOIN regions ref_r ON ref.region_id = ref_r.id');
      
      selectFields.push(`
        CASE WHEN ref.id IS NOT NULL THEN
          JSON_BUILD_OBJECT(
            'id', ref.id,
            'first_name', ref.first_name,
            'last_name', ref.last_name,
            'nickname', ref.nickname,
            'profile_image', ref.profile_image,
            'license_number', ref.license_number,
            'certification_level', ref.certification_level,
            'experience_years', ref.experience_years,
            'birth_date', ref.birth_date,
            'region_id', ref.region_id,
            'is_active', ref.is_active,
            'social_links', ref.social_links,
            'created_at', ref.created_at,
            'updated_at', ref.updated_at,
            'region', CASE WHEN ref_r.id IS NOT NULL THEN
              JSON_BUILD_OBJECT(
                'id', ref_r.id,
                'name', ref_r.name,
                'code', ref_r.code,
                'flag_image', ref_r.flag_image,
                'color', ref_r.color,
                'stadium_name', ref_r.stadium_name,
                'stadium_image', ref_r.stadium_image
              )
            ELSE NULL END
          )
        ELSE NULL END as main_referee
      `);
    }

    // 5. Matchs avec toutes leurs relations
    if (with_matches) {
      const isActiveFlag = typeof is_active === 'boolean' ? is_active : true;
      
      selectFields.push(`
        COALESCE(
          (SELECT JSON_AGG(
            JSON_BUILD_OBJECT(
              'id', m.id,
              'match_number', m.match_number,
              'match_date', m.match_date,
              'start_time', m.start_time,
              'end_time', m.end_time,
              'status', m.status,
              'match_result', m.match_result,
              'fighter1_id', m.fighter1_id,
              'fighter2_id', m.fighter2_id,
              'winner_fighter_id', m.winner_fighter_id,
              'loser_fighter_id', m.loser_fighter_id,
              'total_duration', m.total_duration,
              'break_count', m.break_count,
              'audience_count', m.audience_count,
              'video_url', m.video_url,
              'live_stream_url', m.live_stream_url,
              'notes', m.notes,
              'is_active', m.is_active,
              'created_at', m.created_at,
              'updated_at', m.updated_at,
              'fighter1', CASE WHEN f1.id IS NOT NULL THEN
                JSON_BUILD_OBJECT(
                  'id', f1.id,
                  'first_name', f1.first_name,
                  'last_name', f1.last_name,
                  'nickname', f1.nickname,
                  'slug', f1.slug,
                  'ranking', f1.ranking,
                  'profile_image', f1.profile_image,
                  'is_active', f1.is_active,
                  'is_champion', f1.is_champion,
                  'region', CASE WHEN f1_r.id IS NOT NULL THEN
                    JSON_BUILD_OBJECT(
                      'id', f1_r.id,
                      'name', f1_r.name,
                      'code', f1_r.code,
                      'flag_image', f1_r.flag_image,
                      'color', f1_r.color
                    )
                  ELSE NULL END
                )
              ELSE NULL END,
              'fighter2', CASE WHEN f2.id IS NOT NULL THEN
                JSON_BUILD_OBJECT(
                  'id', f2.id,
                  'first_name', f2.first_name,
                  'last_name', f2.last_name,
                  'nickname', f2.nickname,
                  'slug', f2.slug,
                  'ranking', f2.ranking,
                  'profile_image', f2.profile_image,
                  'is_active', f2.is_active,
                  'is_champion', f2.is_champion,
                  'region', CASE WHEN f2_r.id IS NOT NULL THEN
                    JSON_BUILD_OBJECT(
                      'id', f2_r.id,
                      'name', f2_r.name,
                      'code', f2_r.code,
                      'flag_image', f2_r.flag_image,
                      'color', f2_r.color
                    )
                  ELSE NULL END
                )
              ELSE NULL END,
              'winner_fighter', CASE WHEN wf.id IS NOT NULL THEN
                JSON_BUILD_OBJECT(
                  'id', wf.id,
                  'first_name', wf.first_name,
                  'last_name', wf.last_name,
                  'nickname', wf.nickname,
                  'profile_image', wf.profile_image,
                  'region', CASE WHEN wf_r.id IS NOT NULL THEN
                    JSON_BUILD_OBJECT(
                      'id', wf_r.id,
                      'name', wf_r.name,
                      'code', wf_r.code,
                      'flag_image', wf_r.flag_image,
                      'color', wf_r.color
                    )
                  ELSE NULL END
                )
              ELSE NULL END,
              'loser_fighter', CASE WHEN lf.id IS NOT NULL THEN
                JSON_BUILD_OBJECT(
                  'id', lf.id,
                  'first_name', lf.first_name,
                  'last_name', lf.last_name,
                  'nickname', lf.nickname,
                  'profile_image', lf.profile_image,
                  'region', CASE WHEN lf_r.id IS NOT NULL THEN
                    JSON_BUILD_OBJECT(
                      'id', lf_r.id,
                      'name', lf_r.name,
                      'code', lf_r.code,
                      'flag_image', lf_r.flag_image,
                      'color', lf_r.color
                    )
                  ELSE NULL END
                )
              ELSE NULL END
            ) ORDER BY m.match_number, m.match_date
          ) FROM matches m
          LEFT JOIN fighters f1 ON m.fighter1_id = f1.id
          LEFT JOIN regions f1_r ON f1.region_id = f1_r.id
          LEFT JOIN fighters f2 ON m.fighter2_id = f2.id
          LEFT JOIN regions f2_r ON f2.region_id = f2_r.id
          LEFT JOIN fighters wf ON m.winner_fighter_id = wf.id
          LEFT JOIN regions wf_r ON wf.region_id = wf_r.id
          LEFT JOIN fighters lf ON m.loser_fighter_id = lf.id
          LEFT JOIN regions lf_r ON lf.region_id = lf_r.id
          WHERE m.sub_group_id = sg.id
            AND (${isActiveFlag} IS FALSE OR m.is_active = true)
          ),
          '[]'::json
        ) as matches
      `);
    }

    // Construire la requête finale
    const sql = `
      SELECT ${selectFields.join(', ')}
      FROM sub_groups sg
      ${joins.join(' ')}
      ${whereClause}
    `;

    const result = await queryOne<SubGroup>(sql, params);
    
    if (!result) {
      throw new Error('Sous-groupe non trouvé');
    }
    
    // Récupérer les données de l'édition séparément en utilisant les méthodes existantes
    if (with_edition_fighters || with_edition_regions) {
      // Récupérer l'ID de l'édition depuis le résultat
      const editionId = result.group?.phase?.edition?.id;
      
      if (editionId) {
        // Récupérer les lutteurs de l'édition
        if (with_edition_fighters) {
          try {
            const fightersResponse = await getEditionFighters(editionId, {
              limit: 100,
              status: 'qualified',
              with_fighter: true,
              with_region: true,
              sort_by: 'ranking',
              sort_order: 'desc'
            });
            
            result.edition_fighters = fightersResponse.data;
          } catch (error) {
            console.error('Error fetching edition fighters:', error);
            result.edition_fighters = [];
          }
        }
        
        // Récupérer les régions de l'édition
        if (with_edition_regions) {
          try {
            const regionsResponse = await getEditionRegions(editionId, {
              status: 'approved',
              with_region: true,
              sort_by: 'name',
              sort_order: 'asc'
            });
            
            result.edition_regions = regionsResponse.data;
          } catch (error) {
            console.error('Error fetching edition regions:', error);
            result.edition_regions = [];
          }
        }
        
        // Optionnel : Filtrer les lutteurs par région si des régions sont spécifiées dans le sous-groupe
        if (result.edition_fighters && result.edition_fighters.length > 0) {
          if (result.region1?.id) {
            const region1Fighters = result.edition_fighters.filter((ef: any) => 
              ef.fighter?.region_id === result.region1?.id
            );
            // Ensure region1 is a full Region object before adding fighters
            if (!result.region1) {
              result.region1 = {
                id: 0,
                name: '',
                code: '',
                created_at: new Date().toISOString()
              } as Region;
            }
            (result.region1 as any).fighters = region1Fighters.map((ef: any) => ef.fighter);
          }
          
          if (result.region2?.id) {
            const region2Fighters = result.edition_fighters.filter((ef: any) => 
              ef.fighter?.region_id === result.region2?.id
            );
            // Ensure region2 is a full Region object before adding fighters
            if (!result.region2) {
              result.region2 = {
                id: 0,
                name: '',
                code: '',
                created_at: new Date().toISOString()
              } as Region;
            }
            (result.region2 as any).fighters = region2Fighters.map((ef: any) => ef.fighter);
          }
        }
      }
    }
    
    return result;
  } catch (error) {
    console.error('Error in getSubGroupById:', error);
    throw error;
  }
}

// actions/sub-groups.ts - AJOUTER CETTE FONCTION

/**
 * 🏁 Terminer manuellement un sous-groupe (admin)
 */
export async function completeSubGroup(subGroupId: number) {
  try {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // 1️⃣ Vérifier que TOUS les matchs sont completed
      const checkRes = await client.query(
        `SELECT 
           COUNT(*) as total,
           COUNT(*) FILTER (WHERE status = 'completed') as completed
         FROM matches
         WHERE sub_group_id = $1 AND is_active = true`,
        [subGroupId]
      );
      
      const { total, completed } = checkRes.rows[0];
      
      if (total === 0) {
        throw new Error("Ce sous-groupe n'a aucun match");
      }
      
      if (completed !== total) {
        throw new Error(
          `Impossible de terminer : ${completed}/${total} matchs terminés`
        );
      }
      
      // 2️⃣ Marquer comme terminé
      await client.query(
        `UPDATE sub_groups
         SET status = 'completed',
             is_completed = true
         WHERE id = $1`,
        [subGroupId]
      );
      
      await client.query('COMMIT');
      
      // Revalidation
      revalidatePath(`/ad/sub-groups/${subGroupId}`);
      revalidatePath(`/ad/sub-groups/${subGroupId}/organisation`);
      
      return {
        success: true,
        message: "Sous-groupe marqué comme terminé avec succès"
      };
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('❌ Error in completeSubGroup:', error);
    throw new Error('Erreur lors de la finalisation du sous-groupe');
  }
}

/**
 * Récupère les lutteurs d'une édition avec leurs détails
 */
async function getEditionFightersDetailed(editionId: number): Promise<any[]> {
  try {
    const sql = `
      SELECT 
        ef.id,
        ef.edition_id,
        ef.fighter_id,
        ef.status,
        ef.registration_date,
        ef.created_at,
        
        -- Détails du lutteur
        JSON_BUILD_OBJECT(
          'id', f.id,
          'first_name', f.first_name,
          'last_name', f.last_name,
          'nickname', f.nickname,
          'slug', f.slug,
          'birth_date', f.birth_date,
          'birth_place', f.birth_place,
          'region_id', f.region_id,
          'height', f.height,
          'weight', f.weight,
          'profile_image', f.profile_image,
          'cover_image', f.cover_image,
          'bio', f.bio,
          'fighting_style', f.fighting_style,
          'debut_year', f.debut_year,
          'ranking', f.ranking,
          'is_active', f.is_active,
          'is_champion', f.is_champion,
          'social_links', f.social_links,
          'created_at', f.created_at,
          'updated_at', f.updated_at,
          
          -- Région du lutteur
          'region', CASE 
            WHEN r.id IS NOT NULL THEN
              JSON_BUILD_OBJECT(
                'id', r.id,
                'name', r.name,
                'code', r.code,
                'flag_image', r.flag_image,
                'color', r.color,
                'stadium_name', r.stadium_name,
                'stadium_image', r.stadium_image
              )
            ELSE NULL
          END
        ) as fighter,
        
        -- Région d'inscription à l'édition
        CASE 
          WHEN er.region_id IS NOT NULL THEN
            JSON_BUILD_OBJECT(
              'id', er.region_id,
              'name', er_region.name,
              'code', er_region.code,
              'flag_image', er_region.flag_image
            )
          ELSE NULL
        END as edition_region
        
      FROM edition_fighters ef
      JOIN fighters f ON ef.fighter_id = f.id
      LEFT JOIN regions r ON f.region_id = r.id
      LEFT JOIN edition_regions er ON ef.edition_id = er.edition_id AND f.region_id = er.region_id
      LEFT JOIN regions er_region ON er.region_id = er_region.id
      WHERE ef.edition_id = $1
        AND ef.status = 'qualified'
        AND f.is_active = true
      ORDER BY f.ranking DESC NULLS LAST, f.last_name, f.first_name
    `;
    
    const result = await query<any>(sql, [editionId]);
    
    // Formater les résultats
    return result.map((row: any) => ({
      id: row.id,
      edition_id: row.edition_id,
      fighter_id: row.fighter_id,
      status: row.status,
      registration_date: row.registration_date,
      created_at: row.created_at,
      fighter: row.fighter ? {
        ...row.fighter,
        region: row.fighter.region || null
      } : null,
      edition_region: row.edition_region
    }));
  } catch (error) {
    console.error('Error in getEditionFightersDetailed:', error);
    return [];
  }
}

/**
 * Récupère les régions d'une édition avec leurs détails
 */
async function getEditionRegionsDetailed(editionId: number): Promise<any[]> {
  try {
    const sql = `
      SELECT 
        er.id,
        er.edition_id,
        er.region_id,
        er.status,
        er.registration_date,
        er.created_at,
        
        -- Détails de la région
        JSON_BUILD_OBJECT(
          'id', r.id,
          'name', r.name,
          'code', r.code,
          'description', r.description,
          'flag_image', r.flag_image,
          'stadium_name', r.stadium_name,
          'stadium_image', r.stadium_image,
          'color', r.color,
          'total_fighters', r.total_fighters,
          'total_champions', r.total_champions,
          'created_at', r.created_at
        ) as region,
        
        -- Compétition de l'édition
        ce.competition_id
        
      FROM edition_regions er
      JOIN regions r ON er.region_id = r.id
      JOIN competition_editions ce ON er.edition_id = ce.id
      WHERE er.edition_id = $1
        AND er.status = 'approved'
      ORDER BY r.name
    `;
    
    const result = await query<any>(sql, [editionId]);
    
    // Formater les résultats
    return result.map((row: any) => ({
      id: row.id,
      edition_id: row.edition_id,
      region_id: row.region_id,
      status: row.status,
      registration_date: row.registration_date,
      created_at: row.created_at,
      region: row.region,
      competition_id: row.competition_id
    }));
  } catch (error) {
    console.error('Error in getEditionRegionsDetailed:', error);
    return [];
  }
}

/**
 * Groupe les lutteurs par région
 */
function groupFightersByRegion(editionFighters: any[]): Map<number, any[]> {
  const map = new Map<number, any[]>();
  
  for (const ef of editionFighters) {
    if (!ef.fighter || !ef.fighter.region_id) continue;
    
    const regionId = ef.fighter.region_id;
    
    if (!map.has(regionId)) {
      map.set(regionId, []);
    }
    
    map.get(regionId)!.push({
      ...ef.fighter,
      edition_status: ef.status,
      registration_date: ef.registration_date
    });
  }
  
  return map;
}

// ==================== FONCTION POUR LA PAGE D'ORGANISATION ====================

// export async function getSubGroupOrganisationData(id: number) {
//   try {
//     // Récupérer le sous-groupe avec tout son arbre hiérarchique
//     const subGroup = await getSubGroupById(id, {
//       with_relations: true,
//       relations: {
//         with_group: true,
//         with_phase: true,
//         with_edition: true,
//         with_regions: true,
//         with_fighters: false, // On veut les lutteurs pour les régions du sous-groupe
//         with_belts: true,
//         with_referee: true,
//         with_matches: true,
//         with_edition_regions: true,
//         with_edition_fighters: true
//       }
//     });
    
//     if (!subGroup) {
//       throw new Error('Sous-groupe non trouvé');
//     }
    
//     // Structure hiérarchique attendue
//     const structuredData = {
//       // Le sous-groupe de base
//       subGroup: {
//         ...subGroup,
//         // Ajouter l'arbre hiérarchique explicite
//         group: subGroup.phase_group,
//         phase: subGroup.phase,
//         edition: subGroup.edition
//       },
      
//       // Données additionnelles pour la page d'organisation
//       organisation: {
//         // Arbre hiérarchique complet
//         hierarchy: {
//           sub_group: {
//             id: subGroup.id,
//             name: subGroup.name,
//             order: subGroup.sub_group_order
//           },
//           group: subGroup.phase_group,
//           phase: subGroup.phase,
//           edition: subGroup.edition
//         },
        
//         // Données de l'édition
//         edition_data: {
//           fighters: subGroup.edition_fighters || [],
//           regions: subGroup.edition_regions || []
//         },
        
//         // Régions spécifiques du sous-groupe avec leurs lutteurs
//         assigned_regions: {
//           region1: subGroup.region1 ? {
//             ...subGroup.region1,
//             fighters: subGroup.region1.edition_fighters || []
//           } : null,
//           region2: subGroup.region2 ? {
//             ...subGroup.region2,
//             fighters: subGroup.region2.edition_fighters || []
//           } : null
//         },
        
//         // Matchs du sous-groupe
//         matches: subGroup.matches || []
//       }
//     };
    
//     return structuredData;
//   } catch (error) {
//     console.error('Error in getSubGroupOrganisationData:', error);
//     throw new Error('Erreur lors du chargement des données d\'organisation');
//   }
// }


// ==================== API ENDPOINTS SIMULÉS POUR LA PAGE ====================

/**
 * Endpoint API pour la page d'organisation
 * À appeler depuis le client avec fetch('/api/sub-groups/[id]/organisation')
 */
// export async function getSubGroupOrganisationApi(id: number) {
//   try {
//     const data = await getSubGroupOrganisationData(id);
//     return {
//       success: true,
//       data
//     };
//   } catch (error: any) {
//     console.error('API Error:', error);
//     return {
//       success: false,
//       error: error.message || 'Erreur serveur'
//     };
//   }
// }



export async function createSubGroup(formData: FormData) {
  try {
    const rawData = {
      group_id: formData.get('group_id'),
      name: formData.get('name'),
      sub_group_order: formData.get('sub_group_order'),
      description: formData.get('description'),
      period: formData.get('period'),
      score_region1: formData.get('score_region1'),
      score_region2: formData.get('score_region2'),
      nulls: formData.get('nulls'),
      status: formData.get('status'),
      region1_id: formData.get('region1_id'),
      region2_id: formData.get('region2_id'),
      belt_region1: formData.get('belt_region1'),
      belt_region2: formData.get('belt_region2'),
      main_referee_id: formData.get('main_referee_id'),
      is_completed: formData.get('is_completed'),
      is_active: formData.get('is_active'),
    };

    const cleanedData = {
      group_id: Number(rawData.group_id),
      name: rawData.name as string,
      sub_group_order: rawData.sub_group_order ? Number(rawData.sub_group_order) : undefined,
      description: rawData.description as string || undefined,
      period: (rawData.period as 'matin' | 'soir') || 'matin',
      score_region1: rawData.score_region1 ? Number(rawData.score_region1) : undefined,
      score_region2: rawData.score_region2 ? Number(rawData.score_region2) : undefined,
      nulls: rawData.nulls ? Number(rawData.nulls) : undefined,
      status: (rawData.status as 'upcoming' | 'ongoing' | 'completed' | 'cancelled' | 'postponed') || 'upcoming',
      region1_id: rawData.region1_id ? Number(rawData.region1_id) : undefined,
      region2_id: rawData.region2_id ? Number(rawData.region2_id) : undefined,
      belt_region1: rawData.belt_region1 ? Number(rawData.belt_region1) : undefined,
      belt_region2: rawData.belt_region2 ? Number(rawData.belt_region2) : undefined,
      main_referee_id: rawData.main_referee_id ? Number(rawData.main_referee_id) : undefined,
      is_completed: rawData.is_completed === 'true',
      is_active: rawData.is_active === 'true',
    };

    // Validate with schema
    const validatedData = subGroupSchema.parse(cleanedData);

    // Vérifier et ajuster le nom si nécessaire
    let finalName = validatedData.name;
    let nameCounter = 1;
    
    const existingNameCheck = await query<{ id: number }>(
      `SELECT id FROM sub_groups WHERE name = $1 AND group_id = $2`,
      [finalName, validatedData.group_id]
    );
    
    while (existingNameCheck.length > 0) {
      finalName = `${validatedData.name} (${nameCounter})`;
      nameCounter++;
      
      const newCheck = await query<{ id: number }>(
        `SELECT id FROM sub_groups WHERE name = $1 AND group_id = $2`,
        [finalName, validatedData.group_id]
      );
      
      if (newCheck.length === 0) {
        break;
      }
    }

    // Déterminer l'ordre du sous-groupe
    let finalOrder = validatedData.sub_group_order;
    
    if (finalOrder === undefined || finalOrder === null) {
      // Récupérer le plus grand ordre existant pour ce groupe
      const maxOrderResult = await query<{ max_order: number }>(
        `SELECT COALESCE(MAX(sub_group_order), 0) as max_order 
         FROM sub_groups WHERE group_id = $1`,
        [validatedData.group_id]
      );
      
      finalOrder = maxOrderResult[0]?.max_order + 1 || 1;
    } else {
      // Vérifier si l'ordre existe déjà
      const existingOrderCheck = await query<{ id: number }>(
        `SELECT id FROM sub_groups WHERE sub_group_order = $1 AND group_id = $2`,
        [finalOrder, validatedData.group_id]
      );
      
      if (existingOrderCheck.length > 0) {
        // Trouver le prochain ordre disponible
        const ordersResult = await query<{ sub_group_order: number }>(
          `SELECT sub_group_order FROM sub_groups 
           WHERE group_id = $1 
           ORDER BY sub_group_order`,
          [validatedData.group_id]
        );
        
        const existingOrders = ordersResult.map(r => r.sub_group_order);
        let nextOrder = finalOrder;
        
        while (existingOrders.includes(nextOrder)) {
          nextOrder++;
        }
        
        finalOrder = nextOrder;
      }
    }

    const sql = `
      INSERT INTO sub_groups (
        group_id, name, sub_group_order, description, period,
        score_region1, score_region2, nulls, status,
        region1_id, region2_id, belt_region1, belt_region2, 
        main_referee_id, is_completed, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING id
    `;
    
    const result = await query<{ id: number }>(sql, [
      validatedData.group_id,
      finalName,
      finalOrder,
      validatedData.description || null,
      validatedData.period,
      validatedData.score_region1 || null,
      validatedData.score_region2 || null,
      validatedData.nulls || null,
      validatedData.status,
      validatedData.region1_id || null,
      validatedData.region2_id || null,
      validatedData.belt_region1 || null,
      validatedData.belt_region2 || null,
      validatedData.main_referee_id || null,
      validatedData.is_completed,
      validatedData.is_active,
    ]);

    revalidatePath('/ad/phase-groups');
    revalidatePath(`/ad/phase-groups/${validatedData.group_id}`);
    
    return { 
      success: true, 
      id: result[0].id,
      message: `Sous-groupe "${finalName}" créé avec succès (ordre: ${finalOrder})`
    };
  } catch (error) {
    console.error('Error in createSubGroup:', error);
    throw new Error('Erreur lors de la création du sous-groupe');
  }
}

export async function updateSubGroup(id: number, formData: FormData) {
  try {
    const existing = await getSubGroupById(id, { with_relations: false });
    if (!existing) {
      throw new Error('Sous-groupe non trouvé');
    }

    const rawData = {
      group_id: formData.get('group_id'),
      name: formData.get('name'),
      sub_group_order: formData.get('sub_group_order'),
      description: formData.get('description'),
      period: formData.get('period'),
      score_region1: formData.get('score_region1'),
      score_region2: formData.get('score_region2'),
      nulls: formData.get('nulls'),
      status: formData.get('status'),
      region1_id: formData.get('region1_id'),
      region2_id: formData.get('region2_id'),
      belt_region1: formData.get('belt_region1'),
      belt_region2: formData.get('belt_region2'),
      main_referee_id: formData.get('main_referee_id'),
      is_completed: formData.get('is_completed'),
      is_active: formData.get('is_active'),
    };

    const cleanedData = {
      group_id: Number(rawData.group_id),
      name: rawData.name as string,
      sub_group_order: Number(rawData.sub_group_order),
      description: rawData.description as string || undefined,
      period: (rawData.period as 'matin' | 'soir') || 'matin',
      score_region1: rawData.score_region1 ? Number(rawData.score_region1) : undefined,
      score_region2: rawData.score_region2 ? Number(rawData.score_region2) : undefined,
      nulls: rawData.nulls ? Number(rawData.nulls) : undefined,
      status: (rawData.status as 'upcoming' | 'ongoing' | 'completed' | 'cancelled' | 'postponed') || 'upcoming',
      region1_id: rawData.region1_id ? Number(rawData.region1_id) : undefined,
      region2_id: rawData.region2_id ? Number(rawData.region2_id) : undefined,
      belt_region1: rawData.belt_region1 ? Number(rawData.belt_region1) : undefined,
      belt_region2: rawData.belt_region2 ? Number(rawData.belt_region2) : undefined,
      main_referee_id: rawData.main_referee_id ? Number(rawData.main_referee_id) : undefined,
      is_completed: rawData.is_completed === 'true',
      is_active: rawData.is_active === 'true',
    };

    const validatedData = subGroupSchema.parse(cleanedData);

    const sql = `
      UPDATE sub_groups 
      SET 
        group_id = $1, name = $2, sub_group_order = $3, description = $4, period = $5,
        score_region1 = $6, score_region2 = $7, nulls = $8, status = $9,
        region1_id = $10, region2_id = $11, belt_region1 = $12, belt_region2 = $13, 
        main_referee_id = $14, is_completed = $15, is_active = $16
      WHERE id = $17
    `;
    
    await query(sql, [
      validatedData.group_id,
      validatedData.name,
      validatedData.sub_group_order,
      validatedData.description || null,
      validatedData.period,
      validatedData.score_region1 || null,
      validatedData.score_region2 || null,
      validatedData.nulls || null,
      validatedData.status,
      validatedData.region1_id || null,
      validatedData.region2_id || null,
      validatedData.belt_region1 || null,
      validatedData.belt_region2 || null,
      validatedData.main_referee_id || null,
      validatedData.is_completed,
      validatedData.is_active,
      id,
    ]);

    revalidatePath('/phase-groups');
    revalidatePath(`/phase-groups/${validatedData.group_id}`);
    revalidatePath(`/sub-groups/${id}`);
    return { 
      success: true, 
      message: 'Sous-groupe modifié avec succès' 
    };
  } catch (error) {
    console.error('Error in updateSubGroup:', error);
    throw error;
  }
}

export async function deleteSubGroup(id: number) {
  try {
    const existing = await getSubGroupById(id, { with_relations: false });
    if (!existing) {
      throw new Error('Sous-groupe non trouvé');
    }

    // Vérifier les données liées
    const relatedData = await query(`
      SELECT COUNT(*) as match_count FROM matches WHERE sub_group_id = $1
    `, [id]);

    const matchCount = parseInt(relatedData[0]?.match_count ?? '0');
    if (matchCount > 0) {
      throw new Error(
        `Impossible de supprimer ce sous-groupe car il contient ${matchCount} match(s)`
      );
    }

    const sql = 'DELETE FROM sub_groups WHERE id = $1';
    await query(sql, [id]);
    
    revalidatePath('/phase-groups');
    revalidatePath(`/phase-groups/${existing.group_id}`);
    return { 
      success: true, 
      message: 'Sous-groupe supprimé avec succès' 
    };
  } catch (error) {
    console.error('Error in deleteSubGroup:', error);
    throw new Error('Erreur lors de la suppression du sous-groupe');
  }
}

export async function assignBeltsToSubGroup(
  subGroupId: number,
  belt_region1?: number,
  belt_region2?: number
) {
  try {
    const existing = await getSubGroupById(subGroupId, { with_relations: false });
    if (!existing) {
      throw new Error('Sous-groupe non trouvé');
    }

    const sql = `
      UPDATE sub_groups 
      SET 
        belt_region1 = $1, belt_region2 = $2
      WHERE id = $3
    `;
    
    await query(sql, [
      belt_region1 || null,
      belt_region2 || null,
      subGroupId,
    ]);

    revalidatePath('/sub-groups');
    revalidatePath(`/sub-groups/${subGroupId}`);
    return { 
      success: true, 
      message: 'Ceintures assignées avec succès'
    };
  } catch (error) {
    console.error('Error in assignBeltsToSubGroup:', error);
    throw new Error('Erreur lors de l\'assignation des ceintures');
  }
}