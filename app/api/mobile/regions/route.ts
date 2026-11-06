import { NextRequest } from 'next/server';
import { getMobileRegions } from '@/actions/mobile/regions';
import { publicHandler } from '@/lib/api-handler';

export const GET = publicHandler(
  async (request: NextRequest) => {
    try {
      const result = await getMobileRegions();

      if (!result.success) {
        return Response.json(result, { 
          status: (result as any).error?.code || 500,
        });
      }

      return Response.json(result);
    } catch (error) {
      console.error('Error in mobile regions API:', error);
      return Response.json(
        {
          success: false,
          error: {
            code: 500,
            message: 'Erreur serveur interne',
            timestamp: new Date().toISOString()
          }
        },
        { 
          status: 500,
        }
      );
    }
  },
  { allowedMethods: ['GET'], cacheControl: 'public, s-maxage=60, stale-while-revalidate=300' }
);
