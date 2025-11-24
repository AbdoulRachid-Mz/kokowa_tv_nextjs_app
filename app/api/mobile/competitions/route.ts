import { NextRequest } from 'next/server';
import { getMobileCompetitions } from '@/actions/mobile/competitions';
import { publicHandler } from '@/lib/api-handler';

export const GET = publicHandler(async (request: NextRequest) => {
  const result = await getMobileCompetitions();
  
  if (!result.success) {
    return Response.json(result, { 
      status: (result as any).error?.code || 500
    });
  }

  return Response.json(result);
}, ['GET']);