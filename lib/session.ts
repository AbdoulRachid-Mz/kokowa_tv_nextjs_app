// lib/session.ts
'use server';

import { cookies } from 'next/headers';
import { getCurrentUser } from './auth';

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