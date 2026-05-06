import { NextRequest, NextResponse } from 'next/server';
import { getUserByAuthId } from '@/actions/users';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    
    const user = await getUserByAuthId(userId, {
      with_relations: true,
      relations: {
        with_messages: true,
        with_interactions: true,
        with_notifications: true
      },
      is_active: true
    });
    
    if (!user) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      user,
      success: true
    });
    
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération de l\'utilisateur' },
      { status: 500 }
    );
  }
}