// app/api/matches/route.ts - VERSION CORRIGÉE
import { NextRequest, NextResponse } from 'next/server';
import { getMatches, createMatch } from '@/actions/matches'; // Note: correction du nom d'import
import { MatchFilters } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const filters: MatchFilters = {
      sub_group_id: searchParams.get('sub_group_id') ? Number(searchParams.get('sub_group_id')) : undefined,
      edition_id: searchParams.get('edition_id') ? Number(searchParams.get('edition_id')) : undefined,
      phase_id: searchParams.get('phase_id') ? Number(searchParams.get('phase_id')) : undefined,
      group_id: searchParams.get('group_id') ? Number(searchParams.get('group_id')) : undefined,
      status: (searchParams.get('status') as MatchFilters['status']) || undefined,
      date_from: searchParams.get('date_from') || undefined,
      date_to: searchParams.get('date_to') || undefined,
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