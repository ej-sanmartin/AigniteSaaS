'use client';

import { createContext, useContext, ReactNode, useMemo } from 'react';
import { useAuthState } from './hooks/useAuthState';
import { useAuthActions } from './hooks/useAuthActions';
import { useAuthEffects } from './hooks/useAuthEffects';
import { AuthContextType } from './utils/constants';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const state = useAuthState();
  const actions = useAuthActions();
  const effects = useAuthEffects();

  const value = useMemo(() => ({
    ...state,
    ...actions,
    ...effects,
    isAuthenticated: state.isAuthenticated
  }), [state, actions, effects]);

  return (
    <AuthContext.Provider value={value}>
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