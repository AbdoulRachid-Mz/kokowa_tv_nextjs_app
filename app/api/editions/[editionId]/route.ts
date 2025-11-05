import { NextRequest, NextResponse } from 'next/server';
import {
  getEditionById,
  updateEdition,
  deleteEdition,
  getEditions,
} from '@/actions/editions';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ editionId: string }> }
) {
  try {
    const {editionId} = await params
    const EId = Number(editionId);
    if (isNaN(EId)) {
      return NextResponse.json({ error: 'Invalid edition ID' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const with_competition = searchParams.get('with_competition') === 'true';
    const with_fighters = searchParams.get('with_fighters') === 'true';
    const with_regions = searchParams.get('with_regions') === 'true';
    const with_phases = searchParams.get('with_phases') === 'true';

    const edition = await getEditionById(EId, {
      with_relations: with_competition || with_fighters || with_regions || with_phases,
    });

    return NextResponse.json(edition);
  } catch (error: any) {
    console.error('GET /api/editions/[editionId] error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ editionId: string }> }
) {
    const {editionId} = await params;
  try {
    const EId = Number(editionId);
    if (isNaN(EId)) {
      return NextResponse.json({ error: 'Invalid edition ID' }, { status: 400 });
    }

    const body = await request.formData();
    const result = await updateEdition(EId, body);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('PUT /api/editions/[editionId] error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ editionId: string }> }
) {
  try {
    const {editionId} = await params;
    const EId = Number(editionId);
    if (isNaN(EId)) {
      return NextResponse.json({ error: 'Invalid edition ID' }, { status: 400 });
    }

    const result = await deleteEdition(EId);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('DELETE /api/editions/[EId] error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
