import React, { createContext, useContext, useState, useEffect } from 'react';
import { useGetMe, User } from '@workspace/api-client-react';

type AuthContextType = {
  user: User | null;
  token: string | null;
  login: (token: string) => void;
  logout: () => void;
  isLoading: boolean;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(localStorage.getItem('quablog_token'));

  // Fetch user if token exists. If it fails, clear token.
  const { data: user, isLoading, isError } = useGetMe({
    query: {
      enabled: !!token,
      retry: false,
    }
  });

  useEffect(() => {
    if (isError) {
      localStorage.removeItem('quablog_token');
      setToken(null);
    }
  }, [isError]);

  const login = (newToken: string) => {
    localStorage.setItem('quablog_token', newToken);
    setToken(newToken);
  };

  const logout = () => {
    localStorage.removeItem('quablog_token');
    setToken(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user: user || null, token, login, logout, isLoading: isLoading && !!token }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
