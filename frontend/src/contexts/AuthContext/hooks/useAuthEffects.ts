'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useAuthState } from './useAuthState';
import api from '@/utils/api';
import { TOKEN_REFRESH_INTERVAL } from '../utils/constants';

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

  const scheduleTokenRefresh = useCallback(() => {
    if (isRefreshing.current) return;
    clearRefreshTimeout();

    const timeout = setTimeout(async () => {
      if (isRefreshing.current) return;
      isRefreshing.current = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        console.log('Attempting to refresh token');
        const { data } = await api.post('/auth/refresh', { refreshToken });
        
        if (!data.token) {
          throw new Error('No token received from refresh endpoint');
        }

        console.log('Token refresh successful');
        localStorage.setItem('token', data.token);
        
        if (data.refreshToken) {
          localStorage.setItem('refreshToken', data.refreshToken);
        }
        
        api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
        
        // Schedule next refresh
        const nextTimeout = setTimeout(() => {
          isRefreshing.current = false;
          scheduleTokenRefresh();
        }, TOKEN_REFRESH_INTERVAL);
        
        setRefreshTimeout(nextTimeout);
      } catch (error) {
        console.error('Token refresh failed:', error);
        // Clear token and user state on refresh failure
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        delete api.defaults.headers.common['Authorization'];
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
    const token = localStorage.getItem('token');
    const refreshToken = localStorage.getItem('refreshToken');
    
    if (user && token && refreshToken) {
      console.log('Setting up token refresh');
      scheduleTokenRefresh();
    } else {
      console.log('No user or tokens found, skipping token refresh');
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