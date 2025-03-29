'use client';

import { useAuth } from '@/contexts/AuthContext';
import { LoadingAuth } from './LoadingAuth';
import { useRouter, usePathname } from 'next/navigation';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isLoading, isAuthenticated, error } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Show loading state while initializing
  if (isLoading) {
    return <LoadingAuth />;
  }

  // Only redirect if we're sure the user isn't authenticated
  if (!isLoading && !isAuthenticated) {
    router.replace(`/login?returnTo=${encodeURIComponent(pathname)}`);
    return null;
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