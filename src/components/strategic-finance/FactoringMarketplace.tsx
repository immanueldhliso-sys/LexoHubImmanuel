import React, { useState } from 'react';
import { 
  DollarSign, 
  Percent, 
  Calendar, 
  Shield,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react';
import type { FactoringOffer } from '../../services/api/strategic-finance.service';
import { StrategicFinanceService } from '../../services/api/strategic-finance.service';
import { toast } from 'react-hot-toast';

interface FactoringMarketplaceProps {
  offers: FactoringOffer[];
}

export const FactoringMarketplace: React.FC<FactoringMarketplaceProps> = ({ offers }) => {
  const [selectedOffer, setSelectedOffer] = useState<FactoringOffer | null>(null);
  const [invoiceAmount, setInvoiceAmount] = useState('');
  const [showApplicationModal, setShowApplicationModal] = useState(false);

  const calculateFactoringDetails = (offer: FactoringOffer, amount: number) => {
    const advanceAmount = amount * offer.advanceRate;
    const monthlyFee = advanceAmount * (offer.discountRate / 100);
    const netAmount = advanceAmount - monthlyFee;
    
    return {
      advanceAmount,
      monthlyFee,
      netAmount,
      effectiveRate: (monthlyFee / advanceAmount) * 100
    };
  };

  const getRecourseTypeColor = (type: string) => {
    switch (type) {
      case 'non_recourse':
        return 'text-success-700 bg-success-100';
      case 'recourse':
        return 'text-warning-700 bg-warning-100';
      case 'partial_recourse':
        return 'text-judicial-blue-700 bg-judicial-blue-100';
      default:
        return 'text-neutral-700 bg-neutral-100';
    }
  };

  const getRecourseTypeLabel = (type: string) => {
    switch (type) {
      case 'non_recourse':
        return 'Non-Recourse';
      case 'recourse':
        return 'Full Recourse';
      case 'partial_recourse':
        return 'Partial Recourse';
      default:
        return type;
    }
  };

  const filteredOffers = invoiceAmount
    ? offers.filter(offer => {
        const amount = parseFloat(invoiceAmount);
        return amount >= offer.minInvoiceAmount && amount <= offer.maxInvoiceAmount;
      })
    : offers;

  return (
    <div className="space-y-6">
      {/* Invoice Amount Input */}
      <div className="bg-white rounded-lg border border-neutral-200 p-6">
        <h3 className="text-lg font-semibold text-neutral-900 mb-4">Calculate Factoring Options</h3>
        <div className="flex items-end gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Invoice Amount (R)
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="number"
                value={invoiceAmount}
                onChange={(e) => setInvoiceAmount(e.target.value)}
                placeholder="Enter invoice amount"
                className="w-full pl-10 pr-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-mpondo-gold-500 focus:border-mpondo-gold-500"
              />
            </div>
          </div>
          <button
            onClick={() => setInvoiceAmount('')}
            className="px-4 py-2 text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            Clear
          </button>
        </div>
        {invoiceAmount && (
          <p className="text-sm text-neutral-600 mt-2">
            Showing {filteredOffers.length} of {offers.length} offers for this amount
          </p>
        )}
      </div>

      {/* Offers Grid */}
      {filteredOffers.length === 0 ? (
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
          <p className="text-neutral-600 mb-2">No factoring offers available</p>
          <p className="text-sm text-neutral-500">
            {invoiceAmount ? 'Try adjusting the invoice amount' : 'Enter an invoice amount to see available offers'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOffers.map(offer => {
            const details = invoiceAmount ? calculateFactoringDetails(offer, parseFloat(invoiceAmount)) : null;
            
            return (
              <div
                key={offer.id}
                className="bg-white rounded-lg border border-neutral-200 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => {
                  setSelectedOffer(offer);
                  setShowApplicationModal(true);
                }}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="font-semibold text-neutral-900">{offer.providerName}</h4>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-2 ${getRecourseTypeColor(offer.recourseType)}`}>
                        {getRecourseTypeLabel(offer.recourseType)}
                      </span>
                    </div>
                    <Shield className="w-5 h-5 text-neutral-400" />
                  </div>

                  <div className="space-y-3 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-neutral-600">Advance Rate:</span>
                      <span className="font-medium">{(offer.advanceRate * 100).toFixed(0)}%</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-neutral-600">Monthly Rate:</span>
                      <span className="font-medium">{offer.discountRate.toFixed(2)}%</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-neutral-600">Invoice Age:</span>
                      <span className="font-medium">{offer.minimumInvoiceAgeDays}-{offer.maximumInvoiceAgeDays} days</span>
                    </div>
                  </div>

                  {details && (
                    <div className="pt-4 border-t border-neutral-200">
                      <p className="text-xs text-neutral-600 mb-2">For your invoice:</p>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-neutral-600">You receive:</span>
                          <span className="font-semibold text-success-600">
                            R{details.netAmount.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div className="flex justify-between text-xs text-neutral-500">
                          <span>Fee:</span>
                          <span>R{details.monthlyFee.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <button className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-2 bg-mpondo-gold-600 text-white rounded-lg hover:bg-mpondo-gold-700 transition-colors">
                    Apply Now
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Information Box */}
      <div className="bg-judicial-blue-50 border border-judicial-blue-200 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-judicial-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-judicial-blue-800">
            <h4 className="font-semibold mb-2">About Invoice Factoring</h4>
            <p className="mb-2">
              Invoice factoring allows you to receive immediate cash for your outstanding invoices. 
              The factoring company advances you a percentage of the invoice value and collects payment directly from your client.
            </p>
            <ul className="space-y-1">
              <li>• <strong>Non-Recourse:</strong> The factor assumes the credit risk</li>
              <li>• <strong>Recourse:</strong> You remain liable if the client doesn't pay</li>
              <li>• <strong>Advance Rate:</strong> Percentage of invoice value paid upfront</li>
              <li>• <strong>Discount Rate:</strong> Monthly fee charged by the factor</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Application Modal */}
      {showApplicationModal && selectedOffer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-neutral-900 mb-4">
                Apply for Invoice Factoring
              </h3>
              <p className="text-neutral-600 mb-6">
                You are applying for factoring with {selectedOffer.providerName}.
                Please select an invoice and confirm the details.
              </p>
              {/* Application form would go here */}
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowApplicationModal(false)}
                  className="px-4 py-2 text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    toast.success('Application feature coming soon!');
                    setShowApplicationModal(false);
                  }}
                  className="px-4 py-2 bg-mpondo-gold-600 text-white rounded-lg hover:bg-mpondo-gold-700 transition-colors"
                >
                  Submit Application
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
