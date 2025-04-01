'use client';

import { useEffect, useState } from 'react';
import CookieSettingsModal from './CookieSettingsModal';

interface CookiePreferences {
  functional: boolean;
  analytics: boolean;
  advertising: boolean;
}

export default function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    // Check if user has already made a choice
    const consent = localStorage.getItem('cookieConsent');
    if (!consent) {
      setShowBanner(true);
    }
  }, []);

  const handleAcceptAll = () => {
    localStorage.setItem('cookieConsent', 'all');
    setShowBanner(false);
    loadNonEssentialCookies();
  };

  const handleReject = () => {
    localStorage.setItem('cookieConsent', 'none');
    setShowBanner(false);
  };

  const handleCustomize = () => {
    setShowModal(true);
  };

  const handleSavePreferences = (preferences: CookiePreferences) => {
    localStorage.setItem('cookiePreferences', JSON.stringify(preferences));
    setShowModal(false);
    setShowBanner(false);

    // Load cookies based on preferences
    if (preferences.analytics) loadAnalytics();
    if (preferences.advertising) loadAds();
    if (preferences.functional) loadFunctional();
  };

  if (!showBanner) return null;

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 bg-white/70 border-t border-gray-200 p-4 shadow-lg z-50">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-600">
            We use cookies to improve your experience and analyze site usage.
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleAcceptAll}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Accept all
            </button>
            <button
              onClick={handleReject}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
            >
              Reject
            </button>
            <button
              onClick={handleCustomize}
              className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
            >
              Customize
            </button>
          </div>
        </div>
      </div>

      <CookieSettingsModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSave={handleSavePreferences}
      />
    </>
  );
}

// Placeholder functions for loading different types of cookies
function loadNonEssentialCookies() {
  console.log('Loading all non-essential cookies');
}

function loadAnalytics() {
  console.log('Loading analytics cookies');
}

function loadAds() {
  console.log('Loading advertising cookies');
}

function loadFunctional() {
  console.log('Loading functional cookies');
} 