// /api/sub-groups
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
      with_matches: searchParams.get('with_matches') !== 'false',
      with_regions: searchParams.get('with_regions') !== 'false',
      with_belts: searchParams.get('with_belts') !== 'false',
      with_referee: searchParams.get('with_referee') !== 'false',
      is_active: searchParams.get('is_active') !== null ? searchParams.get('is_active') === 'true' : undefined,
      is_completed: searchParams.get('is_completed') !== null ? searchParams.get('is_completed') === 'true' : undefined,
      period: searchParams.get('period') === 'matin' || searchParams.get('period') === 'soir' ? searchParams.get('period') as 'matin' | 'soir' : undefined,
      status: searchParams.get('status') || undefined,
      region1_id: searchParams.get('region1_id') ? Number(searchParams.get('region1_id')) : undefined,
      region2_id: searchParams.get('region2_id') ? Number(searchParams.get('region2_id')) : undefined,
      belt_region1: searchParams.get('belt_region1') ? Number(searchParams.get('belt_region1')) : undefined,
      belt_region2: searchParams.get('belt_region2') ? Number(searchParams.get('belt_region2')) : undefined,
      main_referee_id: searchParams.get('main_referee_id') ? Number(searchParams.get('main_referee_id')) : undefined,
    };

    const result = await getSubGroups({
      ...filters,
      status: filters.status === 'upcoming' || filters.status === 'ongoing' || filters.status === 'completed' || filters.status === 'cancelled' || filters.status === 'postponed' ? filters.status : undefined,
    });
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
