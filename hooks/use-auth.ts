"use client"

import { User, onAuthStateChanged } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { createUserInDatabase, getCompleteUserData } from '@/lib/server/auth-utils';
import { useLocalStorage } from './use-local-storage';
import { UserDocument, UserInterface } from '@/types/user';
import { auth } from '@/configs/firebase/config';
import { AuthService } from '@/lib/firebase/auth-service';

export function useAuth() {
  const [user, setUser] = useState<UserInterface | null>(null);
  const [userDocument, setUserDocument] = useState<UserDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const { setItem, removeItem } = useLocalStorage();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        setUserDocument(null);
        setLoading(false);
        removeItem('user');
        removeItem('userDocument');
        return;
      }

      const formattedUser = formatUser(firebaseUser);
      await fetchUserDocument(formattedUser);
    });

    return () => unsubscribe();
  }, []);

  const formatUser = (user: User): UserInterface => ({
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    emailVerified: user.emailVerified,
    phoneNumber: user.phoneNumber,
    photoURL: user.photoURL,
  });

  const fetchUserDocument = async (user: UserInterface) => {
    try {
      const userData = await getCompleteUserData(user.uid);
      
      if (userData) {
        const completeUser = { 
          ...user, 
          userDocument: userData 
        };
        
        setUser(completeUser);
        setUserDocument(userData);
        setItem('user', JSON.stringify(completeUser));
        setItem('userDocument', JSON.stringify(userData));
        
        // Mettre à jour la dernière connexion
        await updateLastLogin(user.uid);
      } else {
        console.warn('User exists in Firebase but not in PostgreSQL');
        setUser(user);
        setUserDocument(null);
      }
      
      setLoading(false);
    } catch (error) {
      console.error("Error fetching user document:", error);
      setLoading(false);
    }
  };

  // Connexion avec email/mot de passe
  const signIn = async (email: string, password: string): Promise<void> => {
    try {
      const response = await AuthService.signIn(email, password);
      if (!response.success) {
        throw new Error(response.error || 'Erreur de connexion');
      }
      const formattedUser = formatUser(response.user! as User);
      await fetchUserDocument(formattedUser);
    } catch (error: any) {
      console.error('Sign in error:', error);
      throw new Error(getAuthErrorMessage(error.code));
    }
  };

  // Inscription avec email/mot de passe
  const signUp = async (email: string, password: string, userData?: any): Promise<void> => {
    try {
      const response = await AuthService.signUp(email, password, userData);
      if (!response.success) {
        throw new Error(response.error || 'Erreur lors de la création du compte');
      }
      const formattedUser = formatUser(response.user! as User);
      await fetchUserDocument(formattedUser);
    } catch (error: any) {
      console.error('Sign up error:', error);
      throw new Error(getAuthErrorMessage(error.code));
    }
  };

  // Connexion avec Google
  const signInWithGoogle = async (): Promise<void> => {
    try {
      const response = await AuthService.signInWithGoogle();
      if (!response.success) {
        throw new Error(response.error || 'Erreur de connexion Google');
      }
      const formattedUser = formatUser(response.user! as User);
      await fetchUserDocument(formattedUser);
    } catch (error: any) {
      console.error('Google sign in error:', error);
      throw new Error(getAuthErrorMessage(error.code));
    }
  };

  // Reset password
  const resetPassword = async (email: string): Promise<void> => {
    try {
      const response = await AuthService.sendPasswordResetEmail(email);
      if (!response.success) {
        throw new Error(response.error || 'Erreur lors de l\'envoi de l\'email');
      }
    } catch (error: any) {
      console.error('Reset password error:', error);
      throw new Error(getAuthErrorMessage(error.code));
    }
  };

  // Confirmer la réinitialisation du mot de passe
  const confirmPasswordReset = async (oobCode: string, newPassword: string): Promise<void> => {
    try {
      const response = await AuthService.confirmPasswordReset(oobCode, newPassword);
      if (!response.success) {
        throw new Error(response.error || 'Erreur lors de la réinitialisation');
      }
    } catch (error: any) {
      console.error('Confirm password reset error:', error);
      throw new Error(getAuthErrorMessage(error.code));
    }
  };

  // Vérifier le code de réinitialisation
  const verifyPasswordResetCode = async (oobCode: string): Promise<string> => {
    try {
      const response = await AuthService.verifyPasswordResetCode(oobCode);
      if (!response.success) {
        throw new Error(response.error || 'Code de réinitialisation invalide');
      }
      return response.email!;
    } catch (error: any) {
      console.error('Verify password reset code error:', error);
      throw new Error(getAuthErrorMessage(error.code));
    }
  };

  // Déconnexion
  const signOutUser = async (): Promise<void> => {
    try {
      const response = await AuthService.signOut();
      if (!response.success) {
        throw new Error(response.error || 'Erreur lors de la déconnexion');
      }
      setUser(null);
      setUserDocument(null);
      removeItem('user');
      removeItem('userDocument');
    } catch (error: any) {
      console.error('Sign out error:', error);
      throw new Error('Erreur lors de la déconnexion');
    }
  };

  const reloadUser = async (): Promise<void> => {
    if (auth.currentUser) {
      await auth.currentUser.reload();
      const formattedUser = formatUser(auth.currentUser);
      await fetchUserDocument(formattedUser);
    }
  };

  const updateLastLogin = async (uid: string): Promise<void> => {
    try {
      await fetch('/api/auth/update-last-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ uid }),
      });
    } catch (error) {
      console.error('Error updating last login:', error);
    }
  };

  // Vérifications de permissions
  const hasRole = (role: string): boolean => {
    return userDocument?.role === role;
  };

  const hasPermission = (permission: string): boolean => {
    if (!userDocument) return false;
    
    const rolePermissions: Record<string, string[]> = {
      admin: ['manage_users', 'manage_fighters', 'manage_competitions', 'manage_regions'],
      editor: ['manage_fighters', 'manage_competitions'],
      moderator: ['manage_fighters', 'moderate_content'],
      fighter_manager: ['manage_fighters'],
      user: ['view_content']
    };

    return rolePermissions[userDocument.role]?.includes(permission) || false;
  };

  const canManageFighters = (): boolean => {
    return hasPermission('manage_fighters');
  };

  const canManageCompetitions = (): boolean => {
    return hasPermission('manage_competitions');
  };

  const canManageUsers = (): boolean => {
    return hasPermission('manage_users');
  };

  // Fonction utilitaire pour les messages d'erreur
  const getAuthErrorMessage = (errorCode: string): string => {
    const errorMessages: Record<string, string> = {
      'auth/invalid-email': 'Adresse email invalide',
      'auth/user-disabled': 'Ce compte a été désactivé',
      'auth/user-not-found': 'Aucun compte trouvé avec cette adresse email',
      'auth/wrong-password': 'Mot de passe incorrect',
      'auth/email-already-in-use': 'Un compte existe déjà avec cette adresse email',
      'auth/weak-password': 'Le mot de passe est trop faible',
      'auth/operation-not-allowed': 'Cette opération n\'est pas autorisée',
      'auth/account-exists-with-different-credential': 'Un compte existe déjà avec des identifiants différents',
      'auth/popup-closed-by-user': 'La fenêtre de connexion a été fermée',
      'auth/cancelled-popup-request': 'La connexion a été annulée',
      'auth/expired-action-code': 'Le lien de réinitialisation a expiré',
      'auth/invalid-action-code': 'Lien de réinitialisation invalide',
    };

    return errorMessages[errorCode] || 'Une erreur est survenue lors de l\'authentification';
  };

  return { 
    user, 
    userDocument,
    loading,
    signIn,
    signUp,
    signInWithGoogle,
    signOut: signOutUser,
    resetPassword,
    confirmPasswordReset,
    verifyPasswordResetCode,
    reloadUser,
    // Permissions
    hasRole,
    hasPermission,
    canManageFighters,
    canManageCompetitions,
    canManageUsers,
    // États dérivés
    isAdmin: hasRole('admin'),
    isEditor: hasRole('editor'),
    isModerator: hasRole('moderator'),
    isFighterManager: hasRole('fighter_manager')
  };
}