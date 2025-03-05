'use client';

import { SubscriptionPlans } from '@/components/subscription/SubscriptionPlans';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';

export default function SubscriptionPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />
      <div className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Choose your plan
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Select the perfect plan for your needs
            </p>
          </div>
          <SubscriptionPlans />
        </div>
      </div>
    </div>
  );
} 