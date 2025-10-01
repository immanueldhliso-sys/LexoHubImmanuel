/**
 * Opportunities API Service
 * Handles all opportunity-related database operations for the Pre-Matter stage
 * Follows LEXO Constitution principles for consistency and robustness
 */

import { supabase } from '@/lib/supabase';
import { BaseApiService, type ApiResponse, type FilterOptions, type PaginationOptions } from './base-api.service';
import { toast } from 'react-hot-toast';
import { z } from 'zod';

// Types
export interface Opportunity {
  id: string;
  advocate_id: string;
  name: string;
  description?: string;
  notes?: string;
  client_name?: string;
  client_email?: string;
  client_phone?: string;
  instructing_attorney?: string;
  instructing_firm?: string;
  estimated_value?: number;
  probability_percentage?: number;
  expected_instruction_date?: string;
  source?: string;
  status: 'active' | 'converted' | 'lost' | 'on_hold';
  tags?: string[];
  created_at: string;
  updated_at: string;
  converted_to_matter_id?: string;
  converted_at?: string;
}

export interface CreateOpportunityRequest {
  name: string;
  description?: string;
  notes?: string;
  client_name?: string;
  client_email?: string;
  client_phone?: string;
  instructing_attorney?: string;
  instructing_firm?: string;
  estimated_value?: number;
  probability_percentage?: number;
  expected_instruction_date?: string;
  source?: string;
  tags?: string[];
}

export interface UpdateOpportunityRequest extends Partial<CreateOpportunityRequest> {
  status?: 'active' | 'converted' | 'lost' | 'on_hold';
}

export interface OpportunityStats {
  total_opportunities: number;
  active_opportunities: number;
  converted_opportunities: number;
  lost_opportunities: number;
  total_estimated_value: number;
  average_conversion_time_days: number;
  conversion_rate_percentage: number;
}

export interface OpportunityFilters extends FilterOptions {
  status?: string | string[];
  source?: string;
  probability_min?: number;
  probability_max?: number;
  estimated_value_min?: number;
  estimated_value_max?: number;
  expected_instruction_from?: string;
  expected_instruction_to?: string;
  tags?: string[];
}

// Validation schemas
const CreateOpportunityValidation = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters').max(255, 'Name too long'),
  description: z.string().max(2000, 'Description too long').optional(),
  notes: z.string().max(5000, 'Notes too long').optional(),
  client_name: z.string().max(255, 'Client name too long').optional(),
  client_email: z.string().email('Invalid email format').optional().or(z.literal('')),
  client_phone: z.string().max(50, 'Phone number too long').optional(),
  instructing_attorney: z.string().max(255, 'Attorney name too long').optional(),
  instructing_firm: z.string().max(255, 'Firm name too long').optional(),
  estimated_value: z.number().positive('Estimated value must be positive').optional(),
  probability_percentage: z.number().min(0).max(100, 'Probability must be between 0 and 100').optional(),
  expected_instruction_date: z.string().optional(),
  source: z.string().max(100, 'Source too long').optional(),
  tags: z.array(z.string()).optional()
});

const UpdateOpportunityValidation = CreateOpportunityValidation.partial().extend({
  status: z.enum(['active', 'converted', 'lost', 'on_hold']).optional()
});

export class OpportunityService extends BaseApiService<Opportunity> {
  protected tableName = 'opportunities';

