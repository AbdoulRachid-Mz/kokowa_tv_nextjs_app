// lib/client/firebase-app-check.ts
import { initializeAppCheck, ReCaptchaV3Provider, getToken } from "firebase/app-check";
import { app } from "@/configs/firebase/config"; // Ajustez le chemin vers votre config.ts si nécessaire

let appCheckInstance: any = null;

export function initAppCheck() {
  if (typeof window === "undefined") return;

  const isEnabled = process.env.NEXT_PUBLIC_ENABLE_APP_CHECK === "true";
  
  if (!isEnabled) {
    return;
  }

  try {
    if (process.env.NODE_ENV === "development") {
      if (process.env.NEXT_PUBLIC_FIREBASE_APP_CHECK_DEBUG_TOKEN) {
        (window as any).FIREBASE_APPCHECK_DEBUG_TOKEN = 
          process.env.NEXT_PUBLIC_FIREBASE_APP_CHECK_DEBUG_TOKEN;
      }
    }

    const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

    if (!siteKey) {
      console.error("La clé reCAPTCHA (NEXT_PUBLIC_RECAPTCHA_SITE_KEY) est manquante.");
      return;
    }

    if (!appCheckInstance) {
      appCheckInstance = initializeAppCheck(app, {
        provider: new ReCaptchaV3Provider(siteKey),
        isTokenAutoRefreshEnabled: true,
      });
    }
  } catch (error) {
    console.error("Erreur lors de l'initialisation d'App Check :", error);
  }
}

/**
 * Fonction appelée par use-auth.ts pour récupérer le token App Check.
 * Retourne null si App Check est désactivé ou non initialisé pour éviter de bloquer le sign-in/sign-up.
 */
export async function getAppCheckToken(): Promise<string | null> {
  if (typeof window === "undefined") return null;

  const isEnabled = process.env.NEXT_PUBLIC_ENABLE_APP_CHECK === "true";
  if (!isEnabled || !appCheckInstance) {
    return null; 
  }

  try {
    const appCheckTokenResponse = await getToken(appCheckInstance, false);
    return appCheckTokenResponse.token;
  } catch (error) {
    console.error("Erreur lors de la récupération du token App Check :", error);
    return null;
  }
}