/**
 * Professional Invoice PDF Generation Service
 * Generates Bar Council compliant PDFs for invoices and pro formas
 * Uses jsPDF with jspdf-autotable for professional layouts
 */

import jsPDF from 'jspdf';
import 'jspdf-autotable';
import type { 
  Invoice, 
  Matter, 
  Advocate,
  PDFGenerationOptions, 
  PDFDocumentInfo, 
  FirmDetails, 
  BankingDetails, 
  PaymentTerms,
  LineItem,
  InvoiceWithLineItems,
  PDFGenerationResult
} from '../../types';

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

export class InvoicePDFService {
  private static readonly COLORS = {
    primary: '#1e3a8a',      // Navy Blue (matching design)
    secondary: '#64748b',    // Slate
    accent: '#059669',       // Emerald
    text: '#1f2937',         // Gray-800
    lightGray: '#f8fafc',    // Slate-50
    border: '#cbd5e1'        // Slate-300
  };

  private static readonly FONTS = {
    regular: 'helvetica',
    bold: 'helvetica',
    size: {
      title: 20,
      subtitle: 16,
      heading: 14,
      body: 10,
      small: 8
    }
  };

  private static readonly MARGINS = {
    top: 20,
    bottom: 20,
    left: 20,
    right: 20
  };

