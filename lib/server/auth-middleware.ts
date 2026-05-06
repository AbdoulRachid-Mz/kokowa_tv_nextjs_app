// @/lib/server/auth-middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '../firebase-admin';
import { cookies } from 'next/headers';
import * as crypto from 'crypto';

export interface AuthUser {
  uid: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
}


const revokedTokensCache = new Map<string, number>();

export async function verifyFirebaseToken(request: NextRequest) {
  try {
    let token: string | null = null;

    // 1. Essayer le header Authorization
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.split('Bearer ')[1];
    }

    // 2. Sinon essayer le cookie de session
    if (!token) {
      const cookieStore = await cookies();
      token = cookieStore.get('firebase_session')?.value || null;
    }

    if (!token) {
      return { user: null, error: 'Token manquant' };
    }

    if (!adminAuth) {
      console.error('Firebase Admin non initialisé');
      return { user: null, error: 'Erreur configuration serveur' };
    }

    // Vérifier le token (session cookie ou ID token)
    let decodedToken;
    try {
      // Essayer comme session cookie d'abord
      decodedToken = await adminAuth.verifySessionCookie(token, true);
    } catch {
      // Sinon comme ID token
      decodedToken = await adminAuth.verifyIdToken(token, true);
    }

    // Vérifier que l'utilisateur n'est pas désactivé
    const userRecord = await adminAuth.getUser(decodedToken.uid);
    if (userRecord.disabled) {
      return { user: null, error: 'Compte utilisateur désactivé' };
    }

    const customClaims = userRecord.customClaims || {};

    return {
      user: {
        uid: decodedToken.uid,
        email: decodedToken.email,
        email_verified: decodedToken.email_verified,
        name: decodedToken.name,
        picture: decodedToken.picture,
        role: customClaims.role || 'user',
        permissions: customClaims.permissions || [],
      },
    };
  } catch (error: any) {
    console.error('Erreur vérification token Firebase:', error);
    if (error.message?.includes('expired')) return { user: null, error: 'Token expiré' };
    if (error.message?.includes('invalid')) return { user: null, error: 'Token invalide' };
    if (error.message?.includes('revoked')) return { user: null, error: 'Token révoqué' };
    return { user: null, error: 'Token invalide' };
  }
}

export async function requireAuth(
  request: NextRequest,
  requiredPermissions: string[] = []
): Promise<{
  authorized: boolean;
  user?: AuthUser;
  error?: string;
  status?: number;
}> {
  const authResult = await verifyFirebaseToken(request);
  if (!authResult.user) {
    return { authorized: false, error: authResult.error || 'Non autorisé', status: 401 };
  }

  if (requiredPermissions.length > 0) {
    const { checkUserPermissions } = await import('./auth-utils');
    const permissionResult = await checkUserPermissions(authResult.user.uid, requiredPermissions);
    if (!permissionResult.hasPermission) {
      return { authorized: false, error: 'Permissions insuffisantes', status: 403 };
    }
    return { authorized: true, user: { ...authResult.user, ...permissionResult.user } };
  }

  return { authorized: true, user: authResult.user };
}

export function withAuth(
  handler: (request: NextRequest, user: AuthUser) => Promise<Response>,
  requiredPermissions: string[] = []
) {
  return async (request: NextRequest, context?: any): Promise<Response> => {
    const authResult = await requireAuth(request, requiredPermissions);
    if (!authResult.authorized) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status || 401 });
    }
    return handler(request, authResult.user!);
  };
}

// Version alternative plus simple si vous n'utilisez pas les params
export function withAuthSimple(
  handler: (request: NextRequest, user: any) => Promise<Response>,
  requiredPermissions: string[] = []
) {
  return async (request: NextRequest): Promise<Response> => {
    const authResult = await requireAuth(request, requiredPermissions);

    if (!authResult.authorized) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status || 401 }
      );
    }

    return handler(request, authResult.user);
  };
}