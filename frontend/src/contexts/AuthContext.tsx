'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from 'react';
import { User } from '@/types/auth';
import api from '@/utils/api';
import { setAuthToken } from '@/utils/auth';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
    const refreshTokenInterval = setInterval(async () => {
      try {
        const response = await api.post('/auth/refresh-token');
        const { token } = response.data;
        sessionStorage.setItem('token', token);
      } catch (error) {
        logout();
      }
    }, 15 * 60 * 1000);

    return () => clearInterval(refreshTokenInterval);
  }, []);

  const checkAuth = async () => {
    try {
      const { data } = await api.get('/auth/me');
      setUser(data.user);
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const { data } = await api.post('/auth/login', { email, password });
    setUser(data.user);
    setAuthToken(data.token);
  };

  const signup = async (email: string, password: string, name: string) => {
    const { data } = await api.post('/auth/signup', { email, password, name });
    setUser(data.user);
    setAuthToken(data.token);
  };

  const logout = useCallback(() => {
    setUser(null);
    sessionStorage.removeItem('token');
    sessionStorage.clear();
    window.location.href = '/login';
  }, []);

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        loading, 
        login, 
        signup, 
        logout,
        isAuthenticated: !!user 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 