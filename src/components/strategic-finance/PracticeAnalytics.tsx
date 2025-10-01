import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  Users, 
  DollarSign, 
  Clock,
  Target,
  Award,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '../../design-system/components';
import { Button } from '../../design-system/components';
import { StrategicFinanceService } from '../../services/api/strategic-finance.service';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';

interface PracticeMetric {
  id: string;
  name: string;
  value: number;
  target: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  change: number;
  benchmark: number;
  category: 'financial' | 'operational' | 'client';
}

interface BenchmarkData {
  metric: string;
  yourPractice: number;
  industryAverage: number;
  topQuartile: number;
  unit: string;
}

interface PracticeAnalyticsProps {
  className?: string;
}

export const PracticeAnalytics: React.FC<PracticeAnalyticsProps> = ({ className }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<PracticeMetric[]>([]);
  const [benchmarks, setBenchmarks] = useState<BenchmarkData[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<'month' | 'quarter' | 'year'>('month');
  const [activeTab, setActiveTab] = useState('performance');

  useEffect(() => {
    if (user) {
      loadAnalytics();
    }
  }, [user, selectedPeriod]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      
      // Load practice metrics
      const metricsData = await StrategicFinanceService.getPracticeMetrics(selectedPeriod);
      setMetrics(metricsData);

      // Load benchmark data
      const benchmarkData = await StrategicFinanceService.getBenchmarkData();
      setBenchmarks(benchmarkData);

    } catch (error) {
      console.error('Error loading practice analytics:', error);
      toast.error('Failed to load practice analytics');
    } finally {
      setLoading(false);
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <BarChart3 className="h-4 w-4 text-gray-500" />;
    }
  };

  const getPerformanceColor = (value: number, target: number) => {
    const percentage = (value / target) * 100;
    if (percentage >= 100) return 'text-green-600';
    if (percentage >= 80) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getBenchmarkStatus = (value: number, benchmark: number, topQuartile: number) => {
    if (value >= topQuartile) return { status: 'excellent', color: 'bg-green-500' };
    if (value >= benchmark) return { status: 'good', color: 'bg-blue-500' };
    return { status: 'needs-improvement', color: 'bg-red-500' };
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Practice Analytics
          </h3>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Practice Analytics
            </h3>
            <div className="flex items-center gap-2">
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value as 'month' | 'quarter' | 'year')}
                className="px-3 py-1 border rounded-md text-sm"
              >
                <option value="month">Last Month</option>
                <option value="quarter">Last Quarter</option>
                <option value="year">Last Year</option>
              </select>
              <Button variant="outline" onClick={loadAnalytics} className="text-sm px-3 py-1">
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Tab Navigation */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8">
              {['performance', 'benchmarks', 'insights'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab
                      ? 'border-mpondo-gold-500 text-mpondo-gold-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </nav>
          </div>

          {/* Performance Tab */}
          {activeTab === 'performance' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {metrics.map((metric) => (
                  <Card key={metric.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-600">{metric.name}</span>
                        {getTrendIcon(metric.trend)}
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl font-bold">
                            {metric.value.toLocaleString()}
                          </span>
                          <span className="text-sm text-gray-500">{metric.unit}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">
                            Target: {metric.target.toLocaleString()} {metric.unit}
                          </span>
                          <span className={`font-medium ${getPerformanceColor(metric.value, metric.target)}`}>
                            {((metric.value / metric.target) * 100).toFixed(1)}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-mpondo-gold-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${Math.min((metric.value / metric.target) * 100, 100)}%` }}
                          />
                        </div>
                        <div className="flex items-center gap-1 text-sm">
                          <span className={metric.change >= 0 ? 'text-green-600' : 'text-red-600'}>
                            {metric.change >= 0 ? '+' : ''}{metric.change.toFixed(1)}%
                          </span>
                          <span className="text-gray-500">vs last period</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Benchmarks Tab */}
          {activeTab === 'benchmarks' && (
            <div className="space-y-6">
              <div className="space-y-4">
                {benchmarks.map((benchmark, index) => {
                  const status = getBenchmarkStatus(
                    benchmark.yourPractice, 
                    benchmark.industryAverage, 
                    benchmark.topQuartile
                  );
                  
                  return (
                    <Card key={index}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium">{benchmark.metric}</h4>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.color} text-white`}>
                            {status.status.replace('-', ' ')}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500 block">Your Practice</span>
                            <span className="font-semibold text-lg">
                              {benchmark.yourPractice.toLocaleString()} {benchmark.unit}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500 block">Industry Average</span>
                            <span className="font-medium">
                              {benchmark.industryAverage.toLocaleString()} {benchmark.unit}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500 block">Top Quartile</span>
                            <span className="font-medium">
                              {benchmark.topQuartile.toLocaleString()} {benchmark.unit}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* Insights Tab */}
          {activeTab === 'insights' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <h3 className="flex items-center gap-2 text-lg font-semibold">
                      <Target className="h-5 w-5 text-blue-500" />
                      Key Opportunities
                    </h3>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                      <TrendingUp className="h-5 w-5 text-blue-500 mt-0.5" />
                      <div>
                        <h5 className="font-medium text-blue-900">Increase Billing Efficiency</h5>
                        <p className="text-sm text-blue-700">
                          Your billing cycle is 15% slower than industry average. 
                          Consider automated time tracking.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                      <DollarSign className="h-5 w-5 text-green-500 mt-0.5" />
                      <div>
                        <h5 className="font-medium text-green-900">Optimize Fee Structure</h5>
                        <p className="text-sm text-green-700">
                          Your hourly rates are below market. Consider a 12% increase 
                          for new matters.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <h3 className="flex items-center gap-2 text-lg font-semibold">
                      <Award className="h-5 w-5 text-green-500" />
                      Strengths
                    </h3>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                      <Users className="h-5 w-5 text-green-500 mt-0.5" />
                      <div>
                        <h5 className="font-medium text-green-900">Client Retention</h5>
                        <p className="text-sm text-green-700">
                          95% client retention rate - top 10% in the industry.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg">
                      <Clock className="h-5 w-5 text-purple-500 mt-0.5" />
                      <div>
                        <h5 className="font-medium text-purple-900">Matter Resolution</h5>
                        <p className="text-sm text-purple-700">
                          Average case resolution 20% faster than peers.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <h3 className="flex items-center gap-2 text-lg font-semibold">
                    <AlertTriangle className="h-5 w-5 text-yellow-500" />
                    Action Items
                  </h3>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <h5 className="font-medium">Review Pricing Strategy</h5>
                        <p className="text-sm text-gray-600">
                          Analyze competitor pricing and adjust rates accordingly
                        </p>
                      </div>
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">High Priority</span>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <h5 className="font-medium">Implement Time Tracking</h5>
                        <p className="text-sm text-gray-600">
                          Deploy automated time tracking to improve billing accuracy
                        </p>
                      </div>
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Medium Priority</span>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <h5 className="font-medium">Client Feedback System</h5>
                        <p className="text-sm text-gray-600">
                          Establish regular client satisfaction surveys
                        </p>
                      </div>
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Low Priority</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};