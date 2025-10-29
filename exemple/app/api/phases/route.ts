import { NextRequest, NextResponse } from 'next/server';
import { getPhases, createPhase, PhaseFilters } from '@/actions/phases';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const filters: PhaseFilters = {};
    const competition_id = searchParams.get('competition_id');
    
    if (competition_id) filters.competition_id = Number(competition_id);
    
    const phases = await getPhases(filters);
    
    return NextResponse.json({
      success: true,
      data: phases
    });
    
  } catch (error: any) {
    console.error('API GET /phases error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Erreur lors de la récupération des phases' 
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const result = await createPhase(formData);
    
    return NextResponse.json(result, { status: 201 });
    
  } catch (error: any) {
    console.error('API POST /phases error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Erreur lors de la création de la phase' 
      },
      { status: 500 }
    );
  }
}