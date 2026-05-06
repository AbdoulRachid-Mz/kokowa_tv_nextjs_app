// @/actions/mobile/interactions.ts
'use server';

import { query } from '@/lib/db/neon-client';
import { EntityType, InteractionType } from '@/types';

export interface MobileInteractionFilters {
  authId?: string;
  entityType?: string;
  entityId?: number;
  interactionType?: InteractionType;
  page?: number;
  limit?: number;
  withUser?: boolean;
}

export async function getMobileInteractions(
  filters: MobileInteractionFilters & { authId?: string } = {}
) {
  try {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const offset = (page - 1) * limit;

    // 🔹 Mobile = like par défaut
    const interactionType = filters.interactionType || "like";

    // 🔍 1️⃣ authId → userId
    let userId: number | undefined;

    if (filters.authId) {
      const userRes = await query(
        `SELECT id FROM users WHERE auth_id = $1 LIMIT 1`,
        [filters.authId]
      );

      if (!userRes.length) {
        return {
          success: false,
          error: {
            code: 404,
            message: "Utilisateur introuvable",
            timestamp: new Date().toISOString(),
          },
        };
      }

      userId = userRes[0].id;
    }

    // 🔹 WHERE dynamique
    const conditions: string[] = [];
    const params: any[] = [];
    let i = 1;

    if (userId) {
      conditions.push(`i.user_id = $${i++}`);
      params.push(userId);
    }

    if (filters.entityType) {
      conditions.push(`i.entity_type = $${i++}`);
      params.push(filters.entityType);
    }

    conditions.push(`i.interaction_type = $${i++}`);
    params.push(interactionType);

    const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    // 🔢 COUNT
    const countSql = `
      SELECT COUNT(*) as total
      FROM interactions i
      ${whereClause}
    `;
    const countRes = await query<{ total: string }>(countSql, params);
    const total = Number(countRes[0]?.total || 0);

    // 📦 DATA : récupération DES ENTITÉS
    const dataSql = `
      SELECT
        i.entity_type as "entityType",
        i.entity_id as "id",
        i.created_at as "likedAt",

        -- ARTICLE
        a.title as article_title,
        a.featured_image as article_image,

        -- FIGHTER
        f.first_name as fighter_name,
        f.profile_image as fighter_photo,

        -- REGION
        r.name as region_name

      FROM interactions i
      LEFT JOIN articles a ON i.entity_type = 'article' AND i.entity_id = a.id
      LEFT JOIN fighters f ON i.entity_type = 'fighter' AND i.entity_id = f.id
      LEFT JOIN regions r ON i.entity_type = 'region' AND i.entity_id = r.id
      ${whereClause}
      ORDER BY i.created_at DESC
      LIMIT $${i++} OFFSET $${i++}
    `;

    params.push(limit, offset);
    const results = await query(dataSql, params);

    // �️ Groupement par entity_type
    const grouped: Record<string, any[]> = {
      article: [],
      fighter: [],
      region: [],
    };

    results.forEach((row: any) => {
      const type = row.entityType;
      if (!grouped[type]) grouped[type] = [];

      if (type === "article") {
        grouped.article.push({
          id: row.id,
          likedAt: row.likedAt,
          title: row.article_title,
          image: row.article_image,
        });
      } else if (type === "fighter") {
        grouped.fighter.push({
          id: row.id,
          likedAt: row.likedAt,
          name: row.fighter_name,
          photo: row.fighter_photo,
        });
      } else if (type === "region") {
        grouped.region.push({
          id: row.id,
          likedAt: row.likedAt,
          name: row.region_name,
        });
      }
    });

    return {
      success: true,
      data: {
        interactions: {
          [interactionType]: grouped
        },
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1,
        },
        timestamp: new Date().toISOString(),
      },
      message: "Entités likées récupérées avec succès",
    };
  } catch (error) {
    console.error("❌ getMobileInteractions:", error);
    return {
      success: false,
      error: {
        code: 500,
        message: "Erreur lors de la récupération des interactions",
        timestamp: new Date().toISOString(),
      },
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

export async function toggleMobileInteraction(formData: any) {
  try {
    const rawData = {
      authId: formData.authId || formData.authId,
      entityType: formData.entityType,
      entityId: Number(formData.entityId),
      interactionType: formData.interactionType || "like",
    };

    // 🔴 Validation
    if (
      !rawData.authId ||
      !rawData.entityType ||
      !rawData.entityId ||
      !rawData.interactionType
    ) {
      return {
        success: false,
        error: {
          code: 400,
          message:
            "Champs requis: auth_id, entityType, entityId, interactionType",
          timestamp: new Date().toISOString(),
        },
      };
    }
    // 🔍 1️⃣ Résoudre l'utilisateur via auth_id
    const userSql = `
      SELECT id FROM users WHERE auth_id = $1 LIMIT 1
    `;

    const users = await query(userSql, [rawData.authId]);

    if (users.length === 0) {
      return {
        success: false,
        error: {
          code: 404,
          message: "Utilisateur introuvable pour ce auth_id",
          timestamp: new Date().toISOString(),
        },
      };
    }

    const userId = users[0].id;

    // 🔍 2️⃣ Vérifier si l'interaction existe déjà
    const checkSql = `
      SELECT id FROM interactions
      WHERE user_id = $1
        AND entity_type = $2
        AND entity_id = $3
        AND interaction_type = $4
    `;

    const existing = await query(checkSql, [
      userId,
      rawData.entityType,
      rawData.entityId,
      rawData.interactionType,
    ]);

    if (existing.length > 0) {
      // 🗑️ Supprimer l'interaction existante
      const deleteSql = `DELETE FROM interactions WHERE id = $1 RETURNING id`;
      const deleted = await query(deleteSql, [existing[0].id]);

      // 🔄 Décrémenter les compteurs
      await updateEntityInteractionCount(
        rawData.entityType as EntityType,
        rawData.entityId,
        rawData.interactionType as InteractionType,
        "decrement"
      );

      return {
        success: true,
        data: {
          interaction: null,
          deletedId: deleted[0].id,
          timestamp: new Date().toISOString(),
        },
        message: "Interaction supprimée (toggle off)",
      };
    }

    // ➕ Créer l'interaction
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
      userId,
      rawData.entityType,
      rawData.entityId,
      rawData.interactionType,
    ]);

    const interaction = result[0];

    // 🔄 Incrémenter les compteurs
    await updateEntityInteractionCount(
      rawData.entityType as EntityType,
      rawData.entityId,
      rawData.interactionType as InteractionType,
      "increment"
    );

    return {
      success: true,
      data: {
        interaction,
        timestamp: new Date().toISOString(),
      },
      message: "Interaction créée (toggle on)",
    };
  } catch (error) {
    console.error("❌ Error in toggleMobileInteraction:", error);
    return {
      success: false,
      error: {
        code: 500,
        message: "Erreur lors du toggle de l'interaction",
        timestamp: new Date().toISOString(),
        error
      },
    };
  }
}

