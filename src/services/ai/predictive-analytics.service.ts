/**
 * Predictive Analytics Engine
 * Advanced machine learning models for legal practice optimization
 */

// import { toast } from 'react-hot-toast';
import type { Matter, Invoice, TimeEntry } from '../../types';

export interface SettlementPrediction {
  matterId: string;
  probability: number;
  confidence: number;
  timelineEstimate: {
    optimistic: number; // days
    realistic: number; // days
    pessimistic: number; // days
  };
  factorsInfluencing: Array<{
    factor: string;
    impact: 'positive' | 'negative' | 'neutral';
    weight: number;
    description: string;
  }>;
  recommendedActions: Array<{
    action: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    expectedImpact: number; // probability change
    timeframe: string;
  }>;
  historicalComparisons: Array<{
    similarCase: string;
    outcome: 'settled' | 'trial' | 'dismissed';
    timeline: number;
    similarity: number;
  }>;
}

export interface CaseOutcomePrediction {
  matterId: string;
  outcomeType: 'settlement' | 'trial_win' | 'trial_loss' | 'dismissal' | 'other';
  probability: number;
  confidence: number;
  keyRiskFactors: Array<{
    factor: string;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    mitigation: string[];
  }>;
  financialProjection: {
    costs: {
      estimated: number;
      range: { min: number; max: number };
      breakdown: Record<string, number>;
    };
    recovery: {
      estimated: number;
      range: { min: number; max: number };
      probability: number;
    };
  };
}

export interface FeeOptimizationRecommendation {
  matterId: string;
  currentModel: string;
  recommendedModel: string;
  projectedIncrease: number; // percentage
  confidence: number;
  rationale: string[];
  implementationSteps: Array<{
    step: string;
    timeline: string;
    effort: 'low' | 'medium' | 'high';
  }>;
  riskAssessment: {
    clientAcceptance: number;
    marketCompetitiveness: number;
    reputationRisk: number;
  };
}

export interface PracticeGrowthInsights {
  advocateId: string;
  growthPotential: {
    nextQuarter: number;
    nextYear: number;
    factors: string[];
  };
  marketOpportunities: Array<{
    practiceArea: string;
    demandTrend: 'increasing' | 'stable' | 'decreasing';
    competitionLevel: 'low' | 'medium' | 'high';
    potentialRevenue: number;
    timeToCapture: number; // months
  }>;
  referralOptimization: {
    underutilizedNetworks: string[];
    potentialReferrers: Array<{
      name: string;
      practiceArea: string;
      referralPotential: number;
      contactStrategy: string;
    }>;
    reciprocityGaps: Array<{
      advocate: string;
      sent: number;
      received: number;
      imbalance: number;
    }>;
  };
}

export interface CashFlowForecast {
  periodStart: string;
  periodEnd: string;
  projectedInflow: number;
  projectedOutflow: number;
  netCashFlow: number;
  confidence: number;
  scenarios: {
    optimistic: { inflow: number; outflow: number; net: number };
    realistic: { inflow: number; outflow: number; net: number };
    pessimistic: { inflow: number; outflow: number; net: number };
  };
  keyDrivers: Array<{
    factor: string;
    impact: number;
    description: string;
  }>;
  recommendations: string[];
}

export interface RiskAssessment {
  matterId: string;
  overallRisk: 'low' | 'medium' | 'high' | 'critical';
  riskScore: number; // 0-100
  categories: {
    financial: { score: number; factors: string[] };
    legal: { score: number; factors: string[] };
    client: { score: number; factors: string[] };
    timeline: { score: number; factors: string[] };
    reputation: { score: number; factors: string[] };
  };
  mitigationStrategies: Array<{
    strategy: string;
    effectiveness: number;
    cost: 'low' | 'medium' | 'high';
    implementation: string;
  }>;
}

export class PredictiveAnalyticsService {
  private static readonly ML_MODELS = {
    SETTLEMENT_PREDICTOR: 'settlement_v2.1',
    OUTCOME_PREDICTOR: 'outcome_v1.8',
    FEE_OPTIMIZER: 'fee_optimization_v1.5',
    CASH_FLOW_FORECASTER: 'cashflow_v2.0',
    RISK_ASSESSOR: 'risk_assessment_v1.3'
  };

