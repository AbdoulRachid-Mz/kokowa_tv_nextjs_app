// @/actions/coaches.ts
'use server';

import { query, queryOne } from '@/lib/db/neon-client';
import { coachSchema } from '@/validation/schemas';
import { revalidatePath, cacheTag, updateTag } from 'next/cache';
import { Coach, CoachFilters, PaginatedResponse } from '@/types';

export async function getCoaches(
  filters: CoachFilters = {}
): Promise<PaginatedResponse<Coach>> {
  "use cache";
  cacheTag("coaches");
  
  try {
    const {
      search = '',
      page = 1,
      limit = 20,
      region_id,
      is_active,
      certification_level,
      experience_min,
      with_region = false,
    } = filters;

    let whereClause = 'WHERE 1=1';
    const params: any[] = [];
    const selectFields = ['c.*'];

    // Filtre de recherche
    if (search) {
      whereClause += ` AND (
        c.first_name ILIKE $${params.length + 1} OR 
        c.last_name ILIKE $${params.length + 1} OR 
        c.nickname ILIKE $${params.length + 1} OR
        c.license_number ILIKE $${params.length + 1}
      )`;
      params.push(`%${search}%`);
    }

    // Filtres supplémentaires
    if (region_id !== undefined) {
      whereClause += ` AND c.region_id = $${params.length + 1}`;
      params.push(region_id);
    }

    if (is_active !== undefined) {
      whereClause += ` AND c.is_active = $${params.length + 1}`;
      params.push(is_active);
    }

    if (certification_level) {
      whereClause += ` AND c.certification_level = $${params.length + 1}`;
      params.push(certification_level);
    }

    if (experience_min !== undefined) {
      whereClause += ` AND c.experience_years >= $${params.length + 1}`;
      params.push(experience_min);
    }

    // Jointure avec région si demandée
    if (with_region) {
      selectFields.push(`
        JSON_BUILD_OBJECT(
          'id', r.id,
          'name', r.name,
          'code', r.code,
          'color', r.color,
          'flag_image', r.flag_image
        ) as region
      `);
    }

    // Requête pour le total
    const countSql = `
      SELECT COUNT(*) as total
      FROM coaches c
      ${with_region ? 'LEFT JOIN regions r ON c.region_id = r.id' : ''}
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
      FROM coaches c
      ${with_region ? 'LEFT JOIN regions r ON c.region_id = r.id' : ''}
      ${whereClause}
      ORDER BY c.experience_years DESC, c.last_name ASC, c.first_name ASC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;

    const data = await query<Coach>(
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
    console.error('Error in getCoaches:', error);
    throw new Error('Erreur lors de la récupération des coachs');
  }
}

export async function getCoachById(id: number, options: { 
  with_relations?: boolean 
} = {}) {
  "use cache";
  cacheTag("coaches", `coach:${id}`);

  try {
    const { with_relations = true } = options;
    
    let sql = 'SELECT * FROM coaches WHERE id = $1';
    const params: any[] = [id];

    if (with_relations) {
      sql = `
        SELECT 
          c.*,
          JSON_BUILD_OBJECT(
            'id', r.id,
            'name', r.name,
            'code', r.code,
            'color', r.color,
            'flag_image', r.flag_image
          ) as region
        FROM coaches c
        LEFT JOIN regions r ON c.region_id = r.id
        WHERE c.id = $1
      `;
    }

    const result = await queryOne<Coach>(sql, params);
    
    if (!result) {
      throw new Error('Coach non trouvé');
    }
    
    return result;
  } catch (error) {
    console.error('Error in getCoachById:', error);
    throw error;
  }
}

export async function createCoach(validatedData: any) {
  try {
    const sql = `
      INSERT INTO coaches (
        first_name, last_name, nickname, birth_date, region_id,
        profile_image, license_number, certification_level, 
        experience_years, specialties, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING id
    `;
    
    const result = await query<{ id: number }>(sql, [
      validatedData.first_name,
      validatedData.last_name,
      validatedData.nickname || null,
      validatedData.birth_date || null,
      validatedData.region_id || null,
      validatedData.profile_image || null,
      validatedData.license_number,
      validatedData.certification_level || null,
      validatedData.experience_years || null,
      validatedData.specialties || null,
      validatedData.is_active,
    ]);

    revalidatePath("/coaches");
    revalidatePath("/ad/coaches");
    if (validatedData.region_id) {
      revalidatePath(`/admin/regions/${validatedData.region_id}`);
    }

    updateTag("coaches");

    return { 
      success: true, 
      id: result[0].id,
      message: "Coach créé avec succès",
    };
  } catch (error) {
    console.error("Error in createCoach:", error);
    throw new Error(`Erreur lors de la création du coach: ${(error as Error).message}`);
  }
}

export async function updateCoach(id: number, formData: FormData) {
  try {
    const existing = await getCoachById(id, { with_relations: false });
    if (!existing) {
      throw new Error('Coach non trouvé');
    }

    const rawData = {
      first_name: formData.get('first_name'),
      last_name: formData.get('last_name'),
      nickname: formData.get('nickname'),
      birth_date: formData.get('birth_date'),
      region_id: formData.get('region_id'),
      profile_image: formData.get('profile_image'),
      license_number: formData.get('license_number'),
      certification_level: formData.get('certification_level'),
      experience_years: formData.get('experience_years'),
      specialties: formData.get('specialties'),
      is_active: formData.get('is_active'),
    };

    const cleanedData = {
      first_name: rawData.first_name as string,
      last_name: rawData.last_name as string,
      nickname: rawData.nickname as string || undefined,
      birth_date: rawData.birth_date as string || undefined,
      region_id: rawData.region_id ? Number(rawData.region_id) : undefined,
      profile_image: rawData.profile_image as string || undefined,
      license_number: rawData.license_number as string,
      certification_level: rawData.certification_level as string || undefined,
      experience_years: rawData.experience_years ? Number(rawData.experience_years) : undefined,
      specialties: rawData.specialties as string || undefined,
      is_active: rawData.is_active === 'true',
    };

    const validatedData = coachSchema.parse(cleanedData);

    const sql = `
      UPDATE coaches 
      SET 
        first_name = $1, last_name = $2, nickname = $3, birth_date = $4,
        region_id = $5, profile_image = $6, license_number = $7,
        certification_level = $8, experience_years = $9, specialties = $10,
        is_active = $11, updated_at = CURRENT_TIMESTAMP
      WHERE id = $12
    `;
    
    await query(sql, [
      validatedData.first_name,
      validatedData.last_name,
      validatedData.nickname || null,
      validatedData.birth_date || null,
      validatedData.region_id || null,
      validatedData.profile_image || null,
      validatedData.license_number,
      validatedData.certification_level || null,
      validatedData.experience_years || null,
      validatedData.specialties || null,
      validatedData.is_active,
      id,
    ]);

    revalidatePath('/coaches');
    revalidatePath(`/admin/coaches/${id}`);
    revalidatePath(`/coaches/${id}`);
    if (validatedData.region_id !== existing.region_id) {
      if (existing.region_id) {
        revalidatePath(`/admin/regions/${existing.region_id}`);
      }
      if (validatedData.region_id) {
        revalidatePath(`/admin/regions/${validatedData.region_id}`);
      }
    }
    
    updateTag("coaches");
    updateTag(`coach:${id}`);

    return { 
      success: true, 
      message: 'Coach modifié avec succès' 
    };
  } catch (error) {
    console.error('Error in updateCoach:', error);
    if (error instanceof Error) {
      throw new Error(`Erreur lors de la modification du coach: ${error.message}`);
    }
    throw error;
  }
}

export async function deleteCoach(id: number) {
  try {
    const existing = await getCoachById(id, { with_relations: false });
    if (!existing) {
      throw new Error('Coach non trouvé');
    }

    // Vérifier si le coach est utilisé dans des sous-groupes
    const relatedData = await query(`
      SELECT COUNT(*) as sub_group_count
      FROM sub_groups 
      WHERE main_referee_id = $1
    `, [id]);

    const subGroupCount = parseInt(relatedData[0]?.sub_group_count ?? '0');
    
    if (subGroupCount > 0) {
      throw new Error(
        `Impossible de supprimer ce coach car il est lié à ${subGroupCount} sous-groupe(s) en tant qu'arbitre principal`
      );
    }

    const sql = 'DELETE FROM coaches WHERE id = $1';
    await query(sql, [id]);

    revalidatePath('/coaches');
    revalidatePath('/admin/coaches');
    if (existing.region_id) {
      revalidatePath(`/admin/regions/${existing.region_id}`);
    }
    
    updateTag("coaches");
    updateTag(`coach:${id}`);

    return { 
      success: true, 
      message: 'Coach supprimé avec succès' 
    };
  } catch (error) {
    console.error('Error in deleteCoach:', error);
    if (error instanceof Error) {
      throw new Error(`Erreur lors de la suppression du coach: ${error.message}`);
    }
    throw new Error('Erreur lors de la suppression du coach');
  }
}

