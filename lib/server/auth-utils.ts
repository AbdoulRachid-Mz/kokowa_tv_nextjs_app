'use server';

// import { auth } from '@/config/firebase-config';
import { query, queryOne } from '@/lib/db/neon-client';
import { UserDocument } from '@/types/user';
import { User } from 'firebase/auth';

/**
 * Récupère l'utilisateur PostgreSQL à partir de l'UID Firebase
 */
export async function getUserByFirebaseUid(uid: string): Promise<UserDocument | null> {
  try {
    const sql = `
      SELECT * FROM users 
      WHERE user_id = $1 AND is_active = true
    `;
    return await queryOne<UserDocument>(sql, [uid]);
  } catch (error) {
    console.error('Error getting user by Firebase UID:', error);
    return null;
  }
}

/**
 * Crée un nouvel utilisateur dans PostgreSQL après l'inscription Firebase
 */
export async function createUserInDatabase(
  firebaseUser: User,
  additionalData: {
    username: string;
    first_name?: string;
    last_name?: string;
    phone_number?: string;
    region_id?: number;
  }
): Promise<{ success: boolean; user?: UserDocument; error?: string }> {
  try {
    const { uid, email, displayName, phoneNumber, photoURL } = firebaseUser;

    const sql = `
      INSERT INTO users (
        user_id, email, username, first_name, last_name, phone_number,
        profile_picture, role, is_active, is_verified, region_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;
    
    const result = await query<UserDocument>(sql, [
      uid,
      email,
      additionalData.username,
      additionalData.first_name || displayName?.split(' ')[0] || null,
      additionalData.last_name || displayName?.split(' ').slice(1).join(' ') || null,
      additionalData.phone_number || phoneNumber || null,
      photoURL || null,
      'user', // rôle par défaut
      true,
      false, // email non vérifié par défaut
      additionalData.region_id || null
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

/**
 * Met à jour la date de dernière connexion
 */
export async function updateLastLogin(uid: string): Promise<void> {
  try {
    const sql = `
      UPDATE users 
      SET last_login = CURRENT_TIMESTAMP 
      WHERE user_id = $1
    `;
    await query(sql, [uid]);
  } catch (error) {
    console.error('Error updating last login:', error);
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

/**
 * Récupère les données utilisateur complètes (Firebase + PostgreSQL)
 */
export async function getCompleteUserData(uid: string) {
  try {
    const sql = `
      SELECT 
        u.*,
        r.name as region_name,
        r.code as region_code,
        c.name as city_name
      FROM users u
      LEFT JOIN regions r ON u.region_id = r.id
      LEFT JOIN cities c ON u.city_id = c.id
      WHERE u.user_id = $1 AND u.is_active = true
    `;
    
    const user = await queryOne<UserDocument>(sql, [uid]);
    return user;
  } catch (error) {
    console.error('Error getting complete user data:', error);
    return null;
  }
}