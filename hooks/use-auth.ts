// hooks/use-auth.ts
"use client";
import { onAuthStateChanged } from 'firebase/auth';
import { useEffect, useState, useCallback } from 'react';
import { UserDocument, UserInterface } from '@/types/user';
import { auth } from '@/configs/firebase/config';
import { getAppCheckToken } from '@/lib/client/firebase-app-check';

export function useAuth() {
  const [user, setUser] = useState<UserInterface | null>(null);
  const [userDocument, setUserDocument] = useState<UserDocument | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserData = useCallback(async (firebaseUser: any) => {
    try {
      console.log('fetchUserData called with firebaseUser:', firebaseUser);
      const token = await firebaseUser.getIdToken();
      console.log('Got Firebase ID token:', token ? 'yes' : 'no');
      const appCheckToken = await getAppCheckToken();
      console.log('Got App Check token:', appCheckToken ? 'yes' : 'no');
      
      const headers: Record<string, string> = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'x-app-id': process.env.NEXT_PUBLIC_APP_ID || 'web-client',
      };
      if (appCheckToken) {
        headers['x-firebase-appcheck'] = appCheckToken;
      }
      
      console.log('Calling /api/auth/sync with headers:', Object.keys(headers));
      // First call /api/auth/sync to ensure user exists in DB and update last_login
      const syncResponse = await fetch('/api/auth/sync', {
        method: 'POST',
        headers
      });
      
      console.log('syncResponse status:', syncResponse.status);
      if (syncResponse.ok) {
        const syncResult = await syncResponse.json();
        console.log('syncResult:', syncResult);
        if (syncResult.success && syncResult.data) {
          setUserDocument(syncResult.data.db);
          setUser({
            uid: syncResult.data.firebase.uid,
            email: syncResult.data.firebase.email,
            displayName: firebaseUser.displayName,
            emailVerified: syncResult.data.firebase.emailVerified,
            phoneNumber: firebaseUser.phoneNumber,
            photoURL: firebaseUser.photoURL,
          });
          return;
        }
      }
      
      // Fallback to /api/auth/me if sync fails
      console.log('Calling /api/auth/me with headers:', Object.keys(headers));
      const response = await fetch('/api/auth/me', { headers });
      console.log('meResponse status:', response.status);
      if (response.ok) {
        const result = await response.json();
        console.log('meResult:', result);
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
      console.log('Using Firebase user only');
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
      const appCheckToken = await getAppCheckToken();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'x-app-id': process.env.NEXT_PUBLIC_APP_ID || 'web-client',
      };
      if (appCheckToken) {
        headers['x-firebase-appcheck'] = appCheckToken;
      }
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