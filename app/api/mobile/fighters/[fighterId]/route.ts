import { NextRequest } from 'next/server';
import { getMobileFighterById } from '@/actions/mobile/fighters';
import { publicHandler, ApiContext } from '@/lib/api-handler';

export const GET = publicHandler(async (request: NextRequest, context: ApiContext) => {
  const { fighterId } = await context.params!;
  const id = parseInt(fighterId);

  if (isNaN(id) || id <= 0) {
    return Response.json({
      success: false,
      error: {
        code: 400,
        message: 'Le paramètre fighter_id est requis et doit être un nombre valide',
        timestamp: new Date().toISOString()
      }
    }, { status: 400 });
  }

  const result = await getMobileFighterById(id);
  
  if (!result.success) {
    return Response.json(result, { 
      status: (result as any).error?.code || 500
    });
  }

  return Response.json(result);
}, ['GET']);