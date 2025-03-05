'use client';

import { FC } from 'react';
import Image from 'next/image';

interface OAuthButtonProps {
  provider: 'google' | 'linkedin';
  onClick?: () => void;
}

export const OAuthButton: FC<OAuthButtonProps> = ({ provider, onClick }) => {
  const config = {
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
  };

  const { text, icon, bgColor, textColor, borderColor } = config[provider];

  const handleClick = () => {
    // Redirect to backend OAuth endpoint
    window.location.href = `/api/auth/${provider}`;
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