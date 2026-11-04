// app/api/auth/sign-up/route.ts
import { NextRequest } from 'next/server';
import { apiHandler, ApiContext } from '@/lib/server/api-handler';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/configs/firebase/config';
import { getOrCreateUserFromFirebase } from '@/lib/server/auth-utils';
import { createSessionCookie } from '@/lib/session';
import { query } from '@/lib/db/neon-client';

export const POST = (request: NextRequest, context: ApiContext) =>
  apiHandler(
    request,
    context,
    async (req) => {
      const body = await req.json();
      const { email, password, username, first_name, last_name, phone_number } = body;

      if (!email || !password) {
        return Response.json(
          { success: false, error: 'Email et mot de passe requis' },
          { status: 400 }
        );
      }

      // 1. Créer l'utilisateur Firebase
      let firebaseUser;
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        firebaseUser = userCredential.user;
      } catch (firebaseError: any) {
        return Response.json(
          { success: false, error: firebaseError.message || 'Erreur Firebase' },
          { status: 400 }
        );
      }

      // 2. Créer/mettre à jour l'utilisateur dans la DB
      let dbUser;
      try {
        dbUser = await getOrCreateUserFromFirebase({
          uid: firebaseUser.uid,
          email: firebaseUser.email ?? undefined,
          displayName: `${first_name || ''} ${last_name || ''}`.trim(),
          photoURL: firebaseUser.photoURL ?? undefined,
          emailVerified: firebaseUser.emailVerified,
        });

        // Mettre à jour les champs supplémentaires si fournis
        if (username || phone_number) {
          await query(
            `UPDATE users SET username = COALESCE($1, username), phone_number = COALESCE($2, phone_number) WHERE auth_id = $3`,
            [username || null, phone_number || null, firebaseUser.uid]
          );
          // Recharger l'utilisateur
          dbUser = await getOrCreateUserFromFirebase({ uid: firebaseUser.uid });
        }
      } catch (dbError: any) {
        // Rollback: supprimer l'utilisateur Firebase
        await firebaseUser.delete();
        return Response.json(
          { success: false, error: dbError.message || 'Erreur base de données' },
          { status: 500 }
        );
      }

      // 3. Générer un token de session (cookie)
      const sessionCookie = await createSessionCookie(await firebaseUser.getIdToken());

      // Définir le cookie
      const headers = new Headers();
      headers.append(
        'Set-Cookie',
        `firebase_session=${sessionCookie}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${5 * 24 * 60 * 60}`
      );

      return Response.json(
        {
          success: true,
          data: {
            firebase: { uid: firebaseUser.uid, email: firebaseUser.email },
            db: dbUser,
          },
        },
        { headers }
      );
    },
    {
      requireAuth: false,      allowedMethods: ['POST'],
      rateLimit: { windowMs: 60000, max: 5 },
    }
  );