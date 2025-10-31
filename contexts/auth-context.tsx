"use client";
import { createContext, useContext, ReactNode } from "react";
import { UserDocument, UserInterface } from "@/types/user";
import { useAuth } from "@/hooks/use-auth";

interface AuthContextType {
  // Données utilisateur
  user: UserInterface | null;
  userDocument: UserDocument | null;
  loading: boolean;
  
  // Méthodes d'authentification
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, userData?: any) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  confirmPasswordReset: (oobCode: string, newPassword: string) => Promise<void>;
  verifyPasswordResetCode: (oobCode: string) => Promise<string>;
  reloadUser: () => Promise<void>;
  
  // Permissions et rôles
  hasRole: (role: string) => boolean;
  hasPermission: (permission: string) => boolean;
  canManageFighters: () => boolean;
  canManageCompetitions: () => boolean;
  canManageUsers: () => boolean;
  isAdmin: boolean;
  isEditor: boolean;
  isModerator: boolean;
  isFighterManager: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userDocument: null,
  loading: true,
  signIn: async () => {},
  signUp: async () => {},
  signInWithGoogle: async () => {},
  signOut: async () => {},
  resetPassword: async () => {},
  confirmPasswordReset: async () => {},
  verifyPasswordResetCode: async () => { return ''; },
  reloadUser: async () => {},
  hasRole: () => false,
  hasPermission: () => false,
  canManageFighters: () => false,
  canManageCompetitions: () => false,
  canManageUsers: () => false,
  isAdmin: false,
  isEditor: false,
  isModerator: false,
  isFighterManager: false,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useAuth();

  return (
    <AuthContext.Provider
      value={{
        user: auth.user,
        userDocument: auth.userDocument,
        loading: auth.loading,
        signIn: auth.signIn,
        signUp: auth.signUp,
        signInWithGoogle: auth.signInWithGoogle,
        signOut: auth.signOut,
        resetPassword: auth.resetPassword,
        confirmPasswordReset: auth.confirmPasswordReset,
        verifyPasswordResetCode: auth.verifyPasswordResetCode,
        reloadUser: auth.reloadUser,
        hasRole: auth.hasRole,
        hasPermission: auth.hasPermission,
        canManageFighters: auth.canManageFighters,
        canManageCompetitions: auth.canManageCompetitions,
        canManageUsers: auth.canManageUsers,
        isAdmin: auth.isAdmin,
        isEditor: auth.isEditor,
        isModerator: auth.isModerator,
        isFighterManager: auth.isFighterManager,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuthContext = () => useContext(AuthContext);