  /**
   * Predict settlement probability and timeline
   */
  static async predictSettlement(matter: Matter, historicalData?: Matter[]): Promise<SettlementPrediction> {
    try {
      // Simulate ML model prediction
      const features = this.extractSettlementFeatures(matter);
      const baseProbability = this.calculateBaseProbability(features);
      
      // Apply historical adjustments
      const adjustedProbability = this.adjustWithHistoricalData(baseProbability, matter, historicalData);
      
      // Calculate timeline estimates
      const timelineEstimate = this.calculateTimelineEstimate(matter, adjustedProbability);
      
      // Identify influencing factors
      const factorsInfluencing = this.identifyInfluencingFactors(matter, features);
      
      // Generate recommendations
      const recommendedActions = this.generateSettlementRecommendations(matter, adjustedProbability);
      
      // Find historical comparisons
      const historicalComparisons = this.findSimilarCases(matter, historicalData);

      return {
        matterId: matter.id,
        probability: adjustedProbability,
        confidence: 0.85,
        timelineEstimate,
        factorsInfluencing,
        recommendedActions,
        historicalComparisons
      };
    } catch (error) {
      console.error('Error predicting settlement:', error);
      throw new Error('Failed to predict settlement probability');
    }
  }

  /**
   * Predict case outcome with detailed analysis
   */
  static async predictCaseOutcome(matter: Matter, timeEntries: TimeEntry[]): Promise<CaseOutcomePrediction> {
    try {
      const features = this.extractOutcomeFeatures(matter, timeEntries);
      
      // Calculate outcome probabilities using mock ML model
      const outcomes = this.calculateOutcomeProbabilities(features);
      const primaryOutcome = Object.entries(outcomes).reduce((a, b) => outcomes[a[0]] > outcomes[b[0]] ? a : b);
      
      // Assess risk factors
      const keyRiskFactors = this.assessRiskFactors(matter, features);
      
      // Project financial outcomes
      const financialProjection = this.projectFinancialOutcome(matter, timeEntries, primaryOutcome[0]);

      return {
        matterId: matter.id,
        outcomeType: primaryOutcome[0] as any,
        probability: primaryOutcome[1],
        confidence: 0.78,
        keyRiskFactors,
        financialProjection
      };
    } catch (error) {
      console.error('Error predicting case outcome:', error);
      throw new Error('Failed to predict case outcome');
    }
  }

  /**
   * Generate fee optimization recommendations
   */
  static async optimizeFeeStructure(matter: Matter, marketData?: any): Promise<FeeOptimizationRecommendation> {
    try {
      const currentModel = this.identifyCurrentFeeModel(matter);
      const optimization = this.calculateOptimalFeeStructure(matter, marketData);
      
      return {
        matterId: matter.id,
        currentModel,
        recommendedModel: optimization.model,
        projectedIncrease: optimization.increase,
        confidence: 0.82,
        rationale: optimization.rationale,
        implementationSteps: optimization.steps,
        riskAssessment: optimization.risks
      };
    } catch (error) {
      console.error('Error optimizing fee structure:', error);
      throw new Error('Failed to optimize fee structure');
    }
  }

  /**
   * Analyze practice growth potential
   */
  static async analyzePracticeGrowth(advocateId: string, practiceData: any): Promise<PracticeGrowthInsights> {
    try {
      // Analyze current practice performance
      const growthPotential = this.calculateGrowthPotential(practiceData);
      
      // Identify market opportunities
      const marketOpportunities = this.identifyMarketOpportunities(practiceData);
      
      // Optimize referral networks
      const referralOptimization = this.analyzeReferralOptimization(practiceData);

      return {
        advocateId,
        growthPotential,
        marketOpportunities,
        referralOptimization
      };
    } catch (error) {
      console.error('Error analyzing practice growth:', error);
      throw new Error('Failed to analyze practice growth');
    }
  }

  /**
   * Forecast cash flow with multiple scenarios
   */
  static async forecastCashFlow(
    startDate: string, 
    endDate: string, 
    matters: Matter[], 
    invoices: Invoice[]
  ): Promise<CashFlowForecast> {
    try {
      const baseProjection = this.calculateBaseCashFlow(matters, invoices, startDate, endDate);
      const scenarios = this.generateCashFlowScenarios(baseProjection);
      const keyDrivers = this.identifyCashFlowDrivers(matters, invoices);
      const recommendations = this.generateCashFlowRecommendations(baseProjection, scenarios);

      return {
        periodStart: startDate,
        periodEnd: endDate,
        projectedInflow: baseProjection.inflow,
        projectedOutflow: baseProjection.outflow,
        netCashFlow: baseProjection.net,
        confidence: 0.75,
        scenarios,
        keyDrivers,
        recommendations
      };
    } catch (error) {
      console.error('Error forecasting cash flow:', error);
      throw new Error('Failed to forecast cash flow');
    }
  }

