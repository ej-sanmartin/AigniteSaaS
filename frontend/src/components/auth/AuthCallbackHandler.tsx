'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export function AuthCallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const returnTo = searchParams.get('returnTo') || '/dashboard';
    router.push(returnTo);
  }, [searchParams, router]);

  return null; // This component doesn't render anything
} 