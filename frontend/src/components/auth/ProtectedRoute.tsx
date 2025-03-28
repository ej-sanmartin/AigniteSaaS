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
    // Only redirect if we're not loading and not authenticated
    if (!isLoading && !isAuthenticated) {
      router.replace(`/login?returnTo=${encodeURIComponent(pathname)}`);
    }
  }, [isLoading, isAuthenticated, router, pathname]);

  // Show loading state while initializing
  if (isLoading) {
    return <LoadingAuth />;
  }

  // Show error state if there's an error
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-600 max-w-2xl p-4">
          <h2 className="text-xl font-bold mb-2">Error</h2>
          <p className="mb-4">{error.message}</p>
        </div>
      </div>
    );
  }

  return children;
} 