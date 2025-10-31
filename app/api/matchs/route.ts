import { NextRequest, NextResponse } from 'next/server';
import { getMatches, createMatch, MatchFilters } from '@/actions/matchs';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const filters: MatchFilters = {};
    const phase_id = searchParams.get('phase_id');
    const status = searchParams.get('status');
    const page = searchParams.get('page');
    const limit = searchParams.get('limit');
    const with_fighters = searchParams.get('with_fighters');
    const with_sub_group = searchParams.get('with_sub_group');
    const with_regions = searchParams.get('with_regions');
    const with_referees = searchParams.get('with_referees');
    
    if (phase_id) filters.phase_id = Number(phase_id);
    if (status) filters.status = status;
    if (page) filters.page = Number(page);
    if (limit) filters.limit = Number(limit);
    if (with_fighters) filters.with_fighters = with_fighters === 'true';
    if (with_sub_group) filters.with_sub_group = with_sub_group === 'true';
    if (with_regions) filters.with_regions = with_regions === 'true';
    if (with_referees) filters.with_referees = with_referees === 'true';
    
    const matches = await getMatches(filters);
    
    return NextResponse.json({
      success: true,
      ...matches
    });
    
  } catch (error: any) {
    console.error('API GET /matchs error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Erreur lors de la récupération des matchs' 
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
    console.error('API POST /matchs error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Erreur lors de la création du match' 
      },
      { status: 500 }
    );
  }
}