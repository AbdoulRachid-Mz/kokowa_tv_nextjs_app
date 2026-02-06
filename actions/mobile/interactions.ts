// @/actions/mobile/interactions.ts
'use server';

import { query } from '@/lib/db/neon-client';
import { EntityType, InteractionType } from '@/types';

export interface MobileInteractionFilters {
  userId?: number;
  entityType?: string;
  entityId?: number;
  interactionType?: InteractionType;
  page?: number;
  limit?: number;
  withUser?: boolean;
}

export async function getMobileInteractions(filters: MobileInteractionFilters = {}) {
  try {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const offset = (page - 1) * limit;

    // Construire la clause WHERE dynamiquement
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (filters.userId) {
      conditions.push(`i.user_id = $${paramIndex}`);
      params.push(filters.userId);
      paramIndex++;
    }

    if (filters.entityType) {
      conditions.push(`i.entity_type = $${paramIndex}`);
      params.push(filters.entityType);
      paramIndex++;
    }

    if (filters.entityId) {
      conditions.push(`i.entity_id = $${paramIndex}`);
      params.push(filters.entityId);
      paramIndex++;
    }

    if (filters.interactionType) {
      conditions.push(`i.interaction_type = $${paramIndex}`);
      params.push(filters.interactionType);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Obtenir le total
    const countSql = `
      SELECT COUNT(*) as total
      FROM interactions i
      ${whereClause}
    `;

    const countResult = await query<{ total: string }>(countSql, params);
    const total = parseInt(countResult[0]?.total || '0');

    // Construire les champs de sélection
    const selectFields = [
      'i.id',
      'i.user_id as "userId"',
      'i.entity_type as "entityType"',
      'i.entity_id as "entityId"',
      'i.interaction_type as "interactionType"',
      'i.created_at as "createdAt"'
    ];

    if (filters.withUser !== false) {
      selectFields.push(`
        JSON_BUILD_OBJECT(
          'id', u.id,
          'username', u.username,
          'firstName', u.first_name,
          'lastName', u.last_name,
          'profilePicture', u.profile_picture
        ) as user
      `);
    }

    // Requête principale
    const interactionsSql = `
      SELECT ${selectFields.join(', ')}
      FROM interactions i
      ${filters.withUser !== false ? 'LEFT JOIN users u ON i.user_id = u.id' : ''}
      ${whereClause}
      ORDER BY i.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    params.push(limit, offset);
    const interactions = await query(interactionsSql, params);

    // Calculer la pagination
    const totalPages = Math.ceil(total / limit);

    return {
      success: true,
      data: {
        interactions,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        },
        timestamp: new Date().toISOString()
      },
      message: 'Interactions récupérées avec succès'
    };
  } catch (error) {
    console.error('Error in getMobileInteractions:', error);
    return {
      success: false,
      error: {
        code: 500,
        message: 'Erreur lors de la récupération des interactions',
        timestamp: new Date().toISOString()
      }
    };
  }
}

export async function getMobileInteractionById(id: number, withUser: boolean = true) {
  try {
    // Vérifier si l'interaction existe
    const existsSql = 'SELECT id FROM interactions WHERE id = $1';
    const existsResult = await query(existsSql, [id]);

    if (existsResult.length === 0) {
      return {
        success: false,
        error: {
          code: 404,
          message: 'Interaction non trouvée',
          timestamp: new Date().toISOString()
        }
      };
    }

    // Construire les champs de sélection
    const selectFields = [
      'i.id',
      'i.user_id as "userId"',
      'i.entity_type as "entityType"',
      'i.entity_id as "entityId"',
      'i.interaction_type as "interactionType"',
      'i.created_at as "createdAt"'
    ];

    if (withUser) {
      selectFields.push(`
        JSON_BUILD_OBJECT(
          'id', u.id,
          'username', u.username,
          'firstName', u.first_name,
          'lastName', u.last_name,
          'profilePicture', u.profile_picture
        ) as user
      `);
    }

    // Requête pour obtenir l'interaction
    const interactionSql = `
      SELECT ${selectFields.join(', ')}
      FROM interactions i
      ${withUser ? 'LEFT JOIN users u ON i.user_id = u.id' : ''}
      WHERE i.id = $1
    `;

    const result = await query(interactionSql, [id]);
    const interaction = result[0];

    return {
      success: true,
      data: {
        interaction,
        timestamp: new Date().toISOString()
      },
      message: 'Interaction récupérée avec succès'
    };
  } catch (error) {
    console.error('Error in getMobileInteractionById:', error);
    return {
      success: false,
      error: {
        code: 500,
        message: 'Erreur lors de la récupération de l\'interaction',
        timestamp: new Date().toISOString()
      }
    };
  }
}

export async function createMobileInteraction(formData: any) {
  try {
    const rawData = {
      userId: formData.userId,
      entityType: formData.entityType,
      entityId: formData.entityId,
      interactionType: formData.interactionType
    };

    // Validation des données
    if (!rawData.userId || !rawData.entityType || !rawData.entityId || !rawData.interactionType) {
      return {
        success: false,
        error: {
          code: 400,
          message: 'Tous les champs sont requis: userId, entityType, entityId, interactionType',
          timestamp: new Date().toISOString()
        }
      };
    }

    // Vérifier si l'interaction existe déjà
    const checkSql = `
      SELECT id FROM interactions 
      WHERE user_id = $1 
        AND entity_type = $2 
        AND entity_id = $3 
        AND interaction_type = $4
    `;

    const existing = await query(checkSql, [
      rawData.userId as string,
      rawData.entityType as string,
      rawData.entityId as string,
      rawData.interactionType as string
    ]);

    if (existing.length > 0) {
      return {
        success: true,
        data: {
          interaction: existing[0],
          message: 'Interaction déjà existante'
        },
        message: 'Interaction déjà existante'
      };
    }

    // Créer l'interaction
    const insertSql = `
      INSERT INTO interactions (user_id, entity_type, entity_id, interaction_type)
      VALUES ($1, $2, $3, $4)
      RETURNING 
        id,
        user_id as "userId",
        entity_type as "entityType",
        entity_id as "entityId",
        interaction_type as "interactionType",
        created_at as "createdAt"
    `;

    const result = await query(insertSql, [
      rawData.userId as string,
      rawData.entityType as EntityType,
      rawData.entityId as string,
      rawData.interactionType as InteractionType
    ]);

    const interaction = result[0];

    // Mettre à jour les compteurs selon le type d'entité
    await updateEntityInteractionCount(
      rawData.entityType as EntityType,
      parseInt(rawData.entityId as string),
      rawData.interactionType as InteractionType,
      'increment'
    );

    return {
      success: true,
      data: {
        interaction,
        timestamp: new Date().toISOString()
      },
      message: 'Interaction créée avec succès'
    };
  } catch (error) {
    console.error('Error in createMobileInteraction:', error);
    return {
      success: false,
      error: {
        code: 500,
        message: 'Erreur lors de la création de l\'interaction',
        timestamp: new Date().toISOString()
      }
    };
  }
}

export async function deleteMobileInteraction(id: number) {
  try {
    // Récupérer l'interaction pour avoir les informations
    const interactionSql = `
      SELECT 
        id,
        user_id as "userId",
        entity_type as "entityType",
        entity_id as "entityId",
        interaction_type as "interactionType"
      FROM interactions 
      WHERE id = $1
    `;

    const result = await query(interactionSql, [id]);

    if (result.length === 0) {
      return {
        success: false,
        error: {
          code: 404,
          message: 'Interaction non trouvée',
          timestamp: new Date().toISOString()
        }
      };
    }

    const interaction = result[0];

    // Supprimer l'interaction
    const deleteSql = 'DELETE FROM interactions WHERE id = $1';
    await query(deleteSql, [id]);

    // Mettre à jour les compteurs
    await updateEntityInteractionCount(
      interaction.entityType,
      interaction.entityId,
      interaction.interactionType,
      'decrement'
    );

    return {
      success: true,
      data: {
        deletedId: id,
        timestamp: new Date().toISOString()
      },
      message: 'Interaction supprimée avec succès'
    };
  } catch (error) {
    console.error('Error in deleteMobileInteraction:', error);
    return {
      success: false,
      error: {
        code: 500,
        message: 'Erreur lors de la suppression de l\'interaction',
        timestamp: new Date().toISOString()
      }
    };
  }
}

export async function getMobileUserInteractions(userId: number, filters: Omit<MobileInteractionFilters, 'userId'> = {}) {
  return getMobileInteractions({ ...filters, userId });
}

export async function isUserInteractionEntity(
  userId: number,
  entityType: EntityType,
  entityId: number,
  interactionType?: InteractionType
): Promise<boolean> {
  try {
    const conditions: string[] = ['user_id = $1', 'entity_type = $2', 'entity_id = $3'];
    const params: any[] = [userId, entityType, entityId];

    if (interactionType) {
      conditions.push('interaction_type = $4');
      params.push(interactionType);
    }

    const sql = `
      SELECT 1
      FROM interactions
      WHERE ${conditions.join(' AND ')}
      LIMIT 1
    `;

    const result = await query(sql, params);
    return result.length > 0;
  } catch (error) {
    console.error('Error in isUserInteractionEntity:', error);
    return false;
  }
}

// get entity interactions number
export async function getMobileEntityInteractionsCount(entityType: EntityType, entityId: number, interactionType?: InteractionType) {
  try {
    const conditions: string[] = ['entity_type = $1', 'entity_id = $2'];
    const params: any[] = [entityType, entityId];

    if (interactionType) {
      conditions.push('interaction_type = $3');
      params.push(interactionType);
    }

    const sql = `
      SELECT COUNT(*) as "count"
      FROM interactions
      WHERE ${conditions.join(' AND ')}
    `;

    const result = await query(sql, params);
    return parseInt(result[0].count);
  } catch (error) {
    console.error('Error in getMobileEntityInteractionsCount:', error);
    return 0;
  }
}

export async function getMobileEntityInteractions(entityType: string, entityId: number, filters: Omit<MobileInteractionFilters, 'entityType' | 'entityId'> = {}) {
  return getMobileInteractions({ ...filters, entityType, entityId });
}

export async function getMobileInteractionStats(entityType?: string, entityId?: number) {
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
        entity_type as "entityType",
        interaction_type as "interactionType",
        COUNT(*) as "count",
        COUNT(DISTINCT user_id) as "uniqueUsers"
      FROM interactions
      ${whereClause}
      GROUP BY entity_type, interaction_type
      ORDER BY entity_type, count DESC
    `;

    const result = await query(sql, params);

    return {
      success: true,
      data: {
        stats: result,
        timestamp: new Date().toISOString()
      },
      message: 'Statistiques récupérées avec succès'
    };
  } catch (error) {
    console.error('Error in getMobileInteractionStats:', error);
    return {
      success: false,
      error: {
        code: 500,
        message: 'Erreur lors de la récupération des statistiques',
        timestamp: new Date().toISOString()
      }
    };
  }
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
        // Pour les lutteurs, on pourrait mettre à jour des statistiques spécifiques
        if (interactionType === 'follow') {
          updateSql = `
            UPDATE fighters 
            SET social_links = COALESCE(social_links, '{}'::jsonb) || 
              jsonb_build_object('followers', 
                COALESCE((social_links->>'followers')::int, 0) + $1
              )
            WHERE id = $2
          `;
        }
        break;
    }

    if (updateSql) {
      await query(updateSql, [value, entityId]);
    }
  } catch (error) {
    console.error('Error updating entity interaction count:', error);
  }
}