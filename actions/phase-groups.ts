// @/actions/phase-groups.ts

'use server';

import { query, queryOne } from '@/lib/db/neon-client';
import { phaseGroupSchema, subGroupSchema } from '@/validation/schemas';
import { revalidatePath, cacheTag, updateTag } from 'next/cache';
import { PhaseGroup, SubGroup, PaginatedResponse, PhaseGroupFilters } from '@/types';

export async function getPhaseGroups(
  filters: PhaseGroupFilters = {}
): Promise<PaginatedResponse<PhaseGroup>> {
  "use cache";
  cacheTag("phase-groups");

  try {
    const {
      phase_id,
      search = '',
      page = 1,
      limit = 20,
      is_active,
      date_from,
      date_to,
      with_phase = true,
      with_subGroups = true,
      with_matches = false
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

    // Filtres de date
    if (date_from) {
      params.push(date_from);
      whereClause += ` AND pg.date >= $${params.length}`;
    }

    if (date_to) {
      params.push(date_to);
      whereClause += ` AND pg.date <= $${params.length}`;
    }

    // Jointures et relations
    if (with_phase) {
      selectFields.push(`
        JSON_BUILD_OBJECT(
          'id', p.id,
          'name', p.name,
          'phase_type', p.phase_type,
          'phase_order', p.phase_order,
          'date', pg.date
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
            'period', sg.period,
            'score_region1', sg.score_region1,
            'score_region2', sg.score_region2,
            'nulls', sg.nulls,
            'status', sg.status,
            'region1_id', sg.region1_id,
            'region2_id', sg.region2_id,
            'belt_region1', sg.belt_region1,
            'belt_region2', sg.belt_region2,
            'main_referee_id', sg.main_referee_id,
            'is_completed', sg.is_completed,
            'is_active', sg.is_active,
            'matches_count', (SELECT COUNT(*) FROM matches m WHERE m.sub_group_id = sg.id),
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
            ELSE NULL END
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
  with_stats?: boolean;
} = {}) {
  "use cache";
  cacheTag("phase-groups", `phase-group:${id}`);

  try {
    const { 
      with_relations = false,
      relations = {},
      is_active,
      with_stats = true
    } = options;
    
    const {
      with_phase = false,
      with_edition = false,
      with_subGroups = false,
      with_matches = false,
      with_fighters = false,
      with_regions = false,
      with_referees = false,
      with_belts = false
    } = relations;
    
    const params: any[] = [id];
    let whereClause = 'WHERE pg.id = $1';
    
    if (typeof is_active === 'boolean') {
      params.push(is_active);
      whereClause += ` AND pg.is_active = $${params.length}`;
    }

    const statsFields = with_stats ? [
      `(SELECT COUNT(*) FROM sub_groups WHERE group_id = pg.id) as sub_groups_count`,
      `(SELECT COUNT(*) FROM sub_groups WHERE group_id = pg.id AND is_completed = true) as sub_groups_completed_count`,
      `(SELECT COUNT(*) FROM matches m JOIN sub_groups sg ON m.sub_group_id = sg.id WHERE sg.group_id = pg.id) as matches_count`
    ] : [];

    if (!with_relations) {
      const sql = `
        SELECT 
          pg.*,
          ${statsFields.length > 0 ? statsFields.join(", ") + "," : ""}
          JSON_BUILD_OBJECT(
            'id', p.id,
            'name', p.name,
            'phase_type', p.phase_type,
            'phase_order', p.phase_order,
            'edition_id', p.edition_id
          ) as phase
        FROM phase_groups pg
        LEFT JOIN phases p ON pg.phase_id = p.id
        ${whereClause}
      `;
      const result = await queryOne<any>(sql, params);
      if (!result) throw new Error('Groupe non trouvé');
      return result;
    }

    const isActiveCondition = typeof is_active === 'boolean' 
      ? (is_active ? ' AND is_active = true' : ' AND is_active = false') 
      : '';

    let sql = `
      SELECT 
        pg.*,
        ${statsFields.length > 0 ? statsFields.join(", ") + "," : ""}
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
          'edition', ${with_edition ? `
            JSON_BUILD_OBJECT(
              'id', ce.id,
              'edition_number', ce.edition_number,
              'year', ce.year,
              'is_active', ce.is_active
            )` : 'NULL'}
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
              'status', sg.status,
              'is_completed', sg.is_completed,
              'is_active', sg.is_active,
              'matches_count', (SELECT COUNT(*) FROM matches WHERE sub_group_id = sg.id)
            ) ORDER BY sg.sub_group_order
          ) FROM sub_groups sg 
          WHERE sg.group_id = pg.id ${isActiveCondition.replace('is_active', 'sg.is_active')}
          ),
          '[]'::json
        ) as sub_groups
        ` : `'sub_groups', '[]'::json`}
      FROM phase_groups pg
      LEFT JOIN phases p ON pg.phase_id = p.id
      LEFT JOIN competition_editions ce ON p.edition_id = ce.id
      ${whereClause}
    `;

    const result = await queryOne<PhaseGroup>(sql, params);
    if (!result) throw new Error('Groupe non trouvé');
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
      date: formData.get('date'),
      is_completed: formData.get('is_completed'),
      is_active: formData.get('is_active'),
    };

    const cleanedData = {
      phase_id: Number(rawData.phase_id),
      name: rawData.name as string,
      group_order: rawData.group_order ? Number(rawData.group_order) : undefined,
      description: rawData.description as string || undefined,
      date: rawData.date as string || undefined,
      is_completed: rawData.is_completed === 'true',
      is_active: rawData.is_active === 'true',
    };

    // Validate with schema
    const validatedData = phaseGroupSchema.parse(cleanedData);

    // Vérifier et ajuster le nom si nécessaire
    let finalName = validatedData.name;
    let nameCounter = 1;
    
    const existingNameCheck = await query<{ id: number }>(
      `SELECT id FROM phase_groups WHERE name = $1 AND phase_id = $2`,
      [finalName, validatedData.phase_id]
    );
    
    while (existingNameCheck.length > 0) {
      finalName = `${validatedData.name} (${nameCounter})`;
      nameCounter++;
      
      const newCheck = await query<{ id: number }>(
        `SELECT id FROM phase_groups WHERE name = $1 AND phase_id = $2`,
        [finalName, validatedData.phase_id]
      );
      
      if (newCheck.length === 0) {
        break;
      }
    }

    // Déterminer l'ordre du groupe
    let finalOrder = validatedData.group_order;
    
    if (finalOrder === undefined || finalOrder === null) {
      // Récupérer le plus grand ordre existant pour cette phase
      const maxOrderResult = await query<{ max_order: number }>(
        `SELECT COALESCE(MAX(group_order), 0) as max_order 
         FROM phase_groups WHERE phase_id = $1`,
        [validatedData.phase_id]
      );
      
      finalOrder = maxOrderResult[0]?.max_order + 1 || 1;
    } else {
      // Vérifier si l'ordre existe déjà
      const existingOrderCheck = await query<{ id: number }>(
        `SELECT id FROM phase_groups WHERE group_order = $1 AND phase_id = $2`,
        [finalOrder, validatedData.phase_id]
      );
      
      if (existingOrderCheck.length > 0) {
        // Trouver le prochain ordre disponible
        const ordersResult = await query<{ group_order: number }>(
          `SELECT group_order FROM phase_groups 
           WHERE phase_id = $1 
           ORDER BY group_order`,
          [validatedData.phase_id]
        );
        
        const existingOrders = ordersResult.map(r => r.group_order);
        let nextOrder = finalOrder;
        
        while (existingOrders.includes(nextOrder)) {
          nextOrder++;
        }
        
        finalOrder = nextOrder;
      }
    }

    // Commencer une transaction
    await query('BEGIN');

    try {
      // 1. Créer le groupe de phase
      const groupSql = `
        INSERT INTO phase_groups (phase_id, name, group_order, description, date, is_completed, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id
      `;
      
      const groupResult = await query<{ id: number }>(groupSql, [
        validatedData.phase_id,
        finalName,
        finalOrder,
        validatedData.description || null,
        validatedData.date || null,
        validatedData.is_completed,
        validatedData.is_active,
      ]);

      const groupId = groupResult[0].id;

      // 2. Créer automatiquement des sous-groupes si demandé
      if (create_sub_groups > 0) {
        for (let i = 1; i <= create_sub_groups; i++) {
          // Gérer les noms des sous-groupes
          let subGroupName = `Sous-groupe ${i}`;
          let subNameCounter = 1;
          
          const existingSubNameCheck = await query<{ id: number }>(
            `SELECT id FROM sub_groups WHERE name = $1 AND group_id = $2`,
            [subGroupName, groupId]
          );
          
          while (existingSubNameCheck.length > 0) {
            subGroupName = `Sous-groupe ${i} (${subNameCounter})`;
            subNameCounter++;
            
            const newSubCheck = await query<{ id: number }>(
              `SELECT id FROM sub_groups WHERE name = $1 AND group_id = $2`,
              [subGroupName, groupId]
            );
            
            if (newSubCheck.length === 0) {
              break;
            }
          }

          const subGroupSql = `
            INSERT INTO sub_groups (group_id, name, sub_group_order, is_active)
            VALUES ($1, $2, $3, $4)
          `;
          
          await query(subGroupSql, [
            groupId,
            subGroupName,
            i,
            true, // is_active par défaut à true
          ]);
        }
      }

      // Commit de la transaction
      await query('COMMIT');

      revalidatePath(`/ad/phases/${validatedData.phase_id}`);
      updateTag("phase-groups");
      updateTag("phases");
      
      return { 
        success: true, 
        id: groupId,
        message: `Groupe "${finalName}" créé avec succès${create_sub_groups > 0 ? ` (${create_sub_groups} sous-groupe(s) créé(s))` : ''}`
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
      date: formData.get('date'),
      is_completed: formData.get('is_completed'),
      is_active: formData.get('is_active'),
    };

    const cleanedData = {
      phase_id: Number(rawData.phase_id),
      name: rawData.name as string,
      group_order: Number(rawData.group_order),
      description: rawData.description as string || undefined,
      date: rawData.date as string || undefined,
      is_completed: rawData.is_completed === 'true',
      is_active: rawData.is_active === 'true',
    };

    const validatedData = phaseGroupSchema.parse(cleanedData);

    const sql = `
      UPDATE phase_groups 
      SET 
        phase_id = $1, name = $2, group_order = $3, description = $4, date = $5, is_completed = $6, is_active = $7
      WHERE id = $8
    `;
    
    await query(sql, [
      validatedData.phase_id,
      validatedData.name,
      validatedData.group_order,
      validatedData.description || null,
      validatedData.date || null,
      validatedData.is_completed,
      validatedData.is_active,
      id,
    ]);

    revalidatePath('/phases');
    revalidatePath(`/phases/${validatedData.phase_id}`);
    revalidatePath(`/phase-groups/${id}`);
    updateTag("phase-groups");
    updateTag(`phase-group:${id}`);
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
    updateTag("phase-groups");
    updateTag(`phase-group:${id}`);
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
      updateTag("phase-groups");
      updateTag(`phase-group:${groupId}`);
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