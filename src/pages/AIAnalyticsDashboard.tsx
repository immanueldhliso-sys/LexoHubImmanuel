/**
 * AI Analytics Dashboard
 * Phase 3 showcase of advanced AI, ML, and predictive analytics capabilities
 */

import React, { useState, useEffect } from 'react';
import { 
  Brain, 
  TrendingUp, 
  Zap, 
  Target, 
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  FileText,
  Users,
  BarChart3,
  PieChart,
  Activity,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { Card, CardHeader, CardContent, Button, Icon } from '../design-system/components';
import { PredictiveAnalyticsService, type SettlementPrediction, type CaseOutcomePrediction, type FeeOptimizationRecommendation } from '../services/ai/predictive-analytics.service';
import { AdvancedNLPService } from '../services/ai/nlp-processor.service';
import { ExternalAPIService } from '../services/integrations/external-api.service';
import { toast } from 'react-hot-toast';
import type { Matter, Invoice } from '../types';
import { useAuth } from '@/contexts/AuthContext';
import { matterApiService } from '@/services/api';

interface AIInsight {
  id: string;
  type: 'prediction' | 'optimization' | 'risk' | 'opportunity';
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  actionable: boolean;
  estimatedValue?: number;
  timeframe?: string;
}

interface PracticeMetrics {
  totalMatters: number;
  totalWIP: number;
  predictedSettlements: number;
  riskScore: number;
  aiAccuracy: number;
  optimizationPotential: number;
  averageSettlementProbability: number;
}

export const AIAnalyticsDashboard: React.FC = () => {
  // Core state
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState<string>('Analyzing your practice data with advanced AI...');
  const [loadingProgress, setLoadingProgress] = useState<number>(0);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'predictions' | 'optimizations' | 'insights' | 'integrations'>('overview');

  // Analytics state
  const [practiceMetrics, setPracticeMetrics] = useState<PracticeMetrics>({
    totalMatters: 0,
    totalWIP: 0,
    predictedSettlements: 0,
    riskScore: 0,
    aiAccuracy: 0,
    optimizationPotential: 0,
    averageSettlementProbability: 0
  });

  const [aiInsights, setAiInsights] = useState<AIInsight[]>([]);
  const [settlementPredictions, setSettlementPredictions] = useState<SettlementPrediction[]>([]);
  const [outcomeAnalysis, setOutcomeAnalysis] = useState<CaseOutcomePrediction[]>([]);
  const [feeOptimizations, setFeeOptimizations] = useState<FeeOptimizationRecommendation[]>([]);

  // Integration status
  const [integrationStatus, setIntegrationStatus] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      loadAIAnalytics();
    }
  }, [authLoading, isAuthenticated]);

  // Helper: stage progress reporter
  const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(n, max));
  const makeStageReporter = (start: number, end: number) => {
    const span = Math.max(end - start, 1);
    let lastUpdate = 0;
    return (fraction: number, message?: string) => {
      const now = Date.now();
      // Throttle to ~10 updates/second unless completion
      const isBoundary = fraction <= 0 || fraction >= 1;
      if (!isBoundary && now - lastUpdate < 100) return;
      lastUpdate = now;
      const pct = Math.round(start + clamp(fraction, 0, 1) * span);
      setLoadingProgress(pct);
      if (message) setLoadingMessage(message);
    };
  };

  const loadAIAnalytics = async () => {
    setLoading(true);
    setLoadingMessage('Initializing AI analytics...');
    setLoadingProgress(5);
    try {
      // Load practice metrics
      setLoadingMessage('Gathering practice metrics...');
      const reportPractice = makeStageReporter(5, 35);
      reportPractice(0.05);
      await loadPracticeMetrics(reportPractice);
      
      // Load AI insights
      setLoadingMessage('Generating AI insights...');
      const reportInsights = makeStageReporter(35, 60);
      reportInsights(0.05);
      await loadAIInsights(reportInsights);
      
      // Load predictive analytics
      setLoadingMessage('Running predictive models...');
      const reportPredictive = makeStageReporter(60, 85);
      reportPredictive(0.05);
      await loadPredictiveAnalytics(reportPredictive);
      
      // Load integration status
      setLoadingMessage('Checking integrations...');
      const reportIntegrations = makeStageReporter(85, 95);
      reportIntegrations(0.2);
      await loadIntegrationStatus(reportIntegrations);
      
      setLoadingMessage('Finalizing dashboard...');
      setLoadingProgress(95);
    } catch (error) {
      console.error('Error loading AI analytics:', error);
      toast.error('Failed to load AI analytics');
    } finally {
      setLoadingMessage('Complete');
      setLoadingProgress(100);
      setLoading(false);
    }
  };

  const loadPracticeMetrics = async (report?: (fraction: number, message?: string) => void) => {
    if (!user?.id) {
      setPracticeMetrics({
        totalMatters: 0,
        totalWIP: 0,
        predictedSettlements: 0,
        riskScore: 0,
        aiAccuracy: 0,
        optimizationPotential: 0,
        averageSettlementProbability: 0
      });
      report?.(1);
      return;
    }

    const [{ data: matters }, stats] = await Promise.all([
      matterApiService.getByAdvocate(user.id),
      matterApiService.getStats(user.id)
    ]);

    report?.(0.2, 'Computing practice metrics...');

    const totalMatters = (matters || []).length;
    const totalWIP = (stats?.totalWipValue as number) || 0;
    const predictedSettlements = Math.round(((stats?.averageSettlementProbability as number) || 0) * totalMatters / 100);
    const riskScore = Math.round(((stats?.overdue as number) || 0) * 100 / Math.max(totalMatters, 1));

    // Derive AI accuracy from prediction confidence on a sample of matters
    const sample = (matters || []).slice(0, 5);
    let aiAccuracy = 0;
    if (sample.length > 0) {
      try {
        const predictions: SettlementPrediction[] = [];
        for (let i = 0; i < sample.length; i++) {
          const p = await PredictiveAnalyticsService.predictSettlement(sample[i]);
          predictions.push(p);
          report?.(0.3 + ((i + 1) / sample.length) * 0.6, `Analyzing sample ${i + 1}/${sample.length}...`);
        }
        const avgConfidence = predictions.reduce((sum, p) => sum + (p.confidence || 0), 0) / predictions.length;
        aiAccuracy = Math.round(avgConfidence * 100);
      } catch (e) {
        aiAccuracy = 0;
      }
    }

    // Estimate optimization potential: matters where WIP exceeds estimated fee
    const optimizationCandidates = (matters || []).reduce((count, m) => {
      const wip = m.wipValue || 0;
      const est = m.estimatedFee || 0;
      return count + (wip > est ? 1 : 0);
    }, 0);
    const optimizationPotential = Math.round((optimizationCandidates * 100) / Math.max(totalMatters, 1));

    const averageSettlementProbability = (stats?.averageSettlementProbability as number) || 0;

    setPracticeMetrics({
      totalMatters,
      totalWIP,
      predictedSettlements,
      riskScore,
      aiAccuracy,
      optimizationPotential,
      averageSettlementProbability
    });

    report?.(1, 'Practice metrics complete');
  };

  const loadAIInsights = async (report?: (fraction: number, message?: string) => void) => {
    if (!user?.id) {
      setAiInsights([]);
      report?.(1);
      return;
    }
    const { data: matters } = await matterApiService.getByAdvocate(user.id);
    const topMatters = (matters || []).slice(0, 5);
    const insights: AIInsight[] = [];
    for (let i = 0; i < topMatters.length; i++) {
      const m = topMatters[i];
      insights.push({
        id: m.id,
        type: 'prediction',
        title: `Settlement Probability: ${m.title}`,
        description: `${m.clientName || 'Client'} matter shows ${Math.round((m.settlementProbability || 0))}% settlement probability`,
        impact: (m.settlementProbability || 0) > 70 ? 'high' : (m.settlementProbability || 0) > 40 ? 'medium' : 'low',
        confidence: ((m.settlementProbability || 0) / 100),
        actionable: true,
        estimatedValue: m.estimatedFee || m.wipValue || 0,
        timeframe: '2-8 weeks'
      });
      report?.((i + 1) / Math.max(topMatters.length, 1), `Generating insight ${i + 1}/${topMatters.length}...`);
    }
    setAiInsights(insights);
  };

  const loadPredictiveAnalytics = async (report?: (fraction: number, message?: string) => void) => {
    try {
      if (!user?.id) {
        setSettlementPredictions([]);
        setOutcomeAnalysis([]);
        setFeeOptimizations([]);
        report?.(1);
        return;
      }

      const { data: matters } = await matterApiService.getByAdvocate(user.id);
      const selected = (matters || []).slice(0, 5);
      const predictions: SettlementPrediction[] = [];
      const outcomes: CaseOutcomePrediction[] = [];
      const optimizations: FeeOptimizationRecommendation[] = [];

      // Process sequentially to report granular progress
      for (let i = 0; i < selected.length; i++) {
        const matter = selected[i];
        const p = await PredictiveAnalyticsService.predictSettlement(matter);
        predictions.push(p);
        report?.((i + 1) / (selected.length * 3), `Predicting settlements ${i + 1}/${selected.length}...`);
      }
      setSettlementPredictions(predictions);

      for (let i = 0; i < selected.length; i++) {
        const matter = selected[i];
        const o = await PredictiveAnalyticsService.predictCaseOutcome(matter, []);
        outcomes.push(o);
        report?.((selected.length + i + 1) / (selected.length * 3), `Analyzing case outcomes ${i + 1}/${selected.length}...`);
      }
      setOutcomeAnalysis(outcomes);

      for (let i = 0; i < selected.length; i++) {
        const matter = selected[i];
        const opt = await PredictiveAnalyticsService.optimizeFeeStructure(matter);
        optimizations.push(opt);
        report?.((selected.length * 2 + i + 1) / (selected.length * 3), `Optimizing fees ${i + 1}/${selected.length}...`);
      }
      setFeeOptimizations(optimizations);

    } catch (error) {
      console.error('Error loading predictive analytics:', error);
    }
  };

  const loadIntegrationStatus = async (report?: (fraction: number, message?: string) => void) => {
    try {
      const status = await ExternalAPIService.getIntegrationStatus();
      setIntegrationStatus(status);
      report?.(1, 'Integrations checked');
    } catch (error) {
      console.error('Error loading integration status:', error);
    }
  };

  const handleRefreshAnalytics = async () => {
    setRefreshing(true);
    try {
      setLoading(true);
      setLoadingMessage('Refreshing AI analytics...');
      setLoadingProgress(5);
      await loadAIAnalytics();
      toast.success('AI analytics refreshed');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'prediction':
        return <Brain className="w-5 h-5 text-mpondo-gold-500" />;
      case 'optimization':
        return <Target className="w-5 h-5 text-judicial-blue-500" />;
      case 'risk':
        return <AlertTriangle className="w-5 h-5 text-status-warning-500" />;
      case 'opportunity':
        return <Sparkles className="w-5 h-5 text-status-success-500" />;
      default:
        return <Activity className="w-5 h-5 text-neutral-500" />;
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'critical':
        return 'text-status-error-600 bg-status-error-100';
      case 'high':
        return 'text-status-warning-600 bg-status-warning-100';
      case 'medium':
        return 'text-mpondo-gold-600 bg-mpondo-gold-100';
      default:
        return 'text-neutral-600 bg-neutral-100';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Brain className="w-12 h-12 text-mpondo-gold-500 mx-auto mb-4 animate-pulse" />
          <h2 className="text-xl font-semibold text-neutral-900 mb-2">Loading AI Analytics</h2>
          <p className="text-neutral-600 mb-4">{loadingMessage}</p>
          <div className="w-64 mx-auto">
            <div className="w-full bg-neutral-200 rounded-full h-2 overflow-hidden">
              <div
                className="bg-mpondo-gold-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${loadingProgress}%` }}
              ></div>
            </div>
            <p className="mt-2 text-xs text-neutral-500">{Math.min(loadingProgress, 100)}%</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 flex items-center gap-3">
            <Brain className="w-8 h-8 text-mpondo-gold-500" />
            AI Analytics Dashboard
          </h1>
          <p className="text-neutral-600 mt-1">
            Advanced AI-powered insights and predictive analytics for your practice
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={handleRefreshAnalytics}
            disabled={refreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh Analytics
          </Button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-neutral-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', label: 'AI Overview', icon: BarChart3 },
            { id: 'predictions', label: 'Predictions', icon: Brain },
            { id: 'optimizations', label: 'Optimizations', icon: Target },
            { id: 'insights', label: 'AI Insights', icon: Sparkles },
            { id: 'integrations', label: 'Integrations', icon: Zap }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-mpondo-gold-500 text-mpondo-gold-600'
                  : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-neutral-600">AI Accuracy</p>
                    <p className="text-2xl font-bold text-neutral-900">{practiceMetrics.aiAccuracy}%</p>
                  </div>
                  <Brain className="w-8 h-8 text-mpondo-gold-500" />
                </div>
                <div className="mt-2">
                  <div className="w-full bg-neutral-200 rounded-full h-2">
                    <div 
                      className="bg-mpondo-gold-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${practiceMetrics.aiAccuracy}%` }}
                    ></div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-neutral-600">Predicted Settlements</p>
                    <p className="text-2xl font-bold text-neutral-900">{practiceMetrics.predictedSettlements}</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-status-success-500" />
                </div>
                <p className="text-sm text-status-success-600 mt-2">
                  {Math.round(practiceMetrics.averageSettlementProbability)}% average settlement probability
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-neutral-600">Risk Score</p>
                    <p className="text-2xl font-bold text-neutral-900">{practiceMetrics.riskScore}</p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-status-success-500" />
                </div>
                <p className="text-sm text-status-success-600 mt-2">
                  {practiceMetrics.riskScore < 20 ? 'Low' : practiceMetrics.riskScore < 50 ? 'Medium' : 'High'} risk profile
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-neutral-600">Optimization Potential</p>
                    <p className="text-2xl font-bold text-neutral-900">{practiceMetrics.optimizationPotential}%</p>
                  </div>
                  <Target className="w-8 h-8 text-judicial-blue-500" />
                </div>
                <p className="text-sm text-judicial-blue-600 mt-2">
                  Revenue improvement opportunity
                </p>
              </CardContent>
            </Card>
          </div>

          {/* AI Insights Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold text-neutral-900">Recent AI Insights</h3>
              </CardHeader>
              <CardContent className="space-y-4">
                {aiInsights.slice(0, 3).map((insight) => (
                  <div key={insight.id} className="flex items-start gap-3 p-3 bg-neutral-50 rounded-lg">
                    {getInsightIcon(insight.type)}
                    <div className="flex-1">
                      <h4 className="font-medium text-neutral-900 mb-1">{insight.title}</h4>
                      <p className="text-sm text-neutral-600 mb-2">{insight.description}</p>
                      <div className="flex items-center justify-between">
                        <span className={`text-xs px-2 py-1 rounded-full ${getImpactColor(insight.impact)}`}>
                          {insight.impact.toUpperCase()}
                        </span>
                        <span className="text-xs text-neutral-500">
                          {Math.round(insight.confidence * 100)}% confidence
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Predictions Tab */}
      {activeTab === 'predictions' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Settlement Predictions */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold text-neutral-900">Settlement Predictions</h3>
              </CardHeader>
              <CardContent className="space-y-4">
                {settlementPredictions.map((prediction) => (
                  <div key={prediction.matterId} className="border border-neutral-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-neutral-900">Matter {prediction.matterId}</h4>
                      <span className={`text-sm px-2 py-1 rounded-full ${
                        prediction.probability > 0.7 ? 'bg-status-success-100 text-status-success-700' :
                        prediction.probability > 0.4 ? 'bg-status-warning-100 text-status-warning-700' :
                        'bg-status-error-100 text-status-error-700'
                      }`}>
                        {Math.round(prediction.probability * 100)}% Settlement Probability
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-neutral-600">Optimistic</p>
                        <p className="font-medium">{prediction.timelineEstimate.optimistic} days</p>
                      </div>
                      <div>
                        <p className="text-neutral-600">Realistic</p>
                        <p className="font-medium">{prediction.timelineEstimate.realistic} days</p>
                      </div>
                      <div>
                        <p className="text-neutral-600">Pessimistic</p>
                        <p className="font-medium">{prediction.timelineEstimate.pessimistic} days</p>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Outcome Analysis */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold text-neutral-900">Case Outcome Analysis</h3>
              </CardHeader>
              <CardContent className="space-y-4">
                {outcomeAnalysis.map((analysis) => (
                  <div key={analysis.matterId} className="border border-neutral-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-neutral-900">Matter {analysis.matterId}</h4>
                      <span className="text-sm font-medium text-neutral-700 capitalize">
                        {analysis.outcomeType.replace('_', ' ')} - {Math.round(analysis.probability * 100)}%
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-neutral-600">Est. Recovery:</span>
                        <span className="font-medium">{formatCurrency(analysis.financialProjection.recovery.estimated)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-neutral-600">Est. Costs:</span>
                        <span className="font-medium">{formatCurrency(analysis.financialProjection.costs.estimated)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Other tabs would be implemented similarly... */}
      {activeTab === 'insights' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {aiInsights.map((insight) => (
            <Card key={insight.id}>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  {getInsightIcon(insight.type)}
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-neutral-900">{insight.title}</h3>
                      <span className={`text-xs px-2 py-1 rounded-full ${getImpactColor(insight.impact)}`}>
                        {insight.impact.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-neutral-600 mb-3">{insight.description}</p>
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-neutral-500">
                        <span>Confidence: {Math.round(insight.confidence * 100)}%</span>
                        {insight.timeframe && <span className="ml-4">Timeline: {insight.timeframe}</span>}
                      </div>
                      {insight.estimatedValue && (
                        <span className="font-medium text-mpondo-gold-600">
                          {formatCurrency(insight.estimatedValue)}
                        </span>
                      )}
                    </div>
                    {insight.actionable && (
                      <Button size="sm" variant="outline" className="mt-3 w-full">
                        Take Action
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
