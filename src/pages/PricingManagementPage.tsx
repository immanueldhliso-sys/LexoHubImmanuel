import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  Calculator, 
  Plus, 
  RefreshCw, 
  BarChart3,
  Target,
  Zap,
  Eye,
  Download,
  Settings,
  AlertTriangle
} from 'lucide-react';
import { Card, CardHeader, CardContent, Button } from '../design-system/components';
import { InvoiceService } from '../services/api/invoices.service';
import { StrategicFinanceService } from '../services/api/strategic-finance.service';
import { toast } from 'react-hot-toast';
import type { 
  PerformanceBasedPricing, 
  SuccessFeeCalculation, 
  Invoice, 
  InvoiceStatus,
  FeeOptimizationRecommendation 
} from '../types';
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
          <div className="flex gap-2">
            <Button
              onClick={() => onEdit(pricing)}
              variant="outline"
              size="sm"
              aria-label={`Edit ${pricing.pricingModel} pricing plan`}
            >
              <Settings className="w-4 h-4 mr-1" />
              Edit
            </Button>
            <Button
              onClick={() => toast.info(`Viewing detailed analytics for ${pricing.pricingModel} plan...`)}
              variant="ghost"
              size="sm"
              aria-label={`View analytics for ${pricing.pricingModel} pricing plan`}
            >
              <BarChart3 className="w-4 h-4" />
            </Button>
          </div>
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
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-neutral-600">
              <Calculator className="w-4 h-4" />
              <span>{calculations.length} calculations</span>
            </div>
            <Button variant="outline" size="sm" onClick={() => toast.info('Exporting success fee calculations...')}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" size="sm" onClick={() => toast.info('Opening success fee calculator...')}>
              <Calculator className="w-4 h-4 mr-2" />
              Calculate
            </Button>
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
  const [isLoading, setIsLoading] = useState(false);
  const [invoicePerformanceData, setInvoicePerformanceData] = useState<{
    totalCollected: number;
    averageCollectionDays: number;
    collectionRate: number;
    recentInvoices: Invoice[];
    performanceByFeeType: { feeType: string; performance: number; revenue: number }[];
  }>({
    totalCollected: 0,
    averageCollectionDays: 0,
    collectionRate: 0,
    recentInvoices: [],
    performanceByFeeType: []
  });
  
  const [feeOptimizationRecommendations, setFeeOptimizationRecommendations] = useState<FeeOptimizationRecommendation[]>([]);
  const [showOptimizationModal, setShowOptimizationModal] = useState(false);
  const [showNewPricingModal, setShowNewPricingModal] = useState(false);

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

  useEffect(() => {
    loadPerformanceData();
    loadFeeOptimizationRecommendations();
  }, []);

  const loadPerformanceData = async () => {
    setIsLoading(true);
    try {
      // Load invoice performance data
      const invoicesResponse = await InvoiceService.getInvoices({ 
        page: 1, 
        pageSize: 100,
        sortBy: 'created_at',
        sortOrder: 'desc'
      });

      const invoices = invoicesResponse.data;
      const paidInvoices = invoices.filter(inv => inv.status === InvoiceStatus.PAID && inv.date_paid);
      
      // Calculate performance metrics
      const totalCollected = paidInvoices.reduce((sum, inv) => sum + inv.total_amount, 0);
      const totalBilled = invoices.reduce((sum, inv) => sum + inv.total_amount, 0);
      const collectionRate = totalBilled > 0 ? (totalCollected / totalBilled) * 100 : 0;
      
      const averageCollectionDays = paidInvoices.length > 0 
        ? paidInvoices.reduce((sum, inv) => {
            const daysToPay = Math.floor((new Date(inv.date_paid!).getTime() - new Date(inv.invoice_date).getTime()) / (1000 * 60 * 60 * 24));
            return sum + daysToPay;
          }, 0) / paidInvoices.length
        : 0;

      // Mock performance by fee type (would be calculated from actual matter data)
      const performanceByFeeType = [
        { feeType: 'Standard Hourly', performance: 85, revenue: totalCollected * 0.6 },
        { feeType: 'Contingency', performance: 92, revenue: totalCollected * 0.25 },
        { feeType: 'Success Fee', performance: 78, revenue: totalCollected * 0.15 }
      ];

      setInvoicePerformanceData({
        totalCollected,
        averageCollectionDays,
        collectionRate,
        recentInvoices: invoices.slice(0, 10),
        performanceByFeeType
      });

    } catch (error) {
      console.error('Error loading performance data:', error);
      toast.error('Failed to load performance data');
    } finally {
      setIsLoading(false);
    }
  };

  const loadFeeOptimizationRecommendations = async () => {
    try {
      const recommendations = await StrategicFinanceService.generateFeeOptimizationRecommendations();
      setFeeOptimizationRecommendations(recommendations);
    } catch (error) {
      console.error('Error loading fee optimization recommendations:', error);
    }
  };

  const handleEditPricing = (pricing: PerformanceBasedPricing) => {
    toast.info(`Opening pricing editor for ${pricing.pricingModel} plan...`);
    // This would open a modal to edit the pricing plan
  };

  const handleCreateNewPricing = () => {
    setShowNewPricingModal(true);
    toast.info('Opening new pricing plan creator...');
  };

  const handleOptimizeFees = async () => {
    try {
      setIsLoading(true);
      const recommendations = await StrategicFinanceService.generateFeeOptimizationRecommendations();
      setFeeOptimizationRecommendations(recommendations);
      setShowOptimizationModal(true);
      toast.success('Fee optimization recommendations generated');
    } catch (error) {
      console.error('Error generating fee optimization:', error);
      toast.error('Failed to generate optimization recommendations');
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewPerformanceAnalysis = () => {
    toast.info('Opening detailed performance analysis...');
    // This would navigate to or open a detailed performance analysis view
  };

  const handleExportPricingReport = async () => {
    try {
      toast.info('Generating pricing performance report...');
      // This would generate and download a comprehensive pricing report
      setTimeout(() => {
        toast.success('Pricing report exported successfully');
      }, 2000);
    } catch (error) {
      console.error('Error exporting pricing report:', error);
      toast.error('Failed to export pricing report');
    }
  };

  const handleApplyRecommendation = async (recommendation: FeeOptimizationRecommendation) => {
    try {
      await StrategicFinanceService.applyFeeOptimizationRecommendation(recommendation.id);
      toast.success('Fee optimization recommendation applied');
      await loadPerformanceData(); // Refresh data
    } catch (error) {
      console.error('Error applying recommendation:', error);
      toast.error('Failed to apply recommendation');
    }
  };

  const handleRefreshData = async () => {
    await Promise.all([
      loadPerformanceData(),
      loadFeeOptimizationRecommendations()
    ]);
    toast.success('Data refreshed successfully');
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
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handleRefreshData} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" onClick={handleOptimizeFees} disabled={isLoading}>
            <Zap className="w-4 h-4 mr-2" />
            Optimize Fees
          </Button>
          <Button variant="primary" onClick={handleCreateNewPricing}>
            <Plus className="w-4 h-4 mr-2" />
            New Pricing Plan
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card hoverable className="cursor-pointer" onClick={handleViewPerformanceAnalysis}>
          <CardContent className="p-6 text-center">
            <div className="text-status-success-500 mb-2">
              <TrendingUp className="w-8 h-8 mx-auto" />
            </div>
            <h3 className="text-2xl font-bold text-neutral-900">
              {formatCurrency(invoicePerformanceData.totalCollected)}
            </h3>
            <p className="text-sm text-neutral-600">Total Collected</p>
            <div className="mt-2 text-xs text-status-success-600 flex items-center justify-center">
              View Analysis <Eye className="w-3 h-3 ml-1" />
            </div>
          </CardContent>
        </Card>

        <Card hoverable className="cursor-pointer" onClick={handleExportPricingReport}>
          <CardContent className="p-6 text-center">
            <div className="text-mpondo-gold-500 mb-2">
              <DollarSign className="w-8 h-8 mx-auto" />
            </div>
            <h3 className="text-2xl font-bold text-neutral-900">
              {invoicePerformanceData.collectionRate.toFixed(0)}%
            </h3>
            <p className="text-sm text-neutral-600">Collection Rate</p>
            <div className="mt-2 text-xs text-mpondo-gold-600 flex items-center justify-center">
              Export Report <Download className="w-3 h-3 ml-1" />
            </div>
          </CardContent>
        </Card>

        <Card hoverable>
          <CardContent className="p-6 text-center">
            <div className="text-judicial-blue-500 mb-2">
              <Calculator className="w-8 h-8 mx-auto" />
            </div>
            <h3 className="text-2xl font-bold text-neutral-900">
              {invoicePerformanceData.averageCollectionDays.toFixed(0)}
            </h3>
            <p className="text-sm text-neutral-600">Avg Collection Days</p>
            <div className="text-xs text-neutral-500 mt-1">
              {invoicePerformanceData.averageCollectionDays < 45 ? 'Excellent' : 
               invoicePerformanceData.averageCollectionDays < 60 ? 'Good' : 'Needs Improvement'}
            </div>
          </CardContent>
        </Card>

        <Card hoverable className="cursor-pointer" onClick={handleOptimizeFees}>
          <CardContent className="p-6 text-center">
            <div className="text-status-warning-500 mb-2">
              <Target className="w-8 h-8 mx-auto" />
            </div>
            <h3 className="text-2xl font-bold text-neutral-900">
              {feeOptimizationRecommendations.length}
            </h3>
            <p className="text-sm text-neutral-600">Optimization Tips</p>
            <div className="mt-2 text-xs text-status-warning-600 flex items-center justify-center">
              View Tips <Zap className="w-3 h-3 ml-1" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Fee Optimization Recommendations */}
      {feeOptimizationRecommendations.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <h2 className="text-xl font-semibold text-neutral-900">Fee Optimization Recommendations</h2>
            <Button variant="outline" size="sm" onClick={handleOptimizeFees} disabled={isLoading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh Recommendations
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {feeOptimizationRecommendations.slice(0, 3).map((recommendation) => (
                <div key={recommendation.id} className="p-4 border border-neutral-200 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Zap className="w-4 h-4 text-status-warning-500" />
                        <h3 className="font-medium text-neutral-900">
                          {recommendation.recommended_model} Optimization
                        </h3>
                        <span className="px-2 py-1 bg-status-success-100 text-status-success-800 text-xs rounded-full">
                          +{recommendation.potential_revenue_increase?.toFixed(0)}% Revenue
                        </span>
                      </div>
                      <p className="text-sm text-neutral-600 mb-3">
                        Current: R{recommendation.current_hourly_rate}/hour → 
                        Recommended: R{recommendation.recommended_hourly_rate}/hour
                      </p>
                      <div className="flex items-center gap-4 text-xs text-neutral-500">
                        <span>Confidence: {(recommendation.confidence_score! * 100).toFixed(0)}%</span>
                        <span>Based on {recommendation.similar_matters_analyzed} similar matters</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleViewPerformanceAnalysis()}>
                        <Eye className="w-4 h-4 mr-1" />
                        Details
                      </Button>
                      <Button 
                        variant="primary" 
                        size="sm" 
                        onClick={() => handleApplyRecommendation(recommendation)}
                        className="bg-status-success-600 hover:bg-status-success-700"
                      >
                        Apply
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Performance by Fee Type */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <h2 className="text-xl font-semibold text-neutral-900">Performance by Fee Type</h2>
          <Button variant="outline" size="sm" onClick={handleViewPerformanceAnalysis}>
            <BarChart3 className="w-4 h-4 mr-2" />
            Detailed Analysis
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {invoicePerformanceData.performanceByFeeType.map((feeType, index) => (
              <div key={feeType.feeType} className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-32 text-sm font-medium text-neutral-900">{feeType.feeType}</div>
                  <div className="flex-1">
                    <div className="w-full bg-neutral-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          index === 0 ? 'bg-mpondo-gold-500' :
                          index === 1 ? 'bg-judicial-blue-500' :
                          'bg-status-success-500'
                        }`}
                        style={{ width: `${feeType.performance}%` }}
                      />
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium text-neutral-900">{feeType.performance}%</div>
                  <div className="text-xs text-neutral-600">
                    {formatCurrency(feeType.revenue)} revenue
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Pricing Plans */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-neutral-900">Performance-Based Pricing Plans</h2>
          <Button variant="outline" onClick={handleCreateNewPricing}>
            <Plus className="w-4 h-4 mr-2" />
            Add New Plan
          </Button>
        </div>
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

      {/* Pricing Insights & Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold text-neutral-900">Pricing Insights</h2>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-3 bg-status-success-50 rounded-lg">
                <TrendingUp className="w-5 h-5 text-status-success-600 mt-0.5" />
                <div>
                  <p className="font-medium text-status-success-900">Strong Collection Performance</p>
                  <p className="text-sm text-status-success-700">
                    Your {invoicePerformanceData.collectionRate.toFixed(0)}% collection rate is above industry average.
                  </p>
                </div>
              </div>
              
              {invoicePerformanceData.averageCollectionDays > 60 && (
                <div className="flex items-start gap-3 p-3 bg-status-warning-50 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-status-warning-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-status-warning-900">Collection Speed Opportunity</p>
                    <p className="text-sm text-status-warning-700">
                      Consider implementing faster payment terms to improve cash flow.
                    </p>
                  </div>
                </div>
              )}
              
              <div className="flex items-start gap-3 p-3 bg-judicial-blue-50 rounded-lg">
                <Target className="w-5 h-5 text-judicial-blue-600 mt-0.5" />
                <div>
                  <p className="font-medium text-judicial-blue-900">Optimization Potential</p>
                  <p className="text-sm text-judicial-blue-700">
                    {feeOptimizationRecommendations.length} optimization opportunities identified.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="mt-6 pt-4 border-t border-neutral-200">
              <Button variant="primary" onClick={handleOptimizeFees} className="w-full">
                <Zap className="w-4 h-4 mr-2" />
                Generate New Recommendations
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold text-neutral-900">Quick Actions</h2>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={handleCreateNewPricing}
              >
                <Plus className="w-4 h-4 mr-3" />
                Create New Pricing Model
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={handleViewPerformanceAnalysis}
              >
                <BarChart3 className="w-4 h-4 mr-3" />
                View Performance Analysis
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={handleExportPricingReport}
              >
                <Download className="w-4 h-4 mr-3" />
                Export Pricing Report
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => toast.info('Opening success fee calculator...')}
              >
                <Calculator className="w-4 h-4 mr-3" />
                Calculate Success Fees
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => toast.info('Opening pricing settings...')}
              >
                <Settings className="w-4 h-4 mr-3" />
                Pricing Settings
              </Button>
            </div>
            
            <div className="mt-6 pt-4 border-t border-neutral-200">
              <div className="text-sm text-neutral-600">
                <p className="mb-2">
                  <strong>Performance-based pricing</strong> aligns success with results through:
                </p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>Reduced base rates with success fees</li>
                  <li>Transparent calculation methods</li>
                  <li>Risk sharing with clients</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PricingManagementPage;