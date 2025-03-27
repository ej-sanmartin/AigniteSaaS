'use client';

import { useAuth } from '@/contexts/AuthContext';
import { LoadingAuth } from './LoadingAuth';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isLoading, isAuthenticated, error, handleOAuthLogin } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const handleAuth = async () => {
      const params = new URLSearchParams(window.location.search);
      const token = params.get('token');
      const userStr = params.get('user');

      // If we have token and user data, handle OAuth login
      if (token && userStr) {
        try {
          await handleOAuthLogin();
          // Remove the token and user parameters from the URL
          const newUrl = new URL(window.location.href);
          newUrl.searchParams.delete('token');
          newUrl.searchParams.delete('user');
          window.history.replaceState({}, '', newUrl);
          return;
        } catch (error) {
          console.error('OAuth login failed:', error);
          router.replace('/login');
          return;
        }
      }

      // Only redirect if we're not loading and not authenticated
      if (!isLoading && !isAuthenticated) {
        // Don't redirect if we're already on the login page or if we have OAuth data
        if (pathname !== '/login' && !token && !userStr) {
          router.replace(`/login?returnTo=${encodeURIComponent(pathname)}`);
        }
      }
    };

    handleAuth();
  }, [isLoading, isAuthenticated, router, handleOAuthLogin, pathname]);

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