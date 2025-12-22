import { NextRequest, NextResponse } from 'next/server';
import { getArchiveFighterAchievements } from '@/actions/archives';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ fighterId: string }> }
) {
  try {
    const { searchParams } = new URL(request.url);
    const {fighterId} = await params
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const region_id = searchParams.get('region_id') ? Number(searchParams.get('region_id')) : undefined;
    const edition_id = searchParams.get('edition_id') ? Number(searchParams.get('edition_id')) : undefined;
    const year = searchParams.get('year') ? Number(searchParams.get('year')) : undefined;
    const position = searchParams.get('position') ? Number(searchParams.get('position')) : undefined;
    const archive_reason = searchParams.get('archive_reason') || '';
    const date_from = searchParams.get('date_from') || '';
    const date_to = searchParams.get('date_to') || '';
    const with_fighter = searchParams.get('with_fighter') === 'true';
    const with_region = searchParams.get('with_region') === 'true';
    const with_edition = searchParams.get('with_edition') === 'true';

    const filters = {
      search,
      page,
      limit,
      fighter_id: Number(fighterId),
      region_id,
      edition_id,
      year,
      position,
      archive_reason,
      date_from,
      date_to,
      with_fighter,
      with_region,
      with_edition,
    };

    const data = await getArchiveFighterAchievements({
      ...filters,
      position: filters.position?.toString(),
    });
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching fighter archives:', error);
    return NextResponse.json(
      { error: 'Failed to fetch fighter archives' },
      { status: 500 }
    );
  }
}
