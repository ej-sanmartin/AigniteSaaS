'use client';

import { SignupForm } from '@/components/auth/SignupForm';

export default function SignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full space-y-8 p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900/30">
        <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white">
          Create your account
        </h2>
        <SignupForm />
      </div>
    </div>
  );
} 