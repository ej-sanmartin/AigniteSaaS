'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useUser } from '@/contexts/UserContext';
import { useAuth } from '@/contexts/AuthContext';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { usePathname } from 'next/navigation';

export function NavBar() {
  const { user, isLoading } = useUser();
  const { logout } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const pathname = usePathname();
  const isBlogPage = pathname?.startsWith('/blog');

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    const navbarHeight = 64; // height of the navbar in pixels
    
    if (element) {
      const elementPosition = element.getBoundingClientRect().top;
      const windowHeight = window.innerHeight;
      const elementHeight = element.offsetHeight;
      
      // Adjust offset based on section
      let offset: number;
      if (sectionId === 'features') {
        // For Features, center it with a slight upward shift
        const centerOffset = (windowHeight - elementHeight) / 2;
        offset = elementPosition + window.scrollY - centerOffset - 50; // Added 50px upward shift
      } else if (sectionId === 'pricing') {
        // For Pricing, align to top with navbar clearance
        offset = elementPosition + window.scrollY - navbarHeight;
      }

      window.scrollTo({
        top: offset,
        behavior: 'smooth'
      });
    }
  };

  const handleFeaturesClick = () => {
    if (isBlogPage) {
      window.location.href = '/#features';
    } else {
      scrollToSection('features');
    }
  };

  const handlePricingClick = () => {
    if (isBlogPage) {
      window.location.href = '/#pricing';
    } else {
      scrollToSection('pricing');
    }
  };

  return (
    <nav className={`fixed w-full z-50 transition-all duration-300 ${
      isScrolled ? 'bg-white dark:bg-gray-800 shadow-sm' : 'bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center">
            <Link href="/" className="text-xl font-semibold text-gray-900 dark:text-white">
              Your App
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            {!isLoading && user ? (
              <>
                <Link
                  href="/dashboard"
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                >
                  Dashboard
                </Link>
                <span className="text-gray-700 dark:text-gray-300">
                  {user.firstName && user.lastName 
                    ? `${user.firstName} ${user.lastName}`
                    : user.email || 'User'}
                </span>
                <button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className={`
                    px-4 py-2 text-sm text-gray-700 dark:text-gray-300
                    hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md
                    ${isLoggingOut ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                >
                  {isLoggingOut ? 'Logging out...' : 'Logout'}
                </button>
              </>
            ) : (
              <>
                <div className="hidden md:flex items-center space-x-6">
                  {isBlogPage ? (
                    <>
                      <Link
                        href="/#features"
                        className="text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
                      >
                        Features
                      </Link>
                      <Link
                        href="/#pricing"
                        className="text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
                      >
                        Pricing
                      </Link>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => scrollToSection('features')}
                        className="text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
                      >
                        Features
                      </button>
                      <button
                        onClick={() => scrollToSection('pricing')}
                        className="text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
                      >
                        Pricing
                      </button>
                    </>
                  )}
                  <Link
                    href="/blog"
                    className="text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
                  >
                    Blog
                  </Link>
                </div>
                <Link
                  href="/login"
                  className="text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
                >
                  Login
                </Link>
                <Link
                  href="/signup"
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                >
                  Sign Up
                </Link>
              </>
            )}
            <ThemeToggle />
          </div>
        </div>
      </div>
    </nav>
  );
} 