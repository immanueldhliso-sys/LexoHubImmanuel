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
  RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';
import { 
  StrategicFinanceService, 
  type CashFlowPrediction, 
  type PracticeFinancialHealth,
  type FactoringOffer
} from '../services/api/strategic-finance.service';
import { CashFlowChart } from '@/components/strategic-finance/CashFlowChart';
import { FinancialHealthCard } from '@/components/strategic-finance/FinancialHealthCard';
import { FactoringMarketplace } from '@/components/strategic-finance/FactoringMarketplace';
import { SuccessFeeCalculator } from '@/components/strategic-finance/SuccessFeeCalculator';
import { FeeOptimizationCard } from '@/components/strategic-finance/FeeOptimizationCard';
// import { AdvancedCashFlowChart } from '../components/strategic-finance/AdvancedCashFlowChart';

export const StrategicFinancePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'cashflow' | 'factoring' | 'optimization' | 'success-fees'>('overview');
  const [loading, setLoading] = useState(true);
  const [financialHealth, setFinancialHealth] = useState<PracticeFinancialHealth | null>(null);
  const [cashFlowPredictions, setCashFlowPredictions] = useState<CashFlowPrediction[]>([]);
  const [factoringOffers, setFactoringOffers] = useState<FactoringOffer[]>([]);
  const [showSuccessFeeCalculator, setShowSuccessFeeCalculator] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    void loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Always load financial health
      const health = await StrategicFinanceService.getPracticeFinancialHealth();
      setFinancialHealth(health);

      // Load tab-specific data
      if (activeTab === 'cashflow') {
        const predictions = await StrategicFinanceService.generateCashFlowPredictions({ monthsAhead: 6 });
        setCashFlowPredictions(predictions);
      } else if (activeTab === 'factoring') {
        const offers = await StrategicFinanceService.getFactoringOffers();
        setFactoringOffers(offers);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshMetrics = async () => {
    setRefreshing(true);
    try {
      await StrategicFinanceService.calculatePracticeMetrics();
      await loadData();
    } catch (error) {
      console.error('Error refreshing metrics:', error);
    } finally {
      setRefreshing(false);
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
              <button
                onClick={() => setShowSuccessFeeCalculator(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-mpondo-gold-600 text-white rounded-lg hover:bg-mpondo-gold-700 transition-colors"
              >
                <Calculator className="w-4 h-4" />
                Success Fee Calculator
              </button>
              <button
                onClick={refreshMetrics}
                disabled={refreshing}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
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
              <div className="space-y-6">
                {/* Cash Flow Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {cashFlowPredictions.slice(0, 3).map((prediction) => (
                    <div key={prediction.id} className="bg-white rounded-lg border border-neutral-200 p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-medium text-neutral-900">
                          {format(new Date(prediction.periodStart), 'MMMM yyyy')}
                        </h3>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getCashFlowStatusColor(prediction.cashFlowStatus)}`}>
                          {prediction.cashFlowStatus}
                        </span>
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-neutral-600">Expected In:</span>
                          <span className="font-medium text-success-600">
                            +R{prediction.expectedCollections.toLocaleString('en-ZA', { minimumFractionDigits: 0 })}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-neutral-600">Expected Out:</span>
                          <span className="font-medium text-error-600">
                            -R{prediction.expectedExpenses.toLocaleString('en-ZA', { minimumFractionDigits: 0 })}
                          </span>
                        </div>
                        <div className="pt-3 border-t border-neutral-200">
                          <div className="flex justify-between">
                            <span className="font-medium text-neutral-700">Net Cash Flow:</span>
                            <span className={`font-bold ${prediction.expectedNetCashFlow >= 0 ? 'text-success-600' : 'text-error-600'}`}>
                              R{prediction.expectedNetCashFlow.toLocaleString('en-ZA', { minimumFractionDigits: 0 })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Cash Flow Chart */}
                <CashFlowChart predictions={cashFlowPredictions} />

                {/* Seasonal Insights */}
                <div className="bg-white rounded-lg border border-neutral-200 p-6">
                  <h3 className="text-lg font-semibold text-neutral-900 mb-4">Seasonal Insights</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {cashFlowPredictions.filter(p => p.seasonalAdjustment && p.seasonalAdjustment !== 0).map(prediction => (
                      <div key={prediction.id} className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
                        <div>
                          <p className="font-medium text-neutral-900">
                            {format(new Date(prediction.periodStart), 'MMMM')}
                          </p>
                          <p className="text-sm text-neutral-600">
                            Historical adjustment: {prediction.seasonalAdjustment! > 0 ? '+' : ''}{prediction.seasonalAdjustment!.toFixed(0)}%
                          </p>
                        </div>
                        {prediction.seasonalAdjustment! > 0 ? (
                          <ArrowUpRight className="w-5 h-5 text-success-600" />
                        ) : (
                          <ArrowDownRight className="w-5 h-5 text-error-600" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'factoring' && (
              <FactoringMarketplace offers={factoringOffers} />
            )}

            {activeTab === 'optimization' && (
              <FeeOptimizationCard />
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
