'use client';

import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { UserInfoCard } from '@/components/dashboard/UserInfoCard';
import { SubscriptionCard } from '@/components/dashboard/SubscriptionCard';
import { useUser } from '@/contexts/UserContext';
import { useState, useEffect, useRef } from 'react';
import { api } from '@/utils/api';
import type { DashboardStats } from '@/types/dashboard';
import { useSearchParams } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { LoadingState } from '@/components/ui/LoadingState';
import { AuthCallbackHandler } from '@/components/auth/AuthCallbackHandler';

export default function DashboardPage() {
  const { user: userDetails, isLoading: isUserLoading } = useUser();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthInitialized, setIsAuthInitialized] = useState(false);
  const searchParams = useSearchParams();
  const hasShownSignupToast = useRef(false);

  // Effect to show welcome toast after dashboard is fully loaded
  useEffect(() => {
    if (stats && userDetails && hasShownSignupToast.current === false) {
      const fromSignup = searchParams.get('fromSignup');
      if (fromSignup === 'true') {
        toast.success('Account created successfully! Welcome to your dashboard.');
        hasShownSignupToast.current = true;
      }
    }
  }, [stats, userDetails, searchParams]);

  // Fetch dashboard stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsDataLoading(true);
        setError(null);

        // Fetch dashboard stats
        const statsResponse = await api.get('/users/dashboard-stats');
        setStats(statsResponse.data);
      } catch (err) {
        setError('Failed to load dashboard data. Please try again later.');
      } finally {
        setIsDataLoading(false);
      }
    };

    if (isAuthInitialized) {
      fetchStats();
    }
  }, [isAuthInitialized]);

  // Show loading state while auth is initializing
  if (!isAuthInitialized) {
    const fromAuthCallback = searchParams.get('fromAuthCallback');
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader user={null} />
        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">
          <AuthCallbackHandler 
            onSuccess={() => setIsAuthInitialized(true)}
            onError={() => setError('Authentication failed. Please try again.')}
          />
        </main>
      </div>
    );
  }

  // Show error state if data fetching failed
  if (error) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader user={null} />
        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <div className="text-red-600 dark:text-red-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <p className="text-gray-600 dark:text-gray-400">{error}</p>
          </div>
        </main>
      </div>
    );
  }

  // Show loading state while data is being fetched
  if (isDataLoading || isUserLoading) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader user={null} />
        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">
          <LoadingState message="Loading dashboard data..." />
        </main>
      </div>
    );
  }

  // Show dashboard content
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <DashboardHeader user={userDetails} />
      <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <UserInfoCard user={userDetails} stats={stats} />
          <SubscriptionCard user={userDetails} stats={stats} />
        </div>
      </main>
    </div>
  );
} 