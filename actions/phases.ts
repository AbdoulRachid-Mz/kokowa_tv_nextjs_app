// @/actions/phases.ts - VERSION CORRIGÉE POUR NOUVELLE STRUCTURE
'use server';

import { query, queryOne } from '@/lib/db/neon-client';
import { phaseSchema } from '@/validation/schemas';
import { revalidatePath } from 'next/cache';
import { Phase, PaginatedResponse, PhaseFilters } from '@/types';


export async function getPhases(
  filters: PhaseFilters = {}
): Promise<PaginatedResponse<Phase>> {
  try {
    const {
      edition_id,
      search = '',
      page = 1,
      limit = 20,
      phase_type,
      is_active,
      with_edition,
      with_groups,
      with_subGroups,
      with_matches
    } = filters;

    const baseParams: any[] = [];
    let whereClause = 'WHERE 1=1';
    let joinClause = '';
    const selectFields: string[] = ['p.*'];

    // --- FILTRES DE BASE ---
    if (edition_id) {
      baseParams.push(edition_id);
      whereClause += ` AND p.edition_id = $${baseParams.length}`;
    }

    if (search) {
      baseParams.push(`%${search}%`, `%${search}%`);
      whereClause += ` AND (p.name ILIKE $${baseParams.length - 1} OR p.description ILIKE $${baseParams.length})`;
    }
    if (typeof is_active === 'boolean') {
      baseParams.push(is_active);
      whereClause += ` AND p.is_active = $${baseParams.length}`;
    }

    if (phase_type) {
      baseParams.push(phase_type);
      whereClause += ` AND p.phase_type = $${baseParams.length}`;
    }

    // --- JOINTURES ET RELATIONS ---
    if (with_edition) {
      joinClause += `
        LEFT JOIN competition_editions ce ON p.edition_id = ce.id
        LEFT JOIN competitions c ON ce.competition_id = c.id
      `;
      selectFields.push(`
        JSON_BUILD_OBJECT(
          'id', ce.id,
          'edition_number', ce.edition_number,
          'year', ce.year,
          'start_date', ce.start_date,
          'end_date', ce.end_date,
          'competition', JSON_BUILD_OBJECT(
            'id', c.id,
            'name', c.name,
            'slug', c.slug
          )
        ) as edition
      `);
    }

    // --- PARAMÈTRES POUR LA REQUÊTE DATA ---
    const dataParams = [...baseParams];

    // --- GROUPES, SOUS-GROUPES ET MATCHES ---
    if (with_groups) {
      // Ajouter les flags aux paramètres data seulement
      const isActiveFlag = typeof is_active === 'boolean' ? is_active : null;
      const subGroupsFlag = with_subGroups === true;
      const matchesFlag = with_matches === true;
      
      dataParams.push(isActiveFlag, subGroupsFlag, matchesFlag);
      
      // Calculer les index (ils seront à la fin du tableau dataParams)
      const isActiveIdx = dataParams.length - 2;
      const subGroupsIdx = dataParams.length - 1;
      const matchesIdx = dataParams.length;

      selectFields.push(`
        COALESCE(
          (SELECT JSON_AGG(
            JSON_BUILD_OBJECT(
              'id', pg.id,
              'name', pg.name,
              'group_order', pg.group_order,
              'description', pg.description,
              'is_completed', pg.is_completed,
              'is_active', pg.is_active,
              'sub_groups_count', (
                SELECT COUNT(*) FROM sub_groups sg 
                WHERE sg.group_id = pg.id
                  AND ($${isActiveIdx}::boolean IS NULL OR sg.is_active = $${isActiveIdx}::boolean)
              ),
              'sub_groups', (
                CASE 
                  WHEN $${subGroupsIdx}::boolean THEN (
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
                          'main_referee_id', sg.main_referee_id,
                          'is_completed', sg.is_completed,
                          'is_active', sg.is_active,
                          'matches', (
                            CASE 
                              WHEN $${matchesIdx}::boolean THEN (
                                SELECT COALESCE(
                                  JSON_AGG(
                                    JSON_BUILD_OBJECT(
                                      'id', m.id,
                                      'match_number', m.match_number,
                                      'match_date', m.match_date,
                                      'start_time', m.start_time,
                                      'end_time', m.end_time,
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
                                    ) ORDER BY m.match_number
                                  ),
                                  '[]'::json
                                )
                                FROM matches m
                                WHERE m.sub_group_id = sg.id
                                  AND ($${isActiveIdx}::boolean IS NULL OR m.is_active = $${isActiveIdx}::boolean)
                              )
                              ELSE '[]'::json
                            END
                          )
                        ) ORDER BY sg.sub_group_order
                      ),
                      '[]'::json
                    )
                    FROM sub_groups sg
                    WHERE sg.group_id = pg.id
                      AND ($${isActiveIdx}::boolean IS NULL OR sg.is_active = $${isActiveIdx}::boolean)
                  )
                  ELSE '[]'::json
                END
              )
            ) ORDER BY pg.group_order
          ) FROM phase_groups pg 
          WHERE pg.phase_id = p.id 
            AND ($${isActiveIdx}::boolean IS NULL OR pg.is_active = $${isActiveIdx}::boolean)
          ),
          '[]'::json
        ) as groups
      `);
    }

    // --- TOTAL COUNT (utilise seulement baseParams) ---
    const countSql = `
      SELECT COUNT(*) as total
      FROM phases p
      ${joinClause}
      ${whereClause}
    `;
    const countResult = await query<{ total: string }>(countSql, baseParams);
    const total = parseInt(countResult[0]?.total ?? '0');

    // --- PAGINATION ---
    const validatedPage = Math.max(1, page);
    const validatedLimit = Math.max(1, Math.min(100, limit));
    const offset = (validatedPage - 1) * validatedLimit;
    const totalPages = Math.ceil(total / validatedLimit);

    // Ajouter pagination aux paramètres data
    dataParams.push(validatedLimit, offset);
    
    const dataSql = `
      SELECT ${selectFields.join(', ')}
      FROM phases p
      ${joinClause}
      ${whereClause}
      ORDER BY p.phase_order ASC
      LIMIT $${dataParams.length - 1} OFFSET $${dataParams.length}
    `;

    const data = await query<Phase>(dataSql, dataParams);

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
    console.error('Error in getPhases:', error);
    throw new Error('Erreur lors de la récupération des phases');
  }
}

