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

  const result = await getMobileRegionById(regionIdNumber);

  if (!result.success) {
    return NextResponse.json(result, { 
      status: (result as any).error?.code || 500,
    });
  }

  return NextResponse.json(result);
}

export const GET = publicHandler(handler, ['GET']);
