// app/api/transfers/stats/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getTransferStats } from '@/actions/fighter-transfers';

export async function GET(request: NextRequest) {
  try {
    const stats = await getTransferStats();
    
    return NextResponse.json({ stats });
  } catch (error) {
    console.error('Error in GET /api/transfers/stats:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des statistiques' },
      { status: 500 }
    );
  }
}