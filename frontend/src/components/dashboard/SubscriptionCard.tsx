'use client';

import { User } from '@/types/auth';
import { DashboardStats } from '@/types/dashboard';
import { useRouter } from 'next/navigation';

interface SubscriptionCardProps {
  user: User | null;
  stats: DashboardStats | null;
}

export function SubscriptionCard({ user, stats }: SubscriptionCardProps) {
  const router = useRouter();

  const handleSubscribe = () => {
    router.push('/subscription');
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-lg font-medium mb-4">Subscription Status</h2>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">Current Plan</p>
          <p className="font-medium">
            {user?.subscription?.plan || 'No active plan'}
          </p>
          <p className={`text-sm mt-1 ${
            stats?.subscriptionStatus === 'active' 
              ? 'text-green-600' 
              : 'text-red-600'
          }`}>
            {stats?.subscriptionStatus === 'active' ? 'Active' : 'Inactive'}
          </p>
        </div>
        {(!user?.subscription || user.subscription.status !== 'active') && (
          <button
            onClick={handleSubscribe}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Upgrade Plan
          </button>
        )}
      </div>
    </div>
  );
} 