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

    const subGroup = await getSubGroupById(subGroupIdNum, { with_relations: true });
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
