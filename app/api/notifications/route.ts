// app/api/notifications/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getNotifications, createNotification } from '@/actions/notifications';
import { NotificationFilters } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const filters = {
      user_id: searchParams.get('user_id') ? parseInt(searchParams.get('user_id')!) : undefined,
      notification_type: searchParams.get('notification_type') || undefined,
      is_read: searchParams.get('is_read') ? searchParams.get('is_read') === 'true' : undefined,
      priority: searchParams.get('priority') as 'low' | 'medium' | 'high' || undefined,
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20,
      with_user: searchParams.get('with_user') !== 'false',
    };

    const result = await getNotifications(filters as NotificationFilters);
    
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('API Error GET /api/notifications:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la récupération des notifications' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const result = await createNotification(formData);
    
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('API Error POST /api/notifications:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la création de la notification' },
      { status: 500 }
    );
  }
}