export async function getCoachStats() {
  try {
    const sql = `
      SELECT 
        COUNT(*) as total_coaches,
        COUNT(*) FILTER (WHERE is_active = true) as active_coaches,
        AVG(experience_years) as avg_experience,
        COUNT(*) FILTER (WHERE certification_level = 'International') as international_coaches,
        COUNT(*) FILTER (WHERE certification_level = 'National') as national_coaches,
        COUNT(*) FILTER (WHERE certification_level = 'Régional') as regional_coaches
      FROM coaches
      WHERE is_active = true
    `;
    
    const result = await queryOne<{
      total_coaches: string;
      active_coaches: string;
      avg_experience: string;
      international_coaches: string;
      national_coaches: string;
      regional_coaches: string;
    }>(sql);
    
    return {
      total_coaches: parseInt(result?.total_coaches ?? '0'),
      active_coaches: parseInt(result?.active_coaches ?? '0'),
      avg_experience: parseFloat(result?.avg_experience ?? '0'),
      international_coaches: parseInt(result?.international_coaches ?? '0'),
      national_coaches: parseInt(result?.national_coaches ?? '0'),
      regional_coaches: parseInt(result?.regional_coaches ?? '0'),
    };
  } catch (error) {
    console.error('Error in getCoachStats:', error);
    return {
      total_coaches: 0,
      active_coaches: 0,
      avg_experience: 0,
      international_coaches: 0,
      national_coaches: 0,
      regional_coaches: 0,
    };
  }
}

export async function getCoachesForSelect() {
  try {
    const sql = `
      SELECT id, first_name, last_name, nickname, certification_level, is_active
      FROM coaches 
      WHERE is_active = true
      ORDER BY certification_level DESC, last_name ASC, first_name ASC
    `;
    
    return await query<{ 
      id: number; 
      first_name: string; 
      last_name: string; 
      nickname?: string; 
      certification_level?: string;
      is_active: boolean;
    }>(sql);
  } catch (error) {
    console.error('Error in getCoachesForSelect:', error);
    return [];
  }
}