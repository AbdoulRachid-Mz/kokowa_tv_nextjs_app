import { NextRequest, NextResponse } from 'next/server';
import { getMobileRegionById } from '@/actions/mobile/regions';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ regionId: string }> }
) {
  try {
    const { regionId } = await params;
    const regionIdNumber = Number(regionId);

    // Headers CORS pour mobile
    const headers = {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    // Gérer les requêtes OPTIONS pour CORS
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, { status: 200, headers });
    }

    if (isNaN(regionIdNumber) || regionIdNumber <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 400,
            message: 'Le paramètre region_id est requis et doit être un nombre valide',
            timestamp: new Date().toISOString()
          }
        },
        { status: 400, headers }
      );
    }

    const result = await getMobileRegionById(regionIdNumber);

    if (!result.success) {
      return NextResponse.json(result, { 
        status: (result as any).error?.code || 500,
        headers 
      });
    }

    return NextResponse.json(result, { headers });
  } catch (error) {
    console.error('Error in mobile region by id API:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 500,
          message: 'Erreur serveur interne',
          timestamp: new Date().toISOString()
        }
      },
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        }
      }
    );
  }
}