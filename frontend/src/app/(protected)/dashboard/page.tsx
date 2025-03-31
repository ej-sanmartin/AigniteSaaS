'use client';

import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { UserInfoCard } from '@/components/dashboard/UserInfoCard';
import { SubscriptionCard } from '@/components/dashboard/SubscriptionCard';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect, useRef } from 'react';
import api from '@/utils/api';
import type { DashboardStats } from '@/types/dashboard';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import Cookies from 'js-cookie';
import { useSearchParams } from 'next/navigation';
import { toast } from 'react-hot-toast';
import {
  UsersIcon,
  ClockIcon,
  CurrencyDollarIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';

// Sample stats to show while loading or if API fails
const sampleStats = {
  activeUsers: 48,
  totalRevenue: '$12,400',
  pendingInvoices: 3,
  documentsSigned: 24
};

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description: string;
}

function StatCard({ title, value, icon, description }: StatCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0 bg-blue-100 dark:bg-blue-900 rounded-md p-3">
            {icon}
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">{title}</dt>
              <dd>
                <div className="text-lg font-medium text-gray-900 dark:text-white">{value}</div>
              </dd>
            </dl>
          </div>
        </div>
      </div>
      <div className="bg-gray-50 dark:bg-gray-700 px-5 py-3">
        <div className="text-sm text-gray-500 dark:text-gray-400">{description}</div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const searchParams = useSearchParams();
  const hasShownSignupToast = useRef(false);

  // Effect to show welcome toast after dashboard is fully loaded
  useEffect(() => {
    if (stats && hasShownSignupToast.current === false) {
      const fromSignup = searchParams.get('fromSignup');
      if (fromSignup === 'true') {
        toast.success('Account created successfully! Welcome to your dashboard.');
        hasShownSignupToast.current = true;
      }
    }
  }, [stats, searchParams]);

  // Fetch dashboard data
  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        const result = await api.get('/users/dashboard-stats');
        setStats(result.data);
      } catch (error) {
        // If API fails but we have auth, show sample data
        if (Cookies.get('token') || Cookies.get('refreshToken')) {
          setStats({
            lastLogin: new Date().toISOString(),
            accountCreated: user.createdAt instanceof Date 
              ? user.createdAt.toISOString() 
              : new Date().toISOString(),
            subscriptionStatus: 'active'
          });
        }
      }
    };

    fetchData();
  }, [user]);

  // Show loading state while auth is loading or no user
  if (isAuthLoading || !user) {
    return (
      <ProtectedRoute>
        <div className="flex-1 flex flex-col overflow-hidden">
          <DashboardHeader />
          <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4 mx-auto"></div>
              <p className="text-gray-600 dark:text-gray-400">Loading dashboard...</p>
            </div>
          </main>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader />
        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Dashboard</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Welcome back, {user.firstName && user.lastName 
                ? `${user.firstName} ${user.lastName}`
                : user.firstName || user.email?.split('@')[0] || 'User'}! Here's an overview of your account.
            </p>
          </div>
          
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Active Users"
              value={sampleStats.activeUsers}
              icon={<UsersIcon className="h-6 w-6 text-blue-600" />}
              description="Total active users this month"
            />
            <StatCard
              title="Total Revenue"
              value={sampleStats.totalRevenue}
              icon={<CurrencyDollarIcon className="h-6 w-6 text-blue-600" />}
              description="Revenue generated this month"
            />
            <StatCard
              title="Pending Invoices"
              value={sampleStats.pendingInvoices}
              icon={<ClockIcon className="h-6 w-6 text-blue-600" />}
              description="Invoices waiting for payment"
            />
            <StatCard
              title="Documents Signed"
              value={sampleStats.documentsSigned}
              icon={<DocumentTextIcon className="h-6 w-6 text-blue-600" />}
              description="Documents signed this month"
            />
          </div>
          
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <UserInfoCard user={user} stats={stats} />
            {stats?.subscriptionStatus && <SubscriptionCard user={user} stats={stats} />}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
} 