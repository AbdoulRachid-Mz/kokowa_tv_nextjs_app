// lib/actions/sub-groups.ts - VERSION CORRIGÉE
'use server';

import { query, queryOne } from '@/lib/db/neon-client';
import { subGroupSchema } from '@/validation/schemas';
import { revalidatePath } from 'next/cache';
import { SubGroup, SubGroupFilters, PaginatedResponse } from '@/types';

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
      with_matches = false,
      with_regions = true,
    } = filters;

    let whereClause = 'WHERE 1=1';
    const params: any[] = [];
    const selectFields: string[] = ['sg.*'];
    const joins: string[] = [];

    // Filtres de base
    if (group_id) {
      whereClause += ` AND sg.group_id = $${params.length + 1}`;
      params.push(group_id);
    }

    if (search) {
      whereClause += ` AND (sg.name ILIKE $${params.length + 1} OR sg.description ILIKE $${params.length + 1})`;
      params.push(`%${search}%`);
    }

    // Jointures et relations
    if (with_group) {
      selectFields.push(`
        JSON_BUILD_OBJECT(
          'id', pg.id,
          'name', pg.name,
          'group_order', pg.group_order,
          'phase', JSON_BUILD_OBJECT(
            'id', p.id,
            'name', p.name,
            'phase_type', p.phase_type
          )
        ) as group
      `);
      joins.push(`
        LEFT JOIN phase_groups pg ON sg.group_id = pg.id
        LEFT JOIN phases p ON pg.phase_id = p.id
      `);
    }

    if (with_regions) {
      selectFields.push(`
        JSON_BUILD_OBJECT(
          'id', r1.id,
          'name', r1.name,
          'code', r1.code
        ) as region1,
        JSON_BUILD_OBJECT(
          'id', r2.id,
          'name', r2.name,
          'code', r2.code
        ) as region2
      `);
      joins.push(`
        LEFT JOIN regions r1 ON sg.region1_id = r1.id
        LEFT JOIN regions r2 ON sg.region2_id = r2.id
      `);
    }

    // Jointures pour les ceintures
    selectFields.push(`
      JSON_BUILD_OBJECT(
        'id', b1.id,
        'color', b1.color
      ) as belt1,
      JSON_BUILD_OBJECT(
        'id', b2.id,
        'color', b2.color
      ) as belt2,
      JSON_BUILD_OBJECT(
        'id', ref.id,
        'first_name', ref.first_name,
        'last_name', ref.last_name,
        'nickname', ref.nickname
      ) as main_referee
    `);
    joins.push(`
      LEFT JOIN belt b1 ON sg.belt_region1 = b1.id
      LEFT JOIN belt b2 ON sg.belt_region2 = b2.id
      LEFT JOIN referees ref ON sg.main_referee_id = ref.id
    `);

    if (with_matches) {
      selectFields.push(`
        (SELECT JSON_AGG(
          JSON_BUILD_OBJECT(
            'id', m.id,
            'match_number', m.match_number,
            'match_date', m.match_date,
            'status', m.status,
            'fighter1_id', m.fighter1_id,
            'fighter2_id', m.fighter2_id,
            'winner_fighter_id', m.winner_fighter_id,
            'match_result', m.match_result
          ) ORDER BY m.match_number, m.match_date
        ) FROM matches m WHERE m.sub_group_id = sg.id) as matches
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
      ORDER BY sg.sub_group_order ASC
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

export async function getSubGroupById(id: number, options: { 
  with_relations?: boolean 
} = {}) {
  try {
    const { with_relations = true } = options;
    
    let sql = 'SELECT * FROM sub_groups WHERE id = $1';
    const params: any[] = [id];

    if (with_relations) {
      sql = `
        SELECT 
          sg.*,
          JSON_BUILD_OBJECT(
            'id', pg.id,
            'name', pg.name,
            'group_order', pg.group_order,
            'phase', JSON_BUILD_OBJECT(
              'id', p.id,
              'name', p.name,
              'phase_type', p.phase_type,
              'edition', JSON_BUILD_OBJECT(
                'id', ce.id,
                'edition_number', ce.edition_number,
                'year', ce.year
              )
            )
          ) as group,
          JSON_BUILD_OBJECT(
            'id', r1.id,
            'name', r1.name,
            'code', r1.code,
            'fighters', (
              SELECT JSON_AGG(
                JSON_BUILD_OBJECT(
                  'id', f.id,
                  'first_name', f.first_name,
                  'last_name', f.last_name,
                  'nickname', f.nickname,
                  'profile_image', f.profile_image
                )
              )
              FROM fighters f
              WHERE f.region_id = r1.id AND f.is_active = true
            )
          ) as region1,
          JSON_BUILD_OBJECT(
            'id', r2.id,
            'name', r2.name,
            'code', r2.code,
            'fighters', (
              SELECT JSON_AGG(
                JSON_BUILD_OBJECT(
                  'id', f.id,
                  'first_name', f.first_name,
                  'last_name', f.last_name,
                  'nickname', f.nickname,
                  'profile_image', f.profile_image
                )
              )
              FROM fighters f
              WHERE f.region_id = r2.id AND f.is_active = true
            )
          ) as region2,
          JSON_BUILD_OBJECT(
            'id', b1.id,
            'color', b1.color
          ) as belt1,
          JSON_BUILD_OBJECT(
            'id', b2.id,
            'color', b2.color
          ) as belt2,
          JSON_BUILD_OBJECT(
            'id', ref.id,
            'first_name', ref.first_name,
            'last_name', ref.last_name,
            'nickname', ref.nickname
          ) as main_referee,
          (SELECT JSON_AGG(
            JSON_BUILD_OBJECT(
              'id', m.id,
              'match_number', m.match_number,
              'match_date', m.match_date,
              'status', m.status,
              'fighter1_id', m.fighter1_id,
              'fighter2_id', m.fighter2_id,
              'winner_fighter_id', m.winner_fighter_id,
              'match_result', m.match_result,
              'fighter1', JSON_BUILD_OBJECT(
                'id', mf1.id,
                'first_name', mf1.first_name,
                'last_name', mf1.last_name,
                'nickname', mf1.nickname
              ),
              'fighter2', JSON_BUILD_OBJECT(
                'id', mf2.id,
                'first_name', mf2.first_name,
                'last_name', mf2.last_name,
                'nickname', mf2.nickname
              )
            ) ORDER BY m.match_number, m.match_date
          ) FROM matches m
          LEFT JOIN fighters mf1 ON m.fighter1_id = mf1.id
          LEFT JOIN fighters mf2 ON m.fighter2_id = mf2.id
          WHERE m.sub_group_id = sg.id) as matches
        FROM sub_groups sg
        LEFT JOIN phase_groups pg ON sg.group_id = pg.id
        LEFT JOIN phases p ON pg.phase_id = p.id
        LEFT JOIN competition_editions ce ON p.edition_id = ce.id
        LEFT JOIN regions r1 ON sg.region1_id = r1.id
        LEFT JOIN regions r2 ON sg.region2_id = r2.id
        LEFT JOIN belt b1 ON sg.belt_region1 = b1.id
        LEFT JOIN belt b2 ON sg.belt_region2 = b2.id
        LEFT JOIN referees ref ON sg.main_referee_id = ref.id
        WHERE sg.id = $1
      `;
    }

    const result = await queryOne<SubGroup>(sql, params);
    
    if (!result) {
      throw new Error('Sous-groupe non trouvé');
    }
    
    return result;
  } catch (error) {
    console.error('Error in getSubGroupById:', error);
    throw error;
  }
}

export async function createSubGroup(formData: FormData) {
  try {
    const rawData = {
      group_id: formData.get('group_id'),
      name: formData.get('name'),
      sub_group_order: formData.get('sub_group_order'),
      description: formData.get('description'),
      region1_id: formData.get('region1_id'),
      region2_id: formData.get('region2_id'),
      belt_region1: formData.get('belt_region1'),
      belt_region2: formData.get('belt_region2'),
      main_referee_id: formData.get('main_referee_id'),
    };

    const cleanedData = {
      group_id: Number(rawData.group_id),
      name: rawData.name as string,
      sub_group_order: Number(rawData.sub_group_order),
      description: rawData.description as string || undefined,
      region1_id: rawData.region1_id ? Number(rawData.region1_id) : undefined,
      region2_id: rawData.region2_id ? Number(rawData.region2_id) : undefined,
      belt_region1: rawData.belt_region1 ? Number(rawData.belt_region1) : undefined,
      belt_region2: rawData.belt_region2 ? Number(rawData.belt_region2) : undefined,
      main_referee_id: rawData.main_referee_id ? Number(rawData.main_referee_id) : undefined,
    };

    const validatedData = subGroupSchema.parse(cleanedData);

    const sql = `
      INSERT INTO sub_groups (
        group_id, name, sub_group_order, description,
        region1_id, region2_id, belt_region1, belt_region2, main_referee_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id
    `;
    
    const result = await query<{ id: number }>(sql, [
      validatedData.group_id,
      validatedData.name,
      validatedData.sub_group_order,
      validatedData.description || null,
      validatedData.region1_id || null,
      validatedData.region2_id || null,
      validatedData.belt_region1 || null,
      validatedData.belt_region2 || null,
      validatedData.main_referee_id || null,
    ]);

    revalidatePath('/phase-groups');
    revalidatePath(`/phase-groups/${validatedData.group_id}`);
    return { 
      success: true, 
      id: result[0].id,
      message: 'Sous-groupe créé avec succès'
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
      region1_id: formData.get('region1_id'),
      region2_id: formData.get('region2_id'),
      belt_region1: formData.get('belt_region1'),
      belt_region2: formData.get('belt_region2'),
      main_referee_id: formData.get('main_referee_id'),
    };

    const cleanedData = {
      group_id: Number(rawData.group_id),
      name: rawData.name as string,
      sub_group_order: Number(rawData.sub_group_order),
      description: rawData.description as string || undefined,
      region1_id: rawData.region1_id ? Number(rawData.region1_id) : undefined,
      region2_id: rawData.region2_id ? Number(rawData.region2_id) : undefined,
      belt_region1: rawData.belt_region1 ? Number(rawData.belt_region1) : undefined,
      belt_region2: rawData.belt_region2 ? Number(rawData.belt_region2) : undefined,
      main_referee_id: rawData.main_referee_id ? Number(rawData.main_referee_id) : undefined,
    };

    const validatedData = subGroupSchema.parse(cleanedData);

    const sql = `
      UPDATE sub_groups 
      SET 
        group_id = $1, name = $2, sub_group_order = $3, description = $4,
        region1_id = $5, region2_id = $6, belt_region1 = $7, belt_region2 = $8, main_referee_id = $9
      WHERE id = $10
    `;
    
    await query(sql, [
      validatedData.group_id,
      validatedData.name,
      validatedData.sub_group_order,
      validatedData.description || null,
      validatedData.region1_id || null,
      validatedData.region2_id || null,
      validatedData.belt_region1 || null,
      validatedData.belt_region2 || null,
      validatedData.main_referee_id || null,
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