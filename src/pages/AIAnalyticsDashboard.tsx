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
import { Card, CardHeader, CardContent, Button } from '../design-system/components';
import { AdvancedVoiceAssistant } from '../components/ai/AdvancedVoiceAssistant';
import { PredictiveAnalyticsService, type SettlementPrediction, type CaseOutcomePrediction, type FeeOptimizationRecommendation } from '../services/ai/predictive-analytics.service';
import { AdvancedNLPService } from '../services/ai/nlp-processor.service';
import { ExternalAPIService } from '../services/integrations/external-api.service';
import { toast } from 'react-hot-toast';
import type { Matter, Invoice } from '../types';

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
}

export const AIAnalyticsDashboard: React.FC = () => {
  // Core state
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'predictions' | 'optimizations' | 'insights' | 'integrations'>('overview');

  // Analytics state
  const [practiceMetrics, setPracticeMetrics] = useState<PracticeMetrics>({
    totalMatters: 0,
    totalWIP: 0,
    predictedSettlements: 0,
    riskScore: 0,
    aiAccuracy: 0,
    optimizationPotential: 0
  });

  const [aiInsights, setAiInsights] = useState<AIInsight[]>([]);
  const [settlementPredictions, setSettlementPredictions] = useState<SettlementPrediction[]>([]);
  const [outcomeAnalysis, setOutcomeAnalysis] = useState<CaseOutcomePrediction[]>([]);
  const [feeOptimizations, setFeeOptimizations] = useState<FeeOptimizationRecommendation[]>([]);

  // Integration status
  const [integrationStatus, setIntegrationStatus] = useState<any>(null);

  useEffect(() => {
    loadAIAnalytics();
  }, []);

  const loadAIAnalytics = async () => {
    setLoading(true);
    try {
      // Load practice metrics
      await loadPracticeMetrics();
      
      // Load AI insights
      await loadAIInsights();
      
      // Load predictive analytics
      await loadPredictiveAnalytics();
      
      // Load integration status
      await loadIntegrationStatus();
      
    } catch (error) {
      console.error('Error loading AI analytics:', error);
      toast.error('Failed to load AI analytics');
    } finally {
      setLoading(false);
    }
  };

  const loadPracticeMetrics = async () => {
    // Simulate loading practice metrics with AI analysis
    const metrics: PracticeMetrics = {
      totalMatters: 42,
      totalWIP: 1250000,
      predictedSettlements: 28,
      riskScore: 25, // Low risk
      aiAccuracy: 87.5,
      optimizationPotential: 15.2
    };
    
    setPracticeMetrics(metrics);
  };

  const loadAIInsights = async () => {
    // Generate AI-powered insights
    const insights: AIInsight[] = [
      {
        id: '1',
        type: 'prediction',
        title: 'High Settlement Probability Detected',
        description: 'Matter ABC-2024-001 shows 89% settlement probability - consider initiating discussions',
        impact: 'high',
        confidence: 0.89,
        actionable: true,
        estimatedValue: 750000,
        timeframe: '2-4 weeks'
      },
      {
        id: '2',
        type: 'optimization',
        title: 'Fee Structure Optimization Opportunity',
        description: 'Performance-based pricing could increase revenue by 18% for commercial matters',
        impact: 'medium',
        confidence: 0.82,
        actionable: true,
        estimatedValue: 225000,
        timeframe: '1-3 months'
      },
      {
        id: '3',
        type: 'risk',
        title: 'Timeline Risk Alert',
        description: 'Matter XYZ-2024-005 showing extended timeline patterns - review resource allocation',
        impact: 'medium',
        confidence: 0.76,
        actionable: true,
        timeframe: 'Immediate'
      },
      {
        id: '4',
        type: 'opportunity',
        title: 'Market Opportunity Identified',
        description: 'ESG compliance matters showing 45% growth trend - consider specialization',
        impact: 'high',
        confidence: 0.91,
        actionable: true,
        estimatedValue: 450000,
        timeframe: '3-6 months'
      }
    ];

    setAiInsights(insights);
  };

  const loadPredictiveAnalytics = async () => {
    try {
      // Mock matter data for predictions
      const mockMatters: Matter[] = [
        {
          id: '1',
          title: 'Commercial Dispute - ABC Corp',
          clientName: 'ABC Corporation',
          briefType: 'Commercial Litigation',
          wipValue: 125000,
          estimatedFee: 200000,
          actualFee: 0,
          status: 'ACTIVE' as any,
          dateCreated: '2024-01-15T10:00:00Z',
          dateModified: '2024-02-10T14:30:00Z',
          instructingAttorney: 'John Smith',
          instructingFirm: 'Smith & Associates',
          bar: 'johannesburg' as any,
          description: 'Commercial contract dispute',
          conflictCheckCompleted: true,
          conflictCheckDate: '2024-01-14T09:00:00Z',
          riskLevel: 'Medium',
          settlementProbability: 78
        }
      ];

      // Generate settlement predictions
      const predictions = await Promise.all(
        mockMatters.map(matter => PredictiveAnalyticsService.predictSettlement(matter))
      );
      setSettlementPredictions(predictions);

      // Generate outcome analysis
      const outcomes = await Promise.all(
        mockMatters.map(matter => PredictiveAnalyticsService.predictCaseOutcome(matter, []))
      );
      setOutcomeAnalysis(outcomes);

      // Generate fee optimizations
      const optimizations = await Promise.all(
        mockMatters.map(matter => PredictiveAnalyticsService.optimizeFeeStructure(matter))
      );
      setFeeOptimizations(optimizations);

    } catch (error) {
      console.error('Error loading predictive analytics:', error);
    }
  };

  const loadIntegrationStatus = async () => {
    try {
      const status = await ExternalAPIService.getIntegrationStatus();
      setIntegrationStatus(status);
    } catch (error) {
      console.error('Error loading integration status:', error);
    }
  };

  const handleRefreshAnalytics = async () => {
    setRefreshing(true);
    try {
      await loadAIAnalytics();
      toast.success('AI analytics refreshed');
    } finally {
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
          <p className="text-neutral-600">Analyzing your practice data with advanced AI...</p>
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
              onClick={() => setActiveTab(tab.id as any)}
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
                  67% settlement probability
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
                  Low risk profile
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

            {/* Voice Assistant Integration */}
            <AdvancedVoiceAssistant className="h-fit" />
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
