// @/lib/client/firebase-app-check.ts
import app from '@/configs/firebase/config';
import { initializeAppCheck, ReCaptchaV3Provider, getToken } from 'firebase/app-check';
// import { app } from './firebase'; // Votre instance Firebase existante

// Activer App Check en développement
declare global {
  interface Window {
    FIREBASE_APPCHECK_DEBUG_TOKEN?: string;
  }
}

// En développement, vous pouvez utiliser un token de debug
if (process.env.NODE_ENV === 'development') {
  window.FIREBASE_APPCHECK_DEBUG_TOKEN = process.env.NEXT_PUBLIC_APP_CHECK_DEBUG_TOKEN;
}

// Initialiser App Check
export const appCheck = initializeAppCheck(app, {
  provider: new ReCaptchaV3Provider(process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY!),
  isTokenAutoRefreshEnabled: true,
});

// Récupérer le token App Check
export async function getAppCheckToken(): Promise<string> {
  try {
    const tokenResponse = await getToken(appCheck, false);
    return tokenResponse.token;
  } catch (error) {
    console.error('Erreur récupération App Check token:', error);
    return '';
  }
}