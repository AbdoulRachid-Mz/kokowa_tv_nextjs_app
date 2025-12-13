'use server';
import { getUserByAuthId } from '@/actions/users';
import { query, queryOne } from '@/lib/db/neon-client';
import { UserDocument } from '@/types/user';
import { User } from 'firebase/auth';


export async function getUserByFirebaseUid(uid: string): Promise<UserDocument | null> {
  try {
    const sql = `SELECT * FROM users WHERE auth_id = $1 AND is_active = true`;
    return await queryOne<UserDocument>(sql, [uid]);
  } catch (error) {
    console.error('Error getting user by Firebase UID:', error);
    return null;
  }
}

export async function createUserInDatabase(
  firebaseUser: User,
  additionalData: {
    username: string;
    first_name?: string;
    last_name?: string;
    phone_number?: string;
  }
): Promise<{ success: boolean; user?: UserDocument; error?: string }> {
  try {
    const { uid, email, displayName, phoneNumber, photoURL } = firebaseUser;

    // Default password hash for Firebase-authenticated users
    const defaultPasswordHash = '$2b$10$DefaultPasswordHashForFirebaseUsers';

    const sql = `
      INSERT INTO users (
        auth_id, email, username, password_hash, first_name, last_name, phone_number,
        profile_picture, role, is_active, is_verified
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;
    
    const result = await query<UserDocument>(sql, [
      uid,
      email,
      additionalData.username,
      defaultPasswordHash,
      additionalData.first_name || displayName?.split(' ')[0] || null,
      additionalData.last_name || displayName?.split(' ').slice(1).join(' ') || null,
      additionalData.phone_number || phoneNumber || null,
      photoURL || null,
      'user',
      true,
      false,
    ]);

    return { success: true, user: result[0] };
  } catch (error) {
    console.error('Error creating user in database:', error);
    return { 
      success: false, 
      error: 'Erreur lors de la création du compte utilisateur' 
    };
  }
}

export async function updateLastLogin(uid: string): Promise<void> {
  try {
    const sql = `UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE auth_id = $1`;
    await query(sql, [uid]);
  } catch (error) {
    console.error('Error updating last login:', error);
  }
}

export async function getCompleteUserData(uid: string): Promise<UserDocument | null> {
  try {
    const user = await getUserByAuthId(uid, { 
      with_relations: true,
      relations: {
        with_messages: true,
        with_interactions: true,
        with_notifications: true // Nouveau
      }
    });
    return user as UserDocument | null;
  } catch (error) {
    console.error('Error getting complete user data:', error);
    return null;
  }
}

/**
 * Vérifie si un utilisateur a les permissions nécessaires
 */
export async function checkUserPermissions(
  uid: string, 
  requiredPermissions: string[]
): Promise<{ hasPermission: boolean; user?: UserDocument }> {
  try {
    const user = await getUserByFirebaseUid(uid);
    if (!user) {
      return { hasPermission: false };
    }

    // Pour l'instant, on vérifie seulement le rôle
    // Tu peux étendre cette logique avec un système de permissions plus complexe
    const hasPermission = requiredPermissions.includes(user.role);
    
    return { hasPermission, user };
  } catch (error) {
    console.error('Error checking user permissions:', error);
    return { hasPermission: false };
  }
}