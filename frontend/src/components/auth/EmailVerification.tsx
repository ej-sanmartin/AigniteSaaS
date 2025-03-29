'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import api from '@/utils/api';
import { toast } from 'react-hot-toast';

export function EmailVerification() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const router = useRouter();
  const [status, setStatus] = useState<'pending' | 'success' | 'error'>('pending');
  const [message, setMessage] = useState('Checking verification status...');

  useEffect(() => {
    if (token) {
      verifyEmail(token);
    }
  }, [token]);

  const verifyEmail = async (verificationToken: string) => {
    try {
      await api.post('/auth/verify-email', { token: verificationToken });
      setStatus('success');
      setMessage('Email verified successfully! Redirecting to dashboard...');
      toast.success('Email verified successfully!');
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    } catch (error) {
      setStatus('error');
      setMessage('Invalid or expired verification link. Please request a new one.');
      toast.error('Failed to verify email. Please try again.');
    }
  };

  const resendVerification = async () => {
    try {
      await api.post('/auth/resend-verification');
      setMessage('Verification email sent! Please check your inbox.');
      toast.success('Verification email sent!');
    } catch (error) {
      setMessage('Failed to send verification email. Please try again.');
      toast.error('Failed to send verification email. Please try again.');
    }
  };

  return (
    <>
      {!token && (
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            We've sent a verification link to your email address.
            Please check your inbox and click the link to verify your account.
          </p>
          <p className="text-gray-600 dark:text-gray-400">
            Didn't receive the email?
          </p>
          <button
            onClick={resendVerification}
            className="text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
          >
            Click here to resend
          </button>
        </div>
      )}

      {token && (
        <div className="space-y-4">
          <div className={`
            rounded-full h-16 w-16 flex items-center justify-center mx-auto
            ${status === 'pending' && 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400'}
            ${status === 'success' && 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'}
            ${status === 'error' && 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'}
          `}>
            {status === 'pending' && (
              <svg className="animate-spin h-8 w-8" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            )}
            {status === 'success' && (
              <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            )}
            {status === 'error' && (
              <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
          </div>
          <p className="text-gray-600 dark:text-gray-400">{message}</p>
        </div>
      )}

      {status === 'error' && (
        <div className="pt-4">
          <button
            onClick={resendVerification}
            className="text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
          >
            Request new verification link
          </button>
        </div>
      )}
    </>
  );
} 