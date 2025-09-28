import React, { useState } from 'react';
import { 
  User, 
  BarChart3, 
  TrendingUp,
  Clock,
  Calendar,
  Award,
  Filter,
  Search,
  ExternalLink,
  FileText
} from 'lucide-react';
import { Card, CardHeader, CardContent, Button } from '../../design-system/components';

export const JudgeAnalyticsCard: React.FC = () => {
  const [selectedCourt, setSelectedCourt] = useState('all');
  const [timeframe, setTimeframe] = useState('12m');

  const judgeAnalytics = [
    {
      id: '1',
      name: 'Judge A.B. Mthembu',
      court: 'Gauteng High Court',
      division: 'Commercial Division',
      totalCases: 156,
      averageHearingDuration: 45,
      settlementRate: 68,
      postponementRate: 15,
      avgDecisionTime: 21,
      caseTypes: ['Commercial', 'Contract', 'Company Law'],
      availability: 'High',
      recentTrends: {
        efficiency: 'improving',
        settlementRate: 'stable',
        caseLoad: 'decreasing'
      },
      preferences: {
        morningHearings: true,
        detailedHeads: true,
        electronicFiling: true
      }
    },
    {
      id: '2',
      name: 'Judge C.D. Pillay',
      court: 'Gauteng High Court',
      division: 'Civil Division',
      totalCases: 203,
      averageHearingDuration: 52,
      settlementRate: 74,
      postponementRate: 8,
      avgDecisionTime: 18,
      caseTypes: ['Civil', 'Delict', 'Property'],
      availability: 'Medium',
      recentTrends: {
        efficiency: 'stable',
        settlementRate: 'improving',
        caseLoad: 'stable'
      },
      preferences: {
        morningHearings: false,
        detailedHeads: true,
        electronicFiling: true
      }
    },
    {
      id: '3',
      name: 'Judge E.F. Williams',
      court: 'Western Cape High Court',
      division: 'Criminal Division',
      totalCases: 89,
      averageHearingDuration: 38,
      settlementRate: 45,
      postponementRate: 22,
      avgDecisionTime: 14,
      caseTypes: ['Criminal', 'Appeal', 'Review'],
      availability: 'Low',
      recentTrends: {
        efficiency: 'declining',
        settlementRate: 'stable',
        caseLoad: 'increasing'
      },
      preferences: {
        morningHearings: true,
        detailedHeads: false,
        electronicFiling: false
      }
    }
  ];

  const overallStats = {
    totalJudges: 45,
    averageSettlementRate: 62,
    averageDecisionTime: 18,
    mostActiveJudge: 'Judge C.D. Pillay'
  };

  const getAvailabilityColor = (availability: string) => {
    switch (availability) {
      case 'High':
        return 'text-success-600 bg-success-100';
      case 'Medium':
        return 'text-warning-600 bg-warning-100';
      case 'Low':
        return 'text-error-600 bg-error-100';
      default:
        return 'text-neutral-600 bg-neutral-100';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="w-3 h-3 text-success-500" />;
      case 'declining':
        return <TrendingUp className="w-3 h-3 text-error-500 rotate-180" />;
      default:
        return <div className="w-3 h-3 bg-neutral-400 rounded-full" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-600">Total Judges</p>
                <p className="text-2xl font-bold text-neutral-900">{overallStats.totalJudges}</p>
              </div>
              <User className="w-8 h-8 text-judicial-blue-500" />
            </div>
            <p className="text-xs text-neutral-500 mt-2">Across all courts</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-600">Avg Settlement Rate</p>
                <p className="text-2xl font-bold text-success-600">{overallStats.averageSettlementRate}%</p>
              </div>
              <Award className="w-8 h-8 text-success-500" />
            </div>
            <p className="text-xs text-neutral-500 mt-2">Last 12 months</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-600">Avg Decision Time</p>
                <p className="text-2xl font-bold text-mpondo-gold-600">{overallStats.averageDecisionTime} days</p>
              </div>
              <Clock className="w-8 h-8 text-mpondo-gold-500" />
            </div>
            <p className="text-xs text-neutral-500 mt-2">From hearing to judgment</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-600">Most Active</p>
                <p className="text-lg font-bold text-neutral-900">{overallStats.mostActiveJudge}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-neutral-500" />
            </div>
            <p className="text-xs text-neutral-500 mt-2">203 cases this year</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-neutral-500" />
              <span className="text-sm font-medium text-neutral-700">Filter by:</span>
            </div>
            
            <select
              value={selectedCourt}
              onChange={(e) => setSelectedCourt(e.target.value)}
              className="px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-mpondo-gold-500 focus:border-mpondo-gold-500"
            >
              <option value="all">All Courts</option>
              <option value="gauteng-high">Gauteng High Court</option>
              <option value="western-cape-high">Western Cape High Court</option>
              <option value="magistrates">Magistrates Courts</option>
            </select>

            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              className="px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-mpondo-gold-500 focus:border-mpondo-gold-500"
            >
              <option value="3m">Last 3 months</option>
              <option value="6m">Last 6 months</option>
              <option value="12m">Last 12 months</option>
              <option value="24m">Last 2 years</option>
            </select>

            <div className="flex-1 flex items-center gap-2">
              <input
                type="text"
                placeholder="Search judges..."
                className="flex-1 px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-mpondo-gold-500 focus:border-mpondo-gold-500"
              />
              <Button variant="outline" size="sm">
                <Search className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Judge Analytics Cards */}
      <div className="space-y-4">
        {judgeAnalytics.map((judge) => (
          <Card key={judge.id} hoverable>
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-neutral-900 text-lg">{judge.name}</h3>
                  <p className="text-neutral-600">{judge.court} - {judge.division}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {judge.caseTypes.map((type, index) => (
                      <span key={index} className="px-2 py-1 bg-neutral-100 text-neutral-700 text-xs rounded">
                        {type}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="text-right">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getAvailabilityColor(judge.availability)}`}>
                    {judge.availability} Availability
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-neutral-900">{judge.totalCases}</p>
                  <p className="text-xs text-neutral-600">Total Cases</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-success-600">{judge.settlementRate}%</p>
                  <p className="text-xs text-neutral-600">Settlement Rate</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-mpondo-gold-600">{judge.avgDecisionTime}d</p>
                  <p className="text-xs text-neutral-600">Avg Decision</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-judicial-blue-600">{judge.averageHearingDuration}m</p>
                  <p className="text-xs text-neutral-600">Hearing Time</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-error-600">{judge.postponementRate}%</p>
                  <p className="text-xs text-neutral-600">Postponements</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Trends */}
                <div>
                  <h4 className="font-medium text-neutral-900 mb-2">Recent Trends</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-neutral-600">Efficiency:</span>
                      <div className="flex items-center gap-1">
                        {getTrendIcon(judge.recentTrends.efficiency)}
                        <span className="capitalize">{judge.recentTrends.efficiency}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-neutral-600">Settlement Rate:</span>
                      <div className="flex items-center gap-1">
                        {getTrendIcon(judge.recentTrends.settlementRate)}
                        <span className="capitalize">{judge.recentTrends.settlementRate}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-neutral-600">Case Load:</span>
                      <div className="flex items-center gap-1">
                        {getTrendIcon(judge.recentTrends.caseLoad)}
                        <span className="capitalize">{judge.recentTrends.caseLoad}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Preferences */}
                <div>
                  <h4 className="font-medium text-neutral-900 mb-2">Preferences & Style</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${judge.preferences.morningHearings ? 'bg-success-500' : 'bg-neutral-300'}`} />
                      <span className="text-neutral-600">Prefers morning hearings</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${judge.preferences.detailedHeads ? 'bg-success-500' : 'bg-neutral-300'}`} />
                      <span className="text-neutral-600">Requires detailed heads</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${judge.preferences.electronicFiling ? 'bg-success-500' : 'bg-neutral-300'}`} />
                      <span className="text-neutral-600">Electronic filing preferred</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <Button size="sm" variant="outline">
                  <FileText className="w-3 h-3 mr-1" />
                  View Cases
                </Button>
                <Button size="sm" variant="outline">
                  <Calendar className="w-3 h-3 mr-1" />
                  Schedule Hearing
                </Button>
                <Button size="sm" variant="outline">
                  <ExternalLink className="w-3 h-3 mr-1" />
                  Full Profile
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Analytics Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6 text-center">
            <BarChart3 className="w-12 h-12 text-mpondo-gold-500 mx-auto mb-4" />
            <h3 className="font-semibold text-neutral-900 mb-2">Performance Analytics</h3>
            <p className="text-sm text-neutral-600 mb-4">
              Track judge performance metrics, decision patterns, and case outcomes
            </p>
            <Button size="sm" variant="outline" className="w-full">
              View Analytics
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <TrendingUp className="w-12 h-12 text-judicial-blue-500 mx-auto mb-4" />
            <h3 className="font-semibold text-neutral-900 mb-2">Predictive Insights</h3>
            <p className="text-sm text-neutral-600 mb-4">
              AI-powered predictions for case outcomes based on historical judge data
            </p>
            <Button size="sm" variant="outline" className="w-full">
              Get Predictions
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <Calendar className="w-12 h-12 text-success-500 mx-auto mb-4" />
            <h3 className="font-semibold text-neutral-900 mb-2">Strategic Scheduling</h3>
            <p className="text-sm text-neutral-600 mb-4">
              Optimize hearing schedules based on judge availability and preferences
            </p>
            <Button size="sm" variant="outline" className="w-full">
              Schedule Smart
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
