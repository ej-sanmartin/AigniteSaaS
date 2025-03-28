'use client';

import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { UserInfoCard } from '@/components/dashboard/UserInfoCard';
import { SubscriptionCard } from '@/components/dashboard/SubscriptionCard';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import api from '@/utils/api';
import type { DashboardStats } from '@/types/dashboard';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

export default function DashboardPage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      // Don't fetch if auth is still loading or no user
      if (isAuthLoading || !user) return;

      try {
        setLoading(true);
        setError(null);
        
        const { data } = await api.get('/users/dashboard-stats');
        setStats(data);
      } catch (error) {
        console.error('Dashboard data fetch error:', error);
        setError(error instanceof Error ? error.message : 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user, isAuthLoading]);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <DashboardHeader />
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          {loading ? (
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4 mx-auto"></div>
              <p className="text-gray-600">Loading dashboard...</p>
            </div>
          ) : error ? (
            <div className="text-red-600 max-w-2xl p-4 mx-auto">
              <h2 className="text-xl font-bold mb-2">Error</h2>
              <p className="mb-4">{error}</p>
            </div>
          ) : (
            <>
              <UserInfoCard user={user} stats={stats} />
              {stats?.subscriptionStatus && <SubscriptionCard user={user} stats={stats} />}
            </>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
} 