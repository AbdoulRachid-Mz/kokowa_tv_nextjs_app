// app/api/messages/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getMessageById, updateMessage, deleteMessage, markMessageAsRead, likeMessage } from '@/actions/messages';

interface Props {
  params: Promise<{ messageId: string }>
}

export async function GET(
  request: NextRequest,
  { params }: Props
) {
  try {
    const { messageId } = await params;
    const idNum = Number(messageId);
    
    if (isNaN(idNum)) {
      return NextResponse.json({ error: 'ID de message invalide' }, { status: 400 });
    }

    const withRelations = request.nextUrl.searchParams.get('with_relations') !== 'false';
    const result = await getMessageById(idNum, { with_relations: withRelations });
    
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('API Error GET /api/messages/[id]:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la récupération du message' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: Props
) {
  try {
    const { messageId } = await params;
    const idNum = Number(messageId);
    
    if (isNaN(idNum)) {
      return NextResponse.json({ error: 'ID de message invalide' }, { status: 400 });
    }

    const formData = await request.formData();
    const result = await updateMessage(idNum, formData);
    
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('API Error PUT /api/messages/[id]:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la modification du message' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: Props
) {
  try {
    const { messageId } = await params;
    const idNum = Number(messageId);
    
    if (isNaN(idNum)) {
      return NextResponse.json({ error: 'ID de message invalide' }, { status: 400 });
    }

    const result = await deleteMessage(idNum);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('API Error DELETE /api/messages/[id]:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la suppression du message' },
      { status: 500 }
    );
  }
}