/**
 * Invoice Email Service
 * Professional email service for sending invoices and pro formas
 * Supports multiple email providers (SendGrid, AWS SES, etc.)
 */

import type { 
  EmailSendRequest, 
  EmailSendResponse, 
  EmailTemplate, 
  EmailAttachment,
  ProFormaEmailOptions,
  InvoiceEmailOptions,
  Invoice,
  Matter,
  Advocate
} from '../../types';
import { InvoicePDFService } from '../pdf/invoice-pdf.service';

export class InvoiceEmailService {
  private static readonly EMAIL_TEMPLATES: Record<string, EmailTemplate> = {
    proFormaInvoice: {
      id: 'pro-forma-invoice',
      name: 'Pro Forma Invoice',
      subject: 'Pro Forma Invoice #{invoiceNumber} - {matterTitle}',
      htmlTemplate: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #1e40af; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">Pro Forma Invoice</h1>
            <p style="margin: 5px 0 0 0; font-size: 16px;">#{invoiceNumber}</p>
          </div>
          
          <div style="padding: 20px; background-color: #f8fafc;">
            <p>Dear {clientName},</p>
            
            <p>Please find attached the pro forma invoice for legal services rendered in connection with the matter: <strong>{matterTitle}</strong>.</p>
            
            <div style="background-color: white; padding: 15px; border-left: 4px solid #1e40af; margin: 20px 0;">
              <h3 style="margin: 0 0 10px 0; color: #1e40af;">Invoice Summary</h3>
              <p style="margin: 5px 0;"><strong>Pro Forma Number:</strong> {invoiceNumber}</p>
              <p style="margin: 5px 0;"><strong>Issue Date:</strong> {issueDate}</p>
              <p style="margin: 5px 0;"><strong>Total Amount:</strong> {totalAmount}</p>
              <p style="margin: 5px 0;"><strong>Matter:</strong> {matterTitle}</p>
            </div>
            
            <p>This pro forma invoice provides an estimate of the legal fees for the services to be rendered. Please review the attached document and contact us if you have any questions or require clarification.</p>
            
            <p>Upon your acceptance of this pro forma, we will proceed with the work and issue a formal invoice for payment.</p>
            
            <div style="background-color: #059669; color: white; padding: 15px; margin: 20px 0; border-radius: 5px;">
              <h4 style="margin: 0 0 10px 0;">Next Steps:</h4>
              <ul style="margin: 0; padding-left: 20px;">
                <li>Review the attached pro forma invoice</li>
                <li>Contact us with any questions or concerns</li>
                <li>Provide written acceptance to proceed</li>
              </ul>
            </div>
            
            <p>We appreciate your business and look forward to serving your legal needs.</p>
            
            <p>Best regards,<br>
            <strong>{advocateName}</strong><br>
            {barAssociation} Bar<br>
            {advocateEmail}<br>
            {advocatePhone}</p>
          </div>
          
          <div style="background-color: #e2e8f0; padding: 15px; text-align: center; font-size: 12px; color: #64748b;">
            <p style="margin: 0;">This email and any attachments are confidential and may be subject to legal professional privilege.</p>
            <p style="margin: 5px 0 0 0;">If you are not the intended recipient, please delete this email and notify the sender immediately.</p>
          </div>
        </div>
      `,
      textTemplate: `
Pro Forma Invoice #{invoiceNumber}

Dear {clientName},

Please find attached the pro forma invoice for legal services rendered in connection with the matter: {matterTitle}.

Invoice Summary:
- Pro Forma Number: {invoiceNumber}
- Issue Date: {issueDate}
- Total Amount: {totalAmount}
- Matter: {matterTitle}

This pro forma invoice provides an estimate of the legal fees for the services to be rendered. Please review the attached document and contact us if you have any questions or require clarification.

Upon your acceptance of this pro forma, we will proceed with the work and issue a formal invoice for payment.

Next Steps:
1. Review the attached pro forma invoice
2. Contact us with any questions or concerns
3. Provide written acceptance to proceed

We appreciate your business and look forward to serving your legal needs.

Best regards,
{advocateName}
{barAssociation} Bar
{advocateEmail}
{advocatePhone}

---
This email and any attachments are confidential and may be subject to legal professional privilege.
If you are not the intended recipient, please delete this email and notify the sender immediately.
      `
    },
    
    finalInvoice: {
      id: 'final-invoice',
      name: 'Final Invoice',
      subject: 'Invoice #{invoiceNumber} - {matterTitle}',
      htmlTemplate: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #059669; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">Invoice</h1>
            <p style="margin: 5px 0 0 0; font-size: 16px;">#{invoiceNumber}</p>
          </div>
          
          <div style="padding: 20px; background-color: #f8fafc;">
            <p>Dear {clientName},</p>
            
            <p>Please find attached the invoice for legal services rendered in connection with the matter: <strong>{matterTitle}</strong>.</p>
            
            <div style="background-color: white; padding: 15px; border-left: 4px solid #059669; margin: 20px 0;">
              <h3 style="margin: 0 0 10px 0; color: #059669;">Invoice Details</h3>
              <p style="margin: 5px 0;"><strong>Invoice Number:</strong> {invoiceNumber}</p>
              <p style="margin: 5px 0;"><strong>Issue Date:</strong> {issueDate}</p>
              <p style="margin: 5px 0;"><strong>Due Date:</strong> {dueDate}</p>
              <p style="margin: 5px 0;"><strong>Total Amount:</strong> {totalAmount}</p>
              <p style="margin: 5px 0;"><strong>Matter:</strong> {matterTitle}</p>
            </div>
            
            <p>Payment is due within 30 days of the invoice date. Please reference the invoice number when making payment.</p>
            
            <div style="background-color: #1e40af; color: white; padding: 15px; margin: 20px 0; border-radius: 5px;">
              <h4 style="margin: 0 0 10px 0;">Banking Details:</h4>
              <p style="margin: 5px 0;">Bank: Standard Bank</p>
              <p style="margin: 5px 0;">Account Name: Legal Practice Trust Account</p>
              <p style="margin: 5px 0;">Account Number: 123456789</p>
              <p style="margin: 5px 0;">Branch Code: 051001</p>
              <p style="margin: 5px 0;">Reference: {invoiceNumber}</p>
            </div>
            
            <p>If you have any questions regarding this invoice or require any clarification, please do not hesitate to contact us.</p>
            
            <p>Thank you for your business.</p>
            
            <p>Best regards,<br>
            <strong>{advocateName}</strong><br>
            {barAssociation} Bar<br>
            {advocateEmail}<br>
            {advocatePhone}</p>
          </div>
          
          <div style="background-color: #e2e8f0; padding: 15px; text-align: center; font-size: 12px; color: #64748b;">
            <p style="margin: 0;">This email and any attachments are confidential and may be subject to legal professional privilege.</p>
            <p style="margin: 5px 0 0 0;">If you are not the intended recipient, please delete this email and notify the sender immediately.</p>
          </div>
        </div>
      `,
      textTemplate: `
Invoice #{invoiceNumber}

Dear {clientName},

Please find attached the invoice for legal services rendered in connection with the matter: {matterTitle}.

Invoice Details:
- Invoice Number: {invoiceNumber}
- Issue Date: {issueDate}
- Due Date: {dueDate}
- Total Amount: {totalAmount}
- Matter: {matterTitle}

Payment is due within 30 days of the invoice date. Please reference the invoice number when making payment.

Banking Details:
Bank: Standard Bank
Account Name: Legal Practice Trust Account
Account Number: 123456789
Branch Code: 051001
Reference: {invoiceNumber}

If you have any questions regarding this invoice or require any clarification, please do not hesitate to contact us.

Thank you for your business.

Best regards,
{advocateName}
{barAssociation} Bar
{advocateEmail}
{advocatePhone}

---
This email and any attachments are confidential and may be subject to legal professional privilege.
If you are not the intended recipient, please delete this email and notify the sender immediately.
      `
    }
  };

