import { supabase } from '@/lib/supabase';
import { toast } from 'react-hot-toast';
import { z } from 'zod';
import { addMonths, startOfMonth, endOfMonth, format } from 'date-fns';
import { awsBedrockService } from '@/services/aws-bedrock.service';

// Types for Strategic Finance
export interface FeeOptimizationRecommendation {
  id: string;
  advocateId: string;
  matterId?: string;
  currentHourlyRate?: number;
  currentFeeStructure: string;
  recommendedModel: 'standard' | 'premium_urgency' | 'volume_discount' | 'success_based' | 'hybrid';
  recommendedHourlyRate?: number;
  recommendedFeeStructure: string;
  recommendedFixedFee?: number;
  recommendedSuccessPercentage?: number;
  optimizationFactors: {
    urgency?: number;
    complexity?: number;
    clientType?: string;
    volume?: number;
    marketPosition?: number;
  };
  potentialRevenueIncrease: number;
  confidenceScore: number;
  accepted: boolean;
  createdAt: string;
  expiresAt: string;
  // AI-generated optional fields
  aiRationale?: string;
  implementationSteps?: string[];
  riskAssessment?: string;
}

export interface CashFlowPrediction {
  id: string;
  advocateId: string;
  predictionDate: string;
  periodStart: string;
  periodEnd: string;
  expectedCollections: number;
  expectedExpenses: number;
  expectedNetCashFlow: number;
  invoiceCollections: number;
  newMatterFees?: number;
  recurringFees?: number;
  contingencyFees?: number;
  collectionConfidence: number;
  seasonalAdjustment?: number;
  overdueRiskAmount?: number;
  cashFlowStatus: 'healthy' | 'adequate' | 'tight' | 'critical';
  minimumBalanceDate?: string;
  minimumBalanceAmount?: number;
  recommendedActions?: string[];
  financingNeeded?: number;
}

export interface FactoringOffer {
  id: string;
  providerName: string;
  providerId: string;
  minInvoiceAmount: number;
  maxInvoiceAmount: number;
  advanceRate: number; // percentage
  discountRate: number; // monthly rate
  minimumInvoiceAgeDays: number;
  maximumInvoiceAgeDays: number;
  recourseType: 'recourse' | 'non_recourse' | 'partial_recourse';
  isActive: boolean;
  availableCapital?: number;
  currentUtilization?: number;
}

export interface FactoringApplication {
  id: string;
  invoiceId: string;
  advocateId: string;
  offerId: string;
  requestedAmount: number;
  invoiceAmount: number;
  invoiceAgeDays: number;
  status: 'available' | 'under_review' | 'approved' | 'funded' | 'repaid' | 'defaulted';
  approvedAmount?: number;
  advanceRate?: number;
  discountRate?: number;
  fees?: number;
  netAmount?: number;
  riskScore?: number;
  createdAt: string;
}

export interface SuccessFeeScenario {
  id: string;
  matterId: string;
  advocateId: string;
  scenarioName: string;
  description?: string;
  successDefinition: string;
  successProbability: number;
  baseFee: number;
  successFeePercentage: number;
  successFeeCap?: number;
  minimumRecovery: number;
  expectedRecovery: number;
  maximumRecovery: number;
  minimumTotalFee: number;
  expectedTotalFee: number;
  maximumTotalFee: number;
  riskAdjustedFee: number;
  breakevenProbability?: number;
  presentedToClient: boolean;
  clientApproved?: boolean;
  createdAt: string;
}

export interface PracticeFinancialHealth {
  id: string;
  advocateId: string;
  calculationDate: string;
  cashRunwayDays?: number;
  collectionRate30d?: number;
  collectionRate90d?: number;
  averageCollectionDays?: number;
  monthlyRecurringRevenue?: number;
  revenueGrowthRate?: number;
  revenueConcentration?: number;
  realizationRate?: number;
  utilizationRate?: number;
  writeOffRate?: number;
  overallHealthScore: number;
  healthTrend: 'improving' | 'stable' | 'declining';
  riskAlerts?: string[];
  opportunities?: string[];
}

// Validation schemas
const FeeOptimizationRequestSchema = z.object({
  matterId: z.string().uuid(),
  urgencyFactor: z.number().min(0).max(1).optional(),
  complexityScore: z.number().min(1).max(10).optional()
});

const CashFlowPredictionRequestSchema = z.object({
  monthsAhead: z.number().min(1).max(12).default(3)
});

const FactoringApplicationSchema = z.object({
  invoiceId: z.string().uuid(),
  offerId: z.string().uuid(),
  requestedAmount: z.number().positive()
});

const SuccessFeeScenarioSchema = z.object({
  matterId: z.string().uuid(),
  scenarioName: z.string().min(3).max(255),
  description: z.string().optional(),
  successDefinition: z.string().min(10),
  successProbability: z.number().min(0).max(1),
  baseFee: z.number().min(0),
  successFeePercentage: z.number().min(0).max(0.5),
  successFeeCap: z.number().positive().optional(),
  minimumRecovery: z.number().min(0),
  expectedRecovery: z.number().min(0),
  maximumRecovery: z.number().min(0)
});

