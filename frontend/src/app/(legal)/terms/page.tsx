'use client';

import { LegalSection } from '@/components/legal/LegalSection';

const termsContent = [
  {
    title: 'Acceptance of Terms',
    content: `By accessing and using our services, you accept and agree to be bound by these Terms of Service. 
      If you do not agree to these terms, you must not use our services.`,
  },
  {
    title: 'User Accounts',
    content: `You are responsible for:
      • Maintaining the confidentiality of your account
      • All activities that occur under your account
      • Notifying us immediately of any unauthorized access
      You must be at least 18 years old to use our services.`,
  },
  {
    title: 'Subscription and Payments',
    content: `• Subscription fees are billed in advance
      • All payments are non-refundable
      • We may change subscription fees upon notice
      • You are responsible for all applicable taxes
      • Failure to pay may result in service termination`,
  },
  {
    title: 'Acceptable Use',
    content: `You agree not to:
      • Violate any laws or regulations
      • Infringe on intellectual property rights
      • Transmit harmful code or materials
      • Interfere with service operations
      • Engage in unauthorized data collection`,
  },
  {
    title: 'Termination',
    content: `We may terminate or suspend your account and access to our services:
      • For violations of these terms
      • For fraudulent or illegal activities
      • At our sole discretion
      • Without prior notice`,
  },
  {
    title: 'Limitation of Liability',
    content: `To the maximum extent permitted by law, we shall not be liable for:
      • Direct, indirect, or consequential damages
      • Loss of profits or data
      • Business interruption
      • Any damages arising from use of our services`,
  },
];

export default function Terms() {
  return (
    <>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Terms of Service</h1>
      <div className="prose prose-blue max-w-none">
        <p className="text-gray-600 mb-8">
          Last updated: {new Date().toLocaleDateString()}
        </p>

        <p className="text-gray-600 mb-8">
          Please read these Terms of Service carefully before using our services.
          These terms govern your use of our website and services.
        </p>

        {termsContent.map((section, index) => (
          <LegalSection
            key={index}
            title={section.title}
            content={section.content}
          />
        ))}

        <div className="mt-8 pt-8 border-t border-gray-200">
          <p className="text-gray-600">
            If you have any questions about these Terms of Service, please contact us at:
            <br />
            <a href="mailto:legal@yourapp.com" className="text-blue-600 hover:text-blue-500">
              legal@yourapp.com
            </a>
          </p>
        </div>
      </div>
    </>
  );
} 