// Garde la fonction createMobileInteraction pour la rétrocompatibilité
export async function createMobileInteraction(formData: any) {
  return toggleMobileInteraction(formData);
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
    // const deleteSql = 'DELETE FROM interactions WHERE id = $1';
    // await query(deleteSql, [id]);

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

export async function getMobileUserInteractions(authId: string, filters: Omit<MobileInteractionFilters, 'authId'> = {}) {
  return getMobileInteractions({ ...filters, authId });
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
  operation: "increment" | "decrement"
) {
  try {
    const delta = operation === "increment" ? 1 : -1;
    let updateSql: string | null = null;
    let params: any[] = [];

    switch (entityType) {
      case "article":
        if (interactionType === "like") {
          updateSql = `
            UPDATE articles
            SET like_count = GREATEST(0, like_count + $1)
            WHERE id = $2
          `;
        }

        if (interactionType === "view" || interactionType === "like") {
          updateSql = `
            UPDATE articles
            SET view_count = GREATEST(0, view_count + $1)
            WHERE id = $2
          `;
        }
        break;

      case "video":
        if (interactionType === "like") {
          updateSql = `
            UPDATE videos
            SET like_count = GREATEST(0, like_count + $1)
            WHERE id = $2
          `;
        }

        if (interactionType === "view") {
          updateSql = `
            UPDATE videos
            SET view_count = GREATEST(0, view_count + $1)
            WHERE id = $2
          `;
        }
        break;

      case "fighter":
        if (interactionType === "follow" || interactionType === "like") {
          updateSql = `
            UPDATE fighters
            SET social_links = jsonb_set(
              COALESCE(social_links, '{}'::jsonb),
              '{followers}',
              to_jsonb(
                GREATEST(
                  0,
                  COALESCE((social_links->>'followers')::int, 0) + $1
                )
              ),
              true
            )
            WHERE id = $2
          `;
        }
        break;
    }

    if (!updateSql) {
      console.warn(
        "⚠️ No counter update for:",
        entityType,
        interactionType
      );
      return;
    }

    params = [delta, entityId];
    await query(updateSql, params);
  } catch (error) {
    console.error("❌ Error updating entity interaction count:", error);
  }
}
