import { NextRequest, NextResponse } from 'next/server';
import { getBeltStats } from '@/actions/belts';

export async function GET(request: NextRequest) {
  try {
    const stats = await getBeltStats();
    
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error in belts stats API:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des statistiques' },
      { status: 500 }
    );
  }
}