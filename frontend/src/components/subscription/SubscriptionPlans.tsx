'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/utils/api';
import { stripePromise } from '@/utils/stripe';
import { PricingTier } from '@/types/subscription';

const pricingTiers: PricingTier[] = [
  {
    id: 'price_basic',
    name: 'Basic',
    price: 9.99,
    interval: 'month',
    features: ['Feature 1', 'Feature 2', 'Feature 3'],
  },
  {
    id: 'price_pro',
    name: 'Pro',
    price: 19.99,
    interval: 'month',
    features: ['All Basic features', 'Feature 4', 'Feature 5', 'Feature 6'],
  },
  {
    id: 'price_enterprise',
    name: 'Enterprise',
    price: 49.99,
    interval: 'month',
    features: ['All Pro features', 'Feature 7', 'Feature 8', 'Priority Support'],
  },
];

export function SubscriptionPlans() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubscribe = async (priceId: string) => {
    if (!user) {
      setError('Please login to subscribe');
      router.push('/login');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data: { sessionId } } = await api.post('/subscriptions/create-checkout-session', {
        priceId,
        customerEmail: user.email,
        metadata: {
          userId: user.id,
        }
      });

      const stripe = await stripePromise;
      if (!stripe) {
        throw new Error('Stripe failed to load');
      }

      const { error: stripeError } = await stripe.redirectToCheckout({
        sessionId,
        successUrl: `${window.location.origin}/subscription/success`,
        cancelUrl: `${window.location.origin}/subscription/cancel`,
      });

      if (stripeError) {
        throw new Error(stripeError.message);
      }
    } catch (err) {
      setError('Failed to initiate checkout. Please try again.');
      console.error('Subscription error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {error && (
        <div className="mt-8 max-w-md mx-auto bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div
        className={
          "mt-12 space-y-4 sm:mt-16 sm:space-y-0 " +
          "sm:grid sm:grid-cols-3 sm:gap-6 " +
          "lg:max-w-4xl lg:mx-auto xl:max-w-none xl:mx-0"
        }
      >
        {pricingTiers.map((tier) => (
          <div
            key={tier.id}
            className={`rounded-lg shadow-sm divide-y divide-gray-200 bg-white
              ${selectedTier === tier.id ? 'ring-2 ring-blue-500' : ''}
            `}
          >
            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-900">
                {tier.name}
              </h3>
              <p className="mt-4">
                <span className="text-4xl font-extrabold text-gray-900">
                  ${tier.price}
                </span>
                <span className="text-base font-medium text-gray-500">
                  /{tier.interval}
                </span>
              </p>
              <ul className="mt-6 space-y-4">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex">
                    <svg
                      className="flex-shrink-0 w-6 h-6 text-green-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span className="ml-3 text-gray-500">{feature}</span>
                  </li>
                ))}
              </ul>
              <button
                onClick={() => handleSubscribe(tier.id)}
                disabled={loading}
                className={`mt-8 block w-full py-3 px-6 border border-transparent 
                  rounded-md text-center font-medium
                  ${loading
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                  }
                `}
              >
                {loading ? 'Processing...' : 'Subscribe Now'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
} 