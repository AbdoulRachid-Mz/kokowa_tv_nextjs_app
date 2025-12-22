import { NextRequest, NextResponse } from 'next/server';
import { getArchiveFighterAchievementsStats } from '@/actions/archives';

export async function GET(request: NextRequest) {
  try {
    const stats = await getArchiveFighterAchievementsStats();
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching archive stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch archive statistics' },
      { status: 500 }
    );
  }
}
