import { NextRequest, NextResponse } from 'next/server';
import { getPhases, createPhase } from '@/actions/phases';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    const filters = {
      edition_id: searchParams.has('edition_id') ? Number(searchParams.get('edition_id')) : undefined,
      search: searchParams.get('search') || undefined,
      page: searchParams.has('page') ? Number(searchParams.get('page')) : 1,
      limit: searchParams.has('limit') ? Number(searchParams.get('limit')) : 20,
      with_edition: searchParams.get('with_edition') !== 'false',
      with_groups: searchParams.get('with_groups') === 'true',
    };

    const result = await getPhases(filters);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const result = await createPhase(formData);
    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    );
  }
}
