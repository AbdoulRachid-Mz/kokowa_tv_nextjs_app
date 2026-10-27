// @/lib/firebase-admin.ts
import rawAdmin from 'firebase-admin';

// Support universel ESM / CommonJS / Next.js Turbopack / Bun
const admin: typeof rawAdmin = (rawAdmin as any)?.default || rawAdmin;

function initializeFirebaseAdmin() {
  if (admin?.apps && admin.apps.length > 0) {
    console.log('✅ Firebase Admin déjà initialisé');
    return;
  }

  try {
    console.log('🔄 Initialisation Firebase Admin...');

    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;

    if (!projectId || !clientEmail || !privateKey) {
      throw new Error('Variables Firebase manquantes');
    }

    const databaseURL = process.env.FIREBASE_DATABASE_URL || process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL;

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey: privateKey.replace(/\\n/g, '\n'),
      }),
      ...(databaseURL && { databaseURL }),
    });

    console.log('✅ Firebase Admin initialisé correctement');
  } catch (error) {
    console.error('❌ Erreur initialisation Firebase Admin:', error);
  }
}

initializeFirebaseAdmin();

export const adminAuth =
  admin?.apps && admin.apps.length > 0 ? admin.auth() : null;

export default admin;
