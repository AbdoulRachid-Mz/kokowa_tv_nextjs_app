// @/lib/server/app-check.ts
import * as admin from 'firebase-admin';

export interface AppCheckResult {
  success: boolean;
  appId?: string;
  error?: string;
}

export async function verifyAppCheckToken(token: string): Promise<AppCheckResult> {
  try {
    if (!admin.apps.length) {
      throw new Error('Firebase Admin non initialisé');
    }

    // Vérifier le token App Check
    const appCheckToken = await admin.appCheck().verifyToken(token);
    
    // Vérifier que le token provient de notre app Firebase
    const expectedAppId = process.env.FIREBASE_APP_ID;
    if (expectedAppId && appCheckToken.appId !== expectedAppId) {
      console.error('App ID Firebase ne correspond pas:', {
        expected: expectedAppId,
        received: appCheckToken.appId,
      });
      return {
        success: false,
        error: 'Token App Check invalide',
      };
    }
    
    return {
      success: true,
      appId: appCheckToken.appId,
    };
  } catch (error) {
    console.error('Erreur vérification App Check:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('expired')) {
        return {
          success: false,
          error: 'Token App Check expiré',
        };
      }
      if (error.message.includes('invalid')) {
        return {
          success: false,
          error: 'Token App Check invalide',
        };
      }
    }
    
    return {
      success: false,
      error: 'Erreur vérification App Check',
    };
  }
}

// Pour les environnements de développement
export function isDebugMode(): boolean {
  return process.env.NODE_ENV === 'development' && 
         process.env.APP_CHECK_DEBUG === 'true';
}

// Middleware pour les tests (à utiliser uniquement en développement)
export function createAppCheckDebugToken(): string {
  if (process.env.NODE_ENV !== 'development') {
    throw new Error('Debug tokens only available in development');
  }
  
  return `debug:${process.env.FIREBASE_APP_CHECK_DEBUG_TOKEN}`;
}