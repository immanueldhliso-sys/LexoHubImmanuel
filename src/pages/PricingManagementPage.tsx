import React from 'react';
import { DollarSign, TrendingUp, Calculator } from 'lucide-react';
import { Card, CardHeader, CardContent, Button } from '../design-system/components';
import type { PerformanceBasedPricing, SuccessFeeCalculation } from '../types';
import { PricingModel } from '../types';

const PerformanceBasedPricingCard: React.FC<{
  pricing: PerformanceBasedPricing;
  onEdit: (pricing: PerformanceBasedPricing) => void;
}> = ({ pricing, onEdit }) => {
  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(amount);

  const getPricingModelColor = (model: PricingModel) => {
    switch (model) {
      case PricingModel.SUCCESS_SHARING:
        return 'text-status-success-600 bg-status-success-50';
      case PricingModel.CONTINGENCY:
        return 'text-status-warning-600 bg-status-warning-50';
      case PricingModel.HYBRID:
        return 'text-mpondo-gold-600 bg-mpondo-gold-50';
      default:
        return 'text-neutral-600 bg-neutral-50';
    }
  };

  return (
    <Card hoverable className="transition-all duration-300">
      <CardContent>
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-mpondo-gold-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-mpondo-gold-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-neutral-900">
                {pricing.pricingModel} Plan
              </h3>
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPricingModelColor(pricing.pricingModel)}`}>
                {pricing.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
          <Button
            onClick={() => onEdit(pricing)}
            variant="outline"
            size="sm"
            aria-label={`Edit ${pricing.pricingModel} pricing plan`}
          >
            Edit
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
          <p className="text-sm text-neutral-600">Base Subscription</p>
          <p className="text-xl font-bold text-neutral-900">
            {formatCurrency(pricing.baseSubscriptionRate)}/mo
          </p>
        </div>
        <div>
          <p className="text-sm text-neutral-600">Success Fee</p>
          <p className="text-xl font-bold text-mpondo-gold-600">
            {pricing.successFeePercentage}%
          </p>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-neutral-600">Total Collected</span>
          <span className="font-medium text-neutral-900">
            {formatCurrency(pricing.performance.totalCollected)}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-neutral-600">Success Fees Paid</span>
          <span className="font-medium text-status-success-600">
            {formatCurrency(pricing.performance.totalSuccessFees)}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-neutral-600">Collection Rate</span>
          <span className="font-medium text-neutral-900">
            {pricing.performance.averageCollectionRate.toFixed(1)}%
          </span>
        </div>
      </div>

        <div className="pt-4 border-t border-neutral-200">
          <div className="flex items-center justify-between">
            <span className="text-sm text-neutral-600">Projected Annual Savings</span>
            <span className="text-lg font-bold text-status-success-600">
              {formatCurrency(pricing.performance.projectedAnnualSavings)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const SuccessFeeCalculationTable: React.FC<{
  calculations: SuccessFeeCalculation[];
}> = ({ calculations }) => {
  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(amount);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Paid':
        return 'badge-success';
      case 'Pending':
        return 'badge-warning';
      case 'Disputed':
        return 'badge-error';
      default:
        return 'badge';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-neutral-900">Success Fee Calculations</h2>
          <div className="flex items-center gap-2 text-sm text-neutral-600">
            <Calculator className="w-4 h-4" />
            <span>{calculations.length} calculations</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-neutral-200">
              <th className="table-header text-left py-3">Date</th>
              <th className="table-header text-left py-3">Matter</th>
              <th className="table-header text-right py-3">Collected</th>
              <th className="table-header text-right py-3">Fee %</th>
              <th className="table-header text-right py-3">Success Fee</th>
              <th className="table-header text-center py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {calculations.map((calc) => (
              <tr key={calc.id} className="table-row">
                <td className="py-3 text-sm text-neutral-900">
                  {new Date(calc.calculationDate).toLocaleDateString('en-ZA')}
                </td>
                <td className="py-3 text-sm text-neutral-900">
                  Matter #{calc.matterId.slice(-6)}
                </td>
                <td className="py-3 text-sm text-neutral-900 text-right">
                  {formatCurrency(calc.collectedAmount)}
                </td>
                <td className="py-3 text-sm text-neutral-900 text-right">
                  {calc.successFeePercentage}%
                </td>
                <td className="py-3 text-sm font-medium text-mpondo-gold-600 text-right">
                  {formatCurrency(calc.successFeeAmount)}
                </td>
                <td className="py-3 text-center">
                  <span className={`badge ${getStatusColor(calc.paymentStatus)}`}>
                    {calc.paymentStatus}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

        {calculations.length === 0 && (
          <div className="text-center py-8">
            <Calculator className="w-12 h-12 text-neutral-400 mx-auto mb-3" />
            <p className="text-neutral-600">No success fee calculations yet</p>
            <p className="text-sm text-neutral-500 mt-1">
              Calculations will appear here once payments are collected
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const PricingManagementPage: React.FC = () => {
  // Mock data for performance-based pricing
  const pricingPlans: PerformanceBasedPricing[] = [
    {
      id: '1',
      pricingModel: PricingModel.SUCCESS_SHARING,
      baseSubscriptionRate: 2500,
      successFeePercentage: 15,
      isActive: true,
      performance: {
        totalCollected: 850000,
        totalSuccessFees: 127500,
        averageCollectionRate: 87.5,
        projectedAnnualSavings: 180000
      }
    },
    {
      id: '2',
      pricingModel: PricingModel.CONTINGENCY,
      baseSubscriptionRate: 1500,
      successFeePercentage: 25,
      isActive: false,
      performance: {
        totalCollected: 450000,
        totalSuccessFees: 112500,
        averageCollectionRate: 72.3,
        projectedAnnualSavings: 95000
      }
    }
  ];

  // Mock data for success fee calculations
  const successFeeCalculations: SuccessFeeCalculation[] = [
    {
      id: '1',
      matterId: 'MTR-2024-001234',
      calculationDate: '2024-01-15',
      collectedAmount: 125000,
      successFeePercentage: 15,
      successFeeAmount: 18750,
      paymentStatus: 'Paid'
    },
    {
      id: '2',
      matterId: 'MTR-2024-001235',
      calculationDate: '2024-01-20',
      collectedAmount: 85000,
      successFeePercentage: 15,
      successFeeAmount: 12750,
      paymentStatus: 'Pending'
    },
    {
      id: '3',
      matterId: 'MTR-2024-001236',
      calculationDate: '2024-01-25',
      collectedAmount: 200000,
      successFeePercentage: 25,
      successFeeAmount: 50000,
      paymentStatus: 'Disputed'
    }
  ];

  const handleEditPricing = (pricing: PerformanceBasedPricing) => {
    console.log('Edit pricing:', pricing);
    // TODO: Implement pricing edit functionality
  };

  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(amount);

  const calculateTotalSavings = () => {
    return pricingPlans.reduce((total, plan) => 
      total + plan.performance.projectedAnnualSavings, 0
    );
  };

  const calculateTotalSuccessFees = () => {
    return successFeeCalculations.reduce((total, calc) => 
      total + calc.successFeeAmount, 0
    );
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">Pricing Management</h1>
          <p className="text-neutral-600 mt-1">Manage your performance-based pricing models and track success fees</p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card hoverable>
          <CardContent className="text-center">
            <div className="text-status-success-500 mb-2">
              <TrendingUp className="w-8 h-8 mx-auto" />
            </div>
            <h3 className="text-2xl font-bold text-neutral-900">
              {formatCurrency(calculateTotalSavings())}
            </h3>
            <p className="text-sm text-neutral-600">Annual Savings</p>
          </CardContent>
        </Card>

        <Card hoverable>
          <CardContent className="text-center">
            <div className="text-mpondo-gold-500 mb-2">
              <DollarSign className="w-8 h-8 mx-auto" />
            </div>
            <h3 className="text-2xl font-bold text-neutral-900">
              {formatCurrency(calculateTotalSuccessFees())}
            </h3>
            <p className="text-sm text-neutral-600">Success Fees Paid</p>
          </CardContent>
        </Card>

        <Card hoverable>
          <CardContent className="text-center">
            <div className="text-judicial-blue-500 mb-2">
              <Calculator className="w-8 h-8 mx-auto" />
            </div>
            <h3 className="text-2xl font-bold text-neutral-900">
              {pricingPlans.filter(p => p.isActive).length}
            </h3>
            <p className="text-sm text-neutral-600">Active Plans</p>
          </CardContent>
        </Card>
      </div>

      {/* Pricing Plans */}
      <div>
        <h2 className="text-xl font-semibold text-neutral-900 mb-4">Performance-Based Pricing Plans</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {pricingPlans.map((pricing) => (
            <PerformanceBasedPricingCard
              key={pricing.id}
              pricing={pricing}
              onEdit={handleEditPricing}
            />
          ))}
        </div>
      </div>

      {/* Success Fee Calculations */}
      <div>
        <SuccessFeeCalculationTable calculations={successFeeCalculations} />
      </div>

      {/* Information Panel */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold text-neutral-900">About Performance-Based Pricing</h2>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm max-w-none text-neutral-600">
            <p className="mb-3">
              Performance-based pricing aligns our success with yours. Instead of traditional hourly billing, 
              you pay a reduced base subscription plus a success fee only when we achieve positive outcomes.
            </p>
            <ul className="list-disc list-inside space-y-1 mb-3">
              <li><strong>Success Sharing:</strong> Lower base rate with moderate success fees</li>
              <li><strong>Contingency:</strong> Minimal upfront costs with higher success fees</li>
              <li><strong>Hybrid:</strong> Balanced approach combining elements of both models</li>
            </ul>
            <p>
              This model incentivizes efficiency and results while providing you with predictable costs 
              and shared risk. Success fees are calculated transparently based on actual collections and settlements.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PricingManagementPage;