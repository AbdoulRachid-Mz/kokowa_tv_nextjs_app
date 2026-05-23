// @/actions/fighter-cards.ts
'use server';

import { query, queryOne } from '@/lib/db/neon-client';
import { fighterCardSchema } from '@/validation/schemas';
import { revalidatePath, cacheTag, updateTag, cacheLife } from 'next/cache';
import { FighterCard, FighterCardFilters, PaginatedResponse } from '@/types';

export async function getFighterCards(
  filters: FighterCardFilters = {}
): Promise<PaginatedResponse<FighterCard>> {
  // "use cache";
  // // cacheTag("cards"); 
  // cacheLife({
  //   stale: 3600, // 1 hour until considered stale
  //   revalidate: 7200, // 2 hours until revalidated
  //   expire: 86400, // 1 day until expired
  // })  
  try {
    const {
      fighter_id,
      match_id,
      card_type,
      is_cancelled,
      search = '',
      page = 1,
      limit = 20,
      with_fighter = true,
      with_match = true,
    } = filters;

    let whereClause = 'WHERE 1=1';
    const params: any[] = [];
    const selectFields: string[] = ['fc.*'];
    const joins: string[] = [];

    // Filtres de base
    if (fighter_id) {
      whereClause += ` AND fc.fighter_id = $${params.length + 1}`;
      params.push(fighter_id);
    }

    if (match_id) {
      whereClause += ` AND fc.match_id = $${params.length + 1}`;
      params.push(match_id);
    }

    if (card_type) {
      whereClause += ` AND fc.card_type = $${params.length + 1}`;
      params.push(card_type);
    }

    if (is_cancelled !== undefined) {
      whereClause += ` AND fc.is_cancelled = $${params.length + 1}`;
      params.push(is_cancelled);
    }

    // Jointures pour les relations
    if (with_fighter) {
      selectFields.push(`
        JSON_BUILD_OBJECT(
          'id', f.id,
          'first_name', f.first_name,
          'last_name', f.last_name,
          'nickname', f.nickname,
          'profile_image', f.profile_image
        ) as fighter
      `);
      joins.push('LEFT JOIN fighters f ON fc.fighter_id = f.id');
    }

    if (with_match) {
      selectFields.push(`
        JSON_BUILD_OBJECT(
          'id', m.id,
          'match_number', m.match_number,
          'status', m.status
        ) as match
      `);
      joins.push('LEFT JOIN matches m ON fc.match_id = m.id');
    }

    // Requête pour le total
    const countSql = `
      SELECT COUNT(*) as total
      FROM fighter_cards fc
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
      FROM fighter_cards fc
      ${joins.join(' ')}
      ${whereClause}
      ORDER BY fc.created_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;

    const data = await query<FighterCard>(
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
    console.error('Error in getFighterCards:', error);
    throw new Error('Erreur lors de la récupération des cartons');
  }
}

export async function getFighterCardById(id: number, options: { 
  with_relations?: boolean 
} = {}) {
  // "use cache";
  // // cacheTag("cards", `card:${id}`);
  // cacheLife({
  //   stale: 3600, // 1 hour until considered stale
  //   revalidate: 7200, // 2 hours until revalidated
  //   expire: 86400, // 1 day until expired
  // })  
  try {
    const { with_relations = true } = options;
    
    let sql = 'SELECT * FROM fighter_cards WHERE id = $1';
    const params: any[] = [id];

    if (with_relations) {
      sql = `
        SELECT 
          fc.*,
          JSON_BUILD_OBJECT(
            'id', f.id,
            'first_name', f.first_name,
            'last_name', f.last_name,
            'nickname', f.nickname,
            'profile_image', f.profile_image
          ) as fighter,
          JSON_BUILD_OBJECT(
            'id', m.id,
            'match_number', m.match_number,
            'status', m.status
          ) as match
        FROM fighter_cards fc
        LEFT JOIN fighters f ON fc.fighter_id = f.id
        LEFT JOIN matches m ON fc.match_id = m.id
        WHERE fc.id = $1
      `;
    }

    const result = await queryOne<FighterCard>(sql, params);
    
    if (!result) {
      throw new Error('Carton non trouvé');
    }
    
    return result;
  } catch (error) {
    console.error('Error in getFighterCardById:', error);
    throw error;
  }
}

export async function createFighterCard(formData: FormData) {
  try {
    const rawData = {
      fighter_id: formData.get('fighter_id'),
      match_id: formData.get('match_id'),
      card_type: formData.get('card_type'),
      card_reason: formData.get('card_reason'),
      minute_given: formData.get('minute_given'),
    };

    const cleanedData = {
      fighter_id: Number(rawData.fighter_id),
      match_id: Number(rawData.match_id),
      card_type: rawData.card_type as 'yellow' | 'red',
      card_reason: rawData.card_reason as string || undefined,
      minute_given: rawData.minute_given as string || undefined,
    };

    const validatedData = fighterCardSchema.parse(cleanedData);

    const sql = `
      INSERT INTO fighter_cards (
        fighter_id, match_id, card_type, card_reason, minute_given
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING id
    `;
    
    const result = await query<{ id: number }>(sql, [
      validatedData.fighter_id,
      validatedData.match_id,
      validatedData.card_type,
      validatedData.card_reason || null,
      validatedData.minute_given || null,
    ]);

    revalidatePath('/matches');
    revalidatePath(`/matches/${validatedData.match_id}`);
    return { 
      success: true, 
      id: result[0].id,
      message: 'Carton créé avec succès'
    };
  } catch (error) {
    console.error('Error in createFighterCard:', error);
    throw new Error('Erreur lors de la création du carton');
  }
}

export async function updateFighterCard(id: number, formData: FormData) {
  try {
    const existing = await getFighterCardById(id, { with_relations: false });
    if (!existing) {
      throw new Error('Carton non trouvé');
    }

    const rawData = {
      card_type: formData.get('card_type'),
      card_reason: formData.get('card_reason'),
      minute_given: formData.get('minute_given'),
      is_cancelled: formData.get('is_cancelled'),
    };

    const cleanedData = {
      card_type: rawData.card_type as 'yellow' | 'red',
      card_reason: rawData.card_reason as string || undefined,
      minute_given: rawData.minute_given as string || undefined,
      is_cancelled: rawData.is_cancelled === 'true',
    };

    const validatedData = fighterCardSchema.partial().parse(cleanedData);

    const sql = `
      UPDATE fighter_cards 
      SET 
        card_type = $1, card_reason = $2, minute_given = $3, is_cancelled = $4
      WHERE id = $5
    `;
    
    await query(sql, [
      validatedData.card_type || existing.card_type,
      validatedData.card_reason ?? existing.card_reason ?? null,
      validatedData.minute_given ?? existing.minute_given ?? null,
      validatedData.is_cancelled ?? existing.is_cancelled ?? false,
      id,
    ]);

    revalidatePath('/matches');
    revalidatePath(`/matches/${existing.match_id}`);
    revalidatePath(`/fighter-cards/${id}`);
    return { 
      success: true, 
      message: 'Carton modifié avec succès' 
    };
  } catch (error) {
    console.error('Error in updateFighterCard:', error);
    throw error;
  }
}

export async function deleteFighterCard(id: number, {revalidate = true}: {revalidate?: boolean} = {}) {
  try {
    const existing = await getFighterCardById(id, { with_relations: false });
    if (!existing) {
      throw new Error('Carton non trouvé');
    }

    const sql = 'DELETE FROM fighter_cards WHERE id = $1';
    await query(sql, [id]);
    
    if(revalidate) {
      revalidatePath('/matches');
      revalidatePath(`/matches/${existing.match_id}`);
      revalidatePath(`/fighter-cards/${id}`);
    }
    return { 
      success: true, 
      message: 'Carton supprimé avec succès' 
    };
  } catch (error) {
    console.error('Error in deleteFighterCard:', error);
    throw new Error('Erreur lors de la suppression du carton');
  }
}

export async function getMatchCards(matchId: number) {
  // "use cache";
  // // cacheTag("cards", `match:${matchId}`);
  // cacheLife({
  //   stale: 3600, // 1 hour until considered stale
  //   revalidate: 7200, // 2 hours until revalidated
  //   expire: 86400, // 1 day until expired
  // })  
  try {
    const sql = `
      SELECT 
        fc.*,
        JSON_BUILD_OBJECT(
          'id', f.id,
          'first_name', f.first_name,
          'last_name', f.last_name,
          'nickname', f.nickname,
          'profile_image', f.profile_image
        ) as fighter
      FROM fighter_cards fc
      LEFT JOIN fighters f ON fc.fighter_id = f.id
      WHERE fc.match_id = $1 AND fc.is_cancelled = false
      ORDER BY fc.minute_given ASC
    `;

    const result = await query<FighterCard>(sql, [matchId]);
    return result;
  } catch (error) {
    console.error('Error in getMatchCards:', error);
    throw new Error('Erreur lors de la récupération des cartons du match');
  }
}