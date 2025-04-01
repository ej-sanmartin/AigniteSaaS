'use client';

import Link from 'next/link';

export default function CookiePolicyPage() {
  return (
    <div>
      <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-8">
        Cookie Policy
      </h1>

      <div className="prose dark:prose-invert">
        <p className="text-gray-600 dark:text-gray-300">
          This website uses cookies to enhance your browsing experience and provide certain functionality. We are committed to being transparent about our use of cookies and ensuring GDPR compliance.
        </p>

        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">
          What are cookies?
        </h2>
        
        <p className="text-gray-600 dark:text-gray-300">
          Cookies are small text files that are placed on your computer or mobile device when you visit a website. They are widely used to make websites work more efficiently and provide useful information to website owners.
        </p>

        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">
          Types of cookies we use
        </h2>

        <ul className="list-disc pl-5 text-gray-600 dark:text-gray-300">
          <li className="mb-2"><strong className="text-gray-900 dark:text-white">Essential cookies:</strong> Required for the website to function properly. These cannot be disabled.</li>
          <li className="mb-2"><strong className="text-gray-900 dark:text-white">Functional cookies:</strong> Help with enhanced functionality and personalization.</li>
          <li className="mb-2"><strong className="text-gray-900 dark:text-white">Analytics cookies:</strong> Help us understand how visitors interact with our website.</li>
          <li className="mb-2"><strong className="text-gray-900 dark:text-white">Advertising cookies:</strong> Used to deliver relevant advertisements and track campaign performance.</li>
        </ul>

        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">
          Managing your cookie preferences
        </h2>

        <p className="text-gray-600 dark:text-gray-300">
          You can manage your cookie preferences at any time through our Cookie Settings option in the footer. You may choose to accept or reject non-essential cookies.
        </p>

        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">
          GDPR Compliance
        </h2>

        <p className="text-gray-600 dark:text-gray-300">
          We comply with GDPR requirements regarding cookie consent and data privacy. We only process your data through cookies with your explicit consent, except for essential cookies required for website functionality.
        </p>

        <div className="mt-8">
          <Link href="/" className="text-blue-600 dark:text-blue-400 hover:underline">
            Return to Home
          </Link>
        </div>
      </div>
    </div>
  );
} 