// app/api/matches/route.ts - VERSION CORRIGÉE
import { NextRequest, NextResponse } from 'next/server';
import { getMatches, createMatch } from '@/actions/matches'; // Note: correction du nom d'import
import { MatchFilters } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const subGroupParam = searchParams.get('sub_group_id') || searchParams.get('sub-group') || searchParams.get('sub_group');
    const editionParam = searchParams.get('edition_id') || searchParams.get('edition');
    const phaseParam = searchParams.get('phase_id') || searchParams.get('phase');
    const groupParam = searchParams.get('group_id') || searchParams.get('group');
    const competitionParam = searchParams.get('competition_id') || searchParams.get('competition');

    const filters: MatchFilters = {
      sub_group_id: subGroupParam ? Number(subGroupParam) : undefined,
      edition_id: editionParam ? Number(editionParam) : undefined,
      phase_id: phaseParam ? Number(phaseParam) : undefined,
      group_id: groupParam ? Number(groupParam) : undefined,
      competition_id: competitionParam ? Number(competitionParam) : undefined,
      status: (searchParams.get('status') as MatchFilters['status']) || undefined,
      date: searchParams.get('date') || undefined,
      date_from: searchParams.get('date_from') || undefined,
      date_to: searchParams.get('date_to') || undefined,
      period: (searchParams.get('period') as MatchFilters['period']) || undefined,
      search: searchParams.get('search') || undefined,
      is_active: searchParams.get('is_active') ? searchParams.get('is_active') === 'true' : undefined,
      page: searchParams.get('page') ? Number(searchParams.get('page')) : 1,
      limit: searchParams.get('limit') ? Number(searchParams.get('limit')) : 20,
      with_sub_group: searchParams.get('with_sub_group') !== 'false',
      with_fighters: searchParams.get('with_fighters') !== 'false',
      with_winner: searchParams.get('with_winner') === 'true',
      with_cards: searchParams.get('with_cards') === 'true',
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

    // Extract subGroupId and match data from formData
    const subGroupId = Number(formData.get('sub_group_id'));
    if (isNaN(subGroupId)) {
      return NextResponse.json(
        { error: 'sub_group_id is required and must be a number' },
        { status: 400 }
      );
    }

    const data = {
      match_number: formData.get('match_number') ? Number(formData.get('match_number')) : undefined,
      fighter1_id: formData.get('fighter1_id') ? Number(formData.get('fighter1_id')) : null,
      fighter2_id: formData.get('fighter2_id') ? Number(formData.get('fighter2_id')) : null,
      notes: formData.get('notes') ? String(formData.get('notes')) : null,
    };

    const result = await createMatch(subGroupId, data);

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