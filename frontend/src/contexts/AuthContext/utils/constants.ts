import { User, AuthError } from '@/types/auth';

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: AuthError | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<boolean>;
  clearError: () => void;
  scheduleTokenRefresh: () => void;
  clearRefreshTimeout: () => void;
  isCheckingAuth: boolean;
  setIsLoading: (loading: boolean) => void;
  setError: (error: AuthError | null) => void;
  setUser: (user: User | null) => void;
  setIsCheckingAuth: (checking: boolean) => void;
  setRefreshTimeout: (timeout: NodeJS.Timeout | undefined) => void;
}

// Paths that require authentication
export const protectedPaths = [
  '/dashboard',
  '/profile',
  '/settings',
];

// Debug mode to prevent redirects
export const DEBUG_MODE = true;

// Token refresh constants
export const MAX_RETRY_ATTEMPTS = 3;
export const INITIAL_RETRY_DELAY = 1000; // 1 second
export const TOKEN_REFRESH_INTERVAL = 23 * 60 * 60 * 1000; // 23 hours (tokens expire in 24 hours) 