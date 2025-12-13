// /api/mobile/fighters
import { NextRequest } from 'next/server';
import { getMobileFighters } from '@/actions/mobile/fighters';
import { publicHandler } from '@/lib/api-handler';

export const GET = publicHandler(async (request: NextRequest) => {
  const result = await getMobileFighters();
  
  if (!result.success) {
    return Response.json(result, { 
      status: (result as any).error?.code || 500
    });
  }

  return Response.json(result);
}, ['GET']);