  /**
   * Generate Pro Forma PDF
   */
  static async generateProFormaPDF(
    proForma: InvoiceWithLineItems,
    matter: Matter,
    advocate: Advocate,
    options: PDFGenerationOptions = {}
  ): Promise<PDFGenerationResult> {
    try {
      const doc = new jsPDF('portrait', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      // Document setup
      this.setupDocument(doc, 'PRO FORMA INVOICE');

      let yPosition = this.MARGINS.top;

      // Header with firm branding
      yPosition = this.addHeader(doc, 'PRO FORMA INVOICE', yPosition, pageWidth, advocate);

      // Firm details
      yPosition = this.addFirmDetails(doc, advocate, yPosition, pageWidth);

      // Client details
      yPosition = this.addClientDetails(doc, proForma, matter, yPosition, pageWidth);

      // Pro forma details
      yPosition = this.addProFormaDetails(doc, proForma, yPosition, pageWidth);

      // Line items table
      yPosition = this.addLineItemsTable(doc, proForma.lineItems || [], yPosition, pageWidth);

      // Totals section
      yPosition = this.addTotalsSection(doc, proForma, yPosition, pageWidth);

      // Payment terms and notes
      yPosition = this.addPaymentTerms(doc, yPosition, pageWidth);

      // Footer with banking details
      this.addFooter(doc, advocate, pageHeight);

      // Generate blob
      const pdfBlob = doc.output('blob');

      return {
        success: true,
        blob: pdfBlob,
        filename: `ProForma_${proForma.invoiceNumber || 'Draft'}.pdf`,
        size: pdfBlob.size,
        pages: doc.getNumberOfPages()
      };

    } catch (error) {
      console.error('Pro forma PDF generation failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'PDF generation failed',
        filename: '',
        size: 0,
        pages: 0
      };
    }
  }

  /**
   * Generate Invoice PDF
   */
  static async generateInvoicePDF(
    invoice: InvoiceWithLineItems,
    matter: Matter,
    advocate: Advocate,
    options: PDFGenerationOptions = {}
  ): Promise<PDFGenerationResult> {
    try {
      const doc = new jsPDF('portrait', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      // Document setup
      this.setupDocument(doc, 'INVOICE');

      let yPosition = this.MARGINS.top;

      // Header with firm branding
      yPosition = this.addHeader(doc, 'INVOICE', yPosition, pageWidth, advocate);

      // Firm details
      yPosition = this.addFirmDetails(doc, advocate, yPosition, pageWidth);

      // Client details
      yPosition = this.addClientDetails(doc, invoice, matter, yPosition, pageWidth);

      // Invoice details (includes payment status and dates)
      yPosition = this.addInvoiceDetails(doc, invoice, yPosition, pageWidth);

      // Line items table
      yPosition = this.addLineItemsTable(doc, invoice.lineItems || [], yPosition, pageWidth);

      // Totals section
      yPosition = this.addTotalsSection(doc, invoice, yPosition, pageWidth);

      // Payment terms and notes
      yPosition = this.addPaymentTerms(doc, yPosition, pageWidth);

      // Footer with banking details
      this.addFooter(doc, advocate, pageHeight);

      // Generate blob
      const pdfBlob = doc.output('blob');

      return {
        success: true,
        blob: pdfBlob,
        filename: `Invoice_${invoice.invoiceNumber || 'Draft'}.pdf`,
        size: pdfBlob.size,
        pages: doc.getNumberOfPages()
      };

    } catch (error) {
      console.error('Invoice PDF generation failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'PDF generation failed',
        filename: '',
        size: 0,
        pages: 0
      };
    }
  }

  /**
   * Setup document properties
   */
  private static setupDocument(doc: jsPDF, title: string): void {
    doc.setProperties({
      title: title,
      subject: 'Legal Services Invoice',
      author: 'LexoHub Legal Practice Management',
      creator: 'LexoHub PDF Generator',
      producer: 'jsPDF'
    });
  }

  /**
   * Add header with firm branding
   */
  private static addHeader(doc: jsPDF, title: string, yPosition: number, pageWidth: number, advocate?: Advocate): number {
    const centerX = pageWidth / 2;
    const startY = yPosition;
    
    // Logo (if available)
    if (advocate?.firm_logo_url) {
      try {
        const logoSize = 25;
        doc.addImage(advocate.firm_logo_url, 'PNG', centerX - logoSize / 2, yPosition, logoSize, logoSize);
        yPosition += logoSize + 3;
      } catch (error) {
        console.warn('Failed to add logo to PDF:', error);
      }
    }
    
    // Firm Name (if available)
    if (advocate?.firm_name) {
      doc.setFontSize(this.FONTS.size.subtitle);
      doc.setFont(this.FONTS.bold, 'bold');
      doc.setTextColor(this.COLORS.text);
      const firmNameWidth = doc.getTextWidth(advocate.firm_name);
      doc.text(advocate.firm_name, centerX - firmNameWidth / 2, yPosition);
      yPosition += 5;
      
      // Tagline
      if (advocate?.firm_tagline) {
        doc.setFontSize(this.FONTS.size.small);
        doc.setFont(this.FONTS.regular, 'italic');
        doc.setTextColor(this.COLORS.secondary);
        const taglineWidth = doc.getTextWidth(advocate.firm_tagline);
        doc.text(advocate.firm_tagline, centerX - taglineWidth / 2, yPosition);
        yPosition += 6;
      }
    }
    
    // Add spacing before title
    yPosition += 2;
    
    // Title
    doc.setFontSize(this.FONTS.size.title);
    doc.setFont(this.FONTS.bold, 'bold');
    doc.setTextColor(this.COLORS.primary);
    
    const titleWidth = doc.getTextWidth(title);
    doc.text(title, centerX - titleWidth / 2, yPosition);

    // Underline
    doc.setDrawColor(this.COLORS.primary);
    doc.setLineWidth(0.8);
    const underlineStart = centerX - titleWidth / 2;
    doc.line(underlineStart, yPosition + 2, underlineStart + titleWidth, yPosition + 2);

    return yPosition + 10;
  }

  /**
   * Add firm details section
   */
  private static addFirmDetails(doc: jsPDF, advocate: Advocate, yPosition: number, pageWidth: number): number {
    doc.setFontSize(this.FONTS.size.body);
    doc.setFont(this.FONTS.regular, 'normal');
    doc.setTextColor(this.COLORS.text);

    const leftColumn = this.MARGINS.left;
    const rightColumn = pageWidth - this.MARGINS.right - 70;

    const startY = yPosition;

    // Left column - Advocate details
    doc.setFont(this.FONTS.bold, 'bold');
    doc.text(advocate.full_name || 'Advocate', leftColumn, yPosition);
    
    doc.setFont(this.FONTS.regular, 'normal');
    yPosition += 4;
    doc.text(`${advocate.bar} Bar`, leftColumn, yPosition);
    
    if (advocate.practice_number) {
      yPosition += 4;
      doc.text(`Practice Number: ${advocate.practice_number}`, leftColumn, yPosition);
    }

    // Right column - Contact details
    let rightY = startY;
    if (advocate.email) {
      doc.text(`Email: ${advocate.email}`, rightColumn, rightY);
      rightY += 4;
    }
    if (advocate.phone_number) {
      doc.text(`Tel: ${advocate.phone_number}`, rightColumn, rightY);
      rightY += 4;
    }

    // Continue left column - Address
    yPosition = Math.max(yPosition + 6, rightY + 2);
    if (advocate.chambers_address) {
      const addressLines = advocate.chambers_address.split('\n');
      addressLines.forEach((line: string) => {
        doc.text(line, leftColumn, yPosition);
        yPosition += 4;
      });
    }

    // VAT Registration
    if (advocate.vat_number) {
      yPosition += 2;
      doc.text(`VAT Registration: ${advocate.vat_number}`, leftColumn, yPosition);
    }

    return yPosition + 8;
  }

  /**
   * Add client details section
   */
  private static addClientDetails(
    doc: jsPDF, 
    invoice: Invoice, 
    matter: Matter, 
    yPosition: number, 
    pageWidth: number
  ): number {
    doc.setFontSize(this.FONTS.size.body);
    doc.setTextColor(this.COLORS.text);

    const leftColumn = this.MARGINS.left;
    const rightColumn = pageWidth / 2 + 5;
    const startY = yPosition;

    // Client details (left column)
    doc.setFont(this.FONTS.bold, 'bold');
    doc.text('BILL TO:', leftColumn, yPosition);
    
    doc.setFont(this.FONTS.regular, 'normal');
    yPosition += 5;
    doc.text(matter.client_name || 'Client', leftColumn, yPosition);
    
    if (matter.client_email) {
      yPosition += 4;
      doc.text(matter.client_email, leftColumn, yPosition);
    }

    // Matter details (right column)
    let rightY = startY;
    doc.setFont(this.FONTS.bold, 'bold');
    doc.text('MATTER DETAILS:', rightColumn, rightY);
    
    doc.setFont(this.FONTS.regular, 'normal');
    rightY += 5;
    doc.text(`Matter: ${matter.title || 'Legal Matter'}`, rightColumn, rightY);
    
    if (matter.reference_number) {
      rightY += 4;
      doc.text(`Matter No: ${matter.reference_number}`, rightColumn, rightY);
    }

    return Math.max(yPosition, rightY) + 8;
  }

  /**
   * Add pro forma specific details
   */
  private static addProFormaDetails(
    doc: jsPDF, 
    proForma: Invoice, 
    yPosition: number, 
    pageWidth: number
  ): number {
    return this.addInvoiceDetailsBase(doc, proForma, yPosition, pageWidth, true);
  }

  /**
   * Add invoice specific details
   */
  private static addInvoiceDetails(
    doc: jsPDF, 
    invoice: Invoice, 
    yPosition: number, 
    pageWidth: number
  ): number {
    return this.addInvoiceDetailsBase(doc, invoice, yPosition, pageWidth, false);
  }

  /**
   * Add invoice/pro forma details base method
   */
  private static addInvoiceDetailsBase(
    doc: jsPDF, 
    invoice: Invoice, 
    yPosition: number, 
    pageWidth: number,
    isProForma: boolean
  ): number {
    doc.setFontSize(this.FONTS.size.body);
    doc.setTextColor(this.COLORS.text);

    const leftColumn = this.MARGINS.left;
    const rightColumn = pageWidth / 2 + 5;
    const startY = yPosition;

    // Document details (left column)
    doc.setFont(this.FONTS.bold, 'bold');
    doc.text(`${isProForma ? 'PRO FORMA' : 'INVOICE'} DETAILS:`, leftColumn, yPosition);
    
    doc.setFont(this.FONTS.regular, 'normal');
    yPosition += 5;
    
    if (invoice.invoice_number) {
      doc.text(`${isProForma ? 'Pro Forma' : 'Invoice'} No: ${invoice.invoice_number}`, leftColumn, yPosition);
      yPosition += 4;
    }

    const invoiceDate = (invoice as any).invoice_date || (invoice as any).dateIssued;
    if (invoiceDate) {
      doc.text(`Issue Date: ${new Date(invoiceDate).toLocaleDateString('en-ZA')}`, leftColumn, yPosition);
      yPosition += 4;
    }

    const dueDate = (invoice as any).due_date || (invoice as any).dateDue;
    if (dueDate && !isProForma) {
      doc.text(`Due Date: ${new Date(dueDate).toLocaleDateString('en-ZA')}`, leftColumn, yPosition);
      yPosition += 4;
    }

    // Status and payment info (right column)
    let rightY = startY;
    doc.setFont(this.FONTS.bold, 'bold');
    doc.text('STATUS:', rightColumn, rightY);
    
    doc.setFont(this.FONTS.regular, 'normal');
    rightY += 5;
    
    const status = isProForma ? 'Pro Forma' : (invoice.status || 'Draft');
    doc.text(`Status: ${status}`, rightColumn, rightY);
    
    if (!isProForma && invoice.amount_paid && invoice.amount_paid > 0) {
      rightY += 4;
      doc.text(`Paid: ${this.formatCurrency(invoice.amount_paid)}`, rightColumn, rightY);
    }

    return Math.max(yPosition, rightY) + 8;
  }

  /**
   * Add line items table
   */
  private static addLineItemsTable(
    doc: jsPDF, 
    lineItems: LineItem[], 
    yPosition: number, 
    pageWidth: number
  ): number {
    if (!lineItems || lineItems.length === 0) {
      doc.setFontSize(this.FONTS.size.body);
      doc.setTextColor(this.COLORS.secondary);
      doc.text('No line items available', this.MARGINS.left, yPosition);
      return yPosition + 10;
    }

    const tableData = lineItems.map((item, index) => [
      (index + 1).toString(),
      item.description || '',
      item.quantity?.toString() || '1',
      this.formatCurrency(item.amount || 0)
    ]);

    doc.autoTable({
      startY: yPosition,
      head: [['#', 'Description', 'Qty', 'Amount']],
      body: tableData,
      theme: 'grid',
      styles: {
        fontSize: this.FONTS.size.body,
        cellPadding: 4,
        textColor: this.COLORS.text,
        lineColor: this.COLORS.border,
        lineWidth: 0.1
      },
      headStyles: {
        fillColor: this.COLORS.primary,
        textColor: 'white',
        fontStyle: 'bold',
        halign: 'center'
      },
      columnStyles: {
        0: { cellWidth: 15, halign: 'center' },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 20, halign: 'center' },
        3: { cellWidth: 35, halign: 'right' }
      },
      margin: { left: this.MARGINS.left, right: this.MARGINS.right }
    });

    return (doc as any).lastAutoTable.finalY + 10;
  }

  /**
   * Add totals section
   */
  private static addTotalsSection(
    doc: jsPDF, 
    invoice: Invoice, 
    yPosition: number, 
    pageWidth: number
  ): number {
    const centerX = pageWidth / 2;
    const boxWidth = 80;
    const boxLeft = centerX - boxWidth / 2;
    const labelX = boxLeft + 5;
    const valueX = boxLeft + boxWidth - 5;

    doc.setFontSize(this.FONTS.size.body);
    doc.setTextColor(this.COLORS.text);

    let currentY = yPosition;

    // Subtotal
    if (invoice.subtotal) {
      doc.setFont(this.FONTS.regular, 'normal');
      doc.text('Subtotal:', labelX, currentY);
      doc.text(this.formatCurrency(invoice.subtotal), valueX, currentY, { align: 'right' });
      currentY += 6;
    }

    // VAT
    if (invoice.vat_amount && invoice.vat_amount > 0) {
      doc.text(`VAT (${invoice.vat_rate || 15}%):`, labelX, currentY);
      doc.text(this.formatCurrency(invoice.vat_amount), valueX, currentY, { align: 'right' });
      currentY += 6;
    }

    // Discount
    const discountAmount = (invoice as any).discount_amount || 0;
    if (discountAmount && discountAmount > 0) {
      doc.setTextColor(this.COLORS.accent);
      doc.text('Discount:', labelX, currentY);
      doc.text(`-${this.formatCurrency(discountAmount)}`, valueX, currentY, { align: 'right' });
      doc.setTextColor(this.COLORS.text);
      currentY += 6;
    }

    // Add spacing before total
    currentY += 2;

    // Total - with prominent styling
    doc.setFont(this.FONTS.bold, 'bold');
    doc.setFontSize(this.FONTS.size.heading);
    doc.setTextColor(this.COLORS.primary);
    doc.text('TOTAL:', labelX, currentY);
    doc.text(this.formatCurrency(invoice.total_amount || 0), valueX, currentY, { align: 'right' });

    // Add border box around entire totals section
    doc.setDrawColor(this.COLORS.primary);
    doc.setLineWidth(0.8);
    doc.rect(boxLeft, yPosition - 5, boxWidth, currentY - yPosition + 8);

    return currentY + 15;
  }

  /**
   * Add payment terms and notes
   */
  private static addPaymentTerms(doc: jsPDF, yPosition: number, pageWidth: number): number {
    doc.setFontSize(this.FONTS.size.body);
    doc.setTextColor(this.COLORS.text);

    // Payment terms
    doc.setFont(this.FONTS.bold, 'bold');
    doc.text('PAYMENT TERMS:', this.MARGINS.left, yPosition);
    
    doc.setFont(this.FONTS.regular, 'normal');
    yPosition += 5;
    
    const paymentTerms = [
      '• Payment is due within 30 days of invoice date.',
      '• Late payments may incur interest charges as per the Legal Practice Act.',
      '• Please reference the invoice number when making payment.',
      '• All amounts are in South African Rand (ZAR).'
    ];

    paymentTerms.forEach(term => {
      doc.text(term, this.MARGINS.left, yPosition);
      yPosition += 4;
    });

    // Bar Council compliance note
    yPosition += 4;
    doc.setFont(this.FONTS.bold, 'bold');
    doc.text('BAR COUNCIL COMPLIANCE:', this.MARGINS.left, yPosition);
    
    doc.setFont(this.FONTS.regular, 'normal');
    yPosition += 5;
    
    const maxWidth = pageWidth - this.MARGINS.left - this.MARGINS.right;
    const complianceText = 'This invoice complies with the Legal Practice Act and Bar Council guidelines. Fees are charged in accordance with professional standards and ethical requirements.';
    const lines = doc.splitTextToSize(complianceText, maxWidth);
    
    lines.forEach((line: string) => {
      doc.text(line, this.MARGINS.left, yPosition);
      yPosition += 4;
    });

    return yPosition + 8;
  }

  /**
   * Add footer with banking details
   */
  private static addFooter(doc: jsPDF, advocate: Advocate, pageHeight: number): void {
    const footerY = pageHeight - this.MARGINS.bottom - 20;
    
    doc.setFontSize(this.FONTS.size.small);
    doc.setTextColor(this.COLORS.secondary);

    // Banking details
    doc.setFont(this.FONTS.bold, 'bold');
    doc.text('BANKING DETAILS:', this.MARGINS.left, footerY);
    
    doc.setFont(this.FONTS.regular, 'normal');
    let bankingY = footerY + 4;
    
    // Use advocate's banking details or defaults
    const bankingDetails = advocate?.banking_details ? [
      `Bank: ${advocate.banking_details.bank_name}`,
      `Account Name: ${advocate.banking_details.account_name}`,
      `Account Number: ${advocate.banking_details.account_number}`,
      `Branch Code: ${advocate.banking_details.branch_code}`,
      advocate.banking_details.swift_code ? `Swift Code: ${advocate.banking_details.swift_code}` : null,
      'Reference: Invoice Number'
    ].filter(Boolean) : [
      'Bank: Standard Bank',
      'Account Name: Legal Practice Trust Account',
      'Account Number: 123456789',
      'Branch Code: 051001',
      'Reference: Invoice Number'
    ];

    bankingDetails.forEach(detail => {
      if (detail) {
        doc.text(detail, this.MARGINS.left, bankingY);
        bankingY += 3;
      }
    });

    // Footer line
    doc.setDrawColor(this.COLORS.border);
    doc.setLineWidth(0.3);
    doc.line(this.MARGINS.left, footerY - 5, doc.internal.pageSize.getWidth() - this.MARGINS.right, footerY - 5);

    // Page number
    const pageNumber = `Page ${doc.getCurrentPageInfo().pageNumber}`;
    const pageNumberWidth = doc.getTextWidth(pageNumber);
    doc.text(pageNumber, doc.internal.pageSize.getWidth() - this.MARGINS.right - pageNumberWidth, footerY);
  }

  /**
   * Format currency for South African Rand
   */
  private static formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 2
    }).format(amount);
  }

  /**
   * Download PDF file
   */
  static downloadPDF(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Preview PDF in new window
   */
  static previewPDF(blob: Blob): void {
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  }
}

// Export singleton instance
export const invoicePDFService = new InvoicePDFService();