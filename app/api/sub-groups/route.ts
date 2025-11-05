import { getSubGroups, createSubGroup } from '@/actions/sub-groups';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filters = {
      group_id: searchParams.get('group_id') ? Number(searchParams.get('group_id')) : undefined,
      search: searchParams.get('search') || undefined,
      page: searchParams.get('page') ? Number(searchParams.get('page')) : undefined,
      limit: searchParams.get('limit') ? Number(searchParams.get('limit')) : undefined,
      with_group: searchParams.get('with_group') !== 'false',
      with_matches: searchParams.get('with_matches') === 'true',
      with_belts: searchParams.get('with_belts') !== 'false',
    };

    const result = await getSubGroups(filters);
    return NextResponse.json(result);
  } catch (error) {
    console.error('API sub-groups GET error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des sous-groupes' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const result = await createSubGroup(formData);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('API sub-groups POST error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur lors de la création du sous-groupe' },
      { status: 500 }
    );
  }
}
