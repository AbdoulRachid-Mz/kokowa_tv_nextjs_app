// app/api/transfers/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getFighterTransferById, updateFighterTransfer, deleteFighterTransfer } from '@/actions/fighter-transfers';
import { getCurrentUser } from '@/lib/auth';
// import { getCurrentUser } from '@/lib/auth';

interface RouteParams {
  params: Promise<{
    transferId: string;
  }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const {transferId} = await params
    const id = parseInt(transferId);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'ID invalide' },
        { status: 400 }
      );
    }

    const transfer = await getFighterTransferById(id);
    
    return NextResponse.json({ transfer });
  } catch (error) {
    console.error('Error in GET /api/transfers/[id]:', error);
    
    if (error instanceof Error && error.message === 'Transfert non trouvé') {
      return NextResponse.json(
        { error: 'Transfert non trouvé' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: 'Erreur lors de la récupération du transfert' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    const {transferId} = await params
    const id = parseInt(transferId);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'ID invalide' },
        { status: 400 }
      );
    }

    const formData = await request.formData();
    const result = await updateFighterTransfer(id, formData, user.user_id);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in PUT /api/transfers/[id]:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Erreur lors de la modification du transfert' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    const {transferId} = await params
    const id = parseInt(transferId);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'ID invalide' },
        { status: 400 }
      );
    }

    const result = await deleteFighterTransfer(id);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in DELETE /api/transfers/[id]:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Erreur lors de la suppression du transfert' },
      { status: 500 }
    );
  }
}