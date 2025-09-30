/**
 * Settings Service
 * Handles all application settings and user preferences
 */

import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';

export interface UserSettings {
  id: string;
  userId: string;
  firmName: string;
  practiceAreas: string[];
  defaultHourlyRate: number;
  currency: string;
  timeZone: string;
  workingHours: {
    start: string;
    end: string;
  };
  billingCycle: 'weekly' | 'monthly' | 'quarterly';
  notifications: {
    emailReminders: boolean;
    smsAlerts: boolean;
    invoiceUpdates: boolean;
    matterDeadlines: boolean;
    paymentReceived: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

export interface SettingsUpdateRequest {
  firmName?: string;
  practiceAreas?: string[];
  defaultHourlyRate?: number;
  currency?: string;
  timeZone?: string;
  workingHours?: {
    start: string;
    end: string;
  };
  billingCycle?: 'weekly' | 'monthly' | 'quarterly';
  notifications?: {
    emailReminders?: boolean;
    smsAlerts?: boolean;
    invoiceUpdates?: boolean;
    matterDeadlines?: boolean;
    paymentReceived?: boolean;
  };
}

export class SettingsService {
  /**
   * Get user settings
   */
  static async getUserSettings(): Promise<UserSettings | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No settings found, create default settings
          return this.createDefaultSettings(user.id);
        }
        throw error;
      }

      return {
        id: data.id,
        userId: data.user_id,
        firmName: data.firm_name,
        practiceAreas: data.practice_areas || [],
        defaultHourlyRate: data.default_hourly_rate,
        currency: data.currency,
        timeZone: data.time_zone,
        workingHours: data.working_hours,
        billingCycle: data.billing_cycle,
        notifications: data.notifications,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
    } catch (error) {
      console.error('Error fetching user settings:', error);
      throw new Error('Failed to fetch user settings');
    }
  }

  /**
   * Update user settings
   */
  static async updateUserSettings(updates: SettingsUpdateRequest): Promise<UserSettings> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Prepare update data
      const updateData: Record<string, unknown> = {};
      
      if (updates.firmName !== undefined) updateData.firm_name = updates.firmName;
      if (updates.practiceAreas !== undefined) updateData.practice_areas = updates.practiceAreas;
      if (updates.defaultHourlyRate !== undefined) updateData.default_hourly_rate = updates.defaultHourlyRate;
      if (updates.currency !== undefined) updateData.currency = updates.currency;
      if (updates.timeZone !== undefined) updateData.time_zone = updates.timeZone;
      if (updates.workingHours !== undefined) updateData.working_hours = updates.workingHours;
      if (updates.billingCycle !== undefined) updateData.billing_cycle = updates.billingCycle;
      if (updates.notifications !== undefined) {
        // Merge with existing notifications
        const currentSettings = await this.getUserSettings();
        updateData.notifications = {
          ...currentSettings?.notifications,
          ...updates.notifications
        };
      }

      updateData.updated_at = new Date().toISOString();

      const { data, error } = await supabase
        .from('user_settings')
        .update(updateData)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      toast.success('Settings updated successfully');

      return {
        id: data.id,
        userId: data.user_id,
        firmName: data.firm_name,
        practiceAreas: data.practice_areas || [],
        defaultHourlyRate: data.default_hourly_rate,
        currency: data.currency,
        timeZone: data.time_zone,
        workingHours: data.working_hours,
        billingCycle: data.billing_cycle,
        notifications: data.notifications,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
    } catch (error) {
      console.error('Error updating user settings:', error);
      toast.error('Failed to update settings');
      throw new Error('Failed to update user settings');
    }
  }

  /**
   * Reset settings to defaults
   */
  static async resetToDefaults(): Promise<UserSettings> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const defaultSettings = {
        firm_name: 'My Law Practice',
        practice_areas: ['Commercial Litigation', 'Employment Law', 'Contract Law'],
        default_hourly_rate: 2500,
        currency: 'ZAR',
        time_zone: 'Africa/Johannesburg',
        working_hours: { start: '08:00', end: '17:00' },
        billing_cycle: 'monthly',
        notifications: {
          emailReminders: true,
          smsAlerts: false,
          invoiceUpdates: true,
          matterDeadlines: true,
          paymentReceived: true
        },
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('user_settings')
        .update(defaultSettings)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      toast.success('Settings reset to defaults');

      return {
        id: data.id,
        userId: data.user_id,
        firmName: data.firm_name,
        practiceAreas: data.practice_areas || [],
        defaultHourlyRate: data.default_hourly_rate,
        currency: data.currency,
        timeZone: data.time_zone,
        workingHours: data.working_hours,
        billingCycle: data.billing_cycle,
        notifications: data.notifications,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
    } catch (error) {
      console.error('Error resetting settings:', error);
      toast.error('Failed to reset settings');
      throw new Error('Failed to reset settings');
    }
  }

  /**
   * Create default settings for new user
   */
  private static async createDefaultSettings(userId: string): Promise<UserSettings> {
    const defaultSettings = {
      user_id: userId,
      firm_name: 'My Law Practice',
      practice_areas: ['Commercial Litigation', 'Employment Law', 'Contract Law'],
      default_hourly_rate: 2500,
      currency: 'ZAR',
      time_zone: 'Africa/Johannesburg',
      working_hours: { start: '08:00', end: '17:00' },
      billing_cycle: 'monthly',
      notifications: {
        emailReminders: true,
        smsAlerts: false,
        invoiceUpdates: true,
        matterDeadlines: true,
        paymentReceived: true
      }
    };

    const { data, error } = await supabase
      .from('user_settings')
      .insert(defaultSettings)
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      userId: data.user_id,
      firmName: data.firm_name,
      practiceAreas: data.practice_areas || [],
      defaultHourlyRate: data.default_hourly_rate,
      currency: data.currency,
      timeZone: data.time_zone,
      workingHours: data.working_hours,
      billingCycle: data.billing_cycle,
      notifications: data.notifications,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  }

  /**
   * Update notification preferences
   */
  static async updateNotificationPreferences(preferences: Partial<UserSettings['notifications']>): Promise<void> {
    try {
      await this.updateUserSettings({ notifications: preferences });
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      throw error;
    }
  }

  /**
   * Add practice area
   */
  static async addPracticeArea(practiceArea: string): Promise<void> {
    try {
      const currentSettings = await this.getUserSettings();
      if (!currentSettings) throw new Error('No settings found');

      const updatedAreas = [...currentSettings.practiceAreas, practiceArea.trim()];
      await this.updateUserSettings({ practiceAreas: updatedAreas });
    } catch (error) {
      console.error('Error adding practice area:', error);
      throw error;
    }
  }

  /**
   * Remove practice area
   */
  static async removePracticeArea(index: number): Promise<void> {
    try {
      const currentSettings = await this.getUserSettings();
      if (!currentSettings) throw new Error('No settings found');

      const updatedAreas = currentSettings.practiceAreas.filter((_, i) => i !== index);
      await this.updateUserSettings({ practiceAreas: updatedAreas });
    } catch (error) {
      console.error('Error removing practice area:', error);
      throw error;
    }
  }

  /**
   * Update practice area
   */
  static async updatePracticeArea(index: number, newValue: string): Promise<void> {
    try {
      const currentSettings = await this.getUserSettings();
      if (!currentSettings) throw new Error('No settings found');

      const updatedAreas = [...currentSettings.practiceAreas];
      updatedAreas[index] = newValue.trim();
      await this.updateUserSettings({ practiceAreas: updatedAreas });
    } catch (error) {
      console.error('Error updating practice area:', error);
      throw error;
    }
  }
}
