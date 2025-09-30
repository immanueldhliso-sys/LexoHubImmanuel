/**
 * User Preferences API Service
 * Manages user preferences for advanced features toggle system
 */

import { BaseApiService, ApiResponse, ErrorType } from './base-api.service';
import { supabase } from '../../lib/supabase';
import { UserPreferences, FeatureCategory } from '../../types/advanced-features';

export interface UserPreferencesUpdate {
  advanced_features?: {
    financial_growth_tools?: boolean;
    ai_document_intelligence?: boolean;
    professional_development?: boolean;
  };
  feature_discovery?: {
    notification_shown?: boolean;
    notification_dismissed_at?: Date | null;
    first_login_date?: Date | null;
  };
}

class UserPreferencesService extends BaseApiService<UserPreferences> {
  // When the preferences table is missing in the Supabase project (404/PGRST205),
  // set this flag to avoid repeated noisy requests and gracefully fall back.
  private schemaUnavailable = false;

  constructor() {
    super('user_preferences', `
      id,
      user_id,
      advanced_features,
      feature_discovery,
      created_at,
      updated_at
    `);
  }

  /**
   * Get user preferences by user ID
   */
  async getByUserId(userId: string): Promise<ApiResponse<UserPreferences>> {
    // If we already detected the table is unavailable, return a benign response
    if (this.schemaUnavailable) {
      return { data: null, error: null };
    }

    const result = await this.executeQuery(async () => {
      return supabase
        .from(this.tableName)
        .select(this.selectFields)
        .eq('user_id', userId)
        .maybeSingle();
    });

    // Suppress errors when the table doesn't exist on the remote project
    if (result.error && (result.error.code === 'PGRST205' ||
      (result.error.message?.toLowerCase?.().includes('not found') ?? false))) {
      this.schemaUnavailable = true;
      return { data: null, error: null };
    }

    return result;
  }

  /**
   * Get current user's preferences
   */
  async getCurrentUserPreferences(): Promise<ApiResponse<UserPreferences>> {
    // If we already detected the table is unavailable, return a benign response
    if (this.schemaUnavailable) {
      return { data: null, error: null };
    }

    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      // Return a standardized error via BaseApiService to keep contracts consistent
      return { 
        data: null, 
        error: {
          type: ErrorType.AUTHENTICATION_ERROR,
          message: 'User not authenticated',
          timestamp: new Date(),
          requestId: `req_${Date.now()}_${Math.random().toString(36).substring(2)}`
        }
      };
    }

    const result = await this.executeQuery(async () => {
      return supabase
        .from(this.tableName)
        .select(this.selectFields)
        .eq('user_id', user.id)
        .maybeSingle();
    });

    // Suppress errors when the table doesn't exist on the remote project
    if (result.error && (result.error.code === 'PGRST205' ||
      (result.error.message?.toLowerCase?.().includes('not found') ?? false))) {
      this.schemaUnavailable = true;
      return { data: null, error: null };
    }

