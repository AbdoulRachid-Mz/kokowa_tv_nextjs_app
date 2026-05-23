// @/lib/realtime/rtdb-admin.ts
// Singleton Firebase Admin pour Realtime Database (RTDB)
// Utilisé côté SERVER uniquement (Server Actions, API Routes)

import admin from "@/lib/firebase-admin";
import type { Database } from "firebase-admin/database";

let _rtdbInstance: Database | null = null;

/**
 * Retourne une instance Firebase Realtime Database Admin singleton.
 * Réutilise l'app Firebase Admin déjà initialisée ou l'initialise.
 */
export function getAdminRTDB(): Database {
  if (_rtdbInstance) return _rtdbInstance;

  // Firebase Admin is already initialized by the imported firebase-admin module
  if (admin.apps.length === 0) {
    throw new Error(
      "❌ Firebase Admin n'a pas pu être initialisé. " +
      "Vérifiez les logs d'erreur pour plus de détails."
    );
  }

  const databaseURL = process.env.FIREBASE_DATABASE_URL || process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL;
  if (!databaseURL) {
    throw new Error(
      "❌ FIREBASE_DATABASE_URL est manquante. " +
      "Vérifiez votre fichier .env.local ou les variables d'environnement."
    );
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
