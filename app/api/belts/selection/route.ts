import { NextRequest, NextResponse } from 'next/server';
import { getActiveBeltsForSelection } from '@/actions/belts';

export async function GET(request: NextRequest) {
  try {
    const belts = await getActiveBeltsForSelection();
    
    return NextResponse.json(belts);
  } catch (error) {
    console.error('Error in belts selection API:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des ceintures pour sélection' },
      { status: 500 }
    );
  }
}