import { NextRequest } from 'next/server';
import { getMobileEditionById } from '@/actions/mobile/editions';
import { publicHandler, ApiContext } from '@/lib/api-handler';

export const GET = publicHandler(async (request: NextRequest, context: ApiContext) => {
  const { editionId } = await context.params!;
  const id = parseInt(editionId);

  if (isNaN(id) || id <= 0) {
    return Response.json({
      success: false,
      error: {
        code: 400,
        message: 'ID d\'édition invalide',
        timestamp: new Date().toISOString()
      }
    }, { status: 400 });
  }

  const result = await getMobileEditionById(id);
  
  if (!result.success) {
    return Response.json(result, { 
      status: (result as any).error?.code || 500
    });
  }

  return Response.json(result);
}, ['GET']);