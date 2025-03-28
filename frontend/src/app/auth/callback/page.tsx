'use client';

import { AuthCallbackHandler } from '@/components/auth/AuthCallbackHandler';

export default function AuthCallbackPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Completing authentication...
        </h2>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Please wait while we process your login.
        </p>
      </div>
      <AuthCallbackHandler />
    </div>
  );
} 