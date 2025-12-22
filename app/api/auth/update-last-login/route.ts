import { NextRequest, NextResponse } from 'next/server';
import { updateLastLogin } from '@/lib/server/auth-utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { uid } = body;

    if (!uid) {
      return NextResponse.json(
        { error: 'UID requis' },
        { status: 400 }
      );
    }

    await updateLastLogin(uid);

    return NextResponse.json({
      success: true,
      message: 'Dernière connexion mise à jour'
    });

  } catch (error) {
    console.error('Error updating last login:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour' },
      { status: 500 }
    );
  }
}