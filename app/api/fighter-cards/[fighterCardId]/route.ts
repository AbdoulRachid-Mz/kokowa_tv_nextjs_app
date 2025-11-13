// app/api/fighter-cards/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getFighterCardById, updateFighterCard, deleteFighterCard } from '@/actions/fighter-cards';

interface Props {
  params: Promise<{ fighterCardId: string }>
}

export async function GET(
  request: NextRequest,
  { params }: Props
) {
  try {
    const { fighterCardId } = await params;
    const idNum = Number(fighterCardId);
    
    if (isNaN(idNum)) {
      return NextResponse.json({ error: 'ID de carton invalide' }, { status: 400 });
    }

    const result = await getFighterCardById(idNum);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('API Error GET /api/fighter-cards/[id]:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la récupération du carton' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: Props
) {
  try {
    const { fighterCardId } = await params;
    const idNum = Number(fighterCardId);
    
    if (isNaN(idNum)) {
      return NextResponse.json({ error: 'ID de carton invalide' }, { status: 400 });
    }

    const formData = await request.formData();
    const result = await updateFighterCard(idNum, formData);
    
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('API Error PUT /api/fighter-cards/[id]:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la modification du carton' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: Props
) {
  try {
    const { fighterCardId } = await params;
    const idNum = Number(fighterCardId);
    
    if (isNaN(idNum)) {
      return NextResponse.json({ error: 'ID de carton invalide' }, { status: 400 });
    }

    const result = await deleteFighterCard(idNum);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('API Error DELETE /api/fighter-cards/[id]:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la suppression du carton' },
      { status: 500 }
    );
  }
}