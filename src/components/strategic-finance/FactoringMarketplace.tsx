import React, { useState } from 'react';
import type { FactoringOffer } from '@/services/api/strategic-finance.service';
import { StrategicFinanceService } from '@/services/api/strategic-finance.service';
import { toast } from 'react-hot-toast';

export const FactoringMarketplace: React.FC<{ offers: FactoringOffer[] }> = ({ offers }) => {
  const [showApply, setShowApply] = useState<null | FactoringOffer>(null);
  const [invoiceId, setInvoiceId] = useState('');
  const [requestedAmount, setRequestedAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!showApply) return;
    if (!invoiceId || !requestedAmount) {
      toast.error('Provide invoice ID and requested amount');
      return;
    }
    setSubmitting(true);
    try {
      await StrategicFinanceService.applyForFactoring({
        invoiceId,
        offerId: showApply.id,
        requestedAmount: parseFloat(requestedAmount)
      });
      setShowApply(null);
      setInvoiceId('');
      setRequestedAmount('');
    } catch (e) {
      // handled in service
    } finally {
      setSubmitting(false);
    }
  };

  if (offers.length === 0) {
  return (
      <div className="text-center py-12 bg-white rounded-lg border border-neutral-200">
        <p className="text-neutral-600">No active factoring offers at the moment.</p>
            </div>
    );
  }
            
            return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {offers.map(offer => (
        <div key={offer.id} className="bg-white rounded-lg border border-neutral-200 p-6">
          <h3 className="text-lg font-semibold text-neutral-900">{offer.providerName}</h3>
          <div className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-neutral-600">Advance Rate</span><span className="font-medium">{Math.round(offer.advanceRate * 100)}%</span></div>
            <div className="flex justify-between"><span className="text-neutral-600">Discount Rate</span><span className="font-medium">{offer.discountRate}% / mo</span></div>
            <div className="flex justify-between"><span className="text-neutral-600">Invoice Range</span><span className="font-medium">R{offer.minInvoiceAmount.toLocaleString('en-ZA')} - R{offer.maxInvoiceAmount.toLocaleString('en-ZA')}</span></div>
            <div className="flex justify-between"><span className="text-neutral-600">Recourse</span><span className="font-medium">{offer.recourseType.replace('_',' ')}</span></div>
                    </div>
          <button onClick={() => setShowApply(offer)} className="mt-4 w-full px-4 py-2 bg-mpondo-gold-600 text-white rounded-lg hover:bg-mpondo-gold-700">Apply</button>
                  </div>
      ))}

      {showApply && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-4 border-b border-neutral-200">
              <h4 className="font-semibold text-neutral-900">Apply to {showApply.providerName}</h4>
                    </div>
            <div className="p-4 space-y-3">
              <div>
                <label className="block text-sm text-neutral-700 mb-1">Invoice ID</label>
                <input className="w-full px-3 py-2 border border-neutral-300 rounded-lg" value={invoiceId} onChange={e => setInvoiceId(e.target.value)} placeholder="invoice UUID" />
                    </div>
              <div>
                <label className="block text-sm text-neutral-700 mb-1">Requested Amount (R)</label>
                <input className="w-full px-3 py-2 border border-neutral-300 rounded-lg" value={requestedAmount} onChange={e => setRequestedAmount(e.target.value)} type="number" min="0" />
                    </div>
                  </div>
            <div className="p-4 border-t border-neutral-200 flex justify-end gap-2">
              <button className="px-4 py-2 text-neutral-700 hover:bg-neutral-100 rounded-lg" onClick={() => setShowApply(null)}>Cancel</button>
              <button className="px-4 py-2 bg-mpondo-gold-600 text-white rounded-lg disabled:opacity-50" onClick={submit} disabled={submitting}>{submitting ? 'Submitting...' : 'Submit'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

