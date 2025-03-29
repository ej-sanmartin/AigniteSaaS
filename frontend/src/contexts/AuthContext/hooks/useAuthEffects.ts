'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useAuthState } from './useAuthState';
import api from '@/utils/api';
import { TOKEN_REFRESH_INTERVAL } from '../utils/constants';
import Cookies from 'js-cookie';

export const useAuthEffects = () => {
  const {
    user,
    setUser,
    setError,
    clearError,
    setRefreshTimeout,
    clearRefreshTimeout,
    setIsLoading
  } = useAuthState();

  const isRefreshing = useRef(false);
  const isSetupComplete = useRef(false);

  const scheduleTokenRefresh = useCallback(() => {
    if (isRefreshing.current) return;
    clearRefreshTimeout();

    const timeout = setTimeout(async () => {
      if (isRefreshing.current) return;
      isRefreshing.current = true;

      try {
        const { data } = await api.post('/auth/refresh');
        
        if (!data.token) {
          throw new Error('No token received from refresh endpoint');
        }
        
        // Update user data if needed
        if (data.user) {
          setUser(data.user);
          Cookies.set('user', JSON.stringify(data.user), {
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            expires: 1 // 1 day
          });
        }
        
        // Schedule next refresh
        const nextTimeout = setTimeout(() => {
          isRefreshing.current = false;
          scheduleTokenRefresh();
        }, TOKEN_REFRESH_INTERVAL);
        
        setRefreshTimeout(nextTimeout);
      } catch (error) {
        // Clear user state on refresh failure
        Cookies.remove('user');
        setUser(null);
        setError({ 
          message: 'Session expired. Please login again.', 
          code: 'SESSION_EXPIRED' 
        });
      } finally {
        isRefreshing.current = false;
      }
    }, TOKEN_REFRESH_INTERVAL);

    setRefreshTimeout(timeout);
  }, [clearRefreshTimeout, setRefreshTimeout, setUser, setError]);

  // Handle token refresh
  useEffect(() => {
    // Only set up refresh once when user becomes available
    // and if we haven't already set it up
    if (user && !isSetupComplete.current && !isRefreshing.current) {
      isSetupComplete.current = true;
      // Start refresh immediately
      scheduleTokenRefresh();
    }

    // If user is logged out, reset the setup flag
    if (!user) {
      isSetupComplete.current = false;
      clearRefreshTimeout();
    }

    // Cleanup on unmount
    return () => {
      clearRefreshTimeout();
      isRefreshing.current = false;
    };
  }, [user, scheduleTokenRefresh, clearRefreshTimeout]);

  return {
    scheduleTokenRefresh,
    clearRefreshTimeout,
    setIsLoading,
    setError,
    setUser
  };
}; 