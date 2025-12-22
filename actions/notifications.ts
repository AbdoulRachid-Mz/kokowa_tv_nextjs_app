// @/actions/notifications.ts
'use server';

import { query, queryOne } from '@/lib/db/neon-client';
import { notificationSchema } from '@/validation/schemas';
import { revalidatePath } from 'next/cache';
import { Notification, NotificationFilters, PaginatedResponse } from '@/types';

export async function getNotifications(
  filters: NotificationFilters = {}
): Promise<PaginatedResponse<Notification>> {
  try {
    const {
      user_id,
      notification_type,
      is_read,
      priority,
      search = '',
      page = 1,
      limit = 20,
      with_user = true,
    } = filters;

    let whereClause = 'WHERE 1=1';
    const params: any[] = [];
    const selectFields: string[] = ['n.*'];
    const joins: string[] = [];

    // Filtres de base
    if (user_id) {
      whereClause += ` AND n.user_id = $${params.length + 1}`;
      params.push(user_id);
    }

    if (notification_type) {
      whereClause += ` AND n.notification_type = $${params.length + 1}`;
      params.push(notification_type);
    }

    if (is_read !== undefined) {
      whereClause += ` AND n.is_read = $${params.length + 1}`;
      params.push(is_read);
    }

    if (priority) {
      whereClause += ` AND n.priority = $${params.length + 1}`;
      params.push(priority);
    }

    if (search) {
      whereClause += ` AND (
        n.title ILIKE $${params.length + 1} 
        OR n.message ILIKE $${params.length + 1}
      )`;
      params.push(`%${search}%`);
    }

    // Filtrer les notifications expirées
    whereClause += ` AND (n.expires_at IS NULL OR n.expires_at > CURRENT_TIMESTAMP)`;

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
      joins.push('LEFT JOIN users u ON n.user_id = u.id');
    }

    // Requête pour le total
    const countSql = `
      SELECT COUNT(*) as total
      FROM notifications n
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
      FROM notifications n
      ${joins.join(' ')}
      ${whereClause}
      ORDER BY 
        CASE 
          WHEN n.priority = 'high' THEN 1
          WHEN n.priority = 'medium' THEN 2
          ELSE 3
        END,
        n.created_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;

    const data = await query<Notification>(
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
    console.error('Error in getNotifications:', error);
    throw new Error('Erreur lors de la récupération des notifications');
  }
}

export async function getNotificationById(id: number, options: { 
  with_relations?: boolean 
} = {}) {
  try {
    const { with_relations = true } = options;
    
    let sql = 'SELECT * FROM notifications WHERE id = $1';
    const params: any[] = [id];

    if (with_relations) {
      sql = `
        SELECT 
          n.*,
          JSON_BUILD_OBJECT(
            'id', u.id,
            'username', u.username,
            'first_name', u.first_name,
            'last_name', u.last_name,
            'profile_picture', u.profile_picture
          ) as user
        FROM notifications n
        LEFT JOIN users u ON n.user_id = u.id
        WHERE n.id = $1
      `;
    }

    const result = await queryOne<Notification>(sql, params);
    
    if (!result) {
      throw new Error('Notification non trouvée');
    }
    
    return result;
  } catch (error) {
    console.error('Error in getNotificationById:', error);
    throw error;
  }
}

export async function createNotification(formData: FormData) {
  try {
    const rawData = {
      user_id: formData.get('user_id'),
      title: formData.get('title'),
      message: formData.get('message'),
      notification_type: formData.get('notification_type'),
      entity_type: formData.get('entity_type'),
      entity_id: formData.get('entity_id'),
      action_url: formData.get('action_url'),
      priority: formData.get('priority'),
      expires_at: formData.get('expires_at'),
    };

    const cleanedData = {
      user_id: Number(rawData.user_id),
      title: rawData.title as string,
      message: rawData.message as string,
      notification_type: rawData.notification_type as 'match_update' | 'fighter_update' | 'competition_update' | 'system_notification' | 'achievement' | 'message',
      entity_type: rawData.entity_type as string || undefined,
      entity_id: rawData.entity_id ? Number(rawData.entity_id) : undefined,
      action_url: rawData.action_url as string || undefined,
      priority: (rawData.priority as 'low' | 'medium' | 'high') || 'medium',
      expires_at: rawData.expires_at as string || undefined,
    };

    const validatedData = notificationSchema.parse(cleanedData);

    const sql = `
      INSERT INTO notifications (
        user_id, title, message, notification_type, entity_type,
        entity_id, action_url, priority, expires_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id
    `;
    
    const result = await query<{ id: number }>(sql, [
      validatedData.user_id,
      validatedData.title,
      validatedData.message,
      validatedData.notification_type,
      validatedData.entity_type || null,
      validatedData.entity_id || null,
      validatedData.action_url || null,
      validatedData.priority,
      validatedData.expires_at || null,
    ]);

    revalidatePath('/notifications');
    revalidatePath('/dashboard');
    return { 
      success: true, 
      id: result[0].id,
      message: 'Notification créée avec succès'
    };
  } catch (error) {
    console.error('Error in createNotification:', error);
    throw new Error('Erreur lors de la création de la notification');
  }
}

export async function markNotificationAsRead(id: number) {
  try {
    const sql = `
      UPDATE notifications 
      SET is_read = true, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `;
    
    await query(sql, [id]);

    revalidatePath('/notifications');
    return { success: true, message: 'Notification marquée comme lue' };
  } catch (error) {
    console.error('Error in markNotificationAsRead:', error);
    throw new Error('Erreur lors du marquage de la notification comme lue');
  }
}

export async function markAllNotificationsAsRead(userId: number) {
  try {
    const sql = `
      UPDATE notifications 
      SET is_read = true, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $1 AND is_read = false
    `;
    
    await query(sql, [userId]);

    revalidatePath('/notifications');
    return { success: true, message: 'Toutes les notifications marquées comme lues' };
  } catch (error) {
    console.error('Error in markAllNotificationsAsRead:', error);
    throw new Error('Erreur lors du marquage des notifications comme lues');
  }
}

export async function deleteNotification(id: number) {
  try {
    const existing = await getNotificationById(id, { with_relations: false });
    if (!existing) {
      throw new Error('Notification non trouvée');
    }

    const sql = 'DELETE FROM notifications WHERE id = $1';
    await query(sql, [id]);

    revalidatePath('/notifications');
    return { 
      success: true, 
      message: 'Notification supprimée avec succès' 
    };
  } catch (error) {
    console.error('Error in deleteNotification:', error);
    throw new Error('Erreur lors de la suppression de la notification');
  }
}

export async function getUserNotifications(userId: number, filters: Omit<NotificationFilters, 'user_id'> = {}) {
  return getNotifications({ ...filters, user_id: userId });
}

export async function getUnreadNotificationsCount(userId: number) {
  try {
    const sql = `
      SELECT COUNT(*) as count
      FROM notifications
      WHERE user_id = $1 AND is_read = false 
        AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)
    `;

    const result = await query<{ count: string }>(sql, [userId]);
    return parseInt(result[0]?.count ?? '0');
  } catch (error) {
    console.error('Error in getUnreadNotificationsCount:', error);
    return 0;
  }
}

// Fonctions utilitaires pour créer des notifications spécifiques
export async function createMatchNotification(
  userId: number, 
  matchId: number, 
  title: string, 
  message: string,
  priority: 'low' | 'medium' | 'high' = 'medium'
) {
  const formData = new FormData();
  formData.append('user_id', userId.toString());
  formData.append('title', title);
  formData.append('message', message);
  formData.append('notification_type', 'match_update');
  formData.append('entity_type', 'match');
  formData.append('entity_id', matchId.toString());
  formData.append('priority', priority);
  formData.append('action_url', `/matches/${matchId}`);

  return createNotification(formData);
}

export async function createSystemNotification(
  userId: number,
  title: string,
  message: string,
  priority: 'low' | 'medium' | 'high' = 'medium'
) {
  const formData = new FormData();
  formData.append('user_id', userId.toString());
  formData.append('title', title);
  formData.append('message', message);
  formData.append('notification_type', 'system_notification');
  formData.append('priority', priority);

  return createNotification(formData);
}

export async function createAchievementNotification(
  userId: number,
  achievementId: number,
  title: string,
  message: string
) {
  const formData = new FormData();
  formData.append('user_id', userId.toString());
  formData.append('title', title);
  formData.append('message', message);
  formData.append('notification_type', 'achievement');
  formData.append('entity_type', 'fighter');
  formData.append('entity_id', achievementId.toString());
  formData.append('priority', 'high');
  formData.append('action_url', `/achievements/${achievementId}`);

  return createNotification(formData);
}