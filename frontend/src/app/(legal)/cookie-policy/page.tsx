'use client';

import Link from 'next/link';

export default function CookiePolicyPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          Cookie Policy
        </h1>

        <div className="prose dark:prose-invert max-w-none">
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
            This website uses cookies to enhance your browsing experience and provide certain functionality. 
            We are committed to being transparent about our use of cookies and ensuring GDPR compliance.
          </p>

          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">
            What are cookies?
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Cookies are small text files that are placed on your computer or mobile device when you visit a website. 
            They help us provide you with a better experience by remembering your preferences and understanding how you use our site.
          </p>

          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">
            Types of cookies we use
          </h2>
          <ul className="list-disc pl-6 text-gray-600 dark:text-gray-400 mb-6">
            <li className="mb-2">
              <strong>Essential Cookies:</strong> These are necessary for the website to function properly. 
              They enable basic functions like page navigation and access to secure areas of the website.
            </li>
            <li className="mb-2">
              <strong>Functional Cookies:</strong> These enable enhanced functionality and personalization. 
              They may be set by us or by third-party providers whose services we use on our pages.
            </li>
            <li className="mb-2">
              <strong>Analytics Cookies:</strong> These help us understand how visitors interact with our website. 
              They collect information about your browsing habits and help us improve our site.
            </li>
            <li className="mb-2">
              <strong>Advertising Cookies:</strong> These are used to track visitors across websites. 
              The intention is to display ads that are relevant and engaging for individual users.
            </li>
          </ul>

          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">
            GDPR Compliance
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            We are committed to complying with the General Data Protection Regulation (GDPR) regarding cookie consent. 
            This means:
          </p>
          <ul className="list-disc pl-6 text-gray-600 dark:text-gray-400 mb-6">
            <li className="mb-2">We obtain explicit consent before setting non-essential cookies</li>
            <li className="mb-2">We provide clear information about what cookies we use and why</li>
            <li className="mb-2">We allow users to choose which cookies they accept</li>
            <li className="mb-2">We make it easy to withdraw consent at any time</li>
          </ul>

          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">
            Managing your cookie preferences
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            You can manage your cookie preferences at any time by:
          </p>
          <ul className="list-disc pl-6 text-gray-600 dark:text-gray-400 mb-6">
            <li className="mb-2">Clicking the "Cookie Settings" link in the footer</li>
            <li className="mb-2">Using the cookie consent banner when you first visit the site</li>
            <li className="mb-2">Clearing your browser cookies and refreshing the page</li>
          </ul>

          <div className="mt-8">
            <Link 
              href="/"
              className="text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 