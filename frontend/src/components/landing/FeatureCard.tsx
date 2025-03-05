'use client';

import { ReactNode } from 'react';
import { Feature } from './types';

interface FeatureCardProps {
  feature: Feature;
}

export default function FeatureCard({ feature }: FeatureCardProps) {
  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300">
      <div className="text-blue-600 dark:text-blue-400 mb-4">
        {feature.icon}
      </div>
      <h3 className="text-lg font-medium text-gray-900 dark:text-white">
        {feature.title}
      </h3>
      <p className="mt-2 text-gray-500 dark:text-gray-400">
        {feature.description}
      </p>
    </div>
  );
} 