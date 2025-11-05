import { NextRequest, NextResponse } from 'next/server';
import { getPhaseGroupById, updatePhaseGroup, deletePhaseGroup } from '@/actions/phase-groups';

interface Props {
  params: Promise<{ groupId: string }>
}

export async function GET(
  request: NextRequest,
  { params }: Props
) {
  try {
    const { groupId } = await params;
    const groupIdNum = Number(groupId);
    
    if (isNaN(groupIdNum)) {
      return NextResponse.json({ error: 'ID de groupe invalide' }, { status: 400 });
    }

    const group = await getPhaseGroupById(groupIdNum, { with_relations: true });
    return NextResponse.json(group);
  } catch (error: any) {
    console.error('API Error GET /api/phase-groups/[groupId]:', error);
    if (error.message === 'Groupe de phase non trouvé') {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: Props
) {
  try {
    const { groupId } = await params;
    const groupIdNum = Number(groupId);
    
    if (isNaN(groupIdNum)) {
      return NextResponse.json({ error: 'ID de groupe invalide' }, { status: 400 });
    }

    const body = await request.json();
    
    const formData = new FormData();
    Object.entries(body).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, value.toString());
      }
    });

    const result = await updatePhaseGroup(groupIdNum, formData);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('API Error PUT /api/phase-groups/[groupId]:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la modification' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: Props
) {
  try {
    const { groupId } = await params;
    const groupIdNum = Number(groupId);
    
    if (isNaN(groupIdNum)) {
      return NextResponse.json({ error: 'ID de groupe invalide' }, { status: 400 });
    }

    const result = await deletePhaseGroup(groupIdNum);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('API Error DELETE /api/phase-groups/[groupId]:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la suppression' },
      { status: 500 }
    );
  }
}