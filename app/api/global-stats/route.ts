// app/api/stats/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getStats } from '@/actions/stats';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const filters = {
      entity: searchParams.get('entity') || undefined,
      statId: searchParams.get('statId') || undefined,
      date_from: searchParams.get('date_from') || undefined,
      date_to: searchParams.get('date_to') || undefined,
      region_id: searchParams.get('region_id') ? parseInt(searchParams.get('region_id')!) : undefined,
      edition_id: searchParams.get('edition_id') ? parseInt(searchParams.get('edition_id')!) : undefined,
      competition_id: searchParams.get('competition_id') ? parseInt(searchParams.get('competition_id')!) : undefined,
      year: searchParams.get('year') ? parseInt(searchParams.get('year')!) : undefined,
      group_by: searchParams.get('group_by') as any || 'month',
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 10,
    };

    const result = await getStats(filters);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in GET /api/stats:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des statistiques' },
      { status: 500 }
    );
  }
}