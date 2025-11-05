import { NextRequest, NextResponse } from 'next/server';
import { getPhaseGroups, createPhaseGroup } from '@/actions/phase-groups';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const filters = {
      phase_id: searchParams.has('phase_id') ? Number(searchParams.get('phase_id')) : undefined,
      search: searchParams.get('search') || undefined,
      page: searchParams.has('page') ? Number(searchParams.get('page')) : 1,
      limit: searchParams.has('limit') ? Number(searchParams.get('limit')) : 20,
      with_phase: searchParams.get('with_phase') !== 'false',
      with_sub_groups: searchParams.get('with_sub_groups') === 'true',
    };

    const result = await getPhaseGroups(filters);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('API Error GET /api/phase-groups:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const formData = new FormData();
    Object.entries(body).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, value.toString());
      }
    });

    const createSubGroups = body.create_sub_groups ? Number(body.create_sub_groups) : 0;
    const result = await createPhaseGroup(formData, { create_sub_groups: createSubGroups });
    
    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error('API Error POST /api/phase-groups:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la création du groupe' },
      { status: 500 }
    );
  }
}