  /**
   * Create a new opportunity
   */
  static async create(data: CreateOpportunityRequest): Promise<ApiResponse<Opportunity>> {
    try {
      // Validate input
      const validated = CreateOpportunityValidation.parse(data);
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        return { data: null, error: { message: 'User not authenticated', type: 'auth' } };
      }

      // Create the opportunity
      const { data: opportunity, error } = await supabase
        .from('opportunities')
        .insert({
          advocate_id: user.id,
          ...validated,
          status: 'active'
        })
        .select()
        .single();

      if (error) {
        console.error('Database error creating opportunity:', error);
        return { 
          data: null, 
          error: { 
            message: `Failed to create opportunity: ${error.message}`, 
            type: 'database' 
          } 
        };
      }

      toast.success('Opportunity created successfully');
      return { data: opportunity as Opportunity, error: null };

    } catch (error) {
      console.error('Error creating opportunity:', error);
      const message = error instanceof Error ? error.message : 'Failed to create opportunity';
      toast.error(message);
      return { data: null, error: { message, type: 'validation' } };
    }
  }

  /**
   * Update an existing opportunity
   */
  static async update(id: string, data: UpdateOpportunityRequest): Promise<ApiResponse<Opportunity>> {
    try {
      // Validate input
      const validated = UpdateOpportunityValidation.parse(data);

      const { data: opportunity, error } = await supabase
        .from('opportunities')
        .update({
          ...validated,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Database error updating opportunity:', error);
        return { 
          data: null, 
          error: { 
            message: `Failed to update opportunity: ${error.message}`, 
            type: 'database' 
          } 
        };
      }

      toast.success('Opportunity updated successfully');
      return { data: opportunity as Opportunity, error: null };

    } catch (error) {
      console.error('Error updating opportunity:', error);
      const message = error instanceof Error ? error.message : 'Failed to update opportunity';
      toast.error(message);
      return { data: null, error: { message, type: 'validation' } };
    }
  }

  /**
   * Get opportunities for the current user with filtering and pagination
   */
  static async getOpportunities(options: {
    page?: number;
    pageSize?: number;
    filters?: OpportunityFilters;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  } = {}): Promise<ApiResponse<{ data: Opportunity[]; pagination: any }>> {
    const {
      page = 1,
      pageSize = 10,
      filters = {},
      search,
      sortBy = 'created_at',
      sortOrder = 'desc'
    } = options;

    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        return { data: null, error: { message: 'User not authenticated', type: 'auth' } };
      }

      let query = supabase
        .from('opportunities')
        .select('*', { count: 'exact' })
        .eq('advocate_id', user.id);

      // Apply filters
      if (filters.status) {
        if (Array.isArray(filters.status)) {
          query = query.in('status', filters.status);
        } else {
          query = query.eq('status', filters.status);
        }
      }

      if (filters.source) {
        query = query.eq('source', filters.source);
      }

      if (filters.probability_min !== undefined) {
        query = query.gte('probability_percentage', filters.probability_min);
      }

      if (filters.probability_max !== undefined) {
        query = query.lte('probability_percentage', filters.probability_max);
      }

      if (filters.estimated_value_min !== undefined) {
        query = query.gte('estimated_value', filters.estimated_value_min);
      }

      if (filters.estimated_value_max !== undefined) {
        query = query.lte('estimated_value', filters.estimated_value_max);
      }

      if (filters.expected_instruction_from) {
        query = query.gte('expected_instruction_date', filters.expected_instruction_from);
      }

      if (filters.expected_instruction_to) {
        query = query.lte('expected_instruction_date', filters.expected_instruction_to);
      }

      if (search) {
        query = query.or(`name.ilike.%${search}%,client_name.ilike.%${search}%,description.ilike.%${search}%`);
      }

      // Apply sorting
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });

      // Apply pagination
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) {
        console.error('Database error fetching opportunities:', error);
        return { 
          data: null, 
          error: { 
            message: `Failed to fetch opportunities: ${error.message}`, 
            type: 'database' 
          } 
        };
      }

      return {
        data: {
          data: (data || []) as Opportunity[],
          pagination: {
            page,
            pageSize,
            total: count || 0,
            totalPages: Math.ceil((count || 0) / pageSize)
          }
        },
        error: null
      };

    } catch (error) {
      console.error('Error fetching opportunities:', error);
      const message = error instanceof Error ? error.message : 'Failed to fetch opportunities';
      return { data: null, error: { message, type: 'unknown' } };
    }
  }

  /**
   * Get opportunity statistics for the current user
   */
  static async getStats(): Promise<ApiResponse<OpportunityStats>> {
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        return { data: null, error: { message: 'User not authenticated', type: 'auth' } };
      }

      const { data, error } = await supabase
        .rpc('get_opportunity_stats', { user_id: user.id });

      if (error) {
        console.error('Database error fetching opportunity stats:', error);
        return { 
          data: null, 
          error: { 
            message: `Failed to fetch opportunity statistics: ${error.message}`, 
            type: 'database' 
          } 
        };
      }

      return { data: data[0] as OpportunityStats, error: null };

    } catch (error) {
      console.error('Error fetching opportunity stats:', error);
      const message = error instanceof Error ? error.message : 'Failed to fetch opportunity statistics';
      return { data: null, error: { message, type: 'unknown' } };
    }
  }

  /**
   * Convert an opportunity to a matter
   */
  static async convertToMatter(opportunityId: string, matterData: any): Promise<ApiResponse<string>> {
    try {
      // This will be implemented when we integrate with the matter creation flow
      // For now, just mark the opportunity as converted
      const { data, error } = await supabase
        .from('opportunities')
        .update({
          status: 'converted',
          converted_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', opportunityId)
        .select()
        .single();

      if (error) {
        console.error('Database error converting opportunity:', error);
        return { 
          data: null, 
          error: { 
            message: `Failed to convert opportunity: ${error.message}`, 
            type: 'database' 
          } 
        };
      }

      toast.success('Opportunity converted to matter successfully');
      return { data: opportunityId, error: null };

    } catch (error) {
      console.error('Error converting opportunity:', error);
      const message = error instanceof Error ? error.message : 'Failed to convert opportunity';
      toast.error(message);
      return { data: null, error: { message, type: 'unknown' } };
    }
  }

  /**
   * Delete an opportunity
   */
  static async delete(id: string): Promise<ApiResponse<boolean>> {
    try {
      const { error } = await supabase
        .from('opportunities')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Database error deleting opportunity:', error);
        return { 
          data: null, 
          error: { 
            message: `Failed to delete opportunity: ${error.message}`, 
            type: 'database' 
          } 
        };
      }

      toast.success('Opportunity deleted successfully');
      return { data: true, error: null };

    } catch (error) {
      console.error('Error deleting opportunity:', error);
      const message = error instanceof Error ? error.message : 'Failed to delete opportunity';
      toast.error(message);
      return { data: null, error: { message, type: 'unknown' } };
    }
  }

  /**
   * Get a single opportunity by ID
   */
  static async getById(id: string): Promise<ApiResponse<Opportunity>> {
    try {
      const { data, error } = await supabase
        .from('opportunities')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Database error fetching opportunity:', error);
        return { 
          data: null, 
          error: { 
            message: `Failed to fetch opportunity: ${error.message}`, 
            type: 'database' 
          } 
        };
      }

      return { data: data as Opportunity, error: null };

    } catch (error) {
      console.error('Error fetching opportunity:', error);
      const message = error instanceof Error ? error.message : 'Failed to fetch opportunity';
      return { data: null, error: { message, type: 'unknown' } };
    }
  }
}