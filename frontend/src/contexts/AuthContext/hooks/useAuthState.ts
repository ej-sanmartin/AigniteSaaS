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

      // We only need to check for user cookie, since auth_token and refresh_token are httpOnly
      const userCookie = Cookies.get('user');
      const authToken = Cookies.get('auth_token');
      const refreshToken = Cookies.get('refresh_token');
      
      // If user cookie is missing but refresh token is present, try to refresh the session
      if ((!userCookie || !authToken) && refreshToken) {
        try {
          // Use the refresh endpoint to get a fresh set of tokens and user data
          const response = await fetch('/api/auth/refresh', {
            method: 'POST',
            credentials: 'include', // Important for cookies
          });
          
          if (response.ok) {
            const data = await response.json();
            
            if (data.user) {
              // If we have a new auth token from the response, set it as a cookie
              if (data.token && !Cookies.get('auth_token')) {
                Cookies.set('auth_token', data.token, {
                  secure: process.env.NODE_ENV === 'production',
                  sameSite: 'lax',
                  path: '/'
                });
              }
              
              // Update user state from response
              setUser(data.user);
              return; // Early return since we've handled auth
            }
          }
        } catch (refreshError) {
          // Handle refresh error silently
        }
      }
      
      if (userCookie) {
        try {
          // Parse stored user data
          let parsedUser;
          try {
            // First try parsing directly
            parsedUser = JSON.parse(userCookie);
          } catch (e) {
            // If that fails, try decoding URI component first
            parsedUser = JSON.parse(decodeURIComponent(userCookie));
          }
          
          setUser(parsedUser);

          // If we're on the login page and have valid auth, redirect to dashboard
          const currentPath = window.location.pathname;
          if (currentPath === '/login' || currentPath === '/signup') {
            router.push('/dashboard');
          }
        } catch (error) {
          // If we can't parse user data, clear everything and force re-login
          Cookies.remove('user');
          setUser(null);
          setError({ 
            message: 'Session expired. Please login again.', 
            code: 'SESSION_EXPIRED' 
          });
        }
      } else {
        setUser(null);
      }
    } catch (error) {
      setError({ 
        message: 'Failed to initialize authentication', 
        code: 'INIT_ERROR' 
      });
    } finally {
      setIsLoading(false);
    }
  }, [router]);

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