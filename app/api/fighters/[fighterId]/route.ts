import { NextRequest, NextResponse } from 'next/server';
import { getFighterById, updateFighter, deleteFighter } from '@/actions/fighters';
import { fighterSchema } from '@/validation/schemas';

interface RouteParams {
  params: Promise<{
    fighterId: string;
  }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const {fighterId} = await params
    const id = parseInt(fighterId);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'ID invalide' },
        { status: 400 }
      );
    }

    const withRelations = request.nextUrl.searchParams.get('with_relations') !== 'false';
    
    const fighter = await getFighterById(id, { with_relations: withRelations });
    
    return NextResponse.json(fighter);
  } catch (error) {
    console.error(`API Error GET /api/fighters/${"params.id"}:`, error);
    
    if (error instanceof Error && error.message === 'Lutteur non trouvé') {
      return NextResponse.json(
        { error: 'Lutteur non trouvé' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: 'Erreur lors de la récupération du lutteur' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
        const {fighterId} = await params
    const id = parseInt(fighterId);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'ID invalide' },
        { status: 400 }
      );
    }

    const body = await request.json();
    
    const validatedData = fighterSchema.parse(body);
    
    // Simuler FormData pour l'action serveur
    const formData = new FormData();
    Object.entries(validatedData).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (typeof value === 'boolean') {
          formData.append(key, value.toString());
        } else {
          formData.append(key, value.toString());
        }
      }
    });

    const result = await updateFighter(id, formData);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error(`API Error PUT /api/fighters/${"params.id"}:`, error);
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Données invalides', details: error.message },
        { status: 400 }
      );
    }
    
    if (error instanceof Error && error.message === 'Lutteur non trouvé') {
      return NextResponse.json(
        { error: 'Lutteur non trouvé' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: 'Erreur lors de la modification du lutteur' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const {fighterId} = await params
    const id = parseInt(fighterId);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'ID invalide' },
        { status: 400 }
      );
    }

    const result = await deleteFighter(id);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error(`API Error DELETE /api/fighters/${"params.id"}:`, error);
    
    if (error instanceof Error && error.message === 'Lutteur non trouvé') {
      return NextResponse.json(
        { error: 'Lutteur non trouvé' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: 'Erreur lors de la suppression du lutteur' },
      { status: 500 }
    );
  }
}