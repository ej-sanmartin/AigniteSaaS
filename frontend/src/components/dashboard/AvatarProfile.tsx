'use client';

import Image from 'next/image';
import { useUser } from '@/contexts/UserContext';
import { useAvatar } from '@/hooks/useAvatar';

interface AvatarProfileProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function AvatarProfile({ size = 'md', className = '' }: AvatarProfileProps) {
  const { user } = useUser();
  const { avatarUrl, isLoading, isError } = useAvatar();

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

  if (!avatarUrl || isError) {
    return (
      <div className={`${sizeClasses[size]} rounded-full bg-gray-200 flex items-center justify-center ${className}`}>
        <span className="text-gray-500 text-sm font-medium">
          {user?.email?.[0]?.toUpperCase() || '?'}
        </span>
      </div>
    );
  }

  return (
    <div className={`${sizeClasses[size]} relative rounded-full overflow-hidden ${className}`}>
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