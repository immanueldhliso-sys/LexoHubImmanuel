/**
 * Advanced Cash Flow Management Service
 * AI-powered cash flow analysis, forecasting, and optimization
 */

import type { Invoice, Matter, TimeEntry, Payment } from '../types';

export interface CashFlowForecast {
  period: 'weekly' | 'monthly' | 'quarterly';
  projections: CashFlowProjection[];
  confidence: number;
  scenarios: CashFlowScenario[];
  recommendations: string[];
}

export interface CashFlowProjection {
  date: string;
  expectedInflow: number;
  expectedOutflow: number;
  netCashFlow: number;
  cumulativeBalance: number;
  confidence: number;
}

export interface CashFlowScenario {
  name: string;
  description: string;
  probability: number;
  impact: number;
  projections: CashFlowProjection[];
}

export interface SeasonalPattern {
  month: number;
  historicalMultiplier: number;
  confidence: number;
  factors: string[];
}

export interface CashFlowAlert {
  id: string;
  type: 'shortage' | 'opportunity' | 'seasonal' | 'collection';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  recommendation: string;
  dueDate: Date;
  estimatedImpact: number;
}

export interface CollectionAnalysis {
  averageCollectionDays: number;
  collectionRate: number;
  overdueAmount: number;
  riskFactors: string[];
  recommendations: string[];
  projectedCollections: { date: string; amount: number; probability: number }[];
}

export class CashFlowManagementService {
  private seasonalPatterns: SeasonalPattern[] = [];
  private historicalData: Map<string, number[]> = new Map();

  constructor() {
    this.initializeSeasonalPatterns();
  }

  /**
   * Generate comprehensive cash flow forecast
   */
  async generateForecast(
    invoices: Invoice[],
    matters: Matter[],
    timeEntries: TimeEntry[],
    payments: Payment[],
    period: 'weekly' | 'monthly' | 'quarterly' = 'monthly'
  ): Promise<CashFlowForecast> {
    try {
      // Analyze historical patterns
      const historicalAnalysis = this.analyzeHistoricalPatterns(payments, invoices);
      
      // Generate base projections
      const baseProjections = await this.generateBaseProjections(
        invoices,
        matters,
        timeEntries,
        period
      );

      // Apply seasonal adjustments
      const seasonallyAdjusted = this.applySeasonalAdjustments(baseProjections);

      // Generate scenarios
      const scenarios = this.generateScenarios(seasonallyAdjusted, historicalAnalysis);

      // Calculate overall confidence
      const confidence = this.calculateForecastConfidence(
        historicalAnalysis,
        seasonallyAdjusted,
        invoices
      );

      // Generate recommendations
      const recommendations = this.generateRecommendations(
        seasonallyAdjusted,
        scenarios,
        historicalAnalysis
      );

      return {
        period,
        projections: seasonallyAdjusted,
        confidence,
        scenarios,
        recommendations
      };

    } catch (error) {
      console.error('Cash flow forecast generation failed:', error);
      throw new Error('Failed to generate cash flow forecast');
    }
  }

  /**
   * Analyze collection patterns and generate insights
   */
  analyzeCollectionPatterns(invoices: Invoice[], payments: Payment[]): CollectionAnalysis {
    const paidInvoices = invoices.filter(inv => inv.status === 'Paid');
    const overdueInvoices = invoices.filter(inv => inv.status === 'Overdue');
    
    // Calculate average collection days
    const collectionDays = paidInvoices.map(invoice => {
      const payment = payments.find(p => p.invoiceId === invoice.id);
      if (payment) {
        const issueDate = new Date(invoice.dateIssued);
        const paymentDate = new Date(payment.paymentDate);
        return Math.floor((paymentDate.getTime() - issueDate.getTime()) / (1000 * 60 * 60 * 24));
      }
      return 0;
    }).filter(days => days > 0);

    const averageCollectionDays = collectionDays.length > 0 
      ? collectionDays.reduce((sum, days) => sum + days, 0) / collectionDays.length 
      : 45;

    // Calculate collection rate
    const totalInvoiced = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
    const totalCollected = paidInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
    const collectionRate = totalInvoiced > 0 ? (totalCollected / totalInvoiced) * 100 : 0;

    // Calculate overdue amount
    const overdueAmount = overdueInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);

    // Identify risk factors
    const riskFactors = this.identifyCollectionRiskFactors(invoices, averageCollectionDays);

    // Generate collection projections
    const projectedCollections = this.projectFutureCollections(
      invoices.filter(inv => inv.status === 'Unpaid' || inv.status === 'Sent'),
      averageCollectionDays
    );

