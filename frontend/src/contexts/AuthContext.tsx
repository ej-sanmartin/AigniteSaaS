'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import { User, AuthError } from '@/types/auth';
import api from '@/utils/api';
import toast from 'react-hot-toast';

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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<AuthError | null>(null);
  const [refreshTimeout, setRefreshTimeout] = useState<NodeJS.Timeout>();

  const clearError = () => setError(null);

  const handleError = (error: AuthError) => {
    let message = error.message;
    
    if (error.code === 'AUTH_INVALID_TOKEN') {
      message = 'Session expired. Please login again';
      logout();
    }

    setError({ message, code: error.code });
    toast.error(message);
  };

  const refreshToken = async () => {
    try {
      await api.post('/api/auth/refresh');
      // Schedule next refresh 5 minutes before token expires
      scheduleTokenRefresh();
    } catch (error) {
      handleError({
        message: 'Session expired',
        code: 'AUTH_INVALID_TOKEN'
      });
    }
  };

  const scheduleTokenRefresh = () => {
    // Clear any existing refresh timeout
    if (refreshTimeout) {
      clearTimeout(refreshTimeout);
    }

    // Schedule refresh 5 minutes before token expires (19 hours after last refresh)
    const timeout = setTimeout(refreshToken, 19 * 60 * 60 * 1000);
    setRefreshTimeout(timeout);
  };

  const checkAuth = async () => {
    try {
      setIsLoading(true);
      clearError();
      
      const response = await fetch('/api/auth/check', {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        scheduleTokenRefresh();
      } else {
        const error = await response.json();
        handleError(error);
        setUser(null);
      }
    } catch (error) {
      handleError({
        message: 'Failed to verify authentication',
        code: 'AUTH_CHECK_FAILED'
      });
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      clearError();
      const { data } = await api.post('/auth/login', { email, password });
      setUser(data.user);
      scheduleTokenRefresh();
      toast.success('Successfully logged in');
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
      
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Logout failed');
      }

      // Clear refresh timeout
      if (refreshTimeout) {
        clearTimeout(refreshTimeout);
      }

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

  // Initial auth check
  useEffect(() => {
    checkAuth();

    return () => {
      if (refreshTimeout) {
        clearTimeout(refreshTimeout);
      }
    };
  }, []);

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
      }}
    >
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