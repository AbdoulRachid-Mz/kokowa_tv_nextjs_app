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
      with_fighters = true,
      with_cities = true,
      with_competitions = false,
      fighter_count_min,
      fighter_count_max,
    } = filters;

    let whereClause = 'WHERE 1=1';
    const params: any[] = [];
    const joins: string[] = [];
    const selectFields: string[] = ['r.*'];

    // Filtre de recherche
    if (search) {
      whereClause += ` AND (r.name ILIKE $${params.length + 1} OR r.code ILIKE $${params.length + 2})`;
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm);
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
        (SELECT COUNT(*) FROM fighters f WHERE f.region_id = r.id AND f.is_active = true) as fighter_count,
        (SELECT JSON_AGG(
          JSON_BUILD_OBJECT(
            'id', f.id,
            'first_name', f.first_name,
            'last_name', f.last_name,
            'nickname', f.nickname,
            'ranking', f.ranking,
            'is_champion', f.is_champion
          ) ORDER BY f.ranking
        ) FROM fighters f WHERE f.region_id = r.id AND f.is_active = true LIMIT 5) as top_fighters
      `);
    }

    // Jointure avec les villes si demandée
    if (with_cities) {
      selectFields.push(`
        (SELECT JSON_AGG(
          JSON_BUILD_OBJECT(
            'id', c.id,
            'name', c.name,
            'description', c.description
          ) ORDER BY c.name
        ) FROM cities c WHERE c.region_id = r.id) as cities
      `);
    }

    // Jointure avec les compétitions si demandée
    if (with_competitions) {
      joins.push(`
        LEFT JOIN competitions comp ON comp.region_id = r.id
      `);
      selectFields.push(`
        (SELECT JSON_AGG(
          JSON_BUILD_OBJECT(
            'id', comp.id,
            'name', comp.name,
            'type', comp.type,
            'status', comp.status,
            'start_date', comp.start_date
          ) ORDER BY comp.start_date DESC
        ) FROM competitions comp WHERE comp.region_id = r.id LIMIT 5) as recent_competitions
      `);
    }

    // Requête pour le total
    const countSql = `
      SELECT COUNT(DISTINCT r.id) as total
      FROM regions r
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
      FROM regions r
      ${joins.join(' ')}
      ${whereClause}
      GROUP BY r.id
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
              'is_champion', f.is_champion
            ) ORDER BY f.ranking
          ) FROM fighters f WHERE f.region_id = r.id AND f.is_active = true) as fighters,
          (SELECT JSON_AGG(
            JSON_BUILD_OBJECT(
              'id', c.id,
              'name', c.name,
              'description', c.description
            ) ORDER BY c.name
          ) FROM cities c WHERE c.region_id = r.id) as cities,
          (SELECT JSON_AGG(
            JSON_BUILD_OBJECT(
              'id', comp.id,
              'name', comp.name,
              'type', comp.type,
              'status', comp.status
            ) ORDER BY comp.created_at DESC
          ) FROM competitions comp WHERE comp.region_id = r.id LIMIT 10) as competitions
        FROM regions r
        WHERE r.id = $1
      `;
    }

    const result = await queryOne<Region>(sql, params);
    
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
    return { 
      success: true, 
      id: result[0].id,
      message: 'Région créée avec succès'
    };
  } catch (error) {
    console.error('Error in createRegion:', error);
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
      SET name = $1, code = $2, description = $3, flag_image = $4, color = $5, updated_at = CURRENT_TIMESTAMP
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
    revalidatePath(`/regions/${id}`);
    return { 
      success: true, 
      message: 'Région modifiée avec succès' 
    };
  } catch (error) {
    console.error('Error in updateRegion:', error);
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
        (SELECT COUNT(*) FROM cities WHERE region_id = $1) as city_count,
        (SELECT COUNT(*) FROM competitions WHERE region_id = $1) as competition_count
    `, [id]);

    const counts = relatedData[0];
    if (counts.fighter_count > 0 || counts.city_count > 0 || counts.competition_count > 0) {
      throw new Error(
        `Impossible de supprimer cette région car elle contient des données liées: 
        ${counts.fighter_count} lutteurs, ${counts.city_count} villes, ${counts.competition_count} compétitions`
      );
    }

    const sql = 'DELETE FROM regions WHERE id = $1';
    await query(sql, [id]);
    
    revalidatePath('/regions');
    return { 
      success: true, 
      message: 'Région supprimée avec succès' 
    };
  } catch (error) {
    console.error('Error in deleteRegion:', error);
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
      WHERE total_fighters > 0
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
      WHERE total_fighters > 0
      ORDER BY name ASC
    `;
    
    return await query<{ id: number; name: string; code: string; total_fighters: number }>(sql);
  } catch (error) {
    console.error('Error in getRegionsForSelect:', error);
    return [];
  }
}