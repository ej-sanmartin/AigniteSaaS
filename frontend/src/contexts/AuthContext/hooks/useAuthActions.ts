'use client';

import { useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import api from '@/utils/api';
import toast from 'react-hot-toast';
import { useAuthState } from './useAuthState';
import { useAuthEffects } from './useAuthEffects';

export const useAuthActions = () => {
  const router = useRouter();
  const pathname = usePathname();
  const {
    setIsLoading,
    setError,
    clearError,
    setIsAuthenticated
  } = useAuthState();
  const { scheduleTokenRefresh, clearRefreshTimeout } = useAuthEffects();

  const login = useCallback(async (email: string, password: string, returnTo: string = '/dashboard') => {
    try {
      setIsLoading(true);
      clearError();
      await api.post('/auth/login', { email, password });
      
      // Validate session after login
      const { data } = await api.get('/auth/check');
      if (data.isValid) {
        setIsAuthenticated(true);
        scheduleTokenRefresh();
        toast.success('Successfully logged in');
        router.push(returnTo);
      }
    } catch (error) {
      setError({ message: 'Login failed. Please check your credentials.', code: 'LOGIN_FAILED' });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [setIsLoading, setError, clearError, scheduleTokenRefresh, router, setIsAuthenticated]);

  const signup = useCallback(async (email: string, password: string, firstName: string, lastName: string) => {
    try {
      setIsLoading(true);
      clearError();
      await api.post('/auth/signup', { email, password, firstName, lastName });
      toast.success('Account created successfully');
    } catch (error) {
      setError({ message: 'Signup failed. Please try again.', code: 'SIGNUP_FAILED' });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [setIsLoading, setError, clearError]);

  const logout = useCallback(async () => {
    try {
      setIsLoading(true);
      clearError();
      await api.post('/auth/logout');
      
      // Clear all auth-related cookies
      document.cookie.split(';').forEach(cookie => {
        const [name] = cookie.split('=');
        document.cookie = `${name.trim()}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
      });
      
      setIsAuthenticated(false);
      clearRefreshTimeout();
      toast.success('Successfully logged out');
      router.push('/');
    } catch (error) {
      setError({ message: 'Logout failed. Please try again.', code: 'LOGOUT_FAILED' });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [setIsLoading, setError, clearError, clearRefreshTimeout, router, setIsAuthenticated]);

  return {
    login,
    signup,
    logout
  };
}; 