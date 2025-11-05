import { NextRequest, NextResponse } from 'next/server';
import { addFighterToEdition, removeFighterFromEdition, getEditionFighters } from '@/actions/editions';
// import { getEditionFighters } from '@/actions/editions';

interface Props {
  params: Promise<{ editionId: string }>
}

export async function GET(
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

    const filters = {
      search: searchParams.get('search') || undefined,
      page: searchParams.has('page') ? Number(searchParams.get('page')) : undefined,
      limit: searchParams.has('limit') ? Number(searchParams.get('limit')) : undefined,
      status: searchParams.get('status') || undefined,
      region_id: searchParams.has('region_id') ? Number(searchParams.get('region_id')) : undefined,
      with_region: searchParams.has('with_region') ? searchParams.get('with_region') === 'true' : undefined,
      with_fighter: searchParams.has('with_fighter') ? searchParams.get('with_fighter') === 'true' : undefined,
      sort_by: searchParams.get('sort_by') || undefined,
      sort_order: (searchParams.get('sort_order') as 'asc' | 'desc') || undefined,
    };

    const result = await getEditionFighters(editionIdNum, filters);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Erreur GET /api/editions/[editionId]/fighters:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la récupération des lutteurs' },
      { status: 500 }
    );
  }
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
    const { fighter_id, status = 'registered' } = body;

    if (!fighter_id) {
      return NextResponse.json({ error: 'ID de lutteur requis' }, { status: 400 });
    }

    const result = await addFighterToEdition(editionIdNum, fighter_id, status);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Erreur POST /api/editions/[editionId]/fighters:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de l\'ajout du lutteur' },
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
    const fighterId = searchParams.get('fighter_id');

    if (!fighterId) {
      return NextResponse.json({ error: 'ID de lutteur requis' }, { status: 400 });
    }

    const result = await removeFighterFromEdition(editionIdNum, Number(fighterId));
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Erreur DELETE /api/editions/[editionId]/fighters:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors du retrait du lutteur' },
      { status: 500 }
    );
  }
}