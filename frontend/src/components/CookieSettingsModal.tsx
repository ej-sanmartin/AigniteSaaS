'use client';

import { useState, useEffect } from 'react';

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
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-xl font-semibold mb-4">Cookie Settings</h2>
        
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
              <label className="font-medium">Essential Cookies</label>
              <p className="text-sm text-gray-600">
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
              <label className="font-medium">Functional Cookies</label>
              <p className="text-sm text-gray-600">
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
              <label className="font-medium">Analytics Cookies</label>
              <p className="text-sm text-gray-600">
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
              <label className="font-medium">Advertising Cookies</label>
              <p className="text-sm text-gray-600">
                Used to deliver personalized advertisements.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(preferences)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Save Preferences
          </button>
        </div>
      </div>
    </div>
  );
} 