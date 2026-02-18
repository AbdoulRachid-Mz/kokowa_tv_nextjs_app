import * as admin from 'firebase-admin';

// Vérifier si l'application Admin est déjà initialisée
if (!admin.apps.length) {
  try {
    // Option 1: Utiliser les variables d'environnement (recommandé pour Vercel/Production)
    if (process.env.FIREBASE_PRIVATE_KEY) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          // La clé privée doit être formatée correctement pour les nouvelles lignes
          privateKey: process.env.FCM_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
      });
    }
    // Option 2: Application Default Credentials (pour Google Cloud)
    else {
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
      });
    }
  } catch (error) {
    console.error('Firebase admin initialization error:', error);
  }
}

export const adminAuth = admin.auth();
export default admin;