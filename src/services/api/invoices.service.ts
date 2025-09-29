import { supabase } from '../../lib/supabase';
import { z } from 'zod';
import { 
  Invoice, 
  InvoiceStatus, 
  TimeEntry, 
  Matter,
  BarPaymentRules,
  InvoiceGenerationRequest
} from '../../types';
import { toast } from 'react-hot-toast';
import { format, addDays } from 'date-fns';

// South African Bar Payment Rules
const BAR_PAYMENT_RULES: Record<string, BarPaymentRules> = {
  'Johannesburg': {
    paymentTermDays: 60,
    reminderSchedule: [30, 45, 55], // Days after invoice
    vatRate: 0.15,
    trustTransferDays: 7,
    lateFeePercentage: 0.02, // 2% per month
    prescriptionYears: 3
  },
  'Cape Town': {
    paymentTermDays: 90,
    reminderSchedule: [30, 60, 85],
    vatRate: 0.15,
    trustTransferDays: 14,
    lateFeePercentage: 0.015,
    prescriptionYears: 3
  }
};

// Validation schemas
const InvoiceValidation = z.object({
  matterId: z.string().uuid('Invalid matter ID'),
  feesAmount: z.number().positive('Fees amount must be positive'),
  disbursementsAmount: z.number().min(0, 'Disbursements cannot be negative').optional(),
  feeNarrative: z.string().min(10, 'Fee narrative must be at least 10 characters'),
  vatRate: z.number().min(0).max(1, 'VAT rate must be between 0 and 1').optional(),
  timeEntryIds: z.array(z.string().uuid()).optional()
});

const InvoiceGenerationValidation = z.object({
  matterId: z.string().uuid('Invalid matter ID'),
  timeEntryIds: z.array(z.string().uuid()).optional(),
  customNarrative: z.string().optional(),
  includeUnbilledTime: z.boolean().default(true),
  isProForma: z.boolean().default(false)
});

