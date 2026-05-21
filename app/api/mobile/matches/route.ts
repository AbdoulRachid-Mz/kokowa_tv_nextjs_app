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

  const id = parseInt(subGroupId);
  
  if (isNaN(id) || id <= 0) {
    return Response.json({
      success: false,
      error: {
        code: 400,
        message: 'sub_group_id doit être un nombre valide',
        timestamp: new Date().toISOString()
      }
    }, { status: 400 });
  }

  const result = await getMobileMatchesBySubGroup(id);
  
  if (!result.success) {
    return Response.json(result, { 
      status: (result as any).error?.code || 500
    });
  }

  return Response.json(result);
}, ['GET']);