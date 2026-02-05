// app/api/mobile/interactions/user/[userId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getMobileUserInteractions } from '@/actions/mobile/interactions';
import { EntityType, InteractionType } from '@/types';

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
      return NextResponse.json({
        success: false,
        error: {
          code: 400,
          message: 'ID utilisateur invalide',
          timestamp: new Date().toISOString()
        }
      }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    
    const filters = {
      entityType: searchParams.get('entityType') as EntityType || undefined,
      entityId: searchParams.get('entityId') ? parseInt(searchParams.get('entityId')!) : undefined,
      interactionType: searchParams.get('interactionType') as InteractionType,
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20,
      withUser: searchParams.get('withUser') !== 'false'
    };

    const result = await getMobileUserInteractions(userIdNum, filters);
    
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('API Error GET /api/mobile/interactions/user/[userId]:', error);
    return NextResponse.json(
      { 
        success: false,
        error: {
          code: 500,
          message: error.message || 'Erreur lors de la récupération des interactions utilisateur',
          timestamp: new Date().toISOString()
        }
      },
      { status: 500 }
    );
  }
}