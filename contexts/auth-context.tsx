"use client";
import { createContext, useContext, ReactNode } from "react";
import { UserDocument, UserInterface } from "@/types/user";
import { useAuth } from "@/hooks/use-auth";

interface AuthContextType {
  user: UserInterface | null;
  userDocument: UserDocument | null;
  loading: boolean;
  signOut: () => Promise<void>;
  reloadUser: () => Promise<void>;
  hasRole: (role: string) => boolean;
  hasPermission: (permission: string) => boolean;
  isAdmin: boolean;
  isEditor: boolean;
  isModerator: boolean;
  isFighterManager: boolean;
  canManageFighters: () => boolean;
  canManageCompetitions: () => boolean;
  canManageUsers: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useAuth();

  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};