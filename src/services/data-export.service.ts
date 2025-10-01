/**
 * Data Export Service
 * "Liberate Your Data" - Comprehensive export functionality for complete matter records
 * Supports multiple formats: CSV, JSON, Excel-compatible CSV
 */

import { supabase } from '../lib/supabase';
import type { Matter, TimeEntry, Invoice, Payment, Document } from '../types';
import { toast } from 'react-hot-toast';

export interface ExportOptions {
  format: 'csv' | 'json' | 'excel-csv';
  includeTimeEntries?: boolean;
  includeInvoices?: boolean;
  includePayments?: boolean;
  includeDocuments?: boolean;
  includeNotes?: boolean;
  dateRange?: {
    start: string;
    end: string;
  };
  matterIds?: string[]; // Export specific matters only
}

export interface ExportResult {
  success: boolean;
  filename: string;
  data?: string;
  error?: string;
  recordCount: number;
  timestamp: string;
}

export interface ComprehensiveMatterData {
  matter: Matter;
  timeEntries: TimeEntry[];
  invoices: Invoice[];
  payments: Payment[];
  documents: Document[];
  notes: any[];
  totalHours: number;
  totalBilled: number;
  totalPaid: number;
  outstandingBalance: number;
}

export class DataExportService {
  private static readonly CHUNK_SIZE = 100; // Process matters in chunks to avoid memory issues

