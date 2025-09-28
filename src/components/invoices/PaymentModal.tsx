import React, { useState } from 'react';
import { DollarSign, Calendar, CreditCard, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import { Modal, ModalHeader, ModalBody, ModalFooter, Input, Button } from '../../design-system/components';
import { InvoiceService } from '@/services/api/invoices.service';
import type { Invoice } from '@/types';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice;
  onPaymentRecorded?: () => void;
}

const PAYMENT_METHODS = [
  { value: 'EFT', label: 'Electronic Transfer (EFT)' },
  { value: 'Cheque', label: 'Cheque' },
  { value: 'Cash', label: 'Cash' },
  { value: 'Card', label: 'Credit/Debit Card' }
] as const;

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  invoice,
  onPaymentRecorded
}) => {
  const [amount, setAmount] = useState<string>('');
  const [paymentDate, setPaymentDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [paymentMethod, setPaymentMethod] = useState<'EFT' | 'Cheque' | 'Cash' | 'Card'>('EFT');
  const [reference, setReference] = useState('');
  const [isRecording, setIsRecording] = useState(false);

  const outstandingAmount = invoice.totalAmount - (invoice.amountPaid || 0);
  const isPartialPayment = parseFloat(amount) < outstandingAmount;
  const isOverpayment = parseFloat(amount) > outstandingAmount;

  const handleAmountChange = (value: string) => {
    // Allow only numbers and decimal point
    const sanitized = value.replace(/[^0-9.]/g, '');
    
    // Prevent multiple decimal points
    const parts = sanitized.split('.');
    if (parts.length > 2) {
      return;
    }
    
    // Limit decimal places to 2
    if (parts[1] && parts[1].length > 2) {
      return;
    }
    
    setAmount(sanitized);
  };

  const handleFullPayment = () => {
    setAmount(outstandingAmount.toFixed(2));
  };

  const handleRecordPayment = async () => {
    const paymentAmount = parseFloat(amount);
    
    if (!paymentAmount || paymentAmount <= 0) {
      toast.error('Please enter a valid payment amount');
      return;
    }
    
    if (paymentAmount > outstandingAmount * 1.1) { // Allow 10% overpayment
      toast.error('Payment amount cannot exceed outstanding amount by more than 10%');
      return;
    }
    
    if (!paymentDate) {
      toast.error('Please select a payment date');
      return;
    }

    try {
      setIsRecording(true);
      
      await InvoiceService.recordPayment(invoice.id, {
        amount: paymentAmount,
        paymentDate,
        paymentMethod,
        reference: reference.trim() || undefined
      });
      
      toast.success(`Payment of R${paymentAmount.toFixed(2)} recorded successfully`);
      onPaymentRecorded?.();
      onClose();
      
    } catch (error) {
      console.error('Error recording payment:', error);
      const message = error instanceof Error ? error.message : 'Failed to record payment';
      toast.error(message);
    } finally {
      setIsRecording(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-success/10 rounded-lg">
            <DollarSign className="w-5 h-5 text-success-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-neutral-900">
              Record Payment
            </h2>
            <p className="text-sm text-neutral-600">
              {invoice.invoiceNumber}
            </p>
          </div>
        </div>
      </ModalHeader>

      <ModalBody>
        {/* Invoice Summary */}
        <div className="bg-neutral-50 rounded-lg p-4 mb-6">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-neutral-500">Total Amount</p>
              <p className="font-semibold text-neutral-900">
                R{invoice.totalAmount.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-neutral-500">Amount Paid</p>
              <p className="font-semibold text-neutral-900">
                R{(invoice.amountPaid || 0).toFixed(2)}
              </p>
            </div>
            <div className="col-span-2">
              <p className="text-neutral-500">Outstanding Amount</p>
              <p className="font-bold text-lg text-error-600">
                R{outstandingAmount.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        {/* Payment Form */}
        <div className="space-y-4">
          {/* Payment Amount */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Payment Amount *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-neutral-500 text-sm">R</span>
              </div>
              <input
                type="text"
                value={amount}
                onChange={(e) => handleAmountChange(e.target.value)}
                placeholder="0.00"
                className="w-full pl-8 pr-20 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-success-500 focus:border-transparent"
              />
              <button
                type="button"
                onClick={handleFullPayment}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-success-600 hover:text-success-700 font-medium"
              >
                Full
              </button>
            </div>
            
            {/* Payment Amount Warnings */}
            {amount && (
              <div className="mt-2">
                {isPartialPayment && (
                  <div className="flex items-start gap-2 p-2 bg-warning-50 border border-warning-200 rounded text-xs text-warning-700">
                    <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                    <span>
                      This is a partial payment. Remaining balance: R{(outstandingAmount - parseFloat(amount)).toFixed(2)}
                    </span>
                  </div>
                )}
                
                {isOverpayment && (
                  <div className="flex items-start gap-2 p-2 bg-error-50 border border-error-200 rounded text-xs text-error-700">
                    <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                    <span>
                      Payment exceeds outstanding amount by R{(parseFloat(amount) - outstandingAmount).toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Payment Date */}
          <Input
            label="Payment Date"
            type="date"
            value={paymentDate}
            onChange={(e) => setPaymentDate(e.target.value)}
            max={format(new Date(), 'yyyy-MM-dd')}
            required
            rightIcon={Calendar}
          />

          {/* Payment Method */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Payment Method *
            </label>
            <div className="relative">
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as typeof paymentMethod)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-success-500 focus:border-transparent appearance-none"
              >
                {PAYMENT_METHODS.map((method) => (
                  <option key={method.value} value={method.value}>
                    {method.label}
                  </option>
                ))}
              </select>
              <CreditCard className="absolute right-3 top-2.5 w-4 h-4 text-neutral-400 pointer-events-none" />
            </div>
          </div>

          {/* Payment Reference */}
          <Input
            label="Payment Reference"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            placeholder="Transaction ID, cheque number, etc."
            helperText="Optional reference for tracking purposes"
          />
        </div>
      </ModalBody>

      <ModalFooter>
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button
          onClick={handleRecordPayment}
          disabled={!amount || !paymentDate || isRecording}
          loading={isRecording}
          leftIcon={DollarSign}
        >
          Record Payment
        </Button>
      </ModalFooter>
    </Modal>
  );
};