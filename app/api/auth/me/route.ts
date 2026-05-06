// app/api/auth/me/route.ts
import { NextRequest } from 'next/server';
import { withAuth, AuthUser } from '@/lib/server/auth-middleware';
import { getOrCreateUserFromFirebase } from '@/lib/server/auth-utils';

export const GET = withAuth(
  async (request: NextRequest, firebaseUser: AuthUser) => {
    const dbUser = await getOrCreateUserFromFirebase({
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      displayName: firebaseUser.name,
      photoURL: firebaseUser.picture,
      emailVerified: firebaseUser.email_verified ?? false,
    });

    return Response.json({
      success: true,
      data: {
        firebase: {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          emailVerified: firebaseUser.email_verified ?? false,
        },
        db: dbUser,
      },
    });
  },
  [] // pas de permissions spécifiques
);