import { NextRequest, NextResponse } from 'next/server';
import { getCompetitionById, updateCompetition, deleteCompetition } from '@/actions/competitions';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = Number(params.id);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: 'ID de compétition invalide' },
        { status: 400 }
      );
    }

    const competition = await getCompetitionById(id);
    
    return NextResponse.json({
      success: true,
      data: competition
    });
    
  } catch (error: any) {
    console.error(`API GET /competitions/${params.id} error:`, error);
    
    if (error.message === 'Compétition non trouvée') {
      return NextResponse.json(
        { success: false, error: 'Compétition non trouvée' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: error.message || 'Erreur serveur' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = Number(params.id);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: 'ID de compétition invalide' },
        { status: 400 }
      );
    }

    const formData = await request.formData();
    const result = await updateCompetition(id, formData);
    
    return NextResponse.json(result);
    
  } catch (error: any) {
    console.error(`API PUT /competitions/${params.id} error:`, error);
    
    if (error.message === 'Compétition non trouvée') {
      return NextResponse.json(
        { success: false, error: 'Compétition non trouvée' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: error.message || 'Erreur lors de la modification' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = Number(params.id);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: 'ID de compétition invalide' },
        { status: 400 }
      );
    }

    const result = await deleteCompetition(id);
    
    return NextResponse.json(result);
    
  } catch (error: any) {
    console.error(`API DELETE /competitions/${params.id} error:`, error);
    
    if (error.message === 'Compétition non trouvée') {
      return NextResponse.json(
        { success: false, error: 'Compétition non trouvée' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: error.message || 'Erreur lors de la suppression' },
      { status: 500 }
    );
  }
}