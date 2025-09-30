// Duplicate legacy implementation removed to avoid conflicting exports

import React, { useState, useEffect } from 'react';
import { TrendingUp, Zap, DollarSign, Target, AlertCircle, CheckCircle, Brain, BarChart3, Clock, Shield } from 'lucide-react';
import { Card, CardHeader, CardContent, Button } from '../../design-system/components';
import { StrategicFinanceService, type FeeOptimizationRecommendation } from '../../services/api/strategic-finance.service';
import { toast } from 'react-hot-toast';

interface FeeOptimizationCardProps {
  matterId?: string;
}

export const FeeOptimizationCard: React.FC<FeeOptimizationCardProps> = ({ matterId }) => {
  const [recommendations, setRecommendations] = useState<FeeOptimizationRecommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [acceptingRecommendation, setAcceptingRecommendation] = useState<string | null>(null);

  const loadRecommendations = async () => {
    if (!matterId) return;
    
    setLoading(true);
    try {
      const recs = await StrategicFinanceService.getFeeOptimizationRecommendations({
        matterId,
        urgencyFactor: 0.7,
        complexityScore: 7
      });
      setRecommendations(recs);
      
      // Show success message if we got recommendations
      if (recs.length > 0) {
        console.info(`Loaded ${recs.length} fee optimization recommendations`);
      }
    } catch (error) {
      console.error('Error loading recommendations:', error);
      // Don't show error toast here as the service already handles fallbacks
      // Just log for debugging
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecommendations();
  }, [matterId]);

  const handleAcceptRecommendation = async (recommendationId: string) => {
    setAcceptingRecommendation(recommendationId);
    try {
      await StrategicFinanceService.acceptFeeOptimizationRecommendation(recommendationId);
      
      // Update the local state
      setRecommendations(prev => 
        prev.map(rec => 
          rec.id === recommendationId 
            ? { ...rec, accepted: true }
            : rec
        )
      );
      
      toast.success('Fee optimization recommendation accepted successfully!');
    } catch (error) {
      console.error('Error accepting recommendation:', error);
      toast.error('Failed to accept recommendation. Please try again.');
    } finally {
      setAcceptingRecommendation(null);
    }
  };

  const getModelDescription = (model: string) => {
    switch (model) {
      case 'standard':
        return 'Market-rate hourly billing';
      case 'premium_urgency':
        return 'Premium rate for urgent matters';
      case 'volume_discount':
        return 'Reduced rate for high-volume clients';
      case 'success_based':
        return 'Success fee arrangement';
      case 'hybrid':
        return 'Combined hourly and success fee';
      default:
        return model;
    }
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 0.8) return 'text-success-600 bg-success-100';
    if (score >= 0.6) return 'text-warning-600 bg-warning-100';
    return 'text-neutral-600 bg-neutral-100';
  };

  if (!matterId) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Target className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-neutral-900 mb-2">Fee Optimization</h3>
          <p className="text-neutral-600">
            Select a matter to get AI-powered fee optimization recommendations
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <Brain className="w-5 h-5 text-mpondo-gold-500" />
              <Zap className="w-4 h-4 text-mpondo-gold-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-neutral-900">AI Fee Optimization</h3>
              <p className="text-xs text-neutral-500">Powered by AWS Bedrock Claude 3.5 Sonnet</p>
            </div>
          </div>
          <Button
            onClick={loadRecommendations}
            disabled={loading}
            size="sm"
            variant="outline"
          >
            {loading ? 'Analyzing...' : 'Refresh'}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-mpondo-gold-600"></div>
          </div>
        ) : recommendations.length === 0 ? (
          <div className="text-center py-8">
            <AlertCircle className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
            <p className="text-neutral-600">No optimization recommendations available</p>
          </div>
        ) : (
          <div className="space-y-4">
            {recommendations.map((rec) => (
              <div
                key={rec.id}
                className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                  selectedModel === rec.id
                    ? 'border-mpondo-gold-500 bg-mpondo-gold-50'
                    : 'border-neutral-200 hover:border-neutral-300'
                }`}
                onClick={() => setSelectedModel(selectedModel === rec.id ? null : rec.id)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-medium text-neutral-900 capitalize">
                      {rec.recommendedModel.replace('_', ' ')} Model
                    </h4>
                    <p className="text-sm text-neutral-600">
                      {getModelDescription(rec.recommendedModel)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getConfidenceColor(rec.confidenceScore)}`}>
                      {Math.round(rec.confidenceScore * 100)}% confidence
                    </span>
                    {rec.accepted && (
                      <CheckCircle className="w-4 h-4 text-success-500" />
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-3">
                  {rec.recommendedHourlyRate && (
                    <div>
                      <p className="text-xs text-neutral-500">Recommended Rate</p>
                      <p className="font-semibold text-neutral-900">
                        R{rec.recommendedHourlyRate.toLocaleString()}/hour
                      </p>
                    </div>
                  )}
                  {rec.recommendedFixedFee && (
                    <div>
                      <p className="text-xs text-neutral-500">Fixed Fee</p>
                      <p className="font-semibold text-neutral-900">
                        R{rec.recommendedFixedFee.toLocaleString()}
                      </p>
                    </div>
                  )}
                  {rec.recommendedSuccessPercentage && (
                    <div>
                      <p className="text-xs text-neutral-500">Success Fee</p>
                      <p className="font-semibold text-neutral-900">
                        {(rec.recommendedSuccessPercentage * 100).toFixed(1)}%
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-neutral-500">Revenue Increase</p>
                    <p className="font-semibold text-success-600 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      R{rec.potentialRevenueIncrease.toLocaleString()}
                    </p>
                  </div>
                </div>

                {selectedModel === rec.id && (
                  <div className="mt-4 pt-4 border-t border-neutral-200 space-y-4">
                    {/* AI Rationale */}
                    {(rec as any).aiRationale && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Brain className="w-4 h-4 text-mpondo-gold-500" />
                          <h5 className="font-medium text-neutral-900">AI Analysis</h5>
                        </div>
                        <p className="text-sm text-neutral-700 bg-neutral-50 p-3 rounded-lg">
                          {(rec as any).aiRationale}
                        </p>
                      </div>
                    )}

                    {/* Optimization Factors */}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <BarChart3 className="w-4 h-4 text-judicial-blue-500" />
                        <h5 className="font-medium text-neutral-900">Optimization Factors</h5>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        {rec.optimizationFactors.urgency && (
                          <div className="flex justify-between">
                            <span className="text-neutral-600">Urgency:</span>
                            <span className="font-medium">{typeof rec.optimizationFactors.urgency === 'number' ? (rec.optimizationFactors.urgency * 100).toFixed(0) + '%' : rec.optimizationFactors.urgency}</span>
                          </div>
                        )}
                        {rec.optimizationFactors.complexity && (
                          <div className="flex justify-between">
                            <span className="text-neutral-600">Complexity:</span>
                            <span className="font-medium">{typeof rec.optimizationFactors.complexity === 'number' ? rec.optimizationFactors.complexity + '/10' : rec.optimizationFactors.complexity}</span>
                          </div>
                        )}
                        {rec.optimizationFactors.clientType && (
                          <div className="flex justify-between">
                            <span className="text-neutral-600">Client Type:</span>
                            <span className="font-medium">{rec.optimizationFactors.clientType}</span>
                          </div>
                        )}
                        {rec.optimizationFactors.marketPosition && (
                          <div className="flex justify-between">
                            <span className="text-neutral-600">Market Position:</span>
                            <span className="font-medium">{typeof rec.optimizationFactors.marketPosition === 'number' ? rec.optimizationFactors.marketPosition + '/10' : rec.optimizationFactors.marketPosition}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Implementation Steps */}
                    {(rec as any).implementationSteps && Array.isArray((rec as any).implementationSteps) && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Clock className="w-4 h-4 text-success-500" />
                          <h5 className="font-medium text-neutral-900">Implementation Steps</h5>
                        </div>
                        <ol className="text-sm space-y-1">
                          {(rec as any).implementationSteps.map((step: string, index: number) => (
                            <li key={index} className="flex items-start gap-2">
                              <span className="text-neutral-400 font-medium min-w-[20px]">{index + 1}.</span>
                              <span className="text-neutral-700">{step}</span>
                            </li>
                          ))}
                        </ol>
                      </div>
                    )}

                    {/* Risk Assessment */}
                    {(rec as any).riskAssessment && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Shield className="w-4 h-4 text-warning-500" />
                          <h5 className="font-medium text-neutral-900">Risk Assessment</h5>
                        </div>
                        <p className="text-sm text-neutral-700 bg-warning-50 p-3 rounded-lg border border-warning-200">
                          {(rec as any).riskAssessment}
                        </p>
                      </div>
                    )}

                    {/* Action Buttons */}
                    {!rec.accepted && (
                      <div className="flex gap-2 pt-2">
                        <Button
                          size="sm"
                          className="bg-mpondo-gold-600 hover:bg-mpondo-gold-700"
                          onClick={() => handleAcceptRecommendation(rec.id)}
                          disabled={acceptingRecommendation === rec.id}
                        >
                          {acceptingRecommendation === rec.id ? 'Accepting...' : 'Accept Recommendation'}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toast.info('Customization feature coming soon!')}
                        >
                          Customize
                        </Button>
                      </div>
                    )}

                    {rec.accepted && (
                      <div className="flex items-center gap-2 text-success-600 bg-success-50 p-3 rounded-lg">
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-sm font-medium">Recommendation accepted and applied</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
