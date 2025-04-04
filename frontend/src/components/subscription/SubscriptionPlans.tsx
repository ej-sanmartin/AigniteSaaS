'use client';

import { useState, useEffect } from 'react';
import api from '@/utils/api';
import type { User } from '@/types/auth';
import type { SubscriptionPlan } from '@/types/subscription';

interface SubscriptionPlansProps {
  onSelectPlan: (plan: SubscriptionPlan) => void;
}

export function SubscriptionPlans({ onSelectPlan }: SubscriptionPlansProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch user data
        const userResponse = await api.get('/users/profile');
        setUser(userResponse.data);

        // Fetch subscription plans
        const plansResponse = await api.get('/subscriptions/plans');
        setPlans(plansResponse.data);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {plans.map((plan) => (
        <div
          key={plan.id}
          className={`p-6 rounded-lg shadow-sm ${
            user?.subscription?.planId === plan.id
              ? 'bg-blue-50 dark:bg-blue-900'
              : 'bg-white dark:bg-gray-800'
          }`}
        >
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            {plan.name}
          </h3>
          <p className="mt-4 text-3xl font-bold text-gray-900 dark:text-white">
            ${plan.price}
            <span className="text-base font-medium text-gray-500 dark:text-gray-400">
              /month
            </span>
          </p>
          <ul className="mt-6 space-y-4">
            {plan.features.map((feature) => (
              <li key={feature} className="flex items-center">
                <svg
                  className="h-5 w-5 text-green-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span className="ml-3 text-gray-500 dark:text-gray-400">
                  {feature}
                </span>
              </li>
            ))}
          </ul>
          <button
            onClick={() => onSelectPlan(plan)}
            className={`mt-8 w-full px-4 py-2 text-sm font-medium rounded-md ${
              user?.subscription?.planId === plan.id
                ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                : 'bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600'
            }`}
            disabled={user?.subscription?.planId === plan.id}
          >
            {user?.subscription?.planId === plan.id ? 'Current Plan' : 'Select Plan'}
          </button>
        </div>
      ))}
    </div>
  );
} 