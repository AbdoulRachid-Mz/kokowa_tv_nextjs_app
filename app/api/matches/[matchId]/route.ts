import { NextRequest, NextResponse } from 'next/server';
import { getMatchById, updateMatch, deleteMatch } from '@/actions/matches';

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

    // Build options from query parameters
    const url = new URL(request.url);
    const options = {
      with_relations: url.searchParams.get('with_relations') !== 'false',
      relations: {
        with_sub_group: url.searchParams.get('with_sub_group') !== 'false',
        with_group: url.searchParams.get('with_group') !== 'false',
        with_phase: url.searchParams.get('with_phase') !== 'false',
        with_edition: url.searchParams.get('with_edition') !== 'false',
        with_regions: url.searchParams.get('with_regions') !== 'false',
        with_belts: url.searchParams.get('with_belts') !== 'false',
        with_referee: url.searchParams.get('with_referee') !== 'false',
        with_fighters: url.searchParams.get('with_fighters') !== 'false',
        with_winner_loser: url.searchParams.get('with_winner_loser') !== 'false',
        with_cards: url.searchParams.get('with_cards') !== 'false',
      },
      is_active: url.searchParams.has('is_active') ? url.searchParams.get('is_active') === 'true' : undefined,
    };

    const match = await getMatchById(id, options);
    
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

   const body = await request.json();
const result = await updateMatch(id, body);
    
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