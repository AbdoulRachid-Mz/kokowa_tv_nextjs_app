// hooks/use-auth.ts
"use client"
import { User, onAuthStateChanged, onIdTokenChanged } from 'firebase/auth';
import { useEffect, useState, useCallback } from 'react';
import { UserDocument, UserInterface } from '@/types/user';
import { auth } from '@/configs/firebase/config';

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

  // Initialiser la session côté serveur
  const initServerSession = useCallback(async (firebaseUser: User) => {
    try {
      const token = await firebaseUser.getIdToken(true);

      // Créer la session avec le token
      await fetch("/api/auth/session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
      });

      // Récupérer les données utilisateur (qui seront créées automatiquement si nécessaire)
      const response = await fetch("/api/auth/session");
      if (response.ok) {
        const data = await response.json();
        setUserDocument(data.user || null);
      }
    } catch (error) {
      console.error("Error initializing server session:", error);
    }
  }, []);

  // Écouter les changements d'authentification ET de token
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
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
      setUser(formattedUser);
      await initServerSession(firebaseUser);
      setLoading(false);
      setInitialized(true);
    });

    // Écouter le refresh du token
    const unsubscribeToken = onIdTokenChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) return;

      try {
        const token = await firebaseUser.getIdToken(true);
        await fetch("/api/auth/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
      } catch (error) {
        console.error("Error refreshing token:", error);
      }
    });

    return () => {
      unsubscribeAuth();
      unsubscribeToken();
    };
  }, [formatUser, initServerSession]);

  // Recharger l'utilisateur
  const reloadUser = async (): Promise<void> => {
    if (auth.currentUser) {
      try {
        await auth.currentUser.reload();
        const token = await auth.currentUser.getIdToken(true);

        await fetch("/api/auth/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        const response = await fetch("/api/auth/session");
        if (response.ok) {
          const data = await response.json();
          setUserDocument(data.user || null);
        }
      } catch (error) {
        console.error('Error reloading user:', error);
        throw new Error('Erreur lors du rechargement de l\'utilisateur');
      }
    }
  };

  // Méthodes d'authentification (à supprimer ou garder seulement signOut)
  const signOutUser = async (): Promise<void> => {
    try {
      await auth.signOut();
      setUser(null);
      setUserDocument(null);

      // Nettoyer la session côté serveur
      await fetch('/api/auth/session', { method: 'DELETE' });
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
  const isEditor = hasRole('editor');
  const isModerator = hasRole('moderator');
  const isFighterManager = hasRole('fighter_manager');

  return {
    user,
    userDocument,
    loading: loading || !initialized,
    signOut: signOutUser,
    reloadUser,
    hasRole,
    hasPermission,
    isAdmin,
    isEditor,
    isModerator,
    isFighterManager,
    canManageFighters: () => hasPermission('manage_fighters'),
    canManageCompetitions: () => hasPermission('manage_competitions'),
    canManageUsers: () => hasPermission('manage_users'),
  };
}