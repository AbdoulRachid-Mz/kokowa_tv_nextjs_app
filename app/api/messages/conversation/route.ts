// app/api/messages/conversation/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getConversation } from '@/actions/messages';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const user1Id = searchParams.get('user1_id');
    const user2Id = searchParams.get('user2_id');

    if (!user1Id || !user2Id) {
      return NextResponse.json(
        { error: 'Les paramètres user1_id et user2_id sont requis' },
        { status: 400 }
      );
    }

    const filters = {
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50,
      with_author: searchParams.get('with_author') !== 'false',
      with_recipient: searchParams.get('with_recipient') !== 'false',
    };

    const result = await getConversation(parseInt(user1Id), parseInt(user2Id), filters);
    
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('API Error GET /api/messages/conversation:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la récupération de la conversation' },
      { status: 500 }
    );
  }
}