export async function getPhaseById(id: number, options: { 
  with_relations?: boolean,
  is_active?: boolean
} = {}) {
  try {
    const { with_relations = true, is_active } = options;
    
    const params: any[] = [id];
    let whereClause = 'WHERE p.id = $1';
    
    // Ajouter le filtre is_active si spécifié
    if (typeof is_active === 'boolean') {
      params.push(is_active);
      whereClause += ` AND p.is_active = $${params.length}`;
    }

    let sql = `SELECT * FROM phases p ${whereClause}`;

    if (with_relations) {
      // Utiliser directement les valeurs booléennes pour les conditions
      const isActiveFlag = typeof is_active === 'boolean' ? is_active : true;
      
      sql = `
        SELECT 
          p.*,
          JSON_BUILD_OBJECT(
            'id', ce.id,
            'edition_number', ce.edition_number,
            'year', ce.year,
            'start_date', ce.start_date,
            'end_date', ce.end_date,
            'theme', ce.theme,
            'competition', JSON_BUILD_OBJECT(
              'id', c.id,
              'name', c.name,
              'slug', c.slug,
              'description', c.description
            )
          ) as edition,
          COALESCE(
            (SELECT JSON_AGG(
              JSON_BUILD_OBJECT(
                'id', pg.id,
                'name', pg.name,
                'group_order', pg.group_order,
                'description', pg.description,
                'is_completed', pg.is_completed,
                'is_active', pg.is_active,
                'sub_groups', COALESCE(
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
                      'region1', CASE 
                        WHEN sg.region1_id IS NOT NULL THEN 
                          JSON_BUILD_OBJECT('id', r1.id, 'name', r1.name, 'code', r1.code)
                        ELSE NULL
                      END,
                      'region2', CASE 
                        WHEN sg.region2_id IS NOT NULL THEN 
                          JSON_BUILD_OBJECT('id', r2.id, 'name', r2.name, 'code', r2.code)
                        ELSE NULL
                      END,
                      'belt1', CASE 
                        WHEN sg.belt_region1 IS NOT NULL THEN 
                          JSON_BUILD_OBJECT('id', b1.id, 'color', b1.color)
                        ELSE NULL
                      END,
                      'belt2', CASE 
                        WHEN sg.belt_region2 IS NOT NULL THEN 
                          JSON_BUILD_OBJECT('id', b2.id, 'color', b2.color)
                        ELSE NULL
                      END,
                      'main_referee', CASE 
                        WHEN sg.main_referee_id IS NOT NULL THEN 
                          JSON_BUILD_OBJECT(
                            'id', ref.id, 
                            'first_name', ref.first_name,
                            'last_name', ref.last_name,
                            'nickname', ref.nickname
                          )
                        ELSE NULL
                      END,
                      'matches', COALESCE(
                        (SELECT JSON_AGG(
                          JSON_BUILD_OBJECT(
                            'id', m.id,
                            'match_number', m.match_number,
                            'match_date', m.match_date,
                            'start_time', m.start_time,
                            'end_time', m.end_time,
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
                            'notes', m.notes,
                            'fighter1', CASE 
                              WHEN m.fighter1_id IS NOT NULL THEN 
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
                              WHEN m.fighter2_id IS NOT NULL THEN 
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
                              WHEN m.winner_fighter_id IS NOT NULL THEN 
                                JSON_BUILD_OBJECT(
                                  'id', fw.id,
                                  'first_name', fw.first_name,
                                  'last_name', fw.last_name,
                                  'nickname', fw.nickname,
                                  'profile_image', fw.profile_image
                                )
                              ELSE NULL
                            END
                          ) ORDER BY m.match_number
                        ) FROM matches m
                        LEFT JOIN fighters f1 ON m.fighter1_id = f1.id
                        LEFT JOIN fighters f2 ON m.fighter2_id = f2.id
                        LEFT JOIN fighters fw ON m.winner_fighter_id = fw.id
                        WHERE m.sub_group_id = sg.id
                          AND (${isActiveFlag} IS FALSE OR m.is_active = true)
                        ),
                        '[]'::json
                      )
                    ) ORDER BY sg.sub_group_order
                  ) FROM sub_groups sg
                  LEFT JOIN regions r1 ON sg.region1_id = r1.id
                  LEFT JOIN regions r2 ON sg.region2_id = r2.id
                  LEFT JOIN belt b1 ON sg.belt_region1 = b1.id
                  LEFT JOIN belt b2 ON sg.belt_region2 = b2.id
                  LEFT JOIN referees ref ON sg.main_referee_id = ref.id
                  WHERE sg.group_id = pg.id
                    AND (${isActiveFlag} IS FALSE OR sg.is_active = true)
                  ),
                  '[]'::json
                )
              ) ORDER BY pg.group_order
            ) FROM phase_groups pg 
            WHERE pg.phase_id = p.id 
              AND (${isActiveFlag} IS FALSE OR pg.is_active = true)
            ),
            '[]'::json
          ) as groups
        FROM phases p
        LEFT JOIN competition_editions ce ON p.edition_id = ce.id
        LEFT JOIN competitions c ON ce.competition_id = c.id
        ${whereClause}
      `;
    }

    const result = await queryOne<Phase>(sql, params);
    
    if (!result) {
      throw new Error('Phase non trouvée');
    }
    
    return result;
  } catch (error) {
    console.error('Error in getPhaseById:', error);
    throw error;
  }
}

