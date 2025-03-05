'use client';

import { useState, useRef } from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

const faqs = [
  {
    question: 'What is your refund policy?',
    answer: 'We offer a 30-day money-back guarantee for all our plans. If you\'re not ' +
      'satisfied with our service, we\'ll provide a full refund, no questions asked.',
  },
  {
    question: 'How do I get started?',
    answer: 'Simply choose a plan that suits your needs and create an account. Our ' +
      'onboarding process will guide you through setting up your first project.',
  },
  {
    question: 'Can I change plans later?',
    answer: 'Yes, you can upgrade or downgrade your plan at any time. ' +
      'The price difference will be prorated based on your billing cycle.',
  },
  {
    question: 'Do you offer custom solutions?',
    answer: 'Yes, our Enterprise plan includes custom solutions tailored to your ' +
      'organization\'s specific needs. Contact our sales team to learn more.',
  },
  {
    question: 'What kind of support do you provide?',
    answer: 'We offer email support for all plans, with priority support for Pro ' +
      'plans and 24/7 phone support for Enterprise customers.',
  },
  {
    question: 'Is there a free trial available?',
    answer: 'Yes, we offer a 14-day free trial for our Pro plan, allowing you to ' +
      'test all features before making a decision.',
  },
];

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white text-center">
          Frequently asked questions
        </h2>
        <div className="mt-12">
          <dl className="space-y-6 divide-y divide-gray-200 dark:divide-gray-700">
            {faqs.map((faq, index) => (
              <FAQItem
                key={faq.question}
                faq={faq}
                isOpen={openIndex === index}
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
              />
            ))}
          </dl>
        </div>
      </div>
    </div>
  );
}

interface FAQItemProps {
  faq: { question: string; answer: string };
  isOpen: boolean;
  onClick: () => void;
}

function FAQItem({ faq, isOpen, onClick }: FAQItemProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  return (
    <div className="pt-6">
      <dt className="text-lg">
        <button
          className="flex w-full items-start justify-between text-left text-gray-900 dark:text-white"
          onClick={onClick}
          aria-expanded={isOpen}
        >
          <span className="font-medium">{faq.question}</span>
          <span className="ml-6 flex h-7 items-center">
            <ChevronDownIcon
              className={`h-6 w-6 transform transition-transform duration-300 ${
                isOpen ? 'rotate-180' : ''
              }`}
            />
          </span>
        </button>
      </dt>
      <dd
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{
          maxHeight: isOpen ? `${contentRef.current?.scrollHeight || 0}px` : '0',
          opacity: isOpen ? 1 : 0,
          visibility: isOpen ? 'visible' : 'hidden',
          marginTop: isOpen ? '0.5rem' : '0',
        }}
      >
        <div ref={contentRef} className="pr-12">
          <p className="text-base text-gray-600 dark:text-gray-400">
            {faq.answer}
          </p>
        </div>
      </dd>
    </div>
  );
} 