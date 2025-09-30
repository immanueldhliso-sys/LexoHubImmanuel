import React, { useState, useEffect } from 'react';
import { 
  Brain, 
  TrendingUp, 
  DollarSign, 
  Target,
  Zap,
  AlertCircle,
  CheckCircle,
  Clock,
  BarChart3,
  RefreshCw,
  Lightbulb,
  ArrowRight
} from 'lucide-react';
import { format } from 'date-fns';
import { Card, CardHeader, CardContent, Button } from '../../design-system/components';
import { StrategicFinanceService, type FeeOptimizationRecommendation } from '../../services/api/strategic-finance.service';
import { MatterService } from '../../services/api/matters.service';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import type { Matter } from '../../types';

interface FeeOptimizationCenterProps {
  matterId?: string;
  onRecommendationAccepted?: (recommendation: FeeOptimizationRecommendation) => void;
  className?: string;
}

interface OptimizationInsight {
  type: 'opportunity' | 'warning' | 'success';
  title: string;
  description: string;
  impact: string;
  action?: string;
}

export const FeeOptimizationCenter: React.FC<FeeOptimizationCenterProps> = ({ 
  matterId, 
  onRecommendationAccepted,
  className = '' 
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [recommendations, setRecommendations] = useState<FeeOptimizationRecommendation[]>([]);
  const [matters, setMatters] = useState<Matter[]>([]);
  const [selectedMatter, setSelectedMatter] = useState<string>(matterId || '');
  const [insights, setInsights] = useState<OptimizationInsight[]>([]);

  const loadData = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      
      // Load matters
      const mattersData = await MatterService.getMatters();
      setMatters(mattersData);

      // Load existing recommendations
      const recs = await StrategicFinanceService.getFeeOptimizationRecommendations(user.id);
      setRecommendations(recs);

      // Generate insights
      generateInsights(mattersData, recs);
    } catch (error) {
      console.error('Error loading fee optimization data:', error);
      toast.error('Failed to load fee optimization data');
    } finally {
      setLoading(false);
    }
  };

  const generateInsights = (mattersData: Matter[], recs: FeeOptimizationRecommendation[]) => {
    const newInsights: OptimizationInsight[] = [];

    // Check for underpriced matters
    const avgHourlyRate = mattersData.reduce((sum, m) => sum + (m.hourlyRate || 0), 0) / mattersData.length;
    const lowPricedMatters = mattersData.filter(m => (m.hourlyRate || 0) < avgHourlyRate * 0.8);
    
    if (lowPricedMatters.length > 0) {
      newInsights.push({
        type: 'opportunity',
        title: 'Underpriced Matters Detected',
        description: `${lowPricedMatters.length} matters are priced below your average rate`,
        impact: `Potential revenue increase: R ${(lowPricedMatters.length * avgHourlyRate * 10).toLocaleString()}`,
        action: 'Review and adjust pricing'
      });
    }

    // Check for urgent matters
    const urgentMatters = mattersData.filter(m => 
      m.nextCourtDate && new Date(m.nextCourtDate) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    );
    
    if (urgentMatters.length > 0) {
      newInsights.push({
        type: 'warning',
        title: 'Urgent Matters Premium Opportunity',
        description: `${urgentMatters.length} matters have court dates within 30 days`,
        impact: 'Apply urgency premium of 25-50%',
        action: 'Implement premium urgency pricing'
      });
    }

    // Check for successful optimizations
    const acceptedRecs = recs.filter(r => r.accepted);
    if (acceptedRecs.length > 0) {
      const totalIncrease = acceptedRecs.reduce((sum, r) => sum + r.potentialRevenueIncrease, 0);
      newInsights.push({
        type: 'success',
        title: 'Optimization Success',
        description: `${acceptedRecs.length} recommendations implemented successfully`,
        impact: `Revenue increase: R ${totalIncrease.toLocaleString()}`
      });
    }

    setInsights(newInsights);
  };

  const generateRecommendations = async () => {
    if (!selectedMatter || !user?.id) {
      toast.error('Please select a matter first');
      return;
    }

    try {
      setGenerating(true);
      const recommendation = await StrategicFinanceService.generateFeeOptimizationRecommendation(
        user.id,
        selectedMatter
      );
      
      setRecommendations(prev => [recommendation, ...prev]);
      toast.success('AI recommendations generated successfully');
    } catch (error) {
      console.error('Error generating recommendations:', error);
      toast.error('Failed to generate recommendations');
    } finally {
      setGenerating(false);
    }
  };

  const acceptRecommendation = async (recommendationId: string) => {
    try {
      await StrategicFinanceService.acceptFeeOptimizationRecommendation(recommendationId);
      
      setRecommendations(prev => 
        prev.map(r => r.id === recommendationId ? { ...r, accepted: true } : r)
      );
      
      const recommendation = recommendations.find(r => r.id === recommendationId);
      if (recommendation) {
        onRecommendationAccepted?.(recommendation);
        toast.success('Recommendation accepted and applied');
      }
    } catch (error) {
      console.error('Error accepting recommendation:', error);
      toast.error('Failed to accept recommendation');
    }
  };

  useEffect(() => {
    loadData();
  }, [user?.id]);

  useEffect(() => {
    if (matterId) {
      setSelectedMatter(matterId);
    }
  }, [matterId]);

  const getRecommendationIcon = (model: string) => {
    switch (model) {
      case 'premium_urgency': return <Clock className="w-5 h-5 text-status-warning-500" />;
      case 'success_based': return <Target className="w-5 h-5 text-status-success-500" />;
      case 'volume_discount': return <BarChart3 className="w-5 h-5 text-judicial-blue-500" />;
      default: return <DollarSign className="w-5 h-5 text-neutral-500" />;
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'opportunity': return <Lightbulb className="w-5 h-5 text-status-warning-500" />;
      case 'warning': return <AlertCircle className="w-5 h-5 text-status-error-500" />;
      case 'success': return <CheckCircle className="w-5 h-5 text-status-success-500" />;
      default: return <AlertCircle className="w-5 h-5 text-neutral-500" />;
    }
  };

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="flex items-center gap-2">
          <div className="animate-spin">
            <RefreshCw className="w-5 h-5 text-neutral-400" />
          </div>
          <span className="text-neutral-600">Loading fee optimization center...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-judicial-blue-100 rounded-lg">
            <Brain className="w-6 h-6 text-judicial-blue-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-neutral-900">AI Fee Optimization Center</h2>
            <p className="text-neutral-600">
              Get intelligent recommendations to maximize your fee structure
            </p>
          </div>
        </div>
      </div>

      {/* Insights Cards */}
      {insights.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {insights.map((insight, index) => (
            <Card key={index} className={`border-l-4 ${
              insight.type === 'opportunity' ? 'border-l-status-warning-500 bg-status-warning-50' :
              insight.type === 'warning' ? 'border-l-status-error-500 bg-status-error-50' :
              'border-l-status-success-500 bg-status-success-50'
            }`}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  {getInsightIcon(insight.type)}
                  <div className="flex-1">
                    <h3 className="font-semibold text-neutral-900 mb-1">
                      {insight.title}
                    </h3>
                    <p className="text-sm text-neutral-600 mb-2">
                      {insight.description}
                    </p>
                    <p className="text-sm font-medium text-neutral-800">
                      {insight.impact}
                    </p>
                    {insight.action && (
                      <p className="text-xs text-neutral-500 mt-1">
                        Action: {insight.action}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Generate Recommendations */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-neutral-900 flex items-center gap-2">
            <Zap className="w-5 h-5 text-judicial-blue-500" />
            Generate AI Recommendations
          </h3>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Select Matter for Analysis
              </label>
              <select
                value={selectedMatter}
                onChange={(e) => setSelectedMatter(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-judicial-blue-500 focus:border-transparent"
              >
                <option value="">Choose a matter...</option>
                {matters.map((matter) => (
                  <option key={matter.id} value={matter.id}>
                    {matter.title} - {matter.clientName}
                  </option>
                ))}
              </select>
            </div>
            <Button
              onClick={generateRecommendations}
              disabled={!selectedMatter || generating}
              className="flex items-center gap-2"
            >
              {generating ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Brain className="w-4 h-4" />
              )}
              {generating ? 'Analyzing...' : 'Generate Recommendations'}
            </Button>
          </div>
          
          <div className="text-sm text-neutral-600">
            Our AI analyzes market data, matter complexity, urgency, and client profile to suggest optimal fee structures.
          </div>
        </CardContent>
      </Card>

      {/* Recommendations List */}
      {recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-neutral-900">
              Fee Optimization Recommendations
            </h3>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <div className="space-y-4">
              {recommendations.map((rec) => (
                <div
                  key={rec.id}
                  className={`p-4 border rounded-lg ${
                    rec.accepted ? 'bg-status-success-50 border-status-success-200' : 'bg-white border-neutral-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      {getRecommendationIcon(rec.recommendedModel)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold text-neutral-900 capitalize">
                            {rec.recommendedModel.replace('_', ' ')} Model
                          </h4>
                          {rec.accepted && (
                            <span className="px-2 py-1 bg-status-success-100 text-status-success-700 text-xs rounded-full">
                              Applied
                            </span>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                          <div>
                            <span className="text-sm text-neutral-600">Current Rate:</span>
                            <div className="font-medium">R {rec.currentHourlyRate?.toLocaleString() || 'N/A'}</div>
                          </div>
                          <div>
                            <span className="text-sm text-neutral-600">Recommended Rate:</span>
                            <div className="font-medium text-judicial-blue-600">
                              R {rec.recommendedHourlyRate?.toLocaleString() || 'N/A'}
                            </div>
                          </div>
                          <div>
                            <span className="text-sm text-neutral-600">Potential Increase:</span>
                            <div className="font-medium text-status-success-600">
                              R {rec.potentialRevenueIncrease.toLocaleString()}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-sm text-neutral-600">
                          <span>Confidence: {(rec.confidenceScore * 100).toFixed(0)}%</span>
                          <span>Expires: {format(new Date(rec.expiresAt), 'MMM dd, yyyy')}</span>
                        </div>
                      </div>
                    </div>
                    
                    {!rec.accepted && (
                      <Button
                        size="sm"
                        onClick={() => acceptRecommendation(rec.id)}
                        className="flex items-center gap-2"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Accept
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {recommendations.length === 0 && !loading && (
        <Card className="text-center py-12">
          <CardContent>
            <Brain className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">
              No Recommendations Yet
            </h3>
            <p className="text-neutral-600 mb-6">
              Select a matter and generate AI-powered fee optimization recommendations to get started.
            </p>
            <Button
              onClick={generateRecommendations}
              disabled={!selectedMatter}
              className="flex items-center gap-2 mx-auto"
            >
              <Brain className="w-4 h-4" />
              Generate First Recommendation
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};