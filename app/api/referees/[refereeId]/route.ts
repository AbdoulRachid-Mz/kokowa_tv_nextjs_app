// GET /ad/referees/[refereeId]
import { NextRequest, NextResponse } from 'next/server';
import { getRefereeById, updateReferee, deleteReferee } from '@/actions/referees';

interface Props {
 params: Promise<{ refereeId: string }>
}
export async function GET(
  _req: NextRequest,
  { params }: Props 
) {
  try {
    const {refereeId} = await params;
    const RId = Number(refereeId);
    if (isNaN(RId)) {
      return NextResponse.json({ error: 'ID invalide' }, { status: 400 });
    }

    const referee = await getRefereeById(RId, { with_relations: true });
    return NextResponse.json(referee);
  } catch (error: any) {
    if (error.message === 'Arbitre non trouvé') {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    console.error('Erreur GET /admin/referees/[refereeId]:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// PUT /admin/referees/[refereeId]
export async function PUT(
  req: NextRequest,
  { params }: Props 
) {
  try {
    const {refereeId} = await params;
    const RId = Number(refereeId);
    if (isNaN(RId)) {
      return NextResponse.json({ error: 'ID invalide' }, { status: 400 });
    }

    const body = await req.json();
    const result = await updateReferee(RId, body);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Erreur PUT /admin/referees/[refereeId]:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// DELETE /admin/referees/[refereeId]
export async function DELETE(
  _req: NextRequest,
  { params }: Props 
) {
  try {
    const {refereeId} = await params;
    const RId = Number(refereeId);
    if (isNaN(RId)) {
      return NextResponse.json({ error: 'ID invalide' }, { status: 400 });
    }

    await deleteReferee(RId);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Erreur DELETE /admin/referees/[refereeId]:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    );
  }
}
