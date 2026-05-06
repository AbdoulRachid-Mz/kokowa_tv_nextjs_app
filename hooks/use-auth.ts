// hooks/use-auth.ts
"use client";
import { onAuthStateChanged } from 'firebase/auth';
import { useEffect, useState, useCallback } from 'react';
import { UserDocument, UserInterface } from '@/types/user';
import { auth } from '@/configs/firebase/config';

export function useAuth() {
  const [user, setUser] = useState<UserInterface | null>(null);
  const [userDocument, setUserDocument] = useState<UserDocument | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserData = useCallback(async (firebaseUser: any) => {
    try {
      const token = await firebaseUser.getIdToken();
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setUserDocument(result.data.db);
          setUser({
            uid: result.data.firebase.uid,
            email: result.data.firebase.email,
            displayName: firebaseUser.displayName,
            emailVerified: result.data.firebase.emailVerified,
            phoneNumber: firebaseUser.phoneNumber,
            photoURL: firebaseUser.photoURL,
          });
          return;
        }
      }
      // Fallback : utilisateur Firebase uniquement
      setUser({
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        emailVerified: firebaseUser.emailVerified,
        phoneNumber: firebaseUser.phoneNumber,
        photoURL: firebaseUser.photoURL,
      });
      setUserDocument(null);
    } catch (error) {
      console.error('Error fetching user data:', error);
      setUserDocument(null);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        setUserDocument(null);
        setLoading(false);
        return;
      }
      setLoading(true);
      await fetchUserData(firebaseUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [fetchUserData]);

  const signOut = async () => {
    await fetch('/api/auth/sign-out', { method: 'POST' });
    await auth.signOut();
    setUser(null);
    setUserDocument(null);
  };

  const reloadUser = async () => {
    if (auth.currentUser) {
      await fetchUserData(auth.currentUser);
    }
  };

  const hasRole = (role: string) => userDocument?.role === role;
  const isAdmin = hasRole('admin');
  const isEditor = hasRole('editor');
  const isModerator = hasRole('moderator');
  const isFighterManager = hasRole('fighter_manager');

  return {
    user,
    userDocument,
    loading,
    signOut,
    reloadUser,
    hasRole,
    hasPermission: () => false,
    isAdmin,
    isEditor,
    isModerator,
    isFighterManager,
    canManageFighters: () => isAdmin || isFighterManager,
    canManageCompetitions: () => isAdmin || isEditor,
    canManageUsers: () => isAdmin,
  };
}