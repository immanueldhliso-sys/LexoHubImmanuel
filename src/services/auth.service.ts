/**
 * Authentication Service
 * Handles user authentication, session management, and user profile operations
 */

import { supabase } from '../lib/supabase';
import type { 
  User, 
  Session, 
  AuthError, 
  SignInWithPasswordCredentials,
  SignUpWithPasswordCredentials
} from '@supabase/supabase-js';

export interface UserMetadata {
  full_name: string;
  initials: string;
  practice_number: string;
  bar: 'johannesburg' | 'cape_town';
  year_admitted: number;
  specialisations: string[];
  hourly_rate: number;
  phone_number?: string;
  chambers_address?: string;
  user_type?: 'junior' | 'senior';
}

export interface AuthServiceResponse<T = any> {
  data: T | null;
  error: AuthError | Error | null;
}

export interface ExtendedUser extends User {
  advocate_profile?: {
    full_name: string;
    practice_number: string;
    bar: string;
    specialisations: string[];
    hourly_rate: number;
  };
}

export class AuthService {
  private currentUser: ExtendedUser | null = null;
  private currentSession: Session | null = null;
  private authStateListeners: ((user: ExtendedUser | null) => void)[] = [];

  constructor() {
    this.initializeAuth();
  }

  /**
   * Initialize authentication state
   */
  private async initializeAuth(): Promise<void> {
    try {
      // Check for demo user first
      const demoUser = localStorage.getItem('demo_user');
      const demoSession = localStorage.getItem('demo_session');
      
      if (demoUser && demoSession) {
        console.log('🎭 Found demo user in localStorage, using demo mode');
        const user = JSON.parse(demoUser) as ExtendedUser;
        const session = JSON.parse(demoSession);
        
        // Check if demo session is still valid (1 hour)
        if (session.expires_at > Date.now()) {
          this.currentUser = user;
          this.currentSession = session;
          this.notifyAuthStateListeners();
          console.log('✅ Demo authentication successful:', user.user_metadata?.full_name);
          return;
        } else {
          // Demo session expired, clean up
          localStorage.removeItem('demo_user');
          localStorage.removeItem('demo_session');
          console.log('⏰ Demo session expired, cleaning up');
        }
      }
      
      // Get initial session from Supabase
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Error getting initial session:', error);
        return;
      }

      if (session) {
        await this.setCurrentSession(session);
      }

      // Listen for auth changes
      supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        
        if (session) {
          await this.setCurrentSession(session);
        } else {
          this.currentUser = null;
          this.currentSession = null;
        }

        // Notify listeners
        this.notifyAuthStateListeners();
      });

    } catch (error) {
      console.error('Error initializing auth:', error);
    }
  }

  /**
   * Set current session and load user profile
   */
  private async setCurrentSession(session: Session): Promise<void> {
    this.currentSession = session;
    
    if (session.user) {
      // Load advocate profile
      const profile = await this.loadAdvocateProfile(session.user.id);
      this.currentUser = {
        ...session.user,
        advocate_profile: profile
      };
    }
  }

  /**
   * Load advocate profile from database
   */
  private async loadAdvocateProfile(userId: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('advocates')
        .select('full_name, practice_number, bar, specialisations, hourly_rate')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error loading advocate profile:', error);
        return null;
      }

      // When no profile exists yet, return null gracefully
      return data || null;
    } catch (error) {
      console.error('Error loading advocate profile:', error);
      return null;
    }
  }

  /**
   * Sign in with email and password
   */
  async signIn(email: string, password: string): Promise<AuthServiceResponse<{ user: User; session: Session }>> {
    try {
      const credentials: SignInWithPasswordCredentials = { email, password };
      const { data, error } = await supabase.auth.signInWithPassword(credentials);

      if (error) {
        return { data: null, error };
      }

      // Update last login
      if (data.user) {
        await this.updateLastLogin(data.user.id);
        // Ensure advocate profile exists after successful authentication
        await this.ensureAdvocateProfileExists(data.user);
      }

      return { data, error: null };
    } catch (error) {
      return { 
        data: null, 
        error: error instanceof Error ? error : new Error('Unknown sign in error') 
      };
    }
  }

  /**
   * Sign up with email, password, and advocate metadata
   */
  async signUp(
    email: string, 
    password: string, 
    metadata: UserMetadata
  ): Promise<AuthServiceResponse<{ user: User; session: Session | null }>> {
    try {
      const credentials: SignUpWithPasswordCredentials = {
        email,
        password,
        options: {
          data: metadata,
          // Send users back to the dedicated post-confirmation page
          emailRedirectTo: `${window.location.origin}/welcome`
        }
      };

      const { data, error } = await supabase.auth.signUp(credentials);

      if (error) {
        return { data: null, error };
      }

      // Defer advocate profile creation until the user is authenticated.
      // We'll ensure the profile exists after the first successful login.

      return { data, error: null };
    } catch (error) {
      // Provide a clearer error message when the auth server is unreachable
      const message = error instanceof TypeError
        ? 'Unable to reach authentication server. Please ensure Supabase is running or configured.'
        : 'Unknown sign up error';
      return { 
        data: null, 
        error: new Error(message) 
      };
    }
  }

  /**
   * Create advocate profile in database
   */
  private async createAdvocateProfile(userId: string, userEmail: string | null, metadata: UserMetadata): Promise<Error | null> {
    try {
      const { error } = await supabase
        .from('advocates')
        .insert({
          id: userId,
          email: userEmail || '',
          full_name: metadata.full_name,
          initials: metadata.initials,
          practice_number: metadata.practice_number,
          bar: metadata.bar,
          year_admitted: metadata.year_admitted,
          specialisations: metadata.specialisations,
          hourly_rate: metadata.hourly_rate,
          phone_number: metadata.phone_number,
          chambers_address: metadata.chambers_address,
          notification_preferences: { email: true, whatsapp: false, sms: false },
          invoice_settings: { auto_remind: true, reminder_days: [30, 45, 55] },
          is_active: true,
          total_outstanding: 0,
          total_collected_ytd: 0,
          matters_count: 0
        });

      return error;
    } catch (error) {
      return error instanceof Error ? error : new Error('Unknown profile creation error');
    }
  }

  /**
   * Ensure an advocate profile exists for an authenticated user.
   * If not present, create it using user_metadata from Supabase auth.
   */
  private async ensureAdvocateProfileExists(user: User): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('advocates')
        .select('id')
        .eq('id', user.id)
        .maybeSingle();

      if (error) {
        console.warn('Error checking advocate profile existence:', error);
        return;
      }

      if (!data) {
        const md: any = user.user_metadata || {};

        const metadata: UserMetadata = {
          full_name: md.full_name || user.email || 'New Advocate',
          initials: md.initials || (md.full_name ? md.full_name.split(' ').map((w: string) => w[0]).join('').toUpperCase() : 'NA'),
          practice_number: md.practice_number || 'UNKNOWN',
          bar: md.bar || 'johannesburg',
          year_admitted: md.year_admitted || new Date().getFullYear(),
          specialisations: md.specialisations || [],
          hourly_rate: md.hourly_rate || 0,
          phone_number: md.phone_number,
          chambers_address: md.chambers_address,
          user_type: md.user_type,
        };

        const createError = await this.createAdvocateProfile(user.id, user.email || null, metadata);
        if (createError) {
          console.error('Error creating advocate profile post-login:', createError);
        }
      }
    } catch (e) {
      console.error('Failed to ensure advocate profile exists:', e);
    }
  }

  /**
   * Sign out current user
   */
  async signOut(): Promise<AuthServiceResponse<void>> {
    try {
      // Check if we're in demo mode
      if (localStorage.getItem('demo_user')) {
        console.log('🎭 Signing out demo user');
        localStorage.removeItem('demo_user');
        localStorage.removeItem('demo_session');
        this.currentUser = null;
        this.currentSession = null;
        this.notifyAuthStateListeners();
        return { data: null, error: null };
      }
      
      // Regular Supabase sign out
      const { error } = await supabase.auth.signOut();
      
      if (!error) {
        this.currentUser = null;
        this.currentSession = null;
      }

      return { data: null, error };
    } catch (error) {
      return { 
        data: null, 
        error: error instanceof Error ? error : new Error('Unknown sign out error') 
      };
    }
  }

  /**
   * Get current user
   */
  getCurrentUser(): ExtendedUser | null {
    return this.currentUser;
  }

  /**
   * Get current session
   */
  getCurrentSession(): Session | null {
    return this.currentSession;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.currentUser !== null && this.currentSession !== null;
  }

  /**
   * Refresh current session
   */
  async refreshSession(): Promise<AuthServiceResponse<Session>> {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      
      if (data.session) {
        await this.setCurrentSession(data.session);
      }

      return { data: data.session, error };
    } catch (error) {
      return { 
        data: null, 
        error: error instanceof Error ? error : new Error('Unknown refresh error') 
      };
    }
  }

  /**
   * Update user password
   */
  async updatePassword(newPassword: string): Promise<AuthServiceResponse<User>> {
    try {
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword
      });

      return { data: data.user, error };
    } catch (error) {
      return { 
        data: null, 
        error: error instanceof Error ? error : new Error('Unknown password update error') 
      };
    }
  }

  /**
   * Update user email
   */
  async updateEmail(newEmail: string): Promise<AuthServiceResponse<User>> {
    try {
      const { data, error } = await supabase.auth.updateUser({
        email: newEmail
      });

      return { data: data.user, error };
    } catch (error) {
      return { 
        data: null, 
        error: error instanceof Error ? error : new Error('Unknown email update error') 
      };
    }
  }

  /**
   * Reset password via email
   */
  async resetPassword(email: string): Promise<AuthServiceResponse<void>> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });

      return { data: null, error };
    } catch (error) {
      return { 
        data: null, 
        error: error instanceof Error ? error : new Error('Unknown password reset error') 
      };
    }
  }

  /**
   * Update advocate profile
   */
  async updateAdvocateProfile(updates: Partial<UserMetadata>): Promise<AuthServiceResponse<void>> {
    if (!this.currentUser) {
      return { data: null, error: new Error('No authenticated user') };
    }

    try {
      const { error } = await supabase
        .from('advocates')
        .update(updates)
        .eq('id', this.currentUser.id);

      if (!error) {
        // Reload profile
        const profile = await this.loadAdvocateProfile(this.currentUser.id);
        if (this.currentUser) {
          this.currentUser.advocate_profile = profile;
        }
      }

      return { data: null, error };
    } catch (error) {
      return { 
        data: null, 
        error: error instanceof Error ? error : new Error('Unknown profile update error') 
      };
    }
  }

  /**
   * Update last login timestamp
   */
  private async updateLastLogin(userId: string): Promise<void> {
    try {
      await supabase
        .from('advocates')
        .update({ last_login_at: new Date().toISOString() })
        .eq('id', userId);
    } catch (error) {
      console.error('Error updating last login:', error);
    }
  }

  /**
   * Add auth state change listener
   */
  onAuthStateChange(callback: (user: ExtendedUser | null) => void): () => void {
    this.authStateListeners.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.authStateListeners.indexOf(callback);
      if (index > -1) {
        this.authStateListeners.splice(index, 1);
      }
    };
  }

  /**
   * Notify all auth state listeners
   */
  private notifyAuthStateListeners(): void {
    this.authStateListeners.forEach(callback => {
      try {
        callback(this.currentUser);
      } catch (error) {
        console.error('Error in auth state listener:', error);
      }
    });
  }

  /**
   * Get user permissions/roles
   */
  getUserRoles(): string[] {
    if (!this.currentUser?.advocate_profile) {
      return [];
    }

    const roles = ['advocate'];
    
    // Add role based on bar association
    if (this.currentUser.advocate_profile.bar) {
      roles.push(`bar_${this.currentUser.advocate_profile.bar}`);
    }

    // Add role based on seniority (example logic)
    const currentYear = new Date().getFullYear();
    const yearsAdmitted = this.currentUser.user_metadata?.year_admitted;
    if (yearsAdmitted && (currentYear - yearsAdmitted) >= 10) {
      roles.push('senior_advocate');
    }

    return roles;
  }

  /**
   * Check if user has specific permission
   */
  hasPermission(permission: string): boolean {
    const roles = this.getUserRoles();
    
    // Define permission mappings
    const permissions: Record<string, string[]> = {
      'create_overflow_brief': ['advocate', 'senior_advocate'],
      'review_applications': ['advocate', 'senior_advocate'],
      'access_analytics': ['senior_advocate'],
      'manage_chambers': ['senior_advocate'],
    };

    const requiredRoles = permissions[permission] || [];
    return requiredRoles.some(role => roles.includes(role));
  }
}

// Export singleton instance
export const authService = new AuthService();