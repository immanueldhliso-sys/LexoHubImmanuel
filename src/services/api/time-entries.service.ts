import { supabase } from '@/lib/supabase';
import type { TimeEntry } from '@/types';
import { z } from 'zod';
import { toast } from 'react-hot-toast';

// Validation schemas
const TimeEntryValidation = z.object({
  matterId: z.string().uuid('Invalid matter ID'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  durationMinutes: z.number().positive('Duration must be positive'),
  description: z.string().min(5, 'Description must be at least 5 characters'),
  rate: z.number().positive('Rate must be positive'),
  billable: z.boolean().optional(),
  recordingMethod: z.enum(['manual', 'timer', 'ai_suggested']).optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional()
});

export class TimeEntryService {
  // Create a new time entry
  static async createTimeEntry(data: {
    matterId: string;
    date: string;
    durationMinutes: number;
    description: string;
    rate: number;
    billable?: boolean;
    recordingMethod?: 'manual' | 'timer' | 'ai_suggested';
    startTime?: string;
    endTime?: string;
  }): Promise<TimeEntry> {
    try {
      // Validate input
      const validated = TimeEntryValidation.parse(data);
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      // Verify matter ownership
      const { data: matter, error: matterError } = await supabase
        .from('matters')
        .select('advocate_id, title')
        .eq('id', validated.matterId)
        .single();

      if (matterError || !matter) {
        throw new Error('Matter not found');
      }

      if (matter.advocate_id !== user.id) {
        throw new Error('Unauthorized: You can only add time entries to your own matters');
      }
      
      // Create the time entry
      const { data: timeEntry, error } = await supabase
        .from('time_entries')
        .insert({
          matter_id: validated.matterId,
          advocate_id: user.id,
          date: validated.date,
          duration_minutes: validated.durationMinutes,
          description: validated.description,
          rate: validated.rate,
          billable: validated.billable ?? true,
          recording_method: validated.recordingMethod || 'manual',
          start_time: validated.startTime || null,
          end_time: validated.endTime || null,
          billed: false,
          write_off: false
        })
        .select()
        .single();
        
      if (error) {
        console.error('Database error:', error);
        throw new Error(`Failed to create time entry: ${error.message}`);
      }

      // Update matter WIP value
      await this.updateMatterWIP(validated.matterId);
      
      toast.success('Time entry created successfully');
      return timeEntry as TimeEntry;
      
    } catch (error) {
      console.error('Error creating time entry:', error);
      const message = error instanceof Error ? error.message : 'Failed to create time entry';
      toast.error(message);
      throw error;
    }
  }

  // Update a time entry
  static async updateTimeEntry(
    timeEntryId: string,
    updates: Partial<{
      date: string;
      durationMinutes: number;
      description: string;
      rate: number;
      billable: boolean;
    }>
  ): Promise<TimeEntry> {
    try {
      // Get current time entry
      const { data: currentEntry, error: fetchError } = await supabase
        .from('time_entries')
        .select('*')
        .eq('id', timeEntryId)
        .single();

      if (fetchError || !currentEntry) {
        throw new Error('Time entry not found');
      }

      // Check if already billed
      if (currentEntry.billed) {
        throw new Error('Cannot update billed time entries');
      }

      // Prepare update data
      const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString()
      };

      if (updates.date) updateData.date = updates.date;
      if (updates.durationMinutes) updateData.duration_minutes = updates.durationMinutes;
      if (updates.description) updateData.description = updates.description;
      if (updates.rate) updateData.rate = updates.rate;
      if (updates.billable !== undefined) updateData.billable = updates.billable;

      const { data: updatedEntry, error } = await supabase
        .from('time_entries')
        .update(updateData)
        .eq('id', timeEntryId)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update time entry: ${error.message}`);
      }

      // Update matter WIP value
      await this.updateMatterWIP(currentEntry.matter_id);

      toast.success('Time entry updated successfully');
      return updatedEntry as TimeEntry;

    } catch (error) {
      console.error('Error updating time entry:', error);
      const message = error instanceof Error ? error.message : 'Failed to update time entry';
      toast.error(message);
      throw error;
    }
  }

  // Get time entries with filtering and pagination
  static async getTimeEntries(options: {
    page?: number;
    pageSize?: number;
    matterId?: string;
    billed?: boolean;
    dateFrom?: string;
    dateTo?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  } = {}) {
    const {
      page = 1,
      pageSize = 50,
      matterId,
      billed,
      dateFrom,
      dateTo,
      sortBy = 'date',
      sortOrder = 'desc'
    } = options;
    
    try {
      let query = supabase
        .from('time_entries')
        .select(`
          *,
          matters!inner(title, client_name)
        `, { count: 'exact' })
        .is('deleted_at', null);
      
      // Apply filters
      if (matterId) {
        query = query.eq('matter_id', matterId);
      }

      if (billed !== undefined) {
        query = query.eq('billed', billed);
      }

      if (dateFrom) {
        query = query.gte('date', dateFrom);
      }

      if (dateTo) {
        query = query.lte('date', dateTo);
      }
      
      // Apply sorting
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });
      
      // Apply pagination
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);
      
      const { data, error, count } = await query;
      
      if (error) {
        throw new Error(`Failed to fetch time entries: ${error.message}`);
      }
      
      return {
        data: (data || []) as TimeEntry[],
        pagination: {
          page,
          pageSize,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / pageSize)
        }
      };
      
    } catch (error) {
      console.error('Error fetching time entries:', error);
      toast.error('Failed to fetch time entries');
      throw error;
    }
  }

  // Delete a time entry (soft delete)
  static async deleteTimeEntry(timeEntryId: string): Promise<void> {
    try {
      // Get current time entry
      const { data: currentEntry, error: fetchError } = await supabase
        .from('time_entries')
        .select('*')
        .eq('id', timeEntryId)
        .single();

      if (fetchError || !currentEntry) {
        throw new Error('Time entry not found');
      }

      // Check if already billed
      if (currentEntry.billed) {
        throw new Error('Cannot delete billed time entries');
      }

      const { error } = await supabase
        .from('time_entries')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', timeEntryId);

      if (error) {
        throw new Error(`Failed to delete time entry: ${error.message}`);
      }

      // Update matter WIP value
      await this.updateMatterWIP(currentEntry.matter_id);

      toast.success('Time entry deleted successfully');
    } catch (error) {
      console.error('Error deleting time entry:', error);
      const message = error instanceof Error ? error.message : 'Failed to delete time entry';
      toast.error(message);
      throw error;
    }
  }

  // Get unbilled time entries for a matter
  static async getUnbilledTimeEntries(matterId: string): Promise<TimeEntry[]> {
    try {
      const { data, error } = await supabase
        .from('time_entries')
        .select('*')
        .eq('matter_id', matterId)
        .eq('billed', false)
        .eq('billable', true)
        .is('deleted_at', null)
        .order('date', { ascending: true });

      if (error) {
        throw new Error(`Failed to fetch unbilled time entries: ${error.message}`);
      }

      return (data || []) as TimeEntry[];
    } catch (error) {
      console.error('Error fetching unbilled time entries:', error);
      throw error;
    }
  }

  // Helper: Update matter WIP value
  private static async updateMatterWIP(matterId: string): Promise<void> {
    try {
      // Calculate total unbilled time
      const { data: timeEntries, error } = await supabase
        .from('time_entries')
        .select('amount')
        .eq('matter_id', matterId)
        .eq('billed', false)
        .eq('billable', true)
        .is('deleted_at', null);

      if (error) {
        console.error('Error calculating WIP:', error);
        return;
      }

      const wipValue = timeEntries?.reduce((total, entry) => total + (entry.amount || 0), 0) || 0;

      // Update matter WIP value
      await supabase
        .from('matters')
        .update({ wip_value: wipValue })
        .eq('id', matterId);

    } catch (error) {
      console.error('Error updating matter WIP:', error);
      // Don't throw - WIP update failure shouldn't break the main operation
    }
  }
}