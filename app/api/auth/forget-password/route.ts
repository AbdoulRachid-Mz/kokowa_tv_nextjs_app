import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/firebase/auth-service';
import { ResetPasswordCredentials } from '@/types/user';

export async function POST(request: NextRequest) {
  try {
    const body: ResetPasswordCredentials = await request.json();
    const { email } = body;

    // Valider l'email
    if (!email) {
      return NextResponse.json(
        { error: 'L\'adresse email est requise' },
        { status: 400 }
      );
    }

    // Envoyer l'email de réinitialisation
    const resetResult = await AuthService.sendPasswordResetEmail(email);

    if (!resetResult.success) {
      return NextResponse.json(
        { error: resetResult.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Un email de réinitialisation a été envoyé'
    });

  } catch (error) {
    console.error('API Error POST /api/auth/forget-password:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'envoi de l\'email de réinitialisation' },
      { status: 500 }
    );
  }
}