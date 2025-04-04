'use client';

import { useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import api from '@/utils/api';
import toast from 'react-hot-toast';
import { useAuthState } from './useAuthState';
import { useAuthEffects } from './useAuthEffects';

// In-memory cache for auth status
let authCache: {
  user: any | null;
  timestamp: number;
} | null = null;

export const useAuthActions = () => {
  const router = useRouter();
  const pathname = usePathname();
  const {
    setIsLoading,
    setError,
    clearError
  } = useAuthState();
  const { scheduleTokenRefresh, clearRefreshTimeout } = useAuthEffects();

  const login = useCallback(async (email: string, password: string, returnTo: string = '/dashboard') => {
    try {
      setIsLoading(true);
      clearError();
      await api.post('/auth/login', { email, password });
      
      // Fetch user data after successful login
      const { data } = await api.get('/auth/check');
      scheduleTokenRefresh();
      
      toast.success('Successfully logged in');
      router.push(returnTo);
    } catch (error) {
      setError({ message: 'Login failed. Please check your credentials.', code: 'LOGIN_FAILED' });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [setIsLoading, setError, clearError, scheduleTokenRefresh, router]);

  const signup = useCallback(async (email: string, password: string, firstName: string, lastName: string) => {
    try {
      setIsLoading(true);
      clearError();
      await api.post('/auth/signup', { email, password, firstName, lastName });
      
      // Fetch user data after successful signup
      const { data } = await api.get('/auth/check');
      scheduleTokenRefresh();
      
      toast.success('Successfully signed up');
      router.push('/dashboard');
    } catch (error) {
      setError({ message: 'Signup failed. Please try again.', code: 'SIGNUP_FAILED' });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [setIsLoading, setError, clearError, scheduleTokenRefresh, router]);

  const logout = useCallback(async () => {
    try {
      setIsLoading(true);
      clearError();
      
      // Wait for backend response
      await api.post('/auth/logout');
      
      // Clear all state
      clearRefreshTimeout();
      
      // Clear any cached data
      authCache = null;
      
      // Clear session-related cookies only
      ['session_id', 'token', 'refreshToken', 'csrf_token'].forEach(cookieName => {
        document.cookie = `${cookieName}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
      });
      
      toast.success('Successfully logged out');
      
      // Redirect after state is cleared
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
      setError({ 
        message: 'Logout failed. Please try again.', 
        code: 'LOGOUT_FAILED' 
      });
      toast.error('Failed to logout. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [setIsLoading, setError, clearError, clearRefreshTimeout]);

  return {
    login,
    signup,
    logout
  };
}; 