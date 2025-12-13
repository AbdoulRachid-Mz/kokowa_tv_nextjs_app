// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifySessionCookie } from "@/lib/session";

const PUBLIC_ROUTES = [
  "/",
  "/about",
  "/contact",
  "/competitions",
  "/fighters",
  "/auth/forget-password",
  "/auth/reset-password",
];

const AUTH_ROUTES = [
  "/auth/sign-in",
  "/auth/sign-up",
  "profile",
  "/profile/:path*",
  "/ad/:path*",
];

function matches(routes: string[], path: string) {
  return routes.some(
    (route) => path === route || path.startsWith(`${route}/`)
  );
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isPublic = matches(PUBLIC_ROUTES, pathname);
  const isAuthRoute = matches(AUTH_ROUTES, pathname);

  const session = await verifySessionCookie(request);
  const isAuthenticated = !!session?.uid;

  /**
   * 🔐 Pas connecté → routes protégées interdites
   */
  if (!isAuthenticated && !isPublic && !isAuthRoute) {
    const login = new URL("/auth/sign-in", request.url);
    login.searchParams.set("redirect", pathname);
    return NextResponse.redirect(login);
  }

  /**
   * 🔁 Déjà connecté → pages auth interdites
   */
  if (isAuthenticated && isAuthRoute) {
    return NextResponse.redirect(new URL("/profile", request.url));
  }

  /**
   * 🎫 Injecter UID (optionnel)
   */
  const res = NextResponse.next();
  if (isAuthenticated) {
    res.headers.set("x-user-uid", session.uid);
  }

  return res;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};