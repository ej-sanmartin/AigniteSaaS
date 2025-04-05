'use client';

import { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import api from '@/utils/api';
import type { User } from '@/types/auth';
import { useAuth } from '@/contexts/AuthContext';

interface UserContextType {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  refreshUser: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();

  const fetchUser = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const { data } = await api.get('/users/profile/');
      setUser(data);
    } catch (err) {
      setError('Failed to fetch user data');
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUser = async () => {
    if (isAuthenticated) {
      await fetchUser();
    }
  };

  // Listen for auth state changes
  useEffect(() => {
    if (isAuthenticated) {
      fetchUser();
    } else {
      // Clear user data when not authenticated
      setUser(null);
      setError(null);
    }
  }, [isAuthenticated]);

  return (
    <UserContext.Provider value={{ user, isLoading, error, refreshUser }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}; 