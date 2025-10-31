import { NextRequest } from 'next/server';
import { adminAuth } from '../firebase-admin';

export interface AuthUser {
  uid: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
}

export async function verifyFirebaseToken(request: NextRequest): Promise<{
  user: AuthUser | null;
  error?: string;
}> {
  try {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { user: null, error: 'Token manquant' };
    }

    const token = authHeader.split('Bearer ')[1];
    
    if (!token) {
      return { user: null, error: 'Token invalide' };
    }

    // Utiliser Firebase Admin pour vérifier le token
    const decodedToken = await adminAuth.verifyIdToken(token);
    
    // Formater l'utilisateur avec les champs dont on a besoin
    const user: AuthUser = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      email_verified: decodedToken.email_verified,
      name: decodedToken.name,
      picture: decodedToken.picture,
    };

    return { user };

  } catch (error: any) {
    console.error('Error verifying Firebase token:', error);
    
    // Gérer les erreurs spécifiques
    if (error.code === 'auth/id-token-expired') {
      return { user: null, error: 'Token expiré' };
    }
    if (error.code === 'auth/id-token-revoked') {
      return { user: null, error: 'Token révoqué' };
    }
    if (error.code === 'auth/invalid-id-token') {
      return { user: null, error: 'Token invalide' };
    }
    
    return { user: null, error: 'Erreur de vérification du token' };
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

// Helper pour protéger les APIs
export async function withAuth(
  handler: (request: NextRequest, user: any) => Promise<Response>,
  requiredPermissions: string[] = []
) {
  return async (request: NextRequest): Promise<Response> => {
    const authResult = await requireAuth(request, requiredPermissions);
    
    if (!authResult.authorized) {
      return new Response(
        JSON.stringify({ error: authResult.error }),
        { 
          status: authResult.status || 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    return handler(request, authResult.user);
  };
}