import React, { useState, useEffect } from 'react';
import { Plus, FileText, Calendar, User, Building } from 'lucide-react';
import { InvoiceGenerationModal } from '../components/invoices/InvoiceGenerationModal';
import { RandIcon } from '../components/icons/RandIcon';
import { formatRand } from '../lib/currency';
import type { Invoice } from '../types';

const ProFormaPage: React.FC = () => {
  const [proFormaInvoices, setProFormaInvoices] = useState<Invoice[]>([]);
  const [showGenerationModal, setShowGenerationModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Mock data for pro forma invoices
    setTimeout(() => {
      setProFormaInvoices([
        {
          id: '1',
          invoiceNumber: 'PF-2024-001',
          matterId: '1',
          matterTitle: 'Smith v Jones Commercial Dispute',
          clientName: 'ABC Corporation',
          amount: 125000,
          vatAmount: 18750,
          totalAmount: 143750,
          status: 'Pro Forma' as any,
          dateGenerated: '2024-01-15T10:00:00Z',
          dueDate: '2024-03-15T00:00:00Z',
          paymentTerms: '60 days',
          bar: 'johannesburg' as any,
          timeEntryIds: ['1', '2', '3'],
          narrative: 'Legal services rendered for commercial dispute resolution including contract analysis and negotiation strategy.',
          disbursements: 2500,
          dateCreated: '2024-01-15T10:00:00Z',
          dateModified: '2024-01-15T10:00:00Z'
        }
      ]);
      setIsLoading(false);
    }, 500);
  }, []);

  const handleProFormaGenerated = () => {
    setShowGenerationModal(false);
    // Reload pro forma invoices
    // In a real app, this would refresh the data
  };

  const convertToFinalInvoice = (proFormaId: string) => {
    // Implementation to convert pro forma to final invoice
    console.log('Converting pro forma to final invoice:', proFormaId);
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-mpondo-gold-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">Pro Forma Invoices</h1>
          <p className="text-neutral-600 mt-1">
            Create and manage preliminary invoices for estimation purposes
          </p>
        </div>
        <button
          onClick={() => setShowGenerationModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Pro Forma
        </button>
      </div>

      {/* Info Banner */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start gap-3">
          <FileText className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h3 className="font-medium text-blue-900">About Pro Forma Invoices</h3>
            <p className="text-sm text-blue-800 mt-1">
              Pro forma invoices are preliminary bills used for estimation purposes. They don't affect billing status 
              or matter WIP values, and can later be converted to final invoices.
            </p>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-lg border border-neutral-200">
          <div className="flex items-center gap-3">
            <FileText className="w-8 h-8 text-blue-600" />
            <div>
              <p className="text-sm font-medium text-neutral-600">Total Pro Formas</p>
              <p className="text-2xl font-bold text-neutral-900">{proFormaInvoices.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-neutral-200">
          <div className="flex items-center gap-3">
            <RandIcon size={32} className="text-green-600" />
            <div>
              <p className="text-sm font-medium text-neutral-600">Estimated Value</p>
              <p className="text-2xl font-bold text-neutral-900">
                {formatRand(proFormaInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0))}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-neutral-200">
          <div className="flex items-center gap-3">
            <Calendar className="w-8 h-8 text-orange-600" />
            <div>
              <p className="text-sm font-medium text-neutral-600">This Month</p>
              <p className="text-2xl font-bold text-neutral-900">
                {proFormaInvoices.filter(inv => 
                  new Date(inv.dateGenerated).getMonth() === new Date().getMonth()
                ).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Pro Forma List */}
      <div className="bg-white rounded-lg border border-neutral-200">
        <div className="p-6 border-b border-neutral-200">
          <h2 className="text-lg font-semibold text-neutral-900">Pro Forma Invoices</h2>
        </div>
        
        {proFormaInvoices.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-neutral-900 mb-2">No Pro Forma Invoices</h3>
            <p className="text-neutral-600 mb-6">
              Create your first pro forma invoice to get started with preliminary billing.
            </p>
            <button
              onClick={() => setShowGenerationModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create First Pro Forma
            </button>
          </div>
        ) : (
          <div className="divide-y divide-neutral-200">
            {proFormaInvoices.map((invoice) => (
              <div key={invoice.id} className="p-6 hover:bg-neutral-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-neutral-900">{invoice.invoiceNumber}</h3>
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                        Pro Forma
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Building className="w-4 h-4 text-neutral-400" />
                        <span className="text-neutral-600">{invoice.clientName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-neutral-400" />
                        <span className="text-neutral-600">{invoice.matterTitle}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <RandIcon size={16} className="text-neutral-400" />
                        <span className="text-neutral-600">{formatRand(invoice.totalAmount)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-neutral-400" />
                        <span className="text-neutral-600">
                          {new Date(invoice.dateGenerated).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => convertToFinalInvoice(invoice.id)}
                      className="px-3 py-1.5 bg-mpondo-gold-600 text-white text-sm rounded-lg hover:bg-mpondo-gold-700 transition-colors"
                    >
                      Convert to Final
                    </button>
                    <button className="px-3 py-1.5 border border-neutral-300 text-neutral-700 text-sm rounded-lg hover:bg-neutral-50 transition-colors">
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showGenerationModal && (
        <InvoiceGenerationModal
          isOpen={showGenerationModal}
          onClose={() => setShowGenerationModal(false)}
          onInvoiceGenerated={handleProFormaGenerated}
          defaultToProForma={true}
        />
      )}
    </div>
  );
};

export default ProFormaPage;
