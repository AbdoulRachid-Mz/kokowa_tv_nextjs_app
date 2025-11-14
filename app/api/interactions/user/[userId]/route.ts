// app/api/interactions/user/[userId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getUserInteractions } from '@/actions/interactions';

interface Props {
  params: Promise<{ userId: string }>
}

export async function GET(
  request: NextRequest,
  { params }: Props
) {
  try {
    const { userId } = await params;
    const userIdNum = Number(userId);
    
    if (isNaN(userIdNum)) {
      return NextResponse.json({ error: 'ID utilisateur invalide' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    
    const filters = {
      entity_type: searchParams.get('entity_type') || undefined,
      entity_id: searchParams.get('entity_id') ? parseInt(searchParams.get('entity_id')!) : undefined,
      interaction_type: searchParams.get('interaction_type') || undefined,
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20,
      with_user: searchParams.get('with_user') !== 'false',
    };

    const result = await getUserInteractions(userIdNum, filters);
    
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('API Error GET /api/interactions/user/[userId]:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la récupération des interactions utilisateur' },
      { status: 500 }
    );
  }
}