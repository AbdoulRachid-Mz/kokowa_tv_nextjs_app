// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { findRouteConfig } from "@/lib/routes/config";
import { adminAuth } from "@/lib/firebase-admin";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Find route configuration
  const config = findRouteConfig(pathname);

  // 2. Extract auth token (Authorization header first, then cookie)
  let token: string | null = null;
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    token = authHeader.split("Bearer ")[1];
  }
  if (!token) {
    token = request.cookies.get("firebase_session")?.value || null;
  }

  // 3. Check if authentication is required
  const needsAuth = config.requireAuth || config.requireAdmin;

  // 4. If no token and auth is needed, redirect to login
  if (needsAuth && !token) {
    const loginUrl = new URL("/auth/sign-in", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 5. Verify token and get user data for role checks
  let userPayload: { uid: string; email?: string; role?: string } | null = null;
  if (token && config.requireAdmin) {
    try {
      let decodedToken;
      if (authHeader?.startsWith("Bearer ")) {
        // It's an ID token
        decodedToken = await adminAuth?.verifyIdToken(token);
      } else {
        // It's a session cookie
        decodedToken = await adminAuth?.verifySessionCookie(token, true);
      }

      if (decodedToken) {
        // Call /api/auth/me to get user role from database
        const response = await fetch(
          `${request.nextUrl.origin}/api/auth/me`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
              "x-app-id": process.env.NEXT_PUBLIC_APP_ID || "web-client",
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            userPayload = {
              uid: data.data.firebase.uid,
              email: data.data.firebase.email,
              role: data.data.db?.role || "user",
            };
          }
        }
      }
    } catch (error) {
      console.error("Error verifying token or fetching user data:", error);
    }
  }

  // 6. Check admin access
  if (config.requireAdmin && userPayload?.role !== "admin") {
    return NextResponse.redirect(new URL("/unauthorized", request.url));
  }

  // 7. Continue request
  const response = NextResponse.next();

  // 8. Pass user data to headers if available
  if (userPayload) {
    response.headers.set("x-user-uid", userPayload.uid);
    response.headers.set("x-user-role", userPayload.role || "user");
    if (userPayload.email) {
      response.headers.set("x-user-email", userPayload.email);
    }
  }

  return response;
}

// Configure which routes the middleware should run on
export const config = {
  matcher: [
    // Skip static files and images
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
