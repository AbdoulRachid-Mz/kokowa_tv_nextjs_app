import { NextRequest, NextResponse } from 'next/server';
import { getMediaStats } from '@/actions/media';

export async function GET(request: NextRequest) {
  try {
    const stats = await getMediaStats();
    
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error in GET /api/media/stats:', error);
    return NextResponse.json(
      { 
        error: 'Erreur lors de la récupération des statistiques',
        stats: []
      },
      { status: 500 }
    );
  }
}