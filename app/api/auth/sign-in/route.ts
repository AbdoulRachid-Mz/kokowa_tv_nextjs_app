// app/api/auth/sign-in/route.ts
import { NextRequest } from 'next/server';
import { apiHandler, ApiContext } from '@/lib/server/api-handler';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth as clientAuth } from '@/configs/firebase/config';
import { adminAuth } from '@/lib/firebase-admin';
import { getOrCreateUserFromFirebase } from '@/lib/server/auth-utils';
import { cookies } from 'next/headers';

export const POST = (request: NextRequest, context: ApiContext) =>
  apiHandler(
    request,
    context,
    async (req) => {
      const { email, password } = await req.json();
      if (!email || !password) {
        return Response.json(
          { success: false, error: 'Email et mot de passe requis' },
          { status: 400 }
        );
      }

      // Connexion Firebase
      let firebaseUser;
      try {
        const userCredential = await signInWithEmailAndPassword(clientAuth, email, password);
        firebaseUser = userCredential.user;
      } catch (error: any) {
        return Response.json(
          { success: false, error: error.message },
          { status: 401 }
        );
      }

      // Récupérer/créer l'utilisateur DB
      const dbUser = await getOrCreateUserFromFirebase({
        uid: firebaseUser.uid,
        email: firebaseUser.email || undefined,
        displayName: firebaseUser.displayName || undefined,
        photoURL: firebaseUser.photoURL || undefined,
        emailVerified: firebaseUser.emailVerified,
      });

      // Créer un cookie de session
      const token = await firebaseUser.getIdToken();
      const sessionCookie = await adminAuth!.createSessionCookie(token, {
        expiresIn: 5 * 24 * 60 * 60 * 1000,
      });

      const cookieStore = await cookies();
      cookieStore.set('firebase_session', sessionCookie, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 5 * 24 * 60 * 60,
      });

      return Response.json({
        success: true,
        data: {
          firebase: { uid: firebaseUser.uid, email: firebaseUser.email },
          db: dbUser,
        },
      });
    },
    {
      requireAuth: false,
      requireAppCheck: false,
      allowedMethods: ['POST'],
      rateLimit: { windowMs: 60000, max: 10 },
    }
  );