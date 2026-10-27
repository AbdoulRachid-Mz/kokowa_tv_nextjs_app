import { auth } from "@/configs/firebase/config";
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  User,
} from "firebase/auth";
import { getFirebaseErrorMessage } from "./getFirebaseErrorMessage";

export interface AuthResponse {
  data?: any;
  error?: {
    code: string;
    message: string;
  };
}

/**
 * Extrait proprement le code d'erreur Firebase à partir de l'objet ou du message d'erreur.
 */
export const extractFirebaseErrorCode = (error: unknown): string => {
  if (!error) return "unknown";

  // 1. FirebaseError possède la propriété error.code (ex: "auth/invalid-credential")
  if (typeof error === "object" && "code" in error && typeof (error as any).code === "string") {
    return (error as any).code.replace(/\.+$/, "").trim();
  }

  // 2. Si le code est encapsulé dans error.message (ex: "Firebase: Error (auth/invalid-credential).")
  if (error instanceof Error) {
    const match = error.message.match(/\((auth\/[^)]+)\)/);
    if (match?.[1]) {
      return match[1].replace(/\.+$/, "").trim();
    }
    return error.message.replace(/\.+$/, "").trim();
  }

  return String(error);
};

export const handleFirebaseError = (
  error: unknown,
  method: string = "unknown"
): { code: string; message: string } => {
  const errorCode = extractFirebaseErrorCode(error);

  // Journalisation dans la console pour un diagnostic clair
  console.error(`[Firebase Auth Error][${method}]`, {
    code: errorCode,
    rawError: error,
  });

  return {
    code: errorCode,
    message: getFirebaseErrorMessage(method, errorCode),
  };
};

export const firebaseSignUpWithEmail = async (
  email: string,
  password: string
): Promise<AuthResponse> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    return { data: userCredential.user };
  } catch (error) {
    return { error: handleFirebaseError(error, "createUserWithEmailAndPassword") };
  }
};

export const firebaseSignInWithEmail = async (
  email: string,
  password: string
): Promise<AuthResponse> => {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    return { data: userCredential.user };
  } catch (error) {
    return { error: handleFirebaseError(error, "signInWithEmailAndPassword") };
  }
};

export const firebaseSendPasswordResetEmail = async (
  email: string
): Promise<AuthResponse> => {
  try {
    await sendPasswordResetEmail(auth, email);
    return { data: true };
  } catch (error) {
    return { error: handleFirebaseError(error, "sendPasswordResetEmail") };
  }
};

export const firebaseSignInWithGoogle = async (): Promise<AuthResponse> => {
  try {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);

    if (!result.user) {
      throw new Error("No user returned from Google sign in");
    }

    return { data: result.user };
  } catch (error) {
    return { error: handleFirebaseError(error, "signInWithPopup") };
  }
};

export const firebaseSignOut = async (): Promise<AuthResponse> => {
  try {
    await signOut(auth);
    return { data: true };
  } catch (error) {
    return { error: handleFirebaseError(error, "signOut") };
  }
};
