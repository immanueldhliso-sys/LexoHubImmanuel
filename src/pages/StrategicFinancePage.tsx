import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  BarChart3, 
  Calculator,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Target,
  Zap,
  RefreshCw,
  Shield
} from 'lucide-react';
import { format } from 'date-fns';
import { 
  StrategicFinanceService, 
  type CashFlowPrediction, 
  type PracticeFinancialHealth,
  type FactoringOffer
} from '../services/api/strategic-finance.service';
import { InvoiceService } from '../services/api/invoices.service';
import { CashFlowChart } from '@/components/strategic-finance/CashFlowChart';
import { FinancialHealthCard } from '@/components/strategic-finance/FinancialHealthCard';
import { FactoringMarketplace } from '@/components/strategic-finance/FactoringMarketplace';
import { SuccessFeeCalculator } from '@/components/strategic-finance/SuccessFeeCalculator';
import { FeeOptimizationCard } from '@/components/strategic-finance/FeeOptimizationCard';
import { CashFlowPredictor } from '@/components/strategic-finance/CashFlowPredictor';
import { FinancialDashboard } from '@/components/strategic-finance/FinancialDashboard';
import { FeeOptimizationCenter } from '@/components/strategic-finance/FeeOptimizationCenter';
import { PracticeAnalytics } from '@/components/strategic-finance/PracticeAnalytics';
import { ComplianceMonitor } from '@/components/strategic-finance/ComplianceMonitor';
import { MatterService } from '@/services/api/matters.service';
import type { Matter } from '@/types';
import { Button, Card, CardHeader, CardContent } from '../design-system/components';
import { toast } from 'react-hot-toast';
import type { Invoice, InvoiceStatus } from '../types';
// import { AdvancedCashFlowChart } from '../components/strategic-finance/AdvancedCashFlowChart';

