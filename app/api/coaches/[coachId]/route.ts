// app/api/coaches/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getCoachById, updateCoach, deleteCoach } from '@/actions/coaches';

interface RouteParams {
  params: Promise<{
    coachId: string;
  }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const {coachId} = await params
    const id = parseInt(coachId);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'ID invalide' },
        { status: 400 }
      );
    }

    const coach = await getCoachById(id);
    
    return NextResponse.json({ coach });
  } catch (error) {
    console.error('Error in GET /api/coaches/[id]:', error);
    
    if (error instanceof Error && error.message === 'Coach non trouvé') {
      return NextResponse.json(
        { error: 'Coach non trouvé' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: 'Erreur lors de la récupération du coach' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const {coachId} = await params
    const id = parseInt(coachId);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'ID invalide' },
        { status: 400 }
      );
    }

    const formData = await request.formData();
    const result = await updateCoach(id, formData);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in PUT /api/coaches/[id]:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Erreur lors de la modification du coach' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
        const {coachId} = await params
    const id = parseInt(coachId);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'ID invalide' },
        { status: 400 }
      );
    }

    const result = await deleteCoach(id);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in DELETE /api/coaches/[id]:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Erreur lors de la suppression du coach' },
      { status: 500 }
    );
  }
}