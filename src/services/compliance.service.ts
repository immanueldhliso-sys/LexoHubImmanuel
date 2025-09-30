/**
 * Compliance Service
 * Handles all compliance-related API operations
 */

import { supabase } from '../lib/supabase';
import type { 
  ComplianceAlert, 
  ComplianceDeadline, 
  ComplianceViolation, 
  ComplianceDashboardStats,
  ComplianceFilters 
} from '../types';

export class ComplianceService {
  /**
   * Get compliance dashboard statistics
   */
  static async getDashboardStats(): Promise<ComplianceDashboardStats> {
    try {
      // Get total alerts count
      const { count: totalAlerts } = await supabase
        .from('compliance_alerts')
        .select('*', { count: 'exact', head: true });

      // Get active alerts count
      const { count: activeAlerts } = await supabase
        .from('compliance_alerts')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      // Get upcoming deadlines count (next 30 days)
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      
      const { count: upcomingDeadlines } = await supabase
        .from('compliance_deadlines')
        .select('*', { count: 'exact', head: true })
        .lte('due_date', thirtyDaysFromNow.toISOString())
        .eq('status', 'pending');

      // Get violations count (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { count: recentViolations } = await supabase
        .from('compliance_violations')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', thirtyDaysAgo.toISOString());

      // Calculate compliance score (mock calculation)
      const complianceScore = Math.max(0, 100 - (activeAlerts || 0) * 5 - (recentViolations || 0) * 10);

      return {
        totalAlerts: totalAlerts || 0,
        activeAlerts: activeAlerts || 0,
        upcomingDeadlines: upcomingDeadlines || 0,
        recentViolations: recentViolations || 0,
        complianceScore,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error fetching compliance dashboard stats:', error);
      throw new Error('Failed to fetch compliance dashboard statistics');
    }
  }

  /**
   * Get compliance alerts with optional filtering
   */
  static async getAlerts(filters?: ComplianceFilters): Promise<ComplianceAlert[]> {
    try {
      let query = supabase
        .from('compliance_alerts')
        .select('*')
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters?.alertType?.length) {
        query = query.in('alert_type', filters.alertType);
      }
      if (filters?.severity?.length) {
        query = query.in('severity', filters.severity);
      }
      if (filters?.status?.length) {
        query = query.in('status', filters.status);
      }
      if (filters?.dateRange?.start) {
        query = query.gte('created_at', filters.dateRange.start);
      }
      if (filters?.dateRange?.end) {
        query = query.lte('created_at', filters.dateRange.end);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching compliance alerts:', error);
      throw new Error('Failed to fetch compliance alerts');
    }
  }

  /**
   * Get compliance deadlines with optional filtering
   */
  static async getDeadlines(filters?: ComplianceFilters): Promise<ComplianceDeadline[]> {
    try {
      let query = supabase
        .from('compliance_deadlines')
        .select('*')
        .order('due_date', { ascending: true });

      // Apply filters
      if (filters?.status?.length) {
        query = query.in('status', filters.status);
      }
      if (filters?.dateRange?.start) {
        query = query.gte('due_date', filters.dateRange.start);
      }
      if (filters?.dateRange?.end) {
        query = query.lte('due_date', filters.dateRange.end);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching compliance deadlines:', error);
      throw new Error('Failed to fetch compliance deadlines');
    }
  }

  /**
   * Get compliance violations with optional filtering
   */
  static async getViolations(filters?: ComplianceFilters): Promise<ComplianceViolation[]> {
    try {
      let query = supabase
        .from('compliance_violations')
        .select('*')
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters?.violationType?.length) {
        query = query.in('violation_type', filters.violationType);
      }
      if (filters?.severity?.length) {
        query = query.in('severity', filters.severity);
      }
      if (filters?.dateRange?.start) {
        query = query.gte('created_at', filters.dateRange.start);
      }
      if (filters?.dateRange?.end) {
        query = query.lte('created_at', filters.dateRange.end);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching compliance violations:', error);
      throw new Error('Failed to fetch compliance violations');
    }
  }

  /**
   * Resolve a compliance alert
   */
  static async resolveAlert(alertId: string, resolution?: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('compliance_alerts')
        .update({
          status: 'resolved',
          resolution,
          resolved_at: new Date().toISOString()
        })
        .eq('id', alertId);

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Error resolving compliance alert:', error);
      throw new Error('Failed to resolve compliance alert');
    }
  }

  /**
   * Mark a deadline as completed
   */
  static async completeDeadline(deadlineId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('compliance_deadlines')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', deadlineId);

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Error completing compliance deadline:', error);
      throw new Error('Failed to complete compliance deadline');
    }
  }

  /**
   * Create a new compliance alert
   */
  static async createAlert(alert: Omit<ComplianceAlert, 'id' | 'created_at' | 'updated_at'>): Promise<ComplianceAlert> {
    try {
      const { data, error } = await supabase
        .from('compliance_alerts')
        .insert([alert])
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error creating compliance alert:', error);
      throw new Error('Failed to create compliance alert');
    }
  }

  /**
   * Create a new compliance deadline
   */
  static async createDeadline(deadline: Omit<ComplianceDeadline, 'id' | 'created_at' | 'updated_at'>): Promise<ComplianceDeadline> {
    try {
      const { data, error } = await supabase
        .from('compliance_deadlines')
        .insert([deadline])
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error creating compliance deadline:', error);
      throw new Error('Failed to create compliance deadline');
    }
  }
}