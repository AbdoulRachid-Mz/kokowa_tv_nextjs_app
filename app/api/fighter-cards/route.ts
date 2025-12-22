// app/api/fighter-cards/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getFighterCards, createFighterCard } from '@/actions/fighter-cards';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const filters = {
      fighter_id: searchParams.get('fighter_id') ? parseInt(searchParams.get('fighter_id')!) : undefined,
      match_id: searchParams.get('match_id') ? parseInt(searchParams.get('match_id')!) : undefined,
      card_type: searchParams.get('card_type') || undefined,
      is_cancelled: searchParams.get('is_cancelled') ? searchParams.get('is_cancelled') === 'true' : undefined,
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20,
      with_fighter: searchParams.get('with_fighter') !== 'false',
      with_match: searchParams.get('with_match') !== 'false',
    };

    const result = await getFighterCards(filters);
    
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('API Error GET /api/fighter-cards:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la récupération des cartons' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const result = await createFighterCard(formData);
    
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('API Error POST /api/fighter-cards:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la création du carton' },
      { status: 500 }
    );
  }
}