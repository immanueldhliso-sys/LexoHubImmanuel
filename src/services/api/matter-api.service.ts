/**
 * Matter API Service
 * Handles all matter-related database operations
 * Extends BaseApiService for consistent error handling and CRUD operations
 */

import { BaseApiService, type ApiResponse, type FilterOptions, type PaginationOptions } from './base-api.service';
import type { Matter, MatterStatus, NewMatterForm } from '../../types';

export interface MatterFilters extends FilterOptions {
  advocate_id?: string;
  status?: MatterStatus | MatterStatus[];
  client_name?: string;
  matter_type?: string;
  bar?: 'johannesburg' | 'cape_town';
  risk_level?: 'low' | 'medium' | 'high' | 'critical';
  is_overdue?: boolean;
  date_instructed_from?: string;
  date_instructed_to?: string;
  expected_completion_from?: string;
  expected_completion_to?: string;
  tags?: string[];
}

export interface MatterStats {
  total: number;
  active: number;
  pending: number;
  settled: number;
  closed: number;
  overdue: number;
  totalWipValue: number;
  averageSettlementProbability: number;
}

export interface MatterSearchOptions {
  query: string;
  filters?: MatterFilters;
  pagination?: PaginationOptions;
}

export class MatterApiService extends BaseApiService<Matter> {
  constructor() {
    super('matters', `
      *,
      advocate:advocates(full_name, practice_number),
      time_entries(count),
      invoices(count),
      documents(count),
      notes(count)
    `);
  }

  /**
   * Get matters for specific advocate
   */
  async getByAdvocate(
    advocateId: string,
    options: {
      filters?: Omit<MatterFilters, 'advocate_id'>;
      pagination?: PaginationOptions;
    } = {}
  ): Promise<ApiResponse<Matter[]>> {
    const filters: MatterFilters = {
      ...options.filters,
      advocate_id: advocateId,
      deleted_at: null // Only get non-deleted matters
    };

    return this.getAll({
      filters,
      pagination: options.pagination,
      sort: { column: 'date_instructed', ascending: false }
    });
  }

  /**
   * Get active matters for advocate
   */
  async getActiveMatters(advocateId: string): Promise<ApiResponse<Matter[]>> {
    return this.getByAdvocate(advocateId, {
      filters: {
        status: ['active', 'pending']
      }
    });
  }

  /**
   * Get overdue matters
   */
  async getOverdueMatters(advocateId: string): Promise<ApiResponse<Matter[]>> {
    return this.getByAdvocate(advocateId, {
      filters: {
        is_overdue: true
      }
    });
  }

  /**
   * Create new matter from form data
   */
  async createFromForm(formData: NewMatterForm): Promise<ApiResponse<Matter>> {
    // Transform form data to match database schema
    const matterData: Partial<Matter> = {
      advocate_id: formData.advocateId,
      reference_number: formData.referenceNumber,
      title: formData.title,
      description: formData.description,
      matter_type: formData.matterType,
      court_case_number: formData.courtCaseNumber,
      bar: formData.bar,
      client_name: formData.clientName,
      client_email: formData.clientEmail,
      client_phone: formData.clientPhone,
      client_address: formData.clientAddress,
      client_type: formData.clientType,
      instructing_attorney: formData.instructingAttorney,
      instructing_attorney_email: formData.instructingAttorneyEmail,
      instructing_attorney_phone: formData.instructingAttorneyPhone,
      instructing_firm: formData.instructingFirm,
      instructing_firm_ref: formData.instructingFirmRef,
      fee_type: formData.feeType,
      estimated_fee: formData.estimatedFee,
      fee_cap: formData.feeCap,
      vat_exempt: formData.vatExempt || false,
      expected_completion_date: formData.expectedCompletionDate,
      tags: formData.tags || [],
      // Set defaults
      status: 'pending',
      risk_level: 'low',
      wip_value: 0,
      trust_balance: 0,
      disbursements: 0,
      conflict_check_completed: false,
      date_instructed: new Date().toISOString().split('T')[0]
    };

    return this.create(matterData);
  }

  /**
   * Update matter status
   */
  async updateStatus(
    matterId: string, 
    status: MatterStatus,
    metadata?: {
      date_settled?: string;
      date_closed?: string;
      actual_fee?: number;
    }
  ): Promise<ApiResponse<Matter>> {
    const updateData: Partial<Matter> = {
      status,
      ...metadata
    };

    return this.update(matterId, updateData);
  }

  /**
   * Update WIP value
   */
  async updateWipValue(matterId: string, wipValue: number): Promise<ApiResponse<Matter>> {
    return this.update(matterId, { wip_value: wipValue });
  }

  /**
   * Update settlement probability
   */
  async updateSettlementProbability(
    matterId: string, 
    probability: number
  ): Promise<ApiResponse<Matter>> {
    return this.update(matterId, { settlement_probability: probability });
  }

  /**
   * Search matters by text
   */
  async searchMatters(options: MatterSearchOptions): Promise<ApiResponse<Matter[]>> {
    const searchColumns = [
      'title',
      'description',
      'client_name',
      'matter_type',
      'court_case_number',
      'instructing_attorney',
      'instructing_firm'
    ];

    return this.search(options.query, searchColumns, {
      filters: options.filters,
      pagination: options.pagination
    });
  }

