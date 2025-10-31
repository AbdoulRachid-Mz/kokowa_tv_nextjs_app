import { NextRequest, NextResponse } from 'next/server';
import { getMatchById, updateMatch, deleteMatch } from '@/actions/matchs';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
) {
  try {
    const {matchId} = await params
    const id = Number(matchId);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: 'ID de match invalide' },
        { status: 400 }
      );
    }

    const match = await getMatchById(id);
    
    return NextResponse.json({
      success: true,
      data: match
    });
    
  } catch (error: any) {
    console.error(`API GET /matchs/${"matchId"} error:`, error);
    
    if (error.message === 'Match non trouvé') {
      return NextResponse.json(
        { success: false, error: 'Match non trouvé' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: error.message || 'Erreur serveur' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
) {
  try {
       const {matchId} = await params
    const id = Number(matchId);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: 'ID de match invalide' },
        { status: 400 }
      );
    }

    const formData = await request.formData();
    const result = await updateMatch(id, formData);
    
    return NextResponse.json(result);
    
  } catch (error: any) {
    console.error(`API PUT /matchs/${"matchId"} error:`, error);
    
    if (error.message === 'Match non trouvé') {
      return NextResponse.json(
        { success: false, error: 'Match non trouvé' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: error.message || 'Erreur lors de la modification' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
) {
  try {
    const {matchId} = await params
    const id = Number(matchId);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: 'ID de match invalide' },
        { status: 400 }
      );
    }

    const result = await deleteMatch(id);
    
    return NextResponse.json(result);
    
  } catch (error: any) {
    console.error(`API DELETE /matchs/${"params.id"} error:`, error);
    
    if (error.message === 'Match non trouvé') {
      return NextResponse.json(
        { success: false, error: 'Match non trouvé' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: error.message || 'Erreur lors de la suppression' },
      { status: 500 }
    );
  }
}