// lib/auth.ts
'use server';

import { cookies } from 'next/headers';
import { verifyFirebaseToken } from './server/auth-middleware';
import { getUserByFirebaseUid } from './server/auth-utils';

export interface CurrentUser {
  uid: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
  role?: string;
  user_id?: number;
  username?: string;
  first_name?: string;
  last_name?: string;
  is_active?: boolean;
  is_verified?: boolean;
}

/**
 * Récupère l'utilisateur courant depuis le token Firebase et la base PostgreSQL
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  try {
    // Récupérer le token depuis les cookies ou headers
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return null;
    }

    // Créer une requête simulée pour utiliser verifyFirebaseToken
    const mockRequest = new Request('http://localhost', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const authResult = await verifyFirebaseToken(mockRequest as any);
    
    if (!authResult.user) {
      return null;
    }

    // Récupérer les données utilisateur depuis PostgreSQL
    const userData = await getUserByFirebaseUid(authResult.user.uid);
    
    if (!userData) {
      return null;
    }

    // Combiner les données Firebase et PostgreSQL
    const currentUser: CurrentUser = {
      uid: authResult.user.uid,
      email: authResult.user.email,
      email_verified: (authResult.user as any).email_verified,
      name: authResult.user.name,
      picture: authResult.user.picture,
      // Données PostgreSQL
      user_id: userData.id,
      username: userData.username,
      first_name: userData.first_name,
      last_name: userData.last_name,
      role: userData.role,
      is_active: userData.is_active,
      is_verified: userData.is_verified,
    };

    return currentUser;
  } catch (error) {
    console.error('Error in getCurrentUser:', error);
    return null;
  }
}

/**
 * Vérifie si l'utilisateur courant a un rôle spécifique
 */
export async function hasRole(requiredRole: string): Promise<boolean> {
  const user = await getCurrentUser();
  return user?.role === requiredRole;
}

/**
 * Vérifie si l'utilisateur courant a au moins un des rôles demandés
 */
export async function hasAnyRole(requiredRoles: string[]): Promise<boolean> {
  const user = await getCurrentUser();
  return user?.role ? requiredRoles.includes(user.role) : false;
}

/**
 * Récupère l'ID de l'utilisateur PostgreSQL
 */
export async function getCurrentUserId(): Promise<number | null> {
  const user = await getCurrentUser();
  return user?.user_id || null;
}

/**
 * Vérifie si l'utilisateur est authentifié
 */
export async function isAuthenticated(): Promise<boolean> {
  const user = await getCurrentUser();
  return user !== null;
}

/**
 * Récupère les informations de base de l'utilisateur (sans données sensibles)
 */
export async function getCurrentUserProfile() {
  const user = await getCurrentUser();
  
  if (!user) {
    return null;
  }

  return {
    id: user.user_id,
    uid: user.uid,
    username: user.username,
    email: user.email,
    first_name: user.first_name,
    last_name: user.last_name,
    role: user.role,
    profile_picture: user.picture,
    is_active: user.is_active,
    is_verified: user.is_verified,
  };
}