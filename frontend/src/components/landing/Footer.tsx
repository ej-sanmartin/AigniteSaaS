'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import CookieSettingsModal from '../CookieSettingsModal';

export function Footer() {
  const currentYear = new Date().getFullYear();
  const [showCookieSettings, setShowCookieSettings] = useState(false);

  const handleSavePreferences = (preferences: {
    functional: boolean;
    analytics: boolean;
    advertising: boolean;
  }) => {
    localStorage.setItem('cookiePreferences', JSON.stringify(preferences));
    setShowCookieSettings(false);

    // Load cookies based on preferences
    if (preferences.analytics) loadAnalytics();
    if (preferences.advertising) loadAds();
    if (preferences.functional) loadFunctional();
  };

  const footerSections = [
    {
      title: 'Company',
      links: [
        { href: '/about', label: 'About Us' },
        { href: '/careers', label: 'Careers' },
        { href: '/blog', label: 'Blog' },
        { href: '/contact', label: 'Contact' },
      ],
    },
    {
      title: 'Resources',
      links: [
        { href: '/docs', label: 'Documentation' },
        { href: '/help', label: 'Help Center' },
        { href: '/guides', label: 'Guides' },
        { href: '/api', label: 'API Status' },
        { 
          href: '/llms.txt', 
          label: 'llms.txt',
          icon: (
            <Image
              src="/icons/lightbulb.svg"
              alt=""
              width={16}
              height={16}
              className="ml-1 inline-block"
            />
          )
        },
      ],
    },
    {
      title: 'Legal',
      links: [
        { href: '/privacy', label: 'Privacy Policy' },
        { href: '/terms', label: 'Terms of Service' },
        { href: '/cookie-policy', label: 'Cookie Policy' },
        { href: '/compliance', label: 'Compliance' },
        {
          href: '#',
          label: 'Cookie Settings',
          onClick: () => setShowCookieSettings(true),
        },
      ],
    },
  ];

  const socialLinks = [
    {
      href: 'https://twitter.com',
      label: 'X (Twitter)',
      icon: (
        <Image
          src="/icons/twitter.svg"
          alt="X (Twitter)"
          width={24}
          height={24}
          className="text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400"
        />
      ),
    },
    {
      href: 'https://github.com',
      label: 'GitHub',
      icon: (
        <Image
          src="/icons/github.svg"
          alt="GitHub"
          width={24}
          height={24}
          className="text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400"
        />
      ),
    },
    {
      href: 'https://linkedin.com',
      label: 'LinkedIn',
      icon: (
        <Image
          src="/icons/linkedin.svg"
          alt="LinkedIn"
          width={24}
          height={24}
          className="text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400"
        />
      ),
    },
  ];

  return (
    <footer className="bg-white dark:bg-gray-900">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {footerSections.map((section) => (
            <div key={section.title}>
              <h3 className="text-sm font-semibold text-gray-400 dark:text-gray-300 uppercase tracking-wider">
                {section.title}
              </h3>
              <ul className="mt-4 space-y-4">
                {section.links.map((link) => (
                  <li key={link.href}>
                    {link.onClick ? (
                      <button
                        onClick={link.onClick}
                        className="text-base text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white inline-flex items-center"
                      >
                        {link.label}
                        {link.icon}
                      </button>
                    ) : (
                      <Link
                        href={link.href}
                        className="text-base text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white inline-flex items-center"
                      >
                        {link.label}
                        {link.icon}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-8">
          <div className="flex items-center justify-between">
            <p className="text-base text-gray-400 dark:text-gray-500">
              © {currentYear} Your Company. All rights reserved.
            </p>
            <div className="flex space-x-6">
              {socialLinks.map((social) => (
                <a
                  key={social.href}
                  href={social.href}
                  className="text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      <CookieSettingsModal
        isOpen={showCookieSettings}
        onClose={() => setShowCookieSettings(false)}
        onSave={handleSavePreferences}
      />
    </footer>
  );
}

// Placeholder functions for loading different types of cookies
function loadAnalytics() {
  console.log('Loading analytics cookies');
}

function loadAds() {
  console.log('Loading advertising cookies');
}

function loadFunctional() {
  console.log('Loading functional cookies');
} 