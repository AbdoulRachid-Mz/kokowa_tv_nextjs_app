// app/api/mobile/interactions/entity/[entityType]/[entityId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getMobileEntityInteractions } from '@/actions/mobile/interactions';
import { EntityType, InteractionType } from '@/types';

interface Props {
  params: Promise<{ entityType: EntityType; entityId: string }>
}

export async function GET(
  request: NextRequest,
  { params }: Props
) {
  try {
    const { entityType, entityId } = await params;
    const entityIdNum = Number(entityId);
    
    if (isNaN(entityIdNum)) {
      return NextResponse.json({
        success: false,
        error: {
          code: 400,
          message: 'ID d\'entité invalide',
          timestamp: new Date().toISOString()
        }
      }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    
    const filters = {
      interactionType: searchParams.get('interactionType') as InteractionType,
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20,
      withUser: searchParams.get('withUser') !== 'false'
    };

    const result = await getMobileEntityInteractions(entityType, entityIdNum, filters);
    
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('API Error GET /api/mobile/interactions/entity/[entityType]/[entityId]:', error);
    return NextResponse.json(
      { 
        success: false,
        error: {
          code: 500,
          message: error.message || 'Erreur lors de la récupération des interactions de l\'entité',
          timestamp: new Date().toISOString()
        }
      },
      { status: 500 }
    );
  }
}