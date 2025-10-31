import { NextRequest, NextResponse } from 'next/server';
import { getPhaseById, updatePhase, deletePhase } from '@/actions/phases';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ phaseId: string }> }
) {
  try {
    const {phaseId} = await params;
    const phaseIdNumber = Number(phaseId);
    
    if (isNaN(phaseIdNumber)) {
      return NextResponse.json(
        { success: false, error: 'ID de phase invalide' },
        { status: 400 }
      );
    }

    const phase = await getPhaseById(phaseIdNumber);
    
    return NextResponse.json({
      success: true,
      data: phase
    });
    
  } catch (error: any) {
    console.error(`API GET /phases/${"phaseIdNumber"} error:`, error);
    
    if (error.message === 'Phase non trouvée') {
      return NextResponse.json(
        { success: false, error: 'Phase non trouvée' },
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
  { params }: { params: Promise<{ phaseId: string }> }
) {
  try {
    const {phaseId} = await params;
    const phaseIdNumber = Number(phaseId);
    
    if (isNaN(phaseIdNumber)) {
      return NextResponse.json(
        { success: false, error: 'ID de phase invalide' },
        { status: 400 }
      );
    }

    const formData = await request.formData();
    const result = await updatePhase(phaseIdNumber, formData);
    
    return NextResponse.json(result);
    
  } catch (error: any) {
    console.error(`API PUT /phases/${"phaseIdNumber"} error:`, error);
    
    if (error.message === 'Phase non trouvée') {
      return NextResponse.json(
        { success: false, error: 'Phase non trouvée' },
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
  { params }: { params: Promise<{ phaseId: string }> }
) {
  try {
    const {phaseId} = await params;
    const phaseIdNumber = Number(phaseId);
    
    if (isNaN(phaseIdNumber)) {
      return NextResponse.json(
        { success: false, error: 'ID de phase invalide' },
        { status: 400 }
      );
    }

    const result = await deletePhase(phaseIdNumber);
    
    return NextResponse.json(result);
    
  } catch (error: any) {
    console.error(`API DELETE /phases/${"phaseIdNumber"} error:`, error);
    
    if (error.message === 'Phase non trouvée') {
      return NextResponse.json(
        { success: false, error: 'Phase non trouvée' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: error.message || 'Erreur lors de la suppression' },
      { status: 500 }
    );
  }
}