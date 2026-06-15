import { NextRequest } from 'next/server';

import { getMobileTransfers } from '@/actions/mobile/transfers';
import { publicHandler } from '@/lib/server/api-handler';

export const GET = publicHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  
  // Récupérer les paramètres de filtrage
  const search = searchParams.get('search');
  const fighterId = searchParams.get('fighter_id');
  const regionId = searchParams.get('region_id');
  const status = searchParams.get('status');
  const limit = searchParams.get('limit');
  const offset = searchParams.get('offset');

  // Construire l'objet filters
  const filters: any = {};

  if (fighterId) {
    const id = parseInt(fighterId);
    if (isNaN(id) || id <= 0) {
      return Response.json({
        success: false,
        error: {
          code: 400,
          message: 'fighter_id doit être un nombre valide',
          timestamp: new Date().toISOString()
        }
      }, { status: 400 });
    }
    filters.fighter_id = id;
  }

  if (regionId) {
    const id = parseInt(regionId);
    if (isNaN(id) || id <= 0) {
      return Response.json({
        success: false,
        error: {
          code: 400,
          message: 'region_id doit être un nombre valide',
          timestamp: new Date().toISOString()
        }
      }, { status: 400 });
    }
    filters.region_id = id;
  }

  if (status) {
    filters.status = status;
  }

  if (search) {
    filters.search = search;
  }
  
  if (limit) {
    const limitNum = parseInt(limit);
    if (!isNaN(limitNum) && limitNum > 0) {
      filters.limit = Math.min(limitNum, 100); // Limiter à 100 maximum
    }
  }

  if (offset) {
    const offsetNum = parseInt(offset);
    if (!isNaN(offsetNum) && offsetNum >= 0) {
      filters.offset = offsetNum;
    }
  }

  if (search) {
    filters.search = search;
  }
  
  const result = await getMobileTransfers(filters);
  
  if (!result.success) {
    return Response.json(result, { 
      status: (result as any).error?.code || 500
    });
  }

  return Response.json(result);
}, { allowedMethods: ['GET'], skipAppIdValidation: true });
