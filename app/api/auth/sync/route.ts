// app/api/auth/sync/route.ts
import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { apiHandler, ApiContext } from "@/lib/server/api-handler";
import { getOrCreateUserFromFirebase } from "@/lib/server/auth-utils";
import { adminAuth } from "@/lib/firebase-admin";

const FIVE_DAYS_MS = 5 * 24 * 60 * 60 * 1000;
const FIVE_DAYS_SEC = 5 * 24 * 60 * 60;

export const POST = (request: NextRequest, context: ApiContext) =>
  apiHandler(
    request,
    context,
    async (req, ctx) => {
      const body = await request.json().catch(() => ({}));
      const { displayName, photoURL } = body || {};

      // Sécurité : l'UID et l'email proviennent obligatoirement du token Firebase vérifié
      const firebaseUser = ctx.firebaseUser!;
      const dbUser = await getOrCreateUserFromFirebase({
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: displayName ?? firebaseUser.name,
        photoURL: photoURL ?? firebaseUser.picture,
        emailVerified: firebaseUser.email_verified ?? false,
      });

      // Rafraîchissement du cookie de session Firebase pour les Server Actions
      try {
        const cookieStore = await cookies();
        const existing = cookieStore.get("firebase_session")?.value;
        let needsRefresh = true;
        if (existing) {
          try {
            const decoded = await adminAuth.verifySessionCookie(existing, false);
            const expiresAt = (decoded as any).exp ? (decoded as any).exp * 1000 : 0;
            const sameUid = decoded.uid === firebaseUser.uid;
            const moreThan24h = expiresAt - Date.now() > 24 * 60 * 60 * 1000;
            if (sameUid && moreThan24h) {
              needsRefresh = false;
            }
          } catch {
            needsRefresh = true;
          }
        }

        if (needsRefresh) {
          // Récupérer l'ID token depuis l'en-tête Authorization (Bearer)
          const authHeader = request.headers.get("authorization") || "";
          const bearer = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
          const idToken = bearer || (request.headers.get("x-firebase-token") ?? "");
          if (idToken) {
            const sessionCookie = await adminAuth.createSessionCookie(idToken, {
              expiresIn: FIVE_DAYS_MS,
            });
            cookieStore.set("firebase_session", sessionCookie, {
              httpOnly: true,
              secure: process.env.NODE_ENV === "production",
              sameSite: "lax",
              path: "/",
              maxAge: FIVE_DAYS_SEC,
            });
          }
        }
      } catch (err) {
        console.error("Erreur rafraîchissement cookie firebase_session:", err);
      }

      return Response.json({
        success: true,
        data: {
          firebase: {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            emailVerified: firebaseUser.email_verified ?? false,
          },
          db: dbUser,
        },
      });
    },
    {
      requireAuth: true,
      skipAppIdValidation: true,      allowedMethods: ["POST"],
      rateLimit: { windowMs: 60000, max: 20 },
    },
  );
