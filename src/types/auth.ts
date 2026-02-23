// Shared types for authentication
// Can be reused in React Native mobile app

export interface User {
  id: string;
  email: string;
  emailConfirmed: boolean;
  createdAt: string;
}

export interface Profile {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  displayName: string;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordUpdate {
  password: string;
  confirmPassword: string;
}