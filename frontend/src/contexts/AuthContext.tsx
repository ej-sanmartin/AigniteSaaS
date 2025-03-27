'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from 'react';
import { User, AuthError } from '@/types/auth';
import api from '@/utils/api';
import toast from 'react-hot-toast';
import { useIsomorphicLayoutEffect } from '../hooks/useIsomorphicLayoutEffect';
import { useRouter, usePathname } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: AuthError | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  clearError: () => void;
  handleOAuthLogin: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const MAX_RETRY_ATTEMPTS = 3;
const INITIAL_RETRY_DELAY = 1000; // 1 second

// Paths that require authentication
const protectedPaths = [
  '/dashboard',
  '/profile',
  '/settings',
];

// Debug mode to prevent redirects
const DEBUG_MODE = true;

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<AuthError | null>(null);
  const [refreshTimeout, setRefreshTimeout] = useState<NodeJS.Timeout>();
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const [isCheckingAuth, setIsCheckingAuth] = useState(false);

  const addDebugInfo = (message: string) => {
    console.log(`AuthContext: ${message}`);
    setDebugInfo(prev => [...prev, `${new Date().toISOString()} - ${message}`]);
  };

  const clearError = () => setError(null);

  const handleError = (error: AuthError) => {
    let message = error.message;
    
    addDebugInfo(`Handling error: ${message}`);
    addDebugInfo(`Error code: ${error.code}`);
    addDebugInfo(`Has token param: ${window.location.search.includes('token')}`);
    
    if (error.code === 'AUTH_INVALID_TOKEN' || error.code === 'AUTH_CHECK_FAILED') {
      message = 'Session expired. Please login again';
      // Clear refresh timeout
      if (refreshTimeout) {
        clearTimeout(refreshTimeout);
        addDebugInfo('Cleared refresh timeout');
      }
      // Clear user state
      setUser(null);
      addDebugInfo('Cleared user state');
      
      // Only redirect to login if we're not in the middle of OAuth login
      // and we're not already on the login page
      if (!window.location.search.includes('token') && !pathname.startsWith('/login')) {
        addDebugInfo('Redirecting to login (not OAuth)');
        if (!DEBUG_MODE) {
          router.push('/login');
        }
      } else {
        addDebugInfo('Skipping redirect (OAuth login in progress or already on login page)');
      }
    }

    setError({ message, code: error.code });
    toast.error(message);
  };

  const refreshToken = async (retryAttempt = 0): Promise<boolean> => {
    try {
      addDebugInfo(`Attempting token refresh (attempt ${retryAttempt + 1})`);
      await api.post('/auth/refresh');
      addDebugInfo('Token refresh successful');
      // Success - schedule next refresh
      scheduleTokenRefresh();
      return true;
    } catch (error) {
      addDebugInfo(`Token refresh failed: ${error}`);
      // If we haven't exceeded max retries, try again with exponential backoff
      if (retryAttempt < MAX_RETRY_ATTEMPTS) {
        const delay = INITIAL_RETRY_DELAY * Math.pow(2, retryAttempt);
        addDebugInfo(`Retrying in ${delay}ms`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return refreshToken(retryAttempt + 1);
      }

      // Max retries exceeded - handle failure
      addDebugInfo('Max retries exceeded, handling failure');
      handleError({
        message: 'Session expired after multiple refresh attempts',
        code: 'AUTH_INVALID_TOKEN'
      });
      return false;
    }
  };

  const scheduleTokenRefresh = () => {
    addDebugInfo('Scheduling token refresh');
    // Clear any existing refresh timeout
    if (refreshTimeout) {
      clearTimeout(refreshTimeout);
      addDebugInfo('Cleared existing refresh timeout');
    }

    // Check if we have a token before scheduling refresh
    const token = localStorage.getItem('token');
    if (!token) {
      addDebugInfo('No token found, skipping refresh schedule');
      return;
    }

    // Schedule refresh 5 minutes before token expires
    const timeout = setTimeout(() => {
      addDebugInfo('Token refresh timeout triggered');
      refreshToken()
        .catch(() => {
          addDebugInfo('Token refresh failed after all retry attempts');
        });
    }, 19 * 60 * 60 * 1000); // 19 hours

    setRefreshTimeout(timeout);
    addDebugInfo('New token refresh scheduled');
  };

  const checkAuth = useCallback(async () => {
    // Prevent multiple simultaneous auth checks
    if (isCheckingAuth) {
      addDebugInfo('Auth check already in progress, skipping');
      return;
    }

    try {
      console.log('AuthContext: Starting auth check');
      setIsCheckingAuth(true);
      setIsLoading(true);
      clearError();
      
      // Check if we have a token before making the request
      const token = localStorage.getItem('token');
      console.log('AuthContext: Token from localStorage:', token ? token.substring(0, 20) + '...' : 'none');
      
      if (!token) {
        addDebugInfo('No token found during auth check');
        throw new Error('No authentication token found');
      }
      
      addDebugInfo(`Making auth check request with token: ${token.substring(0, 10)}...`);
      const { data } = await api.get('/auth/check');
      console.log('AuthContext: Auth check successful');
      
      // Only update user state if we have valid data
      if (data.user) {
        setUser(data.user);
        // Only schedule refresh if we have a valid token and user
        scheduleTokenRefresh();
      } else {
        throw new Error('No user data received from auth check');
      }
    } catch (error) {
      console.error('AuthContext: Auth check failed:', error);
      handleError({
        message: 'Failed to verify authentication',
        code: 'AUTH_CHECK_FAILED'
      });
      setUser(null);
    } finally {
      setIsLoading(false);
      setIsCheckingAuth(false);
    }
  }, [isCheckingAuth, addDebugInfo, handleError, scheduleTokenRefresh]);

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      clearError();
      const { data } = await api.post('/auth/login', { email, password });
      
      // Set user state
      setUser(data.user);
      
      // Schedule token refresh
      scheduleTokenRefresh();
      
      // Verify auth state before redirecting
      await checkAuth();
      
      toast.success('Successfully logged in');
      router.push('/dashboard');
    } catch (error) {
      handleError({
        message: 'Login failed. Please check your credentials.',
        code: 'LOGIN_FAILED'
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (email: string, password: string, name: string) => {
    try {
      setIsLoading(true);
      clearError();
      const { data } = await api.post('/auth/signup', { email, password, name });
      setUser(data.user);
      scheduleTokenRefresh();
      toast.success('Successfully signed up');
    } catch (error) {
      handleError({
        message: 'Signup failed. Please try again.',
        code: 'SIGNUP_FAILED'
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      clearError();
      
      await api.post('/auth/logout');

      // Clear refresh timeout
      if (refreshTimeout) {
        clearTimeout(refreshTimeout);
      }

      // Clear token from localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');

      setUser(null);
      toast.success('Successfully logged out');
    } catch (error) {
      handleError({
        message: 'Failed to logout',
        code: 'LOGOUT_FAILED'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthLogin = async () => {
    try {
      setIsCheckingAuth(true);
      console.log('AuthContext: Starting OAuth login handling');
      const params = new URLSearchParams(window.location.search);
      const token = params.get('token');
      const userStr = params.get('user');

      if (!token || !userStr) {
        throw new Error('Incomplete authentication data received');
      }

      console.log('AuthContext: Received OAuth data:', {
        hasToken: !!token,
        tokenPreview: token.substring(0, 20) + '...',
        hasUserStr: !!userStr
      });

      // Parse user data
      const user = JSON.parse(userStr);
      console.log('AuthContext: Parsed user data:', {
        id: user.id,
        email: user.email
      });

      // Store token in localStorage
      localStorage.setItem('token', token);
      console.log('AuthContext: Token stored in localStorage');

      // Set up Authorization header for subsequent requests
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      console.log('AuthContext: Authorization header set');

      // Set user state immediately
      setUser(user);
      console.log('AuthContext: User state updated');

      // Remove params from URL without reloading
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('token');
      newUrl.searchParams.delete('user');
      window.history.replaceState({}, '', newUrl);
      console.log('AuthContext: URL parameters cleaned up');

      // Schedule token refresh since we have a valid token
      scheduleTokenRefresh();
      console.log('AuthContext: Token refresh scheduled');

      // If we're not already on the dashboard, redirect there
      if (!pathname.startsWith('/dashboard')) {
        console.log('AuthContext: Redirecting to dashboard');
        router.push('/dashboard');
      }

      // Verify the token is working by making a test request
      try {
        await api.get('/auth/check');
        console.log('AuthContext: Token verification successful');
      } catch (error) {
        console.error('AuthContext: Token verification failed:', error);
        throw error;
      }

    } catch (error) {
      console.error('AuthContext: OAuth login failed:', error);
      // Clear token and user state on error
      localStorage.removeItem('token');
      api.defaults.headers.common['Authorization'] = '';
      setUser(null);
      handleError({
        message: 'Failed to complete OAuth login',
        code: 'OAUTH_LOGIN_FAILED'
      });
      router.push('/login');
    } finally {
      setIsCheckingAuth(false);
    }
  };

  // Initial auth check - only on protected routes
  useIsomorphicLayoutEffect(() => {
    const isProtectedRoute = protectedPaths.some(path => pathname.startsWith(path));
    
    if (isProtectedRoute && !isCheckingAuth) {
      const params = new URLSearchParams(window.location.search);
      const token = params.get('token');
      const userStr = params.get('user');

      // If we have OAuth data, ONLY handle OAuth login
      if (token && userStr) {
        handleOAuthLogin();
        return; // Exit early, don't do anything else
      } 
      
      // Only check auth if we don't have a user and aren't in OAuth flow
      if (!user && !window.location.search.includes('token')) {
        checkAuth();
      } else {
        setIsLoading(false);
      }
    } else if (!isProtectedRoute) {
      setIsLoading(false);
    }

    return () => {
      if (refreshTimeout) {
        clearTimeout(refreshTimeout);
      }
    };
  }, [pathname, isCheckingAuth, handleOAuthLogin, checkAuth, user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        error,
        login,
        signup,
        logout,
        checkAuth,
        clearError,
        handleOAuthLogin,
      }}
    >
      {DEBUG_MODE && (
        <div className="fixed bottom-0 left-0 p-4 bg-black bg-opacity-75 text-white text-xs max-w-md max-h-48 overflow-auto">
          <h3 className="font-bold mb-2">AuthContext Debug Info:</h3>
          <pre>
            {debugInfo.join('\n')}
          </pre>
        </div>
      )}
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 