// lib/server/auth-middleware
import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '../firebase-admin';
import { cookies } from 'next/headers';

export interface AuthUser {
  uid: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
}

export async function verifyFirebaseToken(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("firebase_token")?.value;

    if (!token) {
      return { user: null, error: "Token manquant" };
    }

    const decodedToken = await adminAuth.verifyIdToken(token);

    return {
      user: {
        uid: decodedToken.uid,
        email: decodedToken.email,
        name: decodedToken.name,
        picture: decodedToken.picture,
      },
    };
  } catch (error) {
    return { user: null, error: "Token invalide" };
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