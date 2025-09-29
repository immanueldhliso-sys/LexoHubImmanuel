import React, { useState } from 'react';
import { 
  FileText, 
  Calendar, 
  Building, 
  User, 
  Mail, 
  Phone,
  Download,
  Send,
  CheckCircle,
  AlertTriangle,
  Edit3,
  X
} from 'lucide-react';
import { format } from 'date-fns';
import { Modal, ModalHeader, ModalBody, ModalFooter, Button, Input } from '../../design-system/components';
import { formatRand } from '../../lib/currency';
import { InvoiceService } from '../../services/api/invoices.service';
import { toast } from 'react-hot-toast';
import type { Invoice, InvoiceStatus } from '../../types';

interface InvoiceDetailsModalProps {
  invoice: Invoice;
  onClose: () => void;
  onInvoiceUpdated?: () => void;
}

export const InvoiceDetailsModal: React.FC<InvoiceDetailsModalProps> = ({
  invoice,
  onClose,
  onInvoiceUpdated
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedNarrative, setEditedNarrative] = useState(invoice.fee_narrative || '');
  const [isLoading, setIsLoading] = useState(false);

  const getStatusConfig = (status: InvoiceStatus) => {
    switch (status) {
      case 'draft':
        return { color: 'bg-neutral-100 text-neutral-700', icon: FileText, label: 'Draft' };
      case 'sent':
        return { color: 'bg-judicial-blue-100 text-judicial-blue-700', icon: Send, label: 'Sent' };
      case 'paid':
        return { color: 'bg-status-success-100 text-status-success-700', icon: CheckCircle, label: 'Paid' };
      case 'overdue':
        return { color: 'bg-status-error-100 text-status-error-700', icon: AlertTriangle, label: 'Overdue' };
      default:
        return { color: 'bg-neutral-100 text-neutral-700', icon: FileText, label: status };
    }
  };

  const handleSendInvoice = async () => {
    try {
      setIsLoading(true);
      await InvoiceService.sendInvoice(invoice.id);
      toast.success('Invoice sent successfully');
      onInvoiceUpdated?.();
      onClose();
    } catch (error) {
      console.error('Error sending invoice:', error);
      toast.error('Failed to send invoice');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      setIsLoading(true);
      await InvoiceService.downloadInvoicePDF(invoice.id);
      toast.success('Invoice downloaded successfully');
    } catch (error) {
      console.error('Error downloading invoice:', error);
      toast.error('Failed to download invoice');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateNarrative = async () => {
    try {
      setIsLoading(true);
      await InvoiceService.updateInvoice(invoice.id, { fee_narrative: editedNarrative });
      toast.success('Invoice narrative updated successfully');
      setIsEditing(false);
      onInvoiceUpdated?.();
    } catch (error) {
      console.error('Error updating invoice:', error);
      toast.error('Failed to update invoice');
    } finally {
      setIsLoading(false);
    }
  };

  const statusConfig = getStatusConfig(invoice.status);
  const StatusIcon = statusConfig.icon;

  return (
    <Modal isOpen={true} onClose={onClose} size="lg">
      <ModalHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-mpondo-gold-100 rounded-lg">
              <FileText className="w-6 h-6 text-mpondo-gold-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-neutral-900">
                {invoice.invoice_number}
              </h2>
              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}>
                <StatusIcon className="w-3 h-3" />
                {statusConfig.label}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-neutral-500" />
          </button>
        </div>
      </ModalHeader>

      <ModalBody className="space-y-6">
        {/* Invoice Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="font-medium text-neutral-900">Invoice Details</h3>
            
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-neutral-400" />
                <div>
                  <p className="text-sm text-neutral-600">Date Issued</p>
                  <p className="font-medium text-neutral-900">
                    {format(new Date(invoice.invoice_date), 'dd MMMM yyyy')}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-neutral-400" />
                <div>
                  <p className="text-sm text-neutral-600">Due Date</p>
                  <p className="font-medium text-neutral-900">
                    {format(new Date(invoice.due_date), 'dd MMMM yyyy')}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Building className="w-4 h-4 text-neutral-400" />
                <div>
                  <p className="text-sm text-neutral-600">Bar</p>
                  <p className="font-medium text-neutral-900 capitalize">{invoice.bar}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-medium text-neutral-900">Matter Information</h3>
            
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <FileText className="w-4 h-4 text-neutral-400" />
                <div>
                  <p className="text-sm text-neutral-600">Matter ID</p>
                  <p className="font-medium text-neutral-900">{invoice.matter_id}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Financial Summary */}
        <div className="border-t border-neutral-200 pt-6">
          <h3 className="font-medium text-neutral-900 mb-4">Financial Summary</h3>
          
          <div className="bg-neutral-50 rounded-lg p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-neutral-600">Professional Fees</span>
              <span className="font-medium text-neutral-900">
                {formatRand(invoice.fees_amount)}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-neutral-600">Disbursements</span>
              <span className="font-medium text-neutral-900">
                {formatRand(invoice.disbursements_amount)}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-neutral-600">Subtotal</span>
              <span className="font-medium text-neutral-900">
                {formatRand(invoice.subtotal)}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-neutral-600">VAT ({(invoice.vat_rate * 100).toFixed(0)}%)</span>
              <span className="font-medium text-neutral-900">
                {formatRand(invoice.vat_amount)}
              </span>
            </div>
            
            <div className="border-t border-neutral-200 pt-3">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-neutral-900">Total Amount</span>
                <span className="font-bold text-lg text-neutral-900">
                  {formatRand(invoice.total_amount)}
                </span>
              </div>
            </div>
            
            {invoice.amount_paid > 0 && (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-neutral-600">Amount Paid</span>
                  <span className="font-medium text-status-success-600">
                    {formatRand(invoice.amount_paid)}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="font-medium text-neutral-900">Balance Due</span>
                  <span className="font-bold text-neutral-900">
                    {formatRand(invoice.balance_due)}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Fee Narrative */}
        <div className="border-t border-neutral-200 pt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-neutral-900">Fee Narrative</h3>
            {!isEditing && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
              >
                <Edit3 className="w-4 h-4 mr-2" />
                Edit
              </Button>
            )}
          </div>
          
          {isEditing ? (
            <div className="space-y-3">
              <textarea
                value={editedNarrative}
                onChange={(e) => setEditedNarrative(e.target.value)}
                className="w-full h-32 p-3 border border-neutral-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-mpondo-gold-500"
                placeholder="Enter fee narrative..."
              />
              <div className="flex gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleUpdateNarrative}
                  disabled={isLoading}
                >
                  Save Changes
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsEditing(false);
                    setEditedNarrative(invoice.fee_narrative || '');
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="bg-neutral-50 rounded-lg p-4">
              <p className="text-sm text-neutral-700 whitespace-pre-wrap">
                {invoice.fee_narrative || 'No fee narrative provided.'}
              </p>
            </div>
          )}
        </div>

        {/* Payment History */}
        {invoice.reminders_sent > 0 && (
          <div className="border-t border-neutral-200 pt-6">
            <h3 className="font-medium text-neutral-900 mb-4">Reminder History</h3>
            <div className="bg-neutral-50 rounded-lg p-4">
              <p className="text-sm text-neutral-700">
                {invoice.reminders_sent} reminder{invoice.reminders_sent > 1 ? 's' : ''} sent
              </p>
              {invoice.last_reminder_date && (
                <p className="text-xs text-neutral-500 mt-1">
                  Last reminder: {format(new Date(invoice.last_reminder_date), 'dd MMMM yyyy')}
                </p>
              )}
            </div>
          </div>
        )}
      </ModalBody>

      <ModalFooter>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          
          <Button
            variant="outline"
            onClick={handleDownloadPDF}
            disabled={isLoading}
          >
            <Download className="w-4 h-4 mr-2" />
            Download PDF
          </Button>
          
          {invoice.status === 'draft' && (
            <Button
              variant="primary"
              onClick={handleSendInvoice}
              disabled={isLoading}
              className="bg-mpondo-gold-600 hover:bg-mpondo-gold-700"
            >
              <Send className="w-4 h-4 mr-2" />
              Send Invoice
            </Button>
          )}
        </div>
      </ModalFooter>
    </Modal>
  );
};