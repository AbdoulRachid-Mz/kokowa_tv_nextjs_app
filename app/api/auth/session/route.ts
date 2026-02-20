// api/auth/session/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { adminAuth } from '@/lib/firebase-admin';
import { getCompleteUserData } from '@/lib/server/auth-utils';

const COOKIE_NAME = "firebase_session";

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get(COOKIE_NAME);

    if (!session) {
      return NextResponse.json({ user: null });
    }
    if (!adminAuth) {
      return NextResponse.json({ user: null, error: "Firebase non initialisé" });
    }

    const decoded = await adminAuth.verifySessionCookie(session.value, true);

    // Passer les données Firebase pour permettre la création automatique si nécessaire
    const firebaseUserData = {
      uid: decoded.uid,
      email: decoded.email,
      displayName: decoded.name,
      phoneNumber: decoded.phone_number,
      photoURL: decoded.picture
    };

    const userDocument = await getCompleteUserData(decoded.uid, firebaseUserData);

    return NextResponse.json({
      user: userDocument,
      firebaseUser: { uid: decoded.uid, email: decoded.email },
      success: true
    });

  } catch (error) {
    console.error('Error in session API:', error);
    return NextResponse.json({ user: null });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json({ error: "Token manquant" }, { status: 400 });
    }
    if (!adminAuth) {
      return NextResponse.json({ user: null, error: "Firebase non initialisé" }, { status: 500 });
    }

    // Vérifier le token
    const decoded = await adminAuth.verifyIdToken(token);

    // Créer le cookie de session
    const sessionCookie = await adminAuth.createSessionCookie(token, {
      expiresIn: 5 * 24 * 60 * 60 * 1000, // 5 jours
    });

    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAME, sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 5 * 24 * 60 * 60, // 5 jours en secondes
    });

    return NextResponse.json({
      success: true,
      uid: decoded.uid
    });

  } catch (error: any) {
    console.error('Error creating session:', error);
    return NextResponse.json(
      { error: "Token invalide ou expiré" },
      { status: 401 }
    );
  }
}

export async function DELETE() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete(COOKIE_NAME);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting session:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}