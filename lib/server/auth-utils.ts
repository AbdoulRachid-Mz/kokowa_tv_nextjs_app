// @/lib/server/auth-utils.ts
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
    fcm_token?: string;
  }
): Promise<{ success: boolean; user?: UserDocument; error?: string }> {
  try {
    const { uid, email, displayName, phoneNumber, photoURL } = firebaseUser;

    // Default password hash for Firebase-authenticated users
    const defaultPasswordHash = '$2b$10$DefaultPasswordHashForFirebaseUsers';

    const sql = `
      INSERT INTO users (
        auth_id, email, username, password_hash, fcm_token, first_name, last_name, phone_number,
        profile_picture, role, is_active, is_verified
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `;

    const result = await query<UserDocument>(sql, [
      uid,
      email,
      additionalData.username,
      defaultPasswordHash,
      additionalData.fcm_token || null,
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

export async function getCompleteUserData(uid: string, firebaseUser?: any): Promise<UserDocument | null> {
  try {
    // Vérifier si l'utilisateur existe déjà
    let user = await getUserByAuthId(uid, {
      with_relations: true,
      relations: {
        with_messages: true,
        with_interactions: true,
        with_notifications: true
      }
    });

    // Si l'utilisateur n'existe pas dans la DB mais est connecté à Firebase, le créer
    if (!user && firebaseUser) {
      console.log('User authenticated in Firebase but not in DB, creating user...');

      const username = `user_${uid.slice(0, 8)}`;
      const createResult = await createUserInDatabase(firebaseUser, {
        username,
        first_name: firebaseUser.displayName?.split(' ')[0] || '',
        last_name: firebaseUser.displayName?.split(' ').slice(1).join(' ') || '',
        phone_number: firebaseUser.phoneNumber || undefined
      });

      if (createResult.success && createResult.user) {
        user = createResult.user as UserDocument;
        console.log('User created successfully in database');
      } else {
        console.error('Failed to create user in database:', createResult.error);
        return null;
      }
    }

    return user as UserDocument | null;
  } catch (error) {
    console.error('Error getting complete user data:', error);
    return null;
  }
}

declare global {
  // eslint-disable-next-line no-var
  var __kokowa_rbac_cache:
    | Map<string, { user: UserDocument; expires: number }>
    | undefined;
}

function getRbacCacheTtlMs(): number {
  const raw = Number(process.env.RBAC_CACHE_TTL_MS);
  if (Number.isFinite(raw) && raw >= 0) return raw;
  return 30_000;
}

function getRbacCache() {
  return (globalThis.__kokowa_rbac_cache ??= new Map());
}

/**
 * Vérifie si un utilisateur a les permissions nécessaires.
 *
 * Un cache mémoire court (30 s par défaut, `RBAC_CACHE_TTL_MS`) évite une
 * requête SQL `users` à chaque requête protégée. Seuls les succès sont mis en
 * cache ; un refus n'est jamais mémorisé, pour ne pas bloquer un utilisateur
 * dont le rôle vient d'être attribué.
 *
 * Contrepartie assumée : une rétrogradation de rôle peut mettre jusqu'à
 * `RBAC_CACHE_TTL_MS` à être prise en compte.
 */
export async function checkUserPermissions(
  uid: string,
  requiredRoles: string[]
): Promise<{ hasPermission: boolean; user?: UserDocument }> {
  try {
    const ttl = getRbacCacheTtlMs();
    const cacheKey = `${uid}:${[...requiredRoles].sort().join(",")}`;
    const now = Date.now();

    if (ttl > 0) {
      const cached = getRbacCache().get(cacheKey);
      if (cached && cached.expires > now) {
        return {
          hasPermission: requiredRoles.includes(cached.user.role),
          user: cached.user,
        };
      }
    }

    const user = await getUserByFirebaseUid(uid);
    if (!user) {
      return { hasPermission: false };
    }

    // Pour l'instant, on vérifie seulement le rôle
    // Tu peux étendre cette logique avec un système de permissions plus complexe
    const hasPermission = requiredRoles.includes(user.role);

    if (hasPermission && ttl > 0) {
      getRbacCache().set(cacheKey, { user, expires: now + ttl });
    }

    return { hasPermission, user };
  } catch (error) {
    console.error('Error checking user roles:', error);
    return { hasPermission: false };
  }
}

export async function getOrCreateUserFromFirebase(
  firebaseUser: { uid: string; email?: string; displayName?: string; photoURL?: string; emailVerified?: boolean }
): Promise<UserDocument> {
  // 1. Rechercher l'utilisateur existant
  let user = await queryOne<UserDocument>(
    `SELECT id, auth_id, username, email, role, first_name, last_name, profile_picture, is_active, is_verified, created_at
     FROM users WHERE auth_id = $1 AND is_active = true`,
    [firebaseUser.uid]
  );

  if (user) {
    // Mettre à jour last_login
    await query(`UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1`, [user.id!]);
    return user;
  }

  // 2. Créer un nouvel utilisateur
  const firstName = firebaseUser.displayName?.split(' ')[0] || '';
  const lastName = firebaseUser.displayName?.split(' ').slice(1).join(' ') || '';
  // Clean and join all parts of first and last name to avoid spaces in username
  const cleanFirstName = firstName.replace(/\s+/g, '_');
  const cleanLastName = lastName.replace(/\s+/g, '_');
  const baseUsername = [cleanFirstName, cleanLastName].filter(Boolean).join('_').toLowerCase() || `user_${firebaseUser.uid.slice(0, 8)}`;
  const username = `@${baseUsername}`;
  const insertResult = await query<UserDocument>(
    `INSERT INTO users (auth_id, email, username, password_hash, role, first_name, last_name, profile_picture, is_active, is_verified)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING id, auth_id, username, email, role, first_name, last_name, profile_picture, is_active, is_verified, created_at`,
    [
      firebaseUser.uid,
      firebaseUser.email || null,
      username,
      'firebase_auth',
      'user',
      firstName,
      lastName,
      firebaseUser.photoURL || null,
      true,
      firebaseUser.emailVerified || false,
    ]
  );

  if (!insertResult || insertResult.length === 0) {
    throw new Error('Erreur création utilisateur');
  }

  return insertResult[0];
}