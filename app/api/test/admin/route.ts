// app/api/test/admin/route.ts
import { NextRequest } from 'next/server';
import { apiHandler, ApiContext, withAdminAuth } from '@/lib/server/api-handler';
import { getRegions, getRegionsStats, createRegion } from '@/actions/regions';

export async function GET(request: NextRequest, context: ApiContext) {
  return withAdminAuth(
    async (req, ctx) => {
      const { searchParams } = new URL(req.url);
      const limit = parseInt(searchParams.get('limit') || '20');
      const includeStats = searchParams.get('stats') === 'true';
      
      const [regionsResult, stats] = await Promise.all([
        getRegions({
          limit,
          page: 1,
          with_fighters: true,
          with_coach: true,
          with_competitions: true,
        }),
        includeStats ? getRegionsStats() : Promise.resolve(null),
      ]);

      return Response.json({
        success: true,
        message: 'API Admin - Données complètes',
        data: {
          adminInfo: {
            uid: ctx.user?.uid,
            email: ctx.firebaseUser?.email,
            role: ctx.user?.role,
          },
          regions: regionsResult.data,
          pagination: regionsResult.pagination,
          stats: stats,
          timestamp: new Date().toISOString(),
        },
      });
    },
    {
      rateLimit: { windowMs: 60000, max: 100 },
    }
  )(request, context);
}

// POST - Créer une région (admin seulement)
export async function POST(request: NextRequest, context: ApiContext) {
  return withAdminAuth(
    async (req, ctx) => {
      const body = await req.json();
      
      const formData = new FormData();
      formData.append('name', body.name);
      formData.append('code', body.code);
      if (body.description) formData.append('description', body.description);
      if (body.color) formData.append('color', body.color);
      
      const result = await createRegion(formData);

      return Response.json({
        success: true,
        message: 'Région créée avec succès',
        data: {
          regionId: result.id,
          createdBy: ctx.firebaseUser?.uid,
          timestamp: new Date().toISOString(),
        },
      });
    },
    {}
  )(request, context);
}