export const StrategicFinancePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'cashflow' | 'factoring' | 'optimization' | 'analytics' | 'compliance'>('overview');
  const [loading, setLoading] = useState(true);
  const [financialHealth, setFinancialHealth] = useState<PracticeFinancialHealth | null>(null);
  const [cashFlowPredictions, setCashFlowPredictions] = useState<CashFlowPrediction[]>([]);
  const [factoringOffers, setFactoringOffers] = useState<FactoringOffer[]>([]);
  const [showSuccessFeeCalculator, setShowSuccessFeeCalculator] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [matters, setMatters] = useState<Matter[]>([]);
  const [selectedMatterId, setSelectedMatterId] = useState<string | null>(null);
  const [invoiceData, setInvoiceData] = useState<{
    totalOutstanding: number;
    overdueAmount: number;
    averagePaymentDays: number;
    recentInvoices: Invoice[];
    agingAnalysis: { range: string; amount: number; count: number }[];
  }>({
    totalOutstanding: 0,
    overdueAmount: 0,
    averagePaymentDays: 0,
    recentInvoices: [],
    agingAnalysis: []
  });

  useEffect(() => {
    void loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Always load financial health and invoice data
      const [health, invoices] = await Promise.all([
        StrategicFinanceService.getPracticeFinancialHealth(),
        loadInvoiceData()
      ]);
      
      setFinancialHealth(health);

      // Load tab-specific data
      if (activeTab === 'cashflow') {
        const predictions = await StrategicFinanceService.generateCashFlowPredictions({ monthsAhead: 6 });
        setCashFlowPredictions(predictions);
      } else if (activeTab === 'factoring') {
        const offers = await StrategicFinanceService.getFactoringOffers();
        setFactoringOffers(offers);
      } else if (activeTab === 'optimization') {
        await loadMatters();
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load financial data');
    } finally {
      setLoading(false);
    }
  };

  const loadMatters = async () => {
    try {
      const response = await MatterService.getMatters({ 
        page: 1, 
        pageSize: 50,
        sortBy: 'created_at',
        sortOrder: 'desc'
      });
      setMatters(response.data);
      
      // Auto-select the first active matter if none selected
      if (!selectedMatterId && response.data.length > 0) {
        const activeMatter = response.data.find(m => m.status !== 'closed') || response.data[0];
        setSelectedMatterId(activeMatter.id);
      }
    } catch (error) {
      console.error('Error loading matters:', error);
      toast.error('Failed to load matters');
    }
  };

  const loadInvoiceData = async () => {
    try {
      const response = await InvoiceService.getInvoices({ 
        page: 1, 
        pageSize: 100,
        sortBy: 'created_at',
        sortOrder: 'desc'
      });
      
      const invoices = response.data;
      const now = new Date();
      
      // Calculate outstanding amounts
      const outstandingInvoices = invoices.filter(inv => 
        inv.status !== InvoiceStatus.PAID && inv.status !== InvoiceStatus.WRITTEN_OFF
      );
      
      const totalOutstanding = outstandingInvoices.reduce((sum, inv) => 
        sum + (inv.total_amount - (inv.amount_paid || 0)), 0
      );
      
      const overdueInvoices = invoices.filter(inv => 
        inv.status === InvoiceStatus.OVERDUE
      );
      
      const overdueAmount = overdueInvoices.reduce((sum, inv) => 
        sum + (inv.total_amount - (inv.amount_paid || 0)), 0
      );
      
      // Calculate aging analysis
      const agingRanges = [
        { range: '0-30 days', min: 0, max: 30 },
        { range: '31-60 days', min: 31, max: 60 },
        { range: '61-90 days', min: 61, max: 90 },
        { range: '90+ days', min: 91, max: Infinity }
      ];
      
      const agingAnalysis = agingRanges.map(range => {
        const rangeInvoices = outstandingInvoices.filter(inv => {
          const daysPastDue = Math.floor((now.getTime() - new Date(inv.due_date).getTime()) / (1000 * 60 * 60 * 24));
          return daysPastDue >= range.min && daysPastDue <= range.max;
        });
        
        return {
          range: range.range,
          amount: rangeInvoices.reduce((sum, inv) => sum + (inv.total_amount - (inv.amount_paid || 0)), 0),
          count: rangeInvoices.length
        };
      });
      
      // Calculate average payment days (simplified calculation)
      const paidInvoices = invoices.filter(inv => inv.status === InvoiceStatus.PAID && inv.date_paid);
      const averagePaymentDays = paidInvoices.length > 0 
        ? paidInvoices.reduce((sum, inv) => {
            const daysToPay = Math.floor((new Date(inv.date_paid!).getTime() - new Date(inv.invoice_date).getTime()) / (1000 * 60 * 60 * 24));
            return sum + daysToPay;
          }, 0) / paidInvoices.length
        : 0;
      
      setInvoiceData({
        totalOutstanding,
        overdueAmount,
        averagePaymentDays,
        recentInvoices: invoices.slice(0, 10),
        agingAnalysis
      });
      
    } catch (error) {
      console.error('Error loading invoice data:', error);
      toast.error('Failed to load invoice data');
    }
  };

  const refreshMetrics = async () => {
    setRefreshing(true);
    try {
      await StrategicFinanceService.calculatePracticeMetrics();
      await loadData();
      toast.success('Financial metrics refreshed successfully');
    } catch (error) {
      console.error('Error refreshing metrics:', error);
      toast.error('Failed to refresh metrics');
    } finally {
      setRefreshing(false);
    }
  };

  const handleOptimizeCashFlow = async () => {
    try {
      // Generate cash flow optimization recommendations
      const recommendations = await StrategicFinanceService.generateCashFlowOptimization();
      toast.success('Cash flow optimization recommendations generated');
      // This would open a modal or navigate to detailed recommendations
    } catch (error) {
      console.error('Error generating cash flow optimization:', error);
      toast.error('Failed to generate optimization recommendations');
    }
  };

  const handleInvoiceAging = () => {
    // Navigate to detailed invoice aging report
    toast('Opening detailed invoice aging analysis...', { icon: 'ℹ️' });
    // This would open a modal or navigate to a detailed aging report
  };

  const handleFactorInvoices = async (selectedInvoices: string[]) => {
    try {
      const result = await StrategicFinanceService.submitFactoringRequest(selectedInvoices);
      toast.success(`Factoring request submitted for ${selectedInvoices.length} invoices`);
      await loadData(); // Refresh data
    } catch (error) {
      console.error('Error submitting factoring request:', error);
      toast.error('Failed to submit factoring request');
    }
  };

  const handleFeeOptimization = async (matterId?: string) => {
    try {
      const recommendations = await StrategicFinanceService.generateFeeOptimizationRecommendations(matterId);
      
      if (recommendations.length > 0) {
        toast.success(`Generated ${recommendations.length} fee optimization recommendations`);
        // This would open a modal with recommendations
      } else {
        toast('No optimization opportunities available for this matter', { icon: 'ℹ️' });
      }
    } catch (error) {
      console.error('Error generating fee optimization:', error);
      toast.error('Unable to generate fee optimization recommendations. Please check your connection and try again.');
    }
  };

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-success-600 bg-success-100';
    if (score >= 60) return 'text-warning-600 bg-warning-100';
    return 'text-error-600 bg-error-100';
  };

  const getCashFlowStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-success-600 bg-success-100';
      case 'adequate':
        return 'text-judicial-blue-600 bg-judicial-blue-100';
      case 'tight':
        return 'text-warning-600 bg-warning-100';
      case 'critical':
        return 'text-error-600 bg-error-100';
      default:
        return 'text-neutral-600 bg-neutral-100';
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-neutral-900">Strategic Finance</h1>
              <p className="text-neutral-600 mt-1">
                AI-powered financial optimization and insights
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="primary"
                onClick={() => setShowSuccessFeeCalculator(true)}
                className="bg-mpondo-gold-600 hover:bg-mpondo-gold-700"
              >
                <Calculator className="w-4 h-4 mr-2" />
                Success Fee Calculator
              </Button>
              <Button
                variant="outline"
                onClick={handleOptimizeCashFlow}
              >
                <Zap className="w-4 h-4 mr-2" />
                Optimize Cash Flow
              </Button>
              <Button
                variant="outline"
                onClick={refreshMetrics}
                disabled={refreshing}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <div className="mt-6 flex items-center gap-6 border-b border-neutral-200">
            <button
              onClick={() => setActiveTab('overview')}
              className={`pb-3 px-1 text-sm font-medium transition-colors ${
                activeTab === 'overview'
                  ? 'text-mpondo-gold-600 border-b-2 border-mpondo-gold-600'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Overview
              </div>
            </button>
            <button
              onClick={() => setActiveTab('cashflow')}
              className={`pb-3 px-1 text-sm font-medium transition-colors ${
                activeTab === 'cashflow'
                  ? 'text-mpondo-gold-600 border-b-2 border-mpondo-gold-600'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Cash Flow Forecast
              </div>
            </button>
            <button
              onClick={() => setActiveTab('factoring')}
              className={`pb-3 px-1 text-sm font-medium transition-colors ${
                activeTab === 'factoring'
                  ? 'text-mpondo-gold-600 border-b-2 border-mpondo-gold-600'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Invoice Factoring
              </div>
            </button>
            <button
              onClick={() => setActiveTab('optimization')}
              className={`pb-3 px-1 text-sm font-medium transition-colors ${
                activeTab === 'optimization'
                  ? 'text-mpondo-gold-600 border-b-2 border-mpondo-gold-600'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Fee Optimization
              </div>
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`pb-3 px-1 text-sm font-medium transition-colors ${
                activeTab === 'analytics'
                  ? 'text-mpondo-gold-600 border-b-2 border-mpondo-gold-600'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Practice Analytics
              </div>
            </button>
            <button
              onClick={() => setActiveTab('compliance')}
              className={`pb-3 px-1 text-sm font-medium transition-colors ${
                activeTab === 'compliance'
                  ? 'text-mpondo-gold-600 border-b-2 border-mpondo-gold-600'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Compliance
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-mpondo-gold-600"></div>
          </div>
        ) : (
          <>
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Financial Health Score */}
                {financialHealth && (
                  <div className="bg-white rounded-lg border border-neutral-200 p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xl font-semibold text-neutral-900">Financial Health Score</h2>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getHealthColor(financialHealth.overallHealthScore)}`}>
                        {financialHealth.overallHealthScore}/100
                      </span>
                    </div>
                    <FinancialHealthCard health={financialHealth} />
                  </div>
                )}

                {/* Key Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white rounded-lg border border-neutral-200 p-6">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-mpondo-gold-100 rounded-lg">
                        <Target className="w-5 h-5 text-mpondo-gold-600" />
                      </div>
                      <span className="text-sm text-neutral-600">Collection Rate (30d)</span>
                    </div>
                    <p className="text-2xl font-bold text-neutral-900">
                      {financialHealth ? `${(financialHealth.collectionRate30d! * 100).toFixed(0)}%` : 'N/A'}
                    </p>
                  </div>

                  <div className="bg-white rounded-lg border border-neutral-200 p-6">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-judicial-blue-100 rounded-lg">
                        <Calendar className="w-5 h-5 text-judicial-blue-600" />
                      </div>
                      <span className="text-sm text-neutral-600">Avg Collection Days</span>
                    </div>
                    <p className="text-2xl font-bold text-neutral-900">
                      {financialHealth?.averageCollectionDays?.toFixed(0) || 'N/A'} days
                    </p>
                  </div>

                  <div className="bg-white rounded-lg border border-neutral-200 p-6">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-success-100 rounded-lg">
                        <TrendingUp className="w-5 h-5 text-success-600" />
                      </div>
                      <span className="text-sm text-neutral-600">Realization Rate</span>
                    </div>
                    <p className="text-2xl font-bold text-neutral-900">
                      {financialHealth ? `${(financialHealth.realizationRate! * 100).toFixed(0)}%` : 'N/A'}
                    </p>
                  </div>

                  <div className="bg-white rounded-lg border border-neutral-200 p-6">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-neutral-100 rounded-lg">
                        <BarChart3 className="w-5 h-5 text-neutral-600" />
                      </div>
                      <span className="text-sm text-neutral-600">Health Trend</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {financialHealth?.healthTrend === 'improving' && (
                        <>
                          <ArrowUpRight className="w-5 h-5 text-success-600" />
                          <span className="text-lg font-semibold text-success-600">Improving</span>
                        </>
                      )}
                      {financialHealth?.healthTrend === 'stable' && (
                        <>
                          <span className="text-lg font-semibold text-neutral-600">Stable</span>
                        </>
                      )}
                      {financialHealth?.healthTrend === 'declining' && (
                        <>
                          <ArrowDownRight className="w-5 h-5 text-error-600" />
                          <span className="text-lg font-semibold text-error-600">Declining</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Invoice Aging Analysis */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <h3 className="text-lg font-semibold text-neutral-900">Invoice Aging Analysis</h3>
                    <Button variant="outline" size="sm" onClick={handleInvoiceAging}>
                      <BarChart3 className="w-4 h-4 mr-2" />
                      View Details
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {invoiceData.agingAnalysis.map((range, index) => (
                        <div key={range.range} className="text-center">
                          <div className={`p-4 rounded-lg ${
                            index === 0 ? 'bg-status-success-50' :
                            index === 1 ? 'bg-status-warning-50' :
                            index === 2 ? 'bg-status-error-50' :
                            'bg-status-error-100'
                          }`}>
                            <p className="text-sm font-medium text-neutral-600">{range.range}</p>
                            <p className="text-xl font-bold text-neutral-900">
                              R{range.amount.toLocaleString('en-ZA')}
                            </p>
                            <p className="text-xs text-neutral-500">{range.count} invoices</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-neutral-50 rounded-lg">
                        <p className="text-sm text-neutral-600">Total Outstanding</p>
                        <p className="text-2xl font-bold text-neutral-900">
                          R{invoiceData.totalOutstanding.toLocaleString('en-ZA')}
                        </p>
                      </div>
                      <div className="text-center p-4 bg-status-error-50 rounded-lg">
                        <p className="text-sm text-neutral-600">Overdue Amount</p>
                        <p className="text-2xl font-bold text-status-error-600">
                          R{invoiceData.overdueAmount.toLocaleString('en-ZA')}
                        </p>
                      </div>
                      <div className="text-center p-4 bg-judicial-blue-50 rounded-lg">
                        <p className="text-sm text-neutral-600">Avg Payment Days</p>
                        <p className="text-2xl font-bold text-judicial-blue-600">
                          {invoiceData.averagePaymentDays.toFixed(0)} days
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Alerts and Opportunities */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {financialHealth?.riskAlerts && financialHealth.riskAlerts.length > 0 && (
                    <div className="bg-error-50 border border-error-200 rounded-lg p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <AlertTriangle className="w-5 h-5 text-error-600" />
                        <h3 className="text-lg font-semibold text-error-900">Risk Alerts</h3>
                      </div>
                      <ul className="space-y-2">
                        {financialHealth.riskAlerts.map((alert, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-error-600 mt-1">•</span>
                            <span className="text-sm text-error-700">{alert}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {financialHealth?.opportunities && financialHealth.opportunities.length > 0 && (
                    <div className="bg-success-50 border border-success-200 rounded-lg p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <Target className="w-5 h-5 text-success-600" />
                        <h3 className="text-lg font-semibold text-success-900">Opportunities</h3>
                      </div>
                      <ul className="space-y-2">
                        {financialHealth.opportunities.map((opportunity, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-success-600 mt-1">•</span>
                            <span className="text-sm text-success-700">{opportunity}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'cashflow' && (
              <CashFlowPredictor />
            )}

            {activeTab === 'factoring' && (
              <div className="space-y-6">
                {/* Factoring Overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-6 text-center">
                      <div className="text-mpondo-gold-500 mb-2">
                        <DollarSign className="w-8 h-8 mx-auto" />
                      </div>
                      <h3 className="text-2xl font-bold text-neutral-900">
                        R{invoiceData.totalOutstanding.toLocaleString('en-ZA')}
                      </h3>
                      <p className="text-sm text-neutral-600">Available for Factoring</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-6 text-center">
                      <div className="text-judicial-blue-500 mb-2">
                        <Calendar className="w-8 h-8 mx-auto" />
                      </div>
                      <h3 className="text-2xl font-bold text-neutral-900">
                        {invoiceData.recentInvoices.filter(inv => inv.status !== InvoiceStatus.PAID).length}
                      </h3>
                      <p className="text-sm text-neutral-600">Eligible Invoices</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-6 text-center">
                      <div className="text-status-success-500 mb-2">
                        <TrendingUp className="w-8 h-8 mx-auto" />
                      </div>
                      <h3 className="text-2xl font-bold text-neutral-900">
                        85-95%
                      </h3>
                      <p className="text-sm text-neutral-600">Typical Advance Rate</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Quick Factor Button */}
                <div className="flex justify-center">
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={() => {
                      const eligibleInvoices = invoiceData.recentInvoices
                        .filter(inv => inv.status !== InvoiceStatus.PAID)
                        .map(inv => inv.id);
                      handleFactorInvoices(eligibleInvoices);
                    }}
                    disabled={invoiceData.recentInvoices.filter(inv => inv.status !== InvoiceStatus.PAID).length === 0}
                    className="bg-mpondo-gold-600 hover:bg-mpondo-gold-700"
                  >
                    <DollarSign className="w-5 h-5 mr-2" />
                    Factor Outstanding Invoices
                  </Button>
                </div>

                {/* Factoring Marketplace */}
                <FactoringMarketplace offers={factoringOffers} />
              </div>
            )}

            {activeTab === 'optimization' && (
              <div className="space-y-6">
                {/* Matter Selection */}
                <Card>
                  <CardHeader>
                    <h3 className="text-lg font-semibold text-neutral-900">Select Matter for Optimization</h3>
                    <p className="text-sm text-neutral-600">Choose a matter to generate AI-powered fee optimization recommendations</p>
                  </CardHeader>
                  <CardContent>
                    <div className="max-w-md">
                      <label htmlFor="matter-select" className="block text-sm font-medium text-neutral-700 mb-2">
                        Matter
                      </label>
                      <select
                        id="matter-select"
                        value={selectedMatterId || ''}
                        onChange={(e) => setSelectedMatterId(e.target.value || null)}
                        className="w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-mpondo-gold-500 focus:border-mpondo-gold-500"
                      >
                        <option value="">Select a matter...</option>
                        {matters.map((matter) => (
                          <option key={matter.id} value={matter.id}>
                            {matter.title} - {matter.client_name} ({matter.status})
                          </option>
                        ))}
                      </select>
                    </div>
                  </CardContent>
                </Card>

                {/* Optimization Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Card hoverable className="cursor-pointer" onClick={() => handleFeeOptimization(selectedMatterId)}>
                    <CardContent className="p-6 text-center">
                      <div className="text-mpondo-gold-500 mb-4">
                        <Zap className="w-12 h-12 mx-auto" />
                      </div>
                      <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                        Optimize Fee Structure
                      </h3>
                      <p className="text-sm text-neutral-600 mb-4">
                        Get AI-powered recommendations to optimize your fee structure based on market data and performance.
                      </p>
                      <Button variant="outline" size="sm" disabled={!selectedMatterId}>
                        Generate Recommendations
                      </Button>
                    </CardContent>
                  </Card>

                  <Card hoverable className="cursor-pointer" onClick={handleOptimizeCashFlow}>
                    <CardContent className="p-6 text-center">
                      <div className="text-judicial-blue-500 mb-4">
                        <TrendingUp className="w-12 h-12 mx-auto" />
                      </div>
                      <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                        Cash Flow Optimization
                      </h3>
                      <p className="text-sm text-neutral-600 mb-4">
                        Optimize payment terms and collection strategies to improve cash flow.
                      </p>
                      <Button variant="outline" size="sm">
                        Optimize Cash Flow
                      </Button>
                    </CardContent>
                  </Card>

                  <Card hoverable className="cursor-pointer" onClick={() => setShowSuccessFeeCalculator(true)}>
                    <CardContent className="p-6 text-center">
                      <div className="text-status-success-500 mb-4">
                        <Calculator className="w-12 h-12 mx-auto" />
                      </div>
                      <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                        Success Fee Analysis
                      </h3>
                      <p className="text-sm text-neutral-600 mb-4">
                        Calculate optimal success fee structures for performance-based pricing.
                      </p>
                      <Button variant="outline" size="sm">
                        Calculate Fees
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                {/* Fee Optimization Component */}
                {selectedMatterId && (
                  <FeeOptimizationCard matterId={selectedMatterId} />
                )}
                
                {/* Fee Optimization Center */}
                <FeeOptimizationCenter />
              </div>
            )}

            {activeTab === 'analytics' && (
              <div className="space-y-6">
                <FinancialDashboard />
                <PracticeAnalytics />
              </div>
            )}

            {activeTab === 'compliance' && (
              <div className="space-y-6">
                <ComplianceMonitor />
              </div>
            )}
          </>
        )}
      </div>

      {/* Success Fee Calculator Modal */}
      {showSuccessFeeCalculator && (
        <SuccessFeeCalculator onClose={() => setShowSuccessFeeCalculator(false)} />
      )}
    </div>
  );
};
