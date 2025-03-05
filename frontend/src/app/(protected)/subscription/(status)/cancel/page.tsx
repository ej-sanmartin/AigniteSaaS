'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CancelMessage } from '@/components/subscription/CancelMessage';

export default function SubscriptionCancelPage() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/subscription');
    }, 5000);

    return () => clearTimeout(timer);
  }, [router]);

  return <CancelMessage />;
} 