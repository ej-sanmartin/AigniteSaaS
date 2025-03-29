'use client';

import { SignupForm } from '@/components/auth/SignupForm';
import { OAuthButton } from '@/components/auth/OAuthButton';

export default function SignupPage() {
  return (
    <div className="flex-1 flex items-center justify-center pt-24 pb-16 sm:pt-32 sm:pb-24 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full space-y-8 p-8 bg-white dark:bg-gray-800 
                    rounded-lg shadow-lg dark:shadow-gray-900/30">
        <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white">
          Create your account
        </h2>

        <div className="space-y-3">
          <OAuthButton provider="google" />
          <OAuthButton provider="linkedin" />
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300 dark:border-gray-600" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
              Or continue with
            </span>
          </div>
        </div>

        <SignupForm />
      </div>
    </div>
  );
} 