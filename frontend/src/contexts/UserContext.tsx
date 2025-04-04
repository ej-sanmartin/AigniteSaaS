'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '@/types/auth';
import api from '@/utils/api';
import { useAuth } from './AuthContext';

interface UserContextType {
  user: User | null;
  isLoading: boolean;
  error: string | null;
}

const UserContext = createContext<UserContextType>({
  user: null,
  isLoading: true,
  error: null,
});

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const fetchUser = async () => {
      if (!isAuthenticated) {
        setUser(null);
        setIsLoading(false);
        return;
      }

      try {
        const response = await api.get('/users/profile');
        setUser(response.data);
      } catch (err) {
        setError('Failed to load user data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, [isAuthenticated]);

  return (
    <UserContext.Provider value={{ user, isLoading, error }}>
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