  /**
   * Assess comprehensive risk for a matter
   */
  static async assessRisk(matter: Matter, relatedData: any): Promise<RiskAssessment> {
    try {
      const categories = {
        financial: this.assessFinancialRisk(matter, relatedData),
        legal: this.assessLegalRisk(matter, relatedData),
        client: this.assessClientRisk(matter, relatedData),
        timeline: this.assessTimelineRisk(matter, relatedData),
        reputation: this.assessReputationRisk(matter, relatedData)
      };

      const overallScore = Object.values(categories).reduce((sum, cat) => sum + cat.score, 0) / 5;
      const overallRisk = this.categorizeRisk(overallScore);
      const mitigationStrategies = this.generateMitigationStrategies(categories);

      return {
        matterId: matter.id,
        overallRisk,
        riskScore: overallScore,
        categories,
        mitigationStrategies
      };
    } catch (error) {
      console.error('Error assessing risk:', error);
      throw new Error('Failed to assess matter risk');
    }
  }

  // Private helper methods

  private static extractSettlementFeatures(matter: Matter) {
    return {
      matterType: matter.briefType,
      wipValue: matter.wipValue,
      estimatedFee: matter.estimatedFee,
      riskLevel: matter.riskLevel,
      durationDays: this.calculateDuration(matter.dateCreated),
      hasSettlementHistory: matter.settlementProbability > 0
    };
  }

  private static calculateBaseProbability(features: any): number {
    // Mock ML calculation
    let probability = 0.5; // Base 50%
    
    if (features.matterType?.includes('Commercial')) probability += 0.2;
    if (features.riskLevel === 'Low') probability += 0.15;
    if (features.wipValue < 100000) probability += 0.1;
    if (features.durationDays > 180) probability -= 0.1;
    
    return Math.max(0.1, Math.min(0.95, probability));
  }

  private static adjustWithHistoricalData(baseProbability: number, matter: Matter, historicalData?: Matter[]): number {
    if (!historicalData || historicalData.length === 0) return baseProbability;
    
    // Find similar matters and adjust probability
    const similarMatters = historicalData.filter(m => 
      m.briefType === matter.briefType && 
      Math.abs(m.wipValue - matter.wipValue) < matter.wipValue * 0.5
    );
    
    if (similarMatters.length > 0) {
      const avgSettlementRate = similarMatters.reduce((sum, m) => sum + (m.settlementProbability || 0), 0) / similarMatters.length;
      return (baseProbability + avgSettlementRate) / 2;
    }
    
    return baseProbability;
  }

  private static calculateTimelineEstimate(matter: Matter, probability: number) {
    const baseTimeline = matter.briefType?.includes('Commercial') ? 180 : 120;
    
    return {
      optimistic: Math.round(baseTimeline * (1 - probability * 0.3)),
      realistic: Math.round(baseTimeline * (1 + (1 - probability) * 0.2)),
      pessimistic: Math.round(baseTimeline * (1 + (1 - probability) * 0.5))
    };
  }

  private static identifyInfluencingFactors(matter: Matter, features: any) {
    const factors = [];
    
    if (features.riskLevel === 'Low') {
      factors.push({
        factor: 'Low Risk Assessment',
        impact: 'positive' as const,
        weight: 0.8,
        description: 'Matter assessed as low risk increases settlement likelihood'
      });
    }
    
    if (features.wipValue > 500000) {
      factors.push({
        factor: 'High Financial Stakes',
        impact: 'negative' as const,
        weight: 0.6,
        description: 'High-value matters tend to have longer resolution times'
      });
    }
    
    return factors;
  }

  private static generateSettlementRecommendations(matter: Matter, probability: number) {
    const recommendations = [];
    
    if (probability > 0.7) {
      recommendations.push({
        action: 'Initiate settlement discussions',
        priority: 'high' as const,
        expectedImpact: 0.1,
        timeframe: '2-4 weeks'
      });
    }
    
    if (probability < 0.3) {
      recommendations.push({
        action: 'Prepare for trial proceedings',
        priority: 'medium' as const,
        expectedImpact: -0.05,
        timeframe: '1-3 months'
      });
    }
    
    return recommendations;
  }

