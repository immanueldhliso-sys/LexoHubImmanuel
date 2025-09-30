/**
 * Compliance Service
 * Manages compliance alerts, deadlines, violations, and requirements
 * Follows LEXO Constitution principles for consistency and robustness
 */

import { supabase } from '@/lib/supabase';
import type {
  ComplianceAlert,
  ComplianceDeadline,
  ComplianceViolation,
  ComplianceRequirement,
  ComplianceDashboardStats,
  ComplianceFilters,
  ComplianceAlertType,
  ComplianceAlertSeverity,
  ComplianceAlertStatus,
  ComplianceRequirementType,
  ComplianceViolationType,
  BarAssociation
} from '@/types';
import { BaseApiService, type ApiResponse } from './base-api.service';
import { z } from 'zod';
import { toast } from 'react-hot-toast';

// Validation schemas
const ComplianceAlertValidation = z.object({
  alert_type: z.enum(['trust_account', 'ethics', 'deadline', 'financial', 'regulatory', 'conflict', 'documentation']),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  title: z.string().min(3, 'Title must be at least 3 characters').max(255, 'Title too long'),
  description: z.string().min(10, 'Description must be at least 10 characters').max(2000, 'Description too long'),
  recommendation: z.string().max(1000, 'Recommendation too long').optional(),
  due_date: z.string().optional(),
  matter_id: z.string().uuid().optional()
});

const ComplianceDeadlineValidation = z.object({
  requirement_type: z.enum([
    'trust_account_reconciliation',
    'annual_return',
    'cpd_compliance',
    'insurance_renewal',
    'practice_certificate',
    'ethics_declaration',
    'financial_audit',
    'regulatory_filing'
  ]),
  title: z.string().min(3, 'Title must be at least 3 characters').max(255, 'Title too long'),
  description: z.string().min(10, 'Description must be at least 10 characters').max(2000, 'Description too long'),
  due_date: z.string(),
  is_recurring: z.boolean(),
  recurrence_pattern: z.string().optional(),
  matter_id: z.string().uuid().optional()
});

const ComplianceViolationValidation = z.object({
  violation_type: z.enum([
    'trust_account_shortage',
    'overdue_reconciliation',
    'missing_documentation',
    'ethics_breach',
    'regulatory_non_compliance',
    'financial_irregularity',
    'deadline_missed'
  ]),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  title: z.string().min(3, 'Title must be at least 3 characters').max(255, 'Title too long'),
  description: z.string().min(10, 'Description must be at least 10 characters').max(2000, 'Description too long'),
  financial_impact: z.number().optional(),
  regulatory_reference: z.string().max(255, 'Reference too long').optional(),
  matter_id: z.string().uuid().optional(),
  alert_id: z.string().uuid().optional()
});

export class ComplianceAlertsService extends BaseApiService<ComplianceAlert> {
  constructor() {
    super('compliance_alerts', `
      id,
      advocate_id,
      matter_id,
      alert_type,
      severity,
      status,
      title,
      description,
      recommendation,
      due_date,
      resolved_at,
      resolved_by,
      resolution_notes,
      metadata,
      created_at,
      updated_at
    `);
  }

