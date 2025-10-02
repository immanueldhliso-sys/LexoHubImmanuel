import { format, addDays, isAfter, isBefore, differenceInDays } from 'date-fns';
import type { Invoice, Payment, Bar } from '@/types';
import { InvoiceService } from './api/invoices.service';
import { invoiceApiService } from './api/invoice-api.service';

export interface ReminderSchedule {
  daysAfterDue: number;
  type: 'first' | 'second' | 'final' | 'legal';
  subject: string;
  escalation?: boolean;
}

export interface PaymentTrackingMetrics {
  totalOutstanding: number;
  overdueAmount: number;
  averagePaymentDays: number;
  paymentRate: number; // percentage of invoices paid on time
  overdueInvoices: Invoice[];
  upcomingDueDates: Invoice[];
}

export class ReminderService {
  constructor() {}

  /**
   * Get reminder schedules based on Bar rules
   */
  private getReminderSchedule(bar: Bar): ReminderSchedule[] {
    const baseSchedule: ReminderSchedule[] = [
      {
        daysAfterDue: 7,
        type: 'first',
        subject: 'Payment Reminder - Invoice {invoiceNumber}',
        escalation: false
      },
      {
        daysAfterDue: 21,
        type: 'second',
        subject: 'Second Payment Reminder - Invoice {invoiceNumber}',
        escalation: false
      },
      {
        daysAfterDue: 45,
        type: 'final',
        subject: 'Final Payment Notice - Invoice {invoiceNumber}',
        escalation: true
      }
    ];

    // Add legal notice based on Bar rules
    if (bar === 'Johannesburg') {
      baseSchedule.push({
        daysAfterDue: 60,
        type: 'legal',
        subject: 'Legal Action Notice - Invoice {invoiceNumber}',
        escalation: true
      });
    } else if (bar === 'Cape Town') {
      baseSchedule.push({
        daysAfterDue: 90,
        type: 'legal',
        subject: 'Legal Action Notice - Invoice {invoiceNumber}',
        escalation: true
      });
    }

    return baseSchedule;
  }

