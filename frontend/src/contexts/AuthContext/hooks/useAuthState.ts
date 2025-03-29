'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { AuthError } from '@/types/auth';
import { User } from '@/types/auth';
import Cookies from 'js-cookie';

export const useAuthState = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<AuthError | null>(null);
  const [refreshTimeout, setRefreshTimeout] = useState<NodeJS.Timeout | null>(null);
  const isInitialized = useRef(false);
  const searchParams = useSearchParams();

  const clearRefreshTimeout = useCallback(() => {
    if (refreshTimeout) {
      clearTimeout(refreshTimeout);
      setRefreshTimeout(null);
    }
  }, [refreshTimeout]);

  const initializeAuth = useCallback(async () => {
    // Reset initialization flag when URL changes
    isInitialized.current = false;

    try {
      setIsLoading(true);
      setError(null);

      // Get user data from cookie
      const userCookie = Cookies.get('user');
      
      if (userCookie) {
        try {
          const parsedUser = JSON.parse(userCookie);
          setUser(parsedUser);
        } catch (error) {
          console.error('[Auth] Failed to parse user cookie:', error);
          Cookies.remove('user');
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('[Auth] Init error:', error);
      setError({ 
        message: 'Failed to initialize authentication', 
        code: 'INIT_ERROR' 
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initialize auth state on mount and when URL changes
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth, searchParams]);

  return {
    user,
    setUser,
    isLoading,
    setIsLoading,
    error,
    setError,
    clearError: () => setError(null),
    refreshTimeout,
    setRefreshTimeout,
    clearRefreshTimeout
  };
}; 