'use client';

import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import api from '@/utils/api';
import { AuthContextType } from '../utils/constants';
import { AuthError } from '@/types/auth';

interface AuthCache {
  isAuthenticated: boolean;
  timestamp: number;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
let authCache: AuthCache | null = null;

export const useAuthState = (): AuthContextType => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState<AuthError | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(false);
  const refreshTimeout = useRef<NodeJS.Timeout | null>(null);
  const pathname = usePathname();

  const clearRefreshTimeout = () => {
    if (refreshTimeout.current) {
      clearTimeout(refreshTimeout.current);
      refreshTimeout.current = null;
    }
  };

  const scheduleTokenRefresh = () => {
    clearRefreshTimeout();
    // Schedule refresh 5 minutes before token expiry
    refreshTimeout.current = setTimeout(() => {
      checkAuth();
    }, 55 * 60 * 1000); // 55 minutes
  };

  const checkAuth = async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      setIsCheckingAuth(true);
      setError(null);

      // Check if we have a valid cached result
      if (authCache && Date.now() - authCache.timestamp < CACHE_DURATION) {
        setIsAuthenticated(authCache.isAuthenticated);
        setIsLoading(false);
        setIsCheckingAuth(false);
        return authCache.isAuthenticated;
      }

      // Check if we have a session cookie
      const hasSession = document.cookie.includes('session_id=');
      if (!hasSession) {
        setIsAuthenticated(false);
        setIsLoading(false);
        setIsCheckingAuth(false);
        return false;
      }

      // Check if we're on a public route
      const isPublicRoute = pathname === '/login' || pathname === '/register';
      if (isPublicRoute) {
        setIsAuthenticated(false);
        setIsLoading(false);
        setIsCheckingAuth(false);
        return false;
      }

      // Validate session with backend
      const response = await api.get('/auth/validate-session');
      const isValid = response.data.isValid;

      // Update cache
      authCache = {
        isAuthenticated: isValid,
        timestamp: Date.now()
      };

      setIsAuthenticated(isValid);
      if (isValid) {
        scheduleTokenRefresh();
      }
      return isValid;
    } catch (error) {
      console.error('[AUTH] Session validation error:', error);
      setError({ 
        message: 'Failed to validate session', 
        code: 'SESSION_ERROR' 
      });
      setIsAuthenticated(false);
      return false;
    } finally {
      setIsLoading(false);
      setIsCheckingAuth(false);
    }
  };

  useEffect(() => {
    checkAuth();
    return () => {
      clearRefreshTimeout();
    };
  }, [pathname]);

  return {
    isLoading,
    setIsLoading,
    isAuthenticated,
    error,
    setError,
    clearError: () => setError(null),
    isCheckingAuth,
    setIsCheckingAuth,
    clearRefreshTimeout,
    scheduleTokenRefresh,
    setRefreshTimeout: (timeout: NodeJS.Timeout | null) => {
      refreshTimeout.current = timeout;
    },
    login: async (email: string, password: string) => {
      try {
        const response = await api.post('/auth/login', { email, password });
        if (response.data.success) {
          setIsAuthenticated(true);
          // Clear cache to force revalidation
          authCache = null;
          scheduleTokenRefresh();
        }
        return response.data;
      } catch (error) {
        console.error('[AUTH] Login error:', error);
        throw error;
      }
    },
    logout: async () => {
      try {
        await api.post('/auth/logout');
        setIsAuthenticated(false);
        // Clear cache
        authCache = null;
        clearRefreshTimeout();
      } catch (error) {
        console.error('[AUTH] Logout error:', error);
        throw error;
      }
    },
    signup: async (email: string, password: string) => {
      try {
        const response = await api.post('/auth/register', { email, password });
        return response.data;
      } catch (error) {
        console.error('[AUTH] Signup error:', error);
        throw error;
      }
    },
    checkAuth
  };
}; 