export async function createPhase(formData: FormData) {
  try {
    const rawData = {
      edition_id: formData.get('edition_id'),
      name: formData.get('name'),
      phase_order: formData.get('phase_order'),
      phase_type: formData.get('phase_type'),
      description: formData.get('description'),
      start_date: formData.get('start_date'),
      end_date: formData.get('end_date'),
      is_active: formData.get('is_active'),
    };

    const cleanedData = {
      edition_id: Number(rawData.edition_id),
      name: rawData.name as string,
      phase_order: Number(rawData.phase_order),
      phase_type: rawData.phase_type as any,
      description: rawData.description as string || undefined,
      start_date: rawData.start_date as string || undefined,
      end_date: rawData.end_date as string || undefined,
      is_active: rawData.is_active === 'true' || rawData.is_active === 'on',
    };

    const validatedData = phaseSchema.parse(cleanedData);

    const sql = `
      INSERT INTO phases (
        edition_id, name, phase_order, phase_type, description, 
        start_date, end_date, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id
    `;
    
    const result = await query<{ id: number }>(sql, [
      validatedData.edition_id,
      validatedData.name,
      validatedData.phase_order,
      validatedData.phase_type,
      validatedData.description || null,
      validatedData.start_date || null,
      validatedData.end_date || null,
      validatedData.is_active,
    ]);

    revalidatePath('/editions');
    revalidatePath(`/editions/${validatedData.edition_id}`);
    revalidatePath('/phases');
    return { 
      success: true, 
      id: result[0].id,
      message: 'Phase créée avec succès'
    };
  } catch (error) {
    console.error('Error in createPhase:', error);
    throw new Error('Erreur lors de la création de la phase');
  }
}

