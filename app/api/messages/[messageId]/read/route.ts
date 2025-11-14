// app/api/messages/[id]/read/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { markMessageAsRead } from '@/actions/messages';

interface Props {
  params: Promise<{ messageId: string }>
}

export async function PATCH(
  request: NextRequest,
  { params }: Props
) {
  try {
    const { messageId } = await params;
    const idNum = Number(messageId);
    
    if (isNaN(idNum)) {
      return NextResponse.json({ error: 'ID de message invalide' }, { status: 400 });
    }

    const result = await markMessageAsRead(idNum);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('API Error PATCH /api/messages/[id]/read:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors du marquage du message comme lu' },
      { status: 500 }
    );
  }
}