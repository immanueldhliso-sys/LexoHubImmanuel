import React, { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { Button, Icon } from '../design-system/components';
import { InvoiceList } from '../components/invoices/InvoiceList';
import { PaymentTrackingDashboard } from '../components/invoices/PaymentTrackingDashboard';

const InvoicesPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'invoices' | 'tracking'>('invoices');
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900">Invoices</h1>
          <p className="text-sm sm:text-base text-neutral-600 mt-1">Manage your invoices and payment tracking</p>
        </div>
        <Button 
          variant="outline" 
          onClick={handleRefresh}
          data-testid="refresh-invoices-button"
          className="self-start sm:self-auto"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>
      {/* Tab Navigation */}
      <div className="border-b border-neutral-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('invoices')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'invoices'
                ? 'border-mpondo-gold-500 text-mpondo-gold-600'
                : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
            }`}
            data-testid="invoices-tab"
          >
            Invoice Management
          </button>
          <button
            onClick={() => setActiveTab('tracking')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'tracking'
                ? 'border-mpondo-gold-500 text-mpondo-gold-600'
                : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
            }`}
            data-testid="tracking-tab"
          >
            Payment Tracking
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'invoices' ? (
        <InvoiceList key={`invoices-${refreshKey}`} />
      ) : (
        <PaymentTrackingDashboard key={`tracking-${refreshKey}`} />
      )}
    </div>
  );
};

export default InvoicesPage;