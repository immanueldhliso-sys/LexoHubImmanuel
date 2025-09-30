/**
 * Matter Templates API Service
 * 
 * Provides comprehensive CRUD operations and business logic for matter templates,
 * including template sharing, usage tracking, and intelligent suggestions.
 * Follows LEXO Constitution principles for consistency and robustness.
 */

import { supabase } from '@/lib/supabase';
import { BaseApiService, type ApiResponse, ErrorType } from './base-api.service';
import type {
  MatterTemplate,
  MatterTemplateWithSharing,
  TemplateCategory,
  TemplateShare,
  TemplateSuggestion,
  CreateTemplateRequest,
  UpdateTemplateRequest,
  ShareTemplateRequest,
  TemplateSearchFilters,
  TemplateSuggestionRequest,
  MatterTemplateData,
  TemplateUsageStats
} from '@/types/matter-templates';
import { z } from 'zod';
import { toast } from 'react-hot-toast';

// Validation schemas
const TemplateDataValidation = z.object({
  matterTitle: z.string().optional(),
  matterType: z.string().optional(),
  description: z.string().optional(),
  clientName: z.string().optional(),
  clientEmail: z.string().email().optional().or(z.literal('')),
  clientPhone: z.string().optional(),
  clientType: z.string().optional(),
  instructingAttorney: z.string().optional(),
  barAssociation: z.string().optional(),
  feeType: z.string().optional(),
  hourlyRate: z.number().positive().optional(),
  fixedFee: z.number().positive().optional(),
  contingencyPercentage: z.number().min(0).max(100).optional(),
  customFields: z.record(z.any()).optional(),
  workType: z.string().optional(),
  billable: z.boolean().optional(),
  tags: z.array(z.string()).optional()
});

const CreateTemplateValidation = z.object({
  name: z.string().min(3, 'Template name must be at least 3 characters').max(255, 'Template name too long'),
  description: z.string().max(1000, 'Description too long').optional(),
  category: z.string().min(1, 'Category is required').max(100, 'Category name too long'),
  template_data: TemplateDataValidation,
  is_default: z.boolean().optional(),
  is_shared: z.boolean().optional()
});

const UpdateTemplateValidation = CreateTemplateValidation.partial();

const ShareTemplateValidation = z.object({
  template_id: z.string().uuid('Invalid template ID'),
  shared_with_advocate_id: z.string().uuid('Invalid advocate ID'),
  permissions: z.enum(['read', 'copy'])
});

export class MatterTemplatesService extends BaseApiService<MatterTemplate> {
  constructor() {
    super('matter_templates', '*');
  }

  /**
   * Get all templates accessible to the current user
   * Includes owned templates, shared templates, and public templates
   */
  async getUserTemplates(): Promise<ApiResponse<MatterTemplateWithSharing[]>> {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        return {
          data: null,
          error: {
            type: ErrorType.AUTHENTICATION_ERROR,
            message: 'User not authenticated',
            timestamp: new Date(),
            requestId: this.generateRequestId()
          }
        };
      }

      const { data, error } = await supabase
        .rpc('get_user_templates', { user_id: user.id });

      if (error) {
        return {
          data: null,
          error: this.transformError(error, this.generateRequestId())
        };
      }

