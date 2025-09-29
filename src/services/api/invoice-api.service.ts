/**
 * Invoice API Service
 * Handles all invoice-related database operations
 * Extends BaseApiService for consistent error handling and CRUD operations
 */

import { BaseApiService, type ApiResponse, type FilterOptions, type PaginationOptions } from './base-api.service';
import type { Invoice, InvoiceStatus, NewInvoiceForm, TimeEntry } from '../../types';

export interface InvoiceFilters extends FilterOptions {
  advocate_id?: string;
  matter_id?: string;
  status?: InvoiceStatus | InvoiceStatus[];
  bar?: 'johannesburg' | 'cape_town';
  is_overdue?: boolean;
  invoice_date_from?: string;
  invoice_date_to?: string;
  due_date_from?: string;
  due_date_to?: string;
  amount_min?: number;
  amount_max?: number;
}

export interface InvoiceStats {
  total: number;
  draft: number;
  sent: number;
  paid: number;
  overdue: number;
  totalAmount: number;
  totalPaid: number;
  totalOutstanding: number;
  averageDaysOutstanding: number;
}

export interface InvoiceGenerationOptions {
  timeEntries: TimeEntry[];
  matterId: string;
  advocateId: string;
  feeNarrative?: string;
  includeVAT?: boolean;
  customDueDate?: string;
}

export class InvoiceApiService extends BaseApiService<Invoice> {
  constructor() {
    super('invoices', `
      *,
      matter:matters(title, client_name, reference_number),
      advocate:advocates(full_name, practice_number, bar),
      time_entries(id, duration_minutes, rate, description),
      payments(id, amount, payment_date, payment_method)
    `);
  }

  /**
   * Get invoices for specific advocate
   */
  async getByAdvocate(
    advocateId: string,
    options: {
      filters?: Omit<InvoiceFilters, 'advocate_id'>;
      pagination?: PaginationOptions;
    } = {}
  ): Promise<ApiResponse<Invoice[]>> {
    const filters: InvoiceFilters = {
      ...options.filters,
      advocate_id: advocateId,
      deleted_at: null
    };

    return this.getAll({
      filters,
      pagination: options.pagination,
      sort: { column: 'invoice_date', ascending: false }
    });
  }

  /**
   * Get invoices for specific matter
   */
  async getByMatter(matterId: string): Promise<ApiResponse<Invoice[]>> {
    return this.getAll({
      filters: { matter_id: matterId },
      sort: { column: 'invoice_date', ascending: false }
    });
  }

  /**
   * Get overdue invoices
   */
  async getOverdueInvoices(advocateId: string): Promise<ApiResponse<Invoice[]>> {
    return this.getByAdvocate(advocateId, {
      filters: {
        is_overdue: true,
        status: ['sent', 'viewed']
      }
    });
  }

  /**
   * Get unpaid invoices
   */
  async getUnpaidInvoices(advocateId: string): Promise<ApiResponse<Invoice[]>> {
    return this.getByAdvocate(advocateId, {
      filters: {
        status: ['sent', 'viewed', 'overdue']
      }
    });
  }

  /**
   * Generate invoice from time entries
   */
  async generateFromTimeEntries(options: InvoiceGenerationOptions): Promise<ApiResponse<Invoice>> {
    const { timeEntries, matterId, advocateId, feeNarrative, includeVAT = true, customDueDate } = options;

    // Calculate totals
    const feesAmount = timeEntries.reduce((sum, entry) => {
      return sum + ((entry.duration_minutes / 60) * entry.rate);
    }, 0);

    const disbursementsAmount = 0; // Will be calculated from disbursement entries
    const vatRate = includeVAT ? 0.15 : 0;

    // Generate invoice number
    const invoiceNumber = await this.generateInvoiceNumber(advocateId);

    // Calculate due date based on bar rules
    const invoiceDate = new Date();
    const dueDate = customDueDate ? new Date(customDueDate) : this.calculateDueDate(invoiceDate, 'johannesburg'); // Default to JHB rules

    const invoiceData: Partial<Invoice> = {
      matter_id: matterId,
      advocate_id: advocateId,
      invoice_number: invoiceNumber,
      invoice_date: invoiceDate.toISOString().split('T')[0],
      due_date: dueDate.toISOString().split('T')[0],
      bar: 'johannesburg', // Should be determined from advocate profile
      fees_amount: feesAmount,
      disbursements_amount: disbursementsAmount,
      vat_rate: vatRate,
      status: 'draft',
      amount_paid: 0,
      fee_narrative: feeNarrative || this.generateDefaultNarrative(timeEntries),
      reminders_sent: 0
    };

    return this.create(invoiceData);
  }

