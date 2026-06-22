import { createContext, useContext, type ReactNode } from 'react';
import { useMe } from '../hooks/useAuth';
import type { User } from '../types';
import { tokenStorage } from '../lib/tokenStorage';

interface AuthContextValue {
  user: User | null | undefined;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const hasToken = !!tokenStorage.getAccessToken();
  const { data: user, isLoading } = useMe(hasToken);

  const value: AuthContextValue = {
    user: user ?? null,
    isLoading: hasToken && isLoading,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  return useContext(AuthContext);
}
