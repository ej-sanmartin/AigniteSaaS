'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SuccessMessage } from '@/components/subscription/SuccessMessage';

export default function SubscriptionSuccessPage() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/dashboard');
    }, 5000);

    return () => clearTimeout(timer);
  }, [router]);

  return <SuccessMessage />;
} 