  /**
   * Update invoice status
   */
  async updateStatus(
    invoiceId: string,
    status: InvoiceStatus,
    metadata?: {
      sent_at?: string;
      viewed_at?: string;
      date_paid?: string;
      payment_method?: string;
      payment_reference?: string;
    }
  ): Promise<ApiResponse<Invoice>> {
    const updateData: Partial<Invoice> = {
      status,
      ...metadata
    };

    return this.update(invoiceId, updateData);
  }

  /**
   * Record payment for invoice
   */
  async recordPayment(
    invoiceId: string,
    amount: number,
    paymentDate: string,
    paymentMethod: string,
    reference?: string
  ): Promise<ApiResponse<Invoice>> {
    // First get the current invoice to calculate new paid amount
    const invoiceResponse = await this.getById(invoiceId);
    
    if (invoiceResponse.error) {
      return { data: null, error: invoiceResponse.error };
    }

    const invoice = invoiceResponse.data;
    if (!invoice) {
      return { data: null, error: invoiceResponse.error };
    }

    const newAmountPaid = (invoice.amount_paid || 0) + amount;
    const totalAmount = invoice.total_amount || 0;
    const isFullyPaid = newAmountPaid >= totalAmount;

    const updateData: Partial<Invoice> = {
      amount_paid: newAmountPaid,
      status: isFullyPaid ? 'paid' : invoice.status,
      date_paid: isFullyPaid ? paymentDate : invoice.date_paid,
      payment_method: paymentMethod,
      payment_reference: reference
    };

    return this.update(invoiceId, updateData);
  }

  /**
   * Send reminder for invoice
   */
  async sendReminder(invoiceId: string): Promise<ApiResponse<Invoice>> {
    const invoiceResponse = await this.getById(invoiceId);
    
    if (invoiceResponse.error) {
      return { data: null, error: invoiceResponse.error };
    }

    const invoice = invoiceResponse.data;
    if (!invoice) {
      return { data: null, error: invoiceResponse.error };
    }

    const remindersSent = (invoice.reminders_sent || 0) + 1;
    const today = new Date().toISOString().split('T')[0];

    // Calculate next reminder date (7 days from now)
    const nextReminderDate = new Date();
    nextReminderDate.setDate(nextReminderDate.getDate() + 7);

    const updateData: Partial<Invoice> = {
      reminders_sent: remindersSent,
      last_reminder_date: today,
      next_reminder_date: nextReminderDate.toISOString().split('T')[0]
    };

    return this.update(invoiceId, updateData);
  }

