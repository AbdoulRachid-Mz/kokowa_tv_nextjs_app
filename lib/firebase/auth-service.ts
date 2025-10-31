import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  GoogleAuthProvider,
  UserCredential
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { UserInterface, UserDocument, AuthResponse } from '@/types/user';
import { auth, db } from '@/configs/firebase/config';
import { createUserInDatabase, getCompleteUserData } from '../server/auth-utils';

const googleProvider = new GoogleAuthProvider();

export class AuthService {
  // Inscription avec email/mot de passe
  static async signUp(
    email: string, 
    password: string, 
    userData?: any
  ): Promise<AuthResponse> {
    try {
      // Créer l'utilisateur dans Firebase Auth
      const userCredential: UserCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Mettre à jour le profil Firebase Auth si des données sont fournies
      if (userData?.displayName) {
        await updateProfile(user, {
          displayName: userData.displayName,
          photoURL: userData.photoURL
        });
      }

      // Créer l'utilisateur dans PostgreSQL
      const dbResult = await createUserInDatabase(user, {
        username: userData?.username || email.split('@')[0],
        first_name: userData?.first_name || userData?.displayName?.split(' ')[0] || '',
        last_name: userData?.last_name || userData?.displayName?.split(' ').slice(1).join(' ') || '',
        phone_number: userData?.phone_number || '',
        region_id: userData?.region_id,
      });

      if (!dbResult.success) {
        // Rollback: supprimer l'utilisateur Firebase
        await user.delete();
        return {
          success: false,
          error: dbResult.error
        };
      }

      return {
        success: true,
        user: this.formatFirebaseUser(user),
        userDocument: dbResult.user
      };
    } catch (error: any) {
      console.error('Erreur lors de l\'inscription:', error);
      return {
        success: false,
        error: this.getAuthErrorMessage(error.code)
      };
    }
  }

  // Connexion avec email/mot de passe
  static async signIn(email: string, password: string): Promise<AuthResponse> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Récupérer le profil utilisateur depuis PostgreSQL
      const userDocument = await getCompleteUserData(user.uid);

      if (!userDocument) {
        return {
          success: false,
          error: 'Profil utilisateur non trouvé'
        };
      }

      return {
        success: true,
        user: this.formatFirebaseUser(user),
        userDocument
      };
    } catch (error: any) {
      console.error('Erreur lors de la connexion:', error);
      return {
        success: false,
        error: this.getAuthErrorMessage(error.code)
      };
    }
  }

  // Connexion avec Google
  static async signInWithGoogle(): Promise<AuthResponse> {
    try {
      const userCredential = await signInWithPopup(auth, googleProvider);
      const user = userCredential.user;

      // Vérifier si l'utilisateur existe dans PostgreSQL
      let userDocument = await getCompleteUserData(user.uid);

      if (!userDocument) {
        // Créer l'utilisateur dans PostgreSQL
        const dbResult = await createUserInDatabase(user, {
          username: user.email?.split('@')[0] || `user_${user.uid.slice(0, 8)}`,
          first_name: user.displayName?.split(' ')[0] || '',
          last_name: user.displayName?.split(' ').slice(1).join(' ') || '',
          phone_number: user.phoneNumber || '',
        });

        if (!dbResult.success) {
          return {
            success: false,
            error: dbResult.error
          };
        }

        userDocument = dbResult.user!;
      }

      return {
        success: true,
        user: this.formatFirebaseUser(user),
        userDocument
      };
    } catch (error: any) {
      console.error('Erreur lors de la connexion Google:', error);
      return {
        success: false,
        error: this.getAuthErrorMessage(error.code)
      };
    }
  }

  // Envoyer un email de réinitialisation de mot de passe
  static async sendPasswordResetEmail(email: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { sendPasswordResetEmail: firebaseSendPasswordResetEmail } = await import('firebase/auth');
      await firebaseSendPasswordResetEmail(auth, email);
      return { success: true };
    } catch (error: any) {
      console.error('Erreur envoi email réinitialisation:', error);
      return {
        success: false,
        error: this.getAuthErrorMessage(error.code)
      };
    }
  }

  // Confirmer la réinitialisation du mot de passe
  static async confirmPasswordReset(oobCode: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { confirmPasswordReset: firebaseConfirmPasswordReset } = await import('firebase/auth');
      await firebaseConfirmPasswordReset(auth, oobCode, newPassword);
      return { success: true };
    } catch (error: any) {
      console.error('Erreur confirmation réinitialisation mot de passe:', error);
      return {
        success: false,
        error: this.getAuthErrorMessage(error.code)
      };
    }
  }

  // Vérifier la validité du code de réinitialisation
  static async verifyPasswordResetCode(oobCode: string): Promise<{ success: boolean; email?: string; error?: string }> {
    try {
      const { verifyPasswordResetCode: firebaseVerifyPasswordResetCode } = await import('firebase/auth');
      const email = await firebaseVerifyPasswordResetCode(auth, oobCode);
      return { success: true, email };
    } catch (error: any) {
      console.error('Erreur vérification code réinitialisation:', error);
      return {
        success: false,
        error: this.getAuthErrorMessage(error.code)
      };
    }
  }

  // Déconnexion
  static async signOut(): Promise<{ success: boolean; error?: string }> {
    try {
      await signOut(auth);
      return { success: true };
    } catch (error: any) {
      console.error('Erreur lors de la déconnexion:', error);
      return {
        success: false,
        error: 'Erreur lors de la déconnexion'
      };
    }
  }

  // Formater l'utilisateur Firebase
  private static formatFirebaseUser(user: any): UserInterface {
    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      emailVerified: user.emailVerified,
      phoneNumber: user.phoneNumber,
      photoURL: user.photoURL,
    };
  }

  // Gestion des erreurs d'authentification
  private static getAuthErrorMessage(errorCode: string): string {
    const errorMessages: { [key: string]: string } = {
      'auth/email-already-in-use': 'Un compte avec cet email existe déjà',
      'auth/invalid-email': 'Adresse email invalide',
      'auth/operation-not-allowed': 'Opération non autorisée',
      'auth/weak-password': 'Le mot de passe est trop faible',
      'auth/user-disabled': 'Ce compte a été désactivé',
      'auth/user-not-found': 'Aucun compte trouvé avec cet email',
      'auth/wrong-password': 'Mot de passe incorrect',
      'auth/too-many-requests': 'Trop de tentatives, réessayez plus tard',
      'auth/network-request-failed': 'Erreur réseau, vérifiez votre connexion',
      'auth/expired-action-code': 'Le lien de réinitialisation a expiré',
      'auth/invalid-action-code': 'Lien de réinitialisation invalide',
    };

    return errorMessages[errorCode] || 'Une erreur est survenue';
  }
}