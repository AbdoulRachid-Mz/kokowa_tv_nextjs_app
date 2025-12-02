import { NextRequest, NextResponse } from 'next/server';
import { getSubGroupById, updateSubGroup, deleteSubGroup } from '@/actions/sub-groups';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ subGroupId: string }> }
) {
  try {
    const { subGroupId } = await params;
    const subGroupIdNum = parseInt(subGroupId, 10);
    if (isNaN(subGroupIdNum)) {
      return NextResponse.json({ error: 'Invalid subGroupId' }, { status: 400 });
    }
    const { searchParams } = new URL(request.url);

    // Build options object from query parameters
    const options: {
      with_relations?: boolean;
      relations?: {
        with_group?: boolean;
        with_phase?: boolean;
        with_edition?: boolean;
        with_regions?: boolean;
        with_fighters?: boolean;
        with_belts?: boolean;
        with_referee?: boolean;
        with_matches?: boolean;
        with_edition_regions?: boolean;
with_edition_fighters?: boolean;
      };
      is_active?: boolean;
    } = {};

    // Parse boolean query params for relations
    const with_group = searchParams.get('with_group');
    const with_phase = searchParams.get('with_phase');
    const with_edition = searchParams.get('with_edition');
    const with_regions = searchParams.get('with_regions');
    const with_fighters = searchParams.get('with_fighters');
    const with_belts = searchParams.get('with_belts');
    const with_referee = searchParams.get('with_referee');
    const with_matches = searchParams.get('with_matches');
    const with_edition_regions = searchParams.get('with_edition_regions');
    const with_edition_fighters = searchParams.get('with_edition_fighters');
    const is_active = searchParams.get('is_active');

    // If any relation param is provided, build relations object
    if (
      with_group !== null ||
      with_phase !== null ||
      with_edition !== null ||
      with_regions !== null ||
      with_fighters !== null ||
      with_belts !== null ||
      with_referee !== null ||
      with_matches !== null
    ) {
      options.relations = {
        with_group: with_group !== 'false',
        with_phase: with_phase !== 'false',
        with_edition: with_edition !== 'false',
        with_regions: with_regions !== 'false',
        with_fighters: with_fighters !== 'false',
        with_belts: with_belts !== 'false',
        with_referee: with_referee !== 'false',
        with_matches: with_matches !== 'false',
        with_edition_fighters: with_edition_fighters !== 'false',
        with_edition_regions: with_edition_regions !== 'false',
      };
      options.with_relations = true;
    }

    // Parse is_active
    if (is_active !== null) {
      options.is_active = is_active === 'true';
    }

    const subGroup = await getSubGroupById(subGroupIdNum, options);
    return NextResponse.json(subGroup);
  } catch (error: any) {
    console.error('Error in GET /api/sub-groups/[subGroupId]:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch sub-group' },
      { status: 404 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ subGroupId: string }> }
) {
  try {
    const { subGroupId } = await params;
    const subGroupIdNum = parseInt(subGroupId, 10);
    if (isNaN(subGroupIdNum)) {
      return NextResponse.json({ error: 'Invalid subGroupId' }, { status: 400 });
    }

    const formData = await request.formData();
    const result = await updateSubGroup(subGroupIdNum, formData);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error in POST /api/sub-groups/[subGroupId]:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update sub-group' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ subGroupId: string }> }
) {
  try {
    const { subGroupId } = await params;
    const subGroupIdNum = parseInt(subGroupId, 10);
    if (isNaN(subGroupIdNum)) {
      return NextResponse.json({ error: 'Invalid subGroupId' }, { status: 400 });
    }

    const result = await deleteSubGroup(subGroupIdNum);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error in DELETE /api/sub-groups/[subGroupId]:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete sub-group' },
      { status: 500 }
    );
  }
}
