import { NextRequest } from 'next/server';
import { getMobileCompetitionById } from '@/actions/mobile/competitions';
import { publicHandler, ApiContext } from '@/lib/api-handler';

export const GET = publicHandler(async (request: NextRequest, context: ApiContext) => {
  const { competitionId } = await context.params!;
  const id = parseInt(competitionId);

  if (isNaN(id) || id <= 0) {
    return Response.json({
      success: false,
      error: {
        code: 400,
        message: 'ID de compétition invalide',
        timestamp: new Date().toISOString()
      }
    }, { status: 400 });
  }

  const { searchParams } = new URL(request.url);
  
  // Récupérer le paramètre with_editions
  const withEditions = searchParams.get('with_editions') !== 'false';

  const result = await getMobileCompetitionById(id, withEditions);
  
  if (!result.success) {
    return Response.json(result, { 
      status: (result as any).error?.code || 500
    });
  }

  return Response.json(result);
}, ['GET']);