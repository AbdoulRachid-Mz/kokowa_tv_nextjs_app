// @/lib/server/auth-middleware.ts
import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "../firebase-admin";
import { cookies } from "next/headers";

export interface AuthUser {
  uid: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
  role?: string;
  permissions?: string[];
  [key: string]: any;
}

/**
 * Vérifie un jeton d'authentification Firebase en distinguant explicitement :
 * 1. Les ID Tokens transmis via le header "Authorization: Bearer <id_token>"
 * 2. Les Session Cookies transmis via le cookie "firebase_session"
 * 
 * Cette distinction évite l'erreur classique d'incohérence d'émetteur :
 * (Expected issuer: session.firebase.google.com vs securetoken.google.com)
 */
export async function verifyFirebaseToken(request: NextRequest): Promise<{
  user: AuthUser | null;
  error?: string;
}> {
  try {
    let token: string | null = null;
    let isBearerHeader = false;

    // 1. Détection prioritaire du header Authorization (ID Token émis par le client Flutter ou Web)
    const authHeader = request.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.substring(7).trim();
      isBearerHeader = true;
    }

    // 2. Détection du cookie de session Firebase (Session Cookie émis lors du sign-in Web)
    if (!token) {
      try {
        const cookieStore = await cookies();
        token =
          cookieStore.get("firebase_session")?.value ||
          cookieStore.get("token")?.value ||
          null;
      } catch {
        // En cas d'appel hors contexte de cookies Next.js
        token = null;
      }
    }

    if (!token) {
      return { user: null, error: "Jeton d'authentification manquant" };
    }

    if (!adminAuth) {
      console.error("❌ Firebase Admin non initialisé sur le serveur");
      return { user: null, error: "Erreur de configuration serveur" };
    }

    let decodedToken: any = null;

    if (isBearerHeader) {
      // Pour les headers Bearer, valider DIRECTEMENT en tant que Firebase ID Token
      try {
        decodedToken = await adminAuth.verifyIdToken(token, true);
      } catch (idError: any) {
        if (idError.code === "auth/id-token-expired") {
          return { user: null, error: "Token expiré" };
        }
        if (idError.code === "auth/id-token-revoked") {
          return { user: null, error: "Token révoqué" };
        }
        return { user: null, error: "Token invalide" };
      }
    } else {
      // Pour les cookies, valider en tant que Session Cookie Firebase
      try {
        decodedToken = await adminAuth.verifySessionCookie(token, true);
      } catch (sessionError: any) {
        // Fallback gracieux si le cookie contient exceptionnellement un ID Token
        try {
          decodedToken = await adminAuth.verifyIdToken(token, true);
        } catch {
          if (sessionError.code === "auth/session-cookie-expired") {
            return { user: null, error: "Session expirée" };
          }
          if (sessionError.code === "auth/session-cookie-revoked") {
            return { user: null, error: "Session révoquée" };
          }
          return { user: null, error: "Session invalide" };
        }
      }
    }

    if (!decodedToken || !decodedToken.uid) {
      return { user: null, error: "Jeton non décodable" };
    }

    // Extraire les rôles et permissions directement du jeton sans requête réseau redondante
    const userRole = decodedToken.role || (decodedToken.admin ? "admin" : "user");

    const user: AuthUser = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      email_verified: decodedToken.email_verified,
      name: decodedToken.name,
      picture: decodedToken.picture,
      role: userRole,
      permissions: decodedToken.permissions || [],
    };

    return { user };
  } catch (error: any) {
    const errorMsg = error.message || "Erreur inconnue";
    if (errorMsg.includes("expired")) return { user: null, error: "Token expiré" };
    if (errorMsg.includes("revoked")) return { user: null, error: "Token révoqué" };
    return { user: null, error: "Erreur vérification token" };
  }
}

export async function requireAuth(
  request: NextRequest,
  requiredRoles: string[] = []
): Promise<{
  authorized: boolean;
  user?: AuthUser;
  error?: string;
  status?: number;
}> {
  const authResult = await verifyFirebaseToken(request);
  if (!authResult.user) {
    return {
      authorized: false,
      error: authResult.error || "Non autorisé",
      status: 401,
    };
  }

  if (requiredRoles.length > 0) {
    const { checkUserPermissions } = await import("./auth-utils");
    const permissionResult = await checkUserPermissions(
      authResult.user.uid,
      requiredRoles
    );
    if (!permissionResult.hasPermission) {
      return {
        authorized: false,
        error: "Rôles requis manquants",
        status: 403,
      };
    }
    return {
      authorized: true,
      user: { ...authResult.user, ...permissionResult.user },
    };
  }

  return { authorized: true, user: authResult.user };
}

export function withAuth(
  handler: (request: NextRequest, user: AuthUser) => Promise<Response>,
  requiredRoles: string[] = []
) {
  return async (request: NextRequest, context?: any): Promise<Response> => {
    const authResult = await requireAuth(request, requiredRoles);
    if (!authResult.authorized) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status || 401 }
      );
    }
    return handler(request, authResult.user!);
  };
}

export function withAuthSimple(
  handler: (request: NextRequest, user: any) => Promise<Response>,
  requiredRoles: string[] = []
) {
  return async (request: NextRequest): Promise<Response> => {
    const authResult = await requireAuth(request, requiredRoles);

    if (!authResult.authorized) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status || 401 }
      );
    }

    return handler(request, authResult.user);
  };
}
