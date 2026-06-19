// app/api/auth/sync/route.ts
import { NextRequest } from "next/server";
import { apiHandler, ApiContext } from "@/lib/server/api-handler";
import { getOrCreateUserFromFirebase } from "@/lib/server/auth-utils";

export const POST = (request: NextRequest, context: ApiContext) =>
  apiHandler(
    request,
    context,
    async (req, ctx) => {
      const body = await request.json().catch(() => ({}));
      const { uid, email, displayName, photoURL, emailVerified } = body || {};

      const firebaseUser = ctx.firebaseUser!;
      const dbUser = await getOrCreateUserFromFirebase({
        uid: uid ?? firebaseUser.uid,
        email: email ?? firebaseUser.email,
        displayName: displayName ?? firebaseUser.name,
        photoURL: photoURL ?? firebaseUser.picture,
        emailVerified: emailVerified ?? firebaseUser.email_verified ?? false,
      });

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
      requireAppCheck: false,
      allowedMethods: ["POST"],
      rateLimit: { windowMs: 60000, max: 20 },
    },
  );
