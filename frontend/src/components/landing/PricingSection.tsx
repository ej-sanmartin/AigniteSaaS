'use client';

import { CheckIcon } from '@heroicons/react/24/outline';

const plans = [
  {
    name: 'Basic',
    price: '$9',
    interval: 'month',
    description: 'Perfect for getting started',
    features: [
      'Up to 5 projects',
      'Basic analytics',
      'Email support',
      '2GB storage',
      'API access',
    ],
    cta: 'Get Started',
    highlighted: false,
  },
  {
    name: 'Pro',
    price: '$29',
    interval: 'month',
    description: 'Best for growing teams',
    features: [
      'Unlimited projects',
      'Advanced analytics',
      'Priority support',
      '10GB storage',
      'Advanced API access',
      'Custom integrations',
    ],
    cta: 'Start Free Trial',
    highlighted: true,
  },
  {
    name: 'Enterprise',
    price: '$99',
    interval: 'month',
    description: 'For large organizations',
    features: [
      'Unlimited everything',
      'Custom analytics',
      '24/7 phone support',
      'Unlimited storage',
      'Custom API solutions',
      'Dedicated account manager',
      'SLA agreement',
    ],
    cta: 'Contact Sales',
    highlighted: false,
  },
];

export function PricingSection() {
  return (
    <div className="w-full px-4 sm:px-6 lg:px-8">
      <div className="text-center">
        <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white sm:text-4xl">
          Simple, transparent pricing
        </h2>
        <p className="mt-4 text-xl text-gray-600 dark:text-gray-400">
          Choose the perfect plan for your needs
        </p>
      </div>

      <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:gap-8">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`rounded-lg shadow-lg divide-y divide-gray-200 dark:divide-gray-700
              ${
                plan.highlighted
                  ? 'border-2 border-blue-500 dark:border-blue-400'
                  : 'border border-gray-200 dark:border-gray-700'
              }
            `}
          >
            <div className="p-6">
              <h3 className="text-2xl font-semibold text-gray-900 dark:text-white">
                {plan.name}
              </h3>
              <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                {plan.description}
              </p>
              <p className="mt-8">
                <span className="text-4xl font-extrabold text-gray-900 dark:text-white">
                  {plan.price}
                </span>
                <span className="text-base font-medium text-gray-500 dark:text-gray-400">
                  /{plan.interval}
                </span>
              </p>
              <button
                className={`mt-8 w-full rounded-md px-4 py-2 text-sm font-semibold text-white
                  ${
                    plan.highlighted
                      ? 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600'
                      : 'bg-gray-800 hover:bg-gray-900 dark:bg-gray-700 dark:hover:bg-gray-600'
                  }
                `}
              >
                {plan.cta}
              </button>
            </div>
            <div className="px-6 pt-6 pb-8">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white tracking-wide uppercase">
                What's included
              </h4>
              <ul className="mt-6 space-y-4">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex space-x-3">
                    <CheckIcon
                      className={`flex-shrink-0 h-5 w-5
                        ${
                          plan.highlighted
                            ? 'text-blue-500 dark:text-blue-400'
                            : 'text-green-500 dark:text-green-400'
                        }
                      `}
                    />
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 