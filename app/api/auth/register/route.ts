import { NextRequest, NextResponse } from 'next/server';
import { firebaseSignUpWithEmail } from '@/utils/firebase-auth-utils';
import { createUserInDatabase } from '@/lib/server/auth-utils';
import { RegisterCredentials } from '@/types/user';

export async function POST(request: NextRequest) {
  try {
    const body: RegisterCredentials = await request.json();
    const { email, password, username, first_name, last_name, phone_number, region_id } = body;

    // Étape 1: Créer l'utilisateur Firebase
    const firebaseResult = await firebaseSignUpWithEmail(email, password);
    
    if (firebaseResult.error) {
      return NextResponse.json(
        { error: firebaseResult.error.message },
        { status: 400 }
      );
    }

    if (!firebaseResult.data) {
      return NextResponse.json(
        { error: 'Erreur lors de la création du compte' },
        { status: 500 }
      );
    }

    // Étape 2: Créer l'utilisateur dans PostgreSQL
    const dbResult = await createUserInDatabase(firebaseResult.data, {
      username,
      first_name,
      last_name,
      phone_number,
      region_id
    });

    if (!dbResult.success) {
      // TODO: Rollback Firebase user creation
      return NextResponse.json(
        { error: dbResult.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      user: dbResult.user,
      message: 'Compte créé avec succès'
    });

  } catch (error) {
    console.error('API Error POST /api/auth/register:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'inscription' },
      { status: 500 }
    );
  }
}