export class InvoiceService {
  // Generate invoice from matter with time entries (Phase 3)
  static async generateInvoice(request: InvoiceGenerationRequest): Promise<Invoice> {
    try {
      const validated = InvoiceGenerationValidation.parse(request);
      const { matterId, timeEntryIds, customNarrative, isProForma } = validated;
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('User not authenticated');
      }
      
      // Fetch matter details
      const { data: matter, error: matterError } = await supabase
        .from('matters')
        .select('*')
        .eq('id', matterId)
        .eq('advocate_id', user.id)
        .single();
      
      if (matterError || !matter) {
        throw new Error('Matter not found or unauthorized');
      }
      
      // Fetch unbilled time entries
      let timeEntriesQuery = supabase
        .from('time_entries')
        .select('*')
        .eq('matter_id', matterId)
        .eq('billed', false)
        .is('deleted_at', null);
      
      if (timeEntryIds && timeEntryIds.length > 0) {
        timeEntriesQuery = timeEntriesQuery.in('id', timeEntryIds);
      }
      
      const { data: timeEntries, error: entriesError } = await timeEntriesQuery;
      
      if (entriesError) throw entriesError;
      if (!timeEntries || timeEntries.length === 0) {
        throw new Error('No unbilled time entries found');
      }
      
      // Calculate fees
      const totalFees = timeEntries.reduce((sum, entry) => {
        return sum + ((entry.duration / 60) * entry.rate);
      }, 0);
      
      // Get disbursements
      const disbursements = matter.disbursements || 0;
      
      // Generate fee narrative
      const narrative = customNarrative || await this.generateFeeNarrative(
        matter,
        timeEntries,
        disbursements
      );
      
      // Generate invoice number
      const invoiceNumber = await this.generateInvoiceNumber(matter.bar);
      
      // Calculate dates based on Bar rules
      const rules = BAR_PAYMENT_RULES[matter.bar];
      if (!rules) {
        throw new Error(`Payment rules not found for bar: ${matter.bar}`);
      }
      
      const invoiceDate = new Date();
      const dueDate = addDays(invoiceDate, rules.paymentTermDays);
      const vatAmount = totalFees * rules.vatRate;
      const totalAmount = totalFees + vatAmount + disbursements;
      
      // Create invoice
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert({
          matter_id: matterId,
          invoice_number: invoiceNumber,
          matter_title: matter.title,
          client_name: matter.client_name,
          invoice_date: format(invoiceDate, 'yyyy-MM-dd'),
          due_date: format(dueDate, 'yyyy-MM-dd'),
          bar: matter.bar,
          amount: totalFees,
          vat_amount: vatAmount,
          total_amount: totalAmount,
          disbursements: disbursements,
          status: (isProForma ? 'Pro Forma' : 'Draft') as InvoiceStatus,
          fee_narrative: narrative,
          reminders_sent: 0,
          next_reminder_date: format(addDays(invoiceDate, rules.reminderSchedule[0]), 'yyyy-MM-dd'),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (invoiceError) throw invoiceError;
      
      // Mark time entries as billed (only for final invoices, not pro forma)
      if (!isProForma) {
        await supabase
          .from('time_entries')
          .update({ 
            billed: true, 
            invoice_id: invoice.id,
            updated_at: new Date().toISOString()
          })
        .in('id', timeEntries.map(e => e.id));
      }
      
      // Update matter WIP value (only for final invoices, not pro forma)
      if (!isProForma) {
      await supabase
        .from('matters')
        .update({ 
          wip_value: Math.max(0, (matter.wip_value || 0) - totalFees),
          actual_fee: (matter.actual_fee || 0) + totalFees,
          updated_at: new Date().toISOString()
        })
        .eq('id', matterId);
      }
      
      toast.success(isProForma ? 'Pro forma invoice generated successfully' : 'Invoice generated successfully');
      return this.mapDatabaseToInvoice(invoice);
      
    } catch (error) {
      console.error('Error generating invoice:', error);
      const message = error instanceof Error ? error.message : 'Failed to generate invoice';
      toast.error(message);
      throw error;
    }
  }

  // Create a new invoice (legacy method)
  static async createInvoice(data: {
    matterId: string;
    feesAmount: number;
    disbursementsAmount?: number;
    feeNarrative: string;
    vatRate?: number;
    timeEntryIds?: string[];
  }): Promise<Invoice> {
    try {
      // Validate input
      const validated = InvoiceValidation.parse(data);
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      // Get matter details for bar and validation
      const { data: matter, error: matterError } = await supabase
        .from('matters')
        .select('bar, title, client_name, advocate_id')
        .eq('id', validated.matterId)
        .single();

      if (matterError || !matter) {
        throw new Error('Matter not found');
      }

      if (matter.advocate_id !== user.id) {
        throw new Error('Unauthorized: You can only create invoices for your own matters');
      }
      
      // Generate invoice number
      const invoiceNumber = await this.generateInvoiceNumber(matter.bar);
      
      // Calculate due date based on bar rules
      const invoiceDate = new Date();
      const dueDate = this.calculateDueDate(invoiceDate, matter.bar);
      
      // Create the invoice
      const { data: invoice, error } = await supabase
        .from('invoices')
        .insert({
          matter_id: validated.matterId,
          advocate_id: user.id,
          invoice_number: invoiceNumber,
          invoice_date: invoiceDate.toISOString().split('T')[0],
          due_date: dueDate.toISOString().split('T')[0],
          bar: matter.bar,
          fees_amount: validated.feesAmount,
          disbursements_amount: validated.disbursementsAmount || 0,
          vat_rate: validated.vatRate || 0.15,
          fee_narrative: validated.feeNarrative,
          status: 'draft',
          reminders_sent: 0,
          reminder_history: []
        })
        .select()
        .single();
        
      if (error) {
        console.error('Database error:', error);
        throw new Error(`Failed to create invoice: ${error.message}`);
      }

      // Mark time entries as billed if provided
      if (validated.timeEntryIds && validated.timeEntryIds.length > 0) {
        await supabase
          .from('time_entries')
          .update({ 
            billed: true, 
            invoice_id: invoice.id 
          })
          .in('id', validated.timeEntryIds);
      }
      
      toast.success('Invoice created successfully');
      return invoice as Invoice;
      
    } catch (error) {
      console.error('Error creating invoice:', error);
      const message = error instanceof Error ? error.message : 'Failed to create invoice';
      toast.error(message);
      throw error;
    }
  }

  // Update invoice status
  static async updateInvoiceStatus(
    invoiceId: string, 
    newStatus: InvoiceStatus
  ): Promise<Invoice> {
    try {
      const { data: currentInvoice, error: fetchError } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', invoiceId)
        .single();
        
      if (fetchError || !currentInvoice) {
        throw new Error('Invoice not found');
      }
      
      // Validate status transition
      if (!this.isValidStatusTransition(currentInvoice.status as InvoiceStatus, newStatus)) {
        throw new Error(`Invalid status transition from ${currentInvoice.status} to ${newStatus}`);
      }
      
      // Prepare update data
      const updateData: Record<string, unknown> = {
        status: newStatus,
        updated_at: new Date().toISOString()
      };
      
      // Add status-specific fields
      if (newStatus === 'sent' && !currentInvoice.sent_at) {
        updateData.sent_at = new Date().toISOString();
      } else if (newStatus === 'paid' && !currentInvoice.date_paid) {
        updateData.date_paid = new Date().toISOString().split('T')[0];
        updateData.amount_paid = currentInvoice.total_amount;
      }
      
      const { data: updatedInvoice, error } = await supabase
        .from('invoices')
        .update(updateData)
        .eq('id', invoiceId)
        .select()
        .single();
        
      if (error) {
        throw new Error(`Failed to update invoice: ${error.message}`);
      }
      
      toast.success(`Invoice status updated to ${newStatus}`);
      return updatedInvoice as Invoice;
      
    } catch (error) {
      console.error('Error updating invoice status:', error);
      const message = error instanceof Error ? error.message : 'Failed to update invoice status';
      toast.error(message);
      throw error;
    }
  }

  // Get invoices with filtering and pagination
  static async getInvoices(options: {
    page?: number;
    pageSize?: number;
    status?: InvoiceStatus[];
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    matterId?: string;
  } = {}) {
    const {
      page = 1,
      pageSize = 10,
      status,
      search,
      sortBy = 'created_at',
      sortOrder = 'desc',
      matterId
    } = options;
    
    try {
      let query = supabase
        .from('invoices')
        .select(`
          *,
          matters!inner(title, client_name)
        `, { count: 'exact' })
        .is('deleted_at', null);
      
      // Apply filters
      if (status && status.length > 0) {
        query = query.in('status', status);
      }

      if (matterId) {
        query = query.eq('matter_id', matterId);
      }
      
      if (search) {
        query = query.or(`invoice_number.ilike.%${search}%,fee_narrative.ilike.%${search}%`);
      }
      
      // Apply sorting
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });
      
      // Apply pagination
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);
      
