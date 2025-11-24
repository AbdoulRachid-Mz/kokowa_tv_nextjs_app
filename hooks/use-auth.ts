"use client"
import { User, onAuthStateChanged } from 'firebase/auth';
import { useEffect, useState, useCallback } from 'react';
import { UserDocument, UserInterface } from '@/types/user';
import { auth } from '@/configs/firebase/config';
import { 
  firebaseSignUpWithEmail, 
  firebaseSignInWithEmail, 
  firebaseSignInWithGoogle,
  firebaseSignOut,
  firebaseSendPasswordResetEmail
} from '@/utils/firebase-auth-utils';

export function useAuth() {
  const [user, setUser] = useState<UserInterface | null>(null);
  const [userDocument, setUserDocument] = useState<UserDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  // Formater l'utilisateur Firebase
  const formatUser = useCallback((user: User): UserInterface => ({
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    emailVerified: user.emailVerified,
    phoneNumber: user.phoneNumber,
    photoURL: user.photoURL,
  }), []);

  // Vérifier et récupérer l'utilisateur depuis l'API
  const checkAndFetchUser = useCallback(async (user: UserInterface) => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/auth/session', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.user) {
          setUser(user);
          setUserDocument(data.user);
          return;
        }
      }

      await createUserInDatabaseOnly(user);
      
      // Recharger la session
      const retryResponse = await fetch('/api/auth/session', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (retryResponse.ok) {
        const data = await retryResponse.json();
        setUser(user);
        setUserDocument(data.user);
      } else {
        setUser(user);
        setUserDocument(null);
      }
    } catch (error) {
      console.error("Error checking user session:", error);
      setUser(user);
      setUserDocument(null);
    } finally {
      setLoading(false);
      setInitialized(true);
    }
  }, []);

  // Créer l'utilisateur uniquement dans la base de données
  const createUserInDatabaseOnly = async (user: UserInterface) => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: user.email,
          username: user.email?.split('@')[0] || `user_${user.uid.slice(0, 8)}`,
          first_name: user.displayName?.split(' ')[0] || '',
          last_name: user.displayName?.split(' ').slice(1).join(' ') || '',
          phone_number: user.phoneNumber || '',
          firebase_uid: user.uid,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating user in database:', error);
      throw error;
    }
  };

  // Écouter les changements d'authentification
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        setUserDocument(null);
        setLoading(false);
        setInitialized(true);
        
        // Nettoyer la session côté serveur
        await fetch('/api/auth/session', { method: 'DELETE' });
        return;
      }

      const formattedUser = formatUser(firebaseUser);
      await checkAndFetchUser(formattedUser);
    });

    return () => unsubscribe();
  }, [formatUser, checkAndFetchUser]);

  // Recharger l'utilisateur
  const reloadUser = async (): Promise<void> => {
    if (auth.currentUser) {
      try {
        await auth.currentUser.reload();
        const formattedUser = formatUser(auth.currentUser);
        await checkAndFetchUser(formattedUser);
      } catch (error) {
        console.error('Error reloading user:', error);
        throw new Error('Erreur lors du rechargement de l\'utilisateur');
      }
    }
  };

  // Méthodes d'authentification
  const signIn = async (email: string, password: string): Promise<void> => {
    try {
      const response = await firebaseSignInWithEmail(email, password);
      if (response.error) {
        throw new Error(response.error.message);
      }
    } catch (error: any) {
      throw new Error(error.message);
    }
  };

  const signUp = async (email: string, password: string, userData?: any): Promise<void> => {
    try {
      // 1. Créer l'utilisateur Firebase
      const firebaseResponse = await firebaseSignUpWithEmail(email, password);
      if (firebaseResponse.error) {
        throw new Error(firebaseResponse.error.message);
      }

      const firebaseUser = firebaseResponse.data;
      
      // 2. Créer l'utilisateur dans PostgreSQL via l'API
      const apiResponse = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          username: userData?.username || email.split('@')[0],
          first_name: userData?.first_name || '',
          last_name: userData?.last_name || '',
          phone_number: userData?.phone_number || '',
          firebase_uid: firebaseUser.uid,
        }),
      });

      if (!apiResponse.ok) {
        const errorData = await apiResponse.json();
        // Rollback: supprimer l'utilisateur Firebase
        await firebaseUser.delete();
        throw new Error(errorData.error || 'Erreur lors de la création du compte');
      }
    } catch (error: any) {
      throw new Error(error.message);
    }
  };

  const signInWithGoogle = async (): Promise<void> => {
    try {
      const response = await firebaseSignInWithGoogle();
      if (response.error) {
        throw new Error(response.error.message);
      }
    } catch (error: any) {
      throw new Error(error.message);
    }
  };

  const signOutUser = async (): Promise<void> => {
    try {
      const response = await firebaseSignOut();
      if (response.error) {
        throw new Error(response.error.message);
      }
      setUser(null);
      setUserDocument(null);
      
      // Nettoyer la session côté serveur
      await fetch('/api/auth/session', { method: 'DELETE' });
    } catch (error: any) {
      throw new Error(error.message);
    }
  };

  const resetPassword = async (email: string): Promise<void> => {
    try {
      const response = await firebaseSendPasswordResetEmail(email);
      if (response.error) {
        throw new Error(response.error.message);
      }
    } catch (error: any) {
      throw new Error(error.message);
    }
  };

  // Vérifications de permissions
  const hasRole = useCallback((role: string): boolean => {
    return userDocument?.role === role;
  }, [userDocument]);

  const hasPermission = useCallback((permission: string): boolean => {
    if (!userDocument) return false;
    
    const rolePermissions: Record<string, string[]> = {
      admin: ['manage_users', 'manage_fighters', 'manage_competitions', 'manage_regions'],
      editor: ['manage_fighters', 'manage_competitions'],
      moderator: ['manage_fighters', 'moderate_content'],
      fighter_manager: ['manage_fighters'],
      user: ['view_content']
    };

    return rolePermissions[userDocument.role]?.includes(permission) || false;
  }, [userDocument]);

  // États dérivés
  const isAdmin = hasRole('admin');
  // console.log(user, 
  //   userDocument)

  return { 
    user, 
    userDocument,
    loading: loading || !initialized,
    signIn,
    signUp,
    signInWithGoogle,
    signOut: signOutUser,
    resetPassword,
    reloadUser,
    hasRole,
    hasPermission,
    isAdmin,
    canManageFighters: () => hasPermission('manage_fighters'),
    canManageCompetitions: () => hasPermission('manage_competitions'),
    canManageUsers: () => hasPermission('manage_users'),
    isEditor: hasRole('editor'),
    isModerator: hasRole('moderator'),
    isFighterManager: hasRole('fighter_manager')
  };
}