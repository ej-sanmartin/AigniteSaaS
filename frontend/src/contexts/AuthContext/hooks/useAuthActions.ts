'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/utils/api';
import toast from 'react-hot-toast';
import { useAuthState } from './useAuthState';
import { useAuthEffects } from './useAuthEffects';
import Cookies from 'js-cookie';

export const useAuthActions = () => {
  const router = useRouter();
  const {
    setUser,
    setIsLoading,
    setError,
    clearError
  } = useAuthState();
  const { scheduleTokenRefresh, clearRefreshTimeout } = useAuthEffects();

  const login = useCallback(async (email: string, password: string, returnTo: string = '/dashboard') => {
    try {
      setIsLoading(true);
      clearError();
      const { data } = await api.post('/auth/login', { email, password });
      
      if (data.token) {
        Cookies.set('token', data.token, {
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          expires: 1 // 1 day
        });
      }
      
      if (data.refreshToken) {
        Cookies.set('refreshToken', data.refreshToken, {
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          expires: 7 // 7 days
        });
      }
      
      if (data.user) {
        Cookies.set('user', JSON.stringify(data.user), {
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          expires: 1 // 1 day
        });
      }
      
      setUser(data.user);
      scheduleTokenRefresh();
      
      toast.success('Successfully logged in');
      router.push(returnTo);
    } catch (error) {
      setError({ message: 'Login failed. Please check your credentials.', code: 'LOGIN_FAILED' });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [setUser, setIsLoading, setError, clearError, scheduleTokenRefresh, router]);

  const signup = useCallback(async (email: string, password: string, firstName: string, lastName: string) => {
    try {
      setIsLoading(true);
      clearError();
      const { data } = await api.post('/auth/signup', { email, password, firstName, lastName });
      
      if (data.token) {
        Cookies.set('token', data.token, {
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          expires: 1 // 1 day
        });
      }
      
      if (data.refreshToken) {
        Cookies.set('refreshToken', data.refreshToken, {
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          expires: 7 // 7 days
        });
      }
      
      if (data.user) {
        Cookies.set('user', JSON.stringify(data.user), {
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          expires: 1 // 1 day
        });
      }
      
      setUser(data.user);
      scheduleTokenRefresh();
      toast.success('Successfully signed up');
      router.push('/dashboard');
    } catch (error) {
      setError({ message: 'Signup failed. Please try again.', code: 'SIGNUP_FAILED' });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [setUser, setIsLoading, setError, clearError, scheduleTokenRefresh, router]);

  const logout = useCallback(async () => {
    try {
      setIsLoading(true);
      clearError();
      
      await api.post('/auth/logout');
      Cookies.remove('token');
      Cookies.remove('refreshToken');
      Cookies.remove('user');
      
      setUser(null);
      clearRefreshTimeout();
      
      toast.success('Successfully logged out');
      router.push('/');
    } catch (error) {
      setError({ message: 'Logout failed. Please try again.', code: 'LOGOUT_FAILED' });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [setUser, setIsLoading, setError, clearError, clearRefreshTimeout, router]);

  return {
    login,
    signup,
    logout
  };
}; 