'use client';

export function SuccessMessage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow text-center">
        <div className="rounded-full h-16 w-16 flex items-center justify-center mx-auto bg-green-100 text-green-600">
          <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-3xl font-bold text-gray-900">Subscription Successful!</h2>
        <p className="text-gray-600">
          Thank you for subscribing. You will be redirected to your dashboard shortly.
        </p>
      </div>
    </div>
  );
} 