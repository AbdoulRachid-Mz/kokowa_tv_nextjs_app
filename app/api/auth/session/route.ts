// /api/auth/session/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { adminAuth } from '@/lib/firebase-admin';
import { getCompleteUserData, createUserInDatabase } from '@/lib/server/auth-utils';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');

    if (!sessionCookie) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    // Vérifier le cookie de session Firebase
    const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie.value, true);
    
    if (!decodedClaims) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    // Récupérer l'utilisateur depuis PostgreSQL
    let userDocument = await getCompleteUserData(decodedClaims.uid);

    // Si l'utilisateur n'existe pas en base, le créer
    if (!userDocument) {
      console.log('User not found in database, creating...');
      
      // Récupérer les infos Firebase
      const firebaseUser = await adminAuth.getUser(decodedClaims.uid);
      
      // Créer l'utilisateur en base
      const dbResult = await createUserInDatabase(
        {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          phoneNumber: firebaseUser.phoneNumber,
          photoURL: firebaseUser.photoURL,
          emailVerified: firebaseUser.emailVerified,
        } as any,
        {
          username: firebaseUser.email?.split('@')[0] || `user_${firebaseUser.uid.slice(0, 8)}`,
          first_name: firebaseUser.displayName?.split(' ')[0] || '',
          last_name: firebaseUser.displayName?.split(' ').slice(1).join(' ') || '',
          phone_number: firebaseUser.phoneNumber || '',
        }
      );

      if (dbResult.success) {
        userDocument = dbResult.user!;
      }
    }

    // Mettre à jour la dernière connexion
    if (userDocument) {
      await fetch(`${request.nextUrl.origin}/api/auth/update-last-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: decodedClaims.uid }),
      });
    }

    return NextResponse.json({
      user: userDocument
    });

  } catch (error) {
    console.error('Error getting session:', error);
    return NextResponse.json({ user: null }, { status: 200 });
  }
}

export async function DELETE() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete('session');
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting session:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}