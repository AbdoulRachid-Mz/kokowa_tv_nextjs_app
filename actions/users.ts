// @/actions/users.ts
'use server';

import { query, queryOne } from '@/lib/db/neon-client';
import { revalidatePath } from 'next/cache';
import { User, UserFilters, PaginatedResponse, CreateUserData, UpdateUserData } from '@/types';
import { userSchema } from '@/validation/schemas';

export async function getUsers(
  filters: UserFilters = {}
): Promise<PaginatedResponse<User>> {
  try {
    const {
      search = '',
      page = 1,
      limit = 20,
      role,
      is_active,
      is_verified,
      country,
      date_from,
      date_to,
      with_profile = false,
      with_permissions = false,
      with_interactions = false,
      with_messages = false
    } = filters;

    let whereClause = 'WHERE 1=1';
    const params: any[] = [];
    const selectFields = ['u.*'];
    const joinClauses: string[] = [];

    // Filtre de recherche
    if (search) {
      whereClause += ` AND (
        u.username ILIKE $${params.length + 1} OR 
        u.email ILIKE $${params.length + 1} OR 
        u.first_name ILIKE $${params.length + 1} OR 
        u.last_name ILIKE $${params.length + 1}
      )`;
      params.push(`%${search}%`);
    }

    // Filtres supplémentaires
    if (role) {
      whereClause += ` AND u.role = $${params.length + 1}`;
      params.push(role);
    }

    if (is_active !== undefined) {
      whereClause += ` AND u.is_active = $${params.length + 1}`;
      params.push(is_active);
    }

    if (is_verified !== undefined) {
      whereClause += ` AND u.is_verified = $${params.length + 1}`;
      params.push(is_verified);
    }

    if (country) {
      whereClause += ` AND u.country = $${params.length + 1}`;
      params.push(country);
    }

    if (date_from) {
      whereClause += ` AND u.created_at >= $${params.length + 1}`;
      params.push(date_from);
    }

    if (date_to) {
      whereClause += ` AND u.created_at <= $${params.length + 1}`;
      params.push(date_to);
    }

    // Gestion des relations
    if (with_profile) {
      selectFields.push(`
        COALESCE(
          JSONB_BUILD_OBJECT(
            'id', u.id,
            'username', u.username,
            'email', u.email,
            'first_name', u.first_name,
            'last_name', u.last_name,
            'profile_picture', u.profile_picture,
            'bio', u.bio,
            'country', u.country,
            'role', u.role,
            'is_verified', u.is_verified,
            'last_login', u.last_login,
            'created_at', u.created_at
          ), '{}'::jsonb
        ) as profile
      `);
    }

    if (with_permissions) {
      selectFields.push(`
        COALESCE(
          JSONB_BUILD_OBJECT(
            'role', u.role,
            'is_active', u.is_active,
            'is_verified', u.is_verified
          ), '{}'::jsonb
        ) as permissions
      `);
    }

    if (with_interactions) {
      joinClauses.push(`
        LEFT JOIN (
          SELECT 
            user_id,
            JSONB_AGG(
              JSONB_BUILD_OBJECT(
                'entity_type', entity_type,
                'entity_id', entity_id,
                'interaction_type', interaction_type,
                'created_at', created_at
              )
            ) as interactions
          FROM interactions
          WHERE user_id = u.id
          GROUP BY user_id
        ) i ON i.user_id = u.id
      `);
      selectFields.push(`COALESCE(i.interactions, '[]'::jsonb) as interactions`);
    }

    if (with_messages) {
      joinClauses.push(`
        LEFT JOIN (
          SELECT 
            author_id,
            JSONB_AGG(
              JSONB_BUILD_OBJECT(
                'id', id,
                'content', content,
                'message_type', message_type,
                'entity_type', entity_type,
                'entity_id', entity_id,
                'created_at', created_at
              )
            ) as messages
          FROM messages
          WHERE author_id = u.id AND is_deleted = false
          GROUP BY author_id
        ) m ON m.author_id = u.id
      `);
      selectFields.push(`COALESCE(m.messages, '[]'::jsonb) as messages`);
    }

    // Requête pour le total
    const countSql = `
      SELECT COUNT(*) as total
      FROM users u
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
      FROM users u
      ${joinClauses.join(' ')}
      ${whereClause}
      ORDER BY u.created_at DESC, u.username ASC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;

    const data = await query<User>(
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
    console.error('Error in getUsers:', error);
    throw new Error('Erreur lors de la récupération des utilisateurs');
  }
}

export async function getUserById(
  id: number,
  options: {
    with_relations?: boolean;
    relations?: {
      with_messages?: boolean;
      with_interactions?: boolean;
    };
    is_active?: boolean;
  } = {}
) {
  try {
    const {
      with_relations = true,
      relations = {
        with_messages: true,
        with_interactions: true
      },
      is_active
    } = options;

    const { with_messages = true, with_interactions = true } = relations;

    const params: any[] = [id];
    let whereClause = 'WHERE u.id = $1';

    if (typeof is_active === 'boolean') {
      params.push(is_active);
      whereClause += ` AND u.is_active = $${params.length}`;
    }

    let sql = `SELECT * FROM users u ${whereClause}`;

    if (with_relations) {
      const selectFields = ['u.*'];
      const joinClauses: string[] = [];

      if (with_messages) {
        joinClauses.push(`
          LEFT JOIN (
            SELECT 
              author_id,
              JSONB_AGG(
                JSONB_BUILD_OBJECT(
                  'id', id,
                  'content', content,
                  'message_type', message_type,
                  'entity_type', entity_type,
                  'entity_id', entity_id,
                  'created_at', created_at,
                  'like_count', like_count,
                  'is_read', is_read
                )
              ) as messages
            FROM messages
            WHERE author_id = u.id AND is_deleted = false
            GROUP BY author_id
          ) m ON m.author_id = u.id
        `);
        selectFields.push(`COALESCE(m.messages, '[]'::jsonb) as messages`);
      }

      if (with_interactions) {
        joinClauses.push(`
          LEFT JOIN (
            SELECT 
              user_id,
              JSONB_OBJECT_AGG(
                entity_type,
                JSONB_BUILD_OBJECT(
                  'entity_type', entity_type,
                  'interactions', JSONB_AGG(
                    JSONB_BUILD_OBJECT(
                      'entity_id', entity_id,
                      'interaction_type', interaction_type,
                      'created_at', created_at
                    )
                  )
                )
              ) as interactions
            FROM interactions
            WHERE user_id = u.id
            GROUP BY user_id
          ) i ON i.user_id = u.id
        `);
        selectFields.push(`COALESCE(i.interactions, '{}'::jsonb) as interactions`);
      }

      sql = `
        SELECT ${selectFields.join(', ')}
        FROM users u
        ${joinClauses.join(' ')}
        ${whereClause}
      `;
    }

    const result = await queryOne<User & { messages?: any; interactions?: any }>(sql, params);

    if (!result) {
      throw new Error('Utilisateur non trouvé');
    }

    return result;
  } catch (error) {
    console.error('Error in getUserById:', error);
    throw error;
  }
}

export async function getUserByAuthId(
  auth_id: string,
  options: {
    with_relations?: boolean;
    relations?: {
      with_messages?: boolean;
      with_interactions?: boolean;
      with_notifications?: boolean;
    };
    is_active?: boolean;
  } = {}
) {
  try {
    const {
      with_relations = false, // Désactivé par défaut pour debug
      is_active
    } = options;

    const params: any[] = [auth_id];
    let whereClause = 'WHERE auth_id = $1';

    if (typeof is_active === 'boolean') {
      params.push(is_active);
      whereClause += ` AND is_active = $${params.length}`;
    }

    // 1. Récupérer d'abord l'utilisateur de base
    let sql = `SELECT * FROM users ${whereClause}`;

    const userResult = await queryOne<User>(sql, params);

    if (!userResult) {
      throw new Error('Utilisateur non trouvé');
    }

    // 2. Si on demande les relations, faire des requêtes séparées
    if (with_relations) {
      const userId = userResult.id;
      const relationsData: any = {};

      // Messages
      if (options.relations?.with_messages) {
        const messagesSql = `
          SELECT 
            id, content, message_type, entity_type, entity_id,
            author_id, recipient_id, is_read, is_deleted, like_count,
            images, video_url, audio_url, created_at, updated_at
          FROM messages 
          WHERE author_id = $1 AND is_deleted = false
          ORDER BY created_at DESC
        `;
        const messages = await query(messagesSql, [userId]);
        relationsData.messages = messages;
      }

      // Interactions par type
      if (options.relations?.with_interactions) {
        const interactionsSql = `
          SELECT 
            interaction_type,
            JSONB_AGG(
              JSONB_BUILD_OBJECT(
                'id', id,
                'entity_type', entity_type,
                'entity_id', entity_id,
                'created_at', created_at
              )
            ) as data
          FROM interactions 
          WHERE user_id = $1
          GROUP BY interaction_type
        `;
        const interactions = await query<{ interaction_type: string; data: any[] }>(interactionsSql, [userId]);
        
        const interactionsObj: any = {
          likes: [],
          views: [],
          shares: [],
          bookmarks: [],
          follows: []
        };
        
        interactions.forEach(row => {
          const type = row.interaction_type;
          if (interactionsObj.hasOwnProperty(type + 's')) {
            interactionsObj[type + 's'] = row.data;
          }
        });
        
        relationsData.interactions = interactionsObj;
      }

      // Notifications
      if (options.relations?.with_notifications) {
        // Toutes les notifications
        const allNotificationsSql = `
          SELECT 
            id, title, message, notification_type, entity_type, entity_id,
            is_read, action_url, priority, expires_at, created_at, updated_at
          FROM notifications 
          WHERE user_id = $1
          ORDER BY created_at DESC
        `;
        const allNotifications = await query(allNotificationsSql, [userId]);
        
        // Notifications non lues
        const unreadNotificationsSql = `
          SELECT 
            id, title, message, notification_type, entity_type, entity_id,
            is_read, action_url, priority, expires_at, created_at, updated_at
          FROM notifications 
          WHERE user_id = $1 AND is_read = false
          ORDER BY created_at DESC
        `;
        const unreadNotifications = await query(unreadNotificationsSql, [userId]);
        
        // Notifications lues
        const readNotificationsSql = `
          SELECT 
            id, title, message, notification_type, entity_type, entity_id,
            is_read, action_url, priority, expires_at, created_at, updated_at
          FROM notifications 
          WHERE user_id = $1 AND is_read = true
          ORDER BY created_at DESC
        `;
        const readNotifications = await query(readNotificationsSql, [userId]);
        
        // Compteurs
        const countsSql = `
          SELECT 
            COUNT(*) as total,
            COUNT(*) FILTER (WHERE is_read = false) as unread,
            COUNT(*) FILTER (WHERE is_read = true) as read
          FROM notifications 
          WHERE user_id = $1
        `;
        const countsResult = await queryOne<{ total: string; unread: string; read: string }>(countsSql, [userId]);
        
        relationsData.notifications = {
          all: allNotifications,
          unread: unreadNotifications,
          read: readNotifications,
          counts: {
            total: parseInt(countsResult?.total || '0'),
            unread: parseInt(countsResult?.unread || '0'),
            read: parseInt(countsResult?.read || '0')
          }
        };
      }

      return {
        ...userResult,
        ...relationsData
      };
    }

    return userResult;
  } catch (error) {
    console.error('Error in getUserByAuthId:', error);
    throw error;
  }
}

export async function getUserIdFromAuthId(authId?: string | null): Promise<number | undefined> {
  if (!authId) return undefined;
  
  try {
    const result = await queryOne<{ id: number }>(
      'SELECT id FROM users WHERE auth_id = $1',
      [authId]
    );
    return result?.id;
  } catch (error) {
    console.error('Error getting user ID from auth ID:', error);
    return undefined;
  }
}

export async function createUser(userData: CreateUserData) {
  try {
    // Validate user data with Zod schema
    const validatedData = userSchema.parse(userData);

    const sql = `
      INSERT INTO users (
        auth_id, username, email, password_hash, role,
        first_name, last_name, profile_picture, bio,
        phone_number, country, is_active, is_verified
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING id
    `;
    
    const result = await query<{ id: number }>(sql, [
      validatedData.auth_id ?? null,
      validatedData.username,
      validatedData.email,
      validatedData.password_hash,
      validatedData.role,
      validatedData.first_name || null,
      validatedData.last_name || null,
      validatedData.profile_picture || null,
      validatedData.bio || null,
      validatedData.phone_number || null,
      validatedData.country || null,
      validatedData.is_active,
      validatedData.is_verified,
    ]);

    revalidatePath("/admin/users");
    revalidatePath("/ad/users");

    return { 
      success: true, 
      id: result[0].id,
      message: "Utilisateur créé avec succès",
    };
  } catch (error) {
    console.error("Error in createUser:", error);
    throw new Error(`Erreur lors de la création de l'utilisateur: ${(error as Error).message}`);
  }
}

export async function updateUser(id: number, userData: UpdateUserData) {
  try {
    const existing = await getUserById(id);
    if (!existing) {
      throw new Error('Utilisateur non trouvé');
    }

    const sql = `
      UPDATE users 
      SET 
        username = $1,
        email = $2,
        role = $3,
        first_name = $4,
        last_name = $5,
        profile_picture = $6,
        bio = $7,
        phone_number = $8,
        country = $9,
        is_active = $10,
        is_verified = $11,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $12
    `;
    
    await query(sql, [
      userData.username || existing.username,
      userData.email || existing.email,
      userData.role || existing.role,
      userData.first_name ?? existing.first_name ?? null,
      (userData.last_name ?? existing.last_name) ?? null,
      (userData.profile_picture || existing.profile_picture) ?? null,
      (userData.bio || existing.bio) ?? null,
      (userData.phone_number || existing.phone_number) ?? null,
      (userData.country || existing.country) ?? null,
      userData.is_active !== undefined ? userData.is_active : existing.is_active,
      userData.is_verified !== undefined ? userData.is_verified : existing.is_verified,
      id,
    ]);

    revalidatePath('/admin/users');
    revalidatePath(`/admin/users/${id}`);
    revalidatePath(`/ad/users/${id}`);
    
    return { 
      success: true, 
      message: 'Utilisateur modifié avec succès' 
    };
  } catch (error) {
    console.error('Error in updateUser:', error);
    if (error instanceof Error) {
      throw new Error(`Erreur lors de la modification de l'utilisateur: ${error.message}`);
    }
    throw error;
  }
}

export async function deleteUser(id: number) {
  try {
    const existing = await getUserById(id);
    if (!existing) {
      throw new Error('Utilisateur non trouvé');
    }

    // Vérifier si c'est le dernier admin
    if (existing.role === 'admin') {
      const adminCount = await query<{ count: string }>(
        'SELECT COUNT(*) as count FROM users WHERE role = $1 AND id != $2',
        ['admin', id]
      );
      
      if (parseInt(adminCount[0].count) === 0) {
        throw new Error('Impossible de supprimer le dernier administrateur');
      }
    }

    const sql = 'DELETE FROM users WHERE id = $1';
    await query(sql, [id]);

    revalidatePath('/admin/users');
    revalidatePath('/ad/users');
    
    return { 
      success: true, 
      message: 'Utilisateur supprimé avec succès' 
    };
  } catch (error) {
    console.error('Error in deleteUser:', error);
    if (error instanceof Error) {
      throw new Error(`Erreur lors de la suppression de l'utilisateur: ${error.message}`);
    }
    throw new Error('Erreur lors de la suppression de l\'utilisateur');
  }
}

export async function updateUserLastLogin(auth_id: string) {
  try {
    const sql = 'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE auth_id = $1';
    await query(sql, [auth_id]);
  } catch (error) {
    console.error('Error in updateUserLastLogin:', error);
  }
}

export async function getUserStats() {
  try {
    const sql = `
      SELECT 
        COUNT(*) as total_users,
        COUNT(*) FILTER (WHERE is_active = true) as active_users,
        COUNT(*) FILTER (WHERE is_verified = true) as verified_users,
        COUNT(*) FILTER (WHERE role = 'admin') as admin_count,
        COUNT(*) FILTER (WHERE role = 'editor') as editor_count,
        COUNT(*) FILTER (WHERE role = 'moderator') as moderator_count,
        COUNT(*) FILTER (WHERE role = 'fighter_manager') as fighter_manager_count,
        COUNT(*) FILTER (WHERE role = 'user') as user_count,
        AVG(EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - created_at))/86400)::integer as avg_account_age_days,
        MAX(last_login) as last_activity
      FROM users
    `;
    
    const result = await queryOne<{
      total_users: string;
      active_users: string;
      verified_users: string;
      admin_count: string;
      editor_count: string;
      moderator_count: string;
      fighter_manager_count: string;
      user_count: string;
      avg_account_age_days: string;
      last_activity: string;
    }>(sql);
    
    return {
      total_users: parseInt(result?.total_users ?? '0'),
      active_users: parseInt(result?.active_users ?? '0'),
      verified_users: parseInt(result?.verified_users ?? '0'),
      admin_count: parseInt(result?.admin_count ?? '0'),
      editor_count: parseInt(result?.editor_count ?? '0'),
      moderator_count: parseInt(result?.moderator_count ?? '0'),
      fighter_manager_count: parseInt(result?.fighter_manager_count ?? '0'),
      user_count: parseInt(result?.user_count ?? '0'),
      avg_account_age_days: parseInt(result?.avg_account_age_days ?? '0'),
      last_activity: result?.last_activity || null,
    };
  } catch (error) {
    console.error('Error in getUserStats:', error);
    return {
      total_users: 0,
      active_users: 0,
      verified_users: 0,
      admin_count: 0,
      editor_count: 0,
      moderator_count: 0,
      fighter_manager_count: 0,
      user_count: 0,
      avg_account_age_days: 0,
      last_activity: null,
    };
  }
}

export async function getUsersForSelect() {
  try {
    const sql = `
      SELECT id, username, email, first_name, last_name, role, is_active
      FROM users 
      WHERE is_active = true
      ORDER BY username ASC
    `;
    
    return await query<{ 
      id: number; 
      username: string;
      email: string;
      first_name?: string;
      last_name?: string;
      role: string;
      is_active: boolean;
    }>(sql);
  } catch (error) {
    console.error('Error in getUsersForSelect:', error);
    return [];
  }
}

export async function changeUserRole(id: number, newRole: string) {
  try {
    const validRoles = ['admin', 'editor', 'user', 'moderator', 'fighter_manager'];
    if (!validRoles.includes(newRole)) {
      throw new Error('Rôle invalide');
    }

    const existing = await getUserById(id);
    if (!existing) {
      throw new Error('Utilisateur non trouvé');
    }

    // Vérifier si c'est le dernier admin
    if (existing.role === 'admin' && newRole !== 'admin') {
      const adminCount = await query<{ count: string }>(
        'SELECT COUNT(*) as count FROM users WHERE role = $1 AND id != $2',
        ['admin', id]
      );
      
      if (parseInt(adminCount[0].count) === 0) {
        throw new Error('Impossible de retirer le rôle admin du dernier administrateur');
      }
    }

    const sql = 'UPDATE users SET role = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2';
    await query(sql, [newRole, id]);

    revalidatePath('/admin/users');
    revalidatePath(`/admin/users/${id}`);
    
    return { 
      success: true, 
      message: `Rôle de l'utilisateur modifié en ${newRole}` 
    };
  } catch (error) {
    console.error('Error in changeUserRole:', error);
    if (error instanceof Error) {
      throw new Error(`Erreur lors du changement de rôle: ${error.message}`);
    }
    throw error;
  }
}