// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { findRouteConfig } from "@/lib/routes/config";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Trouver la configuration de la route
  const config = findRouteConfig(pathname);

  // 2. Extraire la session (Token Bearer ou Cookie Firebase Session)
  let token: string | null = null;

  // En priorité : le header Authorization Bearer
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    token = authHeader.split("Bearer ")[1];
  }

  // En fallback : le cookie de session
  if (!token) {
    token = request.cookies.get("firebase_session")?.value || null;
  }

  // 3. Vérifier si la route requiert une authentification
  const needsAuth =
    config.requireAuth ||
    config.requireAdmin ||
    config.requireEditor ||
    config.requireFighterManager;

  // 4. Si pas de token et la route requiert une authentification -> Redirection immédiate
  if (needsAuth && !token) {
    const loginUrl = new URL("/auth/sign-in", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 5. Récupérer le profil utilisateur complet depuis l'API `/api/auth/me`
  // NOTE: Pour éviter l'effet de ralentissement du fetch dans le middleware sur TOUTES les routes,
  // on ne le fait QUE si la route demande des privilèges spécifiques (Admin, Editor, etc.)
  let userPayload: any = null;
  if (
    token &&
    (config.requireAdmin ||
      config.requireEditor ||
      config.requireFighterManager ||
      pathname.startsWith("/dashboard"))
  ) {
    try {
      // On appelle l'API `/api/auth/me` que tu as partagée
      const res = await fetch(`${request.nextUrl.origin}/api/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "x-app-id": process.env.NEXT_PUBLIC_APP_ID || "web-client",
        },
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          // Fusionne les rôles et données de ta table Neon (db) et Firebase
          userPayload = {
            uid: json.data.firebase.uid,
            email: json.data.firebase.email,
            role: json.data.db?.role || "user",
          };
        }
      }
    } catch (e) {
      console.error(
        "Erreur de récupération du profil utilisateur dans le proxy:",
        e,
      );
    }
  }

  // 6. Vérifications des rôles si requis
  if (
    needsAuth &&
    !userPayload &&
    (config.requireAdmin ||
      config.requireEditor ||
      config.requireFighterManager)
  ) {
    // Si l'utilisateur n'a pas pu être validé par l'API interne
    const loginUrl = new URL("/auth/sign-in", request.url);
    return NextResponse.redirect(loginUrl);
  }

  if (config.requireAdmin && userPayload?.role !== "admin") {
    return NextResponse.redirect(new URL("/unauthorized", request.url));
  }

  if (config.requireEditor && userPayload?.role !== "editor") {
    return NextResponse.redirect(new URL("/unauthorized", request.url));
  }

  if (config.requireFighterManager && userPayload?.role !== "fighter_manager") {
    return NextResponse.redirect(new URL("/unauthorized", request.url));
  }

  // 7. Continuer la requête en injectant les données utiles dans les headers pour les pages/layouts (RSC)
  const response = NextResponse.next();

  if (userPayload) {
    response.headers.set("x-user-uid", userPayload.uid);
    response.headers.set("x-user-role", userPayload.role);
    if (userPayload.email)
      response.headers.set("x-user-email", userPayload.email);
  }
  return response;
}

// Configuration du matcher identique à tes besoins
export const config = {
  matcher: [
    // Exclure les assets statiques, images, etc. (on laisse passer l'API pour éviter les boucles infinies)
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    // Inclure le WebSocket
    "/api/ws",
  ],
};
