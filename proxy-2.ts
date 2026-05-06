// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";
import { findRouteConfig } from "./lib/routes/config";


// Récupère la session depuis le cookie Firebase
async function getSessionFromRequest(request: NextRequest) {
  const sessionCookie = request.cookies.get("firebase_session")?.value;
  if (!sessionCookie) return null;

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/session`, {
      headers: {
        cookie: `firebase_session=${sessionCookie}`,
      },
    });
  
    console.log("Response:", res);

    if (!res.ok) return null;

    const data = await res.json();
    return data.user;
  } catch (e) {
    return null;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const config = findRouteConfig(pathname);

  const session = await getSessionFromRequest(request);
  console.log("Session:", session);
  const isAuthenticated = !!session?.uid;

  const isAuthRoute = pathname.startsWith("/auth");

  const needsAuth =
  config.requireAuth ||
  config.requireAdmin ||
  config.requireEditor ||
  config.requireFighterManager;

if (needsAuth && !isAuthenticated) {
  const loginUrl = new URL("/auth/sign-in", request.url);
  loginUrl.searchParams.set("redirect", pathname);
  return NextResponse.redirect(loginUrl);
}

if (config.requireAdmin && session?.role !== "admin") {
  return NextResponse.redirect(new URL("/unauthorized", request.url));
}

if (config.requireEditor && session?.role !== "editor") {
  return NextResponse.redirect(new URL("/unauthorized", request.url));
}

if (config.requireFighterManager && session?.role !== "fighter_manager") {
  return NextResponse.redirect(new URL("/unauthorized", request.url));
}

  // =========================
  // 5. RESPONSE
  // =========================
  const response = NextResponse.next();

  if (isAuthenticated) {
    response.headers.set("x-user-uid", session.uid);
  }

  return response;
}

export const config = {
  matcher: [
    // Exclure les assets statiques, API, images, etc.
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    // Inclure le WebSocket
    "/api/ws",
  ],
};