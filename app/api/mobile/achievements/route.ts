// app/api/mobile/achievements/route.ts
import { NextRequest } from 'next/server';
import { getMobileAchievements } from '@/actions/mobile/achievements';
import { publicHandler } from '@/lib/api-handler';

export const GET = publicHandler(
  async (request: NextRequest) => {
    try {
      const { searchParams } = new URL(request.url);

      // Validation des paramètres entrants
      const rawEntityType = searchParams.get('entityType');
      const allowedEntityTypes = ['fighter', 'region', 'others', 'all'];
      if (rawEntityType && !allowedEntityTypes.includes(rawEntityType)) {
        return Response.json(
          { success: false, error: { code: 400, message: 'entityType invalide', timestamp: new Date().toISOString() } },
          { status: 400 },
        );
      }

      const rawEditionId = searchParams.get('editionId');
      const editionId = rawEditionId ? Number(rawEditionId) : undefined;
      if (rawEditionId && (isNaN(editionId!) || editionId! <= 0)) {
        return Response.json(
          { success: false, error: { code: 400, message: 'editionId invalide', timestamp: new Date().toISOString() } },
          { status: 400 },
        );
      }

      const rawYear = searchParams.get('year');
      const year = rawYear ? Number(rawYear) : undefined;
      if (rawYear && (isNaN(year!) || year! < 1900 || year! > 2100)) {
        return Response.json(
          { success: false, error: { code: 400, message: 'year invalide', timestamp: new Date().toISOString() } },
          { status: 400 },
        );
      }

      const rawLimit = searchParams.get('limit');
      const limit = rawLimit ? Number(rawLimit) : undefined;
      if (rawLimit && (isNaN(limit!) || limit! <= 0 || limit! > 500)) {
        return Response.json(
          { success: false, error: { code: 400, message: 'limit invalide (1-500)', timestamp: new Date().toISOString() } },
          { status: 400 },
        );
      }

      const filters = {
        entityType: (rawEntityType as any) || undefined,
        type: searchParams.get('type') || undefined,
        editionId,
        year,
        position: searchParams.get('position') || undefined,
        limit,
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
  { allowedMethods: ['GET'], cacheControl: 'no-store' },
);
