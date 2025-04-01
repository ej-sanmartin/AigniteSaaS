'use client';

import { Inter } from 'next/font/google';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { Toaster } from 'react-hot-toast';
import { ToastHandler } from '@/components/ToastHandler';
import { NavBar } from '@/components/landing/NavBar';
import { Footer } from '@/components/landing/Footer';
import { usePathname } from 'next/navigation';
import CookieConsent from '@/components/CookieConsent';

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
});

export function RootLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isProtectedRoute = pathname?.startsWith('/dashboard') || 
                          pathname?.startsWith('/profile') || 
                          pathname?.startsWith('/settings') ||
                          pathname?.startsWith('/subscription');

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} antialiased bg-white dark:bg-gray-900 flex flex-col min-h-screen`}>
        <ThemeProvider>
          <AuthProvider>
            {!isProtectedRoute && <NavBar />}
            <main className="flex-1">
              {children}
            </main>
            {!isProtectedRoute && <Footer />}
            <CookieConsent />
          </AuthProvider>
        </ThemeProvider>
        <ToastHandler />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 5000,
            style: {
              background: '#333',
              color: '#fff',
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#4ade80',
                secondary: '#fff',
              },
            },
            error: {
              duration: 5000,
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
      </body>
    </html>
  );
} 