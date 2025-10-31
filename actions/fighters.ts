'use server';

import { query, queryOne } from '@/lib/db/neon-client';
import { fighterSchema } from '@/validation/schemas';
import { revalidatePath } from 'next/cache';
import { Fighter, FighterFilters, PaginatedResponse } from '@/types';

// import { query } from "@/lib/neon-client";

export async function getFighters(options: {
  search?: string;
  category_id?: string;
  region_id?: string;
  with_category?: boolean;
  with_region?: boolean;
  limit?: number;
  offset?: number;
}) {
  const {
    search,
    category_id,
    region_id,
    with_category = false,
    with_region = false,
    limit = 20,
    offset = 0,
  } = options;

  let whereClause = "WHERE 1=1";
  let joinClause = "";
  const params: any[] = [];
  const selectFields = ["f.*"];

  // Jointures optionnelles
  if (with_category) {
    joinClause += " LEFT JOIN categories cat ON f.category_id = cat.id";
    selectFields.push(`
      JSON_BUILD_OBJECT(
        'id', cat.id,
        'name', cat.name,
        'weight_min', cat.weight_min,
        'weight_max', cat.weight_max
      ) as category
    `);
  }

  if (with_region) {
    joinClause += " LEFT JOIN regions r ON f.region_id = r.id";
    selectFields.push(`
      JSON_BUILD_OBJECT(
        'id', r.id,
        'name', r.name,
        'code', r.code
      ) as region
    `);
  }

  // Filtres dynamiques
  if (search) {
    params.push(`%${search}%`);
    whereClause += ` AND (f.name ILIKE $${params.length} OR f.surname ILIKE $${params.length})`;
  }

  if (category_id) {
    params.push(category_id);
    whereClause += ` AND f.category_id = $${params.length}`;
  }

  if (region_id) {
    params.push(region_id);
    whereClause += ` AND f.region_id = $${params.length}`;
  }

  // Count
  const countSql = `
    SELECT COUNT(DISTINCT f.id) as total
    FROM fighters f
    ${joinClause}
    ${whereClause}
  `;

  const [{ total }] = await query<{ total: number }>(countSql, params);

  // Data
  params.push(limit, offset);
  const dataSql = `
    SELECT ${selectFields.join(", ")}
    FROM fighters f
    ${joinClause}
    ${whereClause}
    ORDER BY f.created_at DESC
    LIMIT $${params.length - 1} OFFSET $${params.length}
  `;

  const data = await query(dataSql, params);
  return { total, data };
}


export async function getFighterById(id: number, options: { 
  with_relations?: boolean 
} = {}) {
  try {
    const { with_relations = true } = options;
    
    let sql = 'SELECT * FROM fighters WHERE id = $1';
    const params: any[] = [id];

    if (with_relations) {
      sql = `
        SELECT 
          f.*,
          JSON_BUILD_OBJECT(
            'id', r.id,
            'name', r.name,
            'code', r.code,
            'color', r.color
          ) as region,
          JSON_BUILD_OBJECT(
            'id', c.id,
            'name', c.name
          ) as city,
          (SELECT JSON_AGG(
            JSON_BUILD_OBJECT(
              'id', fa.id,
              'title', fa.title,
              'competition', fa.competition,
              'year', fa.year,
              'position', fa.position,
              'description', fa.description,
              'medal_image', fa.medal_image
            ) ORDER BY fa.year DESC
          ) FROM fighter_achievements fa WHERE fa.fighter_id = f.id) as achievements,
          (SELECT JSON_AGG(
            JSON_BUILD_OBJECT(
              'id', ft.id,
              'transfer_date', ft.transfer_date,
              'from_region_id', ft.from_region_id,
              'to_region_id', ft.to_region_id,
              'transfer_fee', ft.transfer_fee,
              'contract_duration', ft.contract_duration,
              'status', ft.status
            ) ORDER BY ft.transfer_date DESC
          ) FROM fighter_transfers ft WHERE ft.fighter_id = f.id) as transfers,
          (SELECT COUNT(*) FROM matches m WHERE (m.fighter1_id = f.id OR m.fighter2_id = f.id) AND m.status = 'completed') as total_matches,
          (SELECT COUNT(*) FROM matches m WHERE m.winner_id = f.id) as wins,
          (SELECT COUNT(*) FROM matches m WHERE m.loser_id = f.id) as losses
        FROM fighters f
        LEFT JOIN regions r ON f.region_id = r.id
        LEFT JOIN cities c ON f.city_id = c.id
        WHERE f.id = $1
      `;
    }

    const result = await queryOne<Fighter>(sql, params);
    
    if (!result) {
      throw new Error('Lutteur non trouvé');
    }
    
    return result;
  } catch (error) {
    console.error('Error in getFighterById:', error);
    throw error;
  }
}

