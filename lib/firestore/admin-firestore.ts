// lib/firestore/admin-firestore.ts
// Singleton Firestore Admin — réutilise l'initialisation existante firebase-admin
// Utilisé côté SERVER uniquement (Server Actions, API Routes)

import * as admin from "firebase-admin";
import type { Firestore } from "firebase-admin/firestore";

let _firestoreInstance: Firestore | null = null;

/**
 * Retourne une instance Firestore Admin singleton.
 * Réutilise l'app Firebase Admin déjà initialisée (lib/firebase-admin.ts ou server.ts).
 * Si aucune app n'est initialisée, tente d'initialiser avec les variables d'environnement.
 */
export function getAdminFirestore(): Firestore {
  if (_firestoreInstance) return _firestoreInstance;

  // Initialiser Firebase Admin si pas encore fait
  if (admin.apps.length === 0) {
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;

    if (!projectId || !clientEmail || !privateKey) {
      throw new Error(
        "❌ Variables Firebase Admin manquantes (NEXT_PUBLIC_FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY)"
      );
    }

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey: privateKey.replace(/\\n/g, "\n"),
      }),
    });

    console.log("✅ Firebase Admin initialisé depuis getAdminFirestore()");
  }

  _firestoreInstance = admin.firestore();

  // Configuration Firestore : ignorer les propriétés undefined
  _firestoreInstance.settings({ ignoreUndefinedProperties: true });

  return _firestoreInstance;
}

/**
 * Helper — réinitialise le singleton (utile pour les tests)
 */
export function _resetFirestoreInstance() {
  _firestoreInstance = null;
}
