import React, { useState } from 'react';
import { InvoiceList } from '../components/invoices/InvoiceList';
import { PaymentTrackingDashboard } from '../components/invoices/PaymentTrackingDashboard';

const InvoicesPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'invoices' | 'tracking'>('invoices');

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">Invoices</h1>
          <p className="text-neutral-600 mt-1">Manage your invoices and payment tracking</p>
        </div>
      </div>
      {/* Tab Navigation */}
      <div className="border-b border-neutral-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('invoices')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'invoices'
                ? 'border-mpondo-gold-500 text-mpondo-gold-600'
                : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
            }`}
          >
            Invoice Management
          </button>
          <button
            onClick={() => setActiveTab('tracking')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'tracking'
                ? 'border-mpondo-gold-500 text-mpondo-gold-600'
                : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
            }`}
          >
            Payment Tracking
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'invoices' ? (
        <InvoiceList />
      ) : (
        <PaymentTrackingDashboard />
      )}
    </div>
  );
};

export default InvoicesPage;