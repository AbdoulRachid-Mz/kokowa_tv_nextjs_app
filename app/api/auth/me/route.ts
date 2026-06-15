// app/api/auth/me/route.ts
import { NextRequest } from 'next/server';
import { apiHandler, ApiContext } from '@/lib/server/api-handler';
import { getUserByFirebaseUid } from '@/lib/server/auth-utils';

export const GET = (request: NextRequest, context: ApiContext) =>
  apiHandler(
    request,
    context,
    async (req, ctx) => {
      console.log('Calling me API, ctx:', ctx);
      const firebaseUser = ctx.firebaseUser!;
      const dbUser = await getUserByFirebaseUid(firebaseUser.uid);

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
      allowedMethods: ['GET'],
      rateLimit: { windowMs: 60000, max: 30 },
    }
  );