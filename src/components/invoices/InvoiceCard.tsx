import React from 'react';
import { 
  FileText, 
  Clock, 
  Send, 
  CheckCircle, 
  AlertTriangle,
  MoreHorizontal,
  Eye,
  Download,
  Mail,
  Trash2
} from 'lucide-react';
import { format, differenceInDays, isAfter } from 'date-fns';
import { Card, CardHeader, CardContent, Button } from '../../design-system/components';
import { RandIcon } from '../icons/RandIcon';
import { formatRand } from '../../lib/currency';
import type { Invoice, InvoiceStatus } from '@/types';

interface InvoiceCardProps {
  invoice: Invoice;
  onView?: (invoice: Invoice) => void;
  onSend?: (invoice: Invoice) => void;
  onDownload?: (invoice: Invoice) => void;
  onRecordPayment?: (invoice: Invoice) => void;
  onUpdateStatus?: (status: InvoiceStatus) => void;
  onDelete?: () => void;
}

export const InvoiceCard: React.FC<InvoiceCardProps> = ({
  invoice,
  onView,
  onSend,
  onDownload,
  onRecordPayment,
  onUpdateStatus,
  onDelete
}) => {
  const getStatusConfig = (status: InvoiceStatus) => {
    switch (status) {
      case 'Draft':
        return {
          color: 'bg-neutral-100 text-neutral-700',
          icon: FileText,
          label: 'Draft'
        };
      case 'Sent':
        return {
          color: 'bg-blue-100 text-blue-700',
          icon: Send,
          label: 'Sent'
        };
      case 'Paid':
        return {
          color: 'bg-success-100 text-success-700',
          icon: CheckCircle,
          label: 'Paid'
        };
      case 'Overdue':
        return {
          color: 'bg-error-100 text-error-700',
          icon: AlertTriangle,
          label: 'Overdue'
        };
      case 'Unpaid':
        return {
          color: 'bg-warning-100 text-warning-700',
          icon: Clock,
          label: 'Unpaid'
        };
      default:
        return {
          color: 'bg-neutral-100 text-neutral-700',
          icon: FileText,
          label: status
        };
    }
  };

  const getDaysOverdue = () => {
    if (!invoice.dateDue) return 0;
    const dueDate = new Date(invoice.dateDue);
    const today = new Date();
    return isAfter(today, dueDate) ? differenceInDays(today, dueDate) : 0;
  };

  const getPaymentProgress = () => {
    if (!invoice.amountPaid || invoice.amountPaid === 0) return 0;
    return (invoice.amountPaid / invoice.totalAmount) * 100;
  };

  const statusConfig = getStatusConfig(invoice.status);
  const StatusIcon = statusConfig.icon;
  const daysOverdue = getDaysOverdue();
  const paymentProgress = getPaymentProgress();

  return (
    <Card variant="default" hoverable className="p-6">
      <CardHeader className="p-0 mb-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-mpondo-gold/10 rounded-lg">
              <FileText className="w-5 h-5 text-mpondo-gold-600" />
            </div>
            <div>
              <h3 className="font-semibold text-neutral-900">
                {invoice.invoiceNumber}
              </h3>
              <p className="text-sm text-neutral-600">
                {invoice.matterTitle}
              </p>
              <p className="text-xs text-neutral-500">
                {invoice.clientName}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}>
              <StatusIcon className="w-3 h-3" />
              {statusConfig.label}
            </span>
            
            <div className="relative group">
              <Button variant="ghost" size="sm" className="p-1">
                <MoreHorizontal className="w-4 h-4 text-neutral-500" />
              </Button>
              
              {/* Dropdown Menu */}
              <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-neutral-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                <div className="py-1">
                  {onView && (
                    <button
                      onClick={() => onView(invoice)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
                    >
                      <Eye className="w-4 h-4" />
                      View Details
                    </button>
                  )}
                  
                  {onSend && invoice.status === 'Draft' && (
                    <button
                      onClick={() => onSend(invoice)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
                    >
                      <Mail className="w-4 h-4" />
                      Send Invoice
                    </button>
                  )}
                  
                  {onDownload && (
                    <button
                      onClick={() => onDownload(invoice)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
                    >
                      <Download className="w-4 h-4" />
                      Download PDF
                    </button>
                  )}
                  
                  {onRecordPayment && invoice.status !== 'Paid' && (
                    <button
                      onClick={() => onRecordPayment(invoice)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
                    >
                      <RandIcon size={16} />
                      Record Payment
                    </button>
                  )}
                  
                  {onUpdateStatus && (
                    <>
                      <div className="border-t border-neutral-200 my-1"></div>
                      <div className="px-3 py-1">
                        <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">
                          Update Status
                        </p>
                      </div>
                      
                      {invoice.status === 'Draft' && (
                        <button
                          onClick={() => onUpdateStatus('Sent')}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
                        >
                          <Send className="w-4 h-4" />
                          Mark as Sent
                        </button>
                      )}
                      
                      {(invoice.status === 'Sent' || invoice.status === 'Unpaid') && (
                        <button
                          onClick={() => onUpdateStatus('Paid')}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Mark as Paid
                        </button>
                      )}
                      
                      {invoice.status !== 'Overdue' && invoice.status !== 'Paid' && (
                        <button
                          onClick={() => onUpdateStatus('Overdue')}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
                        >
                          <AlertTriangle className="w-4 h-4" />
                          Mark as Overdue
                        </button>
                      )}
                    </>
                  )}
                  
                  {onDelete && (
                    <>
                      <div className="border-t border-neutral-200 my-1"></div>
                      <button
                        onClick={onDelete}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-status-error-600 hover:bg-status-error-50"
                      >
                        <AlertTriangle className="w-4 h-4" />
                        Delete Invoice
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0 space-y-4">
        {/* Amount and Dates */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-neutral-500 mb-1">Total Amount</p>
            <p className="font-semibold text-neutral-900">
              {formatRand(invoice.totalAmount)}
            </p>
          </div>
          
          <div>
            <p className="text-xs text-neutral-500 mb-1">Date Issued</p>
            <p className="text-sm text-neutral-700">
              {format(new Date(invoice.dateIssued), 'dd MMM yyyy')}
            </p>
          </div>
          
          <div>
            <p className="text-xs text-neutral-500 mb-1">Due Date</p>
            <p className={`text-sm ${
              daysOverdue > 0 ? 'text-error-600 font-medium' : 'text-neutral-700'
            }`}>
              {format(new Date(invoice.dateDue), 'dd MMM yyyy')}
              {daysOverdue > 0 && (
                <span className="block text-xs text-error-500">
                  {daysOverdue} days overdue
                </span>
              )}
            </p>
          </div>
          
          <div>
            <p className="text-xs text-neutral-500 mb-1">Bar</p>
            <div className="flex items-center gap-1">
              <div className={`w-2 h-2 rounded-full ${
                invoice.bar === 'Johannesburg' ? 'bg-mpondo-gold-500' : 'bg-judicial-blue-500'
              }`}></div>
              <p className="text-sm text-neutral-700">{invoice.bar}</p>
            </div>
          </div>
        </div>

        {/* Payment Progress (if partially paid) */}
        {paymentProgress > 0 && paymentProgress < 100 && (
          <div>
            <div className="flex justify-between items-center mb-2">
              <p className="text-xs text-neutral-500">Payment Progress</p>
              <p className="text-xs text-neutral-600">
                {formatRand(invoice.amountPaid || 0)} / {formatRand(invoice.totalAmount)}
              </p>
            </div>
            <div className="w-full bg-neutral-200 rounded-full h-2">
              <div 
                className="bg-success-500 h-2 rounded-full transition-all"
                style={{ width: `${paymentProgress}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Reminders Info */}
        {invoice.remindersSent && invoice.remindersSent > 0 && (
          <div className="flex items-center gap-2 text-xs text-neutral-500">
            <Clock className="w-3 h-3" />
            <span>
              {invoice.remindersSent} reminder{invoice.remindersSent > 1 ? 's' : ''} sent
            </span>
            {invoice.lastReminderDate && (
              <span>
                • Last: {format(new Date(invoice.lastReminderDate), 'dd MMM')}
              </span>
            )}
          </div>
        )}

        {/* Quick Actions */}
        <div className="flex items-center gap-2 pt-4 border-t border-neutral-100">
          {invoice.status === 'Draft' && onSend && (
            <button
              onClick={() => onSend(invoice)}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-mpondo-gold-700 bg-mpondo-gold/10 rounded-lg hover:bg-mpondo-gold/20 transition-colors"
            >
              <Send className="w-3 h-3" />
              Send
            </button>
          )}
          
          {invoice.status !== 'Paid' && onRecordPayment && (
            <button
              onClick={() => onRecordPayment(invoice)}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-success-700 bg-success/10 rounded-lg hover:bg-success/20 transition-colors"
            >
              <RandIcon size={12} />
              Payment
            </button>
          )}
          
          {onView && (
            <button
              onClick={() => onView(invoice)}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-neutral-600 bg-neutral-100 rounded-lg hover:bg-neutral-200 transition-colors"
            >
              <Eye className="w-3 h-3" />
              View
            </button>
          )}
          
          <div className="flex-1"></div>
          
          {invoice.datePaid && (
            <div className="flex items-center gap-1 text-xs text-success-600">
              <CheckCircle className="w-3 h-3" />
              Paid {format(new Date(invoice.datePaid), 'dd MMM')}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};