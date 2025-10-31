import { NextRequest, NextResponse } from 'next/server';
import { getCompetitionById, updateCompetition, deleteCompetition } from '@/actions/competitions';
import { competitionSchema } from '@/validation/schemas';

interface RouteParams {
  params: Promise<{
    competitionId: string;
  }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const {competitionId} = await params
    const id = parseInt(competitionId);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'ID invalide' },
        { status: 400 }
      );
    }

    const withRelations = request.nextUrl.searchParams.get('with_relations') !== 'false';
    
    const competition = await getCompetitionById(id, { with_relations: withRelations });
    
    return NextResponse.json(competition);
  } catch (error) {
    console.error(`API Error GET /api/competitions/${"params.id"}:`, error);
    
    if (error instanceof Error && error.message === 'Compétition non trouvée') {
      return NextResponse.json(
        { error: 'Compétition non trouvée' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: 'Erreur lors de la récupération de la compétition' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
        const {competitionId} = await params
    const id = parseInt(competitionId);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'ID invalide' },
        { status: 400 }
      );
    }

    const body = await request.json();
    
    const validatedData = competitionSchema.parse(body);
    
    // Simuler FormData pour l'action serveur
    const formData = new FormData();
    Object.entries(validatedData).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, value.toString());
      }
    });

    const result = await updateCompetition(id, formData);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error(`API Error PUT /api/competitions/${"params.id"}:`, error);
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Données invalides', details: error.message },
        { status: 400 }
      );
    }
    
    if (error instanceof Error && error.message === 'Compétition non trouvée') {
      return NextResponse.json(
        { error: 'Compétition non trouvée' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: 'Erreur lors de la modification de la compétition' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
            const {competitionId} = await params
    const id = parseInt(competitionId);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'ID invalide' },
        { status: 400 }
      );
    }

    const result = await deleteCompetition(id);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error(`API Error DELETE /api/competitions/${"params.id"}:`, error);
    
    if (error instanceof Error && error.message === 'Compétition non trouvée') {
      return NextResponse.json(
        { error: 'Compétition non trouvée' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: 'Erreur lors de la suppression de la compétition' },
      { status: 500 }
    );
  }
}