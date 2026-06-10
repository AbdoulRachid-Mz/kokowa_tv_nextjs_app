import { NextRequest } from 'next/server';
import { getMobileFighterMatches } from '@/actions/mobile/fighters';
import { publicHandler, ApiContext } from '@/lib/api-handler';

export const GET = publicHandler(async (request: NextRequest, context: ApiContext) => {
  const { fighterId } = await context.params!;
  const id = parseInt(fighterId);
  const searchParams = request.nextUrl.searchParams;
   const editionId = searchParams.get("editionId") ? Number(searchParams.get("editionId")) : undefined;
   const page = searchParams.get("page") ? Number(searchParams.get("page")) : 1;
   const limit = searchParams.get("limit") ? Number(searchParams.get("limit")) : 20;
   const all = searchParams.get("allEditions") === "true" || searchParams.get("all") === "true";

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

  const result = await getMobileFighterMatches(id, editionId, { page, limit, all });
  
  if (!result.success) {
    return Response.json(result, { 
      status: (result as any).error?.code || 500
    });
  }

  return Response.json(result);
}, ['GET']);