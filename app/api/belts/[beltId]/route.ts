import { NextRequest, NextResponse } from 'next/server';
import { getBeltById, updateBelt, deleteBelt, toggleBeltStatus } from '@/actions/belts';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ beltId: string }> }
) {
  try {
    const {beltId} = await params
    const id = parseInt(beltId);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'ID invalide' },
        { status: 400 }
      );
    }

    const belt = await getBeltById(id);
    
    return NextResponse.json(belt);
  } catch (error) {
    console.error('Error in belt API GET:', error);
    
    if (error instanceof Error && error.message.includes('non trouvée')) {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: 'Erreur lors de la récupération de la ceinture' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ beltId: string }> }
) {
  try {
    const {beltId} = await params
    const id = parseInt(beltId);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'ID invalide' },
        { status: 400 }
      );
    }

    const formData = await request.formData();
    const result = await updateBelt(id, formData);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in belt API PUT:', error);
    
    if (error instanceof Error && error.message.includes('existe déjà')) {
      return NextResponse.json(
        { error: error.message },
        { status: 409 }
      );
    }
    
    if (error instanceof Error && error.message.includes('non trouvée')) {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur lors de la modification de la ceinture' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ beltId: string }> }
) {
  try {
    const {beltId} = await params
    const id = parseInt(beltId);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'ID invalide' },
        { status: 400 }
      );
    }

    const result = await deleteBelt(id);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in belt API DELETE:', error);
    
    if (error instanceof Error && error.message.includes('non trouvée')) {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      );
    }
    
    if (error instanceof Error && error.message.includes('utilisée')) {
      return NextResponse.json(
        { error: error.message },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur lors de la suppression de la ceinture' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'ID invalide' },
        { status: 400 }
      );
    }

    const body = await request.json();
    
    if (body.is_active !== undefined) {
      const result = await toggleBeltStatus(id, body.is_active);
      return NextResponse.json(result);
    }
    
    return NextResponse.json(
      { error: 'Action non supportée' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error in belt API PATCH:', error);
    
    if (error instanceof Error && error.message.includes('non trouvée')) {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur lors de la modification du statut' },
      { status: 500 }
    );
  }
}