import { createArchiveFighterAchievement, getArchiveFighterAchievements } from '@/actions/archives';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/fighters-archivements
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filters = {
      search: searchParams.get('search') || undefined,
      page: searchParams.get('page') ? Number(searchParams.get('page')) : undefined,
      limit: searchParams.get('limit') ? Number(searchParams.get('limit')) : undefined,
      fighter_id: searchParams.get('fighter_id') ? Number(searchParams.get('fighter_id')) : undefined,
      region_id: searchParams.get('region_id') ? Number(searchParams.get('region_id')) : undefined,
      edition_id: searchParams.get('edition_id') ? Number(searchParams.get('edition_id')) : undefined,
      year: searchParams.get('year') ? Number(searchParams.get('year')) : undefined,
      position: searchParams.get('position') ? Number(searchParams.get('position')) : undefined,
      date_from: searchParams.get('date_from') || undefined,
      date_to: searchParams.get('date_to') || undefined,
      with_fighter: searchParams.get('with_fighter') === 'true',
      with_region: searchParams.get('with_region') === 'true',
      with_edition: searchParams.get('with_edition') === 'true',
    };

    const data = await getArchiveFighterAchievements({
      ...filters,
      position: filters.position !== undefined ? String(filters.position) : undefined,
    });
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('GET /api/fighters-archivements error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/fighters-archivements
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await createArchiveFighterAchievement(body);
    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/fighters-archivements error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
