'use client';

import { useState, useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import api from '@/utils/api';
import { AuthContextType } from '../utils/constants';
import { AuthError } from '@/types/auth';

// List of public routes that should not redirect
const publicRoutes = ['/', '/blog', '/pricing', '/about', '/contact'];

export const useAuthState = (): AuthContextType => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState<AuthError | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(false);
  const refreshTimeout = useRef<NodeJS.Timeout | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  const clearRefreshTimeout = () => {
    if (refreshTimeout.current) {
      clearTimeout(refreshTimeout.current);
      refreshTimeout.current = null;
    }
  };

  const scheduleTokenRefresh = () => {
    clearRefreshTimeout();
    refreshTimeout.current = setTimeout(() => {
      checkAuth(false);
    }, 55 * 60 * 1000); // 55 minutes
  };

  const checkAuth = async (shouldRedirect = false): Promise<boolean> => {
    try {
      setIsLoading(true);
      setIsCheckingAuth(true);
      setError(null);

      // Check if current route is public
      const isPublicRoute = publicRoutes.some(route => pathname?.startsWith(route));

      // Validate session with backend
      const response = await api.get('/auth/check');
      const { isValid, error: authError } = response.data;

      if (!isValid) {
        setIsAuthenticated(false);
        if (authError) {
          setError({ message: authError, code: 'SESSION_ERROR' });
        }
        // Only redirect on protected routes
        if (shouldRedirect && !isPublicRoute) {
          router.push('/login');
        }
        return false;
      }

      setIsAuthenticated(true);
      scheduleTokenRefresh();
      return true;
    } catch (err) {
      setIsAuthenticated(false);
      setError({ 
        message: 'Failed to validate session', 
        code: 'NETWORK_ERROR' 
      });
      return false;
    } finally {
      setIsLoading(false);
      setIsCheckingAuth(false);
    }
  };

  // Initial auth check - no redirects
  useEffect(() => {
    checkAuth(false);
    return () => {
      clearRefreshTimeout();
    };
  }, []);

  return {
    isLoading,
    isAuthenticated,
    error,
    isCheckingAuth,
    checkAuth,
    login: async (email: string, password: string) => {
      try {
        const response = await api.post('/auth/login', { email, password });
        if (response.data.success) {
          setIsAuthenticated(true);
          scheduleTokenRefresh();
        }
      } catch (err) {
        setError({ 
          message: 'Login failed', 
          code: 'LOGIN_ERROR' 
        });
        throw err;
      }
    },
    signup: async (email: string, password: string, firstName: string, lastName: string) => {
      try {
        await api.post('/auth/register', { email, password, firstName, lastName });
      } catch (err) {
        setError({ 
          message: 'Signup failed', 
          code: 'SIGNUP_ERROR' 
        });
        throw err;
      }
    },
    logout: async () => {
      try {
        await api.post('/auth/logout');
        setIsAuthenticated(false);
        clearRefreshTimeout();
      } catch (err) {
        setError({ 
          message: 'Logout failed', 
          code: 'LOGOUT_ERROR' 
        });
        throw err;
      }
    },
    clearError: () => setError(null),
    scheduleTokenRefresh,
    clearRefreshTimeout,
    setIsLoading,
    setError,
    setIsCheckingAuth,
    setRefreshTimeout: (timeout: NodeJS.Timeout | undefined) => {
      refreshTimeout.current = timeout || null;
    },
    setIsAuthenticated
  };
}; 