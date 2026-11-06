// hooks/use-auth.ts
"use client";
import { onAuthStateChanged } from 'firebase/auth';
import { useEffect, useState, useCallback } from 'react';
import { UserDocument, UserInterface } from '@/types/user';
import { auth } from '@/configs/firebase/config';

const APP_ID = process.env.NEXT_PRIVATE_APP_ID;

export function useAuth() {
  const [user, setUser] = useState<UserInterface | null>(null);
  const [userDocument, setUserDocument] = useState<UserDocument | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserData = useCallback(async (firebaseUser: any) => {
    try {
      const token = await firebaseUser.getIdToken();

      const headers: Record<string, string> = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'x-app-id': APP_ID!,
      };

      // First call /api/auth/sync to ensure user exists in DB and update last_login
      const syncResponse = await fetch('/api/auth/sync', {
        method: 'POST',
        headers
      });

      console.log('syncResponse status:', syncResponse.status);
      if (syncResponse.ok) {
        const syncResult = await syncResponse.json();
        if (syncResult.success && syncResult.data) {
          const dbDoc = syncResult.data.db;
          setUserDocument(dbDoc);
          setUser({
            uid: syncResult.data.firebase.uid,
            email: syncResult.data.firebase.email,
            displayName: firebaseUser.displayName,
            emailVerified: syncResult.data.firebase.emailVerified,
            phoneNumber: firebaseUser.phoneNumber,
            photoURL: firebaseUser.photoURL,
            userDocument: dbDoc,
          });
          return;
        }
      }

      // Fallback to /api/auth/me if sync fails
      const meResponse = await fetch('/api/auth/me', { headers });
      console.log('meResponse status:', meResponse.status);
      if (meResponse.ok) {
        const result = await meResponse.json();
        if (result.success && result.data) {
          const dbDoc = result.data.db;
          setUserDocument(dbDoc);
          setUser({
            uid: result.data.firebase.uid,
            email: result.data.firebase.email,
            displayName: firebaseUser.displayName,
            emailVerified: result.data.firebase.emailVerified,
            phoneNumber: firebaseUser.phoneNumber,
            photoURL: firebaseUser.photoURL,
            userDocument: dbDoc,
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
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'x-app-id': APP_ID!,
      };
      await fetch('/api/auth/sign-out', { method: 'POST', headers });
    } catch (error) {
      console.error('Error calling sign-out API:', error);
    }
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
