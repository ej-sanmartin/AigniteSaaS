'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { ThemeToggle } from '@/components/common/ThemeToggle';

export function DashboardHeader() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login');
    } catch (error) {
      console.error('Logout failed');
    }
  };

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center">
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Dashboard</h1>
          </div>
          <div className="flex items-center space-x-4">
            <ThemeToggle />
            <span className="text-gray-700 dark:text-gray-300">
              {user?.firstName && user?.lastName 
                ? `${user.firstName} ${user.lastName}`
                : user?.email || 'User'}
            </span>
            <button
              onClick={handleLogout}
              className={`
                px-4 py-2 text-sm text-gray-700 dark:text-gray-300
                hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md
              `}
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
} 