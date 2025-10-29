import { NextRequest, NextResponse } from 'next/server';
import { getLutteurById, updateLutteur, deleteLutteur } from '@/actions/lutteurs';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = Number(params.id);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: 'ID de lutteur invalide' },
        { status: 400 }
      );
    }

    const lutteur = await getLutteurById(id);
    
    return NextResponse.json({
      success: true,
      data: lutteur
    });
    
  } catch (error: any) {
    console.error(`API GET /lutteurs/${params.id} error:`, error);
    
    if (error.message === 'Lutteur non trouvé') {
      return NextResponse.json(
        { success: false, error: 'Lutteur non trouvé' },
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
        { success: false, error: 'ID de lutteur invalide' },
        { status: 400 }
      );
    }

    const formData = await request.formData();
    const result = await updateLutteur(id, formData);
    
    return NextResponse.json(result);
    
  } catch (error: any) {
    console.error(`API PUT /lutteurs/${params.id} error:`, error);
    
    if (error.message === 'Lutteur non trouvé') {
      return NextResponse.json(
        { success: false, error: 'Lutteur non trouvé' },
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
        { success: false, error: 'ID de lutteur invalide' },
        { status: 400 }
      );
    }

    const result = await deleteLutteur(id);
    
    return NextResponse.json(result);
    
  } catch (error: any) {
    console.error(`API DELETE /lutteurs/${params.id} error:`, error);
    
    if (error.message === 'Lutteur non trouvé') {
      return NextResponse.json(
        { success: false, error: 'Lutteur non trouvé' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: error.message || 'Erreur lors de la suppression' },
      { status: 500 }
    );
  }
}