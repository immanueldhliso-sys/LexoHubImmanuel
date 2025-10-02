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
  user_role?: 'junior_advocate' | 'senior_counsel' | 'chambers_admin';
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
    user_role?: string;
  };
}

export class AuthService {
  private currentUser: ExtendedUser | null = null;
  private currentSession: Session | null = null;
  private authStateListeners: ((user: ExtendedUser | null) => void)[] = [];
  private sessionToken: string | null = null;
  private activityCheckInterval: NodeJS.Timeout | null = null;
  private isInitializing: boolean = false;
  private authStateSubscription: { data: { subscription: any } } | null = null;

  constructor() {
    this.initializeAuth();
  }

  private generateDeviceFingerprint(): string {
    const nav = window.navigator;
    const screen = window.screen;
    
    const components = [
      nav.userAgent,
      nav.language,
      screen.colorDepth,
      screen.width + 'x' + screen.height,
      new Date().getTimezoneOffset(),
      !!window.sessionStorage,
      !!window.localStorage,
    ];
    
    return btoa(components.join('###'));
  }

  private async checkAccountLockout(email: string): Promise<{ isLocked: boolean; lockedUntil?: Date }> {
    try {
      const { data, error } = await supabase.rpc('check_account_lockout', { p_email: email });
      
      if (error || !data || data.length === 0) {
        return { isLocked: false };
      }
      
      const lockout = data[0];
      return {
        isLocked: lockout.is_locked,
        lockedUntil: lockout.locked_until ? new Date(lockout.locked_until) : undefined
      };
    } catch (error) {
      console.error('Error checking account lockout:', error);
      return { isLocked: false };
    }
  }

  private async recordAuthAttempt(
    email: string,
    attemptType: 'login' | 'signup' | 'password_reset',
    success: boolean
  ): Promise<void> {
    try {
      await supabase.rpc('record_auth_attempt', {
        p_email: email,
        p_attempt_type: attemptType,
        p_success: success,
        p_ip_address: null,
        p_user_agent: navigator.userAgent
      });
    } catch (error) {
      console.error('Error recording auth attempt:', error);
    }
  }

  private async validatePasswordServerSide(password: string): Promise<{ valid: boolean; errors: string[] }> {
    try {
      const { data, error } = await supabase.rpc('validate_password_strength', { p_password: password });
      
      if (error || !data) {
        return { valid: false, errors: ['Unable to validate password'] };
      }
      
      return {
        valid: data.valid,
        errors: data.errors || []
      };
    } catch (error) {
      console.error('Error validating password:', error);
      return { valid: false, errors: ['Unable to validate password'] };
    }
  }

