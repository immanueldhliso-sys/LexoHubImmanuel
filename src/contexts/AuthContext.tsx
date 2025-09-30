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

export interface AuthContextType {
  user: ExtendedUser | null;
  loading: boolean;
  isLoading: boolean;
  operationLoading: {
    signIn: boolean;
    signUp: boolean;
    signOut: boolean;
    updateProfile: boolean;
  };
  sessionError: Error | null;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | Error | null }>;
  signInWithMagicLink: (email: string) => Promise<{ error: AuthError | Error | null }>;
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

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

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

  // Rate limiters (configurable via environment variables)
  const signInMaxAttempts = Number(import.meta.env.VITE_AUTH_SIGNIN_MAX_ATTEMPTS ?? 5);
  const signInWindowMs = Number(import.meta.env.VITE_AUTH_SIGNIN_WINDOW_MS ?? 60_000);
  const signUpMaxAttempts = Number(import.meta.env.VITE_AUTH_SIGNUP_MAX_ATTEMPTS ?? 3);
  const signUpWindowMs = Number(import.meta.env.VITE_AUTH_SIGNUP_WINDOW_MS ?? 300_000);
  const signInRateLimiter = createRateLimiter(signInMaxAttempts, signInWindowMs);
  const signUpRateLimiter = createRateLimiter(signUpMaxAttempts, signUpWindowMs);

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
    let isInitialized = false;

    const initialize = async () => {
      try {
        const cleanup = await initializeAuth();
        
        if (mounted) {
          // Set initial user state from auth service
          const currentUser = authService.getCurrentUser();
          setUser(currentUser);
          isInitialized = true;
          setLoading(false);
          
          // Subscribe to auth state changes
          unsubscribe = authService.onAuthStateChange((user) => {
            if (mounted) {
              setUser(user);
              // Only set loading to false after initial auth is complete
              if (isInitialized) {
                setLoading(false);
              }
            }
          });
        }

        return cleanup;
      } catch (error) {
        console.error('Auth initialization failed:', error);
        if (mounted) {
          setLoading(false);
          setSessionError(error as Error);
        }
      }
    };

    initialize();

    // Auto-refresh session every 15 minutes
    const refreshInterval = setInterval(async () => {
      if (mounted && isInitialized) {
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

  const signInWithMagicLink = async (email: string) => {
    if (!signInRateLimiter(email)) {
      return { error: new Error('Too many attempts. Please try again later.') };
    }
    setOperationLoading(prev => ({ ...prev, signIn: true }));
    try {
      const { error } = await authService.signInWithMagicLink(email);
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
    isLoading: loading || operationLoading.signIn || operationLoading.signUp || operationLoading.signOut || operationLoading.updateProfile,
    operationLoading,
    sessionError,
    signIn,
    signInWithMagicLink,
    signUp,
    signOut,
    updateProfile,
    resetPassword,
    refreshSession,
    rehydrate,
    clearCache,
    isAuthenticated: user !== null,
    hasPermission,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Export hooks as function declarations for Fast Refresh compatibility
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function useRequireAuth() {
  const { user, loading } = useAuth();
  
  useEffect(() => {
    if (!loading && !user) {
      // Redirect to login page
      window.location.href = '/login';
    }
  }, [user, loading]);

  return { user, loading };
}