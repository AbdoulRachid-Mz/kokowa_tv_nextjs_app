import { NextRequest, NextResponse } from 'next/server';
import { getMobileRegions } from '@/actions/mobile/regions';

export async function GET(request: NextRequest) {
  try {
    // Gestion des headers CORS pour mobile
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

    const result = await getMobileRegions();

    if (!result.success) {
      return NextResponse.json(result, { 
        status: (result as any).error?.code || 500,
        headers 
      });
    }

    return NextResponse.json(result, { headers });
  } catch (error) {
    console.error('Error in mobile regions API:', error);
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