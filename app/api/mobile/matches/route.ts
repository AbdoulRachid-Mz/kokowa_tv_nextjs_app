import { NextRequest } from 'next/server';

import { getMobileMatchesBySubGroup } from '@/actions/mobile/matches';
import { publicHandler } from '@/lib/api-handler';

export const GET = publicHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const subGroupId = searchParams.get('sub_group_id');

  if (!subGroupId) {
    return Response.json({
      success: false,
      error: {
        code: 400,
        message: 'Le paramètre sub_group_id est requis',
        timestamp: new Date().toISOString()
      }
    }, { status: 400 });
  }
  
  const page = searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1;
  const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20;

  const result = await getMobileMatchesBySubGroup(parseInt(subGroupId), { page, limit });
  
  if (!result.success) {
    return Response.json(result, { 
      status: (result as any).error?.code || 500
    });
  }

  return Response.json(result);
}, ['GET']);