  private async createSessionRecord(userId: string): Promise<string | null> {
    try {
      const sessionToken = `${userId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const deviceFingerprint = this.generateDeviceFingerprint();
      
      await supabase.rpc('create_session', {
        p_user_id: userId,
        p_session_token: sessionToken,
        p_device_fingerprint: deviceFingerprint,
        p_ip_address: null,
        p_user_agent: navigator.userAgent,
        p_duration_hours: 24
      });
      
      return sessionToken;
    } catch (error) {
      console.error('Error creating session:', error);
      return null;
    }
  }

  private startActivityMonitoring(): void {
    if (this.activityCheckInterval) {
      clearInterval(this.activityCheckInterval);
    }

    const updateActivity = async () => {
      if (this.sessionToken && this.currentUser) {
        try {
          const { data, error } = await supabase.rpc('update_session_activity', {
            p_session_token: this.sessionToken
          });
          
          if (error || !data) {
            console.warn('Session expired or invalid');
            await this.signOut();
          }
        } catch (error) {
          console.error('Error updating session activity:', error);
        }
      }
    };

    this.activityCheckInterval = setInterval(updateActivity, 5 * 60 * 1000);

    ['mousedown', 'keydown', 'scroll', 'touchstart'].forEach(event => {
      document.addEventListener(event, () => {
        if (this.sessionToken) {
          updateActivity();
        }
      }, { passive: true });
    });
  }

  private async initializeAuth(): Promise<void> {
    if (this.isInitializing) {
      return;
    }
    this.isInitializing = true;

    try {
      const demoUser = localStorage.getItem('demo_user');
      const demoSession = localStorage.getItem('demo_session');
      
      if (demoUser && demoSession) {
        console.log('🎭 Found demo user in localStorage, using demo mode');
        const user = JSON.parse(demoUser) as ExtendedUser;
        const session = JSON.parse(demoSession);
        
        if (session.expires_at > Date.now()) {
          this.currentUser = user;
          this.currentSession = session;
          this.notifyAuthStateListeners();
          console.log('✅ Demo authentication successful:', user.user_metadata?.full_name);
          this.isInitializing = false;
          return;
        } else {
          localStorage.removeItem('demo_user');
          localStorage.removeItem('demo_session');
          console.log('⏰ Demo session expired, cleaning up');
        }
      }
      
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Error getting initial session:', error);
        this.isInitializing = false;
        return;
      }

      if (session) {
        await this.setCurrentSession(session);
        this.startActivityMonitoring();
      }

      this.notifyAuthStateListeners();

      this.authStateSubscription = supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        
        if (session) {
          await this.setCurrentSession(session);
          this.startActivityMonitoring();
        } else {
          this.currentUser = null;
          this.currentSession = null;
          this.sessionToken = null;
          if (this.activityCheckInterval) {
            clearInterval(this.activityCheckInterval);
            this.activityCheckInterval = null;
          }
        }

        this.notifyAuthStateListeners();
      });

    } catch (error) {
      console.error('Error initializing auth:', error);
    } finally {
      this.isInitializing = false;
    }
  }

  private async setCurrentSession(session: Session): Promise<void> {
    this.currentSession = session;
    
    if (session.user) {
      const profile = await this.loadAdvocateProfile(session.user.id);
      this.currentUser = {
        ...session.user,
        advocate_profile: profile
      };
    }
  }

  private async loadAdvocateProfile(userId: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('advocates')
        .select('full_name, practice_number, bar, specialisations, hourly_rate, user_role')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error loading advocate profile:', error);
        return null;
      }

      return data || null;
    } catch (error) {
      console.error('Error loading advocate profile:', error);
      return null;
    }
  }

  async signIn(email: string, password: string): Promise<AuthServiceResponse<{ user: User; session: Session }>> {
    try {
      const lockout = await this.checkAccountLockout(email);
      if (lockout.isLocked) {
        const minutes = lockout.lockedUntil 
          ? Math.ceil((lockout.lockedUntil.getTime() - Date.now()) / 60000)
          : 30;
        return {
          data: null,
          error: new Error(`Account locked. Try again in ${minutes} minutes.`)
        };
      }

      const credentials: SignInWithPasswordCredentials = { email, password };
      const { data, error } = await supabase.auth.signInWithPassword(credentials);

      await this.recordAuthAttempt(email, 'login', !error);

      if (error) {
        return { data: null, error };
      }

      if (data.user) {
        await this.updateLastLogin(data.user.id);
        await this.ensureAdvocateProfileExists(data.user);
        
        this.sessionToken = await this.createSessionRecord(data.user.id);
      }

      if (data.session) {
        await this.setCurrentSession(data.session);
        this.startActivityMonitoring();
        this.notifyAuthStateListeners();
      }

      return { data, error: null };
    } catch (error) {
      return { 
        data: null, 
        error: error instanceof Error ? error : new Error('Unknown sign in error') 
      };
    }
  }

  async signInWithMagicLink(email: string): Promise<AuthServiceResponse<void>> {
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/welcome`
        }
      });

      return { data: null, error };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error : new Error('Unknown magic link error')
      };
    }
  }

  async signUp(
    email: string, 
    password: string, 
    metadata: UserMetadata
  ): Promise<AuthServiceResponse<{ user: User; session: Session | null }>> {
    try {
      const passwordValidation = await this.validatePasswordServerSide(password);
      if (!passwordValidation.valid) {
        return {
          data: null,
          error: new Error(passwordValidation.errors[0] || 'Invalid password')
        };
      }

      const credentials: SignUpWithPasswordCredentials = {
        email,
        password,
        options: {
          data: metadata,
          emailRedirectTo: `${window.location.origin}/welcome`
        }
      };

      const { data, error } = await supabase.auth.signUp(credentials);

      await this.recordAuthAttempt(email, 'signup', !error);

      if (error) {
        return { data: null, error };
      }

      if (!data.user) {
        return { data: null, error: new Error('Signup failed - no user returned') };
      }

      return { data: { user: data.user, session: data.session }, error: null };
    } catch (error) {
      const message = error instanceof TypeError
        ? 'Unable to reach authentication server. Please ensure Supabase is running or configured.'
        : 'Unknown sign up error';
      return { 
        data: null, 
        error: new Error(message) 
      };
    }
  }

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

  async signOut(): Promise<AuthServiceResponse<void>> {
    try {
      if (this.activityCheckInterval) {
        clearInterval(this.activityCheckInterval);
        this.activityCheckInterval = null;
      }

      if (this.sessionToken && this.currentUser) {
        try {
          await supabase.rpc('revoke_session', {
            p_session_token: this.sessionToken,
            p_user_id: this.currentUser.id
          });
        } catch (err) {
          console.error('Error revoking session:', err);
        }
      }

      if (localStorage.getItem('demo_user')) {
        console.log('🎭 Signing out demo user');
        localStorage.removeItem('demo_user');
        localStorage.removeItem('demo_session');
        this.currentUser = null;
        this.currentSession = null;
        this.sessionToken = null;
        this.notifyAuthStateListeners();
        return { data: null, error: null };
      }
      
      const { error } = await supabase.auth.signOut();
      
      if (!error) {
        this.currentUser = null;
        this.currentSession = null;
        this.sessionToken = null;
      }

      return { data: null, error };
    } catch (error) {
      return { 
        data: null, 
        error: error instanceof Error ? error : new Error('Unknown sign out error') 
      };
    }
  }

  getCurrentUser(): ExtendedUser | null {
    return this.currentUser;
  }

  getCurrentSession(): Session | null {
    return this.currentSession;
  }

  isAuthenticated(): boolean {
    return this.currentUser !== null && this.currentSession !== null;
  }

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

  async updatePassword(newPassword: string): Promise<AuthServiceResponse<User>> {
    try {
      const passwordValidation = await this.validatePasswordServerSide(newPassword);
      if (!passwordValidation.valid) {
        return {
          data: null,
          error: new Error(passwordValidation.errors[0] || 'Invalid password')
        };
      }

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

  async resetPassword(email: string): Promise<AuthServiceResponse<void>> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });

      await this.recordAuthAttempt(email, 'password_reset', !error);

      return { data: null, error };
    } catch (error) {
      return { 
        data: null, 
        error: error instanceof Error ? error : new Error('Unknown password reset error') 
      };
    }
  }

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
        const profile = await this.loadAdvocateProfile(this.currentUser.id);
        if (this.currentUser) {
          this.currentUser.advocate_profile = profile;
          try {
            const { error: metaError } = await supabase.auth.updateUser({ data: updates as any });
            if (metaError) {
              console.warn('Failed to sync auth metadata:', metaError);
            } else {
              this.currentUser.user_metadata = {
                ...(this.currentUser.user_metadata || {}),
                ...updates
              } as any;
              this.notifyAuthStateListeners();
            }
          } catch (e) {
            console.warn('Error updating auth metadata:', e);
          }
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

  onAuthStateChange(callback: (user: ExtendedUser | null) => void): () => void {
    this.authStateListeners.push(callback);
    
    return () => {
      const index = this.authStateListeners.indexOf(callback);
      if (index > -1) {
        this.authStateListeners.splice(index, 1);
      }
    };
  }

  async getUserActiveSessions(): Promise<any[]> {
    if (!this.currentUser) {
      return [];
    }

    try {
      const { data, error } = await supabase.rpc('get_user_sessions', {
        p_user_id: this.currentUser.id
      });

      if (error) {
        console.error('Error fetching sessions:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching user sessions:', error);
      return [];
    }
  }

  async revokeSession(sessionToken: string): Promise<boolean> {
    if (!this.currentUser) {
      return false;
    }

    try {
      const { data, error } = await supabase.rpc('revoke_session', {
        p_session_token: sessionToken,
        p_user_id: this.currentUser.id
      });

      return !error && data;
    } catch (error) {
      console.error('Error revoking session:', error);
      return false;
    }
  }

  private notifyAuthStateListeners(): void {
    this.authStateListeners.forEach(callback => {
      try {
        callback(this.currentUser);
      } catch (error) {
        console.error('Error in auth state listener:', error);
      }
    });
  }

  getUserRole(): 'junior_advocate' | 'senior_counsel' | 'chambers_admin' {
    if (!this.currentUser) {
      return 'junior_advocate';
    }

    const profileRole = this.currentUser.advocate_profile?.user_role;
    if (profileRole === 'senior_counsel' || profileRole === 'chambers_admin') {
      return profileRole as 'senior_counsel' | 'chambers_admin';
    }

    const userType = this.currentUser.user_metadata?.user_type;
    const userRole = this.currentUser.user_metadata?.user_role;
    
    if (userRole === 'senior_counsel' || userRole === 'chambers_admin') {
      return userRole;
    }

    const currentYear = new Date().getFullYear();
    const yearsAdmitted = this.currentUser.user_metadata?.year_admitted;
    if (yearsAdmitted && (currentYear - yearsAdmitted) >= 10) {
      return 'senior_counsel';
    }

    if (userType === 'senior') {
      return 'senior_counsel';
    }

    return 'junior_advocate';
  }

  getUserRoles(): string[] {
    if (!this.currentUser?.advocate_profile) {
      return [];
    }

    const roles = ['advocate'];
    const userRole = this.getUserRole();
    
    roles.push(userRole);
    
    if (this.currentUser.advocate_profile.bar) {
      roles.push(`bar_${this.currentUser.advocate_profile.bar}`);
    }

    if (userRole === 'senior_counsel' || userRole === 'chambers_admin') {
      roles.push('senior_advocate');
    }

    return roles;
  }

  hasPermission(permission: string): boolean {
    const userRole = this.getUserRole();
    const roles = this.getUserRoles();
    
    const permissions: Record<string, string[]> = {
      'create_overflow_brief': ['advocate', 'senior_advocate', 'senior_counsel', 'chambers_admin'],
      'review_applications': ['advocate', 'senior_advocate', 'senior_counsel', 'chambers_admin'],
      'access_analytics': ['senior_advocate', 'senior_counsel', 'chambers_admin'],
      'manage_chambers': ['senior_advocate', 'senior_counsel', 'chambers_admin'],
      'delete_matters': ['senior_counsel', 'chambers_admin'],
      'delete_invoices': ['senior_counsel', 'chambers_admin'],
      'access_ai_features': ['senior_counsel', 'chambers_admin'],
      'access_strategic_finance': ['senior_counsel', 'chambers_admin'],
      'manage_integrations': ['senior_counsel', 'chambers_admin'],
      'export_reports': ['senior_counsel', 'chambers_admin'],
    };

    const requiredRoles = permissions[permission] || [];
    return requiredRoles.some(role => roles.includes(role)) || userRole === 'chambers_admin';
  }

  getFriendlyErrorMessage(error: AuthError | Error | null): string {
    if (!error) return '';
    const message = (error as AuthError).message || error.message || '';

    if (/Invalid login credentials/i.test(message)) return 'Incorrect email or password.';
    if (/Email not found/i.test(message)) return 'No account found with this email.';
    if (/already registered/i.test(message)) return 'An account with this email already exists.';
    if (/OTP.*expired/i.test(message)) return 'This link has expired. Request a new one.';
    if (/rate limit/i.test(message)) return 'Too many requests. Please wait and try again.';
    if (/Account locked/i.test(message)) return message;

    if (error instanceof TypeError) {
      return 'Unable to reach authentication server. Please check your connection.';
    }

    return message || 'An unexpected authentication error occurred.';
  }

  destroy(): void {
    if (this.activityCheckInterval) {
      clearInterval(this.activityCheckInterval);
      this.activityCheckInterval = null;
    }
    if (this.authStateSubscription) {
      this.authStateSubscription.data.subscription.unsubscribe();
    }
    this.authStateListeners = [];
  }
}

export const authService = new AuthService();
