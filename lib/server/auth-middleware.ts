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
  let authHeader: string | null = null;

  try {
    authHeader = request.headers.get('authorization');

    if (!authHeader?.startsWith('Bearer ')) {
      return { user: null, error: 'Token manquant' };
    }

    const token = authHeader.split('Bearer ')[1];

    if (!adminAuth) {
      console.error('Firebase Admin non initialisé');
      return { user: null, error: 'Erreur configuration serveur' };
    }

    // Vérifier si le token est dans le cache des révoqués
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    if (revokedTokensCache.has(tokenHash)) {
      return { user: null, error: 'Token révoqué' };
    }

    // Vérifier le token avec checkRevoked=true
    const decodedToken = await adminAuth.verifyIdToken(token, true);

    // Vérifier que l'utilisateur n'est pas désactivé
    const userRecord = await adminAuth.getUser(decodedToken.uid);

    if (userRecord.disabled) {
      return { user: null, error: 'Compte utilisateur désactivé' };
    }

    // Vérifier les claims personnalisés si nécessaire
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
  } catch (error) {
    console.error('Erreur vérification token Firebase:', error);

    if (error instanceof Error) {
      if (error.message.includes('Firebase ID token has expired')) {
        return { user: null, error: 'Token expiré' };
      }
      if (error.message.includes('Firebase ID token has invalid signature')) {
        return { user: null, error: 'Token invalide' };
      }
      if (error.message.includes('Token revoked')) {
        // Ajouter au cache des révoqués
        const token = authHeader?.split('Bearer ')[1];
        if (token) {
          const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
          revokedTokensCache.set(tokenHash, Date.now());

          // Nettoyer le cache toutes les heures
          setTimeout(() => {
            revokedTokensCache.delete(tokenHash);
          }, 60 * 60 * 1000);
        }
        return { user: null, error: 'Token révoqué' };
      }
    }

    return { user: null, error: 'Token invalide' };
  }
}

export async function requireAuth(
  request: NextRequest,
  requiredPermissions: string[] = []
): Promise<{
  authorized: boolean;
  user?: any;
  firebaseUser?: AuthUser;
  error?: string;
  status?: number;
}> {
  const authResult = await verifyFirebaseToken(request);

  if (!authResult.user) {
    return {
      authorized: false,
      error: authResult.error || 'Non autorisé',
      status: 401
    };
  }

  // Vérifier les permissions si demandé
  if (requiredPermissions.length > 0) {
    const { checkUserPermissions } = await import('./auth-utils');
    const permissionResult = await checkUserPermissions(
      authResult.user.uid,
      requiredPermissions
    );

    if (!permissionResult.hasPermission) {
      return {
        authorized: false,
        error: 'Permissions insuffisantes',
        status: 403
      };
    }

    return {
      authorized: true,
      user: permissionResult.user,
      firebaseUser: authResult.user
    };
  }

  return {
    authorized: true,
    user: authResult.user
  };
}

// Nouvelle version corrigée pour Next.js 14+
export function withAuth(
  handler: (request: NextRequest, user: any) => Promise<Response>,
  requiredPermissions: string[] = []
) {
  return async (request: NextRequest, context: { params: Promise<{ [key: string]: string }> }): Promise<Response> => {
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