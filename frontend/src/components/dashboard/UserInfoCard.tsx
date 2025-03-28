'use client';

import { User } from '@/types/auth';
import { DashboardStats } from '@/types/dashboard';

interface UserInfoCardProps {
  user: User | null;
  stats: DashboardStats | null;
}

export function UserInfoCard({ user, stats }: UserInfoCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-6">
      <h2 className="text-lg font-medium mb-4 text-gray-900 dark:text-white">Account Information</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Name</p>
          <p className="font-medium text-gray-900 dark:text-white">
            {user?.firstName} {user?.lastName}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
          <p className="font-medium text-gray-900 dark:text-white">{user?.email}</p>
          {!user?.isVerified && (
            <span className="text-xs text-red-500 dark:text-red-400">
              Email not verified. Please check your inbox.
            </span>
          )}
        </div>
        {stats?.accountCreated && (
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Member Since</p>
            <p className="font-medium text-gray-900 dark:text-white">
              {new Date(stats.accountCreated).toLocaleDateString()}
            </p>
          </div>
        )}
        {stats?.lastLogin && (
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Last Login</p>
            <p className="font-medium text-gray-900 dark:text-white">
              {new Date(stats.lastLogin).toLocaleDateString()}
            </p>
          </div>
        )}
      </div>
    </div>
  );
} 