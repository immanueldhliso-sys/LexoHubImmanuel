import React, { useState, useEffect } from 'react';
import { Gavel, TrendingUp, TrendingDown, Calendar, Clock, Users, Target } from 'lucide-react';
import { Card, CardHeader, CardContent, Button } from '../../design-system/components';
import type { Judge, JudgeAnalytics } from '../../types';

interface JudgeAnalyticsCardProps {
  judge: Judge;
  analytics: JudgeAnalytics | null;
  onLoadAnalytics: (judgeId: string, periodMonths: number) => Promise<void>;
}

export const JudgeAnalyticsCard: React.FC<JudgeAnalyticsCardProps> = ({ 
  judge, 
  analytics, 
  onLoadAnalytics 
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState(6);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAnalytics();
  }, [judge.id, selectedPeriod]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      await onLoadAnalytics(judge.id, selectedPeriod);
    } finally {
      setLoading(false);
    }
  };

  const getPerformanceColor = (score: number) => {
    if (score >= 8) return 'text-success-600';
    if (score >= 6) return 'text-warning-600';
    return 'text-error-600';
  };

  const getPostponementColor = (rate: number) => {
    if (rate <= 10) return 'text-success-600';
    if (rate <= 20) return 'text-warning-600';
    return 'text-error-600';
  };

  return (
    <div className="space-y-6">
      {/* Judge Profile */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-judicial-blue-100 rounded-full flex items-center justify-center">
                <Gavel className="w-6 h-6 text-judicial-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-neutral-900">{judge.name}</h3>
                <p className="text-neutral-600">{judge.title}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(Number(e.target.value))}
                className="px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-mpondo-gold-500"
              >
                <option value={3}>Last 3 months</option>
                <option value={6}>Last 6 months</option>
                <option value={12}>Last 12 months</option>
              </select>
              <Button
                variant="outline"
                onClick={loadAnalytics}
                disabled={loading}
              >
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-sm text-neutral-600">Specializations</p>
              <div className="flex flex-wrap gap-1 mt-1 justify-center">
                {judge.specializations.slice(0, 2).map(spec => (
                  <span key={spec} className="px-2 py-1 bg-judicial-blue-100 text-judicial-blue-700 text-xs rounded-full">
                    {spec}
                  </span>
                ))}
                {judge.specializations.length > 2 && (
                  <span className="px-2 py-1 bg-neutral-100 text-neutral-600 text-xs rounded-full">
                    +{judge.specializations.length - 2}
                  </span>
                )}
              </div>
            </div>
            <div className="text-center">
              <p className="text-sm text-neutral-600">Status</p>
              <span className={`inline-block mt-1 px-2 py-1 rounded-full text-xs font-medium ${
                judge.status === 'active' ? 'bg-success-100 text-success-700' : 'bg-neutral-100 text-neutral-600'
              }`}>
                {judge.status}
              </span>
            </div>
            <div className="text-center">
              <p className="text-sm text-neutral-600">Appointment</p>
              <p className="text-sm font-medium text-neutral-900 mt-1">
                {judge.appointmentDate ? new Date(judge.appointmentDate).getFullYear() : 'N/A'}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-neutral-600">Registry</p>
              <p className="text-sm font-medium text-neutral-900 mt-1">Court Registry</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Analytics */}
      {analytics ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-600">Recent Cases</p>
                  <p className="text-2xl font-bold text-neutral-900">{analytics.recentCases}</p>
                </div>
                <Users className="w-8 h-8 text-mpondo-gold-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-600">Avg Cases/Period</p>
                  <p className="text-2xl font-bold text-neutral-900">{analytics.averageCasesPerPeriod}</p>
                </div>
                <Calendar className="w-8 h-8 text-judicial-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-600">Postponement Rate</p>
                  <p className={`text-2xl font-bold ${getPostponementColor(analytics.averagePostponementRate)}`}>
                    {analytics.averagePostponementRate.toFixed(1)}%
                  </p>
                </div>
                <Clock className="w-8 h-8 text-warning-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-600">Performance Score</p>
                  <p className={`text-2xl font-bold ${getPerformanceColor(analytics.averagePerformanceScore)}`}>
                    {analytics.averagePerformanceScore.toFixed(1)}/10
                  </p>
                </div>
                <Target className="w-8 h-8 text-success-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="text-neutral-400 mb-4">
              {loading ? (
                <div className="w-8 h-8 border-2 border-neutral-300 border-t-mpondo-gold-500 rounded-full animate-spin mx-auto" />
              ) : (
                <Gavel className="w-12 h-12 mx-auto" />
              )}
            </div>
            <p className="text-neutral-600">
              {loading ? 'Loading analytics...' : 'No analytics data available'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Additional Insights */}
      {analytics && analytics.periodsAnalyzed > 0 && (
        <Card>
          <CardHeader>
            <h4 className="text-lg font-semibold text-neutral-900">Key Insights</h4>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                {analytics.averagePostponementRate <= 10 ? (
                  <TrendingUp className="w-5 h-5 text-success-500" />
                ) : (
                  <TrendingDown className="w-5 h-5 text-error-500" />
                )}
                <p className="text-sm text-neutral-700">
                  {analytics.averagePostponementRate <= 10 
                    ? 'Low postponement rate indicates efficient case management'
                    : 'High postponement rate may indicate scheduling challenges'
                  }
                </p>
              </div>
              
              <div className="flex items-center gap-3">
                {analytics.averagePerformanceScore >= 7 ? (
                  <TrendingUp className="w-5 h-5 text-success-500" />
                ) : (
                  <TrendingDown className="w-5 h-5 text-warning-500" />
                )}
                <p className="text-sm text-neutral-700">
                  {analytics.averagePerformanceScore >= 7
                    ? 'Strong overall performance across key metrics'
                    : 'Performance metrics suggest room for improvement'
                  }
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-judicial-blue-500" />
                <p className="text-sm text-neutral-700">
                  Analysis based on {analytics.periodsAnalyzed} period{analytics.periodsAnalyzed !== 1 ? 's' : ''} 
                  over {selectedPeriod} months
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};