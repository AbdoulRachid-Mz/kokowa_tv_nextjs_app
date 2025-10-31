import { NextRequest, NextResponse } from 'next/server';
import { getCompetitions, createCompetition } from '@/actions/competitions';
import { competitionSchema } from '@/validation/schemas';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const filters = {
      search: searchParams.get('search') || undefined,
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20,
      type: searchParams.get('type') || undefined,
      status: searchParams.get('status') || undefined,
      region_id: searchParams.get('region_id') ? parseInt(searchParams.get('region_id')!) : undefined,
      date_from: searchParams.get('date_from') || undefined,
      date_to: searchParams.get('date_to') || undefined,
      with_region: searchParams.get('with_region') !== 'false',
      with_editions: searchParams.get('with_editions') === 'true',
      with_phases: searchParams.get('with_phases') === 'true',
      with_matches: searchParams.get('with_matches') === 'true',
    };

    const result = await getCompetitions(filters);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('API Error GET /api/competitions:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des compétitions' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const validatedData = competitionSchema.parse(body);
    
    // Simuler FormData pour l'action serveur
    const formData = new FormData();
    Object.entries(validatedData).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, value.toString());
      }
    });

    const result = await createCompetition(formData);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('API Error POST /api/competitions:', error);
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Données invalides', details: error.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Erreur lors de la création de la compétition' },
      { status: 500 }
    );
  }
}