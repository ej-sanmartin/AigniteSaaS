'use client';

import { useState } from 'react';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { useUser } from '@/contexts/UserContext';

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const { user } = useUser();

  return (
    <div className="min-h-screen">
      <div className="fixed inset-y-0 left-0 h-screen w-64 transition-all duration-300">
        <Sidebar user={user} onCollapse={setIsSidebarCollapsed} />
      </div>
      <div className={`${isSidebarCollapsed ? 'lg:pl-16' : 'lg:pl-64'} min-h-screen transition-all duration-300`}>
        <main className="h-screen overflow-y-auto bg-gray-50 dark:bg-gray-900">
          {children}
        </main>
      </div>
    </div>
  );
} 