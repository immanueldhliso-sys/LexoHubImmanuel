import { supabase } from '@/lib/supabase';
import type { Matter, NewMatterForm, MatterStatus } from '@/types';
import { z } from 'zod';
import { toast } from 'react-hot-toast';

// Validation schemas
const MatterValidation = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(500, 'Title too long'),
  clientName: z.string().min(2, 'Client name must be at least 2 characters').max(255, 'Client name too long'),
  clientEmail: z.string().email('Invalid email format').optional().or(z.literal('')),
  clientPhone: z.string().regex(/^[0-9+\-\s()]+$/, 'Invalid phone format').optional().or(z.literal('')),
  instructingAttorney: z.string().min(2, 'Attorney name must be at least 2 characters').max(255, 'Attorney name too long'),
  instructingAttorneyEmail: z.string().email('Invalid email format').optional().or(z.literal('')),
  instructingFirm: z.string().max(255, 'Firm name too long').optional().or(z.literal('')),
  bar: z.enum(['johannesburg', 'cape_town'], { required_error: 'Please select a bar' }),
  briefType: z.string().min(2, 'Brief type must be at least 2 characters').max(100, 'Brief type too long'),
  estimatedFee: z.number().positive('Fee must be positive').optional(),
  riskLevel: z.enum(['low', 'medium', 'high'], { required_error: 'Please select a risk level' }),
  description: z.string().max(2000, 'Description too long').optional()
});

