/**
 * Authentication Context
 * Provides authentication state and methods throughout the application
 */
import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import React from 'react';
import { authService, type ExtendedUser, type UserMetadata } from '../services/auth.service';
import type { AuthError } from '@supabase/supabase-js';

export interface AuthContextType {
  user: ExtendedUser | null;
  loading: boolean;
  isLoading: boolean;
  isInitializing: boolean;
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
  const [isInitializing, setIsInitializing] = useState(true);

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
        setIsInitializing(true);
        const cleanup = await initializeAuth();
        
        if (mounted) {
          const currentUser = authService.getCurrentUser();
          setUser(currentUser);
          isInitialized = true;
          setLoading(false);
          setIsInitializing(false);
          
          unsubscribe = authService.onAuthStateChange((user) => {
            if (mounted) {
              setUser(user);
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
          setIsInitializing(false);
          setSessionError(error as Error);
        }
      }
    };

    initialize();

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
    setOperationLoading(prev => ({ ...prev, signIn: true }));
    try {
      const { error } = await authService.signIn(email, password);
      return { error };
    } finally {
      setOperationLoading(prev => ({ ...prev, signIn: false }));
    }
  };

  const signInWithMagicLink = async (email: string) => {
    setOperationLoading(prev => ({ ...prev, signIn: true }));
    try {
      const { error } = await authService.signInWithMagicLink(email);
      return { error };
    } finally {
      setOperationLoading(prev => ({ ...prev, signIn: false }));
    }
  };

  const signUp = async (email: string, password: string, metadata: UserMetadata) => {
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
    
    setUser(current => current ? { ...current, ...updates } : null);
    
    setOperationLoading(prev => ({ ...prev, updateProfile: true }));
    try {
      const { error } = await authService.updateAdvocateProfile(updates);
      
      if (error) {
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
    isInitializing,
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