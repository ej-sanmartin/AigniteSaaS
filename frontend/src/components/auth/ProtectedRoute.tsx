'use client';

import { useAuth } from '@/contexts/AuthContext';
import { LoadingAuth } from './LoadingAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isLoading, isAuthenticated, error } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return <LoadingAuth />;
  }

  if (error) {
    // You might want to handle this differently depending on the error
    router.replace('/login');
    return null;
  }

  return isAuthenticated ? children : null;
} 