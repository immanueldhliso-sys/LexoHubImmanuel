/**
 * Authentication Context
 * Provides authentication state and methods throughout the application
 */

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { authService, type ExtendedUser, type UserMetadata } from '../services/auth.service';
import type { AuthError } from '@supabase/supabase-js';

interface AuthContextType {
  user: ExtendedUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | Error | null }>;
  signUp: (email: string, password: string, metadata: UserMetadata) => Promise<{ error: AuthError | Error | null }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<UserMetadata>) => Promise<{ error: AuthError | Error | null }>;
  resetPassword: (email: string) => Promise<{ error: AuthError | Error | null }>;
  isAuthenticated: boolean;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<ExtendedUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initialize auth state
    const initializeAuth = async () => {
      try {
        const currentUser = authService.getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Subscribe to auth state changes
    const unsubscribe = authService.onAuthStateChange((user) => {
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { error } = await authService.signIn(email, password);
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, metadata: UserMetadata) => {
    setLoading(true);
    try {
      const { error } = await authService.signUp(email, password, metadata);
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      await authService.signOut();
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<UserMetadata>) => {
    const { error } = await authService.updateAdvocateProfile(updates);
    return { error };
  };

  const resetPassword = async (email: string) => {
    const { error } = await authService.resetPassword(email);
    return { error };
  };

  const hasPermission = (permission: string): boolean => {
    return authService.hasPermission(permission);
  };

  const value: AuthContextType = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    updateProfile,
    resetPassword,
    isAuthenticated: authService.isAuthenticated(),
    hasPermission,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Hook for protected routes
export const useRequireAuth = () => {
  const { user, loading } = useAuth();
  
  useEffect(() => {
    if (!loading && !user) {
      // Redirect to login page
      window.location.href = '/login';
    }
  }, [user, loading]);

  return { user, loading };
};