export class MatterService {
  // Create a new matter with conflict checking
  static async createMatter(data: NewMatterForm): Promise<Matter> {
    try {
      // Validate input
      const validated = MatterValidation.parse(data);
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('User not authenticated');
      }
      
      // Perform conflict check
      const { data: conflictCheck, error: conflictError } = await supabase
        .rpc('check_conflict', {
          p_advocate_id: user.id,
          p_client_name: validated.clientName,
          p_opposing_party: '' // Would be extracted from description in full implementation
        });
        
      if (conflictError) {
        console.warn('Conflict check failed:', conflictError);
        // Continue without conflict check in development
      }
      
      if (conflictCheck?.[0]?.has_conflict) {
        const proceed = await this.confirmConflictOverride(conflictCheck[0].conflict_reason);
        if (!proceed) {
          throw new Error('Matter creation cancelled due to conflict');
        }
      }
      
      // Generate reference number
      const referenceNumber = await this.generateReferenceNumber(validated.bar);
      
      // Create the matter
      const { data: matter, error } = await supabase
        .from('matters')
        .insert({
          advocate_id: user.id,
          reference_number: referenceNumber,
          title: validated.title,
          client_name: validated.clientName,
          client_email: validated.clientEmail || null,
          client_phone: validated.clientPhone || null,
          instructing_attorney: validated.instructingAttorney,
          instructing_attorney_email: validated.instructingAttorneyEmail || null,
          instructing_firm: validated.instructingFirm || null,
          bar: validated.bar,
          matter_type: validated.briefType,
          estimated_fee: validated.estimatedFee || null,
          risk_level: validated.riskLevel,
          status: 'pending',
          conflict_check_completed: !conflictCheck?.[0]?.has_conflict,
          conflict_check_date: new Date().toISOString(),
          description: validated.description || null,
          wip_value: 0,
          trust_balance: 0,
          disbursements: 0,
          vat_exempt: false,
          tags: [],
          date_instructed: new Date().toISOString().split('T')[0]
        })
        .select()
        .single();
        
      if (error) {
        console.error('Database error:', error);
        throw new Error(`Failed to create matter: ${error.message}`);
      }
      
      // Log the action
      await this.auditLog('matters', matter.id, 'INSERT', null, matter);
      
      toast.success('Matter created successfully');
      return matter as Matter;
      
    } catch (error) {
      console.error('Error creating matter:', error);
      const message = error instanceof Error ? error.message : 'Failed to create matter';
      toast.error(message);
      throw error;
    }
  }
  
  // Update matter status with validation
  static async updateMatterStatus(
    matterId: string, 
    newStatus: MatterStatus, 
    reason?: string
  ): Promise<Matter> {
    try {
      const { data: currentMatter, error: fetchError } = await supabase
        .from('matters')
        .select('*')
        .eq('id', matterId)
        .single();
        
      if (fetchError || !currentMatter) {
        throw new Error('Matter not found');
      }
      
      // Validate status transition
      if (!this.isValidStatusTransition(currentMatter.status as MatterStatus, newStatus)) {
        throw new Error(`Invalid status transition from ${currentMatter.status} to ${newStatus}`);
      }
      
      // Prepare update data
      const updateData: Record<string, unknown> = {
        status: newStatus,
        updated_at: new Date().toISOString()
      };
      
      // Add status-specific fields
      const currentDate = new Date().toISOString().split('T')[0];
      if (newStatus === 'closed') {
        updateData.date_closed = currentDate;
      } else if (newStatus === 'settled') {
        updateData.date_settled = currentDate;
      } else if (newStatus === 'active' && !currentMatter.date_commenced) {
        updateData.date_commenced = currentDate;
      }
      
      const { data: updatedMatter, error } = await supabase
        .from('matters')
        .update(updateData)
        .eq('id', matterId)
        .select()
        .single();
        
      if (error) {
        throw new Error(`Failed to update matter: ${error.message}`);
      }
      
      // Add note if reason provided
      if (reason) {
        await supabase.from('notes').insert({
          matter_id: matterId,
          advocate_id: currentMatter.advocate_id,
          content: `Status changed from ${currentMatter.status} to ${newStatus}: ${reason}`,
          is_internal: true
        });
      }
      
      // Audit log
      await this.auditLog('matters', matterId, 'UPDATE', currentMatter, updatedMatter);
      
      toast.success(`Matter status updated to ${newStatus}`);
      return updatedMatter as Matter;
      
    } catch (error) {
      console.error('Error updating matter status:', error);
      const message = error instanceof Error ? error.message : 'Failed to update matter status';
      toast.error(message);
      throw error;
    }
  }
  
  // Get matters with filtering, sorting, and pagination
  static async getMatters(options: {
    page?: number;
    pageSize?: number;
    status?: MatterStatus[];
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  } = {}) {
    const {
      page = 1,
      pageSize = 10,
      status,
      search,
      sortBy = 'created_at',
      sortOrder = 'desc'
    } = options;
    
    try {
      let query = supabase
        .from('matters')
        .select('*', { count: 'exact' })
        .is('deleted_at', null);
      
      // Apply filters
      if (status && status.length > 0) {
        query = query.in('status', status);
      }
      
      if (search) {
        query = query.or(`title.ilike.%${search}%,client_name.ilike.%${search}%,reference_number.ilike.%${search}%`);
      }
      
      // Apply sorting
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });
      
      // Apply pagination
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);
      
      const { data, error, count } = await query;
      
      if (error) {
        throw new Error(`Failed to fetch matters: ${error.message}`);
      }
      
      return {
        data: (data || []) as Matter[],
        pagination: {
          page,
          pageSize,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / pageSize)
        }
      };
      
    } catch (error) {
      console.error('Error fetching matters:', error);
      toast.error('Failed to fetch matters');
      throw error;
    }
  }

  // Get a single matter by ID
  static async getMatterById(matterId: string): Promise<Matter | null> {
    try {
      const { data, error } = await supabase
        .from('matters')
        .select('*')
        .eq('id', matterId)
        .is('deleted_at', null)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Matter not found
        }
        throw new Error(`Failed to fetch matter: ${error.message}`);
      }

      return data as Matter;
    } catch (error) {
      console.error('Error fetching matter:', error);
      throw error;
    }
  }

  // Soft delete a matter
  static async deleteMatter(matterId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('matters')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', matterId);

      if (error) {
        throw new Error(`Failed to delete matter: ${error.message}`);
      }

      await this.auditLog('matters', matterId, 'DELETE', null, { deleted_at: new Date().toISOString() });
      toast.success('Matter deleted successfully');
    } catch (error) {
      console.error('Error deleting matter:', error);
      const message = error instanceof Error ? error.message : 'Failed to delete matter';
      toast.error(message);
      throw error;
    }
  }
  
  // Helper: Generate reference number
  private static async generateReferenceNumber(bar: string): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = bar === 'johannesburg' ? 'JHB' : 'CPT';
    
    try {
      // Get the last reference number for this year and bar
      const { data } = await supabase
        .from('matters')
        .select('reference_number')
        .like('reference_number', `${prefix}/${year}/%`)
        .order('reference_number', { ascending: false })
        .limit(1);
      
      let nextNumber = 1;
      if (data && data.length > 0) {
        const lastRef = data[0].reference_number;
        const lastNumber = parseInt(lastRef.split('/').pop() || '0');
        nextNumber = lastNumber + 1;
      }
      
      return `${prefix}/${year}/${nextNumber.toString().padStart(4, '0')}`;
    } catch (error) {
      console.error('Error generating reference number:', error);
      // Fallback to timestamp-based reference
      return `${prefix}/${year}/${Date.now().toString().slice(-4)}`;
    }
  }
  
  // Helper: Validate status transitions
  private static isValidStatusTransition(from: MatterStatus, to: MatterStatus): boolean {
    const validTransitions: Record<MatterStatus, MatterStatus[]> = {
      'pending': ['active', 'closed'],
      'active': ['settled', 'closed', 'on_hold'],
      'on_hold': ['active', 'closed'],
      'settled': ['closed'],
      'closed': [] // No transitions from closed
    };
    
    return validTransitions[from]?.includes(to) || false;
  }
  
  // Helper: Confirm conflict override
  private static async confirmConflictOverride(reason: string): Promise<boolean> {
    // In a real implementation, this would show a modal
    return confirm(`Conflict detected: ${reason}\n\nDo you want to proceed anyway?`);
  }
  
  // Helper: Audit logging
  private static async auditLog(
    table: string,
    recordId: string,
    action: string,
    oldValues: Record<string, unknown>,
    newValues: Record<string, unknown>
  ) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      await supabase.from('audit_log').insert({
        advocate_id: user?.id || null,
        table_name: table,
        record_id: recordId,
        action,
        old_values: oldValues,
        new_values: newValues
      });
    } catch (error) {
      console.error('Audit logging failed:', error);
      // Don't throw - audit logging failure shouldn't break the main operation
    }
  }
}

// Export a singleton instance for convenience
export const mattersService = MatterService;