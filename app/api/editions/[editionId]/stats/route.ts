import { NextRequest, NextResponse } from 'next/server';
import { getEditionById } from '@/actions/editions';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ editionId: string }> }
) {
  try {
    const { editionId } = await params;
    const editionIdNumber = Number(editionId);
    if (isNaN(editionIdNumber)) {
      return NextResponse.json({ error: 'Invalid editionId' }, { status: 400 });
    }

    const edition = await getEditionById(editionIdNumber, { with_relations: true });
    if (!edition) {
      return NextResponse.json({ error: 'Edition not found' }, { status: 404 });
    }

    // Compute stats from relations
    const stats = {
      total_fighters: edition.fighters?.length ?? 0,
      total_regions: edition.regions?.length ?? 0,
      total_phases: edition.phases?.length ?? 0,
      fighters_by_status: (edition.fighters ?? []).reduce((acc: Record<string, number>, f: any) => {
        acc[f.status] = (acc[f.status] || 0) + 1;
        return acc;
      }, {}),
      regions_by_status: (edition.regions ?? []).reduce((acc: Record<string, number>, r: any) => {
        acc[r.status] = (acc[r.status] || 0) + 1;
        return acc;
      }, {}),
      completed_phases: (edition.phases ?? []).filter((p: any) => p.is_completed).length,
      ongoing_phases: (edition.phases ?? []).filter((p: any) => !p.is_completed).length,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('GET /api/editions/[editionId]/stats error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ editionId: string }> }
) {
  try {
    const { editionId } = await params;
    const editionIdNumber = Number(editionId);
    if (isNaN(editionIdNumber)) {
      return NextResponse.json({ error: 'Invalid editionId' }, { status: 400 });
    }

    const body = await request.json();

    // Optional: allow custom stat computation via body
    const edition = await getEditionById(editionIdNumber, { with_relations: true });
    if (!edition) {
      return NextResponse.json({ error: 'Edition not found' }, { status: 404 });
    }

    const stats = {
      total_fighters: edition.fighters?.length ?? 0,
      total_regions: edition.regions?.length ?? 0,
      total_phases: edition.phases?.length ?? 0,
      fighters_by_status: (edition.fighters ?? []).reduce((acc: Record<string, number>, f: any) => {
        acc[f.status] = (acc[f.status] || 0) + 1;
        return acc;
      }, {}),
      regions_by_status: (edition.regions ?? []).reduce((acc: Record<string, number>, r: any) => {
        acc[r.status] = (acc[r.status] || 0) + 1;
        return acc;
      }, {}),
      completed_phases: (edition.phases ?? []).filter((p: any) => p.is_completed).length,
      ongoing_phases: (edition.phases ?? []).filter((p: any) => !p.is_completed).length,
      ...(body.extraStats || {}),
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('POST /api/editions/[editionId]/stats error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