    return result;
  }

  /**
   * Create or update user preferences (upsert)
   */
  async upsertUserPreferences(
    userId: string, 
    preferences: UserPreferencesUpdate
  ): Promise<ApiResponse<UserPreferences>> {
    return this.executeQuery(async () => {
      // First try to get existing preferences
      const existing = await supabase
        .from(this.tableName)
        .select('*')
        .eq('user_id', userId)
        .single();

      if (existing.data) {
        // Update existing preferences
        const updatedData = {
          advanced_features: {
            ...existing.data.advanced_features,
            ...preferences.advanced_features
          },
          feature_discovery: {
            ...existing.data.feature_discovery,
            ...preferences.feature_discovery
          }
        };

        return supabase
          .from(this.tableName)
          .update(updatedData)
          .eq('user_id', userId)
          .select(this.selectFields)
          .single();
      } else {
        // Create new preferences
        const newData = {
          user_id: userId,
          advanced_features: {
            financial_growth_tools: false,
            ai_document_intelligence: false,
            professional_development: false,
            ...preferences.advanced_features
          },
          feature_discovery: {
            notification_shown: false,
            notification_dismissed_at: null,
            first_login_date: new Date(),
            ...preferences.feature_discovery
          }
        };

        return supabase
          .from(this.tableName)
          .insert(newData)
          .select(this.selectFields)
          .single();
      }
    });
  }

  /**
   * Update current user's preferences
   */
  async updateCurrentUserPreferences(
    preferences: UserPreferencesUpdate
  ): Promise<ApiResponse<UserPreferences>> {
    return this.executeQuery(async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      return this.upsertUserPreferences(user.id, preferences);
    });
  }

  /**
   * Toggle a specific feature category for current user
   */
  async toggleFeatureCategory(
    category: FeatureCategory, 
    enabled: boolean
  ): Promise<ApiResponse<UserPreferences>> {
    const preferences: UserPreferencesUpdate = {
      advanced_features: {
        [category]: enabled
      }
    };

    return this.updateCurrentUserPreferences(preferences);
  }

  /**
   * Mark feature discovery notification as shown
   */
  async markNotificationShown(): Promise<ApiResponse<UserPreferences>> {
    const preferences: UserPreferencesUpdate = {
      feature_discovery: {
        notification_shown: true
      }
    };

    return this.updateCurrentUserPreferences(preferences);
  }

  /**
   * Mark feature discovery notification as dismissed
   */
  async dismissNotification(): Promise<ApiResponse<UserPreferences>> {
    const preferences: UserPreferencesUpdate = {
      feature_discovery: {
        notification_shown: true,
        notification_dismissed_at: new Date()
      }
    };

    return this.updateCurrentUserPreferences(preferences);
  }

  /**
   * Check if user should see feature discovery notification
   */
  async shouldShowFeatureNotification(): Promise<ApiResponse<boolean>> {
    const response = await this.getCurrentUserPreferences();
    
    if (response.error) {
      // Suppress noisy errors for unauthenticated users, first-time users (no row yet),
      // or when the table is missing/not yet migrated.
      // - AUTHENTICATION_ERROR: user not signed in during early app mount
      // - NOT_FOUND_ERROR / PGRST116: `.single()` requested but no row exists yet
      // - PGRST205: table not found in schema cache (migrations not applied)
      const isBenignError = (
        response.error.type === ErrorType.AUTHENTICATION_ERROR ||
        response.error.type === ErrorType.NOT_FOUND_ERROR ||
        response.error.code === 'PGRST205'
      );

      if (isBenignError) {
        return { data: false, error: null };
      }

      return { data: false, error: response.error };
    }

    if (!response.data) {
      return { data: false, error: null };
    }

    const { feature_discovery } = response.data;
    
    // Don't show if already dismissed
    if (feature_discovery.notification_dismissed_at) {
      return { data: false, error: null };
    }

    // Don't show if already shown
    if (feature_discovery.notification_shown) {
      return { data: false, error: null };
    }

    // Show if user has been using the app for 7+ days
    if (feature_discovery.first_login_date) {
      const daysSinceFirstLogin = Math.floor(
        (Date.now() - new Date(feature_discovery.first_login_date).getTime()) / (1000 * 60 * 60 * 24)
      );
      return { data: daysSinceFirstLogin >= 7, error: null };
    }

    return { data: false, error: null };
  }

  /**
   * Get feature usage statistics for analytics
   */
  async getFeatureUsageStats(): Promise<ApiResponse<{
    total_users: number;
    users_with_features_enabled: number;
    feature_adoption_rates: Record<FeatureCategory, number>;
  }>> {
    return this.executeQuery(async () => {
      // Get total users count
      const totalUsersResponse = await supabase
        .from(this.tableName)
        .select('id', { count: 'exact', head: true });

      const totalUsers = totalUsersResponse.count || 0;

      // Get users with any features enabled
      const enabledUsersResponse = await supabase
        .from(this.tableName)
        .select('advanced_features')
        .neq('advanced_features->financial_growth_tools', false)
        .or('advanced_features->ai_document_intelligence.eq.true,advanced_features->professional_development.eq.true');

      // Calculate adoption rates for each category
      const financialEnabledResponse = await supabase
        .from(this.tableName)
        .select('id', { count: 'exact', head: true })
        .eq('advanced_features->financial_growth_tools', true);

      const aiEnabledResponse = await supabase
        .from(this.tableName)
        .select('id', { count: 'exact', head: true })
        .eq('advanced_features->ai_document_intelligence', true);

      const professionalEnabledResponse = await supabase
        .from(this.tableName)
        .select('id', { count: 'exact', head: true })
        .eq('advanced_features->professional_development', true);

      const stats = {
        total_users: totalUsers,
        users_with_features_enabled: enabledUsersResponse.data?.length || 0,
        feature_adoption_rates: {
          [FeatureCategory.FINANCIAL_GROWTH_TOOLS]: totalUsers > 0 ? (financialEnabledResponse.count || 0) / totalUsers : 0,
          [FeatureCategory.AI_DOCUMENT_INTELLIGENCE]: totalUsers > 0 ? (aiEnabledResponse.count || 0) / totalUsers : 0,
          [FeatureCategory.PROFESSIONAL_DEVELOPMENT]: totalUsers > 0 ? (professionalEnabledResponse.count || 0) / totalUsers : 0
        }
      };

      return { data: stats, error: null, count: undefined };
    });
  }

  /**
   * Initialize preferences for a new user
   */
  async initializeForNewUser(userId: string): Promise<ApiResponse<UserPreferences>> {
    const defaultPreferences: UserPreferencesUpdate = {
      advanced_features: {
        financial_growth_tools: false,
        ai_document_intelligence: false,
        professional_development: false
      },
      feature_discovery: {
        notification_shown: false,
        notification_dismissed_at: null,
        first_login_date: new Date()
      }
    };

    return this.upsertUserPreferences(userId, defaultPreferences);
  }

  /**
   * Reset user preferences to defaults
   */
  async resetToDefaults(): Promise<ApiResponse<UserPreferences>> {
    const defaultPreferences: UserPreferencesUpdate = {
      advanced_features: {
        financial_growth_tools: false,
        ai_document_intelligence: false,
        professional_development: false
      }
    };

    return this.updateCurrentUserPreferences(defaultPreferences);
  }

  /**
   * Bulk update preferences for multiple users (admin function)
   */
  async bulkUpdatePreferences(
    updates: { userId: string; preferences: UserPreferencesUpdate }[]
  ): Promise<ApiResponse<UserPreferences[]>> {
    const requestId = this.generateRequestId();

    try {
      const results: UserPreferences[] = [];
      const errors: any[] = [];

      // Execute updates in parallel
      const promises = updates.map(async ({ userId, preferences }) => {
        const response = await this.upsertUserPreferences(userId, preferences);
        if (response.error) {
          errors.push({ userId, error: response.error });
        } else if (response.data) {
          results.push(response.data);
        }
      });

      await Promise.all(promises);

      if (errors.length > 0) {
        return {
          data: null,
          error: {
            type: ErrorType.DATABASE_ERROR,
            message: `${errors.length} preference updates failed`,
            details: { errors },
            timestamp: new Date(),
            requestId
          }
        };
      }

      return { data: results, error: null };
    } catch (error) {
      return {
        data: null,
        error: this.transformError(error as Error, requestId)
      };
    }
  }

  // Private method to generate request ID (inherited from BaseApiService)
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  }
}

// Export singleton instance
export const userPreferencesService = new UserPreferencesService();
export default userPreferencesService;