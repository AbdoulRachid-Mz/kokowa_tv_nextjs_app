// app/api/matches/route.ts - VERSION CORRIGÉE
import { NextRequest, NextResponse } from 'next/server';
import { getMatches, createMatch } from '@/actions/matchs'; // Note: correction du nom d'import
import { MatchFilters } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const filters: MatchFilters = {
      sub_group_id: searchParams.get('sub_group_id') ? Number(searchParams.get('sub_group_id')) : undefined,
      edition_id: searchParams.get('edition_id') ? Number(searchParams.get('edition_id')) : undefined,
      phase_id: searchParams.get('phase_id') ? Number(searchParams.get('phase_id')) : undefined,
      group_id: searchParams.get('group_id') ? Number(searchParams.get('group_id')) : undefined,
      status: searchParams.get('status') || undefined,
      date_from: searchParams.get('date_from') || undefined,
      date_to: searchParams.get('date_to') || undefined,
      search: searchParams.get('search') || undefined,
      page: searchParams.get('page') ? Number(searchParams.get('page')) : 1,
      limit: searchParams.get('limit') ? Number(searchParams.get('limit')) : 20,
      with_sub_group: searchParams.get('with_sub_group') !== 'false',
      with_fighters: searchParams.get('with_fighters') !== 'false',
      // with_regions: searchParams.get('with_regions') !== 'false',
      // with_referees: searchParams.get('with_referees') === 'true',
    };
    
    const result = await getMatches(filters);
    
    return NextResponse.json(result);
    
  } catch (error: any) {
    console.error('API GET /matches error:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Erreur lors de la récupération des matches' 
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const result = await createMatch(formData);
    
    return NextResponse.json(result, { status: 201 });
    
  } catch (error: any) {
    console.error('API POST /matches error:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Erreur lors de la création du match' 
      },
      { status: 500 }
    );
  }
}