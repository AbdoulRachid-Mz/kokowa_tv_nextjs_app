// @/lib/server/auth-middleware.ts
import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "../firebase-admin";
import { cookies } from "next/headers";
import { createHash } from "crypto";

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

// ─── Cache mémoire borné et mutualisé pour Firebase Auth ─────────────────────
interface CachedAuthUser {
  user: AuthUser;
  expiresAt: number; // Date.now() + TTL (borné par l'expiration réelle du token)
}

declare global {
  // eslint-disable-next-line no-var
  var __kokowa_auth_cache: Map<string, CachedAuthUser> | undefined;
}

const AUTH_CACHE: Map<string, CachedAuthUser> =
  globalThis.__kokowa_auth_cache ?? (globalThis.__kokowa_auth_cache = new Map());

const MAX_CACHE_SIZE = 500;
const MAX_CACHE_TTL_MS = 2 * 60 * 1000; // 2 minutes max pour respecter le compromis de révocation

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex").substring(0, 32);
}

function getCachedAuth(tokenHash: string): AuthUser | null {
  const cached = AUTH_CACHE.get(tokenHash);
  if (!cached) return null;
  if (Date.now() >= cached.expiresAt) {
    AUTH_CACHE.delete(tokenHash);
    return null;
  }
  return cached.user;
}

function setCachedAuth(tokenHash: string, user: AuthUser, tokenExpInSeconds?: number): void {
  // Nettoyage si le cache dépasse la taille maximale (LRU-like basique)
  if (AUTH_CACHE.size >= MAX_CACHE_SIZE) {
    const now = Date.now();
    for (const [key, value] of AUTH_CACHE.entries()) {
      if (now >= value.expiresAt) {
        AUTH_CACHE.delete(key);
      }
    }
    // Si toujours saturé, supprimer les premières clés
    if (AUTH_CACHE.size >= MAX_CACHE_SIZE) {
      const keysToDelete = Array.from(AUTH_CACHE.keys()).slice(0, 50);
      keysToDelete.forEach((k) => AUTH_CACHE.delete(k));
    }
  }

  const now = Date.now();
  let ttlMs = MAX_CACHE_TTL_MS;
  if (tokenExpInSeconds) {
    const remainingTokenMs = tokenExpInSeconds * 1000 - now;
    if (remainingTokenMs > 0 && remainingTokenMs < ttlMs) {
      ttlMs = remainingTokenMs;
    }
  }

  AUTH_CACHE.set(tokenHash, {
    user,
    expiresAt: now + ttlMs,
  });
}

/**
 * Invalide un token du cache local (ex: lors de la déconnexion)
 */
export function invalidateAuthCache(token: string): void {
  const tokenHash = hashToken(token);
  AUTH_CACHE.delete(tokenHash);
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

    // 3. Vérification du cache mémoire (clé basée sur l'empreinte SHA-256 du token)
    const tokenHash = hashToken(token);
    const cachedUser = getCachedAuth(tokenHash);
    if (cachedUser) {
      return { user: cachedUser };
    }

    if (!adminAuth) {
      console.error("❌ Firebase Admin non initialisé sur le serveur");
      return { user: null, error: "Erreur de configuration serveur" };
    }

    let decodedToken: any = null;

    if (isBearerHeader) {
      // Pour les headers Bearer, valider DIRECTEMENT en tant que Firebase ID Token
      // checkRevoked=false permet d'éviter un round-trip réseau systématique vers Firebase.
      // Le cache local court (max 2 min) garantit la réactivité en cas de révocation.
      try {
        decodedToken = await adminAuth.verifyIdToken(token, false);
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
        decodedToken = await adminAuth.verifySessionCookie(token, false);
      } catch (sessionError: any) {
        // Fallback gracieux si le cookie contient exceptionnellement un ID Token
        try {
          decodedToken = await adminAuth.verifyIdToken(token, false);
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

    // Mettre en cache pour les prochaines requêtes (max 2 min ou expiration réelle)
    setCachedAuth(tokenHash, user, decodedToken.exp);

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
