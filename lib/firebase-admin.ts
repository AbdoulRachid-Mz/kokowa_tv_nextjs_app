import * as admin from 'firebase-admin';

function initializeFirebaseAdmin() {
  if (admin.apps.length > 0) {
    console.log('✅ Firebase Admin déjà initialisé');
    return;
  }

  try {
    console.log('🔄 Initialisation Firebase Admin...');

    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;

    if (!projectId || !clientEmail || !privateKey) {
      throw new Error('Variables Firebase manquantes');
    }

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey: privateKey.replace(/\\n/g, '\n'),
      }),
    });

    console.log('✅ Firebase Admin initialisé correctement');
  } catch (error) {
    console.error('❌ Erreur initialisation Firebase Admin:', error);
  }
}

initializeFirebaseAdmin();

export const adminAuth =
  admin.apps.length > 0 ? admin.auth() : null;

export default admin;
