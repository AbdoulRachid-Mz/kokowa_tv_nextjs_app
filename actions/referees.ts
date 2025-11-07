// actions/referees.ts - VERSION CORRIGÉE
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
  with_assignments?: boolean;
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
    } = options;

    let whereClause = 'WHERE 1=1';
    let joinClause = ''; // Nouvelle variable pour les jointures
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
    if (with_region) {
      joinClause += ` LEFT JOIN regions reg ON r.region_id = reg.id`;
      selectFields.push(`
        JSON_BUILD_OBJECT(
          'id', reg.id,
          'name', reg.name,
          'code', reg.code
        ) as region
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
        SELECT 
          r.*,
          JSON_BUILD_OBJECT(
            'id', reg.id,
            'name', reg.name,
            'code', reg.code
          ) as region,
          (SELECT COUNT(*) FROM referee_assignments ra WHERE ra.referee_id = r.id) as total_assignments,
          (SELECT JSON_AGG(
            JSON_BUILD_OBJECT(
              'id', ra.id,
              'match_id', ra.match_id,
              'role', ra.role,
              'assigned_at', ra.assigned_at
            ) ORDER BY ra.assigned_at DESC
          ) FROM referee_assignments ra WHERE ra.referee_id = r.id LIMIT 5) as recent_assignments
        FROM referees r
        LEFT JOIN regions reg ON r.region_id = reg.id
        WHERE r.id = $1
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
    // Vérifier s'il existe des assignations
    const checkSql = 'SELECT COUNT(*) as count FROM referee_assignments WHERE referee_id = $1';
    const checkResult = await query<{ count: string }>(checkSql, [id]);
    const assignmentCount = parseInt(checkResult[0]?.count ?? '0');

    if (assignmentCount > 0) {
      throw new Error('Impossible de supprimer un arbitre ayant des assignations');
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
