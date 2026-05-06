// app/api/auth/forgot-password/route.ts
import { NextRequest } from 'next/server';
import { publicHandler } from '@/lib/server/api-handler';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/configs/firebase/config';

export const POST = (request: NextRequest) =>
  publicHandler(
    async (req) => {
      const { email } = await req.json();
      if (!email) {
        return Response.json({ success: false, error: 'Email requis' }, { status: 400 });
      }
      await sendPasswordResetEmail(auth, email);
      return Response.json({ success: true });
    },
    { requireAppCheck: false, rateLimit: { windowMs: 60000, max: 3 } }
  )(request, {} as any);