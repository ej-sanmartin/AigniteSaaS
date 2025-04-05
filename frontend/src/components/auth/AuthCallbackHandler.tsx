'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingState } from '@/components/ui/LoadingState';

interface AuthCallbackHandlerProps {
  onSuccess?: () => void;
  onError?: () => void;
}

export function AuthCallbackHandler({ onSuccess, onError }: AuthCallbackHandlerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { checkAuth, scheduleTokenRefresh } = useAuth();
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      console.log('AuthCallbackHandler: Starting auth initialization');
      
      try {
        setIsInitializing(true);
        const isValid = await checkAuth();
        console.log('AuthCallbackHandler: Auth check result:', isValid);
        
        if (isValid) {
          console.log('AuthCallbackHandler: Auth valid, scheduling refresh');
          scheduleTokenRefresh();
          // Small delay to ensure auth state propagates
          await new Promise(resolve => setTimeout(resolve, 500));
          console.log('AuthCallbackHandler: Auth initialization complete');
          onSuccess?.();
        } else {
          console.log('AuthCallbackHandler: Auth invalid, redirecting to login');
          onError?.();
          router.push('/login');
        }
      } catch (error) {
        console.error('AuthCallbackHandler: Auth check failed:', error);
        onError?.();
        router.push('/login');
      } finally {
        setIsInitializing(false);
      }
    };

    initializeAuth();
  }, [searchParams, router, checkAuth, scheduleTokenRefresh, onSuccess, onError]);

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingState 
          message="Completing authentication..."
          fullPage={false}
          spinnerProps={{
            color: 'blue-600'
          }}
        />
      </div>
    );
  }

  return null;
} 