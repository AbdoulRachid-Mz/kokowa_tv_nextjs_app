// @/lib/server/app-check.ts
import rawAdmin from 'firebase-admin';

const admin: typeof rawAdmin = (rawAdmin as any)?.default || rawAdmin;

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
    
    // Vérifier que le token provient d'une application autorisée (Web ou Mobile Flutter)
    const allowedAppIds = [
      process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
      process.env.FIREBASE_ANDROID_APP_ID,
      process.env.FIREBASE_IOS_APP_ID,
    ].filter(Boolean);

    if (allowedAppIds.length > 0 && !allowedAppIds.includes(appCheckToken.appId)) {
      console.error('App ID Firebase non reconnu:', {
        allowed: allowedAppIds,
        received: appCheckToken.appId,
      });
      return {
        success: false,
        error: 'Token App Check non autorisé',
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