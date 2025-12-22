import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/firebase/auth-service';
import { ConfirmResetPasswordCredentials } from '@/types/user';

export async function POST(request: NextRequest) {
  try {
    const body: ConfirmResetPasswordCredentials = await request.json();
    const { oobCode, newPassword } = body;

    // Valider les données
    if (!oobCode || !newPassword) {
      return NextResponse.json(
        { error: 'Code de réinitialisation et nouveau mot de passe sont requis' },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'Le mot de passe doit contenir au moins 6 caractères' },
        { status: 400 }
      );
    }

    // Vérifier d'abord le code
    const verifyResult = await AuthService.verifyPasswordResetCode(oobCode);

    if (!verifyResult.success) {
      return NextResponse.json(
        { error: verifyResult.error || 'Code de réinitialisation invalide' },
        { status: 400 }
      );
    }

    // Confirmer la réinitialisation
    const resetResult = await AuthService.confirmPasswordReset(oobCode, newPassword);

    if (!resetResult.success) {
      return NextResponse.json(
        { error: resetResult.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Mot de passe réinitialisé avec succès'
    });

  } catch (error) {
    console.error('API Error POST /api/auth/reset-password:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la réinitialisation du mot de passe' },
      { status: 500 }
    );
  }
}