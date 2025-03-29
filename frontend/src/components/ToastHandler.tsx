'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';

export function ToastHandler() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const success = searchParams.get('success');
    const error = searchParams.get('error');

    if (success) {
      toast.success(decodeURIComponent(success));
    }

    if (error) {
      toast.error(decodeURIComponent(error));
    }
  }, [searchParams]);

  return null;
} 