export async function createFighter(formData: FormData) {
  try {
    const rawData = {
      first_name: formData.get('first_name'),
      last_name: formData.get('last_name'),
      nickname: formData.get('nickname'),
      birth_date: formData.get('birth_date'),
      birth_place: formData.get('birth_place'),
      region_id: formData.get('region_id'),
      city_id: formData.get('city_id'),
      height: formData.get('height'),
      weight: formData.get('weight'),
      profile_image: formData.get('profile_image'),
      cover_image: formData.get('cover_image'),
      bio: formData.get('bio'),
      fighting_style: formData.get('fighting_style'),
      debut_year: formData.get('debut_year'),
      ranking: formData.get('ranking'),
      is_active: formData.get('is_active'),
      is_champion: formData.get('is_champion'),
    };

    // Nettoyage des données
    const cleanedData = {
      first_name: rawData.first_name as string,
      last_name: rawData.last_name as string,
      nickname: rawData.nickname as string || undefined,
      birth_date: rawData.birth_date as string || undefined,
      birth_place: rawData.birth_place as string || undefined,
      region_id: rawData.region_id ? Number(rawData.region_id) : undefined,
      city_id: rawData.city_id ? Number(rawData.city_id) : undefined,
      height: rawData.height ? Number(rawData.height) : undefined,
      weight: rawData.weight ? Number(rawData.weight) : undefined,
      profile_image: rawData.profile_image as string || undefined,
      cover_image: rawData.cover_image as string || undefined,
      bio: rawData.bio as string || undefined,
      fighting_style: rawData.fighting_style as string || undefined,
      debut_year: rawData.debut_year ? Number(rawData.debut_year) : undefined,
      ranking: rawData.ranking ? Number(rawData.ranking) : 999,
      is_active: rawData.is_active === 'true',
      is_champion: rawData.is_champion === 'true',
    };

    const validatedData = fighterSchema.parse(cleanedData);

    const sql = `
      INSERT INTO fighters (
        first_name, last_name, nickname, birth_date, birth_place, 
        region_id, city_id, height, weight, profile_image, cover_image,
        bio, fighting_style, debut_year, ranking, is_active, is_champion
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      RETURNING id
    `;
    
    const result = await query<{ id: number }>(sql, [
      validatedData.first_name,
      validatedData.last_name,
      validatedData.nickname || null,
      validatedData.birth_date || null,
      validatedData.birth_place || null,
      validatedData.region_id || null,
      validatedData.city_id || null,
      validatedData.height || null,
      validatedData.weight || null,
      validatedData.profile_image || null,
      validatedData.cover_image || null,
      validatedData.bio || null,
      validatedData.fighting_style || null,
      validatedData.debut_year || null,
      validatedData.ranking ?? null,
      validatedData.is_active,
      validatedData.is_champion,
    ]);

    // Mettre à jour le compteur de la région
    if (validatedData.region_id) {
      await query(`
        UPDATE regions 
        SET total_fighters = (
          SELECT COUNT(*) FROM fighters WHERE region_id = $1 AND is_active = true
        )
        WHERE id = $1
      `, [validatedData.region_id]);
    }

    revalidatePath('/fighters');
    return { 
      success: true, 
      id: result[0].id,
      message: 'Lutteur créé avec succès'
    };
  } catch (error) {
    console.error('Error in createFighter:', error);
    throw new Error('Erreur lors de la création du lutteur');
  }
}

export async function updateFighter(id: number, formData: FormData) {
  try {
    const existing = await getFighterById(id, { with_relations: false });
    if (!existing) {
      throw new Error('Lutteur non trouvé');
    }

    const rawData = {
      first_name: formData.get('first_name'),
      last_name: formData.get('last_name'),
      nickname: formData.get('nickname'),
      birth_date: formData.get('birth_date'),
      birth_place: formData.get('birth_place'),
      region_id: formData.get('region_id'),
      city_id: formData.get('city_id'),
      height: formData.get('height'),
      weight: formData.get('weight'),
      profile_image: formData.get('profile_image'),
      cover_image: formData.get('cover_image'),
      bio: formData.get('bio'),
      fighting_style: formData.get('fighting_style'),
      debut_year: formData.get('debut_year'),
      ranking: formData.get('ranking'),
      is_active: formData.get('is_active'),
      is_champion: formData.get('is_champion'),
    };

    const cleanedData = {
      first_name: rawData.first_name as string,
      last_name: rawData.last_name as string,
      nickname: rawData.nickname as string || undefined,
      birth_date: rawData.birth_date as string || undefined,
      birth_place: rawData.birth_place as string || undefined,
      region_id: rawData.region_id ? Number(rawData.region_id) : undefined,
      city_id: rawData.city_id ? Number(rawData.city_id) : undefined,
      height: rawData.height ? Number(rawData.height) : undefined,
      weight: rawData.weight ? Number(rawData.weight) : undefined,
      profile_image: rawData.profile_image as string || undefined,
      cover_image: rawData.cover_image as string || undefined,
      bio: rawData.bio as string || undefined,
      fighting_style: rawData.fighting_style as string || undefined,
      debut_year: rawData.debut_year ? Number(rawData.debut_year) : undefined,
      ranking: rawData.ranking ? Number(rawData.ranking) : existing.ranking,
      is_active: rawData.is_active === 'true',
      is_champion: rawData.is_champion === 'true',
    };

    const validatedData = fighterSchema.parse(cleanedData);

    const sql = `
      UPDATE fighters 
      SET 
        first_name = $1, last_name = $2, nickname = $3, birth_date = $4, 
        birth_place = $5, region_id = $6, city_id = $7, height = $8, 
        weight = $9, profile_image = $10, cover_image = $11, bio = $12, 
        fighting_style = $13, debut_year = $14, ranking = $15, 
        is_active = $16, is_champion = $17, updated_at = CURRENT_TIMESTAMP
      WHERE id = $18
    `;
    
    await query(sql, [
      validatedData.first_name,
      validatedData.last_name,
      validatedData.nickname || null,
      validatedData.birth_date || null,
      validatedData.birth_place || null,
      validatedData.region_id || null,
      validatedData.city_id || null,
      validatedData.height || null,
      validatedData.weight || null,
      validatedData.profile_image || null,
      validatedData.cover_image || null,
      validatedData.bio || null,
      validatedData.fighting_style || null,
      validatedData.debut_year || null,
      validatedData.ranking ?? null,
      validatedData.is_active,
      validatedData.is_champion,
      id,
    ]);

    // Mettre à jour les compteurs des régions si nécessaire
    if (validatedData.region_id !== existing.region_id) {
      if (existing.region_id) {
        await query(`
          UPDATE regions 
          SET total_fighters = (
            SELECT COUNT(*) FROM fighters WHERE region_id = $1 AND is_active = true
          )
          WHERE id = $1
        `, [existing.region_id]);
      }
      if (validatedData.region_id) {
        await query(`
          UPDATE regions 
          SET total_fighters = (
            SELECT COUNT(*) FROM fighters WHERE region_id = $1 AND is_active = true
          )
          WHERE id = $1
        `, [validatedData.region_id]);
      }
    }

    revalidatePath('/fighters');
    revalidatePath(`/fighters/${id}`);
    return { 
      success: true, 
      message: 'Lutteur modifié avec succès' 
    };
  } catch (error) {
    console.error('Error in updateFighter:', error);
    throw error;
  }
}

