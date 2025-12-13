// import { UserStats } from "@/app/(user)/profile/page";
import { User, UserGlobalStats } from ".";

export interface UserInterface {
  uid: string;
  email: string | null;
  displayName: string | null;
  emailVerified: boolean;
  phoneNumber: string | null;
  photoURL: string | null;
  userDocument?: UserDocument;
}

export interface UserDocument {
  id?: number;
  auth_id: string;
  fcm_token?: string;
  email: string;
  username: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  profile_picture?: string;
  role: 'admin' | 'editor' | 'user' | 'moderator' | 'fighter_manager';
  is_active: boolean;
  is_verified: boolean;
  last_login?: string;
  created_at: string;
  updated_at: string;
  bio?: string;
  permissions?: string[];
  
  // Nouvelles relations
  messages?: any[];
  interactions?: {
    likes?: any[];
    views?: any[];
    shares?: any[];
    bookmarks?: any[];
    follows?: any[];
  };
  notifications?: {
    all?: any[];
    unread?: any[];
    read?: any[];
    counts?: {
      total: number;
      unread: number;
      read: number;
    };
  };
}

export interface AuthResponse {
  success: boolean;
  user?: UserInterface;
  userDocument?: UserDocument;
  error?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  username: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  region_id?: number;
}

export interface ResetPasswordCredentials {
  email: string;
}

export interface ConfirmResetPasswordCredentials {
  oobCode: string;
  newPassword: string;
}

export interface UserStats {
  total_matches: number;
  total_wins: number;
  total_losses: number;
  total_comments: number;
  total_likes: number;
  total_shares: number;
  achievements_count: number;
}
// types/index.ts - Ajouter ces interfaces
export interface UserProfile extends User {
  stats?: UserStats;
  recent_activity?: ActivityItem[];
  achievements?: Achievement[];
}

export interface ActivityItem {
  id: number;
  type: 'comment' | 'like' | 'follow' | 'match' | 'achievement';
  title: string;
  description: string;
  timestamp: string;
  entity_id?: number;
  entity_type?: string;
}

export interface Achievement {
  id: number;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlocked_at?: string;
  progress?: number;
  total_required?: number;
}