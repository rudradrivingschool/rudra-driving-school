/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiClient } from '@/lib/api/client';

interface DriverUser {
  id: string;
  username: string;
  name: string;
  email: string;
  status: string;
  role: string;
}

interface AuthContextType {
  user: DriverUser | null;
  loading: boolean;
  signIn: (username: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<DriverUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for user's session in localStorage
    const storedUser = localStorage.getItem('driver_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const signIn = async (username: string, password: string) => {
    setLoading(true);
    try {
      const response = await apiClient.signIn(username, password);

      setUser(response.user);
      localStorage.setItem('driver_user', JSON.stringify(response.user));
      setLoading(false);
      return { error: null };
    } catch (error) {
      console.error('Sign in error:', error);
      setLoading(false);
      return {
        error: {
          message:
            error instanceof Error
              ? error.message
              : 'An error occurred during sign in',
        },
      };
    }
  };

  const signOut = async () => {
    setUser(null);
    localStorage.removeItem('driver_user');
  };

  const value: AuthContextType = {
    user,
    loading,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
