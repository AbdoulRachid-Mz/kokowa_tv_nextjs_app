// lib/client/firebase-app-check.ts
import app from "@/configs/firebase/config";
import { initializeAppCheck, ReCaptchaV3Provider, getToken, AppCheck } from "firebase/app-check";

declare global {
  interface Window {
    FIREBASE_APPCHECK_DEBUG_TOKEN?: string | boolean;
  }
}

// Instance d'App Check initialisée uniquement côté client (singleton)
let appCheckInstance: AppCheck | null = null;
let isInitializing = false;
let appCheckDisabled = false;

/**
 * Initialise Firebase App Check côté client avec reCAPTCHA v3
 * Supporte le debug token en développement et un fallback transparent sans blocage.
 */
export function initAppCheck(): AppCheck | null {
  if (typeof window === "undefined" || appCheckDisabled) return null;
  if (appCheckInstance) return appCheckInstance;
  if (isInitializing) return null;

  const siteKey =
    process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ||
    process.env.NEXT_PUBLIC_FIREBASE_APPCHECK_KEY;

  // Si aucune clé reCAPTCHA valide n'est configurée, désactiver proprement
  if (!siteKey || siteKey.length < 10) {
    if (process.env.NODE_ENV === "development") {
      console.info("ℹ️ Firebase App Check non initialisé (clé reCAPTCHA absente ou incomplète). Mode bypass actif.");
    }
    appCheckDisabled = true;
    return null;
  }

  try {
    isInitializing = true;

    // Configuration du mode debug en local (token spécifique ou génération automatique)
    if (process.env.NODE_ENV === "development") {
      const debugToken =
        process.env.NEXT_PUBLIC_FIREBASE_APP_CHECK_DEBUG_TOKEN ||
        process.env.NEXT_PUBLIC_APP_CHECK_DEBUG_TOKEN;

      window.FIREBASE_APPCHECK_DEBUG_TOKEN = debugToken || true;
    }

    appCheckInstance = initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(siteKey),
      isTokenAutoRefreshEnabled: true, // Rafraîchissement automatique des jetons
    });

    if (process.env.NODE_ENV === "development") {
      console.info("✅ Firebase App Check initialisé avec succès côté client.");
    }

    return appCheckInstance;
  } catch (err: any) {
    console.warn("⚠️ Initialisation Firebase App Check ignorée (fallback transparent) :", err?.message || err);
    appCheckDisabled = true;
    return null;
  } finally {
    isInitializing = false;
  }
}

/**
 * Récupère le token App Check actif ou null si indisponible
 */
export async function getAppCheckToken(): Promise<string | null> {
  const appCheck = initAppCheck();
  if (!appCheck) return null;

  try {
    const tokenResult = await getToken(appCheck, false);
    const token = tokenResult?.token;

    if (!token || token.length < 10) {
      return null;
    }

    return token;
  } catch (error: any) {
    // Ne jamais bloquer les requêtes de l'UI en cas d'erreur de token
    if (process.env.NODE_ENV === "development") {
      console.warn("ℹ️ App Check indisponible (fallback transparent autorisé) :", error?.code || error?.message);
    }
    return null;
  }
}

export default initAppCheck;
