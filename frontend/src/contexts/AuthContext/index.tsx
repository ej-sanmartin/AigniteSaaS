'use client';

import { createContext, useContext, ReactNode, useEffect } from 'react';
import { useAuthState } from './hooks/useAuthState';
import { useAuthEffects } from './hooks/useAuthEffects';

export interface AuthContextType {
  isAuthenticated: boolean;
  setIsAuthenticated: (value: boolean) => void;
  isLoading: boolean;
  setIsLoading: (value: boolean) => void;
  error: { message: string; code?: string } | null;
  setError: (error: { message: string; code?: string } | null) => void;
  clearError: () => void;
  checkAuth: () => Promise<boolean>;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, firstName: string, lastName: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshTimeout: NodeJS.Timeout | null;
  clearRefreshTimeout: () => void;
  scheduleTokenRefresh: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const authState = useAuthState();
  const authEffects = useAuthEffects();

  const contextValue = { ...authState, ...authEffects };

  return (
    <AuthContext.Provider value={contextValue}>
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