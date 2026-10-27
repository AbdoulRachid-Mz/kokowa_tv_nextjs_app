import errors from "@/configs/locales/errors.json";

type FirebaseErrorsType = {
  [key: string]: string;
};

type FirebaseErrors = {
  [key: string]: FirebaseErrorsType | string;
};

const firebaseErrors: Record<string, any> = {
  ...errors,
  unknown: {
    unknown: errors.unknown,
  },
};

/**
 * Récupère le message d'erreur Firebase formaté en fonction de la méthode et du code d'erreur.
 * Inclut une recherche multi-sections et des messages explicites pour App Check / reCAPTCHA.
 *
 * @param method - Le nom de la méthode Firebase utilisée (ex: 'signInWithEmailAndPassword').
 * @param errorCode - Le code d'erreur renvoyé par Firebase (ex: 'auth/invalid-credential').
 * @returns Le message d'erreur localisé en français.
 */
export function getFirebaseErrorMessage(
  method: string,
  errorCode: string
): string {
  const defaultErrorMessage = errors.unknown;
  const cleanCode = (errorCode || "").replace(/\.+$/, "").trim();

  // 1. Recherche directe dans la méthode spécifiée
  if (firebaseErrors[method] && typeof firebaseErrors[method] === "object") {
    if (firebaseErrors[method][cleanCode]) {
      return firebaseErrors[method][cleanCode];
    }
  }

  // 2. Recherche globale dans toutes les sections d'erreurs (fallback transversal)
  for (const group of Object.keys(firebaseErrors)) {
    const groupObj = firebaseErrors[group];
    if (groupObj && typeof groupObj === "object" && groupObj[cleanCode]) {
      return groupObj[cleanCode];
    }
  }

  // 3. Messages contextuels pour les erreurs de sécurité App Check / reCAPTCHA
  if (
    cleanCode.includes("app-check") ||
    cleanCode.includes("captcha") ||
    cleanCode === "auth/firebase-app-check-token-is-invalid"
  ) {
    return "Échec de vérification de sécurité App Check / reCAPTCHA. Le jeton d'intégrité de l'application est invalide ou non autorisé.";
  }

  if (cleanCode.includes("network-request-failed")) {
    return "Impossible de contacter les serveurs Firebase. Veuillez vérifier votre connexion internet.";
  }

  if (cleanCode.includes("too-many-requests")) {
    return "Trop de tentatives infructueuses. Votre compte a été temporairement verrouillé pour des raisons de sécurité. Réessayez plus tard.";
  }

  // 4. Si le code est inconnu mais spécifique, afficher le message par défaut avec le code technique
  if (cleanCode && cleanCode !== "unknown" && cleanCode !== "unknown-error") {
    return `${defaultErrorMessage} (${cleanCode})`;
  }

  return defaultErrorMessage;
}
