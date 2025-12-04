import { NextRequest, NextResponse } from 'next/server';
import { getPhases, createPhase } from '@/actions/phases';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    const filters = {
      edition_id: searchParams.has('edition_id') ? Number(searchParams.get('edition_id')) : undefined,
      search: searchParams.get('search') || undefined,
      phase_type: searchParams.get('phase_type') || undefined,
      is_active: searchParams.get('is_active') || undefined,
      page: searchParams.has('page') ? Number(searchParams.get('page')) : 1,
      limit: searchParams.has('limit') ? Number(searchParams.get('limit')) : 20,
      with_edition: searchParams.get('with_edition') !== 'false',
      with_groups: searchParams.get('with_groups') !== 'false',
      with_subGroups: searchParams.get('with_subGroups') !== "false",
      with_matches: searchParams.get('with_matches') !== 'false',
    };


    const result = await getPhases({
      ...filters,
      phase_type: filters.phase_type as "qualification" | "group" | "knockout" | "quarterfinal" | "semifinal" | "final" | undefined,
      is_active: filters.is_active === "true" ? true : filters.is_active === "false" ? false : undefined
    });
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
