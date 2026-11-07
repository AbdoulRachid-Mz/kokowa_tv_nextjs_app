// app/api/mobile/achievements/route.ts
import { NextRequest } from 'next/server';
import { getMobileAchievements } from '@/actions/mobile/achievements';
import { publicHandler } from '@/lib/api-handler';

export const GET = publicHandler(
  async (request: NextRequest) => {
    try {
      const { searchParams } = new URL(request.url);
      const filters = {
        entityType: (searchParams.get('entityType') as any) || undefined,
        type: searchParams.get('type') || undefined,
        editionId: searchParams.get('editionId')
          ? Number(searchParams.get('editionId'))
          : undefined,
        year: searchParams.get('year') ? Number(searchParams.get('year')) : undefined,
        position: searchParams.get('position') || undefined,
        limit: searchParams.get('limit') ? Number(searchParams.get('limit')) : undefined,
      };

      const result = await getMobileAchievements(filters);

      if (!result.success) {
        return Response.json(result, {
          status: (result as any).error?.code || 500,
        });
      }

      return Response.json(result);
    } catch (error) {
      console.error('Error in mobile achievements API:', error);
      return Response.json(
        {
          success: false,
          error: {
            code: 500,
            message: 'Erreur serveur interne',
            timestamp: new Date().toISOString(),
          },
        },
        { status: 500 },
      );
    }
  },
  { allowedMethods: ['GET'], cacheControl: 'public, s-maxage=120, stale-while-revalidate=600' },
);
