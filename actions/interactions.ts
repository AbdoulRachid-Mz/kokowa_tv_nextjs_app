// @/actions/interactions.ts
'use server';

import { query, queryOne } from '@/lib/db/neon-client';
import { interactionSchema } from '@/validation/schemas';
import { revalidatePath } from 'next/cache';
import { Interaction, InteractionFilters, PaginatedResponse } from '@/types';

export async function getInteractions(
  filters: InteractionFilters = {}
): Promise<PaginatedResponse<Interaction>> {
  try {
    const {
      user_id,
      entity_type,
      entity_id,
      interaction_type,
      search = '',
      page = 1,
      limit = 20,
      with_user = true,
    } = filters;

    let whereClause = 'WHERE 1=1';
    const params: any[] = [];
    const selectFields: string[] = ['i.*'];
    const joins: string[] = [];

    // Filtres de base
    if (user_id) {
      whereClause += ` AND i.user_id = $${params.length + 1}`;
      params.push(user_id);
    }

    if (entity_type) {
      whereClause += ` AND i.entity_type = $${params.length + 1}`;
      params.push(entity_type);
    }

    if (entity_id) {
      whereClause += ` AND i.entity_id = $${params.length + 1}`;
      params.push(entity_id);
    }

    if (interaction_type) {
      whereClause += ` AND i.interaction_type = $${params.length + 1}`;
      params.push(interaction_type);
    }

    // Jointures pour les relations
    if (with_user) {
      selectFields.push(`
        JSON_BUILD_OBJECT(
          'id', u.id,
          'username', u.username,
          'first_name', u.first_name,
          'last_name', u.last_name,
          'profile_picture', u.profile_picture
        ) as user
      `);
      joins.push('LEFT JOIN users u ON i.user_id = u.id');
    }

    // Requête pour le total
    const countSql = `
      SELECT COUNT(*) as total
      FROM interactions i
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
      FROM interactions i
      ${joins.join(' ')}
      ${whereClause}
      ORDER BY i.created_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;

    const data = await query<Interaction>(
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
    console.error('Error in getInteractions:', error);
    throw new Error('Erreur lors de la récupération des interactions');
  }
}

export async function getInteractionById(id: number, options: { 
  with_relations?: boolean 
} = {}) {
  try {
    const { with_relations = true } = options;
    
    let sql = 'SELECT * FROM interactions WHERE id = $1';
    const params: any[] = [id];

    if (with_relations) {
      sql = `
        SELECT 
          i.*,
          JSON_BUILD_OBJECT(
            'id', u.id,
            'username', u.username,
            'first_name', u.first_name,
            'last_name', u.last_name,
            'profile_picture', u.profile_picture
          ) as user
        FROM interactions i
        LEFT JOIN users u ON i.user_id = u.id
        WHERE i.id = $1
      `;
    }

    const result = await queryOne<Interaction>(sql, params);
    
    if (!result) {
      throw new Error('Interaction non trouvée');
    }
    
    return result;
  } catch (error) {
    console.error('Error in getInteractionById:', error);
    throw error;
  }
}

export async function createInteraction(formData: FormData) {
  try {
    const rawData = {
      user_id: formData.get('user_id'),
      entity_type: formData.get('entity_type'),
      entity_id: formData.get('entity_id'),
      interaction_type: formData.get('interaction_type'),
    };

    const cleanedData = {
      user_id: Number("user_id"),
      entity_type: rawData.entity_type as string,
      entity_id: Number(rawData.entity_id),
      interaction_type: rawData.interaction_type as 'like' | 'view' | 'share' | 'bookmark' | 'follow',
    };
    // console.log(cleanedData)

    const validatedData = interactionSchema.parse(cleanedData);

    const sql = `
      INSERT INTO interactions (
        user_id, entity_type, entity_id, interaction_type
      ) VALUES ($1, $2, $3, $4)
      ON CONFLICT (user_id, entity_type, entity_id, interaction_type) 
      DO UPDATE SET created_at = CURRENT_TIMESTAMP
      RETURNING id
    `;
    
    const result = await query<{ id: number }>(sql, [
      validatedData.user_id,
      validatedData.entity_type,
      validatedData.entity_id,
      validatedData.interaction_type,
    ]);

    // Mettre à jour les compteurs selon le type d'entité
    await updateEntityInteractionCount(
      validatedData.entity_type,
      validatedData.entity_id,
      validatedData.interaction_type,
      'increment'
    );

    revalidatePath('/interactions');
    return { 
      success: true, 
      id: result[0].id,
      message: 'Interaction créée avec succès'
    };
  } catch (error) {
    console.error('Error in createInteraction:', error);
    throw new Error('Erreur lors de la création de l\'interaction');
  }
}

export async function deleteInteraction(id: number) {
  try {
    const existing = await getInteractionById(id, { with_relations: false });
    if (!existing) {
      throw new Error('Interaction non trouvée');
    }

    const sql = 'DELETE FROM interactions WHERE id = $1';
    await query(sql, [id]);

    // Mettre à jour les compteurs
    await updateEntityInteractionCount(
      existing.entity_type,
      existing.entity_id,
      existing.interaction_type,
      'decrement'
    );
    
    revalidatePath('/interactions');
    return { 
      success: true, 
      message: 'Interaction supprimée avec succès' 
    };
  } catch (error) {
    console.error('Error in deleteInteraction:', error);
    throw new Error('Erreur lors de la suppression de l\'interaction');
  }
}

export async function getUserInteractions(userId: number, filters: Omit<InteractionFilters, 'user_id'> = {}) {
  return getInteractions({ ...filters, user_id: userId });
}

export async function getEntityInteractions(entityType: string, entityId: number, filters: Omit<InteractionFilters, 'entity_type' | 'entity_id'> = {}) {
  return getInteractions({ ...filters, entity_type: entityType, entity_id: entityId });
}

// Fonction utilitaire pour mettre à jour les compteurs d'interactions
async function updateEntityInteractionCount(
  entityType: string,
  entityId: number,
  interactionType: string,
  operation: 'increment' | 'decrement'
) {
  try {
    const value = operation === 'increment' ? 1 : -1;
    let updateSql = '';

    switch (entityType) {
      case 'article':
        if (interactionType === 'like') {
          updateSql = `
            UPDATE articles 
            SET like_count = GREATEST(0, like_count + $1)
            WHERE id = $2
          `;
        } else if (interactionType === 'view') {
          updateSql = `
            UPDATE articles 
            SET view_count = GREATEST(0, view_count + $1)
            WHERE id = $2
          `;
        }
        break;

      case 'video':
        if (interactionType === 'like') {
          updateSql = `
            UPDATE videos 
            SET like_count = GREATEST(0, like_count + $1)
            WHERE id = $2
          `;
        } else if (interactionType === 'view') {
          updateSql = `
            UPDATE videos 
            SET view_count = GREATEST(0, view_count + $1)
            WHERE id = $2
          `;
        }
        break;

      case 'fighter':
        // Mettre à jour les statistiques des lutteurs si nécessaire
        break;

      case 'match':
        // Mettre à jour les statistiques des matchs si nécessaire
        break;
    }

    if (updateSql) {
      await query(updateSql, [value, entityId]);
    }
  } catch (error) {
    console.error('Error updating entity interaction count:', error);
  }
}

// Statistiques d'interactions
export async function getInteractionStats(entityType?: string, entityId?: number) {
  try {
    let whereClause = '';
    const params: any[] = [];

    if (entityType && entityId) {
      whereClause = 'WHERE entity_type = $1 AND entity_id = $2';
      params.push(entityType, entityId);
    } else if (entityType) {
      whereClause = 'WHERE entity_type = $1';
      params.push(entityType);
    }

    const sql = `
      SELECT 
        interaction_type,
        COUNT(*) as count,
        COUNT(DISTINCT user_id) as unique_users
      FROM interactions
      ${whereClause}
      GROUP BY interaction_type
      ORDER BY count DESC
    `;

    const result = await query<{
      interaction_type: string;
      count: string;
      unique_users: string;
    }>(sql, params);

    return result.reduce((acc, row) => {
      acc[row.interaction_type] = {
        count: parseInt(row.count),
        unique_users: parseInt(row.unique_users)
      };
      return acc;
    }, {} as Record<string, { count: number; unique_users: number }>);
  } catch (error) {
    console.error('Error in getInteractionStats:', error);
    return {};
  }
}