export async function deleteFighter(id: number) {
  try {
    const existing = await getFighterById(id, { with_relations: false });
    if (!existing) {
      throw new Error('Lutteur non trouvé');
    }

    // Vérifier les données liées
    const relatedData = await query(`
      SELECT 
        (SELECT COUNT(*) FROM fighter_achievements WHERE fighter_id = $1) as achievement_count,
        (SELECT COUNT(*) FROM fighter_transfers WHERE fighter_id = $1) as transfer_count,
        (SELECT COUNT(*) FROM matches WHERE fighter1_id = $1 OR fighter2_id = $1) as match_count
    `, [id]);

    const counts = relatedData[0];
    if (counts.match_count > 0) {
      throw new Error(
        `Impossible de supprimer ce lutteur car il est lié à ${counts.match_count} match(s)`
      );
    }

    const sql = 'DELETE FROM fighters WHERE id = $1';
    await query(sql, [id]);

    // Mettre à jour le compteur de la région
    if (existing.region_id) {
      await query(`
        UPDATE regions 
        SET total_fighters = (
          SELECT COUNT(*) FROM fighters WHERE region_id = $1 AND is_active = true
        )
        WHERE id = $1
      `, [existing.region_id]);
    }
    
    revalidatePath('/fighters');
    return { 
      success: true, 
      message: 'Lutteur supprimé avec succès' 
    };
  } catch (error) {
    console.error('Error in deleteFighter:', error);
    throw new Error('Erreur lors de la suppression du lutteur');
  }
}

export async function getFighterStats() {
  try {
    const sql = `
      SELECT 
        COUNT(*) as total_fighters,
        COUNT(*) FILTER (WHERE is_active = true) as active_fighters,
        COUNT(*) FILTER (WHERE is_champion = true) as champions,
        AVG(ranking) as avg_ranking,
        AVG(weight) as avg_weight,
        AVG(height) as avg_height,
        MIN(debut_year) as oldest_debut,
        MAX(debut_year) as newest_debut
      FROM fighters
      WHERE is_active = true
    `;
    
    const result = await queryOne<{
      total_fighters: string;
      active_fighters: string;
      champions: string;
      avg_ranking: string;
      avg_weight: string;
      avg_height: string;
      oldest_debut: string;
      newest_debut: string;
    }>(sql);
    
    return {
      total_fighters: parseInt(result?.total_fighters ?? '0'),
      active_fighters: parseInt(result?.active_fighters ?? '0'),
      champions: parseInt(result?.champions ?? '0'),
      avg_ranking: parseFloat(result?.avg_ranking ?? '0'),
      avg_weight: parseFloat(result?.avg_weight ?? '0'),
      avg_height: parseFloat(result?.avg_height ?? '0'),
      oldest_debut: parseInt(result?.oldest_debut ?? '0'),
      newest_debut: parseInt(result?.newest_debut ?? '0'),
    };
  } catch (error) {
    console.error('Error in getFighterStats:', error);
    return {
      total_fighters: 0,
      active_fighters: 0,
      champions: 0,
      avg_ranking: 0,
      avg_weight: 0,
      avg_height: 0,
      oldest_debut: 0,
      newest_debut: 0,
    };
  }
}