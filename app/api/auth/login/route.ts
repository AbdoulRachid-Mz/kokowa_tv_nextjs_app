import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/firebase/auth-service';
import { LoginCredentials } from '@/types/user';

export async function POST(request: NextRequest) {
  try {
    const body: LoginCredentials = await request.json();
    const { email, password } = body;

    // Valider les données d'entrée
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email et mot de passe sont requis' },
        { status: 400 }
      );
    }

    // Authentifier l'utilisateur
    const authResult = await AuthService.signIn(email, password);

    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      user: authResult.user,
      userDocument: authResult.userDocument,
      message: 'Connexion réussie'
    });

  } catch (error) {
    console.error('API Error POST /api/auth/login:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la connexion' },
      { status: 500 }
    );
  }
}