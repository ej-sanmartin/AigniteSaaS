/**
 * Common auth types shared between frontend and backend
 */

// User roles supported by the system
export type UserRole = 'user' | 'admin';

// OAuth providers supported by the system
export type OAuthProvider = 'google' | 'linkedin' | 'github';

// Subscription status types
export type SubscriptionStatus = 'active' | 'inactive' | 'canceled' | 'trial';

// Subscription plan interface
export interface Subscription {
  plan: string;
  status: SubscriptionStatus;
  expiresAt?: Date;
  startedAt?: Date;
}

// Safe user data (no sensitive information)
export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isVerified?: boolean;
  subscription?: Subscription;
  createdAt: Date;
  updatedAt?: Date;
}

// Auth response from backend after successful authentication
export interface AuthResponse {
  token: string;
  user: User;
}

// Error response from backend
export interface AuthError {
  message: string;
  code?: string;
}

/**
 * OAuth specific types
 */

// OAuth callback response from backend
export interface OAuthCallbackResponse {
  success: boolean;
  data?: AuthResponse;
  error?: AuthError;
}

// OAuth state for managing the flow
export interface OAuthState {
  isLoading: boolean;
  error?: AuthError;
} 