      return { data: data || [], error: null };
    } catch (error) {
      return {
        data: null,
        error: this.transformError(error as Error, this.generateRequestId())
      };
    }
  }

  /**
   * Create a new template
   */
  async createTemplate(templateData: CreateTemplateRequest): Promise<ApiResponse<MatterTemplate>> {
    try {
      // Validate input
      const validated = CreateTemplateValidation.parse(templateData);

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        return {
          data: null,
          error: {
            type: ErrorType.AUTHENTICATION_ERROR,
            message: 'User not authenticated',
            timestamp: new Date(),
            requestId: this.generateRequestId()
          }
        };
      }

      // Check for duplicate template names for this user
      const { data: existingTemplate } = await supabase
        .from('matter_templates')
        .select('id')
        .eq('advocate_id', user.id)
        .eq('name', validated.name)
        .single();

      if (existingTemplate) {
        return {
          data: null,
          error: {
            type: ErrorType.CONFLICT_ERROR,
            message: 'A template with this name already exists',
            timestamp: new Date(),
            requestId: this.generateRequestId()
          }
        };
      }

      const { data, error } = await supabase
        .from('matter_templates')
        .insert({
          advocate_id: user.id,
          name: validated.name,
          description: validated.description,
          category: validated.category,
          template_data: validated.template_data,
          is_default: validated.is_default || false,
          is_shared: validated.is_shared || false
        })
        .select()
        .single();

      if (error) {
        return {
          data: null,
          error: this.transformError(error, this.generateRequestId())
        };
      }

      toast.success('Template created successfully');
      return { data: data as MatterTemplate, error: null };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          data: null,
          error: {
            type: ErrorType.VALIDATION_ERROR,
            message: error.errors[0]?.message || 'Validation failed',
            details: error.errors,
            timestamp: new Date(),
            requestId: this.generateRequestId()
          }
        };
      }

      return {
        data: null,
        error: this.transformError(error as Error, this.generateRequestId())
      };
    }
  }

  /**
   * Update an existing template
   */
  async updateTemplate(templateId: string, updates: UpdateTemplateRequest): Promise<ApiResponse<MatterTemplate>> {
    try {
      const validated = UpdateTemplateValidation.parse(updates);

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        return {
          data: null,
          error: {
            type: ErrorType.AUTHENTICATION_ERROR,
            message: 'User not authenticated',
            timestamp: new Date(),
            requestId: this.generateRequestId()
          }
        };
      }

      // Check if user owns the template
      const { data: existingTemplate } = await supabase
        .from('matter_templates')
        .select('advocate_id')
        .eq('id', templateId)
        .single();

      if (!existingTemplate || existingTemplate.advocate_id !== user.id) {
        return {
          data: null,
          error: {
            type: ErrorType.AUTHORIZATION_ERROR,
            message: 'You can only update your own templates',
            timestamp: new Date(),
            requestId: this.generateRequestId()
          }
        };
      }

      const { data, error } = await supabase
        .from('matter_templates')
        .update(validated)
        .eq('id', templateId)
        .select()
        .single();

      if (error) {
        return {
          data: null,
          error: this.transformError(error, this.generateRequestId())
        };
      }

      toast.success('Template updated successfully');
      return { data: data as MatterTemplate, error: null };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          data: null,
          error: {
            type: ErrorType.VALIDATION_ERROR,
            message: error.errors[0]?.message || 'Validation failed',
            details: error.errors,
            timestamp: new Date(),
            requestId: this.generateRequestId()
          }
        };
      }

      return {
        data: null,
        error: this.transformError(error as Error, this.generateRequestId())
      };
    }
  }

  /**
   * Delete a template
   */
  async deleteTemplate(templateId: string): Promise<ApiResponse<void>> {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        return {
          data: null,
          error: {
            type: ErrorType.AUTHENTICATION_ERROR,
            message: 'User not authenticated',
            timestamp: new Date(),
            requestId: this.generateRequestId()
          }
        };
      }

      // Check if user owns the template
      const { data: existingTemplate } = await supabase
        .from('matter_templates')
        .select('advocate_id, name')
        .eq('id', templateId)
        .single();

      if (!existingTemplate || existingTemplate.advocate_id !== user.id) {
        return {
          data: null,
          error: {
            type: ErrorType.AUTHORIZATION_ERROR,
            message: 'You can only delete your own templates',
            timestamp: new Date(),
            requestId: this.generateRequestId()
          }
        };
      }

      const { error } = await supabase
        .from('matter_templates')
        .delete()
        .eq('id', templateId);

      if (error) {
        return {
          data: null,
          error: this.transformError(error, this.generateRequestId())
        };
      }

      toast.success(`Template "${existingTemplate.name}" deleted successfully`);
      return { data: null, error: null };
    } catch (error) {
      return {
        data: null,
        error: this.transformError(error as Error, this.generateRequestId())
      };
    }
  }

  /**
   * Share a template with another advocate
   */
  async shareTemplate(shareData: ShareTemplateRequest): Promise<ApiResponse<TemplateShare>> {
    try {
      const validated = ShareTemplateValidation.parse(shareData);

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        return {
          data: null,
          error: {
            type: ErrorType.AUTHENTICATION_ERROR,
            message: 'User not authenticated',
            timestamp: new Date(),
            requestId: this.generateRequestId()
          }
        };
      }

      // Check if user owns the template
      const { data: template } = await supabase
        .from('matter_templates')
        .select('advocate_id, name')
        .eq('id', validated.template_id)
        .single();

      if (!template || template.advocate_id !== user.id) {
        return {
          data: null,
          error: {
            type: ErrorType.AUTHORIZATION_ERROR,
            message: 'You can only share your own templates',
            timestamp: new Date(),
            requestId: this.generateRequestId()
          }
        };
      }

      // Check if already shared with this advocate
      const { data: existingShare } = await supabase
        .from('template_shares')
        .select('id')
        .eq('template_id', validated.template_id)
        .eq('shared_with_advocate_id', validated.shared_with_advocate_id)
        .single();

      if (existingShare) {
        return {
          data: null,
          error: {
            type: ErrorType.CONFLICT_ERROR,
            message: 'Template is already shared with this advocate',
            timestamp: new Date(),
            requestId: this.generateRequestId()
          }
        };
      }

      const { data, error } = await supabase
        .from('template_shares')
        .insert({
          template_id: validated.template_id,
          shared_by_advocate_id: user.id,
          shared_with_advocate_id: validated.shared_with_advocate_id,
          permissions: validated.permissions
        })
        .select()
        .single();

      if (error) {
        return {
          data: null,
          error: this.transformError(error, this.generateRequestId())
        };
      }

      toast.success(`Template "${template.name}" shared successfully`);
      return { data: data as TemplateShare, error: null };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          data: null,
          error: {
            type: ErrorType.VALIDATION_ERROR,
            message: error.errors[0]?.message || 'Validation failed',
            details: error.errors,
            timestamp: new Date(),
            requestId: this.generateRequestId()
          }
        };
      }

      return {
        data: null,
        error: this.transformError(error as Error, this.generateRequestId())
      };
    }
  }

  /**
   * Get template suggestions based on matter data
   */
  async getTemplateSuggestions(request: TemplateSuggestionRequest): Promise<ApiResponse<TemplateSuggestion[]>> {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        return {
          data: null,
          error: {
            type: ErrorType.AUTHENTICATION_ERROR,
            message: 'User not authenticated',
            timestamp: new Date(),
            requestId: this.generateRequestId()
          }
        };
      }

      const { data, error } = await supabase
        .rpc('suggest_templates_for_matter', {
          user_id: user.id,
          matter_type_input: request.matter_type || null,
          client_type_input: request.client_type || null,
          description_input: request.description || null
        });

      if (error) {
        return {
          data: null,
          error: this.transformError(error, this.generateRequestId())
        };
      }

      return { data: data || [], error: null };
    } catch (error) {
      return {
        data: null,
        error: this.transformError(error as Error, this.generateRequestId())
      };
    }
  }

  /**
   * Increment template usage count
   */
  async incrementUsage(templateId: string): Promise<ApiResponse<void>> {
    try {
      const { error } = await supabase
        .rpc('increment_template_usage', { template_uuid: templateId });

      if (error) {
        return {
          data: null,
          error: this.transformError(error, this.generateRequestId())
        };
      }

      return { data: null, error: null };
    } catch (error) {
      return {
        data: null,
        error: this.transformError(error as Error, this.generateRequestId())
      };
    }
  }

  /**
   * Get all template categories
   */
  async getCategories(): Promise<ApiResponse<TemplateCategory[]>> {
    try {
      const { data, error } = await supabase
        .from('template_categories')
        .select('*')
        .order('sort_order');

      if (error) {
        return {
          data: null,
          error: this.transformError(error, this.generateRequestId())
        };
      }

      return { data: data || [], error: null };
    } catch (error) {
      return {
        data: null,
        error: this.transformError(error as Error, this.generateRequestId())
      };
    }
  }

  /**
   * Search templates with filters
   */
  async searchTemplates(filters: TemplateSearchFilters): Promise<ApiResponse<MatterTemplateWithSharing[]>> {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        return {
          data: null,
          error: {
            type: ErrorType.AUTHENTICATION_ERROR,
            message: 'User not authenticated',
            timestamp: new Date(),
            requestId: this.generateRequestId()
          }
        };
      }

      let query = supabase
        .rpc('get_user_templates', { user_id: user.id });

      // Apply filters (this would be enhanced with more sophisticated filtering)
      if (filters.category) {
        // Note: This would need to be implemented in the RPC function
        // For now, we'll filter client-side
      }

      const { data, error } = await query;

      if (error) {
        return {
          data: null,
          error: this.transformError(error, this.generateRequestId())
        };
      }

      let filteredData = data || [];

      // Client-side filtering (should be moved to database for performance)
      if (filters.category) {
        filteredData = filteredData.filter(template => template.category === filters.category);
      }

      if (filters.is_shared !== undefined) {
        filteredData = filteredData.filter(template => template.is_shared === filters.is_shared);
      }

      if (filters.is_default !== undefined) {
        filteredData = filteredData.filter(template => template.is_default === filters.is_default);
      }

      if (filters.search_term) {
        const searchTerm = filters.search_term.toLowerCase();
        filteredData = filteredData.filter(template => 
          template.name.toLowerCase().includes(searchTerm) ||
          template.description?.toLowerCase().includes(searchTerm) ||
          template.category.toLowerCase().includes(searchTerm)
        );
      }

      // Apply sorting
      if (filters.sort_by) {
        filteredData.sort((a, b) => {
          const aValue = a[filters.sort_by!];
          const bValue = b[filters.sort_by!];
          
          if (filters.sort_order === 'desc') {
            return bValue > aValue ? 1 : -1;
          }
          return aValue > bValue ? 1 : -1;
        });
      }

      return { data: filteredData, error: null };
    } catch (error) {
      return {
        data: null,
        error: this.transformError(error as Error, this.generateRequestId())
      };
    }
  }

  /**
   * Get template usage statistics
   */
  async getUsageStats(): Promise<ApiResponse<TemplateUsageStats[]>> {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        return {
          data: null,
          error: {
            type: ErrorType.AUTHENTICATION_ERROR,
            message: 'User not authenticated',
            timestamp: new Date(),
            requestId: this.generateRequestId()
          }
        };
      }

      // This would be implemented with a proper RPC function
      // For now, return basic template data
      const { data, error } = await supabase
        .from('matter_templates')
        .select('id, name, usage_count, updated_at')
        .eq('advocate_id', user.id)
        .order('usage_count', { ascending: false });

      if (error) {
        return {
          data: null,
          error: this.transformError(error, this.generateRequestId())
        };
      }

      const stats: TemplateUsageStats[] = (data || []).map(template => ({
        template_id: template.id,
        template_name: template.name,
        usage_count: template.usage_count,
        last_used: template.updated_at,
        matters_created: template.usage_count // Simplified for now
      }));

      return { data: stats, error: null };
    } catch (error) {
      return {
        data: null,
        error: this.transformError(error as Error, this.generateRequestId())
      };
    }
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export singleton instance
export const matterTemplatesService = new MatterTemplatesService();