import { NextRequest, NextResponse } from 'next/server';
import { getRegionsStats } from '@/actions/regions';
import { getFighterStats } from '@/actions/fighters';
import { getCompetitionStats } from '@/actions/competitions';
import { query } from '@/lib/db/neon-client';

export async function GET(request: NextRequest) {
  try {
    const [regionsStats, fightersStats, competitionsStats, editionsStats] = await Promise.all([
      getRegionsStats(),
      getFighterStats(),
      getCompetitionStats(),
      // Stats pour les éditions
      query(`
        SELECT 
          COUNT(*) as total_editions,
          COUNT(*) FILTER (WHERE start_date >= CURRENT_DATE) as upcoming_editions,
          COUNT(*) FILTER (WHERE start_date < CURRENT_DATE AND end_date >= CURRENT_DATE) as ongoing_editions,
          COUNT(*) FILTER (WHERE end_date < CURRENT_DATE) as completed_editions
        FROM competition_editions
      `)
    ]);

    const editionsData = editionsStats[0];

    const stats = {
      regions: regionsStats,
      fighters: fightersStats,
      competitions: competitionsStats,
      editions: {
        total_editions: parseInt(editionsData?.total_editions ?? '0'),
        upcoming_editions: parseInt(editionsData?.upcoming_editions ?? '0'),
        ongoing_editions: parseInt(editionsData?.ongoing_editions ?? '0'),
        completed_editions: parseInt(editionsData?.completed_editions ?? '0'),
      },
      summary: {
        total_regions: regionsStats.total_regions,
        total_fighters: fightersStats.total_fighters,
        total_competitions: competitionsStats.total_competitions,
        total_editions: parseInt(editionsData?.total_editions ?? '0'),
        active_fighters: fightersStats.active_fighters,
        champions: fightersStats.champions,
        upcoming_competitions: competitionsStats.upcoming,
      }
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('API Error GET /api/stats:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des statistiques' },
      { status: 500 }
    );
  }
}