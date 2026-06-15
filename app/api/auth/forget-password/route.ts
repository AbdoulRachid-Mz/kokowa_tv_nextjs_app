// app/api/auth/forget-password/route.ts
import { NextRequest } from 'next/server';
import { apiHandler, ApiContext } from '@/lib/server/api-handler';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/configs/firebase/config';

export const POST = (request: NextRequest, context: ApiContext) =>
  apiHandler(
    request,
    context,
    async (req) => {
      const { email } = await req.json();
      if (!email) {
        return Response.json(
          { success: false, error: 'Email requis' },
          { status: 400 }
        );
      }
      await sendPasswordResetEmail(auth, email);
      return Response.json({ success: true });
    },
    {
      requireAuth: false,
      requireAppCheck: false,
      allowedMethods: ['POST'],
      rateLimit: { windowMs: 60000, max: 3 },
    }
  );