'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/utils/api';
import { AuthError } from '@/types/auth';
import { User } from '@/types/auth';
import Cookies from 'js-cookie';

export const useAuthState = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<AuthError | null>(null);
  const [refreshTimeout, setRefreshTimeout] = useState<NodeJS.Timeout | null>(null);
  const isInitialized = useRef(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const clearRefreshTimeout = useCallback(() => {
    if (refreshTimeout) {
      clearTimeout(refreshTimeout);
      setRefreshTimeout(null);
    }
  }, [refreshTimeout]);

  const initializeAuth = useCallback(async () => {
    if (isInitialized.current) return;
    isInitialized.current = true;

    try {
      setIsLoading(true);
      setError(null);

      // Check for stored tokens and user data
      const storedToken = localStorage.getItem('token');
      const storedRefreshToken = localStorage.getItem('refreshToken');
      const storedUser = localStorage.getItem('user');
      
      if (storedToken && storedRefreshToken && storedUser) {
        console.log('Found stored tokens and user data');
        api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
        
        try {
          // Parse stored user data
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);

          // Verify token is still valid
          const { data } = await api.get('/auth/check');
          if (!data.user) {
            throw new Error('No user data in response');
          }
        } catch (error) {
          console.error('Failed to get user data:', error);
          // If we can't get user data, clear everything and force re-login
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          delete api.defaults.headers.common['Authorization'];
          setUser(null);
          setError({ 
            message: 'Session expired. Please login again.', 
            code: 'SESSION_EXPIRED' 
          });
        }
      } else {
        console.log('No stored tokens found');
        setUser(null);
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      setError({ 
        message: 'Failed to initialize authentication', 
        code: 'INIT_ERROR' 
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initialize auth state
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

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