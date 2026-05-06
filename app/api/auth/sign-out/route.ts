// app/api/auth/sign-out/route.ts
import { NextRequest } from 'next/server';
import { apiHandler, ApiContext, publicHandler } from '@/lib/server/api-handler';
import { cookies } from 'next/headers';

export const POST = (request: NextRequest, context: ApiContext) =>
  publicHandler(
    async () => {
      const cookieStore = await cookies();
      cookieStore.delete('firebase_session');

      return Response.json({ success: true });
    },
    {}
  )(request, context);