'use client';

import Link from 'next/link';

export function CTASection() {
  return (
    <div className="w-full px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white sm:text-4xl">
          Ready to get started?
        </h2>
        <p className="mt-4 text-lg text-gray-500 dark:text-gray-400">
          Join thousands of satisfied users who are already using our platform.
        </p>
        <div className="mt-8">
          <a
            href="#"
            className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
          >
            Sign up now
          </a>
        </div>
      </div>
    </div>
  );
} 