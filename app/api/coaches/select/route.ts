// app/api/coaches/select/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getCoachesForSelect } from '@/actions/coaches';

export async function GET(request: NextRequest) {
  try {
    const coaches = await getCoachesForSelect();
    
    return NextResponse.json({ coaches });
  } catch (error) {
    console.error('Error in GET /api/coaches/select:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des coachs' },
      { status: 500 }
    );
  }
}