  /**
   * Send pro forma invoice via email
   */
  static async sendProFormaEmail(
    proFormaId: string,
    recipientEmail: string,
    options: ProFormaEmailOptions = {}
  ): Promise<EmailSendResponse> {
    try {
      // This would typically fetch from your API
      const proForma = await this.getProForma(proFormaId);
      const matter = await this.getMatter(proForma.matterId);
      const advocate = await this.getAdvocate(proForma.advocateId);

      // Generate PDF
      const pdfResult = await InvoicePDFService.generateProFormaPDF(proForma, matter, advocate);
      
      if (!pdfResult.success) {
        throw new Error(`PDF generation failed: ${pdfResult.error}`);
      }

      // Prepare email content
      const template = this.EMAIL_TEMPLATES.proFormaInvoice;
      const emailContent = this.processTemplate(template, {
        invoiceNumber: proForma.invoiceNumber || 'Draft',
        clientName: matter.clientName || 'Client',
        matterTitle: matter.title || 'Legal Matter',
        issueDate: proForma.issueDate ? new Date(proForma.issueDate).toLocaleDateString('en-ZA') : new Date().toLocaleDateString('en-ZA'),
        totalAmount: this.formatCurrency(proForma.totalAmount || 0),
        advocateName: `${advocate.firstName} ${advocate.lastName}`,
        barAssociation: advocate.barAssociation,
        advocateEmail: advocate.email || '',
        advocatePhone: advocate.phone || ''
      });

      // Prepare attachment
      const attachment: EmailAttachment = {
        filename: pdfResult.filename,
        content: pdfResult.blob!,
        contentType: 'application/pdf'
      };

      // Send email
      const emailRequest: EmailSendRequest = {
        to: recipientEmail,
        cc: options.ccEmails,
        bcc: options.bccEmails,
        subject: emailContent.subject,
        htmlBody: emailContent.htmlBody,
        textBody: emailContent.textBody,
        attachments: [attachment],
        replyTo: advocate.email,
        fromName: `${advocate.firstName} ${advocate.lastName}`,
        customMessage: options.customMessage
      };

      return await this.sendEmail(emailRequest);

    } catch (error) {
      console.error('Pro forma email sending failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Email sending failed',
        messageId: '',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Send final invoice via email
   */
  static async sendInvoiceEmail(
    invoiceId: string,
    recipientEmail: string,
    options: InvoiceEmailOptions = {}
  ): Promise<EmailSendResponse> {
    try {
      // This would typically fetch from your API
      const invoice = await this.getInvoice(invoiceId);
      const matter = await this.getMatter(invoice.matterId);
      const advocate = await this.getAdvocate(invoice.advocateId);

      // Generate PDF
      const pdfResult = await InvoicePDFService.generateInvoicePDF(invoice, matter, advocate);
      
      if (!pdfResult.success) {
        throw new Error(`PDF generation failed: ${pdfResult.error}`);
      }

      // Prepare email content
      const template = this.EMAIL_TEMPLATES.finalInvoice;
      const emailContent = this.processTemplate(template, {
        invoiceNumber: invoice.invoiceNumber || 'Draft',
        clientName: matter.clientName || 'Client',
        matterTitle: matter.title || 'Legal Matter',
        issueDate: invoice.issueDate ? new Date(invoice.issueDate).toLocaleDateString('en-ZA') : new Date().toLocaleDateString('en-ZA'),
        dueDate: invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('en-ZA') : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-ZA'),
        totalAmount: this.formatCurrency(invoice.totalAmount || 0),
        advocateName: `${advocate.firstName} ${advocate.lastName}`,
        barAssociation: advocate.barAssociation,
        advocateEmail: advocate.email || '',
        advocatePhone: advocate.phone || ''
      });

      // Prepare attachment
      const attachment: EmailAttachment = {
        filename: pdfResult.filename,
        content: pdfResult.blob!,
        contentType: 'application/pdf'
      };

      // Send email
      const emailRequest: EmailSendRequest = {
        to: recipientEmail,
        cc: options.ccEmails,
        bcc: options.bccEmails,
        subject: emailContent.subject,
        htmlBody: emailContent.htmlBody,
        textBody: emailContent.textBody,
        attachments: [attachment],
        replyTo: advocate.email,
        fromName: `${advocate.firstName} ${advocate.lastName}`,
        customMessage: options.customMessage
      };

      return await this.sendEmail(emailRequest);

    } catch (error) {
      console.error('Invoice email sending failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Email sending failed',
        messageId: '',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Process email template with variables
   */
  private static processTemplate(
    template: EmailTemplate, 
    variables: Record<string, string>
  ): { subject: string; htmlBody: string; textBody: string } {
    let subject = template.subject;
    let htmlBody = template.htmlTemplate;
    let textBody = template.textTemplate;

    // Replace variables in all template parts
    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = `{${key}}`;
      const regex = new RegExp(placeholder, 'g');
      
      subject = subject.replace(regex, value);
      htmlBody = htmlBody.replace(regex, value);
      textBody = textBody.replace(regex, value);
    });

    return { subject, htmlBody, textBody };
  }

  /**
   * Send email using configured email provider
   */
  private static async sendEmail(request: EmailSendRequest): Promise<EmailSendResponse> {
    // This is a placeholder implementation
    // In a real application, you would integrate with:
    // - SendGrid
    // - AWS SES
    // - Mailgun
    // - Other email service providers

    try {
      // Simulate email sending
      console.log('Sending email:', {
        to: request.to,
        subject: request.subject,
        attachments: request.attachments?.length || 0
      });

      // For development/testing, you might want to:
      // 1. Log the email content
      // 2. Save to a local file
      // 3. Use a test email service

      // Simulate successful response
      return {
        success: true,
        messageId: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown email error',
        messageId: '',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Format currency for display
   */
  private static formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 2
    }).format(amount);
  }

  /**
   * Get pro forma (placeholder - replace with actual API call)
   */
  private static async getProForma(proFormaId: string): Promise<any> {
    // This would be replaced with actual API call
    throw new Error('getProForma not implemented - replace with actual API call');
  }

  /**
   * Get invoice (placeholder - replace with actual API call)
   */
  private static async getInvoice(invoiceId: string): Promise<any> {
    // This would be replaced with actual API call
    throw new Error('getInvoice not implemented - replace with actual API call');
  }

  /**
   * Get matter (placeholder - replace with actual API call)
   */
  private static async getMatter(matterId: string): Promise<any> {
    // This would be replaced with actual API call
    throw new Error('getMatter not implemented - replace with actual API call');
  }

  /**
   * Get advocate (placeholder - replace with actual API call)
   */
  private static async getAdvocate(advocateId: string): Promise<any> {
    // This would be replaced with actual API call
    throw new Error('getAdvocate not implemented - replace with actual API call');
  }

  /**
   * Validate email address
   */
  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Get available email templates
   */
  static getEmailTemplates(): EmailTemplate[] {
    return Object.values(this.EMAIL_TEMPLATES);
  }

  /**
   * Get email template by ID
   */
  static getEmailTemplate(templateId: string): EmailTemplate | null {
    return this.EMAIL_TEMPLATES[templateId] || null;
  }
}

// Export singleton instance
export const invoiceEmailService = new InvoiceEmailService();