import { NextRequest, NextResponse } from 'next/server';
import { updateUserLastLogin } from '@/actions/users';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ uid: string }> }
) {
  try {
    const { uid } = await params;
    
    await updateUserLastLogin(uid);
    
    return NextResponse.json({
      success: true,
      message: 'Dernière connexion mise à jour'
    });
    
  } catch (error) {
    console.error('Error updating last login:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour de la dernière connexion' },
      { status: 500 }
    );
  }
}