'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/utils/api';
import toast from 'react-hot-toast';
import { useAuthState } from './useAuthState';
import { useAuthEffects } from './useAuthEffects';

export const useAuthActions = () => {
  const router = useRouter();
  const {
    setUser,
    setIsLoading,
    setError,
    clearError
  } = useAuthState();
  const { scheduleTokenRefresh, checkAuth } = useAuthEffects();

  const login = useCallback(async (email: string, password: string) => {
    try {
      setIsLoading(true);
      clearError();
      const { data } = await api.post('/auth/login', { email, password });
      
      setUser(data.user);
      scheduleTokenRefresh();
      await checkAuth();
      
      toast.success('Successfully logged in');
      router.push('/dashboard');
    } catch (error) {
      setError({ message: 'Login failed. Please check your credentials.', code: 'LOGIN_FAILED' });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [setUser, setIsLoading, setError, clearError, scheduleTokenRefresh, checkAuth, router]);

  const signup = useCallback(async (email: string, password: string, name: string) => {
    try {
      setIsLoading(true);
      clearError();
      const { data } = await api.post('/auth/signup', { email, password, name });
      setUser(data.user);
      scheduleTokenRefresh();
      toast.success('Successfully signed up');
    } catch (error) {
      setError({ message: 'Signup failed. Please try again.', code: 'SIGNUP_FAILED' });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [setUser, setIsLoading, setError, clearError, scheduleTokenRefresh]);

  const logout = useCallback(async () => {
    try {
      setIsLoading(true);
      clearError();
      
      await api.post('/auth/logout');
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      setUser(null);
      toast.success('Successfully logged out');
    } catch (error) {
      setError({ message: 'Failed to logout', code: 'LOGOUT_FAILED' });
    } finally {
      setIsLoading(false);
    }
  }, [setUser, setIsLoading, setError, clearError]);

  return {
    login,
    signup,
    logout
  };
}; 