  private static findSimilarCases(matter: Matter, historicalData?: Matter[]) {
    if (!historicalData) return [];
    
    return historicalData
      .filter(m => m.briefType === matter.briefType)
      .slice(0, 3)
      .map(m => ({
        similarCase: m.title,
        outcome: 'settled' as const,
        timeline: this.calculateDuration(m.dateCreated),
        similarity: 0.8
      }));
  }

  private static calculateDuration(dateCreated: string): number {
    return Math.floor((Date.now() - new Date(dateCreated).getTime()) / (1000 * 60 * 60 * 24));
  }

  private static extractOutcomeFeatures(matter: Matter, timeEntries: TimeEntry[]) {
    return {
      complexity: timeEntries.length > 50 ? 'high' : timeEntries.length > 20 ? 'medium' : 'low',
      totalHours: timeEntries.reduce((sum, te) => sum + te.duration, 0) / 60,
      matterAge: this.calculateDuration(matter.dateCreated),
      wipRatio: matter.wipValue / matter.estimatedFee
    };
  }

  private static calculateOutcomeProbabilities(features: any) {
    // Mock ML model results
    return {
      settlement: 0.45,
      trial_win: 0.25,
      trial_loss: 0.15,
      dismissal: 0.10,
      other: 0.05
    };
  }

  private static assessRiskFactors(matter: Matter, features: any) {
    const factors = [];
    
    if (features.totalHours > 100) {
      factors.push({
        factor: 'High Time Investment',
        riskLevel: 'medium' as const,
        description: 'Significant time already invested in matter',
        mitigation: ['Monitor time allocation closely', 'Regular client communication']
      });
    }
    
    return factors;
  }

  private static projectFinancialOutcome(matter: Matter, timeEntries: TimeEntry[], outcome: string) {
    const totalTime = timeEntries.reduce((sum, te) => sum + te.duration, 0);
    const estimatedCosts = totalTime * 0.1; // Mock calculation
    
    return {
      costs: {
        estimated: estimatedCosts,
        range: { min: estimatedCosts * 0.8, max: estimatedCosts * 1.3 },
        breakdown: { 'Time costs': estimatedCosts * 0.8, 'Disbursements': estimatedCosts * 0.2 }
      },
      recovery: {
        estimated: outcome === 'trial_win' ? matter.estimatedFee : matter.estimatedFee * 0.6,
        range: { min: matter.estimatedFee * 0.4, max: matter.estimatedFee * 1.2 },
        probability: outcome === 'settlement' ? 0.9 : outcome === 'trial_win' ? 0.7 : 0.3
      }
    };
  }

  private static identifyCurrentFeeModel(matter: Matter): string {
    // Determine current fee model based on matter data
    return matter.estimatedFee > 0 ? 'Fixed Fee' : 'Hourly Rate';
  }

  private static calculateOptimalFeeStructure(matter: Matter, marketData: any) {
    // Mock optimization calculation
    return {
      model: 'Performance-Based',
      increase: 15.5,
      rationale: [
        'Market analysis shows 18% premium for performance-based fees',
        'Matter complexity justifies risk-adjusted pricing',
        'Client profile indicates willingness to pay for outcomes'
      ],
      steps: [
        { step: 'Analyze current fee structure', timeline: '1 week', effort: 'low' as const },
        { step: 'Prepare client proposal', timeline: '2 weeks', effort: 'medium' as const },
        { step: 'Implement new structure', timeline: '1 week', effort: 'low' as const }
      ],
      risks: {
        clientAcceptance: 0.8,
        marketCompetitiveness: 0.9,
        reputationRisk: 0.1
      }
    };
  }

  private static calculateGrowthPotential(practiceData: unknown) {
    return {
      nextQuarter: 12.5,
      nextYear: 35.2,
      factors: ['Increased market demand', 'Referral network expansion', 'Specialization recognition']
    };
  }

  private static identifyMarketOpportunities(practiceData: unknown) {
    return [
      {
        practiceArea: 'ESG Compliance',
        demandTrend: 'increasing' as const,
        competitionLevel: 'low' as const,
        potentialRevenue: 250000,
        timeToCapture: 6
      }
    ];
  }