  /**
   * Process all pending reminders
   */
  async processReminders(): Promise<void> {
    try {
      // Fetch invoices and compute overdue locally
      const { data: allInvoices } = await InvoiceService.getInvoices({
        page: 1,
        pageSize: 200,
        status: ['sent', 'viewed', 'overdue'],
        sortBy: 'due_date',
        sortOrder: 'asc'
      } as any);
      const overdueInvoices: Invoice[] = (allInvoices || []).filter((invoice: any) => {
        const status = String(invoice.status || '').toLowerCase();
        const due = invoice.dateDue || invoice.due_date;
        return status === 'overdue' || (status !== 'paid' && !!due && isAfter(new Date(), new Date(due)));
      });
      const today = new Date();

      for (const invoice of overdueInvoices) {
        const reminderSchedule = this.getReminderSchedule(invoice.bar);
        const daysPastDue = differenceInDays(today, new Date(invoice.dateDue));

        for (const reminder of reminderSchedule) {
          if (daysPastDue >= reminder.daysAfterDue) {
            const shouldSend = await this.shouldSendReminder(invoice, reminder);
            if (shouldSend) {
              await this.sendReminderForSchedule(invoice, reminder);
              await this.logReminderSent(invoice.id, reminder.type);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error processing reminders:', error);
      throw error;
    }
  }

  /**
   * Check if a reminder should be sent
   */
  private async shouldSendReminder(invoice: Invoice, reminder: ReminderSchedule): Promise<boolean> {
    // Check if this type of reminder has already been sent
    const reminderHistory = await this.getReminderHistory(invoice.id);
    const alreadySent = reminderHistory.some(r => r.type === reminder.type);
    
    if (alreadySent) {
      return false;
    }

    // Don't send reminders for paid invoices
    if (invoice.status === 'Paid') {
      return false;
    }

    return true;
  }

  /**
   * Send a reminder for an invoice
   */
  private async sendReminderForSchedule(invoice: Invoice, reminder: ReminderSchedule): Promise<void> {
    const subject = reminder.subject.replace('{invoiceNumber}', invoice.invoiceNumber);
    const template = this.getReminderTemplate(invoice, reminder);

    // In a real implementation, this would integrate with an email service
    console.log(`Sending ${reminder.type} reminder for invoice ${invoice.invoiceNumber}`);
    console.log(`Subject: ${subject}`);
    console.log(`Template: ${template}`);

    // Update the invoice's next reminder date
    const nextReminderDate = this.calculateNextReminderDate(invoice, reminder);
    await invoiceApiService.update(invoice.id, {
      next_reminder_date: nextReminderDate ? nextReminderDate.toISOString().split('T')[0] : null
    });
  }

  /**
   * Get reminder email template
   */
  private getReminderTemplate(invoice: Invoice, reminder: ReminderSchedule): string {
    const daysPastDue = differenceInDays(new Date(), new Date(invoice.dateDue));
    
    const templates = {
      first: `
Dear ${invoice.clientName || 'Client'},

This is a friendly reminder that invoice ${invoice.invoiceNumber} for R${invoice.amount.toLocaleString('en-ZA', { minimumFractionDigits: 2 })} was due on ${format(new Date(invoice.dateDue), 'dd MMMM yyyy')} and is now ${daysPastDue} days overdue.

Please arrange payment at your earliest convenience to avoid any late payment charges.

If you have already made payment, please disregard this notice.

Kind regards,
[Your Practice Name]
      `,
      second: `
Dear ${invoice.clientName || 'Client'},

This is a second reminder that invoice ${invoice.invoiceNumber} for R${invoice.amount.toLocaleString('en-ZA', { minimumFractionDigits: 2 })} remains unpaid and is now ${daysPastDue} days overdue.

Please settle this account immediately to avoid escalation of this matter.

If you are experiencing difficulties with payment, please contact us to discuss payment arrangements.

Kind regards,
[Your Practice Name]
      `,
      final: `
Dear ${invoice.clientName || 'Client'},

FINAL NOTICE

Invoice ${invoice.invoiceNumber} for R${invoice.amount.toLocaleString('en-ZA', { minimumFractionDigits: 2 })} is now ${daysPastDue} days overdue.

Unless payment is received within 7 days of this notice, we will be compelled to take further action to recover the debt, which may include legal proceedings.

Please contact us immediately to resolve this matter.

Kind regards,
[Your Practice Name]
      `,
      legal: `
Dear ${invoice.clientName || 'Client'},

NOTICE OF INTENTION TO INSTITUTE LEGAL PROCEEDINGS

Despite previous reminders, invoice ${invoice.invoiceNumber} for R${invoice.amount.toLocaleString('en-ZA', { minimumFractionDigits: 2 })} remains unpaid after ${daysPastDue} days.

Please be advised that unless full payment is received within 7 days of this notice, we will institute legal proceedings against you for recovery of the debt plus costs and interest.

This is your final opportunity to settle this matter without legal action.

Kind regards,
[Your Practice Name]
      `
    };

    return templates[reminder.type] || templates.first;
  }

  /**
   * Calculate the next reminder date
   */
  private calculateNextReminderDate(invoice: Invoice, currentReminder: ReminderSchedule): Date | null {
    const reminderSchedule = this.getReminderSchedule(invoice.bar);
    const currentIndex = reminderSchedule.findIndex(r => r.type === currentReminder.type);
    
    if (currentIndex === -1 || currentIndex === reminderSchedule.length - 1) {
      return null; // No more reminders
    }

    const nextReminder = reminderSchedule[currentIndex + 1];
    return addDays(new Date(invoice.dateDue), nextReminder.daysAfterDue);
  }

  /**
   * Get payment tracking metrics
   */
  async getPaymentTrackingMetrics(): Promise<PaymentTrackingMetrics> {
    try {
      const { data: allInvoices } = await InvoiceService.getInvoices({ page: 1, pageSize: 500 } as any);
      const invoices: Invoice[] = (allInvoices || []) as any;
      const payments = await this.getAllPayments();
      
      const overdueInvoices = invoices.filter(invoice => 
        invoice.status === 'Overdue' || 
        (String(invoice.status || '').toLowerCase() !== 'paid' && isAfter(new Date(), new Date(invoice.dateDue)))
      );

      const upcomingDueDates = invoices.filter(invoice => {
        const dueDate = new Date(invoice.dateDue);
        const today = new Date();
        const sevenDaysFromNow = addDays(today, 7);
        
        return String(invoice.status || '').toLowerCase() === 'unpaid' && 
               isAfter(dueDate, today) && 
               isBefore(dueDate, sevenDaysFromNow);
      });

      const totalOutstanding = invoices
        .filter(invoice => invoice.status !== 'Paid')
        .reduce((sum, invoice) => sum + invoice.amount, 0);

      const overdueAmount = overdueInvoices
        .reduce((sum, invoice) => sum + invoice.amount, 0);

      // Calculate average payment days
      const paidInvoices = invoices.filter(invoice => String(invoice.status || '').toLowerCase() === 'paid');
      const paymentDays = paidInvoices.map(invoice => {
        const payment = payments.find(p => p.invoiceId === invoice.id);
        if (payment) {
          return differenceInDays(new Date(payment.paymentDate), new Date(invoice.dateIssued));
        }
        return 0;
      }).filter(days => days > 0);

      const averagePaymentDays = paymentDays.length > 0 
        ? paymentDays.reduce((sum, days) => sum + days, 0) / paymentDays.length 
        : 0;

      // Calculate payment rate (percentage paid on time)
      const onTimePayments = paidInvoices.filter(invoice => {
        const payment = payments.find(p => p.invoiceId === invoice.id);
        return payment && isBefore(new Date(payment.paymentDate), new Date(invoice.dateDue));
      });

      const paymentRate = paidInvoices.length > 0 
        ? (onTimePayments.length / paidInvoices.length) * 100 
        : 0;

      return {
        totalOutstanding,
        overdueAmount,
        averagePaymentDays: Math.round(averagePaymentDays),
        paymentRate: Math.round(paymentRate),
        overdueInvoices,
        upcomingDueDates
      };
    } catch (error) {
      console.error('Error getting payment tracking metrics:', error);
      throw error;
    }
  }

  /**
   * Get all payments (placeholder - would integrate with actual payment storage)
   */
  private async getAllPayments(): Promise<Payment[]> {
    // This would integrate with your actual payment storage
    // For now, return empty array
    return [];
  }

  /**
   * Get reminder history for an invoice
   */
  private async getReminderHistory(): Promise<Array<{ type: string; sentAt: Date }>> {
    // This would integrate with your actual reminder log storage
    // For now, return empty array
    return [];
  }

  /**
   * Log that a reminder was sent
   */
  private async logReminderSent(invoiceId: string, reminderType: string): Promise<void> {
    // This would log to your actual storage system
    console.log(`Logged ${reminderType} reminder sent for invoice ${invoiceId}`);
  }

  /**
   * Schedule automatic reminder processing
   */
  startReminderScheduler(): void {
    // Run reminder processing daily at 9 AM
    const scheduleReminders = () => {
      const now = new Date();
      const scheduledTime = new Date();
      scheduledTime.setHours(9, 0, 0, 0);
      
      if (now > scheduledTime) {
        scheduledTime.setDate(scheduledTime.getDate() + 1);
      }
      
      const timeUntilScheduled = scheduledTime.getTime() - now.getTime();
      
      setTimeout(() => {
        this.processReminders().catch(console.error);
        // Schedule for the next day
        setInterval(() => {
          this.processReminders().catch(console.error);
        }, 24 * 60 * 60 * 1000); // 24 hours
      }, timeUntilScheduled);
    };

    scheduleReminders();
  }

  /**
   * Get upcoming reminders for dashboard
   */
  async getUpcomingReminders(): Promise<Array<{ invoice: Invoice; reminderType: string; dueDate: Date }>> {
    try {
      const { data: allInvoices } = await InvoiceService.getInvoices({
        page: 1,
        pageSize: 500,
        status: ['sent', 'viewed', 'overdue']
      } as any);
      const overdueInvoices: Invoice[] = (allInvoices || []).filter((invoice: any) => {
        const status = String(invoice.status || '').toLowerCase();
        const due = invoice.dateDue || invoice.due_date;
        return status === 'overdue' || (status !== 'paid' && !!due && isAfter(new Date(), new Date(due)));
      }) as any;
      const upcomingReminders: Array<{ invoice: Invoice; reminderType: string; dueDate: Date }> = [];
      
      for (const invoice of overdueInvoices) {
        if (invoice.nextReminderDate) {
          const reminderSchedule = this.getReminderSchedule(invoice.bar);
          const daysPastDue = differenceInDays(new Date(), new Date(invoice.dateDue));
          
          const nextReminder = reminderSchedule.find(r => r.daysAfterDue > daysPastDue);
          if (nextReminder) {
            upcomingReminders.push({
              invoice,
              reminderType: nextReminder.type,
              dueDate: new Date(invoice.nextReminderDate)
            });
          }
        }
      }
      
      return upcomingReminders.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
    } catch (error) {
      console.error('Error getting upcoming reminders:', error);
      return [];
    }
  }

  /**
   * Public API: Send a reminder by invoice id (used by dashboard)
   */
  async sendReminder(invoiceId: string): Promise<void> {
    const result = await invoiceApiService.sendReminder(invoiceId);
    if (result.error) {
      throw new Error(result.error.message || 'Failed to send reminder');
    }
  }
}