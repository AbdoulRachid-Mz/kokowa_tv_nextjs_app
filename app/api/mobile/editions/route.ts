import { NextRequest } from 'next/server';
import { getMobileLatestEdition } from '@/actions/mobile/editions';
import { publicHandler } from '@/lib/api-handler';

export const GET = publicHandler(async (request: NextRequest) => {
  const result = await getMobileLatestEdition();
  
  if (!result.success) {
    return Response.json(result, { 
      status: (result as any).error?.code || 500
    });
  }

  return Response.json(result);
}, ['GET']);