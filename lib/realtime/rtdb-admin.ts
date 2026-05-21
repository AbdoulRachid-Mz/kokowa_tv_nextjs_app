// lib/realtime/rtdb-admin.ts
// Singleton Firebase Admin pour Realtime Database (RTDB)
// Utilisé côté SERVER uniquement (Server Actions, API Routes)

import * as admin from "firebase-admin";
import type { Database } from "firebase-admin/database";

let _rtdbInstance: Database | null = null;

/**
 * Retourne une instance Firebase Realtime Database Admin singleton.
 * Réutilise l'app Firebase Admin déjà initialisée ou l'initialise.
 */
export function getAdminRTDB(): Database {
  if (_rtdbInstance) return _rtdbInstance;

  // Initialiser Firebase Admin si pas encore fait
  if (admin.apps.length === 0) {
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;
    const databaseURL = process.env.FIREBASE_DATABASE_URL || process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL; // ← prioritaire

    if (!databaseURL) {
      throw new Error(
        "❌ FIREBASE_DATABASE_URL est manquante. " +
        "Vérifiez votre fichier .env.local ou les variables d'environnement."
      );
    }

    if (!projectId || !clientEmail || !privateKey) {
      throw new Error(
        "❌ Variables Firebase Admin manquantes : " +
        "NEXT_PUBLIC_FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY"
      );
    }

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey: privateKey.replace(/\\n/g, "\n"),
      }),
      databaseURL, // ← essentiel
    });

    console.log("✅ Firebase Admin initialisé avec RTDB URL :", databaseURL);
  }

  _rtdbInstance = admin.database();
  return _rtdbInstance;
}

/**
 * Helper — réinitialise le singleton (utile pour les tests)
 */
export function _resetRTDBInstance() {
  _rtdbInstance = null;
}
