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
  user_id: string;
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
  region_id?: number;
  city_id?: number;
  bio?: string;
  permissions?: string[];
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