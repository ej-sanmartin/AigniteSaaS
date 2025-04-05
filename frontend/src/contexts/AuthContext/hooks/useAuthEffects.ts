'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useAuthState } from './useAuthState';
import api from '@/utils/api';
import { TOKEN_REFRESH_INTERVAL } from '../utils/constants';

export const useAuthEffects = () => {
  const {
    setError,
    setRefreshTimeout,
    clearRefreshTimeout,
    setIsLoading
  } = useAuthState();

  const isRefreshing = useRef(false);

  const scheduleTokenRefresh = useCallback(() => {
    console.log('AuthEffects: Scheduling token refresh');
    if (isRefreshing.current) return;
    clearRefreshTimeout();

    const timeout = setTimeout(async () => {
      if (isRefreshing.current) return;
      isRefreshing.current = true;

      try {
        await api.post('/auth/refresh');
        console.log('AuthEffects: Token refreshed successfully');
        
        // Schedule next refresh
        const nextTimeout = setTimeout(() => {
          isRefreshing.current = false;
          scheduleTokenRefresh();
        }, TOKEN_REFRESH_INTERVAL);
        
        setRefreshTimeout(nextTimeout);
      } catch (error) {
        console.error('AuthEffects: Token refresh failed:', error);
        setError({ 
          message: 'Session expired. Please login again.', 
          code: 'SESSION_EXPIRED' 
        });
      } finally {
        isRefreshing.current = false;
      }
    }, TOKEN_REFRESH_INTERVAL);

    setRefreshTimeout(timeout);
  }, [clearRefreshTimeout, setRefreshTimeout, setError]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log('AuthEffects: Cleaning up');
      clearRefreshTimeout();
      isRefreshing.current = false;
    };
  }, [clearRefreshTimeout]);

  return {
    scheduleTokenRefresh,
    clearRefreshTimeout,
    setIsLoading,
    setError
  };
}; 