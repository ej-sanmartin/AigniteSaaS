'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '@/types/auth';
import { api }from '@/utils/api';
import { useAuth } from './AuthContext';

interface UserContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  isLoading: boolean;
  error: string | null;
  refreshUser: () => Promise<void>;
}

const UserContext = createContext<UserContextType>({
  user: null,
  setUser: () => {},
  isLoading: true,
  error: null,
  refreshUser: async () => {},
});

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated, isLoading: isCheckingAuth } = useAuth();

  const fetchUser = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const { data } = await api.get('/users/profile');
      setUser(data);
    } catch (err) {
      setError('Failed to fetch user data');
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUser = async () => {
    if (isAuthenticated && !isCheckingAuth) {
      await fetchUser();
    }
  };

  // Handle initial mount and auth state changes
  useEffect(() => {
    if (!isCheckingAuth) {
      if (isAuthenticated) {
        fetchUser();
      } else {
        setUser(null);
        setError(null);
        setIsLoading(false);
      }
    }
  }, [isAuthenticated, isCheckingAuth]);

  return (
    <UserContext.Provider value={{ user, setUser, isLoading, error, refreshUser }}>
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}; 