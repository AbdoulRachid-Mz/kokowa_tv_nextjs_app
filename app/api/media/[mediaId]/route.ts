// app/api/media/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getMediaById, updateMedia, deleteMedia } from '@/actions/media';

interface Props {
  params: Promise<{ mediaId: string }>
}

export async function GET(
  request: NextRequest,
  { params }: Props
) {
  try {
    const { mediaId } = await params;
    const idNum = Number(mediaId);
    
    if (isNaN(idNum)) {
      return NextResponse.json({ error: 'ID de média invalide' }, { status: 400 });
    }

    const withRelations = request.nextUrl.searchParams.get('with_relations') !== 'false';
    const result = await getMediaById(idNum, { with_relations: withRelations });
    
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('API Error GET /api/media/[id]:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la récupération du média' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: Props
) {
  try {
    const { mediaId } = await params;
    const idNum = Number(mediaId);
    
    if (isNaN(idNum)) {
      return NextResponse.json({ error: 'ID de média invalide' }, { status: 400 });
    }

    const formData = await request.formData();
    const result = await updateMedia(idNum, formData);
    
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('API Error PUT /api/media/[id]:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la modification du média' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: Props
) {
  try {
    const { mediaId } = await params;
    const idNum = Number(mediaId);
    
    if (isNaN(idNum)) {
      return NextResponse.json({ error: 'ID de média invalide' }, { status: 400 });
    }

    const result = await deleteMedia(idNum);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('API Error DELETE /api/media/[id]:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la suppression du média' },
      { status: 500 }
    );
  }
}