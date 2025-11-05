import { NextRequest, NextResponse } from 'next/server';
import { addRegionToEdition, removeRegionFromEdition } from '@/actions/editions';

interface Props {
  params: Promise<{ editionId: string }>
}

export async function POST(
  request: NextRequest,
  { params }: Props
) {
  try {
    const { editionId } = await params;
    const editionIdNum = Number(editionId);
    
    if (isNaN(editionIdNum)) {
      return NextResponse.json({ error: 'ID d\'édition invalide' }, { status: 400 });
    }

    const body = await request.json();
    const { region_id, status = 'registered' } = body;

    if (!region_id) {
      return NextResponse.json({ error: 'ID de région requis' }, { status: 400 });
    }

    const result = await addRegionToEdition(editionIdNum, region_id, status);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Erreur POST /api/editions/[editionId]/regions:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de l\'ajout de la région' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: Props
) {
  try {
    const { editionId } = await params;
    const editionIdNum = Number(editionId);
    
    if (isNaN(editionIdNum)) {
      return NextResponse.json({ error: 'ID d\'édition invalide' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const regionId = searchParams.get('region_id');

    if (!regionId) {
      return NextResponse.json({ error: 'ID de région requis' }, { status: 400 });
    }

    const result = await removeRegionFromEdition(editionIdNum, Number(regionId));
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Erreur DELETE /api/editions/[editionId]/regions:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors du retrait de la région' },
      { status: 500 }
    );
  }
}