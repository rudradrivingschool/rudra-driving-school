import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface DriverUser {
  id: string;
  username: string;
  name: string;
  email: string;
  status: string;
  role: string; // Added role property
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
    // Query for driver by username
    const { data, error } = await supabase
      .from('drivers' as any)
      .select('id, username, password, name, email, status, role')
      .eq('username', username)
      .single();

    // Simple password check (NOTE: in production, store password hashes, never plain text!)
    if (!error && data && (data as any).password === password) {
      // Remove password before storing
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...safeUser } = data as any;
      setUser(safeUser);
      localStorage.setItem('driver_user', JSON.stringify(safeUser));
      setLoading(false);
      return { error: null };
    }
    setLoading(false);
    return { error: { message: 'Invalid username or password' } };
  };

  const signOut = async () => {
    setUser(null);
    localStorage.removeItem('driver_user');
  };

  const value: AuthContextType = {
    user,
    loading,
    signIn,
    signOut
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
