'use client';

import { LoginForm } from '@/components/auth/LoginForm';
import { OAuthButton } from '@/components/auth/OAuthButton';
import { useSearchParams } from 'next/navigation';

export default function LoginPage() {
  const searchParams = useSearchParams();
  const returnTo = searchParams.get('returnTo') || '/dashboard';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full space-y-6 p-8 bg-white dark:bg-gray-800 
                    rounded-lg shadow-lg dark:shadow-gray-900/30">
        <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white">
          Sign in to your account
        </h2>
        
        <div className="space-y-3">
          <OAuthButton provider="google" returnTo={returnTo} />
          <OAuthButton provider="linkedin" returnTo={returnTo} />
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white dark:bg-gray-800 text-gray-500">
              Or continue with
            </span>
          </div>
        </div>

        <LoginForm returnTo={returnTo} />
      </div>
    </div>
  );
} 