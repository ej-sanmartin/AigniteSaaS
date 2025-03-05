import { getCookie, setCookie, deleteCookie } from 'cookies-next';
import { User } from '@/types/auth';

export const setAuthToken = (token: string) => {
  setCookie('auth-token', token, {
    maxAge: 30 * 24 * 60 * 60, // 30 days
    path: '/',
    secure: process.env.NODE_ENV === 'production',
  });
};

export const removeAuthToken = () => {
  deleteCookie('auth-token');
}; 