export async function updatePhase(id: number, formData: FormData) {
  try {
    const existing = await getPhaseById(id, { with_relations: false });
    if (!existing) {
      throw new Error('Phase non trouvée');
    }

    const rawData = {
      edition_id: formData.get('edition_id'),
      name: formData.get('name'),
      phase_order: formData.get('phase_order'),
      phase_type: formData.get('phase_type'),
      description: formData.get('description'),
      start_date: formData.get('start_date'),
      end_date: formData.get('end_date'),
      is_active: formData.get('is_active'),
      is_completed: formData.get('is_completed'),
    };

    const cleanedData = {
      edition_id: Number(rawData.edition_id),
      name: rawData.name as string,
      phase_order: Number(rawData.phase_order),
      phase_type: rawData.phase_type as any,
      description: rawData.description as string || undefined,
      start_date: rawData.start_date as string || undefined,
      end_date: rawData.end_date as string || undefined,
      is_active: rawData.is_active === 'true' || rawData.is_active === 'on',
      is_completed: rawData.is_completed === 'true' || rawData.is_completed === 'on',
    };

    const validatedData = phaseSchema.parse(cleanedData);

    const sql = `
      UPDATE phases 
      SET 
        edition_id = $1, 
        name = $2, 
        phase_order = $3, 
        phase_type = $4,
        description = $5, 
        start_date = $6, 
        end_date = $7,
        is_active = $8,
        is_completed = $9,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $10
    `;
    
    await query(sql, [
      validatedData.edition_id,
      validatedData.name,
      validatedData.phase_order,
      validatedData.phase_type,
      validatedData.description || null,
      validatedData.start_date || null,
      validatedData.end_date || null,
      validatedData.is_active,
      validatedData.is_completed,
      id,
    ]);

    revalidatePath('/editions');
    revalidatePath(`/editions/${validatedData.edition_id}`);
    revalidatePath(`/phases/${id}`);
    revalidatePath('/phases');
    return { 
      success: true, 
      message: 'Phase modifiée avec succès' 
    };
  } catch (error) {
    console.error('Error in updatePhase:', error);
    throw error;
  }
}

export async function deletePhase(id: number) {
  try {
    const existing = await getPhaseById(id, { with_relations: false });
    if (!existing) {
      throw new Error('Phase non trouvée');
    }

    // Vérifier les données liées (groupes de phase)
    const relatedGroups = await query(`
      SELECT COUNT(*) as group_count FROM phase_groups WHERE phase_id = $1
    `, [id]);

    const groupCount = parseInt(relatedGroups[0]?.group_count ?? '0');
    if (groupCount > 0) {
      throw new Error(
        `Impossible de supprimer cette phase car elle contient ${groupCount} groupe(s)`
      );
    }

    const sql = 'DELETE FROM phases WHERE id = $1';
    await query(sql, [id]);
    
    revalidatePath('/editions');
    revalidatePath(`/editions/${existing.edition_id}`);
    revalidatePath('/phases');
    return { 
      success: true, 
      message: 'Phase supprimée avec succès' 
    };
  } catch (error) {
    console.error('Error in deletePhase:', error);
    throw new Error('Erreur lors de la suppression de la phase');
  }
}

export async function togglePhaseStatus(id: number, isActive: boolean) {
  try {
    const existing = await getPhaseById(id, { with_relations: false });
    if (!existing) {
      throw new Error('Phase non trouvée');
    }

    const sql = `
      UPDATE phases 
      SET is_active = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
    `;
    
    await query(sql, [isActive, id]);

    revalidatePath('/editions');
    revalidatePath(`/editions/${existing.edition_id}`);
    revalidatePath('/phases');
    return { 
      success: true, 
      message: `Phase ${isActive ? 'activée' : 'désactivée'} avec succès` 
    };
  } catch (error) {
    console.error('Error in togglePhaseStatus:', error);
    throw new Error('Erreur lors de la modification du statut de la phase');
  }
}

export async function getPhasesByEdition(editionId: number) {
  try {
    const sql = `
      SELECT 
        p.*,
        COUNT(pg.id) as groups_count
      FROM phases p
      LEFT JOIN phase_groups pg ON p.id = pg.phase_id
      WHERE p.edition_id = $1
      GROUP BY p.id
      ORDER BY p.phase_order ASC
    `;

    const phases = await query<Phase & { groups_count: number }>(sql, [editionId]);
    return phases;
  } catch (error) {
    console.error('Error in getPhasesByEdition:', error);
    throw new Error('Erreur lors de la récupération des phases de l\'édition');
  }
}

// export async function updatePhaseOrder(phases: { id: number; phase_order: number }[]) {
//   try {
//     // const client = await getClient();
    
//     try {
//       await client.query('BEGIN');

//       for (const phase of phases) {
//         await client.query(
//           'UPDATE phases SET phase_order = $1 WHERE id = $2',
//           [phase.phase_order, phase.id]
//         );
//       }

//       await client.query('COMMIT');

//       revalidatePath('/editions');
//       revalidatePath('/phases');
//       return { 
//         success: true, 
//         message: 'Ordre des phases mis à jour avec succès' 
//       };
//     } catch (error) {
//       await client.query('ROLLBACK');
//       throw error;
//     } finally {
//       client.release();
//     }
//   } catch (error) {
//     console.error('Error in updatePhaseOrder:', error);
//     throw new Error('Erreur lors de la mise à jour de l\'ordre des phases');
//   }
// }