  async createAlert(data: Partial<ComplianceAlert>): Promise<ApiResponse<ComplianceAlert>> {
    try {
      // Validate input
      const validated = ComplianceAlertValidation.parse(data);
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        return {
          data: null,
          error: {
            type: 'AUTHENTICATION_ERROR' as any,
            message: 'User not authenticated',
            timestamp: new Date(),
            requestId: this.generateRequestId()
          }
        };
      }

      const alertData = {
        ...validated,
        advocate_id: user.id,
        status: 'active' as ComplianceAlertStatus,
        metadata: data.metadata || {}
      };

      const result = await this.create(alertData);
      
      if (result.data) {
        toast.success('Compliance alert created successfully');
        
        // Auto-generate deadline if due_date is provided
        if (validated.due_date) {
          await this.createRelatedDeadline(result.data, validated.due_date);
        }
      }
      
      return result;
    } catch (error) {
      console.error('Error creating compliance alert:', error);
      return {
        data: null,
        error: {
          type: 'VALIDATION_ERROR' as any,
          message: error instanceof Error ? error.message : 'Validation failed',
          timestamp: new Date(),
          requestId: this.generateRequestId()
        }
      };
    }
  }

  async resolveAlert(
    alertId: string, 
    resolutionNotes?: string
  ): Promise<ApiResponse<ComplianceAlert>> {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        return {
          data: null,
          error: {
            type: 'AUTHENTICATION_ERROR' as any,
            message: 'User not authenticated',
            timestamp: new Date(),
            requestId: this.generateRequestId()
          }
        };
      }

      const updateData = {
        status: 'resolved' as ComplianceAlertStatus,
        resolved_at: new Date().toISOString(),
        resolved_by: user.id,
        resolution_notes: resolutionNotes || null
      };

      const result = await this.update(alertId, updateData);
      
      if (result.data) {
        toast.success('Alert resolved successfully');
      }
      
      return result;
    } catch (error) {
      console.error('Error resolving alert:', error);
      return {
        data: null,
        error: {
          type: 'DATABASE_ERROR' as any,
          message: 'Failed to resolve alert',
          timestamp: new Date(),
          requestId: this.generateRequestId()
        }
      };
    }
  }

  async getAlertsByFilters(filters: ComplianceFilters): Promise<ApiResponse<ComplianceAlert[]>> {
    const filterOptions: any = {};
    
    if (filters.alertType?.length) {
      filterOptions.alert_type = { in: filters.alertType };
    }
    
    if (filters.severity?.length) {
      filterOptions.severity = { in: filters.severity };
    }
    
    if (filters.status?.length) {
      filterOptions.status = { in: filters.status };
    }
    
    if (filters.matterId) {
      filterOptions.matter_id = filters.matterId;
    }
    
    if (filters.dateRange) {
      filterOptions.created_at = {
        gte: filters.dateRange.start,
        lte: filters.dateRange.end
      };
    }

    return this.getAll({
      filters: filterOptions,
      sort: { column: 'created_at', ascending: false }
    });
  }

  private async createRelatedDeadline(alert: ComplianceAlert, dueDate: string): Promise<void> {
    const deadlineService = new ComplianceDeadlinesService();
    
    await deadlineService.createDeadline({
      requirement_type: this.mapAlertTypeToRequirement(alert.alert_type),
      title: `Deadline: ${alert.title}`,
      description: `Auto-generated deadline from alert: ${alert.description}`,
      due_date: dueDate,
      is_recurring: false,
      auto_generated: true,
      matter_id: alert.matter_id,
      metadata: { source_alert_id: alert.id }
    });
  }

  private mapAlertTypeToRequirement(alertType: ComplianceAlertType): ComplianceRequirementType {
    const mapping: Record<ComplianceAlertType, ComplianceRequirementType> = {
      trust_account: 'trust_account_reconciliation',
      ethics: 'ethics_declaration',
      deadline: 'regulatory_filing',
      financial: 'financial_audit',
      regulatory: 'regulatory_filing',
      conflict: 'ethics_declaration',
      documentation: 'regulatory_filing'
    };
    
    return mapping[alertType] || 'regulatory_filing';
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export class ComplianceDeadlinesService extends BaseApiService<ComplianceDeadline> {
  constructor() {
    super('compliance_deadlines', `
      id,
      requirement_id,
      advocate_id,
      matter_id,
      requirement_type,
      title,
      description,
      due_date,
      reminder_dates,
      is_recurring,
      recurrence_pattern,
      completed,
      completed_at,
      completed_by,
      completion_notes,
      auto_generated,
      metadata,
      created_at,
      updated_at
    `);
  }

  async createDeadline(data: Partial<ComplianceDeadline>): Promise<ApiResponse<ComplianceDeadline>> {
    try {
      const validated = ComplianceDeadlineValidation.parse(data);
      
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        return {
          data: null,
          error: {
            type: 'AUTHENTICATION_ERROR' as any,
            message: 'User not authenticated',
            timestamp: new Date(),
            requestId: this.generateRequestId()
          }
        };
      }

      // Generate requirement ID if not provided
      const requirementId = data.requirement_id || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Calculate reminder dates (7 days, 3 days, 1 day before due date)
      const dueDate = new Date(validated.due_date);
      const reminderDates = [
        new Date(dueDate.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        new Date(dueDate.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        new Date(dueDate.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString()
      ].filter(date => new Date(date) > new Date()); // Only future reminders

      const deadlineData = {
        ...validated,
        requirement_id: requirementId,
        advocate_id: user.id,
        reminder_dates: reminderDates,
        completed: false,
        auto_generated: data.auto_generated || false,
        metadata: data.metadata || {}
      };

      const result = await this.create(deadlineData);
      
      if (result.data) {
        toast.success('Compliance deadline created successfully');
      }
      
      return result;
    } catch (error) {
      console.error('Error creating compliance deadline:', error);
      return {
        data: null,
        error: {
          type: 'VALIDATION_ERROR' as any,
          message: error instanceof Error ? error.message : 'Validation failed',
          timestamp: new Date(),
          requestId: this.generateRequestId()
        }
      };
    }
  }

  async completeDeadline(
    deadlineId: string, 
    completionNotes?: string
  ): Promise<ApiResponse<ComplianceDeadline>> {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        return {
          data: null,
          error: {
            type: 'AUTHENTICATION_ERROR' as any,
            message: 'User not authenticated',
            timestamp: new Date(),
            requestId: this.generateRequestId()
          }
        };
      }

      const updateData = {
        completed: true,
        completed_at: new Date().toISOString(),
        completed_by: user.id,
        completion_notes: completionNotes || null
      };

      const result = await this.update(deadlineId, updateData);
      
      if (result.data) {
        toast.success('Deadline marked as completed');
        
        // If recurring, create next deadline
        if (result.data.is_recurring && result.data.recurrence_pattern) {
          await this.createRecurringDeadline(result.data);
        }
      }
      
      return result;
    } catch (error) {
      console.error('Error completing deadline:', error);
      return {
        data: null,
        error: {
          type: 'DATABASE_ERROR' as any,
          message: 'Failed to complete deadline',
          timestamp: new Date(),
          requestId: this.generateRequestId()
        }
      };
    }
  }

  async getUpcomingDeadlines(days: number = 30): Promise<ApiResponse<ComplianceDeadline[]>> {
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);
    
    return this.getAll({
      filters: {
        completed: false,
        due_date: {
          lte: endDate.toISOString()
        }
      },
      sort: { column: 'due_date', ascending: true }
    });
  }

  async getOverdueDeadlines(): Promise<ApiResponse<ComplianceDeadline[]>> {
    const today = new Date().toISOString().split('T')[0];
    
    return this.getAll({
      filters: {
        completed: false,
        due_date: {
          lt: today
        }
      },
      sort: { column: 'due_date', ascending: true }
    });
  }

  private async createRecurringDeadline(completedDeadline: ComplianceDeadline): Promise<void> {
    const nextDueDate = this.calculateNextDueDate(
      completedDeadline.due_date,
      completedDeadline.recurrence_pattern!
    );
    
    if (nextDueDate) {
      await this.createDeadline({
        requirement_type: completedDeadline.requirement_type,
        title: completedDeadline.title,
        description: completedDeadline.description,
        due_date: nextDueDate,
        is_recurring: true,
        recurrence_pattern: completedDeadline.recurrence_pattern,
        matter_id: completedDeadline.matter_id,
        auto_generated: true,
        metadata: {
          ...completedDeadline.metadata,
          previous_deadline_id: completedDeadline.id
        }
      });
    }
  }

  private calculateNextDueDate(currentDueDate: string, pattern: string): string | null {
    const current = new Date(currentDueDate);
    
    switch (pattern) {
      case 'monthly':
        current.setMonth(current.getMonth() + 1);
        break;
      case 'quarterly':
        current.setMonth(current.getMonth() + 3);
        break;
      case 'annually':
        current.setFullYear(current.getFullYear() + 1);
        break;
      default:
        return null;
    }
    
    return current.toISOString();
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export class ComplianceViolationsService extends BaseApiService<ComplianceViolation> {
  constructor() {
    super('compliance_violations', `
      id,
      alert_id,
      advocate_id,
      matter_id,
      violation_type,
      severity,
      title,
      description,
      detected_at,
      resolved_at,
      resolution_action,
      financial_impact,
      regulatory_reference,
      metadata,
      created_at,
      updated_at
    `);
  }

  async createViolation(data: Partial<ComplianceViolation>): Promise<ApiResponse<ComplianceViolation>> {
    try {
      const validated = ComplianceViolationValidation.parse(data);
      
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        return {
          data: null,
          error: {
            type: 'AUTHENTICATION_ERROR' as any,
            message: 'User not authenticated',
            timestamp: new Date(),
            requestId: this.generateRequestId()
          }
        };
      }

      const violationData = {
        ...validated,
        advocate_id: user.id,
        detected_at: new Date().toISOString(),
        metadata: data.metadata || {}
      };

      const result = await this.create(violationData);
      
      if (result.data) {
        toast.error('Compliance violation detected');
        
        // Auto-create alert for critical violations
        if (validated.severity === 'critical') {
          await this.createViolationAlert(result.data);
        }
      }
      
      return result;
    } catch (error) {
      console.error('Error creating compliance violation:', error);
      return {
        data: null,
        error: {
          type: 'VALIDATION_ERROR' as any,
          message: error instanceof Error ? error.message : 'Validation failed',
          timestamp: new Date(),
          requestId: this.generateRequestId()
        }
      };
    }
  }

  async resolveViolation(
    violationId: string, 
    resolutionAction: string
  ): Promise<ApiResponse<ComplianceViolation>> {
    try {
      const updateData = {
        resolved_at: new Date().toISOString(),
        resolution_action: resolutionAction
      };

      const result = await this.update(violationId, updateData);
      
      if (result.data) {
        toast.success('Violation resolved successfully');
      }
      
      return result;
    } catch (error) {
      console.error('Error resolving violation:', error);
      return {
        data: null,
        error: {
          type: 'DATABASE_ERROR' as any,
          message: 'Failed to resolve violation',
          timestamp: new Date(),
          requestId: this.generateRequestId()
        }
      };
    }
  }

  async getActiveViolations(): Promise<ApiResponse<ComplianceViolation[]>> {
    return this.getAll({
      filters: {
        resolved_at: null
      },
      sort: { column: 'detected_at', ascending: false }
    });
  }

  private async createViolationAlert(violation: ComplianceViolation): Promise<void> {
    const alertsService = new ComplianceAlertsService();
    
    await alertsService.createAlert({
      alert_type: this.mapViolationTypeToAlert(violation.violation_type),
      severity: violation.severity,
      title: `Critical Violation: ${violation.title}`,
      description: `A critical compliance violation has been detected: ${violation.description}`,
      recommendation: 'Immediate action required to resolve this violation.',
      matter_id: violation.matter_id,
      metadata: { source_violation_id: violation.id }
    });
  }

  private mapViolationTypeToAlert(violationType: ComplianceViolationType): ComplianceAlertType {
    const mapping: Record<ComplianceViolationType, ComplianceAlertType> = {
      trust_account_shortage: 'trust_account',
      overdue_reconciliation: 'trust_account',
      missing_documentation: 'documentation',
      ethics_breach: 'ethics',
      regulatory_non_compliance: 'regulatory',
      financial_irregularity: 'financial',
      deadline_missed: 'deadline'
    };
    
    return mapping[violationType] || 'regulatory';
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export class ComplianceService {
  private alertsService: ComplianceAlertsService;
  private deadlinesService: ComplianceDeadlinesService;
  private violationsService: ComplianceViolationsService;

  constructor() {
    this.alertsService = new ComplianceAlertsService();
    this.deadlinesService = new ComplianceDeadlinesService();
    this.violationsService = new ComplianceViolationsService();
  }

  // Dashboard stats
  async getDashboardStats(): Promise<ApiResponse<ComplianceDashboardStats>> {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        return {
          data: null,
          error: {
            type: 'AUTHENTICATION_ERROR' as any,
            message: 'User not authenticated',
            timestamp: new Date(),
            requestId: this.generateRequestId()
          }
        };
      }

      // Get all stats in parallel
      const [
        alertsResult,
        criticalAlertsResult,
        upcomingDeadlinesResult,
        overdueDeadlinesResult,
        violationsResult,
        complianceScoreResult
      ] = await Promise.all([
        this.alertsService.getAll({ filters: { status: { in: ['active', 'acknowledged'] } } }),
        this.alertsService.getAll({ filters: { severity: 'critical', status: { in: ['active', 'acknowledged'] } } }),
        this.deadlinesService.getUpcomingDeadlines(30),
        this.deadlinesService.getOverdueDeadlines(),
        this.violationsService.getActiveViolations(),
        this.calculateComplianceScore(user.id)
      ]);

      const stats: ComplianceDashboardStats = {
        totalAlerts: alertsResult.data?.length || 0,
        criticalAlerts: criticalAlertsResult.data?.length || 0,
        upcomingDeadlines: upcomingDeadlinesResult.data?.length || 0,
        overdueDeadlines: overdueDeadlinesResult.data?.length || 0,
        activeViolations: violationsResult.data?.length || 0,
        complianceScore: complianceScoreResult || 85, // Default score
        lastAuditDate: undefined, // Would be fetched from audit records
        nextAuditDate: undefined, // Would be calculated based on requirements
        trustAccountBalance: undefined, // Would be fetched from financial records
        trustAccountLastReconciled: undefined // Would be fetched from reconciliation records
      };

      return {
        data: stats,
        error: null
      };
    } catch (error) {
      console.error('Error getting dashboard stats:', error);
      return {
        data: null,
        error: {
          type: 'DATABASE_ERROR' as any,
          message: 'Failed to fetch dashboard stats',
          timestamp: new Date(),
          requestId: this.generateRequestId()
        }
      };
    }
  }

  // Calculate compliance score based on various factors
  private async calculateComplianceScore(advocateId: string): Promise<number> {
    try {
      // This would be implemented with a more sophisticated algorithm
      // For now, return a basic calculation
      const { data, error } = await supabase
        .rpc('calculate_compliance_score', { p_advocate_id: advocateId });
      
      if (error) {
        console.warn('Compliance score calculation failed:', error);
        return 85; // Default score
      }
      
      return data || 85;
    } catch (error) {
      console.warn('Error calculating compliance score:', error);
      return 85; // Default score
    }
  }

  // Auto-generate compliance deadlines for new advocates
  async generateComplianceDeadlines(advocateId: string, bar: BarAssociation): Promise<void> {
    const currentYear = new Date().getFullYear();
    const deadlines = [
      {
        requirement_type: 'trust_account_reconciliation' as ComplianceRequirementType,
        title: 'Monthly Trust Account Reconciliation',
        description: 'Reconcile trust account balances with client ledgers',
        due_date: new Date(currentYear, new Date().getMonth() + 1, 0).toISOString(), // End of next month
        is_recurring: true,
        recurrence_pattern: 'monthly'
      },
      {
        requirement_type: 'annual_return' as ComplianceRequirementType,
        title: 'Annual Return Filing',
        description: 'Submit annual return to the bar council',
        due_date: new Date(currentYear + 1, 2, 31).toISOString(), // March 31st next year
        is_recurring: true,
        recurrence_pattern: 'annually'
      },
      {
        requirement_type: 'cpd_compliance' as ComplianceRequirementType,
        title: 'CPD Points Compliance',
        description: 'Complete required CPD points for the year',
        due_date: new Date(currentYear, 11, 31).toISOString(), // December 31st
        is_recurring: true,
        recurrence_pattern: 'annually'
      }
    ];

    for (const deadline of deadlines) {
      await this.deadlinesService.createDeadline({
        ...deadline,
        auto_generated: true,
        metadata: { bar, generated_for_new_advocate: true }
      });
    }
  }

  // Getters for individual services
  get alerts() {
    return this.alertsService;
  }

  get deadlines() {
    return this.deadlinesService;
  }

  get violations() {
    return this.violationsService;
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export singleton instance
export const complianceService = new ComplianceService();
export const complianceAlertsService = new ComplianceAlertsService();
export const complianceDeadlinesService = new ComplianceDeadlinesService();
export const complianceViolationsService = new ComplianceV