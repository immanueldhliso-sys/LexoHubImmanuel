/**
 * Authentication Context
 * Provides authentication state and methods throughout the application
 */

import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { authService, type ExtendedUser, type UserMetadata } from '../services/auth.service';
import type { AuthError } from '@supabase/supabase-js';

// Rate limiter utility
const createRateLimiter = (maxAttempts: number, windowMs: number) => {
  const attempts = new Map<string, number[]>();
  
  return (key: string): boolean => {
    const now = Date.now();
    const userAttempts = attempts.get(key) || [];
    const recentAttempts = userAttempts.filter(time => now - time < windowMs);
    
    if (recentAttempts.length >= maxAttempts) {
      return false;
    }
    
    attempts.set(key, [...recentAttempts, now]);
    return true;
  };
};

interface AuthContextType {
  user: ExtendedUser | null;
  loading: boolean;
  operationLoading: {
    signIn: boolean;
    signUp: boolean;
    signOut: boolean;
    updateProfile: boolean;
  };
  sessionError: Error | null;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | Error | null }>;
  signUp: (email: string, password: string, metadata: UserMetadata) => Promise<{ error: AuthError | Error | null }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<UserMetadata>) => Promise<{ error: AuthError | Error | null }>;
  resetPassword: (email: string) => Promise<{ error: AuthError | Error | null }>;
  refreshSession: () => Promise<{ error: AuthError | Error | null }>;
  rehydrate: () => Promise<void>;
  clearCache: () => void;
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
  const [operationLoading, setOperationLoading] = useState({
    signIn: false,
    signUp: false,
    signOut: false,
    updateProfile: false,
  });
  const [sessionError, setSessionError] = useState<Error | null>(null);

  // Rate limiters
  const signInRateLimiter = createRateLimiter(5, 60000); // 5 attempts per minute
  const signUpRateLimiter = createRateLimiter(3, 300000); // 3 attempts per 5 minutes

  // Initialize auth with retry logic
  const initializeAuth = useCallback(async () => {
    const maxRetries = 3;
    let retryCount = 0;
    let mounted = true;

    while (retryCount < maxRetries && mounted) {
      try {
        const currentUser = authService.getCurrentUser();
        if (mounted) {
          setUser(currentUser);
          setSessionError(null);
        }
        break;
      } catch (error) {
        retryCount++;
        if (retryCount === maxRetries) {
          console.error('Failed to initialize auth after retries:', error);
          if (mounted) {
            setSessionError(error as Error);
          }
        } else {
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
        }
      }
    }
    
    if (mounted) {
      setLoading(false);
    }

    return () => {
      mounted = false;
    };
  }, []);

  // Rehydrate auth state
  const rehydrate = useCallback(async () => {
    setLoading(true);
    try {
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
      setSessionError(null);
    } catch (error) {
      setSessionError(error as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Clear cache
  const clearCache = useCallback(() => {
    setUser(null);
    setSessionError(null);
    setOperationLoading({
      signIn: false,
      signUp: false,
      signOut: false,
      updateProfile: false,
    });
  }, []);

  // Session refresh
  const refreshSession = useCallback(async () => {
    try {
      const { error } = await authService.refreshSession();
      if (error) {
        setSessionError(error);
      } else {
        setSessionError(null);
      }
      return { error };
    } catch (error) {
      const err = error as Error;
      setSessionError(err);
      return { error: err };
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    let unsubscribe: (() => void) | undefined;

    const initialize = async () => {
      const cleanup = await initializeAuth();
      
      if (mounted) {
        // Subscribe to auth state changes
        unsubscribe = authService.onAuthStateChange((user) => {
          if (mounted) {
            setUser(user);
            setLoading(false);
          }
        });
      }

      return cleanup;
    };

    initialize();

    // Auto-refresh session every 15 minutes
    const refreshInterval = setInterval(async () => {
      if (mounted) {
        try {
          await refreshSession();
        } catch (error) {
          console.error('Session refresh failed:', error);
        }
      }
    }, 15 * 60 * 1000);

    return () => {
      mounted = false;
      unsubscribe?.();
      clearInterval(refreshInterval);
    };
  }, [initializeAuth, refreshSession]);

  const signIn = async (email: string, password: string) => {
    if (!signInRateLimiter(email)) {
      return { error: new Error('Too many attempts. Please try again later.') };
    }

    setOperationLoading(prev => ({ ...prev, signIn: true }));
    try {
      const { error } = await authService.signIn(email, password);
      return { error };
    } finally {
      setOperationLoading(prev => ({ ...prev, signIn: false }));
    }
  };

  const signUp = async (email: string, password: string, metadata: UserMetadata) => {
    if (!signUpRateLimiter(email)) {
      return { error: new Error('Too many registration attempts. Please try again later.') };
    }

    setOperationLoading(prev => ({ ...prev, signUp: true }));
    try {
      const { error } = await authService.signUp(email, password, metadata);
      return { error };
    } finally {
      setOperationLoading(prev => ({ ...prev, signUp: false }));
    }
  };

  const signOut = async () => {
    setOperationLoading(prev => ({ ...prev, signOut: true }));
    try {
      await authService.signOut();
    } finally {
      setOperationLoading(prev => ({ ...prev, signOut: false }));
    }
  };

  const updateProfile = async (updates: Partial<UserMetadata>) => {
    const previousUser = user;
    
    // Optimistic update
    setUser(current => current ? { ...current, ...updates } : null);
    
    setOperationLoading(prev => ({ ...prev, updateProfile: true }));
    try {
      const { error } = await authService.updateAdvocateProfile(updates);
      
      if (error) {
        // Rollback on error
        setUser(previousUser);
      }
      
      return { error };
    } finally {
      setOperationLoading(prev => ({ ...prev, updateProfile: false }));
    }
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
    operationLoading,
    sessionError,
    signIn,
    signUp,
    signOut,
    updateProfile,
    resetPassword,
    refreshSession,
    rehydrate,
    clearCache,
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

// Hook for protected routes - keeping existing behavior since app doesn't use React Router
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