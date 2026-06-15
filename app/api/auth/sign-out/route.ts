// app/api/auth/sign-out/route.ts
import { NextRequest } from 'next/server';
import { apiHandler, ApiContext } from '@/lib/server/api-handler';
import { cookies } from 'next/headers';

export const POST = (request: NextRequest, context: ApiContext) =>
  apiHandler(
    request,
    context,
    async () => {
      const cookieStore = await cookies();
      cookieStore.delete('firebase_session');

      return Response.json({ success: true });
    },
    {
      requireAuth: false,
      requireAppCheck: true,
      allowedMethods: ['POST'],
      rateLimit: { windowMs: 60000, max: 10 },
    }
  );