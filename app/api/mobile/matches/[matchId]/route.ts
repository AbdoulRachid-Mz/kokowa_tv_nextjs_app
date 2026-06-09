// app/api/mobile/matches/[matchId]/route.ts
import { NextRequest } from 'next/server';
import { getMobileMatchById } from '@/actions/mobile/matches';
import { publicHandler, ApiContext } from '@/lib/api-handler';

export const GET = publicHandler(async (request: NextRequest, context: ApiContext) => {
  const { matchId } = await context.params!;
  const id = parseInt(matchId);

  if (isNaN(id) || id <= 0) {
    return Response.json({
      success: false,
      error: {
        code: 400,
        message: 'Le paramètre match_id est requis et doit être un nombre valide',
        timestamp: new Date().toISOString(),
      },
    }, { status: 400 });
  }

  const result = await getMobileMatchById(id);

  if (!result.success) {
    return Response.json(result, {
      status: (result as any).error?.code || 500,
    });
  }

  return Response.json(result);
}, ['GET']);