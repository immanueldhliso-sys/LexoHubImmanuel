import { supabase } from '../../lib/supabase';
import type { ProForma, ProFormaGenerationRequest, ProFormaStatus } from '../../types';
import { toast } from 'react-hot-toast';

export class ProFormaService {
  private static instance: ProFormaService;

  public static getInstance(): ProFormaService {
    if (!ProFormaService.instance) {
      ProFormaService.instance = new ProFormaService();
    }
    return ProFormaService.instance;
  }

  /**
   * Get all pro formas for the current user
   */
  async getProFormas(): Promise<ProForma[]> {
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      // Query invoices table for pro formas
      const { data: invoices, error } = await supabase
        .from('invoices')
        .select(`
          *,
          matters!inner(title, client_name)
        `)
        .eq('advocate_id', user.id)
        .eq('is_pro_forma', true)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      // Transform invoice data to ProForma format
      return (invoices || []).map(invoice => this.mapInvoiceToProForma(invoice));
    } catch (error) {
      console.error('Error fetching pro formas:', error);
      // Return empty array as fallback
      return [];
    }
  }

  /**
   * Generate a new pro forma
   */
  async generateProForma(data: ProFormaGenerationRequest): Promise<ProForma> {
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      // Get advocate data to retrieve bar association
      const { data: advocate, error: advocateError } = await supabase
        .from('advocates')
        .select('bar')
        .eq('id', user.id)
        .single();

      if (advocateError || !advocate) {
        throw new Error('Advocate data not found');
      }

      // Generate quote number
      const quoteNumber = await this.generateQuoteNumber();

      // Set VAT rate and fees amount
      const vatRate = 0.15; // VAT rate as decimal (15%)
      const feesAmount = data.total_amount;

      // Create pro forma as an invoice with is_pro_forma = true
      // Note: subtotal, vat_amount, and total_amount are generated columns
      const { data: invoice, error } = await supabase
        .from('invoices')
        .insert({
          matter_id: data.matter_id,
          advocate_id: user.id,
          invoice_number: quoteNumber,
          invoice_date: data.quote_date,
          due_date: data.valid_until,
          fees_amount: feesAmount,
          disbursements_amount: 0,
          vat_rate: vatRate,
          bar: advocate.bar,
          status: 'pro_forma',
          is_pro_forma: true,
          fee_narrative: data.fee_narrative,
          internal_notes: data.notes,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      toast.success('Pro forma created successfully');
      return this.mapInvoiceToProForma(invoice);
    } catch (error) {
      console.error('Error generating pro forma:', error);
      const message = error instanceof Error ? error.message : 'Failed to generate pro forma';
      toast.error(message);
      throw error;
    }
  }

  /**
   * Convert pro forma to invoice
   */
  async convertToInvoice(proformaId: string): Promise<any> {
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      // Get the pro forma
      const { data: proforma, error: proformaError } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', proformaId)
        .eq('advocate_id', user.id)
        .eq('is_pro_forma', true)
        .single();

      if (proformaError || !proforma) {
        throw new Error('Pro forma not found');
      }

      // Generate new invoice number
      const invoiceNumber = await this.generateInvoiceNumber();

      // Create new invoice based on pro forma
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert({
          ...proforma,
          id: undefined, // Let database generate new ID
          invoice_number: invoiceNumber,
          status: 'draft',
          is_pro_forma: false,
          converted_to_invoice_id: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (invoiceError) {
        throw invoiceError;
      }

      // Update pro forma to mark as converted
      await supabase
        .from('invoices')
        .update({
          status: 'pro_forma_accepted',
          converted_to_invoice_id: invoice.id,
          pro_forma_accepted_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', proformaId);

      toast.success('Pro forma converted to invoice successfully');
      return invoice;
    } catch (error) {
      console.error('Error converting pro forma to invoice:', error);
      const message = error instanceof Error ? error.message : 'Failed to convert pro forma';
      toast.error(message);
      throw error;
    }
  }

  /**
   * Update pro forma status
   */
  async updateProFormaStatus(proformaId: string, status: string): Promise<ProForma> {
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      const updateData: any = {
        status,
        updated_at: new Date().toISOString()
      };

      // Add timestamp for specific status changes
      if (status === 'pro_forma_accepted') {
        updateData.pro_forma_accepted_at = new Date().toISOString();
      }

      const { data: invoice, error } = await supabase
        .from('invoices')
        .update(updateData)
        .eq('id', proformaId)
        .eq('advocate_id', user.id)
        .eq('is_pro_forma', true)
        .select()
        .single();

      if (error) {
        throw error;
      }

      toast.success('Pro forma status updated successfully');
      return this.mapInvoiceToProForma(invoice);
    } catch (error) {
      console.error('Error updating pro forma status:', error);
      const message = error instanceof Error ? error.message : 'Failed to update pro forma status';
      toast.error(message);
      throw error;
    }
  }

  /**
   * Delete pro forma (soft delete)
   */
  async deleteProForma(proformaId: string): Promise<void> {
    try {
      // Get current user
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
        .eq('id', proformaId)
        .eq('advocate_id', user.id)
        .eq('is_pro_forma', true);

      if (error) {
        throw error;
      }

      toast.success('Pro forma deleted successfully');
    } catch (error) {
      console.error('Error deleting pro forma:', error);
      const message = error instanceof Error ? error.message : 'Failed to delete pro forma';
      toast.error(message);
      throw error;
    }
  }

  /**
   * Map invoice data to ProForma format
   */
  private mapInvoiceToProForma(invoice: any): ProForma {
    return {
      id: invoice.id,
      matter_id: invoice.matter_id,
      advocate_id: invoice.advocate_id,
      quote_number: invoice.invoice_number,
      quote_date: invoice.invoice_date,
      valid_until: invoice.due_date,
      fee_narrative: invoice.fee_narrative || '',
      total_amount: invoice.total_amount || 0,
      status: this.mapInvoiceStatusToProFormaStatus(invoice.status),
      created_at: invoice.created_at,
      updated_at: invoice.updated_at,
      sent_at: invoice.sent_at,
      accepted_at: invoice.pro_forma_accepted_at,
      converted_at: invoice.pro_forma_accepted_at,
      notes: invoice.internal_notes
    };
  }

  /**
   * Map invoice status to ProForma status
   */
  private mapInvoiceStatusToProFormaStatus(status: string): ProFormaStatus {
    switch (status) {
      case 'pro_forma':
        return ProFormaStatus.DRAFT;
      case 'sent':
        return ProFormaStatus.SENT;
      case 'pro_forma_accepted':
        return ProFormaStatus.ACCEPTED;
      case 'pro_forma_declined':
        return ProFormaStatus.DECLINED;
      default:
        return ProFormaStatus.DRAFT;
    }
  }

  /**
   * Generate quote number
   */
  private async generateQuoteNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const { count } = await supabase
      .from('invoices')
      .select('*', { count: 'exact', head: true })
      .eq('is_pro_forma', true)
      .gte('created_at', `${year}-01-01`)
      .lt('created_at', `${year + 1}-01-01`);

    const nextNumber = (count || 0) + 1;
    return `PF${year}${nextNumber.toString().padStart(4, '0')}`;
  }

  /**
   * Generate invoice number
   */
  private async generateInvoiceNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const { count } = await supabase
      .from('invoices')
      .select('*', { count: 'exact', head: true })
      .eq('is_pro_forma', false)
      .gte('created_at', `${year}-01-01`)
      .lt('created_at', `${year + 1}-01-01`);

    const nextNumber = (count || 0) + 1;
    return `INV${year}${nextNumber.toString().padStart(4, '0')}`;
   }
 }

// Export singleton instance for convenience
export const proformaService = ProFormaService.getInstance();