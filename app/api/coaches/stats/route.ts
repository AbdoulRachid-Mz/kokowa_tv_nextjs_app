// app/api/coaches/stats/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getCoachStats } from '@/actions/coaches';

export async function GET(request: NextRequest) {
  try {
    const stats = await getCoachStats();
    
    return NextResponse.json({ stats });
  } catch (error) {
    console.error('Error in GET /api/coaches/stats:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des statistiques' },
      { status: 500 }
    );
  }
}