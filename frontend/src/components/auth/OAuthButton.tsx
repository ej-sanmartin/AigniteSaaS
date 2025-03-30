'use client';

import { FC } from 'react';
import Image from 'next/image';
import { OAuthProvider } from '@/types/auth';

interface OAuthButtonProps {
  provider: OAuthProvider;
  onClick?: () => void;
  returnTo?: string;
}

interface ProviderConfig {
  text: string;
  icon: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
}

export const OAuthButton: FC<OAuthButtonProps> = ({ provider, onClick, returnTo = '/dashboard' }) => {
  const config: Record<OAuthProvider, ProviderConfig> = {
    google: {
      text: 'Continue with Google',
      icon: '/icons/google.svg',
      bgColor: 'bg-white hover:bg-gray-50',
      textColor: 'text-gray-700',
      borderColor: 'border-gray-300',
    },
    linkedin: {
      text: 'Continue with LinkedIn',
      icon: '/icons/linkedin.svg',
      bgColor: 'bg-[#0A66C2] hover:bg-[#004182]',
      textColor: 'text-white',
      borderColor: 'border-transparent',
    },
    github: {
      text: 'Continue with GitHub',
      icon: '/icons/github.svg',
      bgColor: 'bg-[#1A1A1A] hover:bg-[#2D2D2D]',
      textColor: 'text-white',
      borderColor: 'border-transparent',
    },
  };

  const { text, icon, bgColor, textColor, borderColor } = config[provider];

  const handleClick = () => {
    // Redirect to frontend OAuth endpoint which will then redirect to backend
    window.location.href = `/api/auth/${provider}?returnTo=${encodeURIComponent(returnTo)}`;
    onClick?.();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`${bgColor} ${textColor} ${borderColor} flex w-full justify-center items-center gap-3 px-4 py-2.5 text-sm font-medium border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
    >
      <span className="w-5 h-5 relative flex-shrink-0">
        <Image
          src={icon}
          alt={`${provider} icon`}
          width={20}
          height={20}
          className="absolute inset-0 w-full h-full"
        />
      </span>
      <span>{text}</span>
    </button>
  );
}; 