'use client';

import { AuthError } from '@/types/auth';

export const addDebugInfo = (message: string, data?: any): string => {
  return message;
};

export const handleAuthError = (error: any): AuthError => {
  if (error.response?.data?.error) {
    return {
      message: error.response.data.error,
      code: error.response.data.code || 'UNKNOWN_ERROR'
    };
  }
  
  return {
    message: error.message || 'An unexpected error occurred',
    code: 'UNKNOWN_ERROR'
  };
};