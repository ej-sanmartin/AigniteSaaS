'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useAuthState } from './useAuthState';
import api from '@/utils/api';
import { TOKEN_REFRESH_INTERVAL } from '../utils/constants';

export const useAuthEffects = () => {
  const {
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
        await api.post('/auth/refresh');
        
        // Schedule next refresh
        const nextTimeout = setTimeout(() => {
          isRefreshing.current = false;
          scheduleTokenRefresh();
        }, TOKEN_REFRESH_INTERVAL);
        
        setRefreshTimeout(nextTimeout);
      } catch (error) {
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

  // Handle token refresh
  useEffect(() => {
    // Check if we have a session cookie
    const hasSession = document.cookie.includes('session_id=');
    
    if (hasSession && !isSetupComplete.current && !isRefreshing.current) {
      isSetupComplete.current = true;
      // Start refresh immediately
      scheduleTokenRefresh();
    }

    // If no session, reset the setup flag
    if (!hasSession) {
      isSetupComplete.current = false;
      clearRefreshTimeout();
    }

    // Cleanup on unmount
    return () => {
      clearRefreshTimeout();
      isRefreshing.current = false;
    };
  }, [scheduleTokenRefresh, clearRefreshTimeout]);

  return {
    scheduleTokenRefresh,
    clearRefreshTimeout,
    setIsLoading,
    setError
  };
}; 