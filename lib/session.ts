// lib/session.ts
'use server';

import { cookies } from 'next/headers';
import { getCurrentUser } from './auth';
import { adminAuth } from './firebase-admin';


const COOKIE_NAME = "firebase_session";

export async function verifySessionCookie(request: Request) {
  try {
    const cookieHeader = request.headers.get('cookie');
    if (!cookieHeader) return null;

    const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
      const [name, value] = cookie.trim().split('=');
      acc[name] = value;
      return acc;
    }, {} as Record<string, string>);

    const session = cookies[COOKIE_NAME];
    if (!session) return null;

       if (!adminAuth) {
      return { user: null, error: "Firebase non initialisé" };
    }

    const decoded = await adminAuth.verifySessionCookie(session, true);
    return {
      uid: decoded.uid,
      email: decoded.email,
    };
  } catch {
    return null;
  }
}

export async function createSessionCookie(token: string) {
  try {
       if (!adminAuth) {
      return { user: null, error: "Firebase non initialisé" };
    }
    // ⏱️ cookie de session (5 jours max Firebase)
    const sessionCookie = await adminAuth.createSessionCookie(token, {
      expiresIn: 5 * 24 * 60 * 60 * 1000,
    });
    return sessionCookie;
  } catch (error) {
    console.error('Error creating session cookie:', error);
    throw error;
  }
}

export async function verifyAndRefreshToken(token: string) {
  try {
       if (!adminAuth) {
      return { user: null, error: "Firebase non initialisé" };
    }
    const decoded = await adminAuth.verifyIdToken(token);
    return { uid: decoded.uid, email: decoded.email };
  } catch (error) {
    console.error('Error verifying token:', error);
    throw error;
  }
}


/**
 * Hook serveur pour utiliser l'utilisateur courant dans les actions
 */
export async function useSession() {
  const user = await getCurrentUser();
  
  return {
    user,
    isAuthenticated: !!user,
    hasRole: (role: string) => user?.role === role,
    hasAnyRole: (roles: string[]) => user?.role ? roles.includes(user.role) : false,
  };
}

/**
 * Vérifie l'authentification et retourne l'utilisateur ou une erreur
 */
export async function requireAuth(requiredRoles: string[] = []) {
  const user = await getCurrentUser();
  
  if (!user) {
    throw new Error('Non authentifié');
  }
  
  if (requiredRoles.length > 0 && !requiredRoles.includes(user.role!)) {
    throw new Error('Permissions insuffisantes');
  }
  
  return user;
}

/**
 * Récupère l'ID de l'utilisateur courant avec vérification
 */
export async function getAuthUserId(): Promise<number> {
  const user = await requireAuth();
  if (!user.user_id) {
    throw new Error('ID utilisateur non trouvé');
  }
  return user.user_id;
}



