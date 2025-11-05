import { NextRequest, NextResponse } from 'next/server';
import { getEditionRegions } from '@/actions/editions';

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
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20,
      status: searchParams.get('status') || undefined,
      with_region: searchParams.get('with_region') !== 'false',
      sort_by: searchParams.get('sort_by') || 'name',
      sort_order: (searchParams.get('sort_order') as 'asc' | 'desc') || 'asc',
    };

    const result = await getEditionRegions(editionIdNum, filters);
    
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('API Error GET /api/editions/[editionId]/regions/list:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la récupération des régions' },
      { status: 500 }
    );
  }
}