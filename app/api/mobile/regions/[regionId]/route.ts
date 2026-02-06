import { NextRequest, NextResponse } from 'next/server';
import { getMobileRegionById } from '@/actions/mobile/regions';
import { publicHandler, ApiContext } from '@/lib/api-handler';
async function handler(request: NextRequest, context: ApiContext) {
  const { params } = context;
  if (!params) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 400,
          message: 'Paramètres manquants',
          timestamp: new Date().toISOString(),
        },
      },
      { status: 400 }
    );
  }

  const { regionId } = await params;
  const regionIdNumber = Number(regionId);
  const searchParams = request.nextUrl.searchParams;
  const userId = searchParams.get("userId") ? Number(searchParams.get("userId")) : undefined;
  const editionId = searchParams.get("editionId") ? Number(searchParams.get("editionId")) : undefined;

  if (isNaN(regionIdNumber) || regionIdNumber <= 0) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 400,
          message: 'Le paramètre region_id est requis et doit être un nombre valide',
          timestamp: new Date().toISOString(),
        },
      },
      { status: 400 }
    );
  }

  const result = await getMobileRegionById(regionIdNumber, userId, editionId);

  if (!result.success) {
    return NextResponse.json(result, { 
      status: (result as any).error?.code || 500,
    });
  }

  return NextResponse.json(result);
}

export const GET = publicHandler(handler, ['GET']);
