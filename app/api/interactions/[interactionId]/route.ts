// app/api/interactions/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getInteractionById, deleteInteraction } from '@/actions/interactions';

interface Props {
  params: Promise<{ interactionId: string }>
}

export async function GET(
  request: NextRequest,
  { params }: Props
) {
  try {
    const { interactionId } = await params;
    const idNum = Number(interactionId);
    
    if (isNaN(idNum)) {
      return NextResponse.json({ error: 'ID d\'interaction invalide' }, { status: 400 });
    }

    const withRelations = request.nextUrl.searchParams.get('with_relations') !== 'false';
    const result = await getInteractionById(idNum, { with_relations: withRelations });
    
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('API Error GET /api/interactions/[id]:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la récupération de l\'interaction' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: Props
) {
  try {
    const { interactionId } = await params;
    const idNum = Number(interactionId);
    
    if (isNaN(idNum)) {
      return NextResponse.json({ error: 'ID d\'interaction invalide' }, { status: 400 });
    }

    const result = await deleteInteraction(idNum);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('API Error DELETE /api/interactions/[id]:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la suppression de l\'interaction' },
      { status: 500 }
    );
  }
}