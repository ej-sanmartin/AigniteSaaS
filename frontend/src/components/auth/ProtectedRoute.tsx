'use client';

import { useAuth } from '@/contexts/AuthContext';
import { LoadingAuth } from './LoadingAuth';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isLoading, isAuthenticated, error } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Only handle redirects if we're not loading and not authenticated
    if (!isLoading && !isAuthenticated) {
      const params = new URLSearchParams(window.location.search);
      const token = params.get('token');
      const userStr = params.get('user');

      // Don't redirect if we're already on the login page or if we have OAuth data
      if (pathname !== '/login' && !token && !userStr) {
        router.replace(`/login?returnTo=${encodeURIComponent(pathname)}`);
      }
    }
  }, [isLoading, isAuthenticated, router, pathname]);

  if (isLoading) {
    return <LoadingAuth />;
  }

  // Don't redirect on error if we have OAuth data
  if (error && !window.location.search.includes('token')) {
    router.replace('/login');
    return null;
  }

  return children;
} 