      const { data, error, count } = await query;
      
      if (error) {
        throw new Error(`Failed to fetch invoices: ${error.message}`);
      }
      
      return {
        data: (data || []) as Invoice[],
        pagination: {
          page,
          pageSize,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / pageSize)
        }
      };
      
    } catch (error) {
      console.error('Error fetching invoices:', error);
      toast.error('Failed to fetch invoices');
      throw error;
    }
  }

  // Record a payment
  static async recordPayment(invoiceId: string, payment: {
    amount: number;
    paymentDate: string;
    paymentMethod: string;
    reference?: string;
  }): Promise<void> {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      // Get current invoice
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', invoiceId)
        .single();

      if (invoiceError || !invoice) {
        throw new Error('Invoice not found');
      }

      // Record the payment
      const { error: paymentError } = await supabase
        .from('payments')
        .insert({
          invoice_id: invoiceId,
          advocate_id: user.id,
          amount: payment.amount,
          payment_date: payment.paymentDate,
          payment_method: payment.paymentMethod,
          reference: payment.reference
        });

      if (paymentError) {
        throw new Error(`Failed to record payment: ${paymentError.message}`);
      }

      // Update invoice payment status
      const newAmountPaid = (invoice.amount_paid || 0) + payment.amount;
      const newStatus = newAmountPaid >= invoice.total_amount ? 'paid' : invoice.status;

      await supabase
        .from('invoices')
        .update({
          amount_paid: newAmountPaid,
          status: newStatus,
          date_paid: newStatus === 'paid' ? payment.paymentDate : invoice.date_paid,
          payment_method: payment.paymentMethod,
          payment_reference: payment.reference
        })
        .eq('id', invoiceId);

      toast.success('Payment recorded successfully');
    } catch (error) {
      console.error('Error recording payment:', error);
      const message = error instanceof Error ? error.message : 'Failed to record payment';
      toast.error(message);
      throw error;
    }
  }

  // Convert pro forma to final invoice
  static async convertProFormaToFinal(proFormaId: string): Promise<Invoice> {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      // Get the pro forma invoice
      const { data: proForma, error: proFormaError } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', proFormaId)
        .eq('advocate_id', user.id)
        .eq('status', 'pro_forma')
        .single();

      if (proFormaError || !proForma) {
        throw new Error('Pro forma invoice not found or unauthorized');
      }

      // Get the matter details
      const { data: matter, error: matterError } = await supabase
        .from('matters')
        .select('*')
        .eq('id', proForma.matter_id)
        .single();

      if (matterError || !matter) {
        throw new Error('Associated matter not found');
      }

      // Get the time entries associated with this pro forma
      const { data: timeEntries, error: timeEntriesError } = await supabase
        .from('time_entries')
        .select('*')
        .eq('matter_id', proForma.matter_id)
        .eq('billed', false)
        .is('deleted_at', null);

      if (timeEntriesError) {
        throw timeEntriesError;
      }

      // Generate new invoice number for final invoice
      const finalInvoiceNumber = await this.generateInvoiceNumber(matter.bar);

      // Create the final invoice based on pro forma data
      const { data: finalInvoice, error: finalInvoiceError } = await supabase
        .from('invoices')
        .insert({
          matter_id: proForma.matter_id,
          advocate_id: user.id,
          invoice_number: finalInvoiceNumber,
          invoice_date: new Date().toISOString().split('T')[0],
          due_date: proForma.due_date,
          bar: proForma.bar,
          fees_amount: proForma.fees_amount,
          disbursements_amount: proForma.disbursements_amount,
          subtotal: proForma.subtotal,
          vat_rate: proForma.vat_rate,
          vat_amount: proForma.vat_amount,
          total_amount: proForma.total_amount,
          status: 'draft',
          fee_narrative: proForma.fee_narrative,
          internal_notes: `Converted from pro forma ${proForma.invoice_number}`,
          reminders_sent: 0,
          reminder_history: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (finalInvoiceError) {
        throw new Error(`Failed to create final invoice: ${finalInvoiceError.message}`);
      }

      // Update the pro forma status to indicate conversion
      await supabase
        .from('invoices')
        .update({
          status: 'converted',
          internal_notes: `Converted to final invoice ${finalInvoiceNumber}`,
          updated_at: new Date().toISOString()
        })
        .eq('id', proFormaId);

      // Mark time entries as billed and associate with final invoice
      if (timeEntries && timeEntries.length > 0) {
        await supabase
          .from('time_entries')
          .update({
            billed: true,
            invoice_id: finalInvoice.id,
            updated_at: new Date().toISOString()
          })
          .in('id', timeEntries.map(e => e.id));
      }

      // Update matter WIP value
      await supabase
        .from('matters')
        .update({
          wip_value: Math.max(0, (matter.wip_value || 0) - proForma.fees_amount),
          actual_fee: (matter.actual_fee || 0) + proForma.fees_amount,
          updated_at: new Date().toISOString()
        })
        .eq('id', matter.id);

      toast.success('Pro forma converted to final invoice successfully');
      return this.mapDatabaseToInvoice(finalInvoice);

    } catch (error) {
      console.error('Error converting pro forma to final invoice:', error);
      const message = error instanceof Error ? error.message : 'Failed to convert pro forma';
      toast.error(message);
      throw error;
    }
  }

  // Send invoice to client
  static async sendInvoice(invoiceId: string): Promise<void> {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      const { data: invoice, error } = await supabase
        .from('invoices')
        .update({ 
          status: 'sent',
          sent_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', invoiceId)
        .eq('advocate_id', user.id)
        .select()
        .single();
      
      if (error || !invoice) {
        throw new Error('Invoice not found or unauthorized');
      }
      
      toast.success('Invoice sent successfully');
      
    } catch (error) {
      console.error('Error sending invoice:', error);
      const message = error instanceof Error ? error.message : 'Failed to send invoice';
      toast.error(message);
      throw error;
    }
  }

  // Download invoice PDF
  static async downloadInvoicePDF(invoiceId: string): Promise<void> {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      // Get invoice details
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', invoiceId)
        .eq('advocate_id', user.id)
        .single();

      if (invoiceError || !invoice) {
        throw new Error('Invoice not found or unauthorized');
      }

      // For now, we'll create a simple text-based download
      // In production, this would generate a proper PDF
      const invoiceContent = `
INVOICE ${invoice.invoice_number}

Date: ${new Date(invoice.invoice_date).toLocaleDateString()}
Due Date: ${new Date(invoice.due_date).toLocaleDateString()}

Professional Fees: R${invoice.fees_amount.toFixed(2)}
Disbursements: R${invoice.disbursements_amount.toFixed(2)}
VAT: R${invoice.vat_amount.toFixed(2)}
Total: R${invoice.total_amount.toFixed(2)}

Fee Narrative:
${invoice.fee_narrative || 'No narrative provided'}
      `;

      const blob = new Blob([invoiceContent], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${invoice.invoice_number}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Error downloading invoice:', error);
      const message = error instanceof Error ? error.message : 'Failed to download invoice';
      toast.error(message);
      throw error;
    }
  }

  // Update invoice
  static async updateInvoice(invoiceId: string, updates: Partial<Invoice>): Promise<Invoice> {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      const { data: invoice, error } = await supabase
        .from('invoices')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', invoiceId)
        .eq('advocate_id', user.id)
        .select()
        .single();
        
      if (error || !invoice) {
        throw new Error('Invoice not found or unauthorized');
      }
      
      return this.mapDatabaseToInvoice(invoice);
      
    } catch (error) {
      console.error('Error updating invoice:', error);
      const message = error instanceof Error ? error.message : 'Failed to update invoice';
      toast.error(message);
      throw error;
    }
  }

  // Delete invoice
  static async deleteInvoice(invoiceId: string): Promise<void> {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      const { error } = await supabase
        .from('invoices')
        .update({
          deleted_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', invoiceId)
        .eq('advocate_id', user.id);
        
      if (error) {
        throw new Error(`Failed to delete invoice: ${error.message}`);
      }
      
    } catch (error) {
      console.error('Error deleting invoice:', error);
      const message = error instanceof Error ? error.message : 'Failed to delete invoice';
      toast.error(message);
      throw error;
    }
  }

  // Helper: Generate invoice number
  private static async generateInvoiceNumber(bar: string): Promise<string> {
    const year = new Date().getFullYear();
    const month = (new Date().getMonth() + 1).toString().padStart(2, '0');
    const prefix = bar === 'johannesburg' ? 'JHB' : 'CPT';
    
    try {
      // Get the last invoice number for this month and bar
      const { data } = await supabase
        .from('invoices')
        .select('invoice_number')
        .like('invoice_number', `${prefix}-${year}${month}-%`)
        .order('invoice_number', { ascending: false })
        .limit(1);
      
      let nextNumber = 1;
      if (data && data.length > 0) {
        const lastInvoice = data[0].invoice_number;
        const lastNumber = parseInt(lastInvoice.split('-').pop() || '0');
        nextNumber = lastNumber + 1;
      }
      
      return `${prefix}-${year}${month}-${nextNumber.toString().padStart(4, '0')}`;
    } catch (error) {
      console.error('Error generating invoice number:', error);
      // Fallback to timestamp-based number
      return `${prefix}-${year}${month}-${Date.now().toString().slice(-4)}`;
    }
  }

  // Helper: Calculate due date based on bar rules
  private static calculateDueDate(invoiceDate: Date, bar: string): Date {
    const dueDate = new Date(invoiceDate);
    if (bar === 'johannesburg') {
      dueDate.setDate(dueDate.getDate() + 60); // 60 days for Johannesburg Bar
    } else {
      dueDate.setDate(dueDate.getDate() + 90); // 90 days for Cape Town Bar
    }
    return dueDate;
  }

  // Helper: Validate status transitions
  private static isValidStatusTransition(from: InvoiceStatus, to: InvoiceStatus): boolean {
    const validTransitions: Record<InvoiceStatus, InvoiceStatus[]> = {
      'Draft': ['Sent', 'Unpaid'],
      'Sent': ['Paid', 'Overdue', 'Unpaid'],
      'Unpaid': ['Paid', 'Overdue', 'Sent'],
      'Overdue': ['Paid', 'Unpaid'],
      'Paid': [], // No transitions from paid
      'Pending': ['Draft', 'Sent', 'Unpaid']
    };

    return validTransitions[from]?.includes(to) ?? false;
  }

  // Generate professional fee narrative (Phase 3)
  static async generateFeeNarrative(
    matter: Matter,
    timeEntries: TimeEntry[],
    disbursements: number
  ): Promise<string> {
    // Group time entries by type of work
    const workSummary = this.summarizeWork(timeEntries);
    
    let narrative = `PROFESSIONAL SERVICES RENDERED\n\n`;
    narrative += `Matter: ${matter.title}\n`;
    narrative += `Client: ${matter.clientName}\n`;
    narrative += `Period: ${this.getPeriodDescription(timeEntries)}\n\n`;
    narrative += `SUMMARY OF SERVICES:\n`;
    
    // Add detailed work descriptions
    workSummary.forEach(category => {
      narrative += `\n${category.description}:\n`;
      narrative += `${category.hours.toFixed(1)} hours @ R${category.averageRate.toFixed(2)}/hour\n`;
      narrative += `Subtotal: R${category.total.toFixed(2)}\n`;
    });
    
    // Add disbursements if any
    if (disbursements > 0) {
      narrative += `\nDISBURSEMENTS:\n`;
      narrative += `Various expenses incurred: R${disbursements.toFixed(2)}\n`;
    }
    
    // Add professional closing
    narrative += `\n---\n`;
    narrative += `Services rendered with care and diligence in accordance with `;
    narrative += `the standards of the ${matter.bar} Society of Advocates.\n`;
    
    return narrative;
  }

  // Send invoice to client (Phase 3)
  static async sendInvoice(invoiceId: string): Promise<void> {
    try {
      const { data: invoice, error } = await supabase
        .from('invoices')
        .update({ 
          status: 'Sent' as InvoiceStatus,
          sent_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', invoiceId)
        .select('*, matter:matters(*)')
        .single();
      
      if (error || !invoice) {
        throw new Error('Invoice not found');
      }
      
      // Schedule reminders
      await this.scheduleReminders(invoice);
      
      toast.success('Invoice sent successfully');
      
    } catch (error) {
      console.error('Error sending invoice:', error);
      const message = error instanceof Error ? error.message : 'Failed to send invoice';
      toast.error(message);
      throw error;
    }
  }

  // Automated reminder system (Phase 3)
  static async processReminders(): Promise<void> {
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      
      // Find invoices due for reminders
      const { data: invoices } = await supabase
        .from('invoices')
        .select('*, matter:matters(*)')
        .eq('status', 'Sent')
        .lte('next_reminder_date', today)
        .is('deleted_at', null);
      
      if (!invoices || invoices.length === 0) return;
      
      for (const invoice of invoices) {
        await this.sendReminder(invoice);
        
        // Update reminder tracking
        const rules = BAR_PAYMENT_RULES[invoice.bar];
        const reminderCount = invoice.reminders_sent + 1;
        const nextReminderIndex = reminderCount;
        
        let nextReminderDate = null;
        if (nextReminderIndex < rules.reminderSchedule.length) {
          nextReminderDate = format(
            addDays(new Date(invoice.invoice_date), rules.reminderSchedule[nextReminderIndex]),
            'yyyy-MM-dd'
          );
        }
        
        await supabase
          .from('invoices')
          .update({
            reminders_sent: reminderCount,
            last_reminder_date: today,
            next_reminder_date: nextReminderDate,
            status: reminderCount >= 3 ? ('Overdue' as InvoiceStatus) : 'Sent',
            updated_at: new Date().toISOString()
          })
          .eq('id', invoice.id);
      }
      
    } catch (error) {
      console.error('Error processing reminders:', error);
    }
  }

  // Helper: Summarize work for narrative
  private static summarizeWork(timeEntries: TimeEntry[]) {
    const categories = new Map<string, { hours: number; entries: TimeEntry[] }>();
    
    timeEntries.forEach(entry => {
      const category = this.categorizeWork(entry.description);
      
      if (!categories.has(category)) {
        categories.set(category, {
          description: category,
          hours: 0,
          total: 0,
          rates: [],
          entries: []
        });
      }
      
      const cat = categories.get(category);
      const hours = entry.duration / 60;
      cat.hours += hours;
      cat.total += hours * entry.rate;
      cat.rates.push(entry.rate);
      cat.entries.push(entry);
    });
    
    return Array.from(categories.values()).map(cat => ({
      ...cat,
      averageRate: cat.rates.reduce((a: number, b: number) => a + b, 0) / cat.rates.length
    }));
  }
  
  // Helper: Categorize work type
  private static categorizeWork(description: string): string {
    const lower = description.toLowerCase();
    
    if (lower.includes('draft') || lower.includes('review')) return 'Drafting & Review';
    if (lower.includes('consult') || lower.includes('meeting')) return 'Consultations';
    if (lower.includes('research')) return 'Legal Research';
    if (lower.includes('court') || lower.includes('hearing')) return 'Court Appearances';
    if (lower.includes('correspond') || lower.includes('email')) return 'Correspondence';
    
    return 'General Legal Services';
  }
  
  // Helper: Get period description
  private static getPeriodDescription(timeEntries: TimeEntry[]): string {
    const dates = timeEntries.map(e => new Date(e.date));
    const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
    const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
    
    return `${format(minDate, 'dd MMMM yyyy')} to ${format(maxDate, 'dd MMMM yyyy')}`;
  }
  
  // Helper: Send reminder (placeholder for email integration)
  private static async sendReminder(invoice: Invoice): Promise<void> {
    // In production, integrate with email service
    console.log(`Sending reminder for invoice ${invoice.invoiceNumber}`);
  }
  
  // Helper: Schedule reminders
  private static async scheduleReminders(invoice: Invoice): Promise<void> {
    // In production, integrate with job scheduler
    console.log(`Scheduling reminders for invoice ${invoice.invoiceNumber}`);
  }
  
  // Helper: Map database record to Invoice type
  private static mapDatabaseToInvoice(dbInvoice: Record<string, unknown>): Invoice {
    return {
      id: dbInvoice.id as string,
      invoiceNumber: dbInvoice.invoice_number as string,
      matterId: dbInvoice.matter_id as string,
      matterTitle: dbInvoice.matter_title as string,
      clientName: dbInvoice.client_name as string,
      amount: dbInvoice.amount as number,
      vatAmount: dbInvoice.vat_amount as number,
      totalAmount: dbInvoice.total_amount as number,
      dateIssued: dbInvoice.invoice_date as string,
      dateDue: dbInvoice.due_date as string,
      datePaid: dbInvoice.date_paid as string | null,
      status: dbInvoice.status as InvoiceStatus,
      bar: dbInvoice.bar as string,
      paymentMethod: dbInvoice.payment_method as string | null,
      remindersSent: dbInvoice.reminders_sent as number,
      lastReminderDate: dbInvoice.last_reminder_date as string | null,
      nextReminderDate: dbInvoice.next_reminder_date as string | null,
      notes: dbInvoice.notes as string | null,
      feeNarrative: dbInvoice.fee_narrative as string | null,
      disbursements: dbInvoice.disbursements as number,
      sentAt: dbInvoice.sent_at as string | null,
      amountPaid: dbInvoice.amount_paid as number,
      paymentReference: dbInvoice.payment_reference as string | null
    };
  }
}