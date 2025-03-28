'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export function AuthCallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser } = useAuth();

  useEffect(() => {
    const auth = searchParams.get('auth');
    const user = searchParams.get('user');
    const returnTo = searchParams.get('returnTo') || '/dashboard';

    if (auth === 'success' && user) {
      try {
        // Parse and set user data
        const userData = JSON.parse(decodeURIComponent(user));
        setUser(userData);
        
        // Redirect to the return URL
        router.push(returnTo);
      } catch (error) {
        console.error('Error handling auth callback:', error);
        router.push('/login?error=Failed to process authentication');
      }
    }
  }, [searchParams, router, setUser]);

  return null; // This component doesn't render anything
} 