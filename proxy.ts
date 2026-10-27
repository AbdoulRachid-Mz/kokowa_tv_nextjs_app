// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

interface DecodedTokenPayload {
  uid?: string;
  user_id?: string;
  sub?: string;
  email?: string;
  role?: string;
  exp?: number;
  iss?: string;
  [key: string]: any;
}

/**
 * Décode de manière sécurisée et légère le payload d'un JWT (ID Token ou Session Cookie Firebase)
 * Compatible avec l'environnement Edge de Next.js (aucune dépendance Node.js native).
 */
function decodeJwtPayload(token: string): DecodedTokenPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    // Décodage base64url compatible Edge / Web standard
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    // Gestion du padding base64
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
    
    // Décodage UTF-8 via atob
    const jsonString = decodeURIComponent(
      Array.prototype.map
        .call(atob(padded), (c: string) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );

    return JSON.parse(jsonString) as DecodedTokenPayload;
  } catch {
    return null;
  }
}

/**
 * Valide qu'une URL de redirection est relative pour empêcher les failles d'Open Redirect
 */
function sanitizeRedirectUrl(url: string | null): string {
  if (!url) return "/ad";
  // Doit commencer par / mais pas // (qui pointerait vers un protocole externe)
  if (url.startsWith("/") && !url.startsWith("//")) {
    return url;
  }
  return "/ad";
}

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // 1. Exclure immédiatement les routes API : elles gèrent leur propre sécurité (JSON 401/403)
  // Les requêtes API ne doivent JAMAIS recevoir de redirection HTML vers /auth/sign-in
  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // 2. Extraire les justificatifs de session
  const cookieSession =
    request.cookies.get("firebase_session")?.value ||
    request.cookies.get("token")?.value ||
    null;

  let authHeaderToken: string | null = null;
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    authHeaderToken = authHeader.substring(7).trim();
  }

  const rawToken = cookieSession || authHeaderToken;

  // 3. Analyse du jeton si présent
  let isValidSession = false;
  let tokenPayload: DecodedTokenPayload | null = null;

  if (rawToken) {
    tokenPayload = decodeJwtPayload(rawToken);
    if (tokenPayload && tokenPayload.exp) {
      const nowInSeconds = Math.floor(Date.now() / 1000);
      // Tolérance d'horloge de 30 secondes
      if (tokenPayload.exp > nowInSeconds - 30) {
        isValidSession = true;
      }
    }
  }

  const uid = tokenPayload?.uid || tokenPayload?.user_id || tokenPayload?.sub || null;
  const email = tokenPayload?.email || null;
  const role = tokenPayload?.role || "user";

  // 4. Protection des routes d'administration :
  // La vérification des droits administrateur est gérée par le layout client (AdminLayout avec useAuthContext)
  // et les guards API (admin-guard.ts). Le proxy ne bloque plus les requêtes de navigation vers /ad ou /dashboard,
  // ce qui évite les boucles de redirection pour les administrateurs valides dont la session Firebase
  // est conservée côté client.

  // 5. Redirection des utilisateurs déjà connectés accédant à /auth/sign-in ou /auth/sign-up
  const isAuthPage =
    pathname === "/auth/sign-in" ||
    pathname === "/auth/sign-up" ||
    pathname === "/auth/login";

  if (isAuthPage && isValidSession) {
    const rawRedirectParam = request.nextUrl.searchParams.get("redirect");
    const safeTarget = sanitizeRedirectUrl(rawRedirectParam);
    return NextResponse.redirect(new URL(safeTarget, request.url));
  }

  // 6. Injection des métadonnées de requête dans les headers pour les Server Components & Layouts
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", pathname);
  if (isValidSession && uid) {
    requestHeaders.set("x-user-uid", uid);
    requestHeaders.set("x-user-role", role);
    if (email) requestHeaders.set("x-user-email", email);
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

// Configuration Next.js du matcher : exclure les fichiers statiques, assets et images
export const config = {
  matcher: [
    /*
     * Match tous les chemins de requêtes sauf ceux commençant par :
     * - _next/static (fichiers statiques Next.js)
     * - _next/image (optimisation d'images Next.js)
     * - favicon.ico (icône de site)
     * - Fichiers statiques avec extensions (svg, png, jpg, jpeg, gif, webp, css, js, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|css|js|ico|woff|woff2|ttf)$).*)",
  ],
};
