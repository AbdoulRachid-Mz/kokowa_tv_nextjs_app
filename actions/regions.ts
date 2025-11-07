'use server';

import { query, queryOne } from '@/lib/db/neon-client';
import { regionSchema } from '@/validation/schemas';
import { revalidatePath } from 'next/cache';
import { Region, RegionFilters, PaginatedResponse } from '@/types';

export async function getRegions(
  filters: RegionFilters = {}
): Promise<PaginatedResponse<Region>> {
  try {
    const {
      search = '',
      page = 1,
      limit = 20,
      code,
      with_fighters = true,
      with_competitions = false,
      fighter_count_min,
      fighter_count_max,
    } = filters;

    let whereClause = 'WHERE 1=1';
    const params: any[] = [];
    const selectFields: string[] = ['r.*'];

    // Filtre de recherche
    if (search) {
      whereClause += ` AND (r.name ILIKE $${params.length + 1} OR r.code ILIKE $${params.length + 1})`;
      params.push(`%${search}%`);
    }

    // Filtre par code
    if (code) {
      whereClause += ` AND r.code = $${params.length + 1}`;
      params.push(code);
    }

    // Filtre par nombre de lutteurs
    if (fighter_count_min !== undefined) {
      whereClause += ` AND r.total_fighters >= $${params.length + 1}`;
      params.push(fighter_count_min);
    }

    if (fighter_count_max !== undefined) {
      whereClause += ` AND r.total_fighters <= $${params.length + 1}`;
      params.push(fighter_count_max);
    }

    // Jointure avec les lutteurs si demandée
    if (with_fighters) {
      selectFields.push(`
        (SELECT JSON_AGG(
          JSON_BUILD_OBJECT(
            'id', f.id,
            'first_name', f.first_name,
            'last_name', f.last_name,
            'nickname', f.nickname,
            'ranking', f.ranking,
            'is_champion', f.is_champion,
            'profile_image', f.profile_image
          ) ORDER BY f.ranking ASC
        ) FROM fighters f WHERE f.region_id = r.id AND f.is_active = true LIMIT 10) as fighters
      `);
    }

    // Jointure avec les compétitions si demandée
    if (with_competitions) {
      selectFields.push(`
        (SELECT JSON_AGG(
          JSON_BUILD_OBJECT(
            'id', c.id,
            'name', c.name,
            'type', c.type,
            'status', c.status,
            'location', c.location
          ) ORDER BY c.created_at DESC
        ) FROM competitions c WHERE c.region_id = r.id LIMIT 5) as competitions
      `);
    }

    // Requête pour le total
    const countSql = `
      SELECT COUNT(*) as total
      FROM regions r
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
      FROM regions r
      ${whereClause}
      ORDER BY r.total_fighters DESC, r.name ASC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;

    const data = await query<Region>(
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
    console.error('Error in getRegions:', error);
    throw new Error('Erreur lors de la récupération des régions');
  }
}

export async function getRegionById(id: number, options: { with_relations?: boolean } = {}) {
  try {
    const { with_relations = true } = options;
    
    let sql = 'SELECT * FROM regions WHERE id = $1';
    const params: any[] = [id];

    if (with_relations) {
      sql = `
        SELECT 
          r.*,
          (SELECT COUNT(*) FROM fighters f WHERE f.region_id = r.id AND f.is_active = true) as fighter_count,
          (SELECT COUNT(*) FROM fighters f WHERE f.region_id = r.id AND f.is_champion = true) as champion_count,
          (SELECT JSON_AGG(
            JSON_BUILD_OBJECT(
              'id', f.id,
              'first_name', f.first_name,
              'last_name', f.last_name,
              'nickname', f.nickname,
              'ranking', f.ranking,
              'is_champion', f.is_champion,
              'profile_image', f.profile_image
            ) ORDER BY f.ranking ASC
          ) FROM fighters f WHERE f.region_id = r.id AND f.is_active = true) as fighters,
          (SELECT JSON_AGG(
            JSON_BUILD_OBJECT(
              'id', c.id,
              'name', c.name,
              'type', c.type,
              'status', c.status
            ) ORDER BY c.created_at DESC
          ) FROM competitions c WHERE c.region_id = r.id LIMIT 10) as competitions
        FROM regions r
        WHERE r.id = $1
      `;
    }

    const result = await queryOne<Region & { 
      fighter_count?: string; 
      champion_count?: string;
      fighters?: any[];
      competitions?: any[];
    }>(sql, params);
    
    if (!result) {
      throw new Error('Région non trouvée');
    }
    
    return result;
  } catch (error) {
    console.error('Error in getRegionById:', error);
    throw error;
  }
}

export async function createRegion(formData: FormData) {
  try {
    const rawData = {
      name: formData.get('name'),
      code: formData.get('code'),
      description: formData.get('description'),
      flag_image: formData.get('flag_image'),
      color: formData.get('color'),
    };

    const validatedData = regionSchema.parse(rawData);

    const sql = `
      INSERT INTO regions (name, code, description, flag_image, color)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id
    `;
    
    const result = await query<{ id: number }>(sql, [
      validatedData.name,
      validatedData.code,
      validatedData.description || null,
      validatedData.flag_image || null,
      validatedData.color || null,
    ]);

    revalidatePath('/regions');
    revalidatePath('/admin/regions');
    return { 
      success: true, 
      id: result[0].id,
      message: 'Région créée avec succès'
    };
  } catch (error) {
    console.error('Error in createRegion:', error);
    if (error instanceof Error) {
      throw new Error(`Erreur lors de la création de la région: ${error.message}`);
    }
    throw new Error('Erreur lors de la création de la région');
  }
}

export async function updateRegion(id: number, formData: FormData) {
  try {
    const existing = await getRegionById(id, { with_relations: false });
    if (!existing) {
      throw new Error('Région non trouvée');
    }

    const rawData = {
      name: formData.get('name'),
      code: formData.get('code'),
      description: formData.get('description'),
      flag_image: formData.get('flag_image'),
      color: formData.get('color'),
    };

    const validatedData = regionSchema.parse(rawData);

    const sql = `
      UPDATE regions 
      SET name = $1, code = $2, description = $3, flag_image = $4, color = $5
      WHERE id = $6
    `;
    
    await query(sql, [
      validatedData.name,
      validatedData.code,
      validatedData.description || null,
      validatedData.flag_image || null,
      validatedData.color || null,
      id,
    ]);

    revalidatePath('/regions');
    revalidatePath('/admin/regions');
    revalidatePath(`/regions/${id}`);
    revalidatePath(`/admin/regions/${id}`);
    
    return { 
      success: true, 
      message: 'Région modifiée avec succès' 
    };
  } catch (error) {
    console.error('Error in updateRegion:', error);
    if (error instanceof Error) {
      throw new Error(`Erreur lors de la modification de la région: ${error.message}`);
    }
    throw error;
  }
}

export async function deleteRegion(id: number) {
  try {
    const existing = await getRegionById(id, { with_relations: false });
    if (!existing) {
      throw new Error('Région non trouvée');
    }

    // Vérifier s'il y a des données liées
    const relatedData = await query(`
      SELECT 
        (SELECT COUNT(*) FROM fighters WHERE region_id = $1) as fighter_count,
        (SELECT COUNT(*) FROM competitions WHERE region_id = $1) as competition_count,
        (SELECT COUNT(*) FROM referees WHERE region_id = $1) as referee_count
    `, [id]);

    const counts = relatedData[0] as { 
      fighter_count: string; 
      competition_count: string; 
      referee_count: string;
    };
    
    const fighterCount = parseInt(counts.fighter_count);
    const competitionCount = parseInt(counts.competition_count);
    const refereeCount = parseInt(counts.referee_count);

    if (fighterCount > 0 || competitionCount > 0 || refereeCount > 0) {
      throw new Error(
        `Impossible de supprimer cette région car elle contient des données liées: 
        ${fighterCount} lutteur(s), ${competitionCount} compétition(s), ${refereeCount} arbitre(s)`
      );
    }

    const sql = 'DELETE FROM regions WHERE id = $1';
    await query(sql, [id]);
    
    revalidatePath('/regions');
    revalidatePath('/admin/regions');
    
    return { 
      success: true, 
      message: 'Région supprimée avec succès' 
    };
  } catch (error) {
    console.error('Error in deleteRegion:', error);
    if (error instanceof Error) {
      throw new Error(`Erreur lors de la suppression de la région: ${error.message}`);
    }
    throw error;
  }
}

export async function getRegionsStats() {
  try {
    const sql = `
      SELECT 
        COUNT(*) as total_regions,
        SUM(total_fighters) as total_fighters,
        SUM(total_champions) as total_champions,
        AVG(total_fighters) as avg_fighters_per_region
      FROM regions
    `;
    
    const result = await queryOne<{
      total_regions: string;
      total_fighters: string;
      total_champions: string;
      avg_fighters_per_region: string;
    }>(sql);
    
    return {
      total_regions: parseInt(result?.total_regions ?? '0'),
      total_fighters: parseInt(result?.total_fighters ?? '0'),
      total_champions: parseInt(result?.total_champions ?? '0'),
      avg_fighters_per_region: parseFloat(result?.avg_fighters_per_region ?? '0')
    };
  } catch (error) {
    console.error('Error in getRegionsStats:', error);
    return {
      total_regions: 0,
      total_fighters: 0,
      total_champions: 0,
      avg_fighters_per_region: 0
    };
  }
}

export async function getRegionsForSelect() {
  try {
    const sql = `
      SELECT id, name, code, total_fighters
      FROM regions 
      ORDER BY name ASC
    `;
    
    return await query<{ id: number; name: string; code: string; total_fighters: number }>(sql);
  } catch (error) {
    console.error('Error in getRegionsForSelect:', error);
    return [];
  }
}