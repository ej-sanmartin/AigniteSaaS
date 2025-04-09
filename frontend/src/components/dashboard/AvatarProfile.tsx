'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useUser } from '@/contexts/UserContext';
import api from '@/utils/api';
import { useInView } from 'react-intersection-observer';

interface AvatarProfileProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function AvatarProfile({ size = 'md', className = '' }: AvatarProfileProps) {
  const { user } = useUser();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { ref, inView } = useInView({
    triggerOnce: false,
    threshold: 0.1,
  });

  useEffect(() => {
    const fetchAvatar = async () => {
      try {
        setIsLoading(true);
        const response = await api.get('/users/avatar');
        setAvatarUrl(response.data.avatarUrl);
      } catch (error) {
        console.error('Error fetching avatar:', error);
        setAvatarUrl(null);
      } finally {
        setIsLoading(false);
      }
    };

    if (user?.id && inView) {
      fetchAvatar();
    }
  }, [user?.id, inView]);

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };

  if (isLoading) {
    return (
      <div className={`${sizeClasses[size]} rounded-full bg-gray-200 animate-pulse ${className}`} />
    );
  }

  if (!avatarUrl) {
    return (
      <div className={`${sizeClasses[size]} rounded-full bg-gray-200 flex items-center justify-center ${className}`}>
        <span className="text-gray-500 text-sm font-medium">
          {user?.email?.[0]?.toUpperCase() || '?'}
        </span>
      </div>
    );
  }

  return (
    <div ref={ref} className={`${sizeClasses[size]} relative rounded-full overflow-hidden ${className}`}>
      <Image
        src={avatarUrl}
        alt="Profile"
        fill
        className="object-cover"
        sizes={`${size === 'sm' ? '32px' : size === 'md' ? '48px' : '64px'}`}
      />
    </div>
  );
} 