'use server';

import { query, queryOne } from '@/lib/db/neon-client';
import { phaseGroupSchema, subGroupSchema } from '@/validation/schemas';
import { revalidatePath } from 'next/cache';
import { PhaseGroup, SubGroup, PaginatedResponse } from '@/types';

export interface PhaseGroupFilters {
  phase_id?: number;
  search?: string;
  page?: number;
  limit?: number;
  with_phase?: boolean;
  with_sub_groups?: boolean;
}

export async function getPhaseGroups(
  filters: PhaseGroupFilters = {}
): Promise<PaginatedResponse<PhaseGroup>> {
  try {
    const {
      phase_id,
      search = '',
      page = 1,
      limit = 20,
      with_phase = true,
      with_sub_groups = false,
    } = filters;

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
      whereClause += ` LEFT JOIN phases p ON pg.phase_id = p.id`;
    }

    if (with_sub_groups) {
      selectFields.push(`
        (SELECT JSON_AGG(
          JSON_BUILD_OBJECT(
            'id', sg.id,
            'name', sg.name,
            'sub_group_order', sg.sub_group_order,
            'belt1_fighter_id', sg.belt1_fighter_id,
            'belt2_fighter_id', sg.belt2_fighter_id,
            'belt1_region_id', sg.belt1_region_id,
            'belt2_region_id', sg.belt2_region_id,
            'is_completed', sg.is_completed,
            'belt1_fighter', JSON_BUILD_OBJECT(
              'id', f1.id,
              'first_name', f1.first_name,
              'last_name', f1.last_name,
              'nickname', f1.nickname
            ),
            'belt2_fighter', JSON_BUILD_OBJECT(
              'id', f2.id,
              'first_name', f2.first_name,
              'last_name', f2.last_name,
              'nickname', f2.nickname
            ),
            'belt1_region', JSON_BUILD_OBJECT(
              'id', r1.id,
              'name', r1.name,
              'code', r1.code
            ),
            'belt2_region', JSON_BUILD_OBJECT(
              'id', r2.id,
              'name', r2.name,
              'code', r2.code
            )
          ) ORDER BY sg.sub_group_order
        ) FROM sub_groups sg
        LEFT JOIN fighters f1 ON sg.belt1_fighter_id = f1.id
        LEFT JOIN fighters f2 ON sg.belt2_fighter_id = f2.id
        LEFT JOIN regions r1 ON sg.belt1_region_id = r1.id
        LEFT JOIN regions r2 ON sg.belt2_region_id = r2.id
        WHERE sg.group_id = pg.id) as sub_groups
      `);
    }

    // Requête pour le total
    const countSql = `
      SELECT COUNT(*) as total
      FROM phase_groups pg
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
  with_relations?: boolean 
} = {}) {
  try {
    const { with_relations = true } = options;
    
    let sql = 'SELECT * FROM phase_groups WHERE id = $1';
    const params: any[] = [id];

    if (with_relations) {
      sql = `
        SELECT 
          pg.*,
          JSON_BUILD_OBJECT(
            'id', p.id,
            'name', p.name,
            'phase_type', p.phase_type,
            'phase_order', p.phase_order,
            'edition', JSON_BUILD_OBJECT(
              'id', ce.id,
              'edition_number', ce.edition_number,
              'year', ce.year
            )
          ) as phase,
          (SELECT JSON_AGG(
            JSON_BUILD_OBJECT(
              'id', sg.id,
              'name', sg.name,
              'sub_group_order', sg.sub_group_order,
              'belt1_fighter_id', sg.belt1_fighter_id,
              'belt2_fighter_id', sg.belt2_fighter_id,
              'belt1_region_id', sg.belt1_region_id,
              'belt2_region_id', sg.belt2_region_id,
              'is_completed', sg.is_completed,
              'belt1_fighter', JSON_BUILD_OBJECT(
                'id', f1.id,
                'first_name', f1.first_name,
                'last_name', f1.last_name,
                'nickname', f1.nickname
              ),
              'belt2_fighter', JSON_BUILD_OBJECT(
                'id', f2.id,
                'first_name', f2.first_name,
                'last_name', f2.last_name,
                'nickname', f2.nickname
              ),
              'belt1_region', JSON_BUILD_OBJECT(
                'id', r1.id,
                'name', r1.name,
                'code', r1.code
              ),
              'belt2_region', JSON_BUILD_OBJECT(
                'id', r2.id,
                'name', r2.name,
                'code', r2.code
              ),
              'matches_count', (
                SELECT COUNT(*) FROM matches m WHERE m.sub_group_id = sg.id
              )
            ) ORDER BY sg.sub_group_order
          ) FROM sub_groups sg
          LEFT JOIN fighters f1 ON sg.belt1_fighter_id = f1.id
          LEFT JOIN fighters f2 ON sg.belt2_fighter_id = f2.id
          LEFT JOIN regions r1 ON sg.belt1_region_id = r1.id
          LEFT JOIN regions r2 ON sg.belt2_region_id = r2.id
          WHERE sg.group_id = pg.id) as sub_groups
        FROM phase_groups pg
        LEFT JOIN phases p ON pg.phase_id = p.id
        LEFT JOIN competition_editions ce ON p.edition_id = ce.id
        WHERE pg.id = $1
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