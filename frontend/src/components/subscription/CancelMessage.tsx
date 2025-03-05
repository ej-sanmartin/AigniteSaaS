'use client';

import Link from 'next/link';

export function CancelMessage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow text-center">
        <div className="rounded-full h-16 w-16 flex items-center justify-center mx-auto bg-red-100 text-red-600">
          <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h2 className="text-3xl font-bold text-gray-900">Subscription Cancelled</h2>
        <p className="text-gray-600">
          The subscription process was cancelled. You can try again when you're ready.
        </p>
        <div className="pt-4">
          <Link
            href="/subscription"
            className="text-blue-600 hover:text-blue-500 font-medium"
          >
            Return to subscription page
          </Link>
        </div>
      </div>
    </div>
  );
} 