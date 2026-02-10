// app/actions/mobile/messages.ts

'use server';

import { query } from '@/lib/db/neon-client';
import { MobileMessageFilters } from '@/types';


export async function getMobileMessages(
  filters: MobileMessageFilters = {}
) {
  try {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const offset = (page - 1) * limit;

    // 🔹 Defaults mobile
    const entityType = filters.entityType || 'article';
    const messageType = 'comment';

    // 🔍 authId → userId
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
            message: 'Utilisateur introuvable',
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

    conditions.push(`m.message_type = $${i++}`);
    params.push(messageType);

    conditions.push(`m.entity_type = $${i++}`);
    params.push(entityType);

    if (filters.entityId) {
      conditions.push(`m.entity_id = $${i++}`);
      params.push(filters.entityId);
    }

    conditions.push(`m.is_deleted = false`);

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    // 🔢 COUNT
    const countSql = `
      SELECT COUNT(*) as total
      FROM messages m
      ${whereClause}
    `;
    const countRes = await query<{ total: string }>(countSql, params);
    const total = Number(countRes[0]?.total || 0);
    const totalPages = Math.ceil(total / limit);

    // 📥 DATA (TEXT ONLY)
    const dataSql = `
      SELECT
        m.id,
        m.content,
        m.entity_type as "entityType",
        m.entity_id as "entityId",
        m.like_count as "likeCount",
        m.created_at as "createdAt",
        JSON_BUILD_OBJECT(
          'id', u.id,
          'username', u.username,
          'firstName', u.first_name,
          'lastName', u.last_name,
          'profilePicture', u.profile_picture
        ) as author
      FROM messages m
      LEFT JOIN users u ON m.author_id = u.id
      ${whereClause}
      ORDER BY m.created_at DESC
      LIMIT $${i} OFFSET $${i + 1}
    `;

    params.push(limit, offset);
    const messages = await query(dataSql, params);

    return {
      success: true,
      data: {
        messages,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
        timestamp: new Date().toISOString(),
      },
      message: 'Messages récupérés avec succès',
    };
  } catch (error) {
    console.error('❌ getMobileMessages:', error);
    return {
      success: false,
      error: {
        code: 500,
        message: 'Erreur lors de la récupération des messages',
        timestamp: new Date().toISOString(),
      },
    };
  }
}

interface CreateMobileMessageInput {
  authId: string;
  content: string;
  entityId: number;
  entityType?: 'article' | 'fighter' | 'match' | 'competition';
  parentMessageId?: number;
}


export async function createMobileMessage(input: CreateMobileMessageInput) {
  try {
    const {
      authId,
      content,
      entityId,
      entityType = 'article',
      parentMessageId,
    } = input;

    if (!authId || !content || !entityId) {
      return {
        success: false,
        error: {
          code: 400,
          message: 'authId, content et entityId sont requis',
          timestamp: new Date().toISOString(),
        },
      };
    }

    // Normaliser entityType AVANT l'INSERT
    const normalizedEntityType = entityType
      ?.toString()
      .trim()
      .toLowerCase();

    // Valider côté API (propre et sécurisé)
    const allowedEntityTypes = [
      'article',
      'match',
      'fighter',
      'competition',
      'user',
    ] as const;

    if (!allowedEntityTypes.includes(normalizedEntityType as any)) {
      return {
        success: false,
        error: {
          code: 400,
          message: `entityType invalide: ${entityType}`,
          timestamp: new Date().toISOString(),
        },
      };
    }

    // 🔍 authId → userId
    const userRes = await query(
      `SELECT id FROM users WHERE auth_id = $1 LIMIT 1`,
      [authId]
    );

    if (!userRes.length) {
      return {
        success: false,
        error: {
          code: 404,
          message: 'Utilisateur introuvable',
          timestamp: new Date().toISOString(),
        },
      };
    }

    const authorId = userRes[0].id;

    // 📝 Insertion message (TEXT ONLY)
    const insertSql = `
      INSERT INTO messages (
        content,
        message_type,
        entity_type,
        entity_id,
        author_id,
        parent_message_id
      ) VALUES ($1, 'comment', $2, $3, $4, $5)
      RETURNING
        id,
        content,
        entity_type as "entityType",
        entity_id as "entityId",
        created_at as "createdAt"
    `;

    // Debug final (pour être sûr à 200 %)
    console.log("🧪 Message INSERT params:", {
      content,
      normalizedEntityType,
      entityId,
      authorId,
      parentMessageId,
    });

    const result = await query(insertSql, [
      content,
      normalizedEntityType,
      Number(entityId),
      authorId,
      parentMessageId || null,
    ]);

    return {
      success: true,
      data: {
        message: result[0],
        timestamp: new Date().toISOString(),
      },
      message: 'Commentaire créé avec succès',
    };
  } catch (error) {
    console.error('❌ createMobileMessage:', error);
    return {
      success: false,
      error: {
        code: 500,
        message: 'Erreur lors de la création du commentaire',
        timestamp: new Date().toISOString(),
      },
    };
  }
}