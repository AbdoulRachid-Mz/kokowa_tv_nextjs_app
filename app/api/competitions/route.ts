import { NextRequest, NextResponse } from 'next/server';
import { getCompetitions, createCompetition } from '@/actions/competitions';
import { competitionSchema } from '@/validation/schemas';
import z from 'zod';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const filters = {
      search: searchParams.get('search') || undefined,
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20,
      status: searchParams.get('status') === 'all' ? undefined : searchParams.get('status') || undefined,
      region_id: searchParams.get('region_id') ? parseInt(searchParams.get('region_id')!) : undefined,
      date_from: searchParams.get('date_from') || undefined,
      date_to: searchParams.get('date_to') || undefined,
      with_region: searchParams.get('with_region') !== "false",
      with_editions: searchParams.get('with_editions') !== "false",
      with_phases: searchParams.get('with_phases') !== "false",
      with_matches: searchParams.get('with_matches') !== "false",
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

// app/api/competitions/route.ts
export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || '';
    let body: any;

    if (contentType.includes('application/json')) {
      body = await request.json();
    } else if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      body = Object.fromEntries(formData.entries());
    } else {
      // fallback: try JSON first, then form-data
      try {
        body = await request.json();
      } catch {
        const formData = await request.formData();
        body = Object.fromEntries(formData.entries());
      }
    }

    console.log('Request body:', body);
    
    // Valider les données
    const validatedData = competitionSchema.parse(body);

    // Convertir en FormData pour l'action serveur
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

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Données invalides', 
          details: error.issues.map(issue => ({
            field: issue.path.join('.'),
            message: issue.message
          }))
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Erreur lors de la création de la compétition',
        message: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    );
  }
}

