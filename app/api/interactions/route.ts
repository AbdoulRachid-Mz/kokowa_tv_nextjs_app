// app/api/interactions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getInteractions, createInteraction, getInteractionStats } from '@/actions/interactions';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Route pour les statistiques
    if (searchParams.get('stats')) {
      const entityType = searchParams.get('entity_type') || undefined;
      const entityId = searchParams.get('entity_id') ? parseInt(searchParams.get('entity_id')!) : undefined;
      
      const result = await getInteractionStats(entityType, entityId);
      return NextResponse.json(result);
    }

    const filters = {
      user_id: searchParams.get('user_id') ? parseInt(searchParams.get('user_id')!) : undefined,
      entity_type: searchParams.get('entity_type') || undefined,
      entity_id: searchParams.get('entity_id') ? parseInt(searchParams.get('entity_id')!) : undefined,
      interaction_type: searchParams.get('interaction_type') || undefined,
      search: searchParams.get('search') || undefined,
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20,
      with_user: searchParams.get('with_user') !== 'false',
    };

    const result = await getInteractions(filters);
    
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('API Error GET /api/interactions:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la récupération des interactions' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const result = await createInteraction(formData);
    
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('API Error POST /api/interactions:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la création de l\'interaction' },
      { status: 500 }
    );
  }
}