  /**
   * Get invoice statistics for advocate
   */
  async getStats(advocateId: string): Promise<ApiResponse<InvoiceStats>> {
    const requestId = this.generateRequestId();

    try {
      const invoicesResponse = await this.getByAdvocate(advocateId);
      
      if (invoicesResponse.error) {
        return { data: null, error: invoicesResponse.error };
      }

      const invoices = invoicesResponse.data || [];

      // Calculate statistics
      const stats: InvoiceStats = {
        total: invoices.length,
        draft: invoices.filter(i => i.status === 'draft').length,
        sent: invoices.filter(i => i.status === 'sent').length,
        paid: invoices.filter(i => i.status === 'paid').length,
        overdue: invoices.filter(i => i.is_overdue).length,
        totalAmount: invoices.reduce((sum, i) => sum + (i.total_amount || 0), 0),
        totalPaid: invoices.reduce((sum, i) => sum + (i.amount_paid || 0), 0),
        totalOutstanding: invoices.reduce((sum, i) => sum + (i.balance_due || 0), 0),
        averageDaysOutstanding: this.calculateAverageDaysOutstanding(invoices)
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
   * Get invoices by status
   */
  async getByStatus(
    advocateId: string,
    status: InvoiceStatus | InvoiceStatus[]
  ): Promise<ApiResponse<Invoice[]>> {
    return this.getByAdvocate(advocateId, {
      filters: { status }
    });
  }

  /**
   * Search invoices
   */
  async searchInvoices(
    advocateId: string,
    query: string,
    options: {
      filters?: Omit<InvoiceFilters, 'advocate_id'>;
      pagination?: PaginationOptions;
    } = {}
  ): Promise<ApiResponse<Invoice[]>> {
    const searchColumns = [
      'invoice_number',
      'fee_narrative',
      'internal_notes',
      'payment_reference'
    ];

    const filters: InvoiceFilters = {
      ...options.filters,
      advocate_id: advocateId
    };

    return this.search(query, searchColumns, {
      filters,
      pagination: options.pagination
    });
  }

  /**
   * Get invoices due for reminders
   */
  async getInvoicesDueForReminders(advocateId: string): Promise<ApiResponse<Invoice[]>> {
    const today = new Date().toISOString().split('T')[0];

    return this.getByAdvocate(advocateId, {
      filters: {
        status: ['sent', 'viewed'],
        next_reminder_date: today
      }
    });
  }

  /**
   * Calculate due date based on bar association rules
   */
  private calculateDueDate(invoiceDate: Date, bar: 'johannesburg' | 'cape_town'): Date {
    const dueDate = new Date(invoiceDate);
    
    switch (bar) {
      case 'johannesburg':
        dueDate.setDate(dueDate.getDate() + 60);
        break;
      case 'cape_town':
        dueDate.setDate(dueDate.getDate() + 90);
        break;
      default:
        dueDate.setDate(dueDate.getDate() + 60);
    }

    return dueDate;
  }

  /**
   * Generate unique invoice number
   */
  private async generateInvoiceNumber(advocateId: string): Promise<string> {
    const year = new Date().getFullYear();
    const yearStart = `${year}-01-01`;
    const yearEnd = `${year}-12-31`;

    const countResponse = await this.count({
      advocate_id: advocateId,
      invoice_date_from: yearStart,
      invoice_date_to: yearEnd
    });

    const count = (countResponse.data || 0) + 1;
    const paddedCount = count.toString().padStart(3, '0');

    return `INV-${year}-${paddedCount}`;
  }

  /**
   * Generate default fee narrative from time entries
   */
  private generateDefaultNarrative(timeEntries: TimeEntry[]): string {
    const totalHours = timeEntries.reduce((sum, entry) => sum + (entry.duration_minutes / 60), 0);
    const workTypes = [...new Set(timeEntries.map(entry => this.extractWorkType(entry.description)))];

    let narrative = `Professional services rendered (${totalHours.toFixed(1)} hours)`;
    
    if (workTypes.length > 0) {
      narrative += ` including ${workTypes.join(', ')}`;
    }

    return narrative + '.';
  }

  /**
   * Extract work type from time entry description
   */
  private extractWorkType(description: string): string {
    const lowerDesc = description.toLowerCase();
    
    if (lowerDesc.includes('research') || lowerDesc.includes('review')) return 'research';
    if (lowerDesc.includes('draft') || lowerDesc.includes('write')) return 'drafting';
    if (lowerDesc.includes('client') || lowerDesc.includes('meeting')) return 'consultation';
    if (lowerDesc.includes('court') || lowerDesc.includes('hearing')) return 'court appearance';
    if (lowerDesc.includes('email') || lowerDesc.includes('correspondence')) return 'correspondence';
    
    return 'legal services';
  }

  /**
   * Calculate average days outstanding for invoices
   */
  private calculateAverageDaysOutstanding(invoices: Invoice[]): number {
    const unpaidInvoices = invoices.filter(i => i.status !== 'paid' && i.days_outstanding);
    
    if (unpaidInvoices.length === 0) return 0;

    const totalDays = unpaidInvoices.reduce((sum, i) => sum + (i.days_outstanding || 0), 0);
    return Math.round(totalDays / unpaidInvoices.length);
  }

  // Helper method to generate request ID (inherited from BaseApiService)
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  }
}

// Export singleton instance
export const invoiceApiService = new InvoiceApiService();