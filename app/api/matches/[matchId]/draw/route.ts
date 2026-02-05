// app/api/matches/[matchId]/draw/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { setMatchDraw } from '@/actions/matches';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
) {
  try {
    const { matchId } = await params;
    const id = Number(matchId);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: 'ID de match invalide' },
        { status: 400 }
      );
    }

    const result = await setMatchDraw(id);
    
    return NextResponse.json(result);
    
  } catch (error: any) {
    console.error('API POST /matches/[matchId]/draw error:', error);
    
    if (error.message === 'Match non trouvé') {
      return NextResponse.json(
        { success: false, error: 'Match non trouvé' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: error.message || 'Erreur lors de la déclaration du match nul' },
      { status: 500 }
    );
  }
}