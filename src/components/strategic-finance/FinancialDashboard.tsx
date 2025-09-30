import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  AlertTriangle,
  Target,
  Calendar,
  BarChart3,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { Card, CardHeader, CardContent, Button } from '../../design-system/components';
import { StrategicFinanceService, type PracticeFinancialHealth } from '../../services/api/strategic-finance.service';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';

interface FinancialMetric {
  label: string;
  value: string;
  change: number;
  changeLabel: string;
  trend: 'up' | 'down' | 'neutral';
  icon: React.ReactNode;
  color: string;
}

interface FinancialDashboardProps {
  onRefresh?: () => void;
  className?: string;
}

export const FinancialDashboard: React.FC<FinancialDashboardProps> = ({ 
  onRefresh, 
  className = '' 
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [financialHealth, setFinancialHealth] = useState<PracticeFinancialHealth | null>(null);
  const [metrics, setMetrics] = useState<FinancialMetric[]>([]);

  const loadFinancialData = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      
      // Get current financial health
      const health = await StrategicFinanceService.getPracticeFinancialHealth(user.id);
      setFinancialHealth(health);

      // Calculate metrics
      const currentMonth = startOfMonth(new Date());
      const previousMonth = startOfMonth(subMonths(new Date(), 1));
      
      const calculatedMetrics: FinancialMetric[] = [
        {
          label: 'Monthly Revenue',
          value: `R ${health.monthlyRevenue.toLocaleString()}`,
          change: health.revenueGrowthRate || 0,
          changeLabel: `${health.revenueGrowthRate > 0 ? '+' : ''}${health.revenueGrowthRate?.toFixed(1)}%`,
          trend: health.revenueGrowthRate > 0 ? 'up' : health.revenueGrowthRate < 0 ? 'down' : 'neutral',
          icon: <DollarSign className="w-5 h-5" />,
          color: 'text-status-success-600'
        },
        {
          label: 'Outstanding Invoices',
          value: `R ${health.outstandingInvoices.toLocaleString()}`,
          change: health.collectionEfficiency || 0,
          changeLabel: `${health.collectionEfficiency?.toFixed(1)}% efficiency`,
          trend: health.collectionEfficiency > 85 ? 'up' : health.collectionEfficiency < 70 ? 'down' : 'neutral',
          icon: <BarChart3 className="w-5 h-5" />,
          color: 'text-judicial-blue-600'
        },
        {
          label: 'Cash Flow',
          value: `R ${health.projectedCashFlow.toLocaleString()}`,
          change: health.cashFlowTrend || 0,
          changeLabel: `${health.cashFlowTrend > 0 ? '+' : ''}${health.cashFlowTrend?.toFixed(1)}%`,
          trend: health.cashFlowTrend > 0 ? 'up' : health.cashFlowTrend < 0 ? 'down' : 'neutral',
          icon: <TrendingUp className="w-5 h-5" />,
          color: 'text-status-info-600'
        },
        {
          label: 'Profit Margin',
          value: `${health.profitMargin?.toFixed(1)}%`,
          change: health.profitMarginTrend || 0,
          changeLabel: `${health.profitMarginTrend > 0 ? '+' : ''}${health.profitMarginTrend?.toFixed(1)}%`,
          trend: health.profitMarginTrend > 0 ? 'up' : health.profitMarginTrend < 0 ? 'down' : 'neutral',
          icon: <Target className="w-5 h-5" />,
          color: 'text-status-warning-600'
        }
      ];

      setMetrics(calculatedMetrics);
    } catch (error) {
      console.error('Error loading financial data:', error);
      toast.error('Failed to load financial dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadFinancialData();
    setRefreshing(false);
    onRefresh?.();
  };

  useEffect(() => {
    loadFinancialData();
  }, [user?.id]);

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-neutral-900">Financial Dashboard</h2>
          <div className="animate-spin">
            <RefreshCw className="w-5 h-5 text-neutral-400" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-neutral-200 rounded mb-4"></div>
                <div className="h-8 bg-neutral-200 rounded mb-2"></div>
                <div className="h-3 bg-neutral-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return 'text-status-success-600';
    if (score >= 60) return 'text-status-warning-600';
    return 'text-status-error-600';
  };

  const getHealthScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Needs Attention';
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900">Financial Dashboard</h2>
          <p className="text-neutral-600 mt-1">
            Real-time insights into your practice's financial performance
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Financial Health Score */}
      {financialHealth && (
        <Card className="bg-gradient-to-r from-judicial-blue-50 to-judicial-blue-100 border-judicial-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                  Practice Financial Health Score
                </h3>
                <div className="flex items-center gap-4">
                  <div className={`text-4xl font-bold ${getHealthScoreColor(financialHealth.healthScore)}`}>
                    {financialHealth.healthScore}/100
                  </div>
                  <div>
                    <div className={`text-lg font-medium ${getHealthScoreColor(financialHealth.healthScore)}`}>
                      {getHealthScoreLabel(financialHealth.healthScore)}
                    </div>
                    <div className="text-sm text-neutral-600">
                      Last updated: {format(new Date(financialHealth.calculationDate), 'MMM dd, yyyy')}
                    </div>
                  </div>
                </div>
              </div>
              <div className="text-judicial-blue-500">
                <BarChart3 className="w-16 h-16" />
              </div>
            </div>
            
            {financialHealth.recommendations && financialHealth.recommendations.length > 0 && (
              <div className="mt-4 p-4 bg-white rounded-lg border border-judicial-blue-200">
                <h4 className="font-medium text-neutral-900 mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-status-warning-500" />
                  Key Recommendations
                </h4>
                <ul className="space-y-1">
                  {financialHealth.recommendations.slice(0, 3).map((rec, index) => (
                    <li key={index} className="text-sm text-neutral-700 flex items-start gap-2">
                      <span className="text-judicial-blue-500 mt-1">•</span>
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => (
          <Card key={index} hoverable>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={metric.color}>
                  {metric.icon}
                </div>
                <div className="flex items-center gap-1">
                  {metric.trend === 'up' && (
                    <ArrowUpRight className="w-4 h-4 text-status-success-500" />
                  )}
                  {metric.trend === 'down' && (
                    <ArrowDownRight className="w-4 h-4 text-status-error-500" />
                  )}
                  <span className={`text-sm font-medium ${
                    metric.trend === 'up' ? 'text-status-success-600' :
                    metric.trend === 'down' ? 'text-status-error-600' :
                    'text-neutral-500'
                  }`}>
                    {metric.changeLabel}
                  </span>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-neutral-600 mb-1">
                  {metric.label}
                </h3>
                <div className="text-2xl font-bold text-neutral-900">
                  {metric.value}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-neutral-900">Quick Actions</h3>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="flex items-center gap-2 justify-start">
              <Calendar className="w-4 h-4" />
              Schedule Financial Review
            </Button>
            <Button variant="outline" className="flex items-center gap-2 justify-start">
              <TrendingUp className="w-4 h-4" />
              Generate Cash Flow Report
            </Button>
            <Button variant="outline" className="flex items-center gap-2 justify-start">
              <Target className="w-4 h-4" />
              Set Financial Goals
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};