  /**
   * Get matter statistics for advocate
   */
  async getStats(advocateId: string): Promise<ApiResponse<MatterStats>> {
    const requestId = this.generateRequestId();

    try {
      // Get all matters for advocate
      const mattersResponse = await this.getByAdvocate(advocateId);
      
      if (mattersResponse.error) {
        return { data: null, error: mattersResponse.error };
      }

      const matters = mattersResponse.data || [];

      // Calculate statistics
      const stats: MatterStats = {
        total: matters.length,
        active: matters.filter(m => m.status === 'active').length,
        pending: matters.filter(m => m.status === 'pending').length,
        settled: matters.filter(m => m.status === 'settled').length,
        closed: matters.filter(m => m.status === 'closed').length,
        overdue: matters.filter(m => m.is_overdue).length,
        totalWipValue: matters.reduce((sum, m) => sum + (m.wip_value || 0), 0),
        averageSettlementProbability: matters.length > 0 
          ? matters.reduce((sum, m) => sum + (m.settlement_probability || 0), 0) / matters.length
          : 0
      };

      return { data: stats, error: null };
    } catch (error) {
      return {
        data: null,
        error: this.transformError(error as Error, requestId)
      };
    }
  }

  /**
   * Get matters by status
   */
  async getByStatus(
    advocateId: string, 
    status: MatterStatus | MatterStatus[]
  ): Promise<ApiResponse<Matter[]>> {
    return this.getByAdvocate(advocateId, {
      filters: { status }
    });
  }

  /**
   * Get matters by risk level
   */
  async getByRiskLevel(
    advocateId: string,
    riskLevel: 'low' | 'medium' | 'high' | 'critical'
  ): Promise<ApiResponse<Matter[]>> {
    return this.getByAdvocate(advocateId, {
      filters: { risk_level: riskLevel }
    });
  }

  /**
   * Get matters with upcoming deadlines
   */
  async getUpcomingDeadlines(
    advocateId: string,
    days: number = 30
  ): Promise<ApiResponse<Matter[]>> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    return this.getByAdvocate(advocateId, {
      filters: {
        status: ['active', 'pending'],
        expected_completion_to: futureDate.toISOString().split('T')[0]
      }
    });
  }

  /**
   * Perform conflict check
   */
  async performConflictCheck(
    advocateId: string,
    clientName: string,
    opposingParties: string[] = []
  ): Promise<ApiResponse<{
    hasConflict: boolean;
    conflictingMatters: Matter[];
    conflictReason?: string;
  }>> {
    const requestId = this.generateRequestId();

    try {
      // Get all matters for advocate
      const mattersResponse = await this.getByAdvocate(advocateId);
      
      if (mattersResponse.error) {
        return { data: null, error: mattersResponse.error };
      }

      const matters = mattersResponse.data || [];
      const conflictingMatters: Matter[] = [];
      let conflictReason: string | undefined;

      // Check if advocate has represented opposing parties
      for (const party of opposingParties) {
        const conflicts = matters.filter(matter => 
          matter.client_name.toLowerCase().includes(party.toLowerCase())
        );
        
        if (conflicts.length > 0) {
          conflictingMatters.push(...conflicts);
          conflictReason = 'Previously represented opposing party';
        }
      }

      // Check if advocate has matters against this client
      const clientConflicts = matters.filter(matter =>
        matter.description?.toLowerCase().includes(clientName.toLowerCase()) &&
        matter.client_name.toLowerCase() !== clientName.toLowerCase()
      );

      if (clientConflicts.length > 0) {
        conflictingMatters.push(...clientConflicts);
        conflictReason = conflictReason || 'Potential conflict with existing matter';
      }

      return {
        data: {
          hasConflict: conflictingMatters.length > 0,
          conflictingMatters: [...new Set(conflictingMatters)], // Remove duplicates
          conflictReason
        },
        error: null
      };
    } catch (error) {
      return {
        data: null,
        error: this.transformError(error as Error, requestId)
      };
    }
  }

  /**
   * Mark conflict check as completed
   */
  async completeConflictCheck(
    matterId: string,
    cleared: boolean,
    notes?: string
  ): Promise<ApiResponse<Matter>> {
    return this.update(matterId, {
      conflict_check_completed: true,
      conflict_check_cleared: cleared,
      conflict_check_date: new Date().toISOString(),
      conflict_notes: notes
    });
  }

  /**
   * Add tags to matter
   */
  async addTags(matterId: string, tags: string[]): Promise<ApiResponse<Matter>> {
    const matterResponse = await this.getById(matterId);
    
    if (matterResponse.error) {
      return { data: null, error: matterResponse.error };
    }

    const matter = matterResponse.data;
    if (!matter) {
      return { data: null, error: matterResponse.error };
    }

    const existingTags = matter.tags || [];
    const newTags = [...new Set([...existingTags, ...tags])];

    return this.update(matterId, { tags: newTags });
  }

  /**
   * Remove tags from matter
   */
  async removeTags(matterId: string, tags: string[]): Promise<ApiResponse<Matter>> {
    const matterResponse = await this.getById(matterId);
    
    if (matterResponse.error) {
      return { data: null, error: matterResponse.error };
    }

    const matter = matterResponse.data;
    if (!matter) {
      return { data: null, error: matterResponse.error };
    }

    const existingTags = matter.tags || [];
    const updatedTags = existingTags.filter(tag => !tags.includes(tag));

    return this.update(matterId, { tags: updatedTags });
  }

  /**
   * Generate unique reference number
   */
  async generateReferenceNumber(
    advocateInitials: string,
    year: number = new Date().getFullYear()
  ): Promise<string> {
    // Get count of matters for this year
    const yearStart = `${year}-01-01`;
    const yearEnd = `${year}-12-31`;
    
    const countResponse = await this.count({
      date_instructed_from: yearStart,
      date_instructed_to: yearEnd
    });

    const count = (countResponse.data || 0) + 1;
    const paddedCount = count.toString().padStart(3, '0');
    
    return `${advocateInitials}${year}${paddedCount}`;
  }

  // Helper method to generate request ID (inherited from BaseApiService)
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  }
}

// Export singleton instance
export const matterApiService = new MatterApiService();