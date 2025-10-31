'use server';

import { query, queryOne } from '@/lib/db/neon-client';
import { phaseSchema } from '@/validation/schemas';
import { revalidatePath } from 'next/cache';
import { Phase, PaginatedResponse } from '@/types';

export interface PhaseFilters {
  edition_id?: number;
  search?: string;
  page?: number;
  limit?: number;
  with_edition?: boolean;
  with_groups?: boolean;
}

export async function getPhases(
  filters: PhaseFilters = {}
): Promise<PaginatedResponse<Phase>> {
  try {
    const {
      edition_id,
      search = '',
      page = 1,
      limit = 20,
      with_edition = true,
      with_groups = false,
    } = filters;

    let whereClause = 'WHERE 1=1';
    const params: any[] = [];
    const selectFields: string[] = ['p.*'];

    // Filtres de base
    if (edition_id) {
      whereClause += ` AND p.edition_id = $${params.length + 1}`;
      params.push(edition_id);
    }

    if (search) {
      whereClause += ` AND (p.name ILIKE $${params.length + 1} OR p.description ILIKE $${params.length + 2})`;
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm);
    }

    // Jointures et relations
    if (with_edition) {
      selectFields.push(`
        JSON_BUILD_OBJECT(
          'id', ce.id,
          'edition_number', ce.edition_number,
          'year', ce.year,
          'competition', JSON_BUILD_OBJECT(
            'id', c.id,
            'name', c.name,
            'type', c.type
          )
        ) as edition
      `);
      whereClause += ` 
        LEFT JOIN competition_editions ce ON p.edition_id = ce.id
        LEFT JOIN competitions c ON ce.competition_id = c.id
      `;
    }

    if (with_groups) {
      selectFields.push(`
        (SELECT JSON_AGG(
          JSON_BUILD_OBJECT(
            'id', pg.id,
            'name', pg.name,
            'group_order', pg.group_order,
            'is_completed', pg.is_completed,
            'sub_groups_count', (
              SELECT COUNT(*) FROM sub_groups sg WHERE sg.group_id = pg.id
            )
          ) ORDER BY pg.group_order
        ) FROM phase_groups pg WHERE pg.phase_id = p.id) as groups
      `);
    }

    // Requête pour le total
    const countSql = `
      SELECT COUNT(*) as total
      FROM phases p
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
      FROM phases p
      ${whereClause}
      ORDER BY p.phase_order ASC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;

    const data = await query<Phase>(
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
    console.error('Error in getPhases:', error);
    throw new Error('Erreur lors de la récupération des phases');
  }
}

export async function getPhaseById(id: number, options: { 
  with_relations?: boolean 
} = {}) {
  try {
    const { with_relations = true } = options;
    
    let sql = 'SELECT * FROM phases WHERE id = $1';
    const params: any[] = [id];

    if (with_relations) {
      sql = `
        SELECT 
          p.*,
          JSON_BUILD_OBJECT(
            'id', ce.id,
            'edition_number', ce.edition_number,
            'year', ce.year,
            'competition', JSON_BUILD_OBJECT(
              'id', c.id,
              'name', c.name,
              'type', c.type
            )
          ) as edition,
          (SELECT JSON_AGG(
            JSON_BUILD_OBJECT(
              'id', pg.id,
              'name', pg.name,
              'group_order', pg.group_order,
              'is_completed', pg.is_completed,
              'sub_groups', (
                SELECT JSON_AGG(
                  JSON_BUILD_OBJECT(
                    'id', sg.id,
                    'name', sg.name,
                    'sub_group_order', sg.sub_group_order,
                    'belt1_fighter_id', sg.belt1_fighter_id,
                    'belt2_fighter_id', sg.belt2_fighter_id,
                    'belt1_region_id', sg.belt1_region_id,
                    'belt2_region_id', sg.belt2_region_id
                  ) ORDER BY sg.sub_group_order
                ) FROM sub_groups sg WHERE sg.group_id = pg.id
              )
            ) ORDER BY pg.group_order
          ) FROM phase_groups pg WHERE pg.phase_id = p.id) as groups
        FROM phases p
        LEFT JOIN competition_editions ce ON p.edition_id = ce.id
        LEFT JOIN competitions c ON ce.competition_id = c.id
        WHERE p.id = $1
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
    };

    const cleanedData = {
      edition_id: Number(rawData.edition_id),
      name: rawData.name as string,
      phase_order: Number(rawData.phase_order),
      phase_type: rawData.phase_type as any,
      description: rawData.description as string || undefined,
      start_date: rawData.start_date as string || undefined,
      end_date: rawData.end_date as string || undefined,
    };

    const validatedData = phaseSchema.parse(cleanedData);

    const sql = `
      INSERT INTO phases (
        edition_id, name, phase_order, phase_type, description, start_date, end_date
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
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
    ]);

    revalidatePath('/editions');
    revalidatePath(`/editions/${validatedData.edition_id}`);
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
    };

    const cleanedData = {
      edition_id: Number(rawData.edition_id),
      name: rawData.name as string,
      phase_order: Number(rawData.phase_order),
      phase_type: rawData.phase_type as any,
      description: rawData.description as string || undefined,
      start_date: rawData.start_date as string || undefined,
      end_date: rawData.end_date as string || undefined,
    };

    const validatedData = phaseSchema.parse(cleanedData);

    const sql = `
      UPDATE phases 
      SET 
        edition_id = $1, name = $2, phase_order = $3, phase_type = $4,
        description = $5, start_date = $6, end_date = $7
      WHERE id = $8
    `;
    
    await query(sql, [
      validatedData.edition_id,
      validatedData.name,
      validatedData.phase_order,
      validatedData.phase_type,
      validatedData.description || null,
      validatedData.start_date || null,
      validatedData.end_date || null,
      id,
    ]);

    revalidatePath('/editions');
    revalidatePath(`/editions/${validatedData.edition_id}`);
    revalidatePath(`/phases/${id}`);
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

    // Vérifier les données liées
    const relatedData = await query(`
      SELECT COUNT(*) as group_count FROM phase_groups WHERE phase_id = $1
    `, [id]);

    const groupCount = parseInt(relatedData[0]?.group_count ?? '0');
    if (groupCount > 0) {
      throw new Error(
        `Impossible de supprimer cette phase car elle contient ${groupCount} groupe(s)`
      );
    }

    const sql = 'DELETE FROM phases WHERE id = $1';
    await query(sql, [id]);
    
    revalidatePath('/editions');
    revalidatePath(`/editions/${existing.edition_id}`);
    return { 
      success: true, 
      message: 'Phase supprimée avec succès' 
    };
  } catch (error) {
    console.error('Error in deletePhase:', error);
    throw new Error('Erreur lors de la suppression de la phase');
  }
}