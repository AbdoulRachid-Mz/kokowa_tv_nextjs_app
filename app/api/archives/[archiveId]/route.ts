import { deleteArchiveFighterAchievement, getArchiveFighterAchievements,getArchiveFighterAchievement, updateArchiveFighterAchievement } from '@/actions/archives';
import { NextRequest, NextResponse } from 'next/server';

interface Props {
   params: Promise<{ archiveId: string }>
}
// GET /api/archives/[archiveId]
export async function GET(
  request: NextRequest,
  { params }: Props
) {
  try {
    const {archiveId} = await params;
    const id = parseInt(archiveId, 10);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'ID invalide' }, { status: 400 });
    }

    // Parse query parameters to get include options
    const searchParams = request.nextUrl.searchParams;
    const with_fighter = searchParams.get('with_fighter') === 'true';
    const with_edition = searchParams.get('with_edition') === 'true';
    const with_region = searchParams.get('with_region') === 'true';

    const result = await getArchiveFighterAchievement(id, {
      with_fighter,
      with_edition,
      with_region
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('GET /api/archives/[archiveId] error:', error);
    if ((error as Error).message === "Archive not found") {
      return NextResponse.json({ error: 'Archive non trouvée' }, { status: 404 });
    }
    return NextResponse.json(
      { error: 'Erreur lors de la récupération de l\'archive' },
      { status: 500 }
    );
  }
}

// PUT /api/archives/[archiveId]
export async function PUT(
  request: NextRequest,
  { params }: Props
) {
  try {
    const {archiveId} = await params;
    const id = parseInt(archiveId, 10);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'ID invalide' }, { status: 400 });
    }

    const formData = await request.formData();
    const result = await updateArchiveFighterAchievement(id, formData);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('PUT /api/archives/[archiveId] error:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la mise à jour de l\'archive' },
      { status: 500 }
    );
  }
}

// DELETE /api/archives/[archiveId]
export async function DELETE(
  request: NextRequest,
  { params }: Props
) {
  try {
    const {archiveId} = await params;
    const id = parseInt(archiveId, 10);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'ID invalide' }, { status: 400 });
    }

    const result = await deleteArchiveFighterAchievement(id);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('DELETE /api/archives/[archiveId] error:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la suppression de l\'archive' },
      { status: 500 }
    );
  }
}
