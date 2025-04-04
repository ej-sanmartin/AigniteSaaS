'use client';

import { AuthCallbackHandler } from '@/components/auth/AuthCallbackHandler';
import { LoadingState } from '@/components/ui/LoadingState';

export default function AuthCallbackPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <LoadingState 
        message="Please wait while we process your login."
        fullPage={false}
        spinnerProps={{
          color: 'blue-600'
        }}
      />
      <AuthCallbackHandler />
    </div>
  );
} 