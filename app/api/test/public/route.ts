// app/api/test/public/route.ts
import { NextRequest } from 'next/server';
import { apiHandler, ApiContext, publicHandler } from '@/lib/server/api-handler';
import { getRegions } from '@/actions/regions';

// API publique pour tester les régions (sans auth)
export async function GET(request: NextRequest, context: ApiContext) {
  return publicHandler(
    async (req, ctx) => {
      const { searchParams } = new URL(req.url);
      const limit = parseInt(searchParams.get('limit') || '5');
      
      const result = await getRegions({
        limit,
        page: 1,
        with_fighters: false,
      });

      return Response.json({
        success: true,
        message: 'API publique - Régions récupérées',
        data: {
          regions: result.data,
          pagination: result.pagination,
          appId: ctx.appId,
          timestamp: new Date().toISOString(),
        },
      });
    },
    {
      requireAppCheck: false,
      rateLimit: { windowMs: 60000, max: 30 },
    }
  )(request, context);
}