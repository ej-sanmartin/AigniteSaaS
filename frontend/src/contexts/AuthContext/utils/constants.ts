import { User, AuthError } from '@/types/auth';

export interface AuthContextType {
  isAuthenticated: boolean;
  setIsAuthenticated: (value: boolean) => void;
  isLoading: boolean;
  setIsLoading: (value: boolean) => void;
  error: { message: string; code?: string } | null;
  setError: (error: { message: string; code?: string } | null) => void;
  clearError: () => void;
  checkAuth: () => Promise<boolean>;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, firstName: string, lastName: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshTimeout: NodeJS.Timeout | null;
  setRefreshTimeout: (timeout: NodeJS.Timeout | null) => void;
  clearRefreshTimeout: () => void;
  scheduleTokenRefresh: () => void;
}

// Paths that require authentication
export const protectedPaths = [
  '/dashboard',
  '/profile',
  '/settings',
];

// Token refresh constants
export const MAX_RETRY_ATTEMPTS = 3;
export const INITIAL_RETRY_DELAY = 1000; // 1 second
export const TOKEN_REFRESH_INTERVAL = 23 * 60 * 60 * 1000; // 23 hours (tokens expire in 24 hours) 