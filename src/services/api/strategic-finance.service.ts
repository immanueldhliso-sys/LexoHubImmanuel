import { supabase } from '@/lib/supabase';
import { toast } from 'react-hot-toast';
import { z } from 'zod';
import { addMonths, startOfMonth, endOfMonth, format } from 'date-fns';

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
          // No active matters, return empty recommendations in production
          toast('No active matters found for fee optimization', { icon: 'ℹ️' });
          return [];
        }

        // Get recommendations for the first active matter
        matterId = matters[0].id;
      }

      return this.getFeeOptimizationRecommendations({ matterId });
    } catch (error) {
      console.error('Error generating fee optimization recommendations:', error);
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

  // Get fee optimization recommendations
  static async getFeeOptimizationRecommendations(data: z.infer<typeof FeeOptimizationRequestSchema>): Promise<FeeOptimizationRecommendation[]> {
    try {
      const validated = FeeOptimizationRequestSchema.parse(data);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Call function to calculate optimal fee structure
      const { data: recommendations, error } = await supabase
        .rpc('calculate_optimal_fee_structure', {
          p_matter_id: validated.matterId,
          p_advocate_id: user.id
        });

      if (error) throw error;

      // Transform and save recommendations
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
    } catch (error) {
      console.error('Error getting fee optimization recommendations:', error);
      toast.error('Failed to get fee optimization recommendations');
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
          base_fee: validated.baseFee,
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

