// app/api/messages/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getMessages, createMessage } from '@/actions/messages';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const filters = {
      message_type: searchParams.get('message_type') || undefined,
      entity_type: searchParams.get('entity_type') || undefined,
      entity_id: searchParams.get('entity_id') ? parseInt(searchParams.get('entity_id')!) : undefined,
      author_id: searchParams.get('author_id') ? parseInt(searchParams.get('author_id')!) : undefined,
      recipient_id: searchParams.get('recipient_id') ? parseInt(searchParams.get('recipient_id')!) : undefined,
      is_read: searchParams.get('is_read') ? searchParams.get('is_read') === 'true' : undefined,
      is_active: searchParams.get('is_active') ? searchParams.get('is_active') === 'true' : undefined,
      is_deleted: searchParams.get('is_deleted') ? searchParams.get('is_deleted') === 'true' : undefined,
      search: searchParams.get('search') || undefined,
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20,
      with_author: searchParams.get('with_author') !== 'false',
      with_recipient: searchParams.get('with_recipient') !== 'false',
      with_parent: searchParams.get('with_parent') === 'true',
    };

    const result = await getMessages(filters);
    
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('API Error GET /api/messages:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la récupération des messages' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const result = await createMessage(formData);
    
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('API Error POST /api/messages:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la création du message' },
      { status: 500 }
    );
  }
}