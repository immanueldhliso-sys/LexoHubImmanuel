/**
 * Practice Health Dashboard Component
 * 
 * Displays comprehensive practice health metrics including WIP aging,
 * time to first invoice, limitation alerts, and other key indicators.
 * Integrates with the backend health metrics functions.
 */

import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  Clock, 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  AlertCircle,
  CheckCircle,
  Activity,
  BarChart3,
  Target,
  Zap
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '../../design-system/components';
import { toast } from 'react-hot-toast';
import { supabase } from '@/lib/supabase';

interface PracticeHealthMetrics {
  overall_health_score: number;
  health_trend: 'improving' | 'stable' | 'declining';
  wip_aging_0_30: number;
  wip_aging_31_60: number;
  wip_aging_61_90: number;
  wip_aging_90_plus: number;
  high_wip_inactive_matters: number;
  avg_time_to_first_invoice_days: number;
  matters_with_prescription_warnings: number;
  total_wip_value: number;
  total_active_matters: number;
  billing_efficiency_score: number;
  risk_score: number;
}

interface WIPAgingData {
  range: string;
  count: number;
  value: number;
  percentage: number;
  color: string;
}

export const PracticeHealthDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<PracticeHealthMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPracticeHealthMetrics();
  }, []);

  const loadPracticeHealthMetrics = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const { data, error: rpcError } = await supabase
        .rpc('get_practice_health_metrics');
      
      if (rpcError) throw rpcError;
      
      if (data && data.length > 0) {
        setMetrics(data[0] as PracticeHealthMetrics);
      } else {
        setMetrics({
          overall_health_score: 0,
          health_trend: 'stable',
          wip_aging_0_30: 0,
          wip_aging_31_60: 0,
          wip_aging_61_90: 0,
          wip_aging_90_plus: 0,
          high_wip_inactive_matters: 0,
          avg_time_to_first_invoice_days: 0,
          matters_with_prescription_warnings: 0,
          total_wip_value: 0,
          total_active_matters: 0,
          billing_efficiency_score: 0,
          risk_score: 0
        });
      }
    } catch (err) {
      console.error('Error loading practice health metrics:', err);
      setError('Failed to load practice health metrics');
      toast.error('Failed to load practice health data');
    } finally {
      setIsLoading(false);
    }
  };

  const getHealthScoreColor = (score: number): string => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getHealthScoreIcon = (score: number) => {
    if (score >= 80) return <CheckCircle className="h-5 w-5 text-green-600" />;
    if (score >= 60) return <AlertCircle className="h-5 w-5 text-yellow-600" />;
    return <AlertTriangle className="h-5 w-5 text-red-600" />;
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'declining':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <Activity className="h-4 w-4 text-neutral-600" />;
    }
  };

  const getWIPAgingData = (): WIPAgingData[] => {
    if (!metrics) return [];
    
    const total = metrics.wip_aging_0_30 + metrics.wip_aging_31_60 + 
                  metrics.wip_aging_61_90 + metrics.wip_aging_90_plus;
    
    return [
      {
        range: '0-30 days',
        count: metrics.wip_aging_0_30,
        value: metrics.total_wip_value * 0.4, // Mock distribution
        percentage: total > 0 ? (metrics.wip_aging_0_30 / total) * 100 : 0,
        color: 'bg-green-500'
      },
      {
        range: '31-60 days',
        count: metrics.wip_aging_31_60,
        value: metrics.total_wip_value * 0.3,
        percentage: total > 0 ? (metrics.wip_aging_31_60 / total) * 100 : 0,
        color: 'bg-yellow-500'
      },
      {
        range: '61-90 days',
        count: metrics.wip_aging_61_90,
        value: metrics.total_wip_value * 0.2,
        percentage: total > 0 ? (metrics.wip_aging_61_90 / total) * 100 : 0,
        color: 'bg-orange-500'
      },
      {
        range: '90+ days',
        count: metrics.wip_aging_90_plus,
        value: metrics.total_wip_value * 0.1,
        percentage: total > 0 ? (metrics.wip_aging_90_plus / total) * 100 : 0,
        color: 'bg-red-500'
      }
    ];
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-neutral-900">Practice Health Dashboard</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-neutral-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-neutral-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-neutral-900">Practice Health Dashboard</h2>
        </div>
        <Card>
          <CardContent className="p-6 text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">Unable to Load Health Data</h3>
            <p className="text-neutral-600 mb-4">{error}</p>
            <button
              onClick={loadPracticeHealthMetrics}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Retry
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const wipAgingData = getWIPAgingData();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900">Practice Health Dashboard</h2>
          <p className="text-neutral-600">Monitor your practice's financial health and operational efficiency</p>
        </div>
        <button
          onClick={loadPracticeHealthMetrics}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <Activity className="h-4 w-4" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Overall Health Score */}
      <Card className="border-l-4 border-l-blue-500">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {getHealthScoreIcon(metrics.overall_health_score)}
              <div>
                <h3 className="text-lg font-semibold text-neutral-900">Overall Practice Health</h3>
                <p className="text-sm text-neutral-600">Comprehensive health assessment</p>
              </div>
            </div>
            <div className="text-right">
              <div className={`text-3xl font-bold ${getHealthScoreColor(metrics.overall_health_score)}`}>
                {metrics.overall_health_score}%
              </div>
              <div className="flex items-center space-x-1 text-sm">
                {getTrendIcon(metrics.health_trend)}
                <span className="text-neutral-600 capitalize">{metrics.health_trend}</span>
              </div>
            </div>
          </div>
          <div className="mt-4">
            <div className="w-full bg-neutral-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full ${metrics.overall_health_score >= 80 ? 'bg-green-500' : metrics.overall_health_score >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                style={{ width: `${metrics.overall_health_score}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* High WIP Inactive Matters */}
        <Card className={metrics.high_wip_inactive_matters > 0 ? 'border-l-4 border-l-amber-500' : ''}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                <div>
                  <p className="text-sm font-medium text-neutral-600">High WIP Inactive</p>
                  <p className="text-2xl font-bold text-neutral-900">{metrics.high_wip_inactive_matters}</p>
                </div>
              </div>
              {metrics.high_wip_inactive_matters > 0 && (
                <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">Action Required</span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Time to First Invoice */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-neutral-600">Avg. Time to First Invoice</p>
                <p className="text-2xl font-bold text-neutral-900">{metrics.avg_time_to_first_invoice_days} days</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Prescription Warnings */}
        <Card className={metrics.matters_with_prescription_warnings > 0 ? 'border-l-4 border-l-red-500' : ''}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-red-600" />
                <div>
                  <p className="text-sm font-medium text-neutral-600">Prescription Warnings</p>
                  <p className="text-2xl font-bold text-neutral-900">{metrics.matters_with_prescription_warnings}</p>
                </div>
              </div>
              {metrics.matters_with_prescription_warnings > 0 && (
                <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">Urgent</span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Billing Efficiency */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-neutral-600">Billing Efficiency</p>
                <p className="text-2xl font-bold text-neutral-900">{metrics.billing_efficiency_score}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* WIP Aging Analysis */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-neutral-900 flex items-center space-x-2">
            <BarChart3 className="h-5 w-5" />
            <span>WIP Aging Analysis</span>
          </h3>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {wipAgingData.map((item, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-neutral-700">{item.range}</span>
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-neutral-600">{item.count} matters</span>
                    <span className="text-sm font-medium text-neutral-900">
                      R {item.value.toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="flex-1 bg-neutral-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${item.color}`}
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                  <span className="text-xs text-neutral-500 w-12 text-right">
                    {item.percentage.toFixed(1)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-6 pt-4 border-t border-neutral-200">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-neutral-600">Total WIP Value</p>
                <p className="text-lg font-semibold text-neutral-900">
                  R {metrics.total_wip_value.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-neutral-600">Active Matters</p>
                <p className="text-lg font-semibold text-neutral-900">
                  {metrics.total_active_matters}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Items */}
      {(metrics.high_wip_inactive_matters > 0 || metrics.matters_with_prescription_warnings > 0) && (
        <Card className="border-l-4 border-l-amber-500">
          <CardHeader>
            <h3 className="text-lg font-semibold text-amber-700 flex items-center space-x-2">
              <Zap className="h-5 w-5" />
              <span>Recommended Actions</span>
            </h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {metrics.high_wip_inactive_matters > 0 && (
                <div className="flex items-start space-x-3 p-3 bg-amber-50 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-amber-800">
                      Review {metrics.high_wip_inactive_matters} high WIP inactive matters
                    </p>
                    <p className="text-sm text-amber-700">
                      These matters have significant WIP but no recent activity. Consider billing or following up.
                    </p>
                  </div>
                </div>
              )}
              
              {metrics.matters_with_prescription_warnings > 0 && (
                <div className="flex items-start space-x-3 p-3 bg-red-50 rounded-lg">
                  <Calendar className="h-5 w-5 text-red-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-red-800">
                      {metrics.matters_with_prescription_warnings} matters approaching prescription
                    </p>
                    <p className="text-sm text-red-700">
                      Urgent action required to avoid prescription. Review and take necessary steps immediately.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};