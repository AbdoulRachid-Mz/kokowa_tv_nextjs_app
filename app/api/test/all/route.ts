
import { NextRequest } from 'next/server';
import { apiHandler, ApiContext } from '@/lib/server/api-handler';

export async function GET(request: NextRequest, context: ApiContext) {
  return apiHandler(
    request,
    context,
    async (req, ctx) => {
      const userAgent = req.headers.get('user-agent') || '';
      const isMobile = /mobile|android|iphone|ipad/i.test(userAgent);

      return Response.json({
        success: true,
        message: 'API unifiée',
        data: {
          platform: isMobile ? 'mobile' : 'web',
          appId: ctx.appId,
          authenticated: !!ctx.user,
          user: ctx.user ? { uid: ctx.user.uid, role: ctx.user.role } : null,
          timestamp: new Date().toISOString(),
        },
      });
    },
    {
      requireAuth: false, // Optionnel
      requireAppCheck: true,
      rateLimit: { windowMs: 60000, max: 100 },
    }
  );
}