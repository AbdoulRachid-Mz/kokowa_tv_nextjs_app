import { NextRequest, NextResponse } from 'next/server';
import { getStats } from '@/actions/stats';

interface RouteParams {
  params: Promise<{
    entity: string;
    statId: string;
  }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { searchParams } = new URL(request.url);
    const { entity, statId } = await params;
    
    const filters = {
      entity,
      statId,
      date_from: searchParams.get('date_from') || undefined,
      date_to: searchParams.get('date_to') || undefined,
      region_id: searchParams.get('region_id') ? parseInt(searchParams.get('region_id')!) : undefined,
      edition_id: searchParams.get('edition_id') ? parseInt(searchParams.get('edition_id')!) : undefined,
      competition_id: searchParams.get('competition_id') ? parseInt(searchParams.get('competition_id')!) : undefined,
      year: searchParams.get('year') ? parseInt(searchParams.get('year')!) : undefined,
      group_by: (searchParams.get('group_by') as 'day' | 'week' | 'month' | 'year' | 'quarter') || 'month',
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 10,
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : undefined,
      sort_by: searchParams.get('sort_by') || undefined,
      sort_order: (searchParams.get('sort_order') as 'asc' | 'desc') || undefined,
    };

    const result = await getStats(filters);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in GET /api/stats/[entity]/[statId]:', error);
    
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