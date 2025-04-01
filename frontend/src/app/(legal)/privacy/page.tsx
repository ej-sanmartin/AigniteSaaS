'use client';

import { LegalSection } from '@/components/legal/LegalSection';

const privacyContent = [
  {
    title: 'Information We Collect',
    content: `We collect information you provide directly to us, including:
      • Name and contact information
      • Account credentials
      • Payment information
      • Communications with us
      • Any other information you choose to provide`,
  },
  {
    title: 'How We Use Your Information',
    content: `We use the information we collect to:
      • Provide and maintain our services
      • Process your transactions
      • Send you technical notices and support messages
      • Respond to your comments and questions
      • Communicate with you about products, services, and events
      • Protect against fraudulent or illegal activity`,
  },
  {
    title: 'Information Sharing',
    content: `We may share your information with:
      • Service providers who assist in our operations
      • Professional advisors
      • Law enforcement when required by law
      • In connection with a business transaction
      We do not sell your personal information.`,
  },
  {
    title: 'Data Security',
    content: `We implement appropriate technical and organizational measures to protect your data. 
      However, no security system is impenetrable and we cannot guarantee the security of our systems.`,
  },
  {
    title: 'Your Rights',
    content: `You have the right to:
      • Access your personal information
      • Correct inaccurate information
      • Request deletion of your information
      • Object to our processing of your information
      • Withdraw consent where applicable`,
  },
];

export default function PrivacyPolicy() {
  return (
    <>
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Privacy Policy</h1>
      <div className="prose prose-blue max-w-none dark:prose-invert">
        <p className="text-gray-600 dark:text-gray-300 mb-8">
          Last updated: {new Date().toLocaleDateString()}
        </p>
        
        <p className="text-gray-600 dark:text-gray-300 mb-8">
          This Privacy Policy describes how we collect, use, and share your personal information
          when you use our services. By using our services, you agree to the collection and use
          of information in accordance with this policy.
        </p>

        {privacyContent.map((section, index) => (
          <LegalSection
            key={index}
            title={section.title}
            content={section.content}
          />
        ))}

        <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
          <p className="text-gray-600 dark:text-gray-300">
            If you have any questions about this Privacy Policy, please contact us at:
            <br />
            <a href="mailto:privacy@yourapp.com" className="text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300">
              privacy@yourapp.com
            </a>
          </p>
        </div>
      </div>
    </>
  );
} 