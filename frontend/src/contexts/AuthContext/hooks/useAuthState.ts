'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/utils/api';
import { AuthContextType } from '../utils/constants';
import { AuthError } from '@/types/auth';
import { useUser } from '@/contexts/UserContext';

export const useAuthState = (): AuthContextType => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<AuthError | null>(null);
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();
  const { setUser } = useUser();

  const clearRefreshTimeout = useCallback(() => {
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
      refreshTimeoutRef.current = null;
    }
  }, []);

  const setRefreshTimeout = (timeout: NodeJS.Timeout | null) => {
    refreshTimeoutRef.current = timeout;
  };

  const checkAuth = async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      const response = await api.get('/auth/check');
      const isValid = response.status === 200;
      setIsAuthenticated(isValid);
      return isValid;
    } catch (err) {
      setIsAuthenticated(false);
      setError({ 
        message: 'Failed to validate session', 
        code: 'NETWORK_ERROR' 
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string, returnTo: string = '/dashboard'): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Use frontend API route instead of direct backend call
      const response = await fetch(`/api/auth/login?returnTo=${encodeURIComponent(returnTo)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include', // Important for cookies
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      // Verify the session is valid
      const isValid = await checkAuth();
      if (isValid) {
        setIsAuthenticated(true);
        scheduleTokenRefresh();
        // Redirect to the provided URL
        window.location.href = data.redirectTo;
        return;
      }

      throw new Error('Session validation failed');
    } catch (err) {
      setError({ 
        message: err instanceof Error ? err.message : 'Login failed', 
        code: 'LOGIN_ERROR' 
      });
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (email: string, password: string, firstName: string, lastName: string): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, firstName, lastName }),
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Signup failed');
      }

      // Verify the session is valid
      const isValid = await checkAuth();
      if (isValid) {
        setIsAuthenticated(true);
        scheduleTokenRefresh();
        // Redirect to the provided URL
        window.location.href = data.redirectTo;
        return;
      }

      throw new Error('Session validation failed');
    } catch (err) {
      setError({ 
        message: err instanceof Error ? err.message : 'Signup failed', 
        code: 'SIGNUP_ERROR' 
      });
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      await api.post('/auth/logout');
      clearRefreshTimeout();
      setIsAuthenticated(false);
      router.push('/');
    } catch (err) {
      setError({ 
        message: 'Failed to logout', 
        code: 'LOGOUT_FAILED' 
      });
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const scheduleTokenRefresh = () => {
    clearRefreshTimeout();
    const timeout = setTimeout(async () => {
      try {
        await api.post('/auth/refresh');
        scheduleTokenRefresh();
      } catch (error) {
        setIsAuthenticated(false);
        setError({ 
          message: 'Session expired. Please login again.', 
          code: 'SESSION_EXPIRED' 
        });
      }
    }, 55 * 60 * 1000); // 55 minutes
    setRefreshTimeout(timeout);
  };

  return {
    isAuthenticated,
    setIsAuthenticated,
    isLoading,
    setIsLoading,
    error,
    setError,
    clearError: () => setError(null),
    checkAuth,
    login,
    signup,
    logout,
    refreshTimeout: refreshTimeoutRef.current,
    setRefreshTimeout,
    clearRefreshTimeout,
    scheduleTokenRefresh
  };
}; 