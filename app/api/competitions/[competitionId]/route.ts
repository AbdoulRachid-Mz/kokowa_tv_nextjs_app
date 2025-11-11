import { NextRequest, NextResponse } from 'next/server';
import { getCompetitionById, updateCompetition, deleteCompetition } from '@/actions/competitions';
import { competitionSchema } from '@/validation/schemas';
import z from 'zod';

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

    const contentType = request.headers.get('content-type') || '';
    let body: any;

    if (contentType.includes('application/json')) {
      body = await request.json();
    } else if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      body = Object.fromEntries(formData.entries());
    } else {
      try {
        body = await request.json();
      } catch {
        const formData = await request.formData();
        body = Object.fromEntries(formData.entries());
      }
    }

    console.log('Update request body:', body);
    
    // Valider les données
    const validatedData = competitionSchema.parse(body);

    // Convertir en FormData pour l'action serveur
    const formData = new FormData();
    Object.entries(validatedData).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, value.toString());
      }
    });

    const result = await updateCompetition(Number(id), formData);

    return NextResponse.json(result);
  } catch (error) {
    console.error('API Error PUT /api/competitions:', error);

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
        error: 'Erreur lors de la modification de la compétition',
        message: error instanceof Error ? error.message : 'Erreur inconnue'
      },
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