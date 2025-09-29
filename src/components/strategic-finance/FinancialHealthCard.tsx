import React from 'react';
import { 
  TrendingUp, 
  Clock, 
  Target, 
  DollarSign,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import type { PracticeFinancialHealth } from '../../services/api/strategic-finance.service';

interface FinancialHealthCardProps {
  health: PracticeFinancialHealth;
}

export const FinancialHealthCard: React.FC<FinancialHealthCardProps> = ({ health }) => {
  const getMetricStatus = (value: number, thresholds: { good: number; warning: number }) => {
    if (value >= thresholds.good) return { color: 'text-success-600', bg: 'bg-success-100', icon: CheckCircle };
    if (value >= thresholds.warning) return { color: 'text-warning-600', bg: 'bg-warning-100', icon: AlertCircle };
    return { color: 'text-error-600', bg: 'bg-error-100', icon: AlertCircle };
  };

  const metrics = [
    {
      label: 'Cash Runway',
      value: health.cashRunwayDays ? `${health.cashRunwayDays} days` : 'N/A',
      icon: Clock,
      status: health.cashRunwayDays 
        ? getMetricStatus(health.cashRunwayDays, { good: 90, warning: 60 })
        : null
    },
    {
      label: '30-Day Collection Rate',
      value: health.collectionRate30d ? `${(health.collectionRate30d * 100).toFixed(0)}%` : 'N/A',
      icon: Target,
      status: health.collectionRate30d
        ? getMetricStatus(health.collectionRate30d * 100, { good: 80, warning: 60 })
        : null
    },
    {
      label: 'Average Collection Days',
      value: health.averageCollectionDays ? `${health.averageCollectionDays.toFixed(0)} days` : 'N/A',
      icon: Clock,
      status: health.averageCollectionDays
        ? getMetricStatus(100 - health.averageCollectionDays, { good: 55, warning: 40 }) // Inverted for days
        : null
    },
    {
      label: 'Monthly Recurring Revenue',
      value: health.monthlyRecurringRevenue 
        ? `R${health.monthlyRecurringRevenue.toLocaleString('en-ZA', { minimumFractionDigits: 0 })}`
        : 'N/A',
      icon: DollarSign,
      status: null
    },
    {
      label: 'Realization Rate',
      value: health.realizationRate ? `${(health.realizationRate * 100).toFixed(0)}%` : 'N/A',
      icon: TrendingUp,
      status: health.realizationRate
        ? getMetricStatus(health.realizationRate * 100, { good: 90, warning: 75 })
        : null
    },
    {
      label: 'Write-off Rate',
      value: health.writeOffRate ? `${(health.writeOffRate * 100).toFixed(1)}%` : 'N/A',
      icon: AlertCircle,
      status: health.writeOffRate
        ? getMetricStatus(100 - (health.writeOffRate * 100), { good: 95, warning: 90 }) // Inverted for write-offs
        : null
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {metrics.map((metric, index) => {
        const Icon = metric.icon;
        const StatusIcon = metric.status?.icon;
        
        return (
          <div key={index} className="bg-neutral-50 rounded-lg p-4">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <Icon className="w-4 h-4 text-neutral-500" />
                <span className="text-sm text-neutral-600">{metric.label}</span>
              </div>
              {StatusIcon && (
                <StatusIcon className={`w-4 h-4 ${metric.status!.color}`} />
              )}
            </div>
            <p className={`text-xl font-semibold ${metric.status?.color || 'text-neutral-900'}`}>
              {metric.value}
            </p>
          </div>
        );
      })}
    </div>
  );
};