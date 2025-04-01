'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface CookiePreferences {
  functional: boolean;
  analytics: boolean;
  advertising: boolean;
}

interface CookieSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (preferences: CookiePreferences) => void;
}

export default function CookieSettingsModal({
  isOpen,
  onClose,
  onSave,
}: CookieSettingsModalProps) {
  const [preferences, setPreferences] = useState<CookiePreferences>({
    functional: true, // Always enabled
    analytics: false,
    advertising: false,
  });

  useEffect(() => {
    // Load saved preferences if they exist
    const savedPreferences = localStorage.getItem('cookiePreferences');
    if (savedPreferences) {
      setPreferences(JSON.parse(savedPreferences));
    }
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Cookie Settings</h2>
        
        <div className="space-y-4">
          {/* Essential cookies (always enabled) */}
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={true}
              disabled
              className="mt-1"
            />
            <div>
              <label className="font-medium text-gray-900 dark:text-white">Essential Cookies</label>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Required for the website to function properly. Cannot be disabled.
              </p>
            </div>
          </div>

          {/* Functional cookies */}
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={preferences.functional}
              onChange={(e) =>
                setPreferences({ ...preferences, functional: e.target.checked })
              }
              className="mt-1"
            />
            <div>
              <label className="font-medium text-gray-900 dark:text-white">Functional Cookies</label>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Enable enhanced functionality and personalization.
              </p>
            </div>
          </div>

          {/* Analytics cookies */}
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={preferences.analytics}
              onChange={(e) =>
                setPreferences({ ...preferences, analytics: e.target.checked })
              }
              className="mt-1"
            />
            <div>
              <label className="font-medium text-gray-900 dark:text-white">Analytics Cookies</label>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Help us understand how visitors interact with our website.
              </p>
            </div>
          </div>

          {/* Advertising cookies */}
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={preferences.advertising}
              onChange={(e) =>
                setPreferences({ ...preferences, advertising: e.target.checked })
              }
              className="mt-1"
            />
            <div>
              <label className="font-medium text-gray-900 dark:text-white">Advertising Cookies</label>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Used to deliver personalized advertisements.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-between items-center">
          <Link
            href="/cookie-policy"
            className="text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
          >
            Learn more about our cookie policy
          </Link>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
            >
              Cancel
            </button>
            <button
              onClick={() => onSave(preferences)}
              className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-md"
            >
              Save Preferences
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 