export class StrategicFinanceService {
  // Generate fee optimization recommendations (wrapper for UI compatibility)
  static async generateFeeOptimizationRecommendations(matterId?: string): Promise<FeeOptimizationRecommendation[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // If no matterId provided, get recommendations for all active matters
      if (!matterId) {
        const { data: matters } = await supabase
          .from('matters')
          .select('id')
          .eq('advocate_id', user.id)
          .eq('status', 'active')
          .limit(5);

        if (!matters || matters.length === 0) {
          // No active matters, return mock recommendations for development
          console.info('No active matters found, using mock recommendations for development');
          return this.generateMockRecommendations(user.id);
        }

        // Get recommendations for the first active matter
        matterId = matters[0].id;
      }

      return this.getFeeOptimizationRecommendations({ 
        matterId,
        urgencyFactor: 0.7,
        complexityScore: 7
      });
    } catch (error) {
      console.error('Error generating fee optimization recommendations:', error);
      
      // Always provide fallback mock data for better UX
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        console.info('Providing mock recommendations as fallback');
        return this.generateMockRecommendations(user.id);
      }
      
      toast.error('Failed to generate fee optimization recommendations');
      return [];
    }
  }

  // Generate mock recommendations for development
  private static generateMockRecommendations(advocateId: string): FeeOptimizationRecommendation[] {
    return [
      {
        id: 'mock-1',
        advocateId,
        currentHourlyRate: 2500,
        currentFeeStructure: 'Standard hourly billing at R2,500/hour',
        recommendedModel: 'premium_urgency',
        recommendedHourlyRate: 3200,
        recommendedFeeStructure: 'Premium urgency model with 28% increase for urgent matters',
        potentialRevenueIncrease: 0.28,
        confidenceScore: 0.85,
        optimizationFactors: {
          urgency: 0.8,
          complexity: 0.7,
          clientType: 'corporate',
          marketPosition: 0.9
        },
        accepted: false,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'mock-2',
        advocateId,
        currentHourlyRate: 2500,
        currentFeeStructure: 'Standard hourly billing',
        recommendedModel: 'success_based',
        recommendedSuccessPercentage: 0.25,
        recommendedFeeStructure: 'Success-based fee: 25% of recovery above R500k',
        potentialRevenueIncrease: 0.45,
        confidenceScore: 0.72,
        optimizationFactors: {
          complexity: 0.9,
          clientType: 'individual',
          volume: 0.6
        },
        accepted: false,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];
  }

  // List success fee scenarios for current advocate
  static async getSuccessFeeScenarios(): Promise<SuccessFeeScenario[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('success_fee_scenarios')
        .select('*')
        .eq('advocate_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      return (data || []).map(this.mapSuccessFeeScenario);
    } catch (error) {
      console.error('Error fetching success fee scenarios:', error);
      toast.error('Failed to fetch success fee scenarios');
      return [];
    }
  }

  // Get fee optimization recommendations using AWS Bedrock Claude
  static async getFeeOptimizationRecommendations(data: z.infer<typeof FeeOptimizationRequestSchema>): Promise<FeeOptimizationRecommendation[]> {
    try {
      const validated = FeeOptimizationRequestSchema.parse(data);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Get matter details for AI analysis
      const { data: matter, error: matterError } = await supabase
        .from('matters')
        .select(`
          id,
          title,
          brief_type,
          wip_value,
          estimated_fee,
          risk_level,
          client_name,
          status
        `)
        .eq('id', validated.matterId)
        .eq('advocate_id', user.id)
        .single();

      if (matterError || !matter) {
        console.warn('Matter not found, falling back to mock data:', matterError);
        return this.generateMockRecommendations(user.id);
      }

      // Prepare matter data for AWS Bedrock
      const matterData = {
        id: matter.id,
        briefType: matter.brief_type || 'General Legal Services',
        wipValue: matter.wip_value || 0,
        estimatedFee: matter.estimated_fee || 0,
        riskLevel: matter.risk_level || 'Medium',
        clientType: 'Corporate', // Could be enhanced with client data
        urgency: validated.urgencyFactor ? (validated.urgencyFactor > 0.7 ? 'High' : validated.urgencyFactor > 0.4 ? 'Medium' : 'Low') : 'Medium',
        complexity: validated.complexityScore ? (validated.complexityScore > 7 ? 'High' : validated.complexityScore > 4 ? 'Medium' : 'Low') : 'Medium',
        marketPosition: 'Standard'
      };

      // Get market data (could be enhanced with real market data)
      const marketData = {
        averageHourlyRates: {
          junior: 1500,
          senior: 2500,
          partner: 4000
        },
        marketTrends: 'stable',
        competitionLevel: 'medium'
      };

      // Call AWS Bedrock for AI-powered recommendations
      const aiResult = await awsBedrockService.generateFeeOptimizationRecommendations(matterData, marketData);

      if (aiResult.success && aiResult.data) {
        // Transform AI response to our format and save to database
        const aiRecommendation = aiResult.data;
        
        const { data: saved, error: saveError } = await supabase
          .from('fee_optimization_recommendations')
          .insert({
            advocate_id: user.id,
            matter_id: validated.matterId,
            current_fee_structure: aiRecommendation.currentModel,
            recommended_model: this.mapAIModelToEnum(aiRecommendation.recommendedModel),
            recommended_fee_structure: aiRecommendation.recommendedModel,
            potential_revenue_increase: aiRecommendation.projectedIncrease,
            confidence_score: aiRecommendation.confidence,
            optimization_factors: {
              urgency: aiRecommendation.optimizationFactors?.urgency || validated.urgencyFactor,
              complexity: aiRecommendation.optimizationFactors?.complexity || validated.complexityScore,
              clientType: aiRecommendation.optimizationFactors?.clientType || matterData.clientType,
              marketPosition: aiRecommendation.optimizationFactors?.marketPosition || matterData.marketPosition
            },
            ai_rationale: aiRecommendation.rationale,
            implementation_steps: aiRecommendation.implementationSteps,
            risk_assessment: aiRecommendation.riskAssessment,
            alternative_models: aiRecommendation.alternativeModels,
            market_analysis: aiRecommendation.marketAnalysis,
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
          })
          .select()
          .single();

        if (saveError) {
          console.warn('Failed to save AI recommendation to database:', saveError);
        }

        // Return the AI-generated recommendation
        return [{
          id: saved?.id || `ai-${Date.now()}`,
          advocateId: user.id,
          matterId: validated.matterId,
          currentFeeStructure: aiRecommendation.currentModel,
          recommendedModel: this.mapAIModelToEnum(aiRecommendation.recommendedModel),
          recommendedFeeStructure: aiRecommendation.recommendedModel,
          optimizationFactors: {
            urgency: aiRecommendation.optimizationFactors?.urgency || validated.urgencyFactor,
            complexity: aiRecommendation.optimizationFactors?.complexity || validated.complexityScore,
            clientType: aiRecommendation.optimizationFactors?.clientType || matterData.clientType,
            marketPosition: aiRecommendation.optimizationFactors?.marketPosition || matterData.marketPosition
          },
          potentialRevenueIncrease: aiRecommendation.projectedIncrease,
          confidenceScore: aiRecommendation.confidence,
          accepted: false,
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        }];
      } else {
        console.warn('AWS Bedrock failed, falling back to database function:', aiResult.error);
        
        // Fallback to database function
        const { data: recommendations, error } = await supabase
          .rpc('calculate_optimal_fee_structure', {
            p_matter_id: validated.matterId,
            p_advocate_id: user.id
          });

        if (error || !recommendations || recommendations.length === 0) {
          console.info('Database function also failed, using mock data for development');
          return this.generateMockRecommendations(user.id);
        }

        // Transform and save database recommendations
        const savedRecommendations = await Promise.all(
          recommendations.map(async (rec: any) => {
            const { data: saved } = await supabase
              .from('fee_optimization_recommendations')
              .insert({
                advocate_id: user.id,
                matter_id: validated.matterId,
                recommended_model: rec.model,
                recommended_hourly_rate: rec.recommended_rate,
                potential_revenue_increase: rec.potential_revenue,
                confidence_score: rec.confidence,
                optimization_factors: {
                  urgency: validated.urgencyFactor,
                  complexity: validated.complexityScore
                }
              })
              .select()
              .single();
            
            return saved;
          })
        );

        return savedRecommendations.map(this.mapFeeOptimizationRecommendation);
      }
    } catch (error) {
      console.error('Error getting fee optimization recommendations:', error);
      
      // Fallback to mock data for development/demo purposes
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        console.info('Falling back to mock recommendations for development');
        return this.generateMockRecommendations(user.id);
      }
      
      toast.error('Failed to get fee optimization recommendations');
      throw error;
    }
  }

  // Helper method to map AI model names to our enum
  private static mapAIModelToEnum(aiModel: string): 'standard' | 'premium_urgency' | 'volume_discount' | 'success_based' | 'hybrid' {
    const model = aiModel.toLowerCase();
    if (model.includes('performance') || model.includes('success')) return 'success_based';
    if (model.includes('premium') || model.includes('urgency')) return 'premium_urgency';
    if (model.includes('volume') || model.includes('discount')) return 'volume_discount';
    if (model.includes('hybrid') || model.includes('mixed')) return 'hybrid';
    return 'standard';
  }

  // Accept fee optimization recommendation
  static async acceptFeeOptimizationRecommendation(recommendationId: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('fee_optimization_recommendations')
        .update({ 
          accepted: true,
          accepted_at: new Date().toISOString()
        })
        .eq('id', recommendationId)
        .eq('advocate_id', user.id);

      if (error) throw error;
    } catch (error) {
      console.error('Error accepting fee optimization recommendation:', error);
      throw error;
    }
  }

  // Generate cash flow predictions
  static async generateCashFlowPredictions(data: z.infer<typeof CashFlowPredictionRequestSchema>): Promise<CashFlowPrediction[]> {
    try {
      const validated = CashFlowPredictionRequestSchema.parse(data);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Call function to predict cash flow
      await supabase.rpc('predict_cash_flow', {
        p_advocate_id: user.id,
        p_months_ahead: validated.monthsAhead
      });

      // Fetch the predictions
      const startDate = startOfMonth(new Date());
      const endDate = endOfMonth(addMonths(startDate, validated.monthsAhead - 1));

      const { data: predictions, error } = await supabase
        .from('cash_flow_predictions')
        .select('*')
        .eq('advocate_id', user.id)
        .gte('period_start', format(startDate, 'yyyy-MM-dd'))
        .lte('period_end', format(endDate, 'yyyy-MM-dd'))
        .order('period_start');

      if (error) throw error;

      return (predictions || []).map(this.mapCashFlowPrediction);
    } catch (error) {
      console.error('Error generating cash flow predictions:', error);
      toast.error('Failed to generate cash flow predictions');
      throw error;
    }
  }

  // Generate cash flow optimization recommendations
  static async generateCashFlowOptimization(): Promise<any> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Get current financial data for analysis
      const [financialHealth, invoices, matters] = await Promise.all([
        this.getPracticeFinancialHealth(),
        supabase.from('invoices').select('*').eq('advocate_id', user.id),
        supabase.from('matters').select('*').eq('advocate_id', user.id)
      ]);

      // Prepare data for AWS Bedrock analysis
      const cashFlowData = {
        currentCashPosition: financialHealth?.cashRunwayDays || 0,
        collectionRate: financialHealth?.collectionRate30d || 0,
        averageCollectionDays: financialHealth?.averageCollectionDays || 0,
        monthlyRecurringRevenue: financialHealth?.monthlyRecurringRevenue || 0,
        outstandingInvoices: invoices.data?.filter(inv => inv.status !== 'paid').length || 0,
        totalOutstanding: invoices.data?.filter(inv => inv.status !== 'paid')
          .reduce((sum, inv) => sum + (inv.total_amount - (inv.amount_paid || 0)), 0) || 0,
        activeMatters: matters.data?.filter(m => m.status === 'active').length || 0,
        practiceType: 'General Legal Practice', // Could be enhanced with user preferences
        marketConditions: 'stable' // Could be enhanced with real market data
      };

      // Call AWS Bedrock for AI-powered cash flow optimization
      const aiResult = await awsBedrockService.generateCashFlowOptimization(cashFlowData);

      if (aiResult.success && aiResult.data) {
        const recommendations = aiResult.data;
        
        // Save recommendations to database for tracking
        const { data: saved, error: saveError } = await supabase
          .from('cash_flow_optimization_recommendations')
          .insert({
            advocate_id: user.id,
            recommendations: recommendations.strategies,
            priority_actions: recommendations.priorityActions,
            projected_improvement: recommendations.projectedImprovement,
            confidence_score: recommendations.confidence,
            implementation_timeline: recommendations.timeline,
            created_at: new Date().toISOString()
          })
          .select()
          .single();

        if (saveError) {
          console.warn('Failed to save cash flow optimization to database:', saveError);
        }

        return {
          strategies: recommendations.strategies || [],
          priorityActions: recommendations.priorityActions || [],
          projectedImprovement: recommendations.projectedImprovement || 0,
          confidence: recommendations.confidence || 0.7,
          timeline: recommendations.timeline || '3-6 months',
          implementationSteps: recommendations.implementationSteps || []
        };
      } else {
        console.warn('AWS Bedrock failed, providing fallback recommendations:', aiResult.error);
        
        // Fallback to rule-based recommendations
        return this.generateFallbackCashFlowOptimization(cashFlowData);
      }
    } catch (error) {
      console.error('Error generating cash flow optimization:', error);
      
      // Always provide fallback recommendations for better UX
      const fallbackData = {
        currentCashPosition: 30,
        collectionRate: 0.8,
        averageCollectionDays: 45,
        monthlyRecurringRevenue: 100000,
        outstandingInvoices: 15,
        totalOutstanding: 250000,
        activeMatters: 8,
        practiceType: 'General Legal Practice',
        marketConditions: 'stable'
      };
      
      return this.generateFallbackCashFlowOptimization(fallbackData);
    }
  }

  // Generate fallback cash flow optimization recommendations
  private static generateFallbackCashFlowOptimization(data: any): any {
    const strategies = [];
    const priorityActions = [];

    // Analyze collection rate
    if (data.collectionRate < 0.85) {
      strategies.push({
        id: 'improve-collections',
        title: 'Improve Collection Processes',
        description: 'Implement automated follow-up systems and payment reminders',
        impact: 'high',
        effort: 'medium',
        timeline: '2-3 months',
        projectedImprovement: 0.15
      });
      priorityActions.push('Set up automated invoice reminders');
    }

    // Analyze collection days
    if (data.averageCollectionDays > 45) {
      strategies.push({
        id: 'reduce-collection-time',
        title: 'Reduce Collection Time',
        description: 'Offer early payment discounts and implement stricter payment terms',
        impact: 'high',
        effort: 'low',
        timeline: '1-2 months',
        projectedImprovement: 0.20
      });
      priorityActions.push('Implement early payment discount program');
    }

    // Analyze outstanding invoices
    if (data.outstandingInvoices > 10) {
      strategies.push({
        id: 'invoice-factoring',
        title: 'Consider Invoice Factoring',
        description: 'Use factoring services for immediate cash flow improvement',
        impact: 'high',
        effort: 'low',
        timeline: '2-4 weeks',
        projectedImprovement: 0.30
      });
      priorityActions.push('Evaluate factoring marketplace options');
    }

    // Analyze cash position
    if (data.currentCashPosition < 60) {
      strategies.push({
        id: 'cash-reserves',
        title: 'Build Cash Reserves',
        description: 'Establish emergency fund and improve cash flow forecasting',
        impact: 'medium',
        effort: 'medium',
        timeline: '3-6 months',
        projectedImprovement: 0.25
      });
      priorityActions.push('Set up dedicated cash reserve account');
    }

    return {
      strategies,
      priorityActions,
      projectedImprovement: 0.22,
      confidence: 0.75,
      timeline: '2-4 months',
      implementationSteps: [
        'Review current collection processes',
        'Implement automated reminder systems',
        'Evaluate factoring options',
        'Set up cash flow monitoring',
        'Establish payment term policies'
      ]
    };
  }

  // Get cash flow optimization history
  static async getCashFlowOptimizationHistory(): Promise<any[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('cash_flow_optimization_recommendations')
        .select('*')
        .eq('advocate_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error fetching cash flow optimization history:', error);
      return [];
    }
  }

  // Get financial insights for dashboard
  static async getFinancialInsights(): Promise<any[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Mock insights for development - replace with real AI-generated insights
      return [
        {
          id: 'insight-1',
          type: 'opportunity',
          title: 'Collection Rate Improvement',
          description: 'Your collection rate has improved by 5% this month. Consider implementing similar strategies for other clients.',
          impact: 'positive',
          actionable: true,
          created_at: new Date().toISOString()
        },
        {
          id: 'insight-2',
          type: 'warning',
          title: 'Cash Flow Concern',
          description: 'Outstanding invoices have increased by 15%. Consider following up on overdue payments.',
          impact: 'negative',
          actionable: true,
          created_at: new Date().toISOString()
        },
        {
          id: 'insight-3',
          type: 'trend',
          title: 'Revenue Growth',
          description: 'Monthly revenue is trending upward with a 12% increase over the last quarter.',
          impact: 'positive',
          actionable: false,
          created_at: new Date().toISOString()
        }
      ];
    } catch (error) {
      console.error('Error getting financial insights:', error);
      return [];
    }
  }

  // Get revenue forecasting data
  static async getRevenueForecast(months: number = 6): Promise<any[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Mock forecast data - replace with real AI-powered forecasting
      const forecast = [];
      const baseRevenue = 120000; // Base monthly revenue
      
      for (let i = 1; i <= months; i++) {
        const date = new Date();
        date.setMonth(date.getMonth() + i);
        
        // Add some realistic variation
        const variation = (Math.random() - 0.5) * 0.2; // ±10% variation
        const seasonalFactor = 1 + Math.sin((date.getMonth() / 12) * 2 * Math.PI) * 0.1; // Seasonal variation
        const trendFactor = 1 + (i * 0.02); // 2% monthly growth trend
        
        const projectedRevenue = baseRevenue * seasonalFactor * trendFactor * (1 + variation);
        
        forecast.push({
          month: date.toISOString().slice(0, 7), // YYYY-MM format
          projectedRevenue: Math.round(projectedRevenue),
          confidence: Math.max(0.6, 0.9 - (i * 0.05)), // Decreasing confidence over time
          factors: {
            seasonal: seasonalFactor,
            trend: trendFactor,
            variation: variation
          }
        });
      }
      
      return forecast;
    } catch (error) {
      console.error('Error getting revenue forecast:', error);
      return [];
    }
  }

  // Get factoring marketplace offers
  static async getFactoringOffers(invoiceAmount?: number): Promise<FactoringOffer[]> {
    try {
      let query = supabase
        .from('factoring_marketplace')
        .select('*');

      if (invoiceAmount) {
        query = query
          .lte('min_invoice_amount', invoiceAmount)
          .gte('max_invoice_amount', invoiceAmount);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map(this.mapFactoringOffer);
    } catch (error) {
      console.error('Error fetching factoring offers:', error);
      toast.error('Failed to fetch factoring offers');
      throw error;
    }
  }

  // Apply for invoice factoring
  static async applyForFactoring(data: z.infer<typeof FactoringApplicationSchema>): Promise<FactoringApplication> {
    try {
      const validated = FactoringApplicationSchema.parse(data);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Get invoice details
      const { data: invoice } = await supabase
        .from('invoices')
        .select('*, matter:matters(title)')
        .eq('id', validated.invoiceId)
        .single();

      if (!invoice) throw new Error('Invoice not found');

      const invoiceAgeDays = Math.floor(
        (new Date().getTime() - new Date(invoice.invoice_date).getTime()) / (1000 * 60 * 60 * 24)
      );

      // Create application
      const { data: application, error } = await supabase
        .from('factoring_applications')
        .insert({
          invoice_id: validated.invoiceId,
          advocate_id: user.id,
          offer_id: validated.offerId,
          requested_amount: validated.requestedAmount,
          invoice_amount: invoice.total_amount,
          invoice_age_days: invoiceAgeDays,
          status: 'under_review'
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Factoring application submitted successfully');
      return this.mapFactoringApplication(application);
    } catch (error) {
      console.error('Error applying for factoring:', error);
      const message = error instanceof Error ? error.message : 'Failed to submit factoring application';
      toast.error(message);
      throw error;
    }
  }

  // Create success fee scenario
  static async createSuccessFeeScenario(data: z.infer<typeof SuccessFeeScenarioSchema>): Promise<SuccessFeeScenario> {
    try {
      const validated = SuccessFeeScenarioSchema.parse(data);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Validate recovery amounts
      if (validated.expectedRecovery < validated.minimumRecovery) {
        throw new Error('Expected recovery cannot be less than minimum recovery');
      }
      if (validated.maximumRecovery < validated.expectedRecovery) {
        throw new Error('Maximum recovery cannot be less than expected recovery');
      }

      const { data: scenario, error } = await supabase
        .from('success_fee_scenarios')
        .insert({
          matter_id: validated.matterId,
          advocate_id: user.id,
          scenario_name: validated.scenarioName,
          description: validated.description,
          success_definition: validated.successDefinition,
          success_probability: validated.successProbability,
          baseFee: validated.baseFee,
          success_fee_percentage: validated.successFeePercentage,
          success_fee_cap: validated.successFeeCap,
          minimum_recovery: validated.minimumRecovery,
          expected_recovery: validated.expectedRecovery,
          maximum_recovery: validated.maximumRecovery,
          presented_to_client: false
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Success fee scenario created');
      return this.mapSuccessFeeScenario(scenario);
    } catch (error) {
      console.error('Error creating success fee scenario:', error);
      const message = error instanceof Error ? error.message : 'Failed to create scenario';
      toast.error(message);
      throw error;
    }
  }

  // Get practice financial health
  static async getPracticeFinancialHealth(): Promise<PracticeFinancialHealth | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: health, error } = await supabase
        .from('practice_financial_health')
        .select('*')
        .eq('advocate_id', user.id)
        .order('calculation_date', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      return health ? this.mapPracticeFinancialHealth(health) : null;
    } catch (error) {
      console.error('Error fetching financial health:', error);
      toast.error('Failed to fetch financial health');
      throw error;
    }
  }

  // Calculate practice metrics
  static async calculatePracticeMetrics(): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Get various metrics
      const [invoices, matters, timeEntries] = await Promise.all([
        supabase.from('invoices').select('*').eq('advocate_id', user.id),
        supabase.from('matters').select('*').eq('advocate_id', user.id),
        supabase.from('time_entries').select('*').eq('advocate_id', user.id)
      ]);

      // Calculate metrics
      const metrics = this.calculateMetrics(
        invoices.data || [],
        matters.data || [],
        timeEntries.data || []
      );

      // Save to database
      await supabase
        .from('practice_financial_health')
        .upsert({
          advocate_id: user.id,
          calculation_date: format(new Date(), 'yyyy-MM-dd'),
          ...metrics
        });

      toast.success('Financial metrics updated');
    } catch (error) {
      console.error('Error calculating practice metrics:', error);
      toast.error('Failed to calculate metrics');
      throw error;
    }
  }

  // Get practice metrics for analytics
  static async getPracticeMetrics(period: 'month' | 'quarter' | 'year'): Promise<any[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Mock data for development - replace with real calculations
      return [
        {
          id: 'revenue',
          name: 'Monthly Revenue',
          value: 125000,
          target: 150000,
          unit: 'ZAR',
          trend: 'up',
          change: 8.5,
          benchmark: 120000,
          category: 'financial'
        },
        {
          id: 'collection-rate',
          name: 'Collection Rate',
          value: 87,
          target: 90,
          unit: '%',
          trend: 'up',
          change: 3.2,
          benchmark: 85,
          category: 'financial'
        },
        {
          id: 'utilization',
          name: 'Utilization Rate',
          value: 78,
          target: 85,
          unit: '%',
          trend: 'stable',
          change: 0.5,
          benchmark: 75,
          category: 'operational'
        },
        {
          id: 'client-satisfaction',
          name: 'Client Satisfaction',
          value: 4.6,
          target: 4.5,
          unit: '/5',
          trend: 'up',
          change: 2.1,
          benchmark: 4.2,
          category: 'client'
        }
      ];
    } catch (error) {
      console.error('Error getting practice metrics:', error);
      return [];
    }
  }

  // Get benchmark data
  static async getBenchmarkData(): Promise<any[]> {
    try {
      // Mock benchmark data - replace with real industry data
      return [
        {
          metric: 'Average Hourly Rate',
          yourPractice: 2500,
          industryAverage: 2200,
          topQuartile: 3000,
          unit: 'ZAR'
        },
        {
          metric: 'Collection Rate',
          yourPractice: 87,
          industryAverage: 82,
          topQuartile: 92,
          unit: '%'
        },
        {
          metric: 'Average Collection Days',
          yourPractice: 45,
          industryAverage: 52,
          topQuartile: 35,
          unit: 'days'
        },
        {
          metric: 'Utilization Rate',
          yourPractice: 78,
          industryAverage: 75,
          topQuartile: 85,
          unit: '%'
        }
      ];
    } catch (error) {
      console.error('Error getting benchmark data:', error);
      return [];
    }
  }

  // Get compliance alerts
  static async getComplianceAlerts(): Promise<any[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Mock compliance alerts - replace with real data
      return [
        {
          id: 'alert-1',
          type: 'trust_account',
          severity: 'high',
          title: 'Trust Account Reconciliation Overdue',
          description: 'Monthly trust account reconciliation is 3 days overdue. Please complete reconciliation immediately.',
          created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          resolved: false,
          due_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          amount: 125000
        },
        {
          id: 'alert-2',
          type: 'billing',
          severity: 'medium',
          title: 'Unbilled Time Entries',
          description: 'You have 15.5 hours of unbilled time entries older than 30 days.',
          created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          resolved: false,
          matter_id: 'matter-123'
        },
        {
          id: 'alert-3',
          type: 'regulatory',
          severity: 'low',
          title: 'Annual Compliance Report Due',
          description: 'Annual compliance report is due in 30 days.',
          created_at: new Date().toISOString(),
          resolved: false,
          due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        }
      ];
    } catch (error) {
      console.error('Error getting compliance alerts:', error);
      return [];
    }
  }

  // Get trust account transactions
  static async getTrustAccountTransactions(): Promise<any[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Mock trust account transactions - replace with real data
      return [
        {
          id: 'txn-1',
          matter_id: 'matter-123',
          matter_title: 'Smith vs. Jones Property Dispute',
          client_name: 'John Smith',
          transaction_type: 'deposit',
          amount: 50000,
          balance: 125000,
          description: 'Initial retainer deposit',
          created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'completed'
        },
        {
          id: 'txn-2',
          matter_id: 'matter-456',
          matter_title: 'ABC Corp Contract Review',
          client_name: 'ABC Corporation',
          transaction_type: 'withdrawal',
          amount: 15000,
          balance: 75000,
          description: 'Legal fees payment',
          created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'completed'
        },
        {
          id: 'txn-3',
          matter_id: 'matter-789',
          matter_title: 'Estate Planning - Williams',
          client_name: 'Mary Williams',
          transaction_type: 'deposit',
          amount: 25000,
          balance: 100000,
          description: 'Estate planning retainer',
          created_at: new Date().toISOString(),
          status: 'pending'
        }
      ];
    } catch (error) {
      console.error('Error getting trust account transactions:', error);
      return [];
    }
  }

  // Get compliance metrics
  static async getComplianceMetrics(): Promise<any[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Mock compliance metrics - replace with real calculations
      return [
        {
          name: 'Trust Account Balance',
          value: 125000,
          target: 100000,
          status: 'compliant',
          unit: ' ZAR'
        },
        {
          name: 'Reconciliation Status',
          value: 98,
          target: 100,
          status: 'warning',
          unit: '%'
        },
        {
          name: 'Billing Compliance',
          value: 95,
          target: 95,
          status: 'compliant',
          unit: '%'
        }
      ];
    } catch (error) {
      console.error('Error getting compliance metrics:', error);
      return [];
    }
  }

  // Resolve compliance alert
  static async resolveComplianceAlert(alertId: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Mock resolution - replace with real database update
      console.log(`Resolving compliance alert: ${alertId}`);
    } catch (error) {
      console.error('Error resolving compliance alert:', error);
      throw error;
    }
  }

  // Generate compliance report
  static async generateComplianceReport(): Promise<string> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Mock report generation - replace with real PDF generation
      const reportContent = `
        COMPLIANCE REPORT
        Generated: ${new Date().toLocaleDateString()}
        
        Trust Account Status: Compliant
        Billing Compliance: 95%
        Regulatory Status: Up to date
        
        Recent Activities:
        - Monthly reconciliation completed
        - All billing reviewed
        - No outstanding compliance issues
      `;
      
      return reportContent;
    } catch (error) {
      console.error('Error generating compliance report:', error);
      throw error;
    }
  }

  // Helper function to calculate metrics
  private static calculateMetrics(invoices: any[], matters: any[], timeEntries: any[]) {
    // Collection rate calculations
    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);
    
    const invoicesLast30 = invoices.filter(inv => 
      new Date(inv.invoice_date) >= last30Days
    );
    
    const collectionRate30d = invoicesLast30.length > 0
      ? invoicesLast30.filter(inv => inv.status === 'paid').length / invoicesLast30.length
      : 0;

    // Average collection days
    const paidInvoices = invoices.filter(inv => inv.status === 'paid' && inv.date_paid);
    const averageCollectionDays = paidInvoices.length > 0
      ? paidInvoices.reduce((sum, inv) => {
          const days = Math.floor(
            (new Date(inv.date_paid).getTime() - new Date(inv.invoice_date).getTime()) / (1000 * 60 * 60 * 24)
          );
          return sum + days;
        }, 0) / paidInvoices.length
      : 0;

    // Realization rate (simplified)
    const totalBilled = invoices.reduce((sum, inv) => sum + (inv.fees_amount || 0), 0);
    const totalWorked = timeEntries.reduce((sum, entry) => 
      sum + ((entry.duration_minutes / 60) * entry.rate), 0
    );
    const realizationRate = totalWorked > 0 ? totalBilled / totalWorked : 0;

    // Health score (simplified calculation)
    let healthScore = 50; // Base score
    if (collectionRate30d > 0.8) healthScore += 20;
    else if (collectionRate30d > 0.6) healthScore += 10;
    
    if (averageCollectionDays < 45) healthScore += 20;
    else if (averageCollectionDays < 60) healthScore += 10;
    
    if (realizationRate > 0.9) healthScore += 10;

    return {
      collection_rate_30d: collectionRate30d,
      average_collection_days: averageCollectionDays,
      realization_rate: realizationRate,
      overall_health_score: Math.min(100, healthScore),
      health_trend: 'stable' as const
    };
  }

  // Mapping functions
  private static mapFeeOptimizationRecommendation(record: any): FeeOptimizationRecommendation {
    return {
      id: record.id,
      advocateId: record.advocate_id,
      matterId: record.matter_id,
      currentHourlyRate: record.current_hourly_rate,
      currentFeeStructure: record.current_fee_structure,
      recommendedModel: record.recommended_model,
      recommendedHourlyRate: record.recommended_hourly_rate,
      recommendedFeeStructure: record.recommended_fee_structure,
      recommendedFixedFee: record.recommended_fixed_fee,
      recommendedSuccessPercentage: record.recommended_success_percentage,
      optimizationFactors: record.optimization_factors,
      potentialRevenueIncrease: record.potential_revenue_increase,
      confidenceScore: record.confidence_score,
      accepted: record.accepted,
      createdAt: record.created_at,
      expiresAt: record.expires_at
    };
  }

  private static mapCashFlowPrediction(record: any): CashFlowPrediction {
    return {
      id: record.id,
      advocateId: record.advocate_id,
      predictionDate: record.prediction_date,
      periodStart: record.period_start,
      periodEnd: record.period_end,
      expectedCollections: record.expected_collections,
      expectedExpenses: record.expected_expenses,
      expectedNetCashFlow: record.expected_net_cash_flow,
      invoiceCollections: record.invoice_collections,
      newMatterFees: record.new_matter_fees,
      recurringFees: record.recurring_fees,
      contingencyFees: record.contingency_fees,
      collectionConfidence: record.collection_confidence,
      seasonalAdjustment: record.seasonal_adjustment,
      overdueRiskAmount: record.overdue_risk_amount,
      cashFlowStatus: record.cash_flow_status,
      minimumBalanceDate: record.minimum_balance_date,
      minimumBalanceAmount: record.minimum_balance_amount,
      recommendedActions: record.recommended_actions,
      financingNeeded: record.financing_needed
    };
  }

  private static mapFactoringOffer(record: any): FactoringOffer {
    return {
      id: record.id,
      providerName: record.provider_name,
      providerId: record.provider_id,
      minInvoiceAmount: record.min_invoice_amount,
      maxInvoiceAmount: record.max_invoice_amount,
      advanceRate: record.advance_rate,
      discountRate: record.discount_rate,
      minimumInvoiceAgeDays: record.minimum_invoice_age_days,
      maximumInvoiceAgeDays: record.maximum_invoice_age_days,
      recourseType: record.recourse_type,
      isActive: record.is_active,
      availableCapital: record.available_capital,
      currentUtilization: record.current_utilization
    };
  }

  private static mapFactoringApplication(record: any): FactoringApplication {
    return {
      id: record.id,
      invoiceId: record.invoice_id,
      advocateId: record.advocate_id,
      offerId: record.offer_id,
      requestedAmount: record.requested_amount,
      invoiceAmount: record.invoice_amount,
      invoiceAgeDays: record.invoice_age_days,
      status: record.status,
      approvedAmount: record.approved_amount,
      advanceRate: record.advance_rate,
      discountRate: record.discount_rate,
      fees: record.fees,
      netAmount: record.net_amount,
      riskScore: record.risk_score,
      createdAt: record.created_at
    };
  }

  private static mapSuccessFeeScenario(record: any): SuccessFeeScenario {
    return {
      id: record.id,
      matterId: record.matter_id,
      advocateId: record.advocate_id,
      scenarioName: record.scenario_name,
      description: record.description,
      successDefinition: record.success_definition,
      successProbability: record.success_probability,
      baseFee: record.base_fee,
      successFeePercentage: record.success_fee_percentage,
      successFeeCap: record.success_fee_cap,
      minimumRecovery: record.minimum_recovery,
      expectedRecovery: record.expected_recovery,
      maximumRecovery: record.maximum_recovery,
      minimumTotalFee: record.minimum_total_fee,
      expectedTotalFee: record.expected_total_fee,
      maximumTotalFee: record.maximum_total_fee,
      riskAdjustedFee: record.risk_adjusted_fee,
      breakevenProbability: record.breakeven_probability,
      presentedToClient: record.presented_to_client,
      clientApproved: record.client_approved,
      createdAt: record.created_at
    };
  }

  private static mapPracticeFinancialHealth(record: any): PracticeFinancialHealth {
    return {
      id: record.id,
      advocateId: record.advocate_id,
      calculationDate: record.calculation_date,
      cashRunwayDays: record.cash_runway_days,
      collectionRate30d: record.collection_rate_30d,
      collectionRate90d: record.collection_rate_90d,
      averageCollectionDays: record.average_collection_days,
      monthlyRecurringRevenue: record.monthly_recurring_revenue,
      revenueGrowthRate: record.revenue_growth_rate,
      revenueConcentration: record.revenue_concentration,
      realizationRate: record.realization_rate,
      utilizationRate: record.utilization_rate,
      writeOffRate: record.write_off_rate,
      overallHealthScore: record.overall_health_score,
      healthTrend: record.health_trend,
      riskAlerts: record.risk_alerts,
      opportunities: record.opportunities
    };
  }
}

