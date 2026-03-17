// @/actions/messages.ts
'use server';

import { query, queryOne } from '@/lib/db/neon-client';
import { messageSchema } from '@/validation/schemas';
import { revalidatePath } from 'next/cache';
import { Message, MessageFilters, PaginatedResponse } from '@/types';
import { wsManager } from '@/server/ws-connection-manager';
// import { connectionManager } from '@/lib/realtime/connection-manager';

// Utility function to emit message events
async function emitMessageEvent(entityType: string, entityId: number, eventType: string, data: any) {
  try {
    // For match comments
    if (entityType === 'match') {
      wsManager.broadcastToEntity({
        entityType: 'match',
        entityId,
        event: eventType,
        data,
        timestamp: Date.now()
      });
    }
    // For competition comments
    else if (entityType === 'competition') {
      wsManager.broadcastToEntity({
        entityType: 'edition',
        entityId,
        event: eventType,
        data,
        timestamp: Date.now()
      });
    }

    console.log(`Event ${eventType} emitted for ${entityType} ${entityId}`);
  } catch (error) {
    console.error('Error emitting message event:', error);
  }
}

export async function getMessages(
  filters: MessageFilters = {}
): Promise<PaginatedResponse<Message>> {
  try {
    const {
      message_type,
      entity_type,
      entity_id,
      author_id,
      recipient_id,
      is_read,
      is_active,
      is_deleted,
      search = '',
      page = 1,
      limit = 20,
      with_author = true,
      with_recipient = true,
      with_parent = false,
    } = filters;

    let whereClause = 'WHERE 1=1';
    const params: any[] = [];
    const selectFields: string[] = ['m.*'];
    const joins: string[] = [];

    // Filtres de base
    if (message_type) {
      whereClause += ` AND m.message_type = $${params.length + 1}`;
      params.push(message_type);
    }

    if (entity_type) {
      whereClause += ` AND m.entity_type = $${params.length + 1}`;
      params.push(entity_type);
    }

    if (entity_id) {
      whereClause += ` AND m.entity_id = $${params.length + 1}`;
      params.push(entity_id);
    }

    if (author_id) {
      whereClause += ` AND m.author_id = $${params.length + 1}`;
      params.push(author_id);
    }

    if (recipient_id) {
      whereClause += ` AND m.recipient_id = $${params.length + 1}`;
      params.push(recipient_id);
    }

    if (is_read !== undefined) {
      whereClause += ` AND m.is_read = $${params.length + 1}`;
      params.push(is_read);
    }

    if (is_active !== undefined) {
      whereClause += ` AND m.is_active = $${params.length + 1}`;
      params.push(is_active);
    }

    if (is_deleted !== undefined) {
      whereClause += ` AND m.is_deleted = $${params.length + 1}`;
      params.push(is_deleted);
    }

    if (search) {
      whereClause += ` AND m.content ILIKE $${params.length + 1}`;
      params.push(`%${search}%`);
    }

    // Jointures pour les relations
    if (with_author) {
      selectFields.push(`
        JSON_BUILD_OBJECT(
          'id', au.id,
          'username', au.username,
          'first_name', au.first_name,
          'last_name', au.last_name,
          'profile_picture', au.profile_picture
        ) as author
      `);
      joins.push('LEFT JOIN users au ON m.author_id = au.id');
    }

    if (with_recipient) {
      selectFields.push(`
        JSON_BUILD_OBJECT(
          'id', ur.id,
          'username', ur.username,
          'first_name', ur.first_name,
          'last_name', ur.last_name,
          'profile_picture', ur.profile_picture
        ) as recipient
      `);
      joins.push('LEFT JOIN users ur ON m.recipient_id = ur.id');
    }

    if (with_parent) {
      selectFields.push(`
        JSON_BUILD_OBJECT(
          'id', pm.id,
          'content', pm.content,
          'author_id', pm.author_id
        ) as parent_message
      `);
      joins.push('LEFT JOIN messages pm ON m.parent_message_id = pm.id');
    }

    // Requête pour le total
    const countSql = `
      SELECT COUNT(*) as total
      FROM messages m
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
      FROM messages m
      ${joins.join(' ')}
      ${whereClause}
      ORDER BY m.created_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;

    const data = await query<Message>(
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
    console.error('Error in getMessages:', error);
    throw new Error('Erreur lors de la récupération des messages');
  }
}

export async function getMessageById(id: number, options: {
  with_relations?: boolean
} = {}) {
  try {
    const { with_relations = true } = options;

    let sql = 'SELECT * FROM messages WHERE id = $1';
    const params: any[] = [id];

    if (with_relations) {
      sql = `
        SELECT 
          m.*,
          JSON_BUILD_OBJECT(
            'id', au.id,
            'username', au.username,
            'first_name', au.first_name,
            'last_name', au.last_name,
            'profile_picture', au.profile_picture
          ) as author,
          JSON_BUILD_OBJECT(
            'id', ur.id,
            'username', ur.username,
            'first_name', ur.first_name,
            'last_name', ur.last_name,
            'profile_picture', ur.profile_picture
          ) as recipient,
          JSON_BUILD_OBJECT(
            'id', pm.id,
            'content', pm.content,
            'author_id', pm.author_id
          ) as parent_message
        FROM messages m
        LEFT JOIN users au ON m.author_id = au.id
        LEFT JOIN users ur ON m.recipient_id = ur.id
        LEFT JOIN messages pm ON m.parent_message_id = pm.id
        WHERE m.id = $1
      `;
    }

    const result = await queryOne<Message>(sql, params);

    if (!result) {
      throw new Error('Message non trouvé');
    }

    return result;
  } catch (error) {
    console.error('Error in getMessageById:', error);
    throw error;
  }
}

export async function createMessage(formData: FormData) {
  try {
    const rawData = {
      content: formData.get('content'),
      message_type: formData.get('message_type'),
      entity_type: formData.get('entity_type'),
      entity_id: formData.get('entity_id'),
      author_id: formData.get('author_id'),
      recipient_id: formData.get('recipient_id'),
      parent_message_id: formData.get('parent_message_id'),
      images: formData.get('images'),
      video_url: formData.get('video_url'),
      audio_url: formData.get('audio_url'),
    };

    const cleanedData = {
      content: rawData.content as string,
      message_type: (rawData.message_type as 'comment' | 'direct_message' | 'group_message' | 'match_commentary' | 'system_notification') || 'comment',
      entity_type: rawData.entity_type as string || undefined,
      entity_id: rawData.entity_id ? Number(rawData.entity_id) : undefined,
      author_id: Number("12"),
      recipient_id: rawData.recipient_id ? Number(rawData.recipient_id) : undefined,
      parent_message_id: rawData.parent_message_id ? Number(rawData.parent_message_id) : undefined,
      images: rawData.images ? JSON.parse(rawData.images as string) : undefined,
      video_url: rawData.video_url as string || undefined,
      audio_url: rawData.audio_url as string || undefined,
    };
    console.log(cleanedData)


    const validatedData = messageSchema.parse(cleanedData);

    const sql = `
      INSERT INTO messages (
        content, message_type, entity_type, entity_id, author_id,
        recipient_id, parent_message_id, images, video_url, audio_url
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id
    `;

    const result = await query<{ id: number }>(sql, [
      validatedData.content,
      validatedData.message_type,
      validatedData.entity_type || null,
      validatedData.entity_id || null,
      validatedData.author_id,
      validatedData.recipient_id || null,
      validatedData.parent_message_id || null,
      validatedData.images ? JSON.stringify(validatedData.images) : null,
      validatedData.video_url || null,
      validatedData.audio_url || null,
    ]);

    // Émettre l'événement si c'est un commentaire sur une entité
    // if (validatedData.entity_type && validatedData.entity_id) {
    //   await emitMessageEvent(
    //     validatedData.entity_type,
    //     validatedData.entity_id,
    //     'new_message',
    //     { message: result[0].id }
    //   );
    // }

    revalidatePath('/messages');
    return {
      success: true,
      id: result[0].id,
      message: 'Message créé avec succès'
    };
  } catch (error) {
    console.error('Error in createMessage:', error);
    throw new Error('Erreur lors de la création du message');
  }
}

export async function updateMessage(id: number, formData: FormData) {
  try {
    const existing = await getMessageById(id, { with_relations: false });
    if (!existing) {
      throw new Error('Message non trouvé');
    }

    const rawData = {
      content: formData.get('content'),
      message_type: formData.get('message_type'),
      entity_type: formData.get('entity_type'),
      entity_id: formData.get('entity_id'),
      author_id: formData.get('author_id'),
      recipient_id: formData.get('recipient_id'),
      parent_message_id: formData.get('parent_message_id'),
      is_read: formData.get('is_read'),
      is_active: formData.get('is_active'),
      is_deleted: formData.get('is_deleted'),
      images: formData.get('images'),
      video_url: formData.get('video_url'),
      audio_url: formData.get('audio_url'),
    };

    const cleanedData = {
      content: rawData.content as string,
      message_type: rawData.message_type as 'comment' | 'direct_message' | 'group_message' | 'match_commentary' | 'system_notification',
      entity_type: rawData.entity_type as string || undefined,
      entity_id: rawData.entity_id ? Number(rawData.entity_id) : undefined,
      author_id: Number(rawData.author_id),
      recipient_id: rawData.recipient_id ? Number(rawData.recipient_id) : undefined,
      parent_message_id: rawData.parent_message_id ? Number(rawData.parent_message_id) : undefined,
      is_read: rawData.is_read === 'true',
      is_active: rawData.is_active === 'true',
      is_deleted: rawData.is_deleted === 'true',
      images: rawData.images ? JSON.parse(rawData.images as string) : undefined,
      video_url: rawData.video_url as string || undefined,
      audio_url: rawData.audio_url as string || undefined,
    };

    const validatedData = messageSchema.partial().parse(cleanedData);

    const sql = `
      UPDATE messages 
      SET 
        content = COALESCE($1, content),
        message_type = COALESCE($2, message_type),
        entity_type = COALESCE($3, entity_type),
        entity_id = COALESCE($4, entity_id),
        author_id = COALESCE($5, author_id),
        recipient_id = COALESCE($6, recipient_id),
        parent_message_id = COALESCE($7, parent_message_id),
        is_read = COALESCE($8, is_read),
        is_active = COALESCE($9, is_active),
        is_deleted = COALESCE($10, is_deleted),
        images = COALESCE($11, images),
        video_url = COALESCE($12, video_url),
        audio_url = COALESCE($13, audio_url),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $14
    `;

    await query(sql, [
      validatedData.content || null,
      validatedData.message_type || null,
      validatedData.entity_type || null,
      validatedData.entity_id || null,
      validatedData.author_id || null,
      validatedData.recipient_id || null,
      validatedData.parent_message_id || null,
      validatedData.is_read ?? null,
      validatedData.is_active ?? null,
      validatedData.is_deleted ?? null,
      validatedData.images ? JSON.stringify(validatedData.images) : null,
      validatedData.video_url || null,
      validatedData.audio_url || null,
      id,
    ]);

    revalidatePath('/messages');
    revalidatePath(`/messages/${id}`);
    return {
      success: true,
      message: 'Message modifié avec succès'
    };
  } catch (error) {
    console.error('Error in updateMessage:', error);
    throw error;
  }
}

export async function deleteMessage(id: number) {
  try {
    const existing = await getMessageById(id, { with_relations: false });
    if (!existing) {
      throw new Error('Message non trouvé');
    }

    // Pour les messages avec des réponses, on marque comme supprimé au lieu de supprimer
    const hasReplies = await checkMessageReplies(id);

    if (hasReplies) {
      const sql = `
        UPDATE messages 
        SET is_deleted = true, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `;
      await query(sql, [id]);
    } else {
      const sql = 'DELETE FROM messages WHERE id = $1';
      await query(sql, [id]);
    }

    revalidatePath('/messages');
    return {
      success: true,
      message: 'Message supprimé avec succès'
    };
  } catch (error) {
    console.error('Error in deleteMessage:', error);
    throw new Error('Erreur lors de la suppression du message');
  }
}

export async function markMessageAsRead(id: number) {
  try {
    const sql = `
      UPDATE messages 
      SET is_read = true, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `;

    await query(sql, [id]);

    revalidatePath('/messages');
    return { success: true, message: 'Message marqué comme lu' };
  } catch (error) {
    console.error('Error in markMessageAsRead:', error);
    throw new Error('Erreur lors du marquage du message comme lu');
  }
}

export async function likeMessage(id: number) {
  try {
    const sql = `
      UPDATE messages 
      SET like_count = like_count + 1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `;

    await query(sql, [id]);

    revalidatePath('/messages');
    return { success: true, message: 'Message liké' };
  } catch (error) {
    console.error('Error in likeMessage:', error);
    throw new Error('Erreur lors du like du message');
  }
}

// Fonctions utilitaires
async function checkMessageReplies(messageId: number): Promise<boolean> {
  const sql = 'SELECT COUNT(*) as count FROM messages WHERE parent_message_id = $1';
  const result = await query<{ count: string }>(sql, [messageId]);
  return parseInt(result[0]?.count ?? '0') > 0;
}

export async function getMessageReplies(parentMessageId: number, filters: Omit<MessageFilters, 'parent_message_id'> = {}) {
  return getMessages({ ...filters, parent_message_id: parentMessageId });
}

export async function getConversation(user1Id: number, user2Id: number, filters: Omit<MessageFilters, 'author_id' | 'recipient_id'> = {}) {
  return getMessages({
    ...filters,
    message_type: 'direct_message',
    author_id: user1Id,
    recipient_id: user2Id
  });
}

export async function getUnreadMessagesCount(userId: number) {
  try {
    const sql = `
      SELECT COUNT(*) as count
      FROM messages
      WHERE recipient_id = $1 AND is_read = false AND is_deleted = false
    `;

    const result = await query<{ count: string }>(sql, [userId]);
    return parseInt(result[0]?.count ?? '0');
  } catch (error) {
    console.error('Error in getUnreadMessagesCount:', error);
    return 0;
  }
}