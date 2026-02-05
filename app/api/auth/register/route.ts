// /api/auth/register/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { firebaseSignUpWithEmail } from '@/utils/firebase-auth-utils';
import { createUserInDatabase, getUserByFirebaseUid } from '@/lib/server/auth-utils';
import { adminAuth } from '@/lib/firebase-admin';

interface RegisterRequest {
  email: string;
  password?: string;
  fcm_token?: string;
  username: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  firebase_uid?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: RegisterRequest = await request.json();
    const { 
      email, 
      password, 
      username, 
      first_name, 
      last_name, 
      phone_number,
      firebase_uid,
      fcm_token 
    } = body;

    // Vérifier d'abord si l'utilisateur existe déjà
    if (firebase_uid) {
      const existingUser = await getUserByFirebaseUid(firebase_uid);
      if (existingUser) {
        return NextResponse.json({
          success: true,
          user: existingUser,
          message: 'Utilisateur déjà existant'
        });
      }
    }

    let firebaseUser = null;

    // Si on a un UID Firebase, on utilise l'utilisateur existant
    if (firebase_uid) {
      try {
        const userRecord = await adminAuth.getUser(firebase_uid);
        firebaseUser = {
          uid: userRecord.uid,
          email: userRecord.email,
          displayName: userRecord.displayName,
          phoneNumber: userRecord.phoneNumber,
          photoURL: userRecord.photoURL,
          emailVerified: userRecord.emailVerified,
        };
      } catch (error) {
        return NextResponse.json(
          { error: 'UID Firebase invalide' },
          { status: 400 }
        );
      }
    } 
    // Sinon, créer un nouvel utilisateur Firebase
    else if (password) {
      const firebaseResult = await firebaseSignUpWithEmail(email, password);
      
      if (firebaseResult.error) {
        return NextResponse.json(
          { error: firebaseResult.error.message },
          { status: 400 }
        );
      }

      if (!firebaseResult.data) {
        return NextResponse.json(
          { error: 'Erreur lors de la création du compte Firebase' },
          { status: 500 }
        );
      }

      firebaseUser = firebaseResult.data;
    } else {
      return NextResponse.json(
        { error: 'Password ou firebase_uid requis' },
        { status: 400 }
      );
    }

    // Créer l'utilisateur dans PostgreSQL
    const dbResult = await createUserInDatabase(firebaseUser, {
      username,
      first_name,
      last_name,
      phone_number,
      fcm_token
    });

    if (!dbResult.success) {
      // Rollback Firebase user seulement si on l'a créé
      if (!firebase_uid && firebaseUser && typeof firebaseUser.delete === 'function') {
        await firebaseUser.delete();
      }
      return NextResponse.json(
        { error: dbResult.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      user: dbResult.user,
      message: firebase_uid 
        ? 'Utilisateur ajouté à la base de données avec succès'
        : 'Compte créé avec succès'
    });

  } catch (error) {
    console.error('API Error POST /api/auth/register:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'inscription' },
      { status: 500 }
    );
  }
}