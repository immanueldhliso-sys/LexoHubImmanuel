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
    primary: '#1e40af',      // Blue
    secondary: '#64748b',    // Slate
    accent: '#059669',       // Emerald
    text: '#1f2937',         // Gray-800
    lightGray: '#f8fafc',    // Slate-50
    border: '#e2e8f0'        // Slate-200
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
      yPosition = this.addHeader(doc, 'PRO FORMA INVOICE', yPosition, pageWidth);

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
      yPosition = this.addHeader(doc, 'INVOICE', yPosition, pageWidth);

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
  private static addHeader(doc: jsPDF, title: string, yPosition: number, pageWidth: number): number {
    // Title
    doc.setFontSize(this.FONTS.size.title);
    doc.setFont(this.FONTS.bold, 'bold');
    doc.setTextColor(this.COLORS.primary);
    
    const titleWidth = doc.getTextWidth(title);
    const titleX = (pageWidth - titleWidth) / 2;
    doc.text(title, titleX, yPosition);

    // Underline
    doc.setDrawColor(this.COLORS.primary);
    doc.setLineWidth(0.5);
    doc.line(titleX, yPosition + 2, titleX + titleWidth, yPosition + 2);

    return yPosition + 15;
  }

  /**
   * Add firm details section
   */
  private static addFirmDetails(doc: jsPDF, advocate: Advocate, yPosition: number, pageWidth: number): number {
    doc.setFontSize(this.FONTS.size.body);
    doc.setFont(this.FONTS.regular, 'normal');
    doc.setTextColor(this.COLORS.text);

    const leftColumn = this.MARGINS.left;
    const rightColumn = pageWidth - this.MARGINS.right - 60;

    // Firm name and advocate details
    doc.setFont(this.FONTS.bold, 'bold');
    doc.text(`${advocate.firstName} ${advocate.lastName}`, leftColumn, yPosition);
    
    doc.setFont(this.FONTS.regular, 'normal');
    yPosition += 5;
    doc.text(`${advocate.barAssociation} Bar`, leftColumn, yPosition);
    
    if (advocate.practiceNumber) {
      yPosition += 4;
      doc.text(`Practice Number: ${advocate.practiceNumber}`, leftColumn, yPosition);
    }

    // Contact details (right column)
    let rightY = yPosition - 9;
    if (advocate.email) {
      doc.text(`Email: ${advocate.email}`, rightColumn, rightY);
      rightY += 4;
    }
    if (advocate.phone) {
      doc.text(`Tel: ${advocate.phone}`, rightColumn, rightY);
      rightY += 4;
    }

    // Address
    yPosition += 8;
    if (advocate.address) {
      const addressLines = advocate.address.split('\n');
      addressLines.forEach(line => {
        doc.text(line, leftColumn, yPosition);
        yPosition += 4;
      });
    }

    // VAT Registration
    if (advocate.vatNumber) {
      yPosition += 2;
      doc.text(`VAT Registration: ${advocate.vatNumber}`, leftColumn, yPosition);
    }

    return yPosition + 10;
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
    const rightColumn = pageWidth / 2 + 10;

    // Client details (left column)
    doc.setFont(this.FONTS.bold, 'bold');
    doc.text('BILL TO:', leftColumn, yPosition);
    
    doc.setFont(this.FONTS.regular, 'normal');
    yPosition += 6;
    doc.text(matter.clientName || 'Client', leftColumn, yPosition);
    
    if (matter.clientEmail) {
      yPosition += 4;
      doc.text(matter.clientEmail, leftColumn, yPosition);
    }

    // Matter details (right column)
    let rightY = yPosition - 6;
    doc.setFont(this.FONTS.bold, 'bold');
    doc.text('MATTER DETAILS:', rightColumn, rightY);
    
    doc.setFont(this.FONTS.regular, 'normal');
    rightY += 6;
    doc.text(`Matter: ${matter.title || 'Legal Matter'}`, rightColumn, rightY);
    
    if (matter.matterNumber) {
      rightY += 4;
      doc.text(`Matter No: ${matter.matterNumber}`, rightColumn, rightY);
    }

    return Math.max(yPosition, rightY) + 10;
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
    const rightColumn = pageWidth / 2 + 10;

    // Document details (left column)
    doc.setFont(this.FONTS.bold, 'bold');
    doc.text(`${isProForma ? 'PRO FORMA' : 'INVOICE'} DETAILS:`, leftColumn, yPosition);
    
    doc.setFont(this.FONTS.regular, 'normal');
    yPosition += 6;
    
    if (invoice.invoiceNumber) {
      doc.text(`${isProForma ? 'Pro Forma' : 'Invoice'} No: ${invoice.invoiceNumber}`, leftColumn, yPosition);
      yPosition += 4;
    }

    if (invoice.issueDate) {
      doc.text(`Issue Date: ${new Date(invoice.issueDate).toLocaleDateString('en-ZA')}`, leftColumn, yPosition);
      yPosition += 4;
    }

    if (invoice.dueDate && !isProForma) {
      doc.text(`Due Date: ${new Date(invoice.dueDate).toLocaleDateString('en-ZA')}`, leftColumn, yPosition);
      yPosition += 4;
    }

    // Status and payment info (right column)
    let rightY = yPosition - 14;
    doc.setFont(this.FONTS.bold, 'bold');
    doc.text('STATUS:', rightColumn, rightY);
    
    doc.setFont(this.FONTS.regular, 'normal');
    rightY += 6;
    
    const status = isProForma ? 'Pro Forma' : (invoice.status || 'Draft');
    doc.text(`Status: ${status}`, rightColumn, rightY);
    
    if (!isProForma && invoice.paidAmount && invoice.paidAmount > 0) {
      rightY += 4;
      doc.text(`Paid: ${this.formatCurrency(invoice.paidAmount)}`, rightColumn, rightY);
    }

    return Math.max(yPosition, rightY) + 10;
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
      // Add placeholder for empty line items
      doc.setFontSize(this.FONTS.size.body);
      doc.setTextColor(this.COLORS.secondary);
      doc.text('No line items available', this.MARGINS.left, yPosition);
      return yPosition + 10;
    }

    const tableData = lineItems.map(item => [
      item.description || '',
      item.quantity?.toString() || '1',
      this.formatCurrency(item.rate || 0),
      this.formatCurrency(item.amount || 0)
    ]);

    doc.autoTable({
      startY: yPosition,
      head: [['Description', 'Qty', 'Rate', 'Amount']],
      body: tableData,
      theme: 'grid',
      styles: {
        fontSize: this.FONTS.size.body,
        cellPadding: 3,
        textColor: this.COLORS.text
      },
      headStyles: {
        fillColor: this.COLORS.primary,
        textColor: 'white',
        fontStyle: 'bold'
      },
      columnStyles: {
        0: { cellWidth: 'auto' },
        1: { cellWidth: 20, halign: 'center' },
        2: { cellWidth: 30, halign: 'right' },
        3: { cellWidth: 30, halign: 'right' }
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
    const rightColumn = pageWidth - this.MARGINS.right - 60;
    const labelColumn = rightColumn - 40;

    doc.setFontSize(this.FONTS.size.body);
    doc.setTextColor(this.COLORS.text);

    // Subtotal
    if (invoice.subtotal) {
      doc.setFont(this.FONTS.regular, 'normal');
      doc.text('Subtotal:', labelColumn, yPosition);
      doc.text(this.formatCurrency(invoice.subtotal), rightColumn, yPosition, { align: 'right' });
      yPosition += 5;
    }

    // VAT
    if (invoice.vatAmount && invoice.vatAmount > 0) {
      doc.text(`VAT (${invoice.vatRate || 15}%):`, labelColumn, yPosition);
      doc.text(this.formatCurrency(invoice.vatAmount), rightColumn, yPosition, { align: 'right' });
      yPosition += 5;
    }

    // Discount
    if (invoice.discountAmount && invoice.discountAmount > 0) {
      doc.setTextColor(this.COLORS.accent);
      doc.text('Discount:', labelColumn, yPosition);
      doc.text(`-${this.formatCurrency(invoice.discountAmount)}`, rightColumn, yPosition, { align: 'right' });
      doc.setTextColor(this.COLORS.text);
      yPosition += 5;
    }

    // Total
    doc.setFont(this.FONTS.bold, 'bold');
    doc.setFontSize(this.FONTS.size.heading);
    doc.text('TOTAL:', labelColumn, yPosition);
    doc.text(this.formatCurrency(invoice.totalAmount || 0), rightColumn, yPosition, { align: 'right' });

    // Add border around total
    doc.setDrawColor(this.COLORS.primary);
    doc.setLineWidth(0.5);
    doc.rect(labelColumn - 2, yPosition - 4, 62, 8);

    return yPosition + 15;
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
    yPosition += 6;
    
    const paymentTerms = [
      'Payment is due within 30 days of invoice date.',
      'Late payments may incur interest charges as per the Legal Practice Act.',
      'Please reference the invoice number when making payment.',
      'All amounts are in South African Rand (ZAR).'
    ];

    paymentTerms.forEach(term => {
      doc.text(`• ${term}`, this.MARGINS.left + 5, yPosition);
      yPosition += 4;
    });

    // Bar Council compliance note
    yPosition += 5;
    doc.setFont(this.FONTS.bold, 'bold');
    doc.text('BAR COUNCIL COMPLIANCE:', this.MARGINS.left, yPosition);
    
    doc.setFont(this.FONTS.regular, 'normal');
    yPosition += 6;
    doc.text('This invoice complies with the Legal Practice Act and Bar Council guidelines.', this.MARGINS.left + 5, yPosition);
    yPosition += 4;
    doc.text('Fees are charged in accordance with professional standards and ethical requirements.', this.MARGINS.left + 5, yPosition);

    return yPosition + 10;
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
    
    // Default banking details (should be configurable)
    const bankingDetails = [
      'Bank: Standard Bank',
      'Account Name: Legal Practice Trust Account',
      'Account Number: 123456789',
      'Branch Code: 051001',
      'Reference: Invoice Number'
    ];

    bankingDetails.forEach(detail => {
      doc.text(detail, this.MARGINS.left, bankingY);
      bankingY += 3;
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