    // Generate recommendations
    const recommendations = this.generateCollectionRecommendations(
      averageCollectionDays,
      collectionRate,
      overdueAmount,
      riskFactors
    );

    return {
      averageCollectionDays: Math.round(averageCollectionDays),
      collectionRate: Math.round(collectionRate * 100) / 100,
      overdueAmount,
      riskFactors,
      recommendations,
      projectedCollections
    };
  }

  /**
   * Generate cash flow alerts
   */
  generateCashFlowAlerts(
    forecast: CashFlowForecast,
    currentBalance: number,
    minimumBalance: number = 50000
  ): CashFlowAlert[] {
    const alerts: CashFlowAlert[] = [];

    // Check for potential shortages
    forecast.projections.forEach((projection, index) => {
      if (projection.cumulativeBalance < minimumBalance) {
        alerts.push({
          id: `shortage_${index}`,
          type: 'shortage',
          severity: projection.cumulativeBalance < 0 ? 'critical' : 'high',
          title: 'Cash Flow Shortage Alert',
          description: `Projected balance of R${projection.cumulativeBalance.toLocaleString()} falls below minimum threshold`,
          recommendation: 'Consider accelerating collections or arranging short-term financing',
          dueDate: new Date(projection.date),
          estimatedImpact: minimumBalance - projection.cumulativeBalance
        });
      }
    });

    // Check for seasonal patterns
    const currentMonth = new Date().getMonth();
    const seasonalPattern = this.seasonalPatterns.find(p => p.month === currentMonth);
    
    if (seasonalPattern && seasonalPattern.historicalMultiplier < 0.8) {
      alerts.push({
        id: `seasonal_${currentMonth}`,
        type: 'seasonal',
        severity: 'medium',
        title: 'Seasonal Cash Flow Impact',
        description: `Historical data shows ${Math.round((1 - seasonalPattern.historicalMultiplier) * 100)}% reduction in cash flow during this period`,
        recommendation: 'Prepare for seasonal slowdown by building cash reserves',
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        estimatedImpact: currentBalance * (1 - seasonalPattern.historicalMultiplier)
      });
    }

    // Check for collection opportunities
    const highConfidenceProjections = forecast.projections.filter(p => p.confidence > 0.8);
    if (highConfidenceProjections.length > 0) {
      const totalOpportunity = highConfidenceProjections.reduce((sum, p) => sum + p.expectedInflow, 0);
      
      alerts.push({
        id: 'collection_opportunity',
        type: 'opportunity',
        severity: 'low',
        title: 'Collection Opportunity',
        description: `High-confidence collections of R${totalOpportunity.toLocaleString()} expected`,
        recommendation: 'Focus collection efforts on high-probability invoices',
        dueDate: new Date(highConfidenceProjections[0].date),
        estimatedImpact: totalOpportunity
      });
    }

    return alerts.sort((a, b) => {
      const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    });
  }

  /**
   * Optimize cash flow through strategic recommendations
   */
  optimizeCashFlow(
    forecast: CashFlowForecast,
    invoices: Invoice[],
    matters: Matter[]
  ): {
    strategies: CashFlowStrategy[];
    projectedImprovement: number;
    implementationPriority: string[];
  } {
    const strategies: CashFlowStrategy[] = [];

    // Strategy 1: Accelerate collections
    const overdueInvoices = invoices.filter(inv => inv.status === 'Overdue');
    if (overdueInvoices.length > 0) {
      const overdueAmount = overdueInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
      strategies.push({
        id: 'accelerate_collections',
        title: 'Accelerate Collections',
        description: 'Focus on collecting overdue invoices',
        estimatedImpact: overdueAmount * 0.7, // Assume 70% collection rate
        timeframe: '30 days',
        effort: 'medium',
        actions: [
          'Send formal demand letters',
          'Implement payment plans',
          'Consider collection agency for oldest debts'
        ]
      });
    }

    // Strategy 2: Optimize billing frequency
    const unbilledWIP = matters.reduce((sum, matter) => sum + (matter.wipValue || 0), 0);
    if (unbilledWIP > 100000) {
      strategies.push({
        id: 'optimize_billing',
        title: 'Optimize Billing Frequency',
        description: 'Convert work-in-progress to invoices more frequently',
        estimatedImpact: unbilledWIP * 0.8,
        timeframe: '14 days',
        effort: 'low',
        actions: [
          'Implement weekly WIP reviews',
          'Set automatic billing triggers',
          'Reduce billing cycle from monthly to bi-weekly'
        ]
      });
    }

    // Strategy 3: Seasonal preparation
    const nextThreeMonths = forecast.projections.slice(0, 3);
    const hasSeasonalDip = nextThreeMonths.some(p => p.netCashFlow < -50000);
    
    if (hasSeasonalDip) {
      strategies.push({
        id: 'seasonal_preparation',
        title: 'Seasonal Cash Flow Preparation',
        description: 'Prepare for seasonal cash flow variations',
        estimatedImpact: 200000, // Credit line or cash reserve
        timeframe: '60 days',
        effort: 'high',
        actions: [
          'Establish revolving credit facility',
          'Build cash reserves during peak periods',
          'Negotiate extended payment terms with suppliers'
        ]
      });
    }

    // Calculate projected improvement
    const totalImpact = strategies.reduce((sum, strategy) => sum + strategy.estimatedImpact, 0);
    
    // Prioritize strategies by impact/effort ratio
    const prioritized = strategies
      .map(strategy => ({
        ...strategy,
        priority: strategy.estimatedImpact / (strategy.effort === 'low' ? 1 : strategy.effort === 'medium' ? 2 : 3)
      }))
      .sort((a, b) => b.priority - a.priority)
      .map(strategy => strategy.id);

    return {
      strategies,
      projectedImprovement: totalImpact,
      implementationPriority: prioritized
    };
  }

  /**
   * Initialize seasonal patterns based on South African legal market
   */
  private initializeSeasonalPatterns(): void {
    this.seasonalPatterns = [
      { month: 0, historicalMultiplier: 0.7, confidence: 0.8, factors: ['January holiday period', 'Slow court activity'] },
      { month: 1, historicalMultiplier: 0.9, confidence: 0.85, factors: ['Return from holidays', 'New matter intake'] },
      { month: 2, historicalMultiplier: 1.1, confidence: 0.9, factors: ['Full court schedule', 'Active litigation'] },
      { month: 3, historicalMultiplier: 1.0, confidence: 0.9, factors: ['Normal activity'] },
      { month: 4, historicalMultiplier: 0.8, confidence: 0.75, factors: ['Easter holidays', 'School holidays'] },
      { month: 5, historicalMultiplier: 1.0, confidence: 0.9, factors: ['Normal activity'] },
      { month: 6, historicalMultiplier: 0.9, confidence: 0.8, factors: ['Mid-year slowdown', 'Winter recess'] },
      { month: 7, historicalMultiplier: 0.8, confidence: 0.8, factors: ['School holidays', 'Winter recess'] },
      { month: 8, historicalMultiplier: 1.1, confidence: 0.9, factors: ['Return from recess', 'Active period'] },
      { month: 9, historicalMultiplier: 1.2, confidence: 0.9, factors: ['Peak activity', 'Year-end push'] },
      { month: 10, historicalMultiplier: 1.1, confidence: 0.85, factors: ['Continued activity'] },
      { month: 11, historicalMultiplier: 0.6, confidence: 0.9, factors: ['December holidays', 'Court closure', 'Year-end'] }
    ];
  }

  /**
   * Analyze historical cash flow patterns
   */
  private analyzeHistoricalPatterns(payments: Payment[], invoices: Invoice[]): any {
    // Group payments by month
    const monthlyPayments = new Map<string, number>();
    
    payments.forEach(payment => {
      const month = payment.paymentDate.substring(0, 7); // YYYY-MM
      monthlyPayments.set(month, (monthlyPayments.get(month) || 0) + payment.amount);
    });

    // Calculate trends and patterns
    const months = Array.from(monthlyPayments.keys()).sort();
    const amounts = months.map(month => monthlyPayments.get(month) || 0);

    return {
      monthlyAverages: monthlyPayments,
      trend: this.calculateTrend(amounts),
      volatility: this.calculateVolatility(amounts),
      seasonality: this.detectSeasonality(amounts)
    };
  }

  /**
   * Generate base cash flow projections
   */
  private async generateBaseProjections(
    invoices: Invoice[],
    matters: Matter[],
    timeEntries: TimeEntry[],
    period: 'weekly' | 'monthly' | 'quarterly'
  ): Promise<CashFlowProjection[]> {
    const projections: CashFlowProjection[] = [];
    const periodsToProject = period === 'weekly' ? 12 : period === 'monthly' ? 12 : 4;
    
    for (let i = 0; i < periodsToProject; i++) {
      const projectionDate = this.getProjectionDate(i, period);
      
      // Calculate expected inflows (collections)
      const expectedInflow = this.calculateExpectedInflow(invoices, projectionDate);
      
      // Calculate expected outflows (expenses)
      const expectedOutflow = this.calculateExpectedOutflow(projectionDate);
      
      // Calculate net cash flow
      const netCashFlow = expectedInflow - expectedOutflow;
      
      // Calculate cumulative balance (assuming starting balance of 0 for simplicity)
      const previousBalance = i > 0 ? projections[i - 1].cumulativeBalance : 0;
      const cumulativeBalance = previousBalance + netCashFlow;
      
      projections.push({
        date: projectionDate.toISOString().split('T')[0],
        expectedInflow,
        expectedOutflow,
        netCashFlow,
        cumulativeBalance,
        confidence: 0.8 - (i * 0.05) // Confidence decreases over time
      });
    }
    
    return projections;
  }

  /**
   * Apply seasonal adjustments to projections
   */
  private applySeasonalAdjustments(projections: CashFlowProjection[]): CashFlowProjection[] {
    return projections.map(projection => {
      const date = new Date(projection.date);
      const month = date.getMonth();
      const seasonalPattern = this.seasonalPatterns.find(p => p.month === month);
      
      if (seasonalPattern) {
        const adjustedInflow = projection.expectedInflow * seasonalPattern.historicalMultiplier;
        const adjustedNetFlow = adjustedInflow - projection.expectedOutflow;
        
        return {
          ...projection,
          expectedInflow: adjustedInflow,
          netCashFlow: adjustedNetFlow,
          cumulativeBalance: projection.cumulativeBalance + (adjustedNetFlow - projection.netCashFlow),
          confidence: projection.confidence * seasonalPattern.confidence
        };
      }
      
      return projection;
    });
  }

  // Additional helper methods would be implemented here...
  private calculateTrend(amounts: number[]): number {
    // Simple linear trend calculation
    if (amounts.length < 2) return 0;
    
    const n = amounts.length;
    const sumX = (n * (n - 1)) / 2;
    const sumY = amounts.reduce((sum, amount) => sum + amount, 0);
    const sumXY = amounts.reduce((sum, amount, index) => sum + (index * amount), 0);
    const sumX2 = amounts.reduce((sum, _, index) => sum + (index * index), 0);
    
    return (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  }

  private calculateVolatility(amounts: number[]): number {
    if (amounts.length < 2) return 0;
    
    const mean = amounts.reduce((sum, amount) => sum + amount, 0) / amounts.length;
    const variance = amounts.reduce((sum, amount) => sum + Math.pow(amount - mean, 2), 0) / amounts.length;
    
    return Math.sqrt(variance);
  }

  private detectSeasonality(amounts: number[]): boolean {
    // Simple seasonality detection - would be more sophisticated in production
    return amounts.length >= 12;
  }

  private getProjectionDate(periodIndex: number, period: 'weekly' | 'monthly' | 'quarterly'): Date {
    const now = new Date();
    const date = new Date(now);
    
    switch (period) {
      case 'weekly':
        date.setDate(date.getDate() + (periodIndex * 7));
        break;
      case 'monthly':
        date.setMonth(date.getMonth() + periodIndex);
        break;
      case 'quarterly':
        date.setMonth(date.getMonth() + (periodIndex * 3));
        break;
    }
    
    return date;
  }

  private calculateExpectedInflow(invoices: Invoice[], projectionDate: Date): number {
    // Calculate expected collections based on invoice aging and historical patterns
    return invoices
      .filter(inv => inv.status === 'Sent' || inv.status === 'Unpaid')
      .reduce((sum, invoice) => {
        const dueDate = new Date(invoice.dateDue);
        const daysDiff = Math.floor((projectionDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
        
        // Apply collection probability based on aging
        let probability = 0.9; // 90% for current invoices
        if (daysDiff > 30) probability = 0.7;
        if (daysDiff > 60) probability = 0.5;
        if (daysDiff > 90) probability = 0.3;
        
        return sum + (invoice.totalAmount * probability);
      }, 0);
  }

  private calculateExpectedOutflow(projectionDate: Date): number {
    // Estimate monthly expenses - in production this would be more sophisticated
    const monthlyExpenses = 150000; // Base monthly expenses
    return monthlyExpenses;
  }

  private generateScenarios(projections: CashFlowProjection[], historicalAnalysis: any): CashFlowScenario[] {
    // Generate optimistic, pessimistic, and most likely scenarios
    return [
      {
        name: 'Most Likely',
        description: 'Based on historical patterns and current trends',
        probability: 0.6,
        impact: 0,
        projections: projections
      },
      {
        name: 'Optimistic',
        description: 'Faster collections and increased activity',
        probability: 0.2,
        impact: 0.2,
        projections: projections.map(p => ({
          ...p,
          expectedInflow: p.expectedInflow * 1.2,
          netCashFlow: p.netCashFlow * 1.2,
          cumulativeBalance: p.cumulativeBalance * 1.2
        }))
      },
      {
        name: 'Pessimistic',
        description: 'Slower collections and reduced activity',
        probability: 0.2,
        impact: -0.3,
        projections: projections.map(p => ({
          ...p,
          expectedInflow: p.expectedInflow * 0.7,
          netCashFlow: p.netCashFlow * 0.7,
          cumulativeBalance: p.cumulativeBalance * 0.7
        }))
      }
    ];
  }

  private calculateForecastConfidence(historicalAnalysis: any, projections: CashFlowProjection[], invoices: Invoice[]): number {
    let confidence = 0.8; // Base confidence
    
    // Adjust based on data quality
    if (invoices.length < 10) confidence -= 0.2;
    if (historicalAnalysis.volatility > 100000) confidence -= 0.1;
    
    return Math.max(0.3, Math.min(0.95, confidence));
  }

  private generateRecommendations(projections: CashFlowProjection[], scenarios: CashFlowScenario[], historicalAnalysis: any): string[] {
    const recommendations: string[] = [];
    
    // Check for negative cash flow periods
    const negativeFlowPeriods = projections.filter(p => p.netCashFlow < 0);
    if (negativeFlowPeriods.length > 0) {
      recommendations.push('Consider establishing a line of credit to cover negative cash flow periods');
    }
    
    // Check for high volatility
    if (historicalAnalysis.volatility > 50000) {
      recommendations.push('Implement more frequent billing cycles to reduce cash flow volatility');
    }
    
    // Check for seasonal patterns
    recommendations.push('Build cash reserves during peak periods to cover seasonal slowdowns');
    
    return recommendations;
  }

  private identifyCollectionRiskFactors(invoices: Invoice[], averageCollectionDays: number): string[] {
    const riskFactors: string[] = [];
    
    if (averageCollectionDays > 60) {
      riskFactors.push('Extended collection periods indicate payment difficulties');
    }
    
    const overdueRate = invoices.filter(inv => inv.status === 'Overdue').length / invoices.length;
    if (overdueRate > 0.2) {
      riskFactors.push('High overdue rate suggests collection process issues');
    }
    
    return riskFactors;
  }

  private projectFutureCollections(unpaidInvoices: Invoice[], averageCollectionDays: number): { date: string; amount: number; probability: number }[] {
    return unpaidInvoices.map(invoice => {
      const issueDate = new Date(invoice.dateIssued);
      const projectedDate = new Date(issueDate.getTime() + (averageCollectionDays * 24 * 60 * 60 * 1000));
      
      // Calculate probability based on invoice age
      const daysSinceIssue = Math.floor((Date.now() - issueDate.getTime()) / (1000 * 60 * 60 * 24));
      let probability = 0.9;
      if (daysSinceIssue > 30) probability = 0.7;
      if (daysSinceIssue > 60) probability = 0.5;
      if (daysSinceIssue > 90) probability = 0.3;
      
      return {
        date: projectedDate.toISOString().split('T')[0],
        amount: invoice.totalAmount,
        probability
      };
    });
  }

  private generateCollectionRecommendations(averageCollectionDays: number, collectionRate: number, overdueAmount: number, riskFactors: string[]): string[] {
    const recommendations: string[] = [];
    
    if (averageCollectionDays > 45) {
      recommendations.push('Implement more aggressive collection procedures');
      recommendations.push('Consider offering early payment discounts');
    }
    
    if (collectionRate < 90) {
      recommendations.push('Review client creditworthiness procedures');
      recommendations.push('Implement payment terms verification');
    }
    
    if (overdueAmount > 100000) {
      recommendations.push('Focus immediate attention on overdue accounts');
      recommendations.push('Consider engaging collection agency for oldest debts');
    }
    
    return recommendations;
  }
}

interface CashFlowStrategy {
  id: string;
  title: string;
  description: string;
  estimatedImpact: number;
  timeframe: string;
  effort: 'low' | 'medium' | 'high';
  actions: string[];
}

// Export singleton instance
export const cashFlowManagementService = new CashFlowManagementService();