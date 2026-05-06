// lib/client/firebase-app-check.ts
import app from '@/configs/firebase/config';
import { initializeAppCheck, ReCaptchaV3Provider, getToken } from 'firebase/app-check';

declare global {
  interface Window {
    FIREBASE_APPCHECK_DEBUG_TOKEN?: string;
  }
}

// Instance d'App Check initialisée uniquement côté client
let appCheckInstance: any = null;

function getAppCheck() {
  // Ne pas initialiser si on est côté serveur
  if (typeof window === 'undefined') return null;

  if (!appCheckInstance) {
    // En développement, définir le token de debug
    if (process.env.NODE_ENV === 'development') {
      window.FIREBASE_APPCHECK_DEBUG_TOKEN = process.env.NEXT_PUBLIC_APP_CHECK_DEBUG_TOKEN;
    }

    appCheckInstance = initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY!),
      isTokenAutoRefreshEnabled: true,
    });
  }
  return appCheckInstance;
}

export async function getAppCheckToken(): Promise<string | null> {
  const appCheck = getAppCheck();
  if (!appCheck) return null;

  try {
    const { token } = await getToken(appCheck, false);

    if (!token || token.length < 10) {
      console.warn("App Check token invalide");
      return null;
    }

    return token;
  } catch (error) {
    console.warn("App Check indisponible (fallback autorisé):", error);
    return null; // ⚠️ IMPORTANT → ne bloque pas
  }
}