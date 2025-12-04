'use server';

import { query, queryOne } from '@/lib/db/neon-client';
import { phaseGroupSchema, subGroupSchema } from '@/validation/schemas';
import { revalidatePath } from 'next/cache';
import { PhaseGroup, SubGroup, PaginatedResponse, PhaseGroupFilters } from '@/types';

export async function getPhaseGroups(
  filters: PhaseGroupFilters = {}
): Promise<PaginatedResponse<PhaseGroup>> {
  try {
    const {
      phase_id,
      search = '',
      page = 1,
      limit = 20,
      is_active,
      with_phase,
      with_subGroups = true,
      with_matches = true
    } = filters;

    let joinClause = '';
    let whereClause = 'WHERE 1=1';
    const params: any[] = [];
    const selectFields: string[] = ['pg.*'];

    // Filtres de base
    if (phase_id) {
      whereClause += ` AND pg.phase_id = $${params.length + 1}`;
      params.push(phase_id);
    }

    if (search) {
      whereClause += ` AND (pg.name ILIKE $${params.length + 1} OR pg.description ILIKE $${params.length + 2})`;
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm);
    }

    // Appliquer le filtre is_active sur phase_groups uniquement si is_active est true
    if (is_active === true) {
      whereClause += ` AND pg.is_active = TRUE`;
    }

    // Jointures et relations
    if (with_phase) {
      selectFields.push(`
        JSON_BUILD_OBJECT(
          'id', p.id,
          'name', p.name,
          'phase_type', p.phase_type,
          'phase_order', p.phase_order
        ) as phase
      `);
      joinClause += ` LEFT JOIN phases p ON pg.phase_id = p.id`;
    }

    if (with_subGroups) {
      // Construire la clause WHERE pour les sous-groupes en fonction de is_active
      const subGroupWhere = is_active === true ? 'AND sg.is_active = TRUE' : '';

      selectFields.push(`
        (SELECT JSON_AGG(
          JSON_BUILD_OBJECT(
            'id', sg.id,
            'name', sg.name,
            'sub_group_order', sg.sub_group_order,
            'description', sg.description,
            'region1_id', sg.region1_id,
            'region2_id', sg.region2_id,
            'belt_region1', sg.belt_region1,
            'belt_region2', sg.belt_region2,
            'main_referee_id', sg.main_referee_id,
            'is_completed', sg.is_completed,
            'is_active', sg.is_active,
            'region1', JSON_BUILD_OBJECT(
              'id', r1.id,
              'name', r1.name,
              'code', r1.code
            ),
            'region2', JSON_BUILD_OBJECT(
              'id', r2.id,
              'name', r2.name,
              'code', r2.code
            ),
            'belt1', JSON_BUILD_OBJECT(
              'id', b1.id,
              'color', b1.color
            ),
            'belt2', JSON_BUILD_OBJECT(
              'id', b2.id,
              'color', b2.color
            ),
            'main_referee', JSON_BUILD_OBJECT(
              'id', ref.id,
              'first_name', ref.first_name,
              'last_name', ref.last_name,
              'nickname', ref.nickname
            )
          ) ORDER BY sg.sub_group_order
        ) FROM sub_groups sg
        LEFT JOIN regions r1 ON sg.region1_id = r1.id
        LEFT JOIN regions r2 ON sg.region2_id = r2.id
        LEFT JOIN belt b1 ON sg.belt_region1 = b1.id
        LEFT JOIN belt b2 ON sg.belt_region2 = b2.id
        LEFT JOIN referees ref ON sg.main_referee_id = ref.id
        WHERE sg.group_id = pg.id ${subGroupWhere}) as sub_groups
      `);
    }

    if (with_matches) {
      // Construire la clause WHERE pour les matches en fonction de is_active
      const matchesWhere = is_active === true ? 'AND m.is_active = TRUE' : '';

      selectFields.push(`
        (SELECT JSON_AGG(
          JSON_BUILD_OBJECT(
            'id', m.id,
            'match_number', m.match_number,
            'match_date', m.match_date,
            'start_time', m.start_time,
            'end_time', m.end_time,
            'is_active', m.is_active,
            'fighter1_id', m.fighter1_id,
            'fighter2_id', m.fighter2_id,
            'winner_fighter_id', m.winner_fighter_id,
            'loser_fighter_id', m.loser_fighter_id,
            'match_result', m.match_result,
            'total_duration', m.total_duration,
            'break_count', m.break_count,
            'status', m.status,
            'audience_count', m.audience_count,
            'video_url', m.video_url,
            'live_stream_url', m.live_stream_url,
            'notes', m.notes
          ) ORDER BY m.match_number NULLS FIRST, m.match_date
        ) FROM matches m
        INNER JOIN sub_groups sg ON m.sub_group_id = sg.id
        WHERE sg.group_id = pg.id ${matchesWhere}) as matches
      `);
    }

    // Requête pour le total
    const countSql = `
      SELECT COUNT(*) as total
      FROM phase_groups pg
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
      FROM phase_groups pg
      ${joinClause}
      ${whereClause}
      ORDER BY pg.group_order ASC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;

    const data = await query<PhaseGroup>(
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
    console.error('Error in getPhaseGroups:', error);
    throw new Error('Erreur lors de la récupération des groupes de phase');
  }
}

export async function getPhaseGroupById(id: number, options: { 
  with_relations?: boolean;
  relations?: {
    with_phase?: boolean;
    with_edition?: boolean;
    with_subGroups?: boolean;
    with_matches?: boolean;
    with_fighters?: boolean;
    with_regions?: boolean;
    with_referees?: boolean;
    with_belts?: boolean;
  };
  is_active?: boolean;
} = {}) {
  try {
    const { 
      with_relations = true,
      relations = {
        with_phase: true,
        with_edition: true,
        with_subGroups: true,
        with_matches: true,
        with_fighters: true,
        with_regions: true,
        with_referees: true,
        with_belts: true
      },
      is_active
    } = options;
    
    // Extraire les relations avec des valeurs par défaut
    const {
      with_phase = true,
      with_edition = true,
      with_subGroups = true,
      with_matches = true,
      with_fighters = true,
      with_regions = true,
      with_referees = true,
      with_belts = true
    } = relations;
    
    const params: any[] = [id];
    let whereClause = 'WHERE pg.id = $1';
    
    // Ajouter le filtre is_active si spécifié
    if (typeof is_active === 'boolean') {
      params.push(is_active);
      whereClause += ` AND pg.is_active = $${params.length}`;
    }

    let sql = `SELECT * FROM phase_groups pg ${whereClause}`;

    if (with_relations) {
      const isActiveFlag = typeof is_active === 'boolean' ? is_active : true;
      
      // Fonction utilitaire pour générer les conditions is_active
      const generateActiveCondition = (tableAlias: string, fieldName: string = 'is_active') => {
        if (typeof is_active === 'boolean') {
          if (is_active === false) {
            // Si is_active est false, on récupère uniquement les éléments inactifs
            return ` AND ${tableAlias}.${fieldName} = false`;
          } else {
            // Si is_active est true, on récupère uniquement les éléments actifs
            return ` AND ${tableAlias}.${fieldName} = true`;
          }
        }
        // Si is_active n'est pas spécifié, on récupère tout sans condition
        return '';
      };
      
      sql = `
        SELECT 
          pg.*,
          ${with_phase ? `
          JSON_BUILD_OBJECT(
            'id', p.id,
            'name', p.name,
            'phase_type', p.phase_type,
            'phase_order', p.phase_order,
            'is_active', p.is_active,
            'is_completed', p.is_completed,
            'description', p.description,
            'start_date', p.start_date,
            'end_date', p.end_date,
            ${with_edition ? `
            'edition', JSON_BUILD_OBJECT(
              'id', ce.id,
              'edition_number', ce.edition_number,
              'year', ce.year,
              'theme', ce.theme,
              'start_date', ce.start_date,
              'end_date', ce.end_date,
              'is_active', ce.is_active,
              'total_participants', ce.total_participants,
              'prize_pool', ce.prize_pool,
              ${with_regions ? `
              'regions', COALESCE(
                (SELECT JSON_AGG(
                  JSON_BUILD_OBJECT(
                    'id', er.id,
                    'region_id', er.region_id,
                    'status', er.status,
                    'registration_date', er.registration_date,
                    'region', JSON_BUILD_OBJECT(
                      'id', r_ed.id,
                      'name', r_ed.name,
                      'code', r_ed.code,
                      'flag_image', r_ed.flag_image,
                      'color', r_ed.color,
                      'stadium_name', r_ed.stadium_name,
                      'stadium_image', r_ed.stadium_image,
                      'total_fighters', r_ed.total_fighters,
                      'total_champions', r_ed.total_champions
                    )
                  ) ORDER BY r_ed.name
                ) FROM edition_regions er
                JOIN regions r_ed ON er.region_id = r_ed.id
                WHERE er.edition_id = ce.id 
                  AND er.status = 'approved'
                  ${generateActiveCondition('r_ed', '')} -- Les régions n'ont pas is_active
                ),
                '[]'::json
              ),
              ` : `'regions', '[]'::json,`}
              ${with_fighters ? `
              'fighters', COALESCE(
                (SELECT JSON_AGG(
                  JSON_BUILD_OBJECT(
                    'id', ef.id,
                    'fighter_id', ef.fighter_id,
                    'region_id', ef.region_id,
                    'status', ef.status,
                    'registration_date', ef.registration_date,
                    'fighter', JSON_BUILD_OBJECT(
                      'id', f_ed.id,
                      'first_name', f_ed.first_name,
                      'last_name', f_ed.last_name,
                      'nickname', f_ed.nickname,
                      'profile_image', f_ed.profile_image,
                      'ranking', f_ed.ranking,
                      'is_active', f_ed.is_active,
                      'is_champion', f_ed.is_champion,
                      'birth_date', f_ed.birth_date,
                      'birth_place', f_ed.birth_place,
                      'height', f_ed.height,
                      'weight', f_ed.weight,
                      'fighting_style', f_ed.fighting_style,
                      'debut_year', f_ed.debut_year,
                      'region', CASE 
                        WHEN f_ed.region_id IS NOT NULL THEN
                          JSON_BUILD_OBJECT(
                            'id', r_f.id,
                            'name', r_f.name,
                            'code', r_f.code
                          )
                        ELSE NULL
                      END
                    )
                  ) ORDER BY f_ed.last_name, f_ed.first_name
                ) FROM edition_fighters ef
                JOIN fighters f_ed ON ef.fighter_id = f_ed.id
                LEFT JOIN regions r_f ON f_ed.region_id = r_f.id
                WHERE ef.edition_id = ce.id
                  AND ef.status IN ('registered', 'qualified')
                  ${generateActiveCondition('f_ed')}
                ),
                '[]'::json
              )
              ` : `'fighters', '[]'::json`}
            )
            ` : `'edition', JSON_BUILD_OBJECT('id', ce.id, 'edition_number', ce.edition_number, 'year', ce.year, 'is_active', ce.is_active)`}
          ) as phase,
          ` : `'phase', NULL,`}
          ${with_subGroups ? `
          COALESCE(
            (SELECT JSON_AGG(
              JSON_BUILD_OBJECT(
                'id', sg.id,
                'name', sg.name,
                'sub_group_order', sg.sub_group_order,
                'description', sg.description,
                'region1_id', sg.region1_id,
                'region2_id', sg.region2_id,
                'belt_region1', sg.belt_region1,
                'belt_region2', sg.belt_region2,
                'main_referee_id', sg.main_referee_id,
                'is_completed', sg.is_completed,
                'is_active', sg.is_active,
                ${with_regions ? `
                'region1', CASE 
                  WHEN sg.region1_id IS NOT NULL THEN
                    JSON_BUILD_OBJECT(
                      'id', r1.id,
                      'name', r1.name,
                      'code', r1.code,
                      'flag_image', r1.flag_image,
                      'color', r1.color,
                      'stadium_name', r1.stadium_name,
                      'stadium_image', r1.stadium_image
                    )
                  ELSE NULL
                END,
                'region2', CASE 
                  WHEN sg.region2_id IS NOT NULL THEN
                    JSON_BUILD_OBJECT(
                      'id', r2.id,
                      'name', r2.name,
                      'code', r2.code,
                      'flag_image', r2.flag_image,
                      'color', r2.color,
                      'stadium_name', r2.stadium_name,
                      'stadium_image', r2.stadium_image
                    )
                  ELSE NULL
                END,
                ` : `'region1', NULL, 'region2', NULL,`}
                ${with_belts ? `
                'belt1', CASE 
                  WHEN sg.belt_region1 IS NOT NULL THEN
                    JSON_BUILD_OBJECT(
                      'id', b1.id,
                      'color', b1.color,
                      'is_active', b1.is_active
                    )
                  ELSE NULL
                END,
                'belt2', CASE 
                  WHEN sg.belt_region2 IS NOT NULL THEN
                    JSON_BUILD_OBJECT(
                      'id', b2.id,
                      'color', b2.color,
                      'is_active', b2.is_active
                    )
                  ELSE NULL
                END,
                ` : `'belt1', NULL, 'belt2', NULL,`}
                ${with_referees ? `
                'main_referee', CASE 
                  WHEN sg.main_referee_id IS NOT NULL THEN
                    JSON_BUILD_OBJECT(
                      'id', ref.id,
                      'first_name', ref.first_name,
                      'last_name', ref.last_name,
                      'nickname', ref.nickname,
                      'profile_image', ref.profile_image,
                      'license_number', ref.license_number,
                      'certification_level', ref.certification_level,
                      'is_active', ref.is_active
                    )
                  ELSE NULL
                END,
                ` : `'main_referee', NULL,`}
                'matches_count', (
                  SELECT COUNT(*) FROM matches m 
                  WHERE m.sub_group_id = sg.id
                  ${generateActiveCondition('m')}
                ),
                ${with_matches ? `
                'matches', COALESCE(
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
                      ${with_fighters ? `
                      'fighter1', CASE 
                        WHEN m.fighter1_id IS NOT NULL THEN
                          JSON_BUILD_OBJECT(
                            'id', f1.id,
                            'first_name', f1.first_name,
                            'last_name', f1.last_name,
                            'nickname', f1.nickname,
                            'profile_image', f1.profile_image,
                            'ranking', f1.ranking,
                            'is_active', f1.is_active,
                            'is_champion', f1.is_champion
                          )
                        ELSE NULL
                      END,
                      'fighter2', CASE 
                        WHEN m.fighter2_id IS NOT NULL THEN
                          JSON_BUILD_OBJECT(
                            'id', f2.id,
                            'first_name', f2.first_name,
                            'last_name', f2.last_name,
                            'nickname', f2.nickname,
                            'profile_image', f2.profile_image,
                            'ranking', f2.ranking,
                            'is_active', f2.is_active,
                            'is_champion', f2.is_champion
                          )
                        ELSE NULL
                      END
                      ` : `'fighter1', NULL, 'fighter2', NULL`}
                    ) ORDER BY m.match_number NULLS FIRST, m.match_date
                  ) FROM matches m
                  ${with_fighters ? `
                    LEFT JOIN fighters f1 ON m.fighter1_id = f1.id
                    LEFT JOIN fighters f2 ON m.fighter2_id = f2.id
                  ` : ''}
                  WHERE m.sub_group_id = sg.id
                  ${generateActiveCondition('m')}
                  ),
                  '[]'::json
                )
                ` : `'matches', '[]'::json`}
              ) ORDER BY sg.sub_group_order
            ) FROM sub_groups sg
            ${with_regions ? `
              LEFT JOIN regions r1 ON sg.region1_id = r1.id
              LEFT JOIN regions r2 ON sg.region2_id = r2.id
            ` : ''}
            ${with_belts ? `
              LEFT JOIN belt b1 ON sg.belt_region1 = b1.id
              LEFT JOIN belt b2 ON sg.belt_region2 = b2.id
            ` : ''}
            ${with_referees ? `
              LEFT JOIN referees ref ON sg.main_referee_id = ref.id
            ` : ''}
            WHERE sg.group_id = pg.id
            ${generateActiveCondition('sg')}
            ),
            '[]'::json
          ) as sub_groups
          ` : `'[]'::json as sub_groups`}
        FROM phase_groups pg
        ${with_phase ? 'LEFT JOIN phases p ON pg.phase_id = p.id' : ''}
        ${with_phase && with_edition ? 'LEFT JOIN competition_editions ce ON p.edition_id = ce.id' : ''}
        ${whereClause}
      `;
    }

    const result = await queryOne<PhaseGroup>(sql, params);
    
    if (!result) {
      throw new Error('Groupe de phase non trouvé');
    }
    
    return result;
  } catch (error) {
    console.error('Error in getPhaseGroupById:', error);
    throw error;
  }
}

export async function createPhaseGroup(
  formData: FormData, 
  options: { create_sub_groups?: number } = { create_sub_groups: 0 }
) {
  try {
    const { create_sub_groups = 0 } = options;
    
    const rawData = {
      phase_id: formData.get('phase_id'),
      name: formData.get('name'),
      group_order: formData.get('group_order'),
      description: formData.get('description'),
    };

    const cleanedData = {
      phase_id: Number(rawData.phase_id),
      name: rawData.name as string,
      group_order: Number(rawData.group_order),
      description: rawData.description as string || undefined,
    };

    const validatedData = phaseGroupSchema.parse(cleanedData);

    // Commencer une transaction
    await query('BEGIN');

    try {
      // 1. Créer le groupe de phase
      const groupSql = `
        INSERT INTO phase_groups (phase_id, name, group_order, description)
        VALUES ($1, $2, $3, $4)
        RETURNING id
      `;
      
      const groupResult = await query<{ id: number }>(groupSql, [
        validatedData.phase_id,
        validatedData.name,
        validatedData.group_order,
        validatedData.description || null,
      ]);

      const groupId = groupResult[0].id;

      // 2. Créer automatiquement des sous-groupes si demandé
      if (create_sub_groups > 0) {
        for (let i = 1; i <= create_sub_groups; i++) {
          const subGroupSql = `
            INSERT INTO sub_groups (group_id, name, sub_group_order)
            VALUES ($1, $2, $3)
          `;
          await query(subGroupSql, [
            groupId,
            `Sous-groupe ${i}`,
            i
          ]);
        }
      }

      // Commit de la transaction
      await query('COMMIT');

      revalidatePath('/phases');
      revalidatePath(`/phases/${validatedData.phase_id}`);
      return { 
        success: true, 
        id: groupId,
        message: `Groupe de phase créé avec succès${create_sub_groups > 0 ? ` (${create_sub_groups} sous-groupe(s) créé(s))` : ''}`
      };

    } catch (error) {
      // Rollback en cas d'erreur
      await query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error in createPhaseGroup:', error);
    throw new Error('Erreur lors de la création du groupe de phase');
  }
}

export async function updatePhaseGroup(id: number, formData: FormData) {
  try {
    const existing = await getPhaseGroupById(id, { with_relations: false });
    if (!existing) {
      throw new Error('Groupe de phase non trouvé');
    }

    const rawData = {
      phase_id: formData.get('phase_id'),
      name: formData.get('name'),
      group_order: formData.get('group_order'),
      description: formData.get('description'),
    };

    const cleanedData = {
      phase_id: Number(rawData.phase_id),
      name: rawData.name as string,
      group_order: Number(rawData.group_order),
      description: rawData.description as string || undefined,
    };

    const validatedData = phaseGroupSchema.parse(cleanedData);

    const sql = `
      UPDATE phase_groups 
      SET 
        phase_id = $1, name = $2, group_order = $3, description = $4
      WHERE id = $5
    `;
    
    await query(sql, [
      validatedData.phase_id,
      validatedData.name,
      validatedData.group_order,
      validatedData.description || null,
      id,
    ]);

    revalidatePath('/phases');
    revalidatePath(`/phases/${validatedData.phase_id}`);
    revalidatePath(`/phase-groups/${id}`);
    return { 
      success: true, 
      message: 'Groupe de phase modifié avec succès' 
    };
  } catch (error) {
    console.error('Error in updatePhaseGroup:', error);
    throw error;
  }
}

export async function deletePhaseGroup(id: number) {
  try {
    const existing = await getPhaseGroupById(id, { with_relations: false });
    if (!existing) {
      throw new Error('Groupe de phase non trouvé');
    }

    // Vérifier les données liées
    const relatedData = await query(`
      SELECT COUNT(*) as sub_group_count FROM sub_groups WHERE group_id = $1
    `, [id]);

    const subGroupCount = parseInt(relatedData[0]?.sub_group_count ?? '0');
    if (subGroupCount > 0) {
      throw new Error(
        `Impossible de supprimer ce groupe car il contient ${subGroupCount} sous-groupe(s)`
      );
    }

    const sql = 'DELETE FROM phase_groups WHERE id = $1';
    await query(sql, [id]);
    
    revalidatePath('/phases');
    revalidatePath(`/phases/${existing.phase_id}`);
    return { 
      success: true, 
      message: 'Groupe de phase supprimé avec succès' 
    };
  } catch (error) {
    console.error('Error in deletePhaseGroup:', error);
    throw new Error('Erreur lors de la suppression du groupe de phase');
  }
}

export async function addSubGroupsToPhaseGroup(
  groupId: number, 
  count: number, 
  prefix: string = 'Sous-groupe'
) {
  try {
    const existing = await getPhaseGroupById(groupId, { with_relations: false });
    if (!existing) {
      throw new Error('Groupe de phase non trouvé');
    }

    // Commencer une transaction
    await query('BEGIN');

    try {
      // Récupérer le dernier ordre de sous-groupe
      const lastOrderResult = await query<{ max_order: number }>(`
        SELECT COALESCE(MAX(sub_group_order), 0) as max_order 
        FROM sub_groups 
        WHERE group_id = $1
      `, [groupId]);

      const lastOrder = lastOrderResult[0]?.max_order || 0;

      // Créer les sous-groupes
      for (let i = 1; i <= count; i++) {
        const subGroupSql = `
          INSERT INTO sub_groups (group_id, name, sub_group_order)
          VALUES ($1, $2, $3)
        `;
        await query(subGroupSql, [
          groupId,
          `${prefix} ${lastOrder + i}`,
          lastOrder + i
        ]);
      }

      // Commit de la transaction
      await query('COMMIT');

      revalidatePath('/phase-groups');
      revalidatePath(`/phase-groups/${groupId}`);
      return { 
        success: true, 
        message: `${count} sous-groupe(s) ajouté(s) au groupe avec succès`
      };

    } catch (error) {
      // Rollback en cas d'erreur
      await query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error in addSubGroupsToPhaseGroup:', error);
    throw new Error('Erreur lors de l\'ajout des sous-groupes');
  }
}