  private static analyzeReferralOptimization(practiceData: any) {
    return {
      underutilizedNetworks: ['Mining Law Chamber', 'Commercial Bar Association'],
      potentialReferrers: [
        {
          name: 'Adv. Sarah Johnson',
          practiceArea: 'Commercial Law',
          referralPotential: 0.8,
          contactStrategy: 'Direct professional outreach'
        }
      ],
      reciprocityGaps: [
        {
          advocate: 'Adv. John Smith',
          sent: 5,
          received: 12,
          imbalance: 0.7
        }
      ]
    };
  }

  private static calculateBaseCashFlow(matters: Matter[], invoices: Invoice[], startDate: string, endDate: string) {
    // Mock cash flow calculation
    const totalWIP = matters.reduce((sum, m) => sum + m.wipValue, 0);
    const outstandingInvoices = invoices.filter(i => i.status !== 'PAID').reduce((sum, i) => sum + i.amount, 0);
    
    return {
      inflow: outstandingInvoices * 0.7 + totalWIP * 0.3,
      outflow: totalWIP * 0.2,
      net: outstandingInvoices * 0.7 + totalWIP * 0.1
    };
  }

  private static generateCashFlowScenarios(baseProjection: any) {
    return {
      optimistic: {
        inflow: baseProjection.inflow * 1.3,
        outflow: baseProjection.outflow * 0.9,
        net: baseProjection.net * 1.5
      },
      realistic: baseProjection,
      pessimistic: {
        inflow: baseProjection.inflow * 0.7,
        outflow: baseProjection.outflow * 1.2,
        net: baseProjection.net * 0.4
      }
    };
  }

  private static identifyCashFlowDrivers(matters: Matter[], invoices: Invoice[]) {
    return [
      {
        factor: 'Outstanding invoice collection',
        impact: 0.6,
        description: 'R750k in overdue invoices significantly impacts cash flow'
      },
      {
        factor: 'New matter acquisition',
        impact: 0.3,
        description: 'Pipeline of new matters provides growth opportunity'
      }
    ];
  }

  private static generateCashFlowRecommendations(baseProjection: unknown, scenarios: unknown) {
    return [
      'Prioritize collection of overdue invoices to improve short-term cash flow',
      'Consider invoice factoring for large outstanding amounts',
      'Implement more aggressive billing schedule for active matters'
    ];
  }

  private static assessFinancialRisk(matter: Matter, relatedData: any) {
    const score = matter.wipValue > 1000000 ? 75 : matter.wipValue > 500000 ? 50 : 25;
    return {
      score,
      factors: score > 60 ? ['High financial exposure', 'Client payment history'] : ['Standard financial risk']
    };
  }

  private static assessLegalRisk(matter: Matter, relatedData: any) {
    const complexityScore = matter.briefType?.includes('Constitutional') ? 80 : 
                           matter.briefType?.includes('Commercial') ? 60 : 40;
    return {
      score: complexityScore,
      factors: complexityScore > 70 ? ['Complex legal issues', 'Precedent uncertainty'] : ['Standard legal complexity']
    };
  }

  private static assessClientRisk(matter: Matter, relatedData: any) {
    return {
      score: 30, // Mock score
      factors: ['Established client relationship', 'Good payment history']
    };
  }

  private static assessTimelineRisk(matter: Matter, relatedData: any) {
    const age = this.calculateDuration(matter.dateCreated);
    const score = age > 365 ? 70 : age > 180 ? 50 : 30;
    return {
      score,
      factors: score > 60 ? ['Extended timeline', 'Multiple delays'] : ['On schedule']
    };
  }

  private static assessReputationRisk(matter: Matter, relatedData: any) {
    return {
      score: 20, // Mock score
      factors: ['Standard matter profile', 'No public interest concerns']
    };
  }

  private static categorizeRisk(score: number): 'low' | 'medium' | 'high' | 'critical' {
    if (score >= 80) return 'critical';
    if (score >= 60) return 'high';
    if (score >= 40) return 'medium';
    return 'low';
  }

  private static generateMitigationStrategies(categories: any) {
    const strategies = [];
    
    Object.entries(categories).forEach(([category, data]: [string, any]) => {
      if (data.score > 60) {
        strategies.push({
          strategy: `Implement ${category} risk monitoring`,
          effectiveness: 0.8,
          cost: 'medium' as const,
          implementation: `Set up automated ${category} alerts and regular review processes`
        });
      }
    });
    
    return strategies;
  }
}
