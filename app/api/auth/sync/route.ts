// app/api/auth/sync/route.ts
import { NextRequest } from 'next/server';
import { apiHandler, ApiContext } from '@/lib/server/api-handler';
import { getOrCreateUserFromFirebase } from '@/lib/server/auth-utils';

export const POST = (request: NextRequest, context: ApiContext) =>
  apiHandler(
    request,
    context,
    async (req, ctx) => {
      console.log('Calling sync API, ctx:', ctx);
      const firebaseUser = ctx.firebaseUser!;
      const dbUser = await getOrCreateUserFromFirebase({
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.name,
        photoURL: firebaseUser.picture,
        emailVerified: firebaseUser.email_verified ?? false,
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
      allowedMethods: ['POST'],
      rateLimit: { windowMs: 60000, max: 20 },
    }
  );
