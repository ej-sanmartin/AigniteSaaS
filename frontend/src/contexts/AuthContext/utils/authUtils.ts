'use client';

import { AuthError } from '@/types/auth';

export const handleAuthError = (error: any): AuthError => {
  // Handle rate limit errors
  if (error.response?.status === 429) {
    return {
      message: 'Too many attempts. Please try again later.',
      code: error.response.data.code || 'RATE_LIMIT_EXCEEDED'
    };
  }

  // Handle authentication errors
  if (error.response?.status === 401) {
    return {
      message: 'Invalid credentials',
      code: error.response.data.code || 'INVALID_CREDENTIALS'
    };
  }

  // Handle validation errors
  if (error.response?.status === 400) {
    return {
      message: error.response.data.message || 'Invalid input',
      code: error.response.data.code || 'VALIDATION_ERROR'
    };
  }

  // Handle server errors
  if (error.response?.status >= 500) {
    return {
      message: 'Server error. Please try again later.',
      code: error.response.data.code || 'SERVER_ERROR'
    };
  }

  // Handle network errors
  if (!error.response) {
    return {
      message: 'Network error. Please check your connection.',
      code: 'NETWORK_ERROR'
    };
  }

  // Handle other errors
  return {
    message: error.response.data.message || 'An unexpected error occurred',
    code: error.response.data.code || 'UNKNOWN_ERROR'
  };
};