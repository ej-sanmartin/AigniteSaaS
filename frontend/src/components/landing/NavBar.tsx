'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { ThemeToggle } from '@/components/common/ThemeToggle';

export function NavBar() {
  const { user } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    const navbarHeight = 64; // height of the navbar in pixels
    
    if (element) {
      const elementPosition = element.getBoundingClientRect().top;
      const windowHeight = window.innerHeight;
      const elementHeight = element.offsetHeight;
      
      // Adjust offset based on section
      let offset;
      if (sectionId === 'features') {
        // For Features, center it with a slight upward shift
        const centerOffset = (windowHeight - elementHeight) / 2;
        offset = elementPosition + window.pageYOffset - centerOffset - 50; // Added 50px upward shift
      } else if (sectionId === 'pricing') {
        // For Pricing, align to top with navbar clearance
        offset = elementPosition + window.pageYOffset - navbarHeight;
      }

      window.scrollTo({
        top: offset,
        behavior: 'smooth'
      });
    }
  };

  return (
    <nav className={`fixed w-full z-10 transition-all duration-300 ${
      isScrolled 
        ? 'bg-white dark:bg-gray-900 shadow-md dark:shadow-gray-800' 
        : 'bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex-shrink-0">
            <h1 className="text-2xl font-bold text-blue-600 dark:text-blue-400">Your App</h1>
          </div>
          <div className="hidden md:flex md:items-center">
            <div className="ml-10 flex items-center space-x-4">
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
              {user ? (
                <Link
                  href="/dashboard"
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                >
                  Dashboard
                </Link>
              ) : (
                <>
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
      </div>
    </nav>
  );
} 