  /**
   * Export comprehensive matter data for an advocate
   */
  async exportMatterData(
    advocateId: string,
    options: ExportOptions = { format: 'csv' }
  ): Promise<ExportResult> {
    try {
      const timestamp = new Date().toISOString();
      
      // Get matters for the advocate
      const matters = await this.getMattersForExport(advocateId, options);
      
      if (matters.length === 0) {
        return {
          success: false,
          filename: '',
          error: 'No matters found for export',
          recordCount: 0,
          timestamp
        };
      }

      // Get comprehensive data for each matter
      const comprehensiveData = await this.getComprehensiveData(matters, options);
      
      // Generate export data based on format
      let exportData: string;
      let filename: string;
      
      switch (options.format) {
        case 'json':
          exportData = this.generateJSONExport(comprehensiveData);
          filename = `lexohub-data-export-${new Date().toISOString().split('T')[0]}.json`;
          break;
        case 'excel-csv':
          exportData = this.generateExcelCSVExport(comprehensiveData);
          filename = `lexohub-data-export-${new Date().toISOString().split('T')[0]}.csv`;
          break;
        default:
          exportData = this.generateCSVExport(comprehensiveData);
          filename = `lexohub-data-export-${new Date().toISOString().split('T')[0]}.csv`;
      }

      return {
        success: true,
        filename,
        data: exportData,
        recordCount: comprehensiveData.length,
        timestamp
      };

    } catch (error) {
      console.error('Export error:', error);
      return {
        success: false,
        filename: '',
        error: error instanceof Error ? error.message : 'Unknown export error',
        recordCount: 0,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Download export data as file
   */
  downloadExport(exportResult: ExportResult): void {
    if (!exportResult.success || !exportResult.data) {
      toast.error('No data available for download');
      return;
    }

    const blob = new Blob([exportResult.data], { 
      type: exportResult.filename.endsWith('.json') ? 'application/json' : 'text/csv' 
    });
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = exportResult.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success(`Data exported successfully: ${exportResult.filename}`);
  }

  /**
   * Get matters for export based on options
   */
  private async getMattersForExport(
    advocateId: string,
    options: ExportOptions
  ): Promise<Matter[]> {
    let query = supabase
      .from('matters')
      .select('*')
      .eq('advocate_id', advocateId)
      .is('deleted_at', null)
      .order('date_instructed', { ascending: false });

    // Apply date range filter
    if (options.dateRange) {
      query = query
        .gte('date_instructed', options.dateRange.start)
        .lte('date_instructed', options.dateRange.end);
    }

    // Apply specific matter IDs filter
    if (options.matterIds && options.matterIds.length > 0) {
      query = query.in('id', options.matterIds);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch matters: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get comprehensive data for matters
   */
  private async getComprehensiveData(
    matters: Matter[],
    options: ExportOptions
  ): Promise<ComprehensiveMatterData[]> {
    const comprehensiveData: ComprehensiveMatterData[] = [];

    // Process matters in chunks to avoid overwhelming the database
    for (let i = 0; i < matters.length; i += DataExportService.CHUNK_SIZE) {
      const chunk = matters.slice(i, i + DataExportService.CHUNK_SIZE);
      const chunkData = await Promise.all(
        chunk.map(matter => this.getMatterComprehensiveData(matter, options))
      );
      comprehensiveData.push(...chunkData);
    }

    return comprehensiveData;
  }

  /**
   * Get comprehensive data for a single matter
   */
  private async getMatterComprehensiveData(
    matter: Matter,
    options: ExportOptions
  ): Promise<ComprehensiveMatterData> {
    const [timeEntries, invoices, payments, documents, notes] = await Promise.all([
      options.includeTimeEntries ? this.getTimeEntries(matter.id) : [],
      options.includeInvoices ? this.getInvoices(matter.id) : [],
      options.includePayments ? this.getPayments(matter.id) : [],
      options.includeDocuments ? this.getDocuments(matter.id) : [],
      options.includeNotes ? this.getNotes(matter.id) : []
    ]);

    // Calculate totals
    const totalHours = timeEntries.reduce((sum, entry) => sum + (entry.hours || 0), 0);
    const totalBilled = invoices.reduce((sum, invoice) => sum + invoice.total_amount, 0);
    const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
    const outstandingBalance = totalBilled - totalPaid;

    return {
      matter,
      timeEntries,
      invoices,
      payments,
      documents,
      notes,
      totalHours,
      totalBilled,
      totalPaid,
      outstandingBalance
    };
  }

  /**
   * Get time entries for a matter
   */
  private async getTimeEntries(matterId: string): Promise<TimeEntry[]> {
    const { data, error } = await supabase
      .from('time_entries')
      .select('*')
      .eq('matter_id', matterId)
      .is('deleted_at', null)
      .order('date', { ascending: false });

    if (error) {
      console.error('Error fetching time entries:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Get invoices for a matter
   */
  private async getInvoices(matterId: string): Promise<Invoice[]> {
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('matter_id', matterId)
      .order('invoice_date', { ascending: false });

    if (error) {
      console.error('Error fetching invoices:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Get payments for a matter
   */
  private async getPayments(matterId: string): Promise<Payment[]> {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('matter_id', matterId)
      .order('payment_date', { ascending: false });

    if (error) {
      console.error('Error fetching payments:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Get documents for a matter
   */
  private async getDocuments(matterId: string): Promise<Document[]> {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('matter_id', matterId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching documents:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Get notes for a matter
   */
  private async getNotes(matterId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('matter_notes')
      .select('*')
      .eq('matter_id', matterId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching notes:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Generate CSV export
   */
  private generateCSVExport(data: ComprehensiveMatterData[]): string {
    const headers = [
      'Matter Reference',
      'Title',
      'Client Name',
      'Matter Type',
      'Status',
      'Date Instructed',
      'Date Closed',
      'Total Hours',
      'Total Billed',
      'Total Paid',
      'Outstanding Balance',
      'WIP Value',
      'Settlement Probability',
      'Risk Level',
      'Court Case Number',
      'Next Court Date',
      'Prescription Date',
      'Instructing Attorney',
      'Instructing Firm',
      'Fee Type',
      'Estimated Fee',
      'Fee Cap',
      'VAT Exempt',
      'Tags',
      'Time Entries Count',
      'Invoices Count',
      'Payments Count',
      'Documents Count',
      'Notes Count'
    ];

    const rows = data.map(item => [
      this.escapeCsvValue(item.matter.reference_number),
      this.escapeCsvValue(item.matter.title),
      this.escapeCsvValue(item.matter.client_name),
      this.escapeCsvValue(item.matter.matter_type),
      this.escapeCsvValue(item.matter.status),
      this.escapeCsvValue(item.matter.date_instructed),
      this.escapeCsvValue(item.matter.date_closed || ''),
      item.totalHours.toString(),
      item.totalBilled.toString(),
      item.totalPaid.toString(),
      item.outstandingBalance.toString(),
      item.matter.wip_value.toString(),
      (item.matter.settlement_probability || 0).toString(),
      this.escapeCsvValue(item.matter.risk_level),
      this.escapeCsvValue(item.matter.court_case_number || ''),
      this.escapeCsvValue(item.matter.next_court_date || ''),
      this.escapeCsvValue(item.matter.prescription_date || ''),
      this.escapeCsvValue(item.matter.instructing_attorney),
      this.escapeCsvValue(item.matter.instructing_firm || ''),
      this.escapeCsvValue(item.matter.fee_type),
      (item.matter.estimated_fee || 0).toString(),
      (item.matter.fee_cap || 0).toString(),
      item.matter.vat_exempt.toString(),
      this.escapeCsvValue(item.matter.tags.join('; ')),
      item.timeEntries.length.toString(),
      item.invoices.length.toString(),
      item.payments.length.toString(),
      item.documents.length.toString(),
      item.notes.length.toString()
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  /**
   * Generate Excel-compatible CSV export with UTF-8 BOM
   */
  private generateExcelCSVExport(data: ComprehensiveMatterData[]): string {
    const csvData = this.generateCSVExport(data);
    // Add UTF-8 BOM for Excel compatibility
    return '\uFEFF' + csvData;
  }

  /**
   * Generate JSON export
   */
  private generateJSONExport(data: ComprehensiveMatterData[]): string {
    const exportData = {
      exportInfo: {
        timestamp: new Date().toISOString(),
        version: '1.0',
        recordCount: data.length,
        exportedBy: 'LexoHub Data Export Service'
      },
      matters: data
    };

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Escape CSV values to handle commas, quotes, and newlines
   */
  private escapeCsvValue(value: string | null | undefined): string {
    if (value === null || value === undefined) {
      return '';
    }

    const stringValue = String(value);
    
    // If the value contains comma, quote, or newline, wrap in quotes and escape internal quotes
    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }
    
    return stringValue;
  }
}

// Export singleton instance
export const dataExportService = new DataExportService();
export default dataExportService;