// app/api/stats/route.ts - Version corrigée
import { NextRequest, NextResponse } from 'next/server';
import { getStats, getRecentActivities } from '@/actions/stats';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse filters
    const filters = {
      entity: searchParams.get('entity') || undefined,
      statId: searchParams.get('statId') || undefined,
      date_from: searchParams.get('date_from') || undefined,
      date_to: searchParams.get('date_to') || undefined,
      region_id: searchParams.get('region_id') ? parseInt(searchParams.get('region_id')!) : undefined,
      edition_id: searchParams.get('edition_id') ? parseInt(searchParams.get('edition_id')!) : undefined,
      competition_id: searchParams.get('competition_id') ? parseInt(searchParams.get('competition_id')!) : undefined,
      year: searchParams.get('year') ? parseInt(searchParams.get('year')!) : undefined,
      month: searchParams.get('month') ? parseInt(searchParams.get('month')!) : undefined,
      group_by: searchParams.get('group_by') as any || 'month',
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 10,
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1,
      sort_by: searchParams.get('sort_by') || undefined,
      sort_order: searchParams.get('sort_order') as 'asc' | 'desc' || 'desc'
    };

    // Récupérer les statistiques
    const result = await getStats(filters);
    
    return NextResponse.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in GET /api/stats:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { 
          success: false,
          error: error.message,
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Erreur lors de la récupération des statistiques',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// Route pour les activités récentes
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, limit = 10, filters = {} } = body;
    
    if (action === 'recent_activities') {
      const activities = await getRecentActivities(limit);
      return NextResponse.json({
        success: true,
        data: activities,
        metadata: { total: activities.length },
        timestamp: new Date().toISOString()
      });
    }
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Action non supportée',
        timestamp: new Date().toISOString()
      },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error